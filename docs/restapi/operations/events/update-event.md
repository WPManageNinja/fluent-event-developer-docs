---
title: "Update Event"
description: "Updates an event and its post. Send the full event: every required field is validated again."
outline: false
aside: false
---

# Update Event

Updates an event and its post. Send the full event: every required field is validated again.

When `calendar_id` changes, every guest row moves with the event and [`fluent_event/event/calendar_changed`](/hooks/actions/events#fluent-event-event-calendar-changed) fires. When `start_at` changes, the reminder emails are rescheduled and sent again for the new time. Keys of `meta` you leave out keep their stored values.

## Endpoint

- **Method:** `PATCH`
- **Path:** `/fluent-event/v2/events/{id}`
- **Controller:** `EventController@updateEvent`
- **Route source:** `fluent-event/app/Http/Routes/api.php:57`
- **Controller source:** `fluent-event/app/Http/Controllers/EventController.php:120`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

## Hooks Fired

- [`fluent_event/event/calendar_changed`](/hooks/actions/events#fluent-event-event-calendar-changed)
- [`fluent_event/event/updated`](/hooks/actions/events#fluent-event-event-updated)

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="updateEvent" specUrl="/openapi/public/events/update-event.json" />
