---
title: "Register Visitor (Event Page)"
description: "Registers anyone, logged in or not, for an `rsvp` or `open` event from its public page, by name and email."
outline: false
aside: false
---

# Register Visitor (Event Page)

Registers anyone, logged in or not, for an `rsvp` or `open` event from its public page, by name and email.

The public event page treats every viewer as a visitor. The registration is always `going` and cannot be undone from the page.

An email that is already on the event is refused, and FluentEvent saves nothing and sends no email. The one exception is a row that said `not_going` and is linked to no WordPress user: it comes back to `going`, keeps its name, and fires [`fluent_event/guest/updated`](/hooks/actions/guests#fluent-event-guest-updated). A row linked to a user changes only from that member's account. A refused request answers HTTP 200 with `status: null` and a `message`, and its `html` card opens a warning: the email is already registered, or the host cancelled the registration.

When the event has a `capacity` and every seat is taken, the request is refused with 422, and the page shows the event as full.

The `nonce` (`fe_portal_register_<event id>`) is checked **before** the event is looked up, so walking IDs cannot find unlisted events. The event must be `public` or `unlisted`, in a `public` calendar. The response carries `html`: the event's side card, drawn for the new state, which the page swaps in.

## Endpoint

- **Method:** `POST`
- **Path:** `/fluent-event/v2/portal/events/{id}/register-guest`
- **Controller:** `PortalEventController@registerGuest`
- **Route source:** `fluent-event/app/Http/Routes/api.php:77`
- **Controller source:** `fluent-event/app/Http/Controllers/PortalEventController.php:21`

## Permissions

- Public: anyone who can see the event page, logged in or not, is treated as a visitor. The handler checks the per-event `nonce` before it looks the event up.
- Rate limit: 5 requests per minute, counted per account for a logged-in user and per IP address for a visitor (`RateLimiter::isSpamming('register_guest')`). Actions that share a counter name share the limit across every event.

## Hooks Fired

- [`fluent_event/guest/created`](/hooks/actions/guests#fluent-event-guest-created)
- [`fluent_event/guest/updated`](/hooks/actions/guests#fluent-event-guest-updated)

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="registerVisitor" specUrl="/openapi/public/portal/register-visitor.json" />
