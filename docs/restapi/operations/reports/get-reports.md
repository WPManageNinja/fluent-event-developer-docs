---
title: "Get Reports"
description: "Returns the dashboard tiles (event and guest totals) with ongoing, upcoming and top events."
outline: false
aside: false
---

# Get Reports

Returns the dashboard tiles (event and guest totals) with ongoing, upcoming and top events.

Totals count every event, drafts included. Top events rank by guests who hold a seat.

## Endpoint

- **Method:** `GET`
- **Path:** `/fluent-event/v2/reports`
- **Controller:** `ReportController@getReports`
- **Route source:** `fluent-event/app/Http/Routes/api.php:47`
- **Controller source:** `fluent-event/app/Http/Controllers/ReportController.php:11`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="getReports" specUrl="/openapi/public/reports/get-reports.json" />
