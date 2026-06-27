# Changelog

## v0.1.0 - 2026-06-27

Initial public release.

- Added a CLI for auditing OpenAI-compatible `/models` endpoints.
- Added optional `chat/completions` smoke tests.
- Added JSON and tabular output modes.
- Added environment-variable based key loading through `apiKeyEnv`.
- Added a local mock endpoint smoke test for CI.
- Added public README, maintenance notes, security policy, contribution guide, issue templates, and MIT license.

## Private Workflow Notes

Before public release, the project idea came from a private Codex thread that checked multiple OpenAI-compatible API base URLs and model lists. Private API keys, vendor-specific endpoint lists, generated browser profiles, and unrelated training-page automation artifacts were intentionally excluded from the public repository.
