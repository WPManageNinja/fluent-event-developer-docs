---
title: "List Community Events"
description: "Returns the events the caller can see in the FluentCommunity portal, with their space and the caller's own status."
outline: false
aside: false
---

# List Community Events

Returns the events the caller can see in the FluentCommunity portal, with their space and the caller's own status.

An event appears when its community post is published, its author's profile is active, and the caller can see the post's space (or, for an event outside any space, can see the portal feed). Draft events never appear.

With a `from`/`to` window of at most 62 days and `paginate=false`, every event in the window comes back in one page.

## Endpoint

- **Method:** `GET`
- **Path:** `/fluent-event/v2/community/events`
- **Controller:** `CommunityEventController@getEvents`
- **Route source:** `fluent-event/app/Http/Routes/api.php:69`
- **Controller source:** `fluent-event/app/Http/Controllers/CommunityEventController.php:26`

## Permissions

- Open to anyone FluentCommunity lets into its portal, logged in or not, while the FluentEvent feature is on in FluentCommunity. A member whose community profile is not `active` is refused. Each event is then shown only if its community post is visible to the caller.

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="listCommunityEvents" specUrl="/openapi/public/community/list-community-events.json" />
