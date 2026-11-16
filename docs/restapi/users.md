---
title: "Users API"
description: "WordPress user lookup for the guest picker."
---

# Users API

WordPress user lookup for the guest picker.

## Authentication

- Every endpoint requires the `manage_options` capability. Send a cookie plus `X-WP-Nonce`, or use an Application Password.

## Endpoints

| Method | Path | Operation | What it does |
| --- | --- | --- | --- |
| `GET` | `/users` | [Search Users](/restapi/operations/users/search-users) | Searches WordPress users by login, email or display name, for the guest picker. |
