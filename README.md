# OpenAI-Compatible Endpoint Auditor
[![CI](https://github.com/zhaozehan0424-design/openai-compatible-endpoint-auditor/actions/workflows/ci.yml/badge.svg)](https://github.com/zhaozehan0424-design/openai-compatible-endpoint-auditor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[Repository status](./REPOSITORY_STATUS.md) records the latest maintenance checks and release-readiness notes.

A small CLI for checking OpenAI-compatible API base URLs without committing secrets.

It audits:

- `GET /models` availability
- model IDs returned by the endpoint
- optional `POST /chat/completions` smoke tests
- JSON output for comparing multiple endpoints

No real API keys are stored in config files. Config entries point to environment variable names through `apiKeyEnv`.

## Quick Start

Copy the example config:

```powershell
Copy-Item .\examples\endpoints.example.json .\endpoints.local.json
```

Edit `endpoints.local.json`:

```json
[
  {
    "name": "my-gateway",
    "baseUrl": "https://example.com/v1",
    "apiKeyEnv": "MY_GATEWAY_API_KEY",
    "chatModel": "gpt-4o-mini"
  }
]
```

Set the key outside Git:

```powershell
$env:MY_GATEWAY_API_KEY = "sk-your-key"
```

Run a model-list audit:

```powershell
node .\bin\endpoint-auditor.cjs --config .\endpoints.local.json --json
```

Run the optional chat smoke test:

```powershell
node .\bin\endpoint-auditor.cjs --config .\endpoints.local.json --chat
```

## Config

Each endpoint object supports:

| Field | Required | Purpose |
| --- | --- | --- |
| `name` | No | Human-readable endpoint name. |
| `baseUrl` | Yes | OpenAI-compatible `/v1` base URL. |
| `apiKeyEnv` | Yes | Environment variable containing the API key. |
| `chatModel` | No | Model used by the optional chat smoke test. |

## Checks

Run the same checks used by CI:

```powershell
npm run check
```

The check suite verifies JavaScript syntax, public repository files, and a local mock endpoint smoke test.

## Safety

- No real API keys, vendor endpoint lists, private results, or logs should be committed.
- Store local configs as `endpoints.local.json`; it is ignored by `.gitignore`.
- Use restricted, disposable keys for compatibility checks.

See [SECURITY.md](./SECURITY.md) and [CONTRIBUTING.md](./CONTRIBUTING.md).

## Origin

This project was extracted from a private Codex workflow that checked several OpenAI-compatible API endpoints and model lists. The public version keeps the reusable auditing logic and removes private keys, provider-specific secrets, browser profiles, and unrelated automation artifacts.

## License

MIT. See [LICENSE](./LICENSE).
