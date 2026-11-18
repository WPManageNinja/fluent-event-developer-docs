---
title: "Register Visitor (Portal)"
description: "Registers a logged-out visitor for an `open` event in the FluentCommunity portal, by name and email."
outline: false
aside: false
---

# Register Visitor (Portal)

Registers a logged-out visitor for an `open` event in the FluentCommunity portal, by name and email.

The `nonce` comes from the portal page (`fe_guest_register_<event id>`). The visitor is always `going` and cannot undo it. The confirmation email is queued.

An email that is already on the event is refused, and FluentEvent saves nothing and sends no email. The one exception is a row that said `not_going` and is linked to no WordPress user: it comes back to `going`, keeps its name, and fires [`fluent_event/guest/updated`](/hooks/actions/guests#fluent-event-guest-updated). A row linked to a user changes only from that member's account. A refused request answers HTTP 200 with `status: null`, a `refusal` of `already_registered` or `cancelled`, and a `message` that the portal shows as a warning.

When the event has a `capacity` and every seat is taken, the request is refused with 422.

## Endpoint

- **Method:** `POST`
- **Path:** `/fluent-event/v2/community/events/{id}/register-guest`
- **Controller:** `CommunityEventController@registerGuest`
- **Route source:** `fluent-event/app/Http/Routes/api.php:72`
- **Controller source:** `fluent-event/app/Http/Controllers/CommunityEventController.php:221`

## Permissions

- Logged-out visitors only, on a portal that is open to visitors. The handler also checks the per-event `nonce`.
- Rate limit: 5 requests per minute, counted per account for a logged-in user and per IP address for a visitor (`RateLimiter::isSpamming('register_guest')`). Actions that share a counter name share the limit across every event.

## Hooks Fired

- [`fluent_event/guest/created`](/hooks/actions/guests#fluent-event-guest-created)
- [`fluent_event/guest/updated`](/hooks/actions/guests#fluent-event-guest-updated)

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="registerVisitorCommunity" specUrl="/openapi/public/community/register-visitor-community.json" />
