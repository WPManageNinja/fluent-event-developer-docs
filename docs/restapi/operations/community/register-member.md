---
title: "Register Member"
description: "Records a logged-in member's RSVP or registration for an event."
outline: false
aside: false
---

# Register Member

Records a logged-in member's RSVP or registration for an event.

For an `rsvp` event, `status` is `going` or `not_going`. For an `open` event, `status` is `going` (register) or `cancelled` (cancel a registration the member holds); `name` can replace the display name.

The member's existing row is reused, or a row an admin added under their email. When the member claims a row that a visitor made, the row takes the member's name in place of the name the visitor typed. A checked-in guest who says going again stays checked in. The confirmation or cancellation email is queued when the seat changes.

Errors: 404 when the event is not visible; 422 when the event does not take registrations, has ended, the status is not allowed, or another account holds the email; 409 when two requests changed the same registration at once.

## Endpoint

- **Method:** `POST`
- **Path:** `/fluent-event/v2/community/events/{id}/register`
- **Controller:** `CommunityEventController@register`
- **Route source:** `fluent-event/app/Http/Routes/api.php:71`
- **Controller source:** `fluent-event/app/Http/Controllers/CommunityEventController.php:141`

## Permissions

- A logged-in WordPress user with portal access and an `active` community profile. The REST cookie nonce (`X-WP-Nonce`) is checked by WordPress.
- Rate limit: 10 requests per minute, counted per account for a logged-in user and per IP address for a visitor (`RateLimiter::isSpamming('rsvp')`). Actions that share a counter name share the limit across every event.

## Hooks Fired

- [`fluent_event/guest/created`](/hooks/actions/guests#fluent-event-guest-created)
- [`fluent_event/guest/updated`](/hooks/actions/guests#fluent-event-guest-updated)

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="registerMember" specUrl="/openapi/public/community/register-member.json" />
