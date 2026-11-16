---
title: "Guest Model"
description: "One person on one event. A guest row is the registration."
---

# Guest Model

One person on one event. A guest row is the registration.

Guests are not WordPress users. A visitor registers with a name and an email only; a logged-in member's row also stores their `user_id`. `calendar_id` is a copy of the event's calendar, kept in step when the event moves, so calendar-wide counts need no join.

## Class

- **Class:** `FluentEvent\App\Models\Guest`
- **Table:** `{prefix}fe_guests`
- **Primary key:** `id`
- **Extends:** `Model`
- **Source:** `fluent-event/app/Models/Guest.php`

## Attributes

| Column | Type | Cast | Fillable | Description |
| --- | --- | --- | --- | --- |
| `id` | `bigint(20) unsigned` | — | No |  |
| `event_id` | `bigint(20) unsigned` | `int` | Yes | The event. |
| `calendar_id` | `bigint(20) unsigned` | `int` | Yes | Copy of the event's `calendar_id`. |
| `ticket_type_id` | `bigint(20) unsigned` | — | No | Reserved for ticketing. Always `NULL` today. |
| `group_id` | `varchar(64)` | — | Yes | Random 32-character order ID. Rows that share it are one order. |
| `is_buyer` | `tinyint(1)` | `int` | Yes | `1` on the row that carries the order. Every RSVP or open registration is its own order, so it is `1` today. |
| `name` | `varchar(255)` | — | Yes | Name the guest gave, or the member display name. |
| `email` | `varchar(191)` | — | Yes | Email address. Unique per event. |
| `user_id` | `bigint(20) unsigned` | `int` | Yes | The WordPress user, when a logged-in member registered or an admin linked one. Unique per event. |
| `status` | `varchar(64)` | — | Yes | `going`, `not_going`, `checked_in` or `cancelled`. |
| `hash` | `varchar(64)` | — | No | Reserved for per-ticket links. |
| `checked_in_at` | `datetime` | — | Yes | When the guest was checked in. Cleared when the status leaves `checked_in`. |
| `payment_status` | `varchar(64)` | — | No | paid \| unpaid \| refunded |
| `payment_ref` | `varchar(255)` | — | No |  |
| `price` | `decimal(10,2)` | — | No |  |
| `paid_at` | `datetime` | — | No |  |
| `source` | `varchar(64)` | — | Yes | Where the row came from: `manual` (admin), `wordpress_pages` (public event page or a visitor on the portal) or `fluent_community` (a member on the portal). |
| `source_id` | `bigint(20) unsigned` | — | Yes | ID in the source system, for example the FluentCommunity post ID. |
| `meta` | `longtext` | `array` | Yes | Open-ended JSON for per-guest data. |
| `created_at` | `timestamp` | — | No |  |
| `updated_at` | `timestamp` | — | No |  |

::: info Mass assignment
Only the columns marked *Fillable* can be set through `create()` or `fill()`. `ticket_type_id`, `hash`, `payment_status`, `payment_ref`, `price`, `paid_at` are not fillable.
:::

## Computed Attributes

| Attribute | Appended to JSON | Description |
| --- | --- | --- |
| `avatar` | Yes | Gravatar URL for the user, or for the email when there is no user. |

## Constants

| Constant | Value | Meaning |
| --- | --- | --- |
| `Guest::STATUSES` | `"going,not_going,checked_in,cancelled"` | Every guest status. |
| `Guest::DEFAULT_STATUS` | `"going"` | The status a new guest gets when none is given. |

## Relationships

| Method | Type | Related Model | Keys |
| --- | --- | --- | --- |
| `event()` | `belongsTo` | [Event](/database/models/event) | `event_id` → `id` |

## Scopes

| Scope | Parameters | Description |
| --- | --- | --- |
| `searchBy()` | `$search` | Matches `name` or `email` with `LIKE`. |
| `byStatus()` | `$status` | Limits to one status. |

## Usage

```php
use FluentEvent\App\Models\Guest;
use FluentEvent\App\Models\Event;

// Everyone holding a seat at event 42.
$guests = Guest::query()
    ->where('event_id', 42)
    ->whereIn('status', Event::SEAT_STATUSES)
    ->orderBy('name')
    ->get(['id', 'name', 'email', 'status']);
```
