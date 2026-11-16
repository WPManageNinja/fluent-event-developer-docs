---
title: "Actions Hooks"
description: "Every FluentEvent action hook, grouped by area."
---

# Actions Hooks

Actions let your code run when something happens in FluentEvent: an event is created, a guest registers, a reminder batch goes out. FluentEvent has 27 action hooks. 4 of them are run by Action Scheduler rather than by a `do_action()` call.

Every hook name starts with `fluent_event/`. Nouns and verbs are separated by `/`: `fluent_event/<noun>/<verb>` for lifecycle actions, `fluent_event/<noun>_api_response` for response filters.

## Pages

| Page | Hooks |
| --- | --- |
| [Events](/hooks/actions/events) | 5 |
| [Guests](/hooks/actions/guests) | 6 |
| [Calendars](/hooks/actions/calendars) | 4 |
| [Emails & Reminders](/hooks/actions/emails) | 7 |
| [Settings](/hooks/actions/settings) | 3 |
| [System](/hooks/actions/system) | 2 |

## All Actions

| Hook | Page | Description |
| --- | --- | --- |
| [`fluent_event/calendar/before_deleted`](/hooks/actions/calendars#fluent-event-calendar-before-deleted) | Calendars | Before a calendar is deleted, while its events still exist. |
| [`fluent_event/calendar/created`](/hooks/actions/calendars#fluent-event-calendar-created) | Calendars | After a new calendar is saved. |
| [`fluent_event/calendar/deleted`](/hooks/actions/calendars#fluent-event-calendar-deleted) | Calendars | After a calendar and all of its events are deleted. |
| [`fluent_event/calendar/updated`](/hooks/actions/calendars#fluent-event-calendar-updated) | Calendars | After a calendar is saved with new values. |
| [`fluent_event/event/before_deleted`](/hooks/actions/events#fluent-event-event-before-deleted) | Events | Before an event is deleted, while its post, guests and meta still exist. |
| [`fluent_event/event/calendar_changed`](/hooks/actions/events#fluent-event-event-calendar-changed) | Events | After an update moves an event to another calendar. |
| [`fluent_event/event/created`](/hooks/actions/events#fluent-event-event-created) | Events | After a new event and its post are saved. |
| [`fluent_event/event/deleted`](/hooks/actions/events#fluent-event-event-deleted) | Events | After an event, its post, its guests and its meta are deleted. |
| [`fluent_event/event/updated`](/hooks/actions/events#fluent-event-event-updated) | Events | After an event is saved with new values. |
| [`fluent_event/guest_reminders_sent`](/hooks/actions/emails#fluent-event-guest-reminders-sent) | Emails & Reminders | After one reminder send for an event has gone through every guest. |
| [`fluent_event/guest/before_bulk_deleted`](/hooks/actions/guests#fluent-event-guest-before-bulk-deleted) | Guests | Before every guest of an event is deleted, as part of deleting the event. |
| [`fluent_event/guest/before_deleted`](/hooks/actions/guests#fluent-event-guest-before-deleted) | Guests | Before an admin deletes one guest. |
| [`fluent_event/guest/bulk_deleted`](/hooks/actions/guests#fluent-event-guest-bulk-deleted) | Guests | After every guest of an event is deleted, as part of deleting the event. |
| [`fluent_event/guest/cancellation_sent`](/hooks/actions/emails#fluent-event-guest-cancellation-sent) | Emails & Reminders | After the registration cancellation email is handed to `wp_mail()`. |
| [`fluent_event/guest/confirmation_sent`](/hooks/actions/emails#fluent-event-guest-confirmation-sent) | Emails & Reminders | After the registration confirmation email is handed to `wp_mail()`. |
| [`fluent_event/guest/created`](/hooks/actions/guests#fluent-event-guest-created) | Guests | After a new guest row is saved. |
| [`fluent_event/guest/deleted`](/hooks/actions/guests#fluent-event-guest-deleted) | Guests | After an admin deletes one guest. |
| [`fluent_event/guest/updated`](/hooks/actions/guests#fluent-event-guest-updated) | Guests | After a guest row changes, including a member's RSVP change. |
| [`fluent_event/loaded`](/hooks/actions/system#fluent-event-loaded) | System | On `plugins_loaded`, once the FluentEvent application has booted. |
| [`fluent_event/reschedule_event_reminders`](/hooks/actions/emails#fluent-event-reschedule-event-reminders) | Emails & Reminders | Action Scheduler job that requeues the reminders of every upcoming event, 50 events per job. |
| [`fluent_event/send_event_reminders_to_guests`](/hooks/actions/emails#fluent-event-send-event-reminders-to-guests) | Emails & Reminders | Action Scheduler job that sends one reminder email to every seated guest of an event. |
| [`fluent_event/send_registration_cancellation`](/hooks/actions/emails#fluent-event-send-registration-cancellation) | Emails & Reminders | Action Scheduler job that sends the registration cancellation email to one guest. |
| [`fluent_event/send_registration_confirmation`](/hooks/actions/emails#fluent-event-send-registration-confirmation) | Emails & Reminders | Action Scheduler job that sends the registration confirmation email to one guest. |
| [`fluent_event/settings/email_notifications_updated`](/hooks/actions/settings#fluent-event-settings-email-notifications-updated) | Settings | After the email notification settings are saved. |
| [`fluent_event/settings/email_updated`](/hooks/actions/settings#fluent-event-settings-email-updated) | Settings | After the email sender settings are saved. |
| [`fluent_event/settings/general_updated`](/hooks/actions/settings#fluent-event-settings-general-updated) | Settings | After the general settings are saved, or the All Events page is created. |
| [`fluent_event/update_verification_failed`](/hooks/actions/system#fluent-event-update-verification-failed) | System | When a downloaded plugin update fails its checksum check and is not installed. |

## Before You Hook In

- **Controllers fire the hooks.** A service never fires a request hook, so one REST call fires each hook once. The exceptions are paths with no controller: the cleanup handler, the FluentCommunity bridge and the Action Scheduler jobs.
- **Deletes fire twice.** `before_deleted` runs while the row still exists; `deleted` runs after it is gone. Read related data in the first one.
- **Background work goes through Action Scheduler**, group `fluent-event`. Queue your own slow work there too, with `as_enqueue_async_action()`, rather than doing it inside a request hook.
