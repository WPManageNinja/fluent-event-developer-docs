---
title: "Events Actions"
description: "Events action hooks in FluentEvent."
---

# Events Actions

5 action hooks on this page, across 13 call sites.

| Hook | Fires | Call Sites |
| --- | --- | --- |
| [`fluent_event/event/before_deleted`](#fluent-event-event-before-deleted) | Before an event is deleted, while its post, guests and meta still exist. | 3 |
| [`fluent_event/event/calendar_changed`](#fluent-event-event-calendar-changed) | After an update moves an event to another calendar. | 1 |
| [`fluent_event/event/created`](#fluent-event-event-created) | After a new event and its post are saved. | 2 |
| [`fluent_event/event/deleted`](#fluent-event-event-deleted) | After an event, its post, its guests and its meta are deleted. | 3 |
| [`fluent_event/event/updated`](#fluent-event-event-updated) | After an event is saved with new values. | 4 |

<a id="fluent-event-event-before-deleted"></a>

## `fluent_event/event/before_deleted`

- **Type:** action
- **Call sites:** 3
- **When it fires:** Before an event is deleted, while its post, guests and meta still exist.

This is the hook that does the cleanup. FluentEvent's own listeners run here in priority order:

1. Priority 5: cancel the queued reminder emails, and unlink the FluentCommunity post.
2. Priority 10: `CleanupHandler::cleanEvent()` deletes the `fe_event` post, every guest row (bracketed by the bulk guest hooks) and the event's `fe_meta` rows.

The admin delete runs this hook **inside a database transaction**. A listener that throws an exception rolls the whole delete back. The hook also fires when a calendar is deleted (once per event) and when the `fe_event` post is deleted outside the plugin, for example with WP-CLI.

Read anything you need from the guests at a priority below 10.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$event` | `Event` | The event about to be deleted. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Hooks/Handlers/CleanupHandlers/CleanupHandler.php:47` | `CleanupHandler::cleanDeletedPost()` | `$event` |
| `fluent-event/app/Hooks/Handlers/CleanupHandlers/CleanupHandler.php:60` | `CleanupHandler::cleanCalendar()` | `$event` |
| `fluent-event/app/Http/Controllers/EventController.php:172` | `EventController::deleteEvent()` | `$event` |

### Listeners Inside FluentEvent

FluentEvent itself listens to this hook. Use a priority below or above these to run before or after them.

| Priority | Handler | Source |
| --- | --- | --- |
| 10 | `[$this, 'cleanEvent']` | `fluent-event/app/Hooks/Handlers/CleanupHandlers/CleanupHandler.php:17` |
| 5 | `[EventReminderService::class, 'cancelReminders']` | `fluent-event/app/Hooks/Handlers/EmailNotificationHandler.php:18` |
| 5 | `[$this, 'unlinkPost']` | `fluent-event/Modules/FluentCommunity/FeedHandler.php:44` |

### Example

```php
add_action('fluent_event/event/before_deleted', function ($event) {
    // Runs before CleanupHandler (priority 10) deletes the guests.
    $emails = $event->guests()->pluck('email')->toArray();
    update_option('my_plugin_deleted_event_' . $event->id, $emails, false);
}, 9);
```

<a id="fluent-event-event-calendar-changed"></a>

## `fluent_event/event/calendar_changed`

- **Type:** action
- **Call sites:** 1
- **When it fires:** After an update moves an event to another calendar.

Fires right after [`fluent_event/event/updated`](/hooks/actions/events#fluent-event-event-updated), and only when `calendar_id` changed. By then every guest row of the event already carries the new `calendar_id` too.

The FluentCommunity bridge listens here to move the event's community post to the matching space, or to unlink the post when the new calendar has no space.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$event` | `Event` | The saved event, with its new `calendar_id`. |
| 2 | `$previousCalendarId` | `int` | The calendar the event was in before. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Http/Controllers/EventController.php:158` | `EventController::updateEvent()` | `$event`, `$previousCalendarId` |

### Listeners Inside FluentEvent

FluentEvent itself listens to this hook. Use a priority below or above these to run before or after them.

| Priority | Handler | Source |
| --- | --- | --- |
| 10 | `[$this, 'followCalendarChange']` | `fluent-event/Modules/FluentCommunity/FeedHandler.php:41` |

### Example

```php
add_action('fluent_event/event/calendar_changed', function ($event, $previousCalendarId) {
    error_log(sprintf('Event %d moved from calendar %d to %d', $event->id, $previousCalendarId, $event->calendar_id));
}, 10, 2);
```

<a id="fluent-event-event-created"></a>

## `fluent_event/event/created`

- **Type:** action
- **Call sites:** 2
- **When it fires:** After a new event and its post are saved.

Fires from the admin **Create Event** endpoint and from the FluentCommunity bridge when a member posts an event in a space. Both the `fe_event` post and the `fe_event_details` row exist, and the transaction that wrote them has committed.

FluentEvent itself listens here to queue the guest reminder emails for the event.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$event` | `Event` | The saved event. `$event->post_id` is the `fe_event` post. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Http/Controllers/EventController.php:111` | `EventController::createEvent()` | `$event` |
| `fluent-event/Modules/FluentCommunity/FeedHandler.php:127` | `FeedHandler::createEvent()` | `$event` |

### Listeners Inside FluentEvent

FluentEvent itself listens to this hook. Use a priority below or above these to run before or after them.

| Priority | Handler | Source |
| --- | --- | --- |
| 10 | `[EventReminderService::class, 'scheduleReminders']` | `fluent-event/app/Hooks/Handlers/EmailNotificationHandler.php:15` |

### Example

```php
add_action('fluent_event/event/created', function ($event) {
    // Mirror new public events to an external calendar.
    if ($event->status !== 'public') {
        return;
    }

    as_enqueue_async_action('my_plugin/sync_event', [(int) $event->id], 'my-plugin');
});
```

<a id="fluent-event-event-deleted"></a>

## `fluent_event/event/deleted`

- **Type:** action
- **Call sites:** 3
- **When it fires:** After an event, its post, its guests and its meta are deleted.

The model instance still holds its last values, but nothing is left in the database. Use it to clean up your own data keyed by the event ID.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$event` | `Event` | The deleted event. Its rows no longer exist. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Hooks/Handlers/CleanupHandlers/CleanupHandler.php:52` | `CleanupHandler::cleanDeletedPost()` | `$event` |
| `fluent-event/app/Hooks/Handlers/CleanupHandlers/CleanupHandler.php:62` | `CleanupHandler::cleanCalendar()` | `$event` |
| `fluent-event/app/Http/Controllers/EventController.php:177` | `EventController::deleteEvent()` | `$event` |

### Example

```php
add_action('fluent_event/event/deleted', function ($event) {
    delete_option('my_plugin_event_' . $event->id);
});
```

<a id="fluent-event-event-updated"></a>

## `fluent_event/event/updated`

- **Type:** action
- **Call sites:** 4
- **When it fires:** After an event is saved with new values.

Fires from the admin **Update Event** endpoint, and from the FluentCommunity bridge when a community post moves to another space, when its post is deleted (the event becomes a draft), and when its space is deleted.

Use `$event->wasChanged('start_at')` and the other dirty-tracking methods to see what changed: the model has just been saved. FluentEvent listens here to reschedule the reminder emails, and resends them when the start time moved.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$event` | `Event` | The saved event. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Http/Controllers/EventController.php:155` | `EventController::updateEvent()` | `$event` |
| `fluent-event/Modules/FluentCommunity/FeedHandler.php:191` | `FeedHandler::followSpaceMove()` | `$event` |
| `fluent-event/Modules/FluentCommunity/FeedHandler.php:252` | `FeedHandler::parkEvent()` | `$event` |
| `fluent-event/Modules/FluentCommunity/SpaceHandler.php:82` | `SpaceHandler::parkCalendar()` | `$event` |

### Listeners Inside FluentEvent

FluentEvent itself listens to this hook. Use a priority below or above these to run before or after them.

| Priority | Handler | Source |
| --- | --- | --- |
| 10 | `[EventReminderService::class, 'rescheduleReminders']` | `fluent-event/app/Hooks/Handlers/EmailNotificationHandler.php:16` |

### Example

```php
add_action('fluent_event/event/updated', function ($event) {
    if (!$event->wasChanged('start_at')) {
        return;
    }

    // The start time moved: tell an external system.
    as_enqueue_async_action('my_plugin/event_rescheduled', [(int) $event->id], 'my-plugin');
});
```
