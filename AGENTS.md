# my-shop Project Instructions

This project was generated with `@vendure/create`.

## Workspace Layout

- Vendure backend: `apps/server`
- Next.js storefront: `apps/storefront`
- Start both apps: `npm run dev`
- Start only the server: `npm run dev:server`
- Start only the storefront: `npm run dev:storefront`
- Backend custom code belongs in `apps/server/src/plugins`
- Backend runtime configuration is in `apps/server/src/vendure-config.ts`
- Backend static assets and email templates live in `apps/server/static`

## Vendure Development

- Prefer implementing custom functionality as a Vendure plugin.
- Use `npx vendure add` to scaffold plugins, entities, services, API extensions, and job queues.
- Read environment variables in `vendure-config.ts` and pass values into plugins through `Plugin.init()` options.
- Create job queues in `onModuleInit()` or `onApplicationBootstrap()`, then reuse the queue when adding jobs.
- Pass `RequestContext` to Vendure services and `TransactionalConnection` methods when it is available.
- Do not commit `.env` values or generated runtime data.
- Do not use `dbConnectionOptions.synchronize: true` for production data.

## Commands

- Start development: `npm run dev`
- Build: `npm run build`

## Quality Checks

- Run `npm run build` after changing backend code.
- Run targeted tests for the package or feature you changed.

## Build Permission

- Do NOT run `npm run build` (or any slow/full build) without first asking the user for explicit permission.
- Ask before every build; do not build by default after changes.
- Narrow checks (targeted test, file-level typecheck, lint on changed files) may be run without asking when a skill needs proof.

## Agent Workflow

- Apply the `ds-*` skills in `.agents/skills` to every task here; `ds-mode` is the default working style.
- Pick skills per `ds-help`: `ds-plan-loop` for multi-step work, `ds-verify-loop`/`ds-tdd` for changes, `ds-review-loop` before reporting non-trivial diffs, `ds-unstick` after two failed fixes.
- Use `ds-ledger` or `PROGRESS.md` for long runs, and `ds-unslop` for prose, docs, and commit messages.
- Evidence before done: paste the command and its output. Label claims as measured, inferred, or guessed.
