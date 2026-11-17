---
title: "List Calendars"
description: "Returns every calendar with its event and guest counts, plus a count per status for the tabs."
outline: false
aside: false
---

# List Calendars

Returns every calendar with its event and guest counts, plus a count per status for the tabs.

Not paginated. `counts` ignores the `status` filter and follows `search`, so the tabs always show every status.

## Endpoint

- **Method:** `GET`
- **Path:** `/fluent-event/v2/calendars`
- **Controller:** `CalendarController@getAllCalendars`
- **Route source:** `fluent-event/app/Http/Routes/api.php:37`
- **Controller source:** `fluent-event/app/Http/Controllers/CalendarController.php:12`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

## Hooks Fired

- [`fluent_event/calendars_api_response`](/hooks/filters/calendars#fluent-event-calendars-api-response)

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="listCalendars" specUrl="/openapi/public/calendars/list-calendars.json" />
