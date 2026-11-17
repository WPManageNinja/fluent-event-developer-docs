---
title: "Emails & Reminders Actions"
description: "Emails & Reminders action hooks in FluentEvent."
---

# Emails & Reminders Actions

7 action hooks on this page, across 3 call sites.

| Hook | Fires | Call Sites |
| --- | --- | --- |
| [`fluent_event/guest_reminders_sent`](#fluent-event-guest-reminders-sent) | After one reminder send for an event has gone through every guest. | 1 |
| [`fluent_event/guest/cancellation_sent`](#fluent-event-guest-cancellation-sent) | After the registration cancellation email is handed to `wp_mail()`. | 1 |
| [`fluent_event/guest/confirmation_sent`](#fluent-event-guest-confirmation-sent) | After the registration confirmation email is handed to `wp_mail()`. | 1 |
| [`fluent_event/reschedule_event_reminders`](#fluent-event-reschedule-event-reminders) | Action Scheduler job that requeues the reminders of every upcoming event, 50 events per job. | 3 (scheduled) |
| [`fluent_event/send_event_reminders_to_guests`](#fluent-event-send-event-reminders-to-guests) | Action Scheduler job that sends one reminder email to every seated guest of an event. | 3 (scheduled) |
| [`fluent_event/send_registration_cancellation`](#fluent-event-send-registration-cancellation) | Action Scheduler job that sends the registration cancellation email to one guest. | 2 (scheduled) |
| [`fluent_event/send_registration_confirmation`](#fluent-event-send-registration-confirmation) | Action Scheduler job that sends the registration confirmation email to one guest. | 3 (scheduled) |

<a id="fluent-event-guest-reminders-sent"></a>

## `fluent_event/guest_reminders_sent`

- **Type:** action
- **Call sites:** 1
- **When it fires:** After one reminder send for an event has gone through every guest.

Fires once per reminder time (for example "24 hours before"), when the batch job has worked through every seated guest (`going` or `checked_in`). A send that hits the 45-second run limit continues in a new job and fires this hook only when it finishes.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$event` | `Event` | The event the reminder was for. |
| 2 | `$sent` | `int` | How many emails this run sent. Guests without a valid email are skipped and not counted. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Services/EventReminderService.php:196` | `EventReminderService::sendReminders()` | `$event`, `$sent` |

### Example

```php
add_action('fluent_event/guest_reminders_sent', function ($event, $sent) {
    error_log(sprintf('Sent %d reminders for "%s"', $sent, $event->title));
}, 10, 2);
```

<a id="fluent-event-guest-cancellation-sent"></a>

## `fluent_event/guest/cancellation_sent`

- **Type:** action
- **Call sites:** 1
- **When it fires:** After the registration cancellation email is handed to `wp_mail()`.

Runs inside the [`fluent_event/send_registration_cancellation`](/hooks/actions/emails#fluent-event-send-registration-cancellation) job, or synchronously when an admin deletes a guest with **send email** on. The same checks as the confirmation apply.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$guest` | `Guest` | The guest who received the email. After a delete the row no longer exists. |
| 2 | `$event` | `Event` | The event. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Services/EventReminderService.php:237` | `EventReminderService::sendCancellation()` | `$guest`, `$event` |

### Example

```php
add_action('fluent_event/guest/cancellation_sent', function ($guest, $event) {
    // Your code here.
}, 10, 2);
```

<a id="fluent-event-guest-confirmation-sent"></a>

## `fluent_event/guest/confirmation_sent`

- **Type:** action
- **Call sites:** 1
- **When it fires:** After the registration confirmation email is handed to `wp_mail()`.

Runs inside the [`fluent_event/send_registration_confirmation`](/hooks/actions/emails#fluent-event-send-registration-confirmation) job. It does not fire when the email is turned off in **Settings → Email Notifications**, when the guest is no longer `going`, when the email address is not valid, or when the event is a draft.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$guest` | `Guest` | The guest who received the email. |
| 2 | `$event` | `Event` | The event they registered for. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Services/EventReminderService.php:214` | `EventReminderService::sendConfirmation()` | `$guest`, `$event` |

### Example

```php
add_action('fluent_event/guest/confirmation_sent', function ($guest, $event) {
    // Your code here.
}, 10, 2);
```

<a id="fluent-event-reschedule-event-reminders"></a>

## `fluent_event/reschedule_event_reminders`

- **Type:** action (run by Action Scheduler)
- **Scheduled from:** 3
- **When it fires:** Action Scheduler job that requeues the reminders of every upcoming event, 50 events per job.

Queued when the email notification settings are saved and when the plugin is activated (deactivation unschedules every queued job). Each run handles the next 50 upcoming live events after `$afterId`, then queues itself again for the next batch.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$afterId` | `int` | The last event ID handled by the previous batch. `0` starts from the beginning. |

### Scheduled From

Action Scheduler runs this hook in the `fluent-event` group. These are the places that queue it:

| Source | Context | When | Arguments |
| --- | --- | --- | --- |
| `fluent-event/app/Hooks/Handlers/ActivationHandler.php:113` | `ActivationHandler::activateSite()` | `now (async)` | `[0]` |
| `fluent-event/app/Services/EventReminderService.php:101` | `EventReminderService::rescheduleAllReminders()` | `now (async)` | `[0]` |
| `fluent-event/app/Services/EventReminderService.php:128` | `EventReminderService::rescheduleUpcoming()` | `now (async)` | `[(int) $events->last()->id]` |

### Listeners Inside FluentEvent

FluentEvent itself listens to this hook. Use a priority below or above these to run before or after them.

| Priority | Handler | Source |
| --- | --- | --- |
| 10 | `[EventReminderService::class, 'rescheduleUpcoming']` | `fluent-event/app/Hooks/Handlers/EmailNotificationHandler.php:20` |

### Example

```php
add_action('fluent_event/reschedule_event_reminders', function ($afterId) {
    // Your code here.
}, 10, 1);
```

<a id="fluent-event-send-event-reminders-to-guests"></a>

## `fluent_event/send_event_reminders_to_guests`

- **Type:** action (run by Action Scheduler)
- **Scheduled from:** 3
- **When it fires:** Action Scheduler job that sends one reminder email to every seated guest of an event.

One job is scheduled per configured reminder time, at `start_at - lead time`. Progress is stored in an `fe_meta` row with the key `reminder_email:<lead time>` (`status` and `cursor`), so a retried or continued job resumes after the last guest it emailed and never sends twice.

The job skips the send when the event is gone, is a draft, has already started, or no longer has that reminder time. It sends in batches of 50, at most 10 emails per second, and hands over to a fresh job after 45 seconds.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$eventId` | `int` | The event ID. |
| 2 | `$leadTime` | `int` | How long before the start this reminder goes out, in seconds. |

### Scheduled From

Action Scheduler runs this hook in the `fluent-event` group. These are the places that queue it:

| Source | Context | When | Arguments |
| --- | --- | --- | --- |
| `fluent-event/app/Services/EventReminderService.php:55` | `EventReminderService::scheduleReminders()` | `time()` | `[$eventId, $leadTime]` |
| `fluent-event/app/Services/EventReminderService.php:89` | `EventReminderService::scheduleReminders()` | `$startsAt - $leadTime` | `[$eventId, $leadTime]` |
| `fluent-event/app/Services/EventReminderService.php:178` | `EventReminderService::sendReminders()` | `time()` | `[(int) $event->id, (int) $leadTime]` |

### Listeners Inside FluentEvent

FluentEvent itself listens to this hook. Use a priority below or above these to run before or after them.

| Priority | Handler | Source |
| --- | --- | --- |
| 10 | `[EventReminderService::class, 'sendReminders']` | `fluent-event/app/Hooks/Handlers/EmailNotificationHandler.php:11` |

### Example

```php
// List the reminder sends queued for an event.
$actions = as_get_scheduled_actions([
    'hook'   => 'fluent_event/send_event_reminders_to_guests',
    'group'  => 'fluent-event',
    'status' => ActionScheduler_Store::STATUS_PENDING,
]);
```

<a id="fluent-event-send-registration-cancellation"></a>

## `fluent_event/send_registration_cancellation`

- **Type:** action (run by Action Scheduler)
- **Scheduled from:** 2
- **When it fires:** Action Scheduler job that sends the registration cancellation email to one guest.

Queued when a guest leaves a seat: the status moves from `going` or `checked_in` to `not_going` or `cancelled`. `EventReminderService::sendCancellation()` runs it.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$guestId` | `int` | The guest row ID. |

### Scheduled From

Action Scheduler runs this hook in the `fluent-event` group. These are the places that queue it:

| Source | Context | When | Arguments |
| --- | --- | --- | --- |
| `fluent-event/app/Http/Controllers/GuestController.php:105` | `GuestController::updateGuest()` | `now (async)` | `[(int) $guest->id]` |
| `fluent-event/app/Services/RegistrationService.php:136` | `RegistrationService::queueEmail()` | `now (async)` | `[(int) $guest->id]` |

### Listeners Inside FluentEvent

FluentEvent itself listens to this hook. Use a priority below or above these to run before or after them.

| Priority | Handler | Source |
| --- | --- | --- |
| 10 | `[EventReminderService::class, 'sendCancellation']` | `fluent-event/app/Hooks/Handlers/EmailNotificationHandler.php:13` |

### Example

```php
add_action('fluent_event/send_registration_cancellation', function ($guestId) {
    // Your code here.
}, 10, 1);
```

<a id="fluent-event-send-registration-confirmation"></a>

## `fluent_event/send_registration_confirmation`

- **Type:** action (run by Action Scheduler)
- **Scheduled from:** 3
- **When it fires:** Action Scheduler job that sends the registration confirmation email to one guest.

Queued with `as_enqueue_async_action()` when a guest becomes `going`: an admin adds or edits a guest with **send email** on, or a member or visitor registers. `EventReminderService::sendConfirmation()` runs it.

Do not call this hook yourself to send an email: queue it, so a slow mail server never holds up a request.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$guestId` | `int` | The guest row ID. |

### Scheduled From

Action Scheduler runs this hook in the `fluent-event` group. These are the places that queue it:

| Source | Context | When | Arguments |
| --- | --- | --- | --- |
| `fluent-event/app/Http/Controllers/GuestController.php:60` | `GuestController::createGuest()` | `now (async)` | `[(int) $guest->id]` |
| `fluent-event/app/Http/Controllers/GuestController.php:103` | `GuestController::updateGuest()` | `now (async)` | `[(int) $guest->id]` |
| `fluent-event/app/Services/RegistrationService.php:134` | `RegistrationService::queueEmail()` | `now (async)` | `[(int) $guest->id]` |

### Listeners Inside FluentEvent

FluentEvent itself listens to this hook. Use a priority below or above these to run before or after them.

| Priority | Handler | Source |
| --- | --- | --- |
| 10 | `[EventReminderService::class, 'sendConfirmation']` | `fluent-event/app/Hooks/Handlers/EmailNotificationHandler.php:12` |

### Example

```php
// Queue a confirmation the same way FluentEvent does.
as_enqueue_async_action('fluent_event/send_registration_confirmation', [(int) $guest->id], 'fluent-event');
```
