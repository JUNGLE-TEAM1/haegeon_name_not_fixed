const fs = require("fs");
const path = require("path");

const GOOGLE_API = "https://www.googleapis.com/calendar/v3";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";
const DEFAULT_TASKS_DATABASE_ID = "1ae7a290945144f0a01a2cc376820007";
const DEFAULT_CALENDAR_ID = "primary";
const DEFAULT_TIME_ZONE = "Asia/Seoul";
const STATE_PATH = ".github/google-calendar-tasks-sync-state.json";
const GCAL_MARKER_PREFIX = "gcal-sync-id:";
const TOLERANCE_MS = 3000;

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

async function main() {
  const notionToken = requiredEnv("NOTION_TOKEN");
  const databaseId = process.env.NOTION_TASKS_DATABASE_ID || DEFAULT_TASKS_DATABASE_ID;
  const calendarId = process.env.GOOGLE_CALENDAR_ID || DEFAULT_CALENDAR_ID;
  const timeZone = process.env.GCAL_TIME_ZONE || DEFAULT_TIME_ZONE;
  const lookbackDays = Number(process.env.GCAL_SYNC_LOOKBACK_DAYS || 30);
  const lookaheadDays = Number(process.env.GCAL_SYNC_LOOKAHEAD_DAYS || 180);

  const accessToken = await getGoogleAccessToken();
  const notion = createNotionClient(notionToken);
  const google = createGoogleClient(accessToken, calendarId);
  const state = readState(calendarId, databaseId);
  const previousStateText = serializeState(state);
  const now = new Date().toISOString();
  const windowStart = addDays(new Date(), -lookbackDays);
  const windowEnd = addDays(new Date(), lookaheadDays);

  const [notionPages, googleEvents] = await Promise.all([
    listNotionTaskPages(notion, databaseId),
    google.listEvents(windowStart, windowEnd, timeZone),
  ]);

  const activeNotionPages = notionPages.filter((page) => !page.archived && !page.in_trash);
  const pagesById = new Map(activeNotionPages.map((page) => [page.id, page]));
  const pagesByMarker = mapPagesByMarker(activeNotionPages);
  const googleEventsById = new Map(googleEvents.map((event) => [event.id, event]));
  const activeGoogleEvents = googleEvents.filter((event) => event.status !== "cancelled");

  const stats = {
    googleToNotionCreated: 0,
    notionToGoogleCreated: 0,
    googleToNotionUpdated: 0,
    notionToGoogleUpdated: 0,
    googleDeletedToNotion: 0,
    notionDeletedToGoogle: 0,
    unchanged: 0,
    errors: 0,
  };
  const skippedGoogleIds = new Set();
  const skippedPageIds = new Set();

  await applyTrackedDeletions({
    google,
    notion,
    state,
    pagesById,
    googleEventsById,
    stats,
    skippedGoogleIds,
    skippedPageIds,
    now,
    windowStart,
    windowEnd,
  });

  for (const event of activeGoogleEvents) {
    if (!isSyncableGoogleEvent(event) || skippedGoogleIds.has(event.id)) continue;

    try {
      const record = state.records[event.id];
      const page = pagesByMarker.get(markerForGoogleEvent(event)) || (record ? pagesById.get(record.notionPageId) : undefined);

      if (!page) {
        const createdPage = await createNotionTaskFromGoogle(notion, databaseId, event);
        setRecord(state, event, createdPage, now);
        stats.googleToNotionCreated++;
        skippedPageIds.add(createdPage.id);
        continue;
      }

      const direction = chooseDirection(event, page, record);
      if (direction === "google-to-notion") {
        const updatedPage = await updateNotionTaskFromGoogle(notion, page, event);
        setRecord(state, event, updatedPage, now);
        stats.googleToNotionUpdated++;
      } else if (direction === "notion-to-google") {
        const updatedEvent = await updateGoogleEventFromNotion(google, event, page, timeZone);
        const refreshedPage = await ensureNotionMarker(notion, page, updatedEvent);
        setRecord(state, updatedEvent, refreshedPage, now);
        stats.notionToGoogleUpdated++;
      } else {
        setRecord(state, event, page, now);
        stats.unchanged++;
      }

      skippedPageIds.add(page.id);
    } catch (error) {
      stats.errors++;
      console.warn(`Google event ${event.id} sync failed: ${error.message}`);
    }
  }

  for (const page of activeNotionPages) {
    if (skippedPageIds.has(page.id) || !isSyncableNotionPage(page)) continue;

    try {
      const marker = extractMarker(getRichText(page, "Notes"));
      const knownEvent = marker ? googleEventsById.get(marker) : undefined;
      if (knownEvent && knownEvent.status !== "cancelled") continue;

      const createdEvent = await createGoogleEventFromNotion(google, page, timeZone);
      const updatedPage = await ensureNotionMarker(notion, page, createdEvent);
      setRecord(state, createdEvent, updatedPage, now);
      stats.notionToGoogleCreated++;
    } catch (error) {
      stats.errors++;
      console.warn(`Notion page ${page.id} sync failed: ${error.message}`);
    }
  }

  writeStateIfChanged(state, previousStateText, now);

  console.log(`Google -> Notion created: ${stats.googleToNotionCreated}`);
  console.log(`Notion -> Google created: ${stats.notionToGoogleCreated}`);
  console.log(`Google -> Notion updated: ${stats.googleToNotionUpdated}`);
  console.log(`Notion -> Google updated: ${stats.notionToGoogleUpdated}`);
  console.log(`Google deleted -> Notion archived: ${stats.googleDeletedToNotion}`);
  console.log(`Notion deleted -> Google deleted: ${stats.notionDeletedToGoogle}`);
  console.log(`Unchanged: ${stats.unchanged}`);
  console.log(`Errors: ${stats.errors}`);
}

async function getGoogleAccessToken() {
  if (process.env.GOOGLE_ACCESS_TOKEN) return process.env.GOOGLE_ACCESS_TOKEN;

  const clientId = requiredEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requiredEnv("GOOGLE_CLIENT_SECRET");
  const refreshToken = requiredEnv("GOOGLE_REFRESH_TOKEN");
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Google OAuth refresh failed: ${response.status} ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

function createNotionClient(token) {
  return async function notion(pathname, method = "GET", body) {
    const response = await fetch(`${NOTION_API}${pathname}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`${method} ${pathname} failed: ${response.status} ${text}`);
    }

    return text ? JSON.parse(text) : {};
  };
}

function createGoogleClient(accessToken, calendarId) {
  async function request(pathname, method = "GET", body) {
    const response = await fetch(`${GOOGLE_API}${pathname}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`${method} ${pathname} failed: ${response.status} ${text}`);
    }

    return text ? JSON.parse(text) : {};
  }

  const encodedCalendarId = encodeURIComponent(calendarId);

  return {
    async listEvents(windowStart, windowEnd, timeZone) {
      const events = [];
      let pageToken;

      do {
        const params = new URLSearchParams({
          maxResults: "2500",
          singleEvents: "true",
          showDeleted: "true",
          timeMin: windowStart.toISOString(),
          timeMax: windowEnd.toISOString(),
          timeZone,
        });
        if (pageToken) params.set("pageToken", pageToken);

        const data = await request(`/calendars/${encodedCalendarId}/events?${params.toString()}`);
        events.push(...(data.items || []));
        pageToken = data.nextPageToken;
      } while (pageToken);

      return events;
    },
    insertEvent(eventBody) {
      return request(`/calendars/${encodedCalendarId}/events`, "POST", eventBody);
    },
    patchEvent(eventId, eventBody) {
      return request(`/calendars/${encodedCalendarId}/events/${encodeURIComponent(eventId)}`, "PATCH", eventBody);
    },
    deleteEvent(eventId) {
      return request(`/calendars/${encodedCalendarId}/events/${encodeURIComponent(eventId)}`, "DELETE");
    },
  };
}

async function listNotionTaskPages(notion, databaseId) {
  const pages = [];
  let cursor;

  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;

    const data = await notion(`/databases/${databaseId}/query`, "POST", body);
    pages.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return pages;
}

async function applyTrackedDeletions({
  google,
  notion,
  state,
  pagesById,
  googleEventsById,
  stats,
  skippedGoogleIds,
  skippedPageIds,
  now,
  windowStart,
  windowEnd,
}) {
  for (const [googleEventId, record] of Object.entries(state.records)) {
    if (record.deletedAt) continue;

    const page = record.notionPageId ? pagesById.get(record.notionPageId) : undefined;
    const event = googleEventsById.get(googleEventId);

    if ((!event || event.status === "cancelled") && page && isRecordInsideWindow(record, windowStart, windowEnd)) {
      await archiveNotionPage(notion, page.id);
      state.records[googleEventId] = {
        ...record,
        deletedAt: now,
        deleteSource: "Google",
        lastSeenAt: now,
      };
      stats.googleDeletedToNotion++;
      skippedPageIds.add(page.id);
      skippedGoogleIds.add(googleEventId);
      continue;
    }

    if (!page && event && event.status !== "cancelled") {
      await google.deleteEvent(googleEventId);
      state.records[googleEventId] = {
        ...record,
        googleUpdatedAt: event.updated || record.googleUpdatedAt,
        deletedAt: now,
        deleteSource: "Notion",
        lastSeenAt: now,
      };
      stats.notionDeletedToGoogle++;
      skippedGoogleIds.add(googleEventId);
    }
  }
}

async function archiveNotionPage(notion, pageId) {
  return notion(`/pages/${pageId}`, "PATCH", { archived: true });
}

async function createNotionTaskFromGoogle(notion, databaseId, event) {
  return notion("/pages", "POST", {
    parent: { database_id: databaseId },
    properties: {
      ...googleEventToNotionProperties(event),
      Status: selectProp("Not started"),
    },
  });
}

async function updateNotionTaskFromGoogle(notion, page, event) {
  return notion(`/pages/${page.id}`, "PATCH", {
    properties: googleEventToNotionProperties(event),
  });
}

async function ensureNotionMarker(notion, page, event) {
  const notes = getRichText(page, "Notes");
  if (extractMarker(notes) === markerForGoogleEvent(event)) return page;

  return notion(`/pages/${page.id}`, "PATCH", {
    properties: {
      Notes: textProp(upsertMarker(notes, markerForGoogleEvent(event))),
    },
  });
}

async function createGoogleEventFromNotion(google, page, timeZone) {
  return google.insertEvent(notionPageToGoogleEventBody(page, timeZone));
}

async function updateGoogleEventFromNotion(google, event, page, timeZone) {
  return google.patchEvent(event.id, notionPageToGoogleEventBody(page, timeZone));
}

function googleEventToNotionProperties(event) {
  return {
    Name: titleProp(event.summary || "(No title)"),
    Date: googleEventToNotionDate(event),
    Notes: textProp(notesFromGoogleEvent(event)),
  };
}

function notionPageToGoogleEventBody(page, timeZone) {
  const name = getTitle(page, "Name") || "(No title)";
  const notes = stripMarker(getRichText(page, "Notes")).trim();
  const date = page.properties.Date?.date;

  return {
    summary: name,
    description: notes || undefined,
    ...notionDateToGoogleEventTime(date, timeZone),
    extendedProperties: {
      private: {
        notionPageId: page.id,
      },
    },
  };
}

function chooseDirection(event, page, record) {
  const googleChanged = !record || record.googleUpdatedAt !== event.updated;
  const notionChanged = !record || record.notionLastEditedTime !== page.last_edited_time;

  if (!googleChanged && !notionChanged) return "unchanged";
  if (googleChanged && !notionChanged) return "google-to-notion";
  if (!googleChanged && notionChanged) return "notion-to-google";

  const googleUpdatedAt = Date.parse(event.updated || "");
  const notionEditedAt = Date.parse(page.last_edited_time || "");
  if (Number.isNaN(googleUpdatedAt) || Number.isNaN(notionEditedAt)) return "google-to-notion";

  return notionEditedAt + TOLERANCE_MS >= googleUpdatedAt
    ? "notion-to-google"
    : "google-to-notion";
}

function isSyncableGoogleEvent(event) {
  return Boolean(event.id && (event.start?.date || event.start?.dateTime));
}

function googleEventStart(event) {
  return event.start?.dateTime || event.start?.date || null;
}

function isSyncableNotionPage(page) {
  return Boolean(getTitle(page, "Name") && page.properties.Date?.date?.start);
}

function mapPagesByMarker(pages) {
  const pagesByMarker = new Map();

  for (const page of pages) {
    const marker = extractMarker(getRichText(page, "Notes"));
    if (marker) pagesByMarker.set(marker, page);
  }

  return pagesByMarker;
}

function setRecord(state, event, page, now) {
  const previous = state.records[event.id];
  const next = {
    googleEventId: event.id,
    googleUpdatedAt: event.updated || null,
    googleStart: googleEventStart(event),
    notionPageId: page.id,
    notionLastEditedTime: page.last_edited_time || null,
    lastSeenAt: now,
    deletedAt: null,
    deleteSource: null,
  };

  state.records[event.id] = sameRecord(previous, next) ? previous : next;
}

function sameRecord(left, right) {
  if (!left) return false;

  return (
    left.googleEventId === right.googleEventId &&
    left.googleUpdatedAt === right.googleUpdatedAt &&
    left.googleStart === right.googleStart &&
    left.notionPageId === right.notionPageId &&
    left.notionLastEditedTime === right.notionLastEditedTime &&
    (left.deletedAt || null) === (right.deletedAt || null) &&
    (left.deleteSource || null) === (right.deleteSource || null)
  );
}

function isRecordInsideWindow(record, windowStart, windowEnd) {
  if (!record.googleStart) return false;

  const googleStart = new Date(record.googleStart);
  return googleStart >= windowStart && googleStart <= windowEnd;
}

function readState(calendarId, databaseId) {
  if (!fs.existsSync(STATE_PATH)) {
    return {
      version: 1,
      calendarId,
      tasksDatabaseId: databaseId,
      records: {},
      lastSyncedAt: null,
    };
  }

  const parsed = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  return {
    version: 1,
    calendarId: parsed.calendarId || calendarId,
    tasksDatabaseId: parsed.tasksDatabaseId || databaseId,
    records: parsed.records || {},
    lastSyncedAt: parsed.lastSyncedAt || null,
  };
}

function writeStateIfChanged(state, previousStateText, now) {
  if (serializeState(state) === previousStateText) return;

  state.lastSyncedAt = now;
  writeState(state);
}

function writeState(state) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, serializeState(state));
}

function serializeState(state) {
  return `${JSON.stringify(state, null, 2)}\n`;
}

function googleEventToNotionDate(event) {
  if (event.start?.date) {
    const start = event.start.date;
    const googleEnd = event.end?.date;
    const notionEnd = googleEnd ? formatDateOnly(addDays(parseDateOnly(googleEnd), -1)) : null;

    return {
      date: {
        start,
        end: notionEnd && notionEnd !== start ? notionEnd : null,
      },
    };
  }

  return {
    date: {
      start: event.start.dateTime,
      end: event.end?.dateTime || null,
    },
  };
}

function notionDateToGoogleEventTime(date, timeZone) {
  if (!date?.start) throw new Error("Notion task is missing Date");

  const isDateTime = date.start.includes("T");
  if (isDateTime) {
    return {
      start: { dateTime: date.start, timeZone },
      end: { dateTime: date.end || addHoursIso(date.start, 1), timeZone },
    };
  }

  return {
    start: { date: date.start },
    end: { date: addDaysString(date.end || date.start, 1) },
  };
}

function notesFromGoogleEvent(event) {
  const parts = [
    `[${GCAL_MARKER_PREFIX} ${markerForGoogleEvent(event)}]`,
    event.description || "",
    event.location ? `Location: ${event.location}` : "",
    event.htmlLink ? `URL: ${event.htmlLink}` : "",
  ].filter(Boolean);

  return truncate(parts.join("\n\n"), 1900);
}

function markerForGoogleEvent(event) {
  return event.id;
}

function extractMarker(notes) {
  const match = notes.match(/\[gcal-sync-id:\s*([^\]]+)\]/);
  return match ? match[1].trim() : undefined;
}

function upsertMarker(notes, marker) {
  const withoutMarker = stripMarker(notes).trim();
  const markerLine = `[${GCAL_MARKER_PREFIX} ${marker}]`;
  return truncate(withoutMarker ? `${withoutMarker}\n\n${markerLine}` : markerLine, 1900);
}

function stripMarker(notes) {
  return String(notes || "")
    .replace(/\[gcal-sync-id:\s*[^\]]+\]\s*/g, "")
    .trim();
}

function titleProp(value) {
  return { title: [{ type: "text", text: { content: truncate(value, 1900) } }] };
}

function textProp(value) {
  return { rich_text: value ? [{ type: "text", text: { content: truncate(value, 1900) } }] : [] };
}

function selectProp(value) {
  return { select: value ? { name: value } : null };
}

function getTitle(page, propertyName) {
  return (page.properties[propertyName]?.title || [])
    .map((item) => item.plain_text || item.text?.content || "")
    .join("");
}

function getRichText(page, propertyName) {
  return (page.properties[propertyName]?.rich_text || [])
    .map((item) => item.plain_text || item.text?.content || "")
    .join("");
}

function addDays(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addDaysString(dateString, days) {
  return formatDateOnly(addDays(parseDateOnly(dateString), days));
}

function parseDateOnly(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function addHoursIso(dateTime, hours) {
  return new Date(new Date(dateTime).getTime() + hours * 60 * 60 * 1000).toISOString();
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function truncate(value, maxLength) {
  const text = String(value || "");
  return text.length > maxLength ? text.slice(0, maxLength - 1) : text;
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

module.exports = {
  extractMarker,
  googleEventToNotionDate,
  notionDateToGoogleEventTime,
  stripMarker,
  upsertMarker,
};
