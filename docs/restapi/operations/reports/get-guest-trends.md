---
title: "Get Guest Trends"
description: "Returns new guests per day, or per month for ranges longer than 92 days, ready for a chart."
outline: false
aside: false
---

# Get Guest Trends

Returns new guests per day, or per month for ranges longer than 92 days, ready for a chart.

Without dates, the range is the last 7 days. Reversed dates are swapped.

## Endpoint

- **Method:** `GET`
- **Path:** `/fluent-event/v2/reports/guest-trends`
- **Controller:** `ReportController@getGuestTrends`
- **Route source:** `fluent-event/app/Http/Routes/api.php:49`
- **Controller source:** `fluent-event/app/Http/Controllers/ReportController.php:22`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="getGuestTrends" specUrl="/openapi/public/reports/get-guest-trends.json" />
