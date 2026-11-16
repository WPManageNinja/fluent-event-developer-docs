---
title: "Get Community Event by Slug"
description: "Resolves a portal event URL (space slug + event slug) to the community post slug that shows it."
outline: false
aside: false
---

# Get Community Event by Slug

Resolves a portal event URL (space slug + event slug) to the community post slug that shows it.

Returns 404 when the event is not visible to the caller or the space slug does not match. Send an empty `space` for an event posted outside any space.

## Endpoint

- **Method:** `GET`
- **Path:** `/fluent-event/v2/community/events/by-slug`
- **Controller:** `CommunityEventController@getEventBySlug`
- **Route source:** `fluent-event/app/Http/Routes/api.php:71`
- **Controller source:** `fluent-event/app/Http/Controllers/CommunityEventController.php:118`

## Permissions

- Open to anyone FluentCommunity lets into its portal, logged in or not, while the FluentEvent feature is on in FluentCommunity. A member whose community profile is not `active` is refused. Each event is then shown only if its community post is visible to the caller.

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="getCommunityEventBySlug" specUrl="/openapi/public/community/get-community-event-by-slug.json" />
