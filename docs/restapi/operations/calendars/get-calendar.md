---
title: "Get Calendar"
description: "Returns one calendar with its creator's name and its event and guest totals."
outline: false
aside: false
---

# Get Calendar

Returns one calendar with its creator's name and its event and guest totals.

## Endpoint

- **Method:** `GET`
- **Path:** `/fluent-event/v2/calendars/{id}`
- **Controller:** `CalendarController@getCalendar`
- **Route source:** `fluent-event/app/Http/Routes/api.php:40`
- **Controller source:** `fluent-event/app/Http/Controllers/CalendarController.php:60`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

## Hooks Fired

- [`fluent_event/calendar_api_response`](/hooks/filters/calendars#fluent-event-calendar-api-response)

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="getCalendar" specUrl="/openapi/public/calendars/get-calendar.json" />
