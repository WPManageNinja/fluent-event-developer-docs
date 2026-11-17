---
title: "Delete Guest"
description: "Removes a guest from an event."
outline: false
aside: false
---

# Delete Guest

Removes a guest from an event.

With `send_email=true` and a guest who held a seat (`going` or `checked_in`), the cancellation email is sent right away, during the request.

## Endpoint

- **Method:** `DELETE`
- **Path:** `/fluent-event/v2/events/{eventId}/guests/{guestId}`
- **Controller:** `GuestController@deleteGuest`
- **Route source:** `fluent-event/app/Http/Routes/api.php:64`
- **Controller source:** `fluent-event/app/Http/Controllers/GuestController.php:115`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

## Hooks Fired

- [`fluent_event/guest/before_deleted`](/hooks/actions/guests#fluent-event-guest-before-deleted)
- [`fluent_event/guest/deleted`](/hooks/actions/guests#fluent-event-guest-deleted)

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="deleteGuest" specUrl="/openapi/public/guests/delete-guest.json" />
