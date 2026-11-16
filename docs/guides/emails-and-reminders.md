---
title: Emails & Reminders
description: The guest emails FluentEvent sends, how they are queued with Action Scheduler, and how to hook in.
---

# Emails & Reminders

FluentEvent sends three emails, to guests only:

| Email | Sent when | Setting |
| --- | --- | --- |
| Registration confirmation | A guest becomes `going`. | **Settings → Email Notifications → Registration confirmation** |
| Registration cancellation | A guest leaves a seat (`going` or `checked_in` → `not_going` or `cancelled`). | **… → Registration cancellation** |
| Reminder | At each reminder time before the event starts. | **… → Reminder to guest** (up to 5 times, 5 minutes to 30 days before) |

The sender, reply-to and footer come from **Settings → Email**. All three emails use one template, `app/Views/emails/template.php`. Hosts and administrators get no emails.

## Everything Is Queued

No email is sent during a page request. FluentEvent queues each send in [Action Scheduler](https://actionscheduler.org/) in the `fluent-event` group:

| Job hook | Queued by | Runs |
| --- | --- | --- |
| [`fluent_event/send_registration_confirmation`](/hooks/actions/emails#fluent-event-send-registration-confirmation) | A registration, or an admin edit with **send email** on | As soon as the queue runs |
| [`fluent_event/send_registration_cancellation`](/hooks/actions/emails#fluent-event-send-registration-cancellation) | A cancellation | As soon as the queue runs |
| [`fluent_event/send_event_reminders_to_guests`](/hooks/actions/emails#fluent-event-send-event-reminders-to-guests) | Event created or updated, settings saved | At `start_at` minus the reminder time |
| [`fluent_event/reschedule_event_reminders`](/hooks/actions/emails#fluent-event-reschedule-event-reminders) | Email notification settings saved, plugin activated | As soon as the queue runs, 50 events per job |

One exception: when an admin deletes a guest with **send email** on, the cancellation is sent during the request, because a queued job could no longer load the deleted row.

::: warning WP-Cron needs traffic
Action Scheduler runs on WP-Cron by default, which runs only when someone visits the site. On a quiet site, reminders can go out late. Run WP-Cron from a real cron job, or run `wp action-scheduler run` on a schedule.
:::

## How Reminders Are Scheduled

For each live event (`public`, `unlisted` or `private`) and each reminder time, FluentEvent:

1. Writes an `fe_meta` row: `object_type = event`, `meta_key = reminder_email:<seconds>`, `value = {"status": "scheduled", "cursor": 0}`.
2. Schedules `fluent_event/send_event_reminders_to_guests` with `[event ID, seconds]` at `start_at - seconds`. A reminder time that is already in the past is skipped.

When the job runs, it emails every guest with status `going` or `checked_in`, in batches of 50 and at most 10 emails per second. It saves the last guest ID in `cursor` after each email, so a retried job never emails a guest twice. After 45 seconds it queues itself again and stops; the next run continues from the cursor. At the end, the row becomes `completed` and [`fluent_event/guest_reminders_sent`](/hooks/actions/emails#fluent-event-guest-reminders-sent) fires.

What changes the schedule:

| Change | Effect |
| --- | --- |
| Event created | Reminders queued. |
| Event updated, start time unchanged | Queue checked; missing sends added, removed times dropped. Sent reminders stay sent. |
| Event start time changed | Every reminder queued again, including ones already sent for the old time. |
| Event becomes a draft | The job skips the send when it runs. |
| Event deleted | Queued sends cancelled. |
| Reminder settings saved | Every upcoming event requeued in the background. |

## Hooking In

React after an email goes out:

```php
add_action('fluent_event/guest/confirmation_sent', function ($guest, $event) {
    // Log it, notify a host, add the guest to a list...
}, 10, 2);
```

Send an extra email of your own on registration, without blocking the request:

```php
add_action('fluent_event/guest/created', function ($guest) {
    if ($guest->status === 'going') {
        as_enqueue_async_action('my_plugin/send_welcome_pack', [(int) $guest->id], 'my-plugin');
    }
});

add_action('my_plugin/send_welcome_pack', function ($guestId) {
    $guest = \FluentEvent\App\Models\Guest::query()->find($guestId);

    if ($guest && is_email($guest->email)) {
        wp_mail($guest->email, 'Your welcome pack', 'See you there!');
    }
});
```

Turn every FluentEvent email off on a staging site:

```php
// wp-config.php or a must-use plugin on staging only.
add_filter('pre_wp_mail', '__return_false');
```

## Previewing Emails

[`GET /settings/email-notifications/preview/{type}`](/restapi/operations/settings/preview-email) renders any of the three emails with a sample event and guest, and returns the subject and the full HTML. Nothing is sent.
