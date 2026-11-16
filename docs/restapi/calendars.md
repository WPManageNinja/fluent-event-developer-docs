---
title: "Calendars API"
description: "Create and manage calendars, the containers that hold events."
---

# Calendars API

Create and manage calendars, the containers that hold events.

## Authentication

- Every endpoint requires the `manage_options` capability. Send a cookie plus `X-WP-Nonce`, or use an Application Password.

## Endpoints

| Method | Path | Operation | What it does |
| --- | --- | --- | --- |
| `GET` | `/calendars` | [List Calendars](/restapi/operations/calendars/list-calendars) | Returns every calendar with its event and guest counts, plus a count per status for the tabs. |
| `GET` | `/calendars/options` | [List Calendar Options](/restapi/operations/calendars/list-calendar-options) | Returns calendars as dropdown options: ID, title, status and meta only, with no counts. |
| `GET` | `/calendars/{id}` | [Get Calendar](/restapi/operations/calendars/get-calendar) | Returns one calendar with its creator's name and its event and guest totals. |
| `POST` | `/calendars` | [Create Calendar](/restapi/operations/calendars/create-calendar) | Creates a calendar. The current user becomes its creator. |
| `PATCH` | `/calendars/{id}` | [Update Calendar](/restapi/operations/calendars/update-calendar) | Updates a calendar. Send the full calendar: every required field is validated again. |
| `DELETE` | `/calendars/{id}` | [Delete Calendar](/restapi/operations/calendars/delete-calendar) | Deletes a calendar and every event in it, with their guests. |
