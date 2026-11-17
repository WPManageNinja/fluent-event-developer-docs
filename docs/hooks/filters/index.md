---
title: "Filters Hooks"
description: "Every FluentEvent filter hook, grouped by area."
---

# Filters Hooks

Filters let your code change a value before FluentEvent uses it: an API response, a length limit, a route path. FluentEvent has 11 filter hooks. Always return a value of the same type you receive.

Every hook name starts with `fluent_event/`. Nouns and verbs are separated by `/`: `fluent_event/<noun>/<verb>` for lifecycle actions, `fluent_event/<noun>_api_response` for response filters.

## Pages

| Page | Hooks |
| --- | --- |
| [Events](/hooks/filters/events) | 3 |
| [Calendars](/hooks/filters/calendars) | 3 |
| [FluentCommunity](/hooks/filters/community) | 1 |
| [System](/hooks/filters/system) | 4 |

## All Filters

| Hook | Page | Description |
| --- | --- | --- |
| [`fluent_event/admin_base_url`](/hooks/filters/system#fluent-event-admin-base-url) | System | Filters the base URL of the FluentEvent admin app. |
| [`fluent_event/calendar_api_response`](/hooks/filters/calendars#fluent-event-calendar-api-response) | Calendars | Filters one calendar's admin payload before it is returned. |
| [`fluent_event/calendar_title_max_length`](/hooks/filters/calendars#fluent-event-calendar-title-max-length) | Calendars | Filters the longest calendar title accepted, in characters. |
| [`fluent_event/calendars_api_response`](/hooks/filters/calendars#fluent-event-calendars-api-response) | Calendars | Filters the admin calendars list before it is returned. |
| [`fluent_event/cloudflare_ip_ranges`](/hooks/filters/system#fluent-event-cloudflare-ip-ranges) | System | Filters the Cloudflare IP ranges. A request from one of them supplies the visitor IP address in `CF-Connecting-IP`. |
| [`fluent_event/community/route_paths`](/hooks/filters/community#fluent-event-community-route-paths) | FluentCommunity | Filters the FluentCommunity portal routes that FluentEvent adds. |
| [`fluent_event/event_api_response`](/hooks/filters/events#fluent-event-event-api-response) | Events | Filters one event before the admin editor or the portal edit page loads it. |
| [`fluent_event/event_venue_max_length`](/hooks/filters/events#fluent-event-event-venue-max-length) | Events | Filters the longest venue name an event accepts, in characters. |
| [`fluent_event/events_api_response`](/hooks/filters/events#fluent-event-events-api-response) | Events | Filters the admin events list before it is returned. |
| [`fluent_event/is_rtl`](/hooks/filters/system#fluent-event-is-rtl) | System | Filters whether FluentEvent loads the right-to-left versions of its stylesheets. |
| [`fluent_event/trusted_proxies`](/hooks/filters/system#fluent-event-trusted-proxies) | System | Filters the reverse proxies whose `X-Forwarded-For` header FluentEvent believes when it finds the visitor IP address. |

## Before You Filter

- **Return the same type you receive.** The admin app reads the response filters directly, so a missing key breaks the screen.
- **Response filters run on admin requests only.** The `*_api_response` filters wrap the `manage_options` endpoints, not the public pages.
