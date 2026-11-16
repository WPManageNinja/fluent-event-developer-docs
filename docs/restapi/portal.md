---
title: "Public Event Page API"
description: "Registration from the public event page that WordPress serves at `/<event_slug>/<post_slug>/`."
---

# Public Event Page API

Registration from the public event page that WordPress serves at `/<event_slug>/<post_slug>/`.

## Authentication

- Public. Each request carries a nonce that only the event page hands out.

## Endpoints

| Method | Path | Operation | What it does |
| --- | --- | --- | --- |
| `POST` | `/portal/events/{id}/register-guest` | [Register Visitor (Event Page)](/restapi/operations/portal/register-visitor) | Registers anyone, logged in or not, for an `rsvp` or `open` event from its public page, by name and email. |
