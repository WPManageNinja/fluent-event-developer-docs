---
title: "Get Event by Slug"
description: "Returns one event, looked up by its post slug, in the same shape as Get Event."
outline: false
aside: false
---

# Get Event by Slug

Returns one event, looked up by its post slug, in the same shape as Get Event.

The FluentCommunity portal edit page addresses events by slug. An unknown slug returns 404.

## Endpoint

- **Method:** `GET`
- **Path:** `/fluent-event/v2/events/by-slug`
- **Controller:** `EventController@getEventBySlug`
- **Route source:** `fluent-event/app/Http/Routes/api.php:53`
- **Controller source:** `fluent-event/app/Http/Controllers/EventController.php:93`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="getEventBySlug" specUrl="/openapi/public/events/get-event-by-slug.json" />
