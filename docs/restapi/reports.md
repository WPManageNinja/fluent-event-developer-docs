---
title: "Reports API"
description: "Dashboard numbers: totals, ongoing and upcoming events, top events and the guest trend chart."
---

# Reports API

Dashboard numbers: totals, ongoing and upcoming events, top events and the guest trend chart.

## Authentication

- Every endpoint requires the `manage_options` capability. Send a cookie plus `X-WP-Nonce`, or use an Application Password.

## Endpoints

| Method | Path | Operation | What it does |
| --- | --- | --- | --- |
| `GET` | `/reports` | [Get Reports](/restapi/operations/reports/get-reports) | Returns the dashboard tiles (event and guest totals) with ongoing, upcoming and top events. |
| `GET` | `/reports/guest-trends` | [Get Guest Trends](/restapi/operations/reports/get-guest-trends) | Returns new guests per day, or per month for ranges longer than 92 days, ready for a chart. |
