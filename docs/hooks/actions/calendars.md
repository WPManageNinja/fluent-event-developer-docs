---
title: "Calendars Actions"
description: "Calendars action hooks in FluentEvent."
---

# Calendars Actions

4 action hooks on this page, across 6 call sites.

| Hook | Fires | Call Sites |
| --- | --- | --- |
| [`fluent_event/calendar/before_deleted`](#fluent-event-calendar-before-deleted) | Before a calendar is deleted, while its events still exist. | 1 |
| [`fluent_event/calendar/created`](#fluent-event-calendar-created) | After a new calendar is saved. | 2 |
| [`fluent_event/calendar/deleted`](#fluent-event-calendar-deleted) | After a calendar and all of its events are deleted. | 1 |
| [`fluent_event/calendar/updated`](#fluent-event-calendar-updated) | After a calendar is saved with new values. | 2 |

<a id="fluent-event-calendar-before-deleted"></a>

## `fluent_event/calendar/before_deleted`

- **Type:** action
- **Call sites:** 1
- **When it fires:** Before a calendar is deleted, while its events still exist.

`CleanupHandler::cleanCalendar()` listens here and deletes every event in the calendar, one at a time, so [`fluent_event/event/before_deleted`](/hooks/actions/events#fluent-event-event-before-deleted) and [`fluent_event/event/deleted`](/hooks/actions/events#fluent-event-event-deleted) fire once per event.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$calendar` | `Calendar` | The calendar about to be deleted. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Http/Controllers/CalendarController.php:123` | `CalendarController::deleteCalendar()` | `$calendar` |

### Listeners Inside FluentEvent

FluentEvent itself listens to this hook. Use a priority below or above these to run before or after them.

| Priority | Handler | Source |
| --- | --- | --- |
| 10 | `[$this, 'cleanCalendar']` | `fluent-event/app/Hooks/Handlers/CleanupHandlers/CleanupHandler.php:16` |

### Example

```php
add_action('fluent_event/calendar/before_deleted', function ($calendar) {
    // Your code here.
}, 10, 1);
```

<a id="fluent-event-calendar-created"></a>

## `fluent_event/calendar/created`

- **Type:** action
- **Call sites:** 2
- **When it fires:** After a new calendar is saved.

Fires from the admin **Create Calendar** endpoint, and from the FluentCommunity bridge when the first event posted in a space (or outside any space) creates that space's calendar.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$calendar` | `Calendar` | The saved calendar. `created_by` is the current user. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Http/Controllers/CalendarController.php:89` | `CalendarController::createCalendar()` | `$calendar` |
| `fluent-event/Modules/FluentCommunity/FeedHandler.php:448` | `FeedHandler::calendarFor()` | `$calendar` |

### Example

```php
add_action('fluent_event/calendar/created', function ($calendar) {
    // Your code here.
}, 10, 1);
```

<a id="fluent-event-calendar-deleted"></a>

## `fluent_event/calendar/deleted`

- **Type:** action
- **Call sites:** 1
- **When it fires:** After a calendar and all of its events are deleted.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$calendar` | `Calendar` | The deleted calendar, with its last values. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Http/Controllers/CalendarController.php:127` | `CalendarController::deleteCalendar()` | `$calendar` |

### Example

```php
add_action('fluent_event/calendar/deleted', function ($calendar) {
    // Your code here.
}, 10, 1);
```

<a id="fluent-event-calendar-updated"></a>

## `fluent_event/calendar/updated`

- **Type:** action
- **Call sites:** 2
- **When it fires:** After a calendar is saved with new values.

Fires from the admin **Update Calendar** endpoint, and from the FluentCommunity bridge when a space is deleted: the space calendar becomes a draft and loses its space link.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$calendar` | `Calendar` | The saved calendar. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Http/Controllers/CalendarController.php:111` | `CalendarController::updateCalendar()` | `$calendar` |
| `fluent-event/Modules/FluentCommunity/SpaceHandler.php:85` | `SpaceHandler::parkCalendar()` | `$calendar` |

### Example

```php
add_action('fluent_event/calendar/updated', function ($calendar) {
    // Your code here.
}, 10, 1);
```
