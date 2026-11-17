---
title: "Register Visitor (Event Page)"
description: "Registers anyone, logged in or not, for an `rsvp` or `open` event from its public page, by name and email."
outline: false
aside: false
---

# Register Visitor (Event Page)

Registers anyone, logged in or not, for an `rsvp` or `open` event from its public page, by name and email.

The public event page treats every viewer as a visitor. The registration is always `going` and cannot be undone from the page.

An email that is already on the event gets the same success response as a new registration. FluentEvent saves nothing and sends no email, so the form does not tell anyone who is registered.

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

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="registerVisitor" specUrl="/openapi/public/portal/register-visitor.json" />
