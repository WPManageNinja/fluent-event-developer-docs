---
title: "Delete Calendar"
description: "Deletes a calendar and every event in it, with their guests."
outline: false
aside: false
---

# Delete Calendar

Deletes a calendar and every event in it, with their guests.

Each event is deleted on its own and fires its own delete hooks. This cannot be undone.

## Endpoint

- **Method:** `DELETE`
- **Path:** `/fluent-event/v2/calendars/{id}`
- **Controller:** `CalendarController@deleteCalendar`
- **Route source:** `fluent-event/app/Http/Routes/api.php:43`
- **Controller source:** `fluent-event/app/Http/Controllers/CalendarController.php:119`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

## Hooks Fired

- [`fluent_event/calendar/before_deleted`](/hooks/actions/calendars#fluent-event-calendar-before-deleted)
- [`fluent_event/calendar/deleted`](/hooks/actions/calendars#fluent-event-calendar-deleted)

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="deleteCalendar" specUrl="/openapi/public/calendars/delete-calendar.json" />
