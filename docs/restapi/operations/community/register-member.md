---
title: "Register Member"
description: "Records a logged-in member's RSVP or registration for an event."
outline: false
aside: false
---

# Register Member

Records a logged-in member's RSVP or registration for an event.

`status` is `going` or `not_going` for both entry types. On an `open` event, `not_going` gives up a registration the member holds, and the member can register again later. `name` can replace the display name on an `open` event. Only an admin sets `cancelled`.

The member's existing row is reused, or a row an admin added under their email. When the member claims a row that a visitor made, the row takes the member's name in place of the name the visitor typed. The confirmation or cancellation email is queued when the seat changes.

**Going again.** `going` from a member who already holds a seat is refused. A row that an admin cancelled refuses both answers. A refused request answers HTTP 200 with `status: null`, a `refusal` of `already_registered` or `cancelled`, and a `message` for the member. Nothing is saved.

**Capacity.** When the event has a `capacity` and every seat is taken, `going` is refused with 422. This includes a `not_going` row that comes back. A guest who already holds a seat keeps it.

A success response carries `message`, `status`, and the event's current `online_meeting_url`, `guest_count`, `spots_left` and `is_full`, so the portal can redraw the event.

Errors: 404 when the event is not visible; 422 when the event does not take registrations, has ended or is full, the status is not allowed, the member gives up an `open` registration they do not hold, or another account holds the email; 409 when two requests changed the same registration at once.

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
