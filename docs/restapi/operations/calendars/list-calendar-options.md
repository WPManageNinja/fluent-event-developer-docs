---
title: "List Calendar Options"
description: "Returns calendars as dropdown options: ID, title, status and meta only, with no counts."
outline: false
aside: false
---

# List Calendar Options

Returns calendars as dropdown options: ID, title, status and meta only, with no counts.

## Endpoint

- **Method:** `GET`
- **Path:** `/fluent-event/v2/calendars/options`
- **Controller:** `CalendarController@getCalendarOptions`
- **Route source:** `fluent-event/app/Http/Routes/api.php:38`
- **Controller source:** `fluent-event/app/Http/Controllers/CalendarController.php:46`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="listCalendarOptions" specUrl="/openapi/public/calendars/list-calendar-options.json" />
