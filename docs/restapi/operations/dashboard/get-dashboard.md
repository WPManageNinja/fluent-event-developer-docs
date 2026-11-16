---
title: "Get Dashboard"
description: "Returns a welcome message. The admin dashboard reads its numbers from Get Reports."
outline: false
aside: false
---

# Get Dashboard

Returns a welcome message. The admin dashboard reads its numbers from Get Reports.

## Endpoint

- **Method:** `GET`
- **Path:** `/fluent-event/v2/dashboard`
- **Controller:** `DashboardController@get`
- **Route source:** `fluent-event/app/Http/Routes/api.php:16`
- **Controller source:** `fluent-event/app/Http/Controllers/DashboardController.php:18`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="getDashboard" specUrl="/openapi/public/dashboard/get-dashboard.json" />
