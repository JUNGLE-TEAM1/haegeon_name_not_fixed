const NOTION_VERSION = "2022-06-28";
const STATE_PATH = ".github/notion-issue-sync-state.json";
const TOLERANCE_MS = 3000;
const DEFAULT_LABEL_COLOR = "ededed";

module.exports = async function syncNotionIssues({ github, context, core }) {
  const notionToken = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  const { owner, repo } = context.repo;
  const now = new Date().toISOString();

  log(core, `Event: ${context.eventName}`);
  log(core, `Ref: ${context.ref}`);
  log(core, `SHA: ${context.sha}`);

  if (!notionToken) throw new Error("Missing NOTION_TOKEN");
  if (!databaseId) throw new Error("Missing NOTION_DATABASE_ID");

  async function notion(path, method = "GET", body) {
    const res = await fetch(`https://api.notion.com/v1${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status} ${text}`);
    return text ? JSON.parse(text) : {};
  }

  async function listGithubIssues() {
    const issues = await github.paginate(github.rest.issues.listForRepo, {
      owner,
      repo,
      state: "all",
      per_page: 100,
    });

    return issues.filter((issue) => !issue.pull_request);
  }

  async function getGithubIssue(number) {
    const result = await github.rest.issues.get({
      owner,
      repo,
      issue_number: number,
    });

    return result.data;
  }

  async function listNotionRows() {
    const rows = [];
    let cursor;

    do {
      const body = { page_size: 100 };
      if (cursor) body.start_cursor = cursor;

      const data = await notion(`/databases/${databaseId}/query`, "POST", body);
      rows.push(...data.results.filter((page) => !page.archived && !page.in_trash));
      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor);

    return rows;
  }

  async function createNotionPage(issue) {
    return notion("/pages", "POST", {
      parent: { database_id: databaseId },
      properties: issueToNotionProps(issue, "GitHub", owner, repo),
    });
  }

  async function updateNotionPageFromIssue(pageId, issue, source, syncError = "") {
    return notion(`/pages/${pageId}`, "PATCH", {
      properties: issueToNotionProps(issue, source, owner, repo, syncError),
    });
  }

  async function markNotionSyncError(pageId, message) {
    return notion(`/pages/${pageId}`, "PATCH", {
      properties: {
        "Last Synced At": dateProp(new Date().toISOString()),
        "Last Sync Source": selectProp("Sync Error"),
        "Sync Error": textProp(message),
      },
    });
  }

  async function archiveNotionPage(pageId) {
    return notion(`/pages/${pageId}`, "PATCH", {
      archived: true,
      properties: {
        "Last Synced At": dateProp(new Date().toISOString()),
        "Last Sync Source": selectProp("GitHub"),
        "Sync Error": textProp(""),
      },
    });
  }

  async function deleteGithubIssue(issueOrRecord) {
    const issueId = issueOrRecord.node_id || issueOrRecord.githubNodeId;
    if (!issueId) throw new Error("Missing GitHub issue node id for deletion");

    await github.graphql(
      `
        mutation DeleteSyncedIssue($issueId: ID!) {
          deleteIssue(input: { issueId: $issueId }) {
            clientMutationId
          }
        }
      `,
      { issueId },
    );
  }

  let repoLabelCache;

  async function getRepoLabelNames() {
    if (repoLabelCache) return repoLabelCache;

    const labels = await github.paginate(github.rest.issues.listLabelsForRepo, {
      owner,
      repo,
      per_page: 100,
    });

    repoLabelCache = new Set(labels.map((label) => label.name));
    return repoLabelCache;
  }

  async function ensureLabels(labelNames) {
    if (labelNames.length === 0) return;

    const existing = await getRepoLabelNames();
    for (const name of labelNames) {
      if (existing.has(name)) continue;

      try {
        await github.rest.issues.createLabel({
          owner,
          repo,
          name,
          color: DEFAULT_LABEL_COLOR,
        });
        existing.add(name);
      } catch (error) {
        if (error.status !== 422) throw error;
        existing.add(name);
      }
    }
  }

  async function applyNotionToGithub(issue, page) {
    const diff = diffIssueAndPage(issue, page);
    const issuePatch = {};

    if (diff.title) issuePatch.title = diff.notion.title;
    if (diff.state) issuePatch.state = diff.notion.state;
    if (diff.assignees) issuePatch.assignees = diff.notion.assignees;

    if (Object.keys(issuePatch).length > 0) {
      await github.rest.issues.update({
        owner,
        repo,
        issue_number: issue.number,
        ...issuePatch,
      });
    }

    if (diff.labels) {
      await ensureLabels(diff.notion.labels);
      await github.rest.issues.setLabels({
        owner,
        repo,
        issue_number: issue.number,
        labels: diff.notion.labels,
      });
    }

    return getGithubIssue(issue.number);
  }

  const stateFile = await readStateFile(github, owner, repo);
  const previousStateText = stateFile.text;
  const state = parseState(stateFile.text, owner, repo);

  const githubIssues = await listGithubIssues();
  const notionRows = await listNotionRows();

  const githubByNumber = new Map(githubIssues.map((issue) => [issue.number, issue]));
  const notionByNumber = new Map();
  const notionByPageId = new Map();
  const activeNotionPageIds = new Set();

  for (const page of notionRows) {
    activeNotionPageIds.add(page.id);
    notionByPageId.set(page.id, page);
    const number = page.properties.Number?.number;
    if (typeof number === "number" && !notionByNumber.has(number)) {
      notionByNumber.set(number, page);
    }
  }

  const stats = {
    created: 0,
    githubToNotion: 0,
    notionToGithub: 0,
    githubDeletedToNotion: 0,
    notionDeletedToGithub: 0,
    unchanged: 0,
    errors: 0,
  };
  const skippedNumbers = new Set();

  await applyGithubDeletionEvent(context, notionByNumber, state, stats, skippedNumbers, archiveNotionPage, now);
  await applyTrackedGithubDeletions(githubByNumber, activeNotionPageIds, state, stats, archiveNotionPage, now);
  await applyTrackedNotionDeletions(
    githubByNumber,
    activeNotionPageIds,
    state,
    stats,
    skippedNumbers,
    deleteGithubIssue,
    now,
  );

  for (const issue of githubIssues) {
    if (skippedNumbers.has(issue.number)) continue;

    try {
      const previous = state.issues[String(issue.number)];
      const page =
        notionByNumber.get(issue.number) ||
        (previous?.notionPageId ? notionByPageId.get(previous.notionPageId) : undefined);

      if (!page) {
        if (previous?.deletedAt) {
          skippedNumbers.add(issue.number);
          continue;
        }

        const createdPage = await createNotionPage(issue);
        setIssueRecord(state, issue, createdPage, now);
        stats.created++;
        continue;
      }

      const diff = diffIssueAndPage(issue, page);
      if (!diff.any) {
        setIssueRecord(state, issue, page, now);
        stats.unchanged++;
        continue;
      }

      const direction = chooseSyncDirection(issue, page, previous);
      if (direction === "notion-to-github") {
        const updatedIssue = await applyNotionToGithub(issue, page);
        const updatedPage = await updateNotionPageFromIssue(page.id, updatedIssue, "Notion");
        setIssueRecord(state, updatedIssue, updatedPage, now);
        stats.notionToGithub++;
      } else {
        const updatedPage = await updateNotionPageFromIssue(page.id, issue, "GitHub");
        setIssueRecord(state, issue, updatedPage, now);
        stats.githubToNotion++;
      }
    } catch (error) {
      stats.errors++;
      const page = notionByNumber.get(issue.number);
      if (page) {
        const errorPage = await markNotionSyncError(page.id, error.message);
        setRawRecord(state, String(issue.number), {
          ...(state.issues[String(issue.number)] || {}),
          number: issue.number,
          githubNodeId: issue.node_id,
          githubHtmlUrl: issue.html_url,
          notionPageId: page.id,
          githubUpdatedAt: issue.updated_at,
          notionLastEditedTime: errorPage.last_edited_time || page.last_edited_time,
          lastSeenAt: now,
          lastSyncError: error.message,
        });
      }
      warn(core, `Issue #${issue.number} sync failed: ${error.message}`);
    }
  }

  await writeStateFile(github, owner, repo, stateFile.sha, previousStateText, state);

  log(core, `Created: ${stats.created}`);
  log(core, `GitHub -> Notion: ${stats.githubToNotion}`);
  log(core, `Notion -> GitHub: ${stats.notionToGithub}`);
  log(core, `GitHub deleted -> Notion archived: ${stats.githubDeletedToNotion}`);
  log(core, `Notion deleted -> GitHub deleted: ${stats.notionDeletedToGithub}`);
  log(core, `Unchanged: ${stats.unchanged}`);
  log(core, `Errors: ${stats.errors}`);
};

async function applyGithubDeletionEvent(context, notionByNumber, state, stats, skippedNumbers, archiveNotionPage, now) {
  if (context.eventName !== "issues" || context.payload.action !== "deleted") return;

  const deletedIssue = context.payload.issue;
  if (!deletedIssue?.number) return;

  const key = String(deletedIssue.number);
  const page = notionByNumber.get(deletedIssue.number);
  const previous = state.issues[key];
  const pageId = page?.id || previous?.notionPageId;

  if (pageId) {
    await archiveNotionPage(pageId);
    stats.githubDeletedToNotion++;
  }

  setRawRecord(state, key, {
    ...(previous || {}),
    number: deletedIssue.number,
    githubNodeId: deletedIssue.node_id || previous?.githubNodeId,
    githubHtmlUrl: deletedIssue.html_url || previous?.githubHtmlUrl,
    notionPageId: pageId,
    deletedAt: now,
    deleteSource: "GitHub",
    lastSeenAt: now,
  });
  skippedNumbers.add(deletedIssue.number);
}

async function applyTrackedGithubDeletions(githubByNumber, activeNotionPageIds, state, stats, archiveNotionPage, now) {
  for (const [number, record] of Object.entries(state.issues)) {
    if (record.deletedAt || githubByNumber.has(Number(number))) continue;

    if (record.notionPageId && activeNotionPageIds.has(record.notionPageId)) {
      await archiveNotionPage(record.notionPageId);
      stats.githubDeletedToNotion++;
    }

    setRawRecord(state, number, {
      ...record,
      deletedAt: now,
      deleteSource: "GitHub",
      lastSeenAt: now,
    });
  }
}

async function applyTrackedNotionDeletions(
  githubByNumber,
  activeNotionPageIds,
  state,
  stats,
  skippedNumbers,
  deleteGithubIssue,
  now,
) {
  for (const [number, record] of Object.entries(state.issues)) {
    if (record.deletedAt || !record.notionPageId || activeNotionPageIds.has(record.notionPageId)) {
      continue;
    }

    const issue = githubByNumber.get(Number(number));
    if (!issue) continue;

    try {
      await deleteGithubIssue(issue);
      setRawRecord(state, number, {
        ...record,
        githubNodeId: issue.node_id || record.githubNodeId,
        githubHtmlUrl: issue.html_url || record.githubHtmlUrl,
        githubUpdatedAt: issue.updated_at || record.githubUpdatedAt,
        deletedAt: now,
        deleteSource: "Notion",
        lastSeenAt: now,
        lastSyncError: "",
      });
      stats.notionDeletedToGithub++;
    } catch (error) {
      setRawRecord(state, number, {
        ...record,
        githubNodeId: issue.node_id || record.githubNodeId,
        githubHtmlUrl: issue.html_url || record.githubHtmlUrl,
        githubUpdatedAt: issue.updated_at || record.githubUpdatedAt,
        lastSeenAt: now,
        lastSyncError: error.message,
      });
      stats.errors++;
      console.warn(`Issue #${number} deletion failed: ${error.message}`);
    }

    skippedNumbers.add(Number(number));
  }
}

function chooseSyncDirection(issue, page, previous) {
  const githubChanged = !previous || previous.githubUpdatedAt !== issue.updated_at;
  const notionChanged = !previous || previous.notionLastEditedTime !== page.last_edited_time;

  if (notionChanged && !githubChanged) return "notion-to-github";
  if (githubChanged && !notionChanged) return "github-to-notion";

  const notionEditedAt = Date.parse(page.last_edited_time);
  const githubUpdatedAt = Date.parse(issue.updated_at);
  if (Number.isNaN(notionEditedAt) || Number.isNaN(githubUpdatedAt)) return "github-to-notion";

  return notionEditedAt + TOLERANCE_MS >= githubUpdatedAt
    ? "notion-to-github"
    : "github-to-notion";
}

function diffIssueAndPage(issue, page) {
  const notion = {
    title: cleanTitle(getTitle(page), issue.number),
    state: normalizeState(getSelect(page, "State"), issue.state),
    assignees: splitList(getRichText(page, "Assignees")),
    labels: splitList(getRichText(page, "Labels")),
  };
  const github = {
    title: issue.title,
    state: issue.state,
    assignees: issueAssignees(issue),
    labels: issueLabels(issue),
  };

  const diff = {
    title: Boolean(notion.title) && notion.title !== github.title,
    state: notion.state !== github.state,
    assignees: !sameSet(notion.assignees, github.assignees),
    labels: !sameSet(notion.labels, github.labels),
    notion,
    github,
  };
  diff.any = diff.title || diff.state || diff.assignees || diff.labels;
  return diff;
}

function issueToNotionProps(issue, source, owner, repo, syncError = "") {
  return {
    Issue: {
      title: [{ type: "text", text: { content: `#${issue.number} ${issue.title}` } }],
    },
    Number: { number: issue.number },
    State: selectProp(issue.state),
    "Issue URL": { url: issue.html_url },
    Assignees: textProp(issueAssignees(issue).join(", ")),
    Labels: textProp(issueLabels(issue).join(", ")),
    Created: dateProp(issue.created_at),
    Updated: dateProp(issue.updated_at),
    Repo: { url: `https://github.com/${owner}/${repo}` },
    "Last Synced At": dateProp(new Date().toISOString()),
    "Last GitHub Updated": dateProp(issue.updated_at),
    "Last Sync Source": selectProp(source),
    "Sync Error": textProp(syncError),
  };
}

function recordFromIssueAndPage(issue, page, now) {
  return {
    number: issue.number,
    githubNodeId: issue.node_id,
    githubHtmlUrl: issue.html_url,
    notionPageId: page.id,
    githubUpdatedAt: issue.updated_at,
    notionLastEditedTime: page.last_edited_time,
    lastSeenAt: now,
    deletedAt: null,
    deleteSource: null,
    lastSyncError: "",
  };
}

function setIssueRecord(state, issue, page, now) {
  const key = String(issue.number);
  const next = recordFromIssueAndPage(issue, page, now);
  setRawRecord(state, key, next);
}

function setRawRecord(state, key, next) {
  const previous = state.issues[key];
  if (sameRecord(previous, next)) {
    state.issues[key] = previous;
    return;
  }

  state.issues[key] = next;
}

function sameRecord(left, right) {
  if (!left) return false;

  return (
    left.number === right.number &&
    left.githubNodeId === right.githubNodeId &&
    left.githubHtmlUrl === right.githubHtmlUrl &&
    left.notionPageId === right.notionPageId &&
    left.githubUpdatedAt === right.githubUpdatedAt &&
    left.notionLastEditedTime === right.notionLastEditedTime &&
    (left.deletedAt || null) === (right.deletedAt || null) &&
    (left.deleteSource || null) === (right.deleteSource || null) &&
    (left.lastSyncError || "") === (right.lastSyncError || "")
  );
}

async function readStateFile(github, owner, repo) {
  try {
    const response = await github.rest.repos.getContent({
      owner,
      repo,
      path: STATE_PATH,
    });

    if (Array.isArray(response.data) || response.data.type !== "file") {
      throw new Error(`${STATE_PATH} is not a file`);
    }

    const text = Buffer.from(response.data.content, "base64").toString("utf8");
    return { sha: response.data.sha, text };
  } catch (error) {
    if (error.status === 404) return { sha: undefined, text: "" };
    throw error;
  }
}

async function writeStateFile(github, owner, repo, sha, previousText, state) {
  const nextText = `${JSON.stringify(state, null, 2)}\n`;
  if (previousText === nextText) return;

  await github.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: STATE_PATH,
    message: "chore: update notion issue sync state [skip ci]",
    content: Buffer.from(nextText, "utf8").toString("base64"),
    sha,
    committer: githubActionsBot(),
    author: githubActionsBot(),
  });
}

function parseState(text, owner, repo) {
  if (!text.trim()) {
    return {
      version: 1,
      repository: `${owner}/${repo}`,
      issues: {},
      lastSyncedAt: null,
    };
  }

  const parsed = JSON.parse(text);
  return {
    version: 1,
    repository: parsed.repository || `${owner}/${repo}`,
    issues: parsed.issues || {},
    lastSyncedAt: parsed.lastSyncedAt || null,
  };
}

function githubActionsBot() {
  return {
    name: "github-actions[bot]",
    email: "41898282+github-actions[bot]@users.noreply.github.com",
  };
}

function textProp(value) {
  return {
    rich_text: value ? [{ type: "text", text: { content: String(value) } }] : [],
  };
}

function dateProp(value) {
  return { date: value ? { start: value } : null };
}

function selectProp(name) {
  return { select: name ? { name } : null };
}

function getTitle(page) {
  return (page.properties.Issue?.title || [])
    .map((item) => item.plain_text || item.text?.content || "")
    .join("");
}

function cleanTitle(title, number) {
  return title.replace(new RegExp(`^#${number}\\s*`), "").trim();
}

function getSelect(page, propertyName) {
  return page.properties[propertyName]?.select?.name;
}

function getRichText(page, propertyName) {
  return (page.properties[propertyName]?.rich_text || [])
    .map((item) => item.plain_text || item.text?.content || "")
    .join("");
}

function normalizeState(value, fallback) {
  const normalized = String(value || "").toLowerCase();
  return normalized === "open" || normalized === "closed" ? normalized : fallback;
}

function splitList(value) {
  return String(value || "")
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function issueAssignees(issue) {
  return (issue.assignees || []).map((assignee) => assignee.login).filter(Boolean);
}

function issueLabels(issue) {
  return (issue.labels || [])
    .map((label) => (typeof label === "string" ? label : label.name))
    .filter(Boolean);
}

function sameSet(left, right) {
  if (left.length !== right.length) return false;

  const normalizedLeft = new Set(left.map((item) => item.toLowerCase()));
  return right.every((item) => normalizedLeft.has(item.toLowerCase()));
}

function log(core, message) {
  if (core?.info) core.info(message);
  else console.log(message);
}

function warn(core, message) {
  if (core?.warning) core.warning(message);
  else console.warn(message);
}
