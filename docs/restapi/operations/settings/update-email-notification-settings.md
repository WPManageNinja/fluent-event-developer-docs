---
title: "Update Email Notification Settings"
description: "Turns the confirmation, cancellation and reminder emails on or off, and sets up to five reminder times."
outline: false
aside: false
---

# Update Email Notification Settings

Turns the confirmation, cancellation and reminder emails on or off, and sets up to five reminder times.

Each reminder time must be a whole number from 5 minutes to 30 days before the event. Saving requeues the reminders of every upcoming event in the background.

## Endpoint

- **Method:** `POST`
- **Path:** `/fluent-event/v2/settings/email-notifications`
- **Controller:** `SettingsController@updateEmailNotifications`
- **Route source:** `fluent-event/app/Http/Routes/api.php:33`
- **Controller source:** `fluent-event/app/Http/Controllers/SettingsController.php:176`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

## Hooks Fired

- [`fluent_event/settings/email_notifications_updated`](/hooks/actions/settings#fluent-event-settings-email-notifications-updated)

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="updateEmailNotificationSettings" specUrl="/openapi/public/settings/update-email-notification-settings.json" />
