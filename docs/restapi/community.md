---
title: "Community Portal API"
description: "Member-facing endpoints that the FluentCommunity portal uses: the events list, event lookup by slug, and registration."
---

# Community Portal API

Member-facing endpoints that the FluentCommunity portal uses: the events list, event lookup by slug, and registration.

## Authentication

- Follows FluentCommunity: the caller needs portal access, and the FluentEvent feature must be on in FluentCommunity. Event visibility follows the event's community post.

## Endpoints

| Method | Path | Operation | What it does |
| --- | --- | --- | --- |
| `GET` | `/community/events` | [List Community Events](/restapi/operations/community/list-community-events) | Returns the events the caller can see in the FluentCommunity portal, with their space and the caller's own status. |
| `GET` | `/community/events/by-slug` | [Get Community Event by Slug](/restapi/operations/community/get-community-event-by-slug) | Resolves a portal event URL (space slug + event slug) to the community post slug that shows it. |
| `POST` | `/community/events/{id}/register` | [Register Member](/restapi/operations/community/register-member) | Records a logged-in member's RSVP or registration for an event. |
| `POST` | `/community/events/{id}/register-guest` | [Register Visitor (Portal)](/restapi/operations/community/register-visitor-community) | Registers a logged-out visitor for an `open` event in the FluentCommunity portal, by name and email. |
