---
title: "List Events"
description: "Returns events with their post title, calendar and guest count, filtered and paginated, for the admin events list and calendar grid."
outline: false
aside: false
---

# List Events

Returns events with their post title, calendar and guest count, filtered and paginated, for the admin events list and calendar grid.

Each event carries `guests_count`: every guest row of the event, whatever its status. Results are sorted by `period`. With both `start_date` and `end_date` set to a window of at most 62 days and `paginate=false`, the endpoint returns every event in the window as a plain list, which is what the calendar grid uses. Any other request is paginated. Pagination follows the WPFluent paginator: the response has `data`, `total`, `per_page`, `current_page`, `last_page` and the page URLs.

## Endpoint

- **Method:** `GET`
- **Path:** `/fluent-event/v2/events`
- **Controller:** `EventController@getAllEvents`
- **Route source:** `fluent-event/app/Http/Routes/api.php:53`
- **Controller source:** `fluent-event/app/Http/Controllers/EventController.php:18`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

## Hooks Fired

- [`fluent_event/events_api_response`](/hooks/filters/events#fluent-event-events-api-response)

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="listEvents" specUrl="/openapi/public/events/list-events.json" />
