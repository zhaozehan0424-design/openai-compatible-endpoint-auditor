# Maintenance

This repository is maintained as a small compatibility and diagnostics CLI.

## Current Maintainer

- GitHub: `zhaozehan0424-design`

## Maintenance Log

### 2026-06-27

- Extracted the reusable endpoint/model audit idea from a private Codex workflow.
- Rebuilt the public project without committing real API keys, vendor-specific private endpoint lists, generated browser profiles, or unrelated automation artifacts.
- Added environment-variable based key loading through `apiKeyEnv`.
- Added `GET /models` checks, optional `POST /chat/completions` smoke tests, JSON output, mock endpoint tests, and CI.
- Added security, contribution, issue, and pull request templates.

## Release Checklist

- Run `npm run check`.
- Confirm `.env`, `endpoints.local.json`, results, logs, and zip files are not tracked.
- Keep examples synthetic and free of real API keys.
- Document meaningful CLI behavior changes in `CHANGELOG.md`.

## 2026-06-30 - Cross-repository maintenance audit

- Added `REPOSITORY_STATUS.md` as a quick maintainer/readiness dashboard.
- Re-ran verification checks:
- `npm run check -> syntax_ok=4, public_repo_ok=true, mock_smoke_ok=true`
- Confirmed README, changelog, security, contribution, issue-template, PR-template, license, and CI files are present.
- Confirmed public documentation does not require committing private keys or local runtime secrets.

