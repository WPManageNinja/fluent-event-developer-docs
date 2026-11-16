---
title: "Search Users"
description: "Searches WordPress users by login, email or display name, for the guest picker."
outline: false
aside: false
---

# Search Users

Searches WordPress users by login, email or display name, for the guest picker.

Returns at most 50 users, by display name.

## Endpoint

- **Method:** `GET`
- **Path:** `/fluent-event/v2/users`
- **Controller:** `UserController@getUsers`
- **Route source:** `fluent-event/app/Http/Routes/api.php:20`
- **Controller source:** `fluent-event/app/Http/Controllers/UserController.php:9`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="searchUsers" specUrl="/openapi/public/users/search-users.json" />
