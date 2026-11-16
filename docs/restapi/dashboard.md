---
title: "Dashboard API"
description: "Placeholder endpoint for the admin dashboard."
---

# Dashboard API

Placeholder endpoint for the admin dashboard.

## Authentication

- Every endpoint requires the `manage_options` capability. Send a cookie plus `X-WP-Nonce`, or use an Application Password.

## Endpoints

| Method | Path | Operation | What it does |
| --- | --- | --- | --- |
| `GET` | `/dashboard` | [Get Dashboard](/restapi/operations/dashboard/get-dashboard) | Returns a welcome message. The admin dashboard reads its numbers from Get Reports. |
