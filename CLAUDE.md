# CLAUDE.md

Guidance for Claude Code in this repository.

## What This Repo Is

Developer documentation for FluentEvent (VitePress), meant for https://dev.fluentevent.com/. This repo is a **git submodule** inside the FluentEvent plugin at `fluent-event/dev-docs-repo`; its remote is `WPManageNinja/fluent-event-developer-docs`. Don't confuse it with the plugin repo one directory up.

## Commands

Yarn 4 (pinned in `.yarn/releases`, `nodeLinker: node-modules`). npm works too.

```bash
yarn install
yarn docs:dev          # regenerate docs + manifest + cards, then dev server
yarn docs:build        # regenerate, then production build
yarn generate:docs     # regeneration only
yarn featured:generate # social cards for new pages
```

No tests, no linter. `docs:build` fails on a link to a missing page (VitePress) or a missing `#anchor` (`scripts/check-anchors.mjs`): treat that as the test.

## Generated vs Hand-Written (Critical)

`scripts/generate-docs.mjs` reads the plugin source (`FE_PLUGIN_DIR`, default `..`) through `scripts/lib/source.mjs` and `scripts/lib/php.mjs`: migrations, models, routes, policies, request-class rules, controllers and every `fluent_event/` hook call site, scheduled action and listener. Every run **deletes and rewrites**:

- `docs/database/`, `docs/hooks/`, `docs/restapi/`, `docs/index.md`, `docs/getting-started.md`
- `.generated/` (sidebar data read by `.vitepress/config.mts`)
- `public/openapi/` (one spec per operation)

Never hand-edit those. Change prose in `data/`, templates and metadata (`MODULES`, `HOOK_PAGES`, `TYPE_HINTS`, `MODEL_ORDER`) in the generator.

| File | Holds |
| --- | --- |
| `data/hook-notes.mjs` | Per-hook summary, notes, params, example. Keyed by hook name. |
| `data/operation-notes.mjs` | Per-endpoint slug, title, summary, notes, param overrides; API overview; permission texts. Keyed by `Controller@action`. |
| `data/model-notes.mjs` | Table, column, meta and scope prose; the Query Builder page. |
| `data/getting-started.md` | Body of the Getting Started page. |
| `data/response-examples.json` | Recorded, anonymised REST samples. Never hand-edit: re-run `scripts/capture/`. |
| `data/manual-examples.json` | Hand-written samples for endpoints the harness cannot record. |

A notes key that matches nothing in the source is a warning on every run. The run ends with prose and sample coverage; keep both at 100%.

Hand-written pages: `docs/guides/`, `docs/helpers/`. A new one must be added to the sidebar in `.vitepress/config.mts`.

## After a Plugin Change

1. `yarn generate:docs`; fix every warning (new hook or route without prose).
2. If a response shape changed, re-run the capture (`scripts/capture/README.md`).
3. Check the hand-written guides that touch the changed area.
4. `yarn docs:build`, and commit the regenerated output with the prose.

## Writing

Docs are read by developers outside the team: plain, short, active sentences, one term per concept (guest, calendar, event, entry type). Every claim must match the code; quote file paths as `fluent-event/<path>:<line>`.

## Featured Images

`scripts/generate-featured-images.mjs` renders a 1200×630 card per page into `public/images/featured/`; `featuredImageFor()` in the config points `og:image` at it. The card name rule lives once, in `scripts/lib/featured-card.mjs`. Renamed page: delete its old card and run the generator again.
