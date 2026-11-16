---
title: "Settings Actions"
description: "Settings action hooks in FluentEvent."
---

# Settings Actions

3 action hooks on this page, across 4 call sites.

| Hook | Fires | Call Sites |
| --- | --- | --- |
| [`fluent_event/settings/email_notifications_updated`](#fluent-event-settings-email-notifications-updated) | After the email notification settings are saved. | 1 |
| [`fluent_event/settings/email_updated`](#fluent-event-settings-email-updated) | After the email sender settings are saved. | 1 |
| [`fluent_event/settings/general_updated`](#fluent-event-settings-general-updated) | After the general settings are saved, or the All Events page is created. | 2 |

<a id="fluent-event-settings-email-notifications-updated"></a>

## `fluent_event/settings/email_notifications_updated`

- **Type:** action
- **Call sites:** 1
- **When it fires:** After the email notification settings are saved.

FluentEvent listens here and queues [`fluent_event/reschedule_event_reminders`](/hooks/actions/emails#fluent-event-reschedule-event-reminders), so a changed reminder time applies to every upcoming event.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$settings` | `array` | The full notification settings: `registration_confirmation`, `registration_cancellation` and `reminder_to_guest`, each with `enabled`; the reminder also has `times`. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Http/Controllers/SettingsController.php:185` | `SettingsController::updateEmailNotifications()` | `$settings` |

### Listeners Inside FluentEvent

FluentEvent itself listens to this hook. Use a priority below or above these to run before or after them.

| Priority | Handler | Source |
| --- | --- | --- |
| 10 | `[EventReminderService::class, 'rescheduleAllReminders']` | `fluent-event/app/Hooks/Handlers/EmailNotificationHandler.php:19` |

### Example

```php
add_action('fluent_event/settings/email_notifications_updated', function ($settings) {
    // Your code here.
}, 10, 1);
```

<a id="fluent-event-settings-email-updated"></a>

## `fluent_event/settings/email_updated`

- **Type:** action
- **Call sites:** 1
- **When it fires:** After the email sender settings are saved.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$settings` | `array` | The full email settings: `from_name`, `from_email`, `reply_to_name`, `reply_to_email`, `email_footer`. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Http/Controllers/SettingsController.php:161` | `SettingsController::updateEmail()` | `$settings` |

### Example

```php
add_action('fluent_event/settings/email_updated', function ($settings) {
    // Your code here.
}, 10, 1);
```

<a id="fluent-event-settings-general-updated"></a>

## `fluent_event/settings/general_updated`

- **Type:** action
- **Call sites:** 2
- **When it fires:** After the general settings are saved, or the All Events page is created.

Fires from `POST /settings/general` and from `POST /settings/create-page`. When `event_slug` changed, FluentEvent has already deleted the `rewrite_rules` option, so WordPress rebuilds the rules on the next request.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$settings` | `array` | The full general settings after the save: `default_events_view`, `disable_event_view_switch`, `events_page_id`, `event_slug`. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Http/Controllers/SettingsController.php:51` | `SettingsController::updateGeneral()` | `$settings` |
| `fluent-event/app/Http/Controllers/SettingsController.php:104` | `SettingsController::createPage()` | `$settings` |

### Example

```php
add_action('fluent_event/settings/general_updated', function ($settings) {
    // Your code here.
}, 10, 1);
```
