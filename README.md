# FluentEvent Developer Docs

Developer documentation for [FluentEvent](https://fluentevent.com/), the WordPress events plugin by WPManageNinja.

**Live site:** [dev.fluentevent.com](https://dev.fluentevent.com/)

## What's Inside

- **Database:** every table, column and index, the event post hybrid, and the ORM models.
- **Hooks:** every action and filter, with arguments, call sites, built-in listeners and an example.
- **REST API:** every endpoint, with its permissions, a recorded sample and an interactive playground.
- **Helpers:** the services and utilities that add-on code can call.
- **Guides:** public pages and blocks, emails and reminders, the FluentCommunity integration, and code snippets.

## Local Development

This repo is a git submodule of the FluentEvent plugin, at `fluent-event/dev-docs-repo`. The generator reads the plugin source one directory up.

```bash
yarn install
yarn docs:dev      # regenerate, then start the dev server
yarn docs:build    # regenerate, then build to .vitepress/dist
yarn docs:preview  # preview the build
```

`npm` works too (`npm install`, `npm run docs:dev`).

## Generated vs Hand-Written

`docs:dev` and `docs:build` regenerate the reference from the plugin source first. Everything under `docs/database/`, `docs/hooks/`, `docs/restapi/`, plus `docs/index.md`, `docs/getting-started.md`, `.generated/` and `public/openapi/` is deleted and rewritten on every run. Edit `scripts/generate-docs.mjs` or the prose in `data/`, never those files.

Hand-written pages live in `docs/guides/` and `docs/helpers/`.

REST samples are recorded from a running site. See [`scripts/capture/README.md`](scripts/capture/README.md).

## Tech Stack

- [VitePress](https://vitepress.dev/)
- [vitepress-openapi](https://github.com/enzonotario/vitepress-openapi) for the REST playground
- [Mermaid](https://mermaid.js.org/) for diagrams

## License

Copyright © 2026 WPManageNinja
