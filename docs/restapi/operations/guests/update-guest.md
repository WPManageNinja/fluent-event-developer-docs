---
title: "Update Guest"
description: "Changes a guest. Fields you leave out keep their values."
outline: false
aside: false
---

# Update Guest

Changes a guest. Fields you leave out keep their values.

Send `user_id: null` to unlink a WordPress user. Moving to `checked_in` stamps `checked_in_at` (kept if already set); leaving it clears it. With `send_email=true` and a status change, a move to `going` queues the confirmation email and a move to `not_going` or `cancelled` queues the cancellation email.

## Endpoint

- **Method:** `PATCH`
- **Path:** `/fluent-event/v2/events/{eventId}/guests/{guestId}`
- **Controller:** `GuestController@updateGuest`
- **Route source:** `fluent-event/app/Http/Routes/api.php:62`
- **Controller source:** `fluent-event/app/Http/Controllers/GuestController.php:69`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

## Hooks Fired

- [`fluent_event/guest/updated`](/hooks/actions/guests#fluent-event-guest-updated)

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="updateGuest" specUrl="/openapi/public/guests/update-guest.json" />
