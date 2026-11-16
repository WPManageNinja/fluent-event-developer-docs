---
title: "Create Guest"
description: "Adds a guest to an event by hand (`source = manual`)."
outline: false
aside: false
---

# Create Guest

Adds a guest to an event by hand (`source = manual`).

An email or WordPress user that is already on the event is refused with 422. With `send_email=true` and status `going`, the confirmation email is queued. The status defaults to `going`; `checked_in` also sets `checked_in_at`.

## Endpoint

- **Method:** `POST`
- **Path:** `/fluent-event/v2/events/{eventId}/guests`
- **Controller:** `GuestController@createGuest`
- **Route source:** `fluent-event/app/Http/Routes/api.php:62`
- **Controller source:** `fluent-event/app/Http/Controllers/GuestController.php:35`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

## Hooks Fired

- [`fluent_event/guest/created`](/hooks/actions/guests#fluent-event-guest-created)

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="createGuest" specUrl="/openapi/public/guests/create-guest.json" />
