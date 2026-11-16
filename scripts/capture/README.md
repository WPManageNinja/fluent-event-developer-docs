# REST Response Capture

The REST samples in the docs are recorded from a running FluentEvent site, not written by hand. This harness calls every endpoint once against a throwaway sandbox, anonymises the responses, and writes `data/response-examples.json`. The generator uses each sample as the OpenAPI example **and** derives the response schema from it.

## Files

| File | Role |
| --- | --- |
| `capture.php` | Sends internal REST requests and saves each raw response to `<out>/<module>/<slug>.json`. |
| `capture-plan.php` | The ordered plan: build the sandbox, call each endpoint, tear the sandbox down. |
| `teardown.php` | Removes every sandbox row. Safe to run on its own and to run again. |
| `mute.php` | Optional: mutes broken third-party plugins for the run (`FE_CAPTURE_MUTE`). |
| `anonymize.mjs` | Turns the raw capture into `data/response-examples.json`. |

## Run It

Use a **development site** with FluentEvent active (and FluentCommunity with the FluentEvent feature on, for the community endpoints). The plan creates and deletes users, calendars, events, guests, a page and two community posts.

```bash
cd /path/to/wordpress
FE_CAPTURE_OUT=/tmp/fe-capture wp eval-file wp-content/plugins/fluent-event/dev-docs-repo/scripts/capture/capture.php

cd wp-content/plugins/fluent-event/dev-docs-repo
node scripts/capture/anonymize.mjs /tmp/fe-capture
npm run generate:docs
```

Options:

- `FE_CAPTURE_ONLY=events/` runs only the operations whose slug starts with that prefix.
- `FE_CAPTURE_MUTE=SolidAffiliate,OtherVendor` removes hook callbacks of those PHP namespaces for the run. Use it when a plugin on the dev site fatals inside `wp_delete_post()` because its own dependency is inactive.

The run prints one line per request and a summary. Every operation should be `2xx`; a failure is saved under `<out>/_failures/`.

## How It Works

- **Sandbox.** Every row the plan creates is named `Docs Sandbox …` (users: `docs-sandbox-…`). `teardown.php` finds rows by that name, at the start of a run and at the end. Deletes go through the plugin's own hooks, so guests, meta and queued reminders go too.
- **Settings.** Each settings write is a round trip; the stored values are put back afterwards, and the reminder queue is rebuilt for them.
- **Mail.** `wp_mail()` is short-circuited for the run, and teardown unschedules the confirmation and cancellation jobs the sandbox queued.
- **Request isolation.** The WPFluent `Request` is a container singleton, and each route merges its params into it. In one PHP process that leaks parameters from one call into the next, so `capture.php` clears it (for FluentEvent and FluentCommunity) before every request. Do not remove that reset.
- **Visitors.** Nonces are bound to the user, so the plan creates the visitor nonces while logged out.

## Anonymisation

The sandbox people are fictional (`@example.com`). `anonymize.mjs` still:

- replaces the site's host with `https://yourwebsite.com` and any other host with `https://example.com` (gravatar and `example.com` stay);
- strips the `Docs Sandbox ` / `docs-sandbox-` prefixes;
- replaces the titles, calendars, venues, addresses and covers of events that were already on the site, from a fixed corpus;
- replaces nonces, including those printed into HTML;
- cuts lists to 3 items and strings to 1,500 characters.

It exits with an error if the site host or the sandbox prefix survives. Before committing, scan once more:

```bash
grep -oiE 'sandbox|\.test\b|localhost' data/response-examples.json
```

## Hand-Written Samples

`data/manual-examples.json` holds samples for endpoints the harness cannot record. It is empty today: every endpoint is recorded. Use the same shape as `response-examples.json` (`modules.<module>.<slug>`), plus a `reason`.
