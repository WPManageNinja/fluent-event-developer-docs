---
title: "Create Event"
description: "Creates an event: the `fe_event` post and its `fe_event_details` row, in one transaction."
outline: false
aside: false
---

# Create Event

Creates an event: the `fe_event` post and its `fe_event_details` row, in one transaction.

Send `start_at` and `end_at` as local date-times (`Y-m-d H:i:s`) in `timezone`. An empty or invalid `timezone` falls back to the site's. `end_at` must be after `start_at`.

`online_meeting_url` is required when `venue_type` is `online`; `venue` and `address` are cleared for an online event, and `online_meeting_url` for an offline one. Reminder emails are queued for the new event.

## Endpoint

- **Method:** `POST`
- **Path:** `/fluent-event/v2/events`
- **Controller:** `EventController@createEvent`
- **Route source:** `fluent-event/app/Http/Routes/api.php:56`
- **Controller source:** `fluent-event/app/Http/Controllers/EventController.php:104`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

## Hooks Fired

- [`fluent_event/event/created`](/hooks/actions/events#fluent-event-event-created)

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="createEvent" specUrl="/openapi/public/events/create-event.json" />
