---
title: "REST API"
description: "Authentication, conventions and the full endpoint list for the FluentEvent REST API (fluent-event/v2)."
---

# REST API

FluentEvent registers 34 endpoints under the `fluent-event/v2` namespace:

```
https://yourwebsite.com/wp-json/fluent-event/v2/
```

The admin app in wp-admin uses the **Admin API**. The FluentCommunity portal and the public event page use the **Front-End API**.

## Authentication

Every Admin API endpoint requires the `manage_options` capability. There are two ways to authenticate:

- **Cookie + nonce.** In the browser, as a logged-in administrator, send the `X-WP-Nonce` header with a nonce from `wp_create_nonce('wp_rest')`. This is what the admin app does.
- **Application Passwords.** For server-to-server calls, create an Application Password under **Users → Profile** and send it with HTTP Basic auth.

```bash
curl -u "admin:abcd efgh ijkl mnop qrst uvwx" \
  "https://yourwebsite.com/wp-json/fluent-event/v2/events?per_page=5"
```

The Front-End API follows the visitor: the community endpoints use FluentCommunity's portal access rules, and the public event page's registration endpoint is open to anyone with the page's nonce.

## Conventions

- **Request bodies** are JSON (`Content-Type: application/json`) or form fields. Both reach the same validation.
- **Success** returns HTTP 200 with the payload object. Writes include a `message` you can show to the user.
- **Validation errors** return HTTP 422: `{ "message": "...", "errors": { "field": { "rule": "message" } } }`.
- **Missing records** return HTTP 404 from `findOrFail()`.
- **Dates** you send (`start_at`, `end_at`) are local times in the event's `timezone`. FluentEvent stores them in UTC. Responses carry both: `start_at` (UTC), `start_at_local` (event time zone) and `start_at_site` (site time zone).
- **Partial updates.** `PATCH /events/{id}` and `PATCH /calendars/{id}` validate the full record, so send every required field. `PATCH` on a guest is partial.
- **Method override.** If your server blocks `PATCH` or `DELETE`, send `POST` with an `X-HTTP-Method-Override` header.

## Rate Limits

The registration endpoints limit how often one caller can send them. FluentEvent counts a logged-in user by account and a visitor by IP address (an IPv6 address by its /64 network). The limit holds over any 60 seconds, not per clock minute, and refused requests count too.

| Endpoint | Limit per minute | Counter |
| --- | --- | --- |
| Register Member | 10 | `rsvp` |
| Register Visitor (Portal) and Register Visitor (Event Page) | 5 | `register_guest`, shared by both |

The counter is shared across every event, so a new event ID gives no new allowance. Over the limit, the API answers HTTP 429. Behind a reverse proxy, add the proxy with [`fluent_event/trusted_proxies`](/hooks/filters/system#fluent-event-trusted-proxies) so that each visitor is counted by their own address.

## Interactive Playground

Every operation page has a playground. Enter your site's domain and `username:application_password`, then send the request. Use a staging site for anything that writes.

## Endpoints

### Admin API

| Method | Path | Operation |
| --- | --- | --- |
| `GET` | `/events` | [List Events](/restapi/operations/events/list-events) |
| `GET` | `/events/by-slug` | [Get Event by Slug](/restapi/operations/events/get-event-by-slug) |
| `GET` | `/events/{id}` | [Get Event](/restapi/operations/events/get-event) |
| `POST` | `/events` | [Create Event](/restapi/operations/events/create-event) |
| `PATCH` | `/events/{id}` | [Update Event](/restapi/operations/events/update-event) |
| `DELETE` | `/events/{id}` | [Delete Event](/restapi/operations/events/delete-event) |
| `GET` | `/events/{eventId}/guests` | [List Guests](/restapi/operations/guests/list-guests) |
| `POST` | `/events/{eventId}/guests` | [Create Guest](/restapi/operations/guests/create-guest) |
| `PATCH` | `/events/{eventId}/guests/{guestId}` | [Update Guest](/restapi/operations/guests/update-guest) |
| `DELETE` | `/events/{eventId}/guests/{guestId}` | [Delete Guest](/restapi/operations/guests/delete-guest) |
| `GET` | `/calendars` | [List Calendars](/restapi/operations/calendars/list-calendars) |
| `GET` | `/calendars/options` | [List Calendar Options](/restapi/operations/calendars/list-calendar-options) |
| `GET` | `/calendars/{id}` | [Get Calendar](/restapi/operations/calendars/get-calendar) |
| `POST` | `/calendars` | [Create Calendar](/restapi/operations/calendars/create-calendar) |
| `PATCH` | `/calendars/{id}` | [Update Calendar](/restapi/operations/calendars/update-calendar) |
| `DELETE` | `/calendars/{id}` | [Delete Calendar](/restapi/operations/calendars/delete-calendar) |
| `GET` | `/reports` | [Get Reports](/restapi/operations/reports/get-reports) |
| `GET` | `/reports/guest-trends` | [Get Guest Trends](/restapi/operations/reports/get-guest-trends) |
| `GET` | `/settings/general` | [Get General Settings](/restapi/operations/settings/get-general-settings) |
| `POST` | `/settings/general` | [Update General Settings](/restapi/operations/settings/update-general-settings) |
| `GET` | `/settings/pages` | [Search Pages](/restapi/operations/settings/search-pages) |
| `POST` | `/settings/create-page` | [Create Page](/restapi/operations/settings/create-page) |
| `GET` | `/settings/email` | [Get Email Settings](/restapi/operations/settings/get-email-settings) |
| `POST` | `/settings/email` | [Update Email Settings](/restapi/operations/settings/update-email-settings) |
| `GET` | `/settings/email-notifications` | [Get Email Notification Settings](/restapi/operations/settings/get-email-notification-settings) |
| `POST` | `/settings/email-notifications` | [Update Email Notification Settings](/restapi/operations/settings/update-email-notification-settings) |
| `GET` | `/settings/email-notifications/preview/{type}` | [Preview Email](/restapi/operations/settings/preview-email) |
| `GET` | `/users` | [Search Users](/restapi/operations/users/search-users) |
| `GET` | `/dashboard` | [Get Dashboard](/restapi/operations/dashboard/get-dashboard) |

### Front-End API

| Method | Path | Operation |
| --- | --- | --- |
| `GET` | `/community/events` | [List Community Events](/restapi/operations/community/list-community-events) |
| `GET` | `/community/events/by-slug` | [Get Community Event by Slug](/restapi/operations/community/get-community-event-by-slug) |
| `POST` | `/community/events/{id}/register` | [Register Member](/restapi/operations/community/register-member) |
| `POST` | `/community/events/{id}/register-guest` | [Register Visitor (Portal)](/restapi/operations/community/register-visitor-community) |
| `POST` | `/portal/events/{id}/register-guest` | [Register Visitor (Event Page)](/restapi/operations/portal/register-visitor) |
