---
title: "Get Event"
description: "Returns one event with its description, post, calendar and guest count, plus its public URL and shortcode."
outline: false
aside: false
---

# Get Event

Returns one event with its description, post, calendar and guest count, plus its public URL and shortcode.

`event.description` is the rendered HTML; `event.meta.description_md` is the Markdown the editor shows. `event.guests_count` counts every guest row, whatever its status, as the events list does. `shortcode` shows the event on any page, for example `[fluent_event event="spring-meetup"]`.

## Endpoint

- **Method:** `GET`
- **Path:** `/fluent-event/v2/events/{id}`
- **Controller:** `EventController@getEvent`
- **Route source:** `fluent-event/app/Http/Routes/api.php:54`
- **Controller source:** `fluent-event/app/Http/Controllers/EventController.php:62`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

## Hooks Fired

- [`fluent_event/event_api_response`](/hooks/filters/events#fluent-event-event-api-response)

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="getEvent" specUrl="/openapi/public/events/get-event.json" />
