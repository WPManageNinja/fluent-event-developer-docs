---
title: "Calendar Model"
description: "A calendar holds events. Each event belongs to exactly one."
---

# Calendar Model

A calendar holds events. Each event belongs to exactly one.

A calendar has no public page of its own, so its statuses are only `public`, `private` and `draft`: events in a private or draft calendar never appear on the public pages. With the FluentCommunity integration on, each discussion space gets its own calendar (`meta.fcom_space_id`) and posts outside any space go to a shared Community calendar (`meta.fcom_global = true`).

## Class

- **Class:** `FluentEvent\App\Models\Calendar`
- **Table:** `{prefix}fe_calendars`
- **Primary key:** `id`
- **Extends:** `Model`
- **Model events:** `creating` (registered in `booted()`)
- **Source:** `fluent-event/app/Models/Calendar.php`

## Attributes

| Column | Type | Cast | Fillable | Description |
| --- | --- | --- | --- | --- |
| `id` | `bigint(20) unsigned` | — | No |  |
| `title` | `varchar(255)` | — | Yes | Calendar name. Stored sanitized; read back as plain text. |
| `slug` | `varchar(191)` | — | Yes | Unique slug. Generated from the title when empty. |
| `description` | `text` | — | No | Optional. No screen or endpoint sets it yet. |
| `status` | `varchar(64)` | — | Yes | `public`, `private` or `draft`. |
| `meta` | `longtext` | `array` | Yes | Open-ended JSON. See below. |
| `created_by` | `bigint(20) unsigned` | `int` | No | The WordPress user who created the calendar. Set automatically on create. |
| `created_at` | `timestamp` | — | No |  |
| `updated_at` | `timestamp` | — | No |  |

::: info Mass assignment
Only the columns marked *Fillable* can be set through `create()` or `fill()`. `description`, `created_by` are not fillable:  `created_by` is set from the current user when the calendar is created.
:::

## Computed Attributes

| Attribute | Appended to JSON | Description |
| --- | --- | --- |
| `title` | No | Decodes the stored title to plain text. Escape it wherever you print it. |

## The `meta` Column

`Calendar::defaultMeta()` documents the keys. New per-calendar settings land here without a migration.

| Key | Meaning |
| --- | --- |
| `theme_color` | Six-digit hex colour, default `#0099ff`. Colours the calendar's events in the admin. |
| `fcom_space_id` | Set by the FluentCommunity bridge: the space this calendar belongs to. |
| `fcom_global` | Set by the FluentCommunity bridge: `true` on the Community calendar. |

## Constants

| Constant | Value | Meaning |
| --- | --- | --- |
| `Calendar::STATUSES` | `"public,private,draft"` | Every calendar status. |
| `Calendar::DEFAULT_THEME_COLOR` | `"#0099ff"` | The colour a new calendar gets. |

## Relationships

| Method | Type | Related Model | Keys |
| --- | --- | --- | --- |
| `events()` | `hasMany` | [Event](/database/models/event) | `calendar_id` → `id` |
| `guests()` | `hasMany` | [Guest](/database/models/guest) | `calendar_id` → `id` |

## Scopes

| Scope | Parameters | Description |
| --- | --- | --- |
| `searchBy()` | `$search` | Matches `title` or `slug` with `LIKE`. |
| `byStatus()` | `$status` | Limits to one status or a list of statuses. |

## Methods

| Method | Description |
| --- | --- |
| `::titleMaxLength()` | The title length limit, after the `fluent_event/calendar_title_max_length` filter. |
| `::defaultMeta()` | The `meta` keys and their defaults. |

## Usage

```php
use FluentEvent\App\Models\Calendar;

$calendars = Calendar::query()
    ->byStatus('public')
    ->withCount(['events', 'guests'])
    ->orderBy('title')
    ->get();
```
