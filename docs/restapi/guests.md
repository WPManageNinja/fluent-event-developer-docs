---
title: "Guests API"
description: "List, add, edit and remove the guests of one event. A guest row is one person on one event."
---

# Guests API

List, add, edit and remove the guests of one event. A guest row is one person on one event.

## Authentication

- Every endpoint requires the `manage_options` capability. Send a cookie plus `X-WP-Nonce`, or use an Application Password.

## Endpoints

| Method | Path | Operation | What it does |
| --- | --- | --- | --- |
| `GET` | `/events/{eventId}/guests` | [List Guests](/restapi/operations/guests/list-guests) | Returns the guests of one event, paginated, with a count per status for the tabs. |
| `POST` | `/events/{eventId}/guests` | [Create Guest](/restapi/operations/guests/create-guest) | Adds a guest to an event by hand (`source = manual`). |
| `PATCH` | `/events/{eventId}/guests/{guestId}` | [Update Guest](/restapi/operations/guests/update-guest) | Changes a guest. Fields you leave out keep their values. |
| `DELETE` | `/events/{eventId}/guests/{guestId}` | [Delete Guest](/restapi/operations/guests/delete-guest) | Removes a guest from an event. |
