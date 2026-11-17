---
title: "Delete Event"
description: "Deletes an event with its post, guests, meta and queued reminders."
outline: false
aside: false
---

# Delete Event

Deletes an event with its post, guests, meta and queued reminders.

The delete runs in a transaction around [`fluent_event/event/before_deleted`](/hooks/actions/events#fluent-event-event-before-deleted). If a listener throws, or the post cannot be deleted, nothing is removed and the API returns the error. No emails are sent to the guests.

## Endpoint

- **Method:** `DELETE`
- **Path:** `/fluent-event/v2/events/{id}`
- **Controller:** `EventController@deleteEvent`
- **Route source:** `fluent-event/app/Http/Routes/api.php:58`
- **Controller source:** `fluent-event/app/Http/Controllers/EventController.php:168`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

## Hooks Fired

- [`fluent_event/event/before_deleted`](/hooks/actions/events#fluent-event-event-before-deleted)
- [`fluent_event/event/deleted`](/hooks/actions/events#fluent-event-event-deleted)

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="deleteEvent" specUrl="/openapi/public/events/delete-event.json" />
