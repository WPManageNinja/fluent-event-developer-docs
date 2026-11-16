---
title: "Register Visitor (Portal)"
description: "Registers a logged-out visitor for an `open` event in the FluentCommunity portal, by name and email."
outline: false
aside: false
---

# Register Visitor (Portal)

Registers a logged-out visitor for an `open` event in the FluentCommunity portal, by name and email.

The `nonce` comes from the portal page (`fe_guest_register_<event id>`). The visitor is always `going` and cannot undo it. The confirmation email is queued.

## Endpoint

- **Method:** `POST`
- **Path:** `/fluent-event/v2/community/events/{id}/register-guest`
- **Controller:** `CommunityEventController@registerGuest`
- **Route source:** `fluent-event/app/Http/Routes/api.php:74`
- **Controller source:** `fluent-event/app/Http/Controllers/CommunityEventController.php:213`

## Permissions

- Logged-out visitors only, on a portal that is open to visitors. The handler also checks the per-event `nonce`.
- Rate limit: 5 requests per minute, counted per account for a logged-in user and per IP address for a visitor (`Throttle` middleware).

## Hooks Fired

- [`fluent_event/guest/created`](/hooks/actions/guests#fluent-event-guest-created)

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="registerVisitorCommunity" specUrl="/openapi/public/community/register-visitor-community.json" />
