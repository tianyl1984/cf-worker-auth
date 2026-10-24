# Repository Guidelines

## Project Structure & Module Organization

This repository provides GitHub OAuth authentication through a Cloudflare Worker.

- `src/index.js`: Worker entry point, routing, and error handling.
- `src/login.js`: login HTML, callback hostname validation, and OAuth state storage.
- `src/github.js`: GitHub authorization exchange, user allowlist checks, and token creation.
- `src/user.js`: `/userinfo` endpoint and token lookup.
- `src/util.js`: shared UUID helper.
- `wrangler.toml`: Worker configuration, environment variables, and KV bindings.
- `README.md`: integration and deployment documentation.

Login markup and styles are inline; there is no separate asset directory or committed test suite.

## Build, Test, and Development Commands

- `npm install`: install dependencies, including Wrangler.
- `npm run dev`: start Wrangler with the `dev` environment.
- `npm start`: start Wrangler using the default configuration.
- `npm run deploy`: deploy the Worker to Cloudflare.
- `git diff --check`: check changes for whitespace errors.

There are no standalone build, test, lint, or formatting scripts. Wrangler handles bundling during development and deployment.

## Coding Style & Naming Conventions

Use JavaScript ES modules with explicit `.js` import extensions and tab indentation. Follow the surrounding file's quotation and semicolon style; avoid unrelated formatting changes. Use camelCase names, prefix module-private helpers with `_`, and expose route handlers through the existing default `{ handle }` export pattern. Keep runtime code compatible with Cloudflare Workers APIs such as `Request`, `Response`, `fetch`, and `crypto`.

## Testing Guidelines

No testing framework or coverage threshold is configured. Do not add test files unless requested. Validate affected endpoints locally and record commands and results in the pull request. Check accepted and rejected callback hosts, missing or expired tokens, and authorization failures when relevant. Use the `ego-browser` skill for frontend page acceptance; other browsers must not be used for that validation.

## Commit & Pull Request Guidelines

History uses short, imperative summaries such as `fix hostname` and `add /userinfo api`. Follow that style and keep commits focused. Pull requests should describe the behavior change, affected routes or configuration, and validation performed. Link related issues when available; include screenshots for visible login-page changes. Update `README.md` when integration behavior changes.

## Security & Configuration

Configure the `authdata` KV binding and comma-separated `legal_domain` and `legal_user` allowlists. Preserve complete-hostname matching when changing wildcard rules. Store production credentials with `wrangler secret put GITHUB_CLIENT_ID` and `wrangler secret put GITHUB_CLIENT_SECRET`; never commit real credentials or tokens.
