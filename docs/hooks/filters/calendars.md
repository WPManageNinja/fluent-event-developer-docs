---
title: "Calendars Filters"
description: "Calendars filter hooks in FluentEvent."
---

# Calendars Filters

3 filter hooks on this page, across 3 call sites.

| Hook | Filters | Call Sites |
| --- | --- | --- |
| [`fluent_event/calendar_api_response`](#fluent-event-calendar-api-response) | Filters one calendar's admin payload before it is returned. | 1 |
| [`fluent_event/calendar_title_max_length`](#fluent-event-calendar-title-max-length) | Filters the longest calendar title accepted, in characters. | 1 |
| [`fluent_event/calendars_api_response`](#fluent-event-calendars-api-response) | Filters the admin calendars list before it is returned. | 1 |

<a id="fluent-event-calendar-api-response"></a>

## `fluent_event/calendar_api_response`

- **Type:** filter
- **Call sites:** 1
- **When it fires:** Filters one calendar's admin payload before it is returned.

Wraps `GET /calendars/{id}`. The calendar carries `creator_name`, and `stats` holds the calendar's event and guest totals.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$data` | `array` | `['calendar' => Calendar, 'stats' => array]`. |
| 2 | `$request` | `array` | All request parameters. |

**Return:** `array` — the filtered data.

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Http/Controllers/CalendarController.php:78` | `CalendarController::getCalendar()` | `$data`, `$request->all()` |

### Listeners Inside FluentEvent

FluentEvent itself listens to this hook. Use a priority below or above these to run before or after them.

| Priority | Handler | Source |
| --- | --- | --- |
| 10 | `[$this, 'addSpaceUrl']` | `fluent-event/Modules/FluentCommunity/SpaceHandler.php:16` |

### Example

```php
add_filter('fluent_event/calendar_api_response', function ($data, $request) {
    // Change and return the first argument.
    return $data;
}, 10, 2);
```

<a id="fluent-event-calendar-title-max-length"></a>

## `fluent_event/calendar_title_max_length`

- **Type:** filter
- **Call sites:** 1
- **When it fires:** Filters the longest calendar title accepted, in characters.

The default is `100`. The value is clamped to 1–255, the size of the `title` column.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$length` | `int` | Maximum title length. Default `100`. |

**Return:** `int` — the filtered length.

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Models/Calendar.php:51` | `Calendar::titleMaxLength()` | `100` |

### Example

```php
add_filter('fluent_event/calendar_title_max_length', function () {
    return 150;
});
```

<a id="fluent-event-calendars-api-response"></a>

## `fluent_event/calendars_api_response`

- **Type:** filter
- **Call sites:** 1
- **When it fires:** Filters the admin calendars list before it is returned.

Wraps `GET /calendars`. Each calendar carries `events_count` and `guests_count`. The FluentCommunity bridge adds `space_url` to calendars that belong to a discussion space.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$data` | `array` | `['calendars' => collection of Calendar, 'counts' => array]`. `counts` holds `all` plus one key per status. |
| 2 | `$request` | `array` | All request parameters. |

**Return:** `array` — the filtered data.

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Http/Controllers/CalendarController.php:42` | `CalendarController::getAllCalendars()` | `$data`, `$request->all()` |

### Listeners Inside FluentEvent

FluentEvent itself listens to this hook. Use a priority below or above these to run before or after them.

| Priority | Handler | Source |
| --- | --- | --- |
| 10 | `[$this, 'addSpaceUrls']` | `fluent-event/Modules/FluentCommunity/SpaceHandler.php:17` |

### Example

```php
add_filter('fluent_event/calendars_api_response', function ($data, $request) {
    // Change and return the first argument.
    return $data;
}, 10, 2);
```
