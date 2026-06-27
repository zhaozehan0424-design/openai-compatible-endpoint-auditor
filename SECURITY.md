# Security Policy

Endpoint Auditor handles API base URLs, model lists, and API keys provided through environment variables. Treat all local endpoint configs and audit outputs as potentially sensitive.

## Reporting

Please report security issues through the repository owner profile:

https://github.com/zhaozehan0424-design

Do not open a public issue containing real API keys, private base URLs, usage logs, or provider account details.

## Sensitive Data

Never commit:

- `.env` files
- `endpoints.local.json`
- Real API keys or bearer tokens
- Private endpoint inventories
- Audit result logs tied to private providers
- Generated browser profiles or unrelated automation artifacts

## Operational Recommendations

- Use restricted, disposable keys for audits.
- Prefer read-only model-list checks unless chat smoke tests are required.
- Redact endpoint names and model lists if they identify a private provider.
