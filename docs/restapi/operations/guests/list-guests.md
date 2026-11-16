---
title: "List Guests"
description: "Returns the guests of one event, paginated, with a count per status for the tabs."
outline: false
aside: false
---

# List Guests

Returns the guests of one event, paginated, with a count per status for the tabs.

`counts` has `all` plus one key per status, each matching the current `search`. A status with no guests still reads 0. Pagination follows the WPFluent paginator: the response has `data`, `total`, `per_page`, `current_page`, `last_page` and the page URLs.

## Endpoint

- **Method:** `GET`
- **Path:** `/fluent-event/v2/events/{eventId}/guests`
- **Controller:** `GuestController@getGuests`
- **Route source:** `fluent-event/app/Http/Routes/api.php:61`
- **Controller source:** `fluent-event/app/Http/Controllers/GuestController.php:14`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="listGuests" specUrl="/openapi/public/guests/list-guests.json" />
