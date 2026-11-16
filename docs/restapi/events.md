---
title: "Events API"
description: "Create, read, update and delete events. An event is a `fe_event` post plus its `fe_event_details` row, written together."
---

# Events API

Create, read, update and delete events. An event is a `fe_event` post plus its `fe_event_details` row, written together.

## Authentication

- Every endpoint requires the `manage_options` capability. Send a cookie plus `X-WP-Nonce`, or use an Application Password.

## Endpoints

| Method | Path | Operation | What it does |
| --- | --- | --- | --- |
| `GET` | `/events` | [List Events](/restapi/operations/events/list-events) | Returns events with their post title, calendar and guest count, filtered and paginated, for the admin events list and calendar grid. |
| `GET` | `/events/by-slug` | [Get Event by Slug](/restapi/operations/events/get-event-by-slug) | Returns one event, looked up by its post slug, in the same shape as Get Event. |
| `GET` | `/events/{id}` | [Get Event](/restapi/operations/events/get-event) | Returns one event with its description, post, calendar and guest count, plus its public URL. |
| `POST` | `/events` | [Create Event](/restapi/operations/events/create-event) | Creates an event: the `fe_event` post and its `fe_event_details` row, in one transaction. |
| `PATCH` | `/events/{id}` | [Update Event](/restapi/operations/events/update-event) | Updates an event and its post. Send the full event: every required field is validated again. |
| `DELETE` | `/events/{id}` | [Delete Event](/restapi/operations/events/delete-event) | Deletes an event with its post, guests, meta and queued reminders. |
