---
title: "Guests Actions"
description: "Guests action hooks in FluentEvent."
---

# Guests Actions

6 action hooks on this page, across 10 call sites.

| Hook | Fires | Call Sites |
| --- | --- | --- |
| [`fluent_event/guest/before_bulk_deleted`](#fluent-event-guest-before-bulk-deleted) | Before every guest of an event is deleted, as part of deleting the event. | 1 |
| [`fluent_event/guest/before_deleted`](#fluent-event-guest-before-deleted) | Before an admin deletes one guest. | 1 |
| [`fluent_event/guest/bulk_deleted`](#fluent-event-guest-bulk-deleted) | After every guest of an event is deleted, as part of deleting the event. | 1 |
| [`fluent_event/guest/created`](#fluent-event-guest-created) | After a new guest row is saved. | 4 |
| [`fluent_event/guest/deleted`](#fluent-event-guest-deleted) | After an admin deletes one guest. | 1 |
| [`fluent_event/guest/updated`](#fluent-event-guest-updated) | After a guest row changes, including a member's RSVP change. | 2 |

<a id="fluent-event-guest-before-bulk-deleted"></a>

## `fluent_event/guest/before_bulk_deleted`

- **Type:** action
- **Call sites:** 1
- **When it fires:** Before every guest of an event is deleted, as part of deleting the event.

Fires from `CleanupHandler::cleanEvent()`, after the event's post is deleted and before its guest rows are. There is no per-guest hook on this path: read `$event->guests()` here if you need the rows.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$event` | `Event` | The event whose guests are about to be deleted. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Hooks/Handlers/CleanupHandlers/CleanupHandler.php:79` | `CleanupHandler::cleanEvent()` | `$event` |

### Example

```php
add_action('fluent_event/guest/before_bulk_deleted', function ($event) {
    foreach ($event->guests()->get() as $guest) {
        // Archive each guest before it is removed.
    }
});
```

<a id="fluent-event-guest-before-deleted"></a>

## `fluent_event/guest/before_deleted`

- **Type:** action
- **Call sites:** 1
- **When it fires:** Before an admin deletes one guest.

Fires from `DELETE /events/{eventId}/guests/{guestId}` only. Deleting a whole event removes its guests in bulk and fires [`fluent_event/guest/before_bulk_deleted`](/hooks/actions/guests#fluent-event-guest-before-bulk-deleted) instead.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$guest` | `Guest` | The guest about to be deleted. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Http/Controllers/GuestController.php:119` | `GuestController::deleteGuest()` | `$guest` |

### Example

```php
add_action('fluent_event/guest/before_deleted', function ($guest) {
    // Your code here.
}, 10, 1);
```

<a id="fluent-event-guest-bulk-deleted"></a>

## `fluent_event/guest/bulk_deleted`

- **Type:** action
- **Call sites:** 1
- **When it fires:** After every guest of an event is deleted, as part of deleting the event.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$event` | `Event` | The event whose guests were deleted. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Hooks/Handlers/CleanupHandlers/CleanupHandler.php:83` | `CleanupHandler::cleanEvent()` | `$event` |

### Example

```php
add_action('fluent_event/guest/bulk_deleted', function ($event) {
    // Your code here.
}, 10, 1);
```

<a id="fluent-event-guest-created"></a>

## `fluent_event/guest/created`

- **Type:** action
- **Call sites:** 4
- **When it fires:** After a new guest row is saved.

Fires on every path that adds a guest:

- an admin adds a guest (`source = manual`);
- a member registers or RSVPs from the FluentCommunity portal (`source = fluent_community`, `source_id` = the community post ID);
- a visitor registers from the portal or from the public event page (`source = wordpress_pages`).

The confirmation email is queued separately, after this hook, so it is not sent yet. Check `$guest->status`: an RSVP can also create a `not_going` row.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$guest` | `Guest` | The saved guest. `event_id`, `email`, `status` and `source` are set. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Http/Controllers/CommunityEventController.php:191` | `CommunityEventController::register()` | `$guest` |
| `fluent-event/app/Http/Controllers/CommunityEventController.php:266` | `CommunityEventController::registerGuest()` | `$guest` |
| `fluent-event/app/Http/Controllers/GuestController.php:57` | `GuestController::createGuest()` | `$guest` |
| `fluent-event/app/Http/Controllers/PortalEventController.php:64` | `PortalEventController::registerGuest()` | `$guest` |

### Example

```php
add_action('fluent_event/guest/created', function ($guest) {
    if ($guest->status !== 'going') {
        return;
    }

    // Add the guest to a FluentCRM list.
    if (function_exists('FluentCrmApi')) {
        FluentCrmApi('contacts')->createOrUpdate([
            'email'      => $guest->email,
            'first_name' => $guest->name,
            'lists'      => [3],
        ]);
    }
});
```

<a id="fluent-event-guest-deleted"></a>

## `fluent_event/guest/deleted`

- **Type:** action
- **Call sites:** 1
- **When it fires:** After an admin deletes one guest.

The row is gone. When the admin asked for it and the guest held a seat, the cancellation email is sent right after this hook, synchronously, because a queued job could no longer load the row.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$guest` | `Guest` | The deleted guest, with its last values. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Http/Controllers/GuestController.php:123` | `GuestController::deleteGuest()` | `$guest` |

### Example

```php
add_action('fluent_event/guest/deleted', function ($guest) {
    // Your code here.
}, 10, 1);
```

<a id="fluent-event-guest-updated"></a>

## `fluent_event/guest/updated`

- **Type:** action
- **Call sites:** 2
- **When it fires:** After a guest row changes, including a member's RSVP change.

Fires when an admin edits a guest, and when a member changes their RSVP or cancels an open registration from the portal. On the portal path it fires only when the status really changed.

Compare `$guest->status` with `$previousStatus` to react to a status move, for example `going` → `cancelled`.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$guest` | `Guest` | The saved guest. |
| 2 | `$previousStatus` | `string` | The status before this change: `going`, `not_going`, `checked_in` or `cancelled`. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Http/Controllers/CommunityEventController.php:193` | `CommunityEventController::register()` | `$guest`, `$previousStatus` |
| `fluent-event/app/Http/Controllers/GuestController.php:99` | `GuestController::updateGuest()` | `$guest`, `$previousStatus` |

### Example

```php
add_action('fluent_event/guest/updated', function ($guest, $previousStatus) {
    if ($previousStatus !== 'checked_in' && $guest->status === 'checked_in') {
        do_action('my_plugin/guest_arrived', $guest);
    }
}, 10, 2);
```
