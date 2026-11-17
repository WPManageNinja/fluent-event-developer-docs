---
title: "Create Calendar"
description: "Creates a calendar. The current user becomes its creator."
outline: false
aside: false
---

# Create Calendar

Creates a calendar. The current user becomes its creator.

An empty `slug` is generated from the title. `theme_color` is stored in `meta`.

## Endpoint

- **Method:** `POST`
- **Path:** `/fluent-event/v2/calendars`
- **Controller:** `CalendarController@createCalendar`
- **Route source:** `fluent-event/app/Http/Routes/api.php:41`
- **Controller source:** `fluent-event/app/Http/Controllers/CalendarController.php:81`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

## Hooks Fired

- [`fluent_event/calendar/created`](/hooks/actions/calendars#fluent-event-calendar-created)

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="createCalendar" specUrl="/openapi/public/calendars/create-calendar.json" />
