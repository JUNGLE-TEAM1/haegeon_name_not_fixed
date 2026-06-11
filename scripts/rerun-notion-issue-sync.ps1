$ErrorActionPreference = "Stop"

$repo = "JUNGLE-TEAM1/haegeon_name_not_fixed"
$runId = "27330376655"
$token = $env:GITHUB_TOKEN

if ([string]::IsNullOrWhiteSpace($token)) {
    throw "Set GITHUB_TOKEN before running this script."
}

$headers = @{
    "Accept" = "application/vnd.github+json"
    "Authorization" = "Bearer $token"
    "X-GitHub-Api-Version" = "2022-11-28"
}

$uri = "https://api.github.com/repos/$repo/actions/runs/$runId/rerun"

Invoke-RestMethod `
    -Method Post `
    -Uri $uri `
    -Headers $headers

Write-Host "Requested re-run for workflow run $runId."
