---
title: "Update Calendar"
description: "Updates a calendar. Send the full calendar: every required field is validated again."
outline: false
aside: false
---

# Update Calendar

Updates a calendar. Send the full calendar: every required field is validated again.

## Endpoint

- **Method:** `PATCH`
- **Path:** `/fluent-event/v2/calendars/{id}`
- **Controller:** `CalendarController@updateCalendar`
- **Route source:** `fluent-event/app/Http/Routes/api.php:43`
- **Controller source:** `fluent-event/app/Http/Controllers/CalendarController.php:97`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

## Hooks Fired

- [`fluent_event/calendar/updated`](/hooks/actions/calendars#fluent-event-calendar-updated)

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="updateCalendar" specUrl="/openapi/public/calendars/update-calendar.json" />
