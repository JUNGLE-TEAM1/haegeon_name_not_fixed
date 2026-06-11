# Notion Issue Sync Re-run Automation

GitHub Actions `schedule` is not currently creating runs for this repository.
Use an external cron service to re-run the known-good workflow run every 5 minutes.

## Target

Repository:

```text
JUNGLE-TEAM1/haegeon_name_not_fixed
```

Workflow:

```text
.github/workflows/notion-issue-sync.yml
```

Known-good workflow run ID:

```text
27330376655
```

## cron-job.org settings

Schedule:

```text
*/5 * * * *
```

Request method:

```text
POST
```

URL:

```text
https://api.github.com/repos/JUNGLE-TEAM1/haegeon_name_not_fixed/actions/runs/27330376655/rerun
```

Headers:

```text
Accept: application/vnd.github+json
Authorization: Bearer <GITHUB_TOKEN>
X-GitHub-Api-Version: 2022-11-28
Content-Type: application/json
```

Request body:

```text
<empty>
```

## Token permissions

Use a GitHub token with Actions write permission for this repository.

Fine-grained token:

```text
Repository access: JUNGLE-TEAM1/haegeon_name_not_fixed
Repository permissions: Actions: Read and write
```

Classic token:

```text
workflow
```

If a token was pasted into a screenshot or chat, revoke it and create a new one.
