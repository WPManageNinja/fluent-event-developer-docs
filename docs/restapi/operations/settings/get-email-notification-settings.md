---
title: "Get Email Notification Settings"
description: "Returns which guest emails are on, and when reminders go out."
outline: false
aside: false
---

# Get Email Notification Settings

Returns which guest emails are on, and when reminders go out.

## Endpoint

- **Method:** `GET`
- **Path:** `/fluent-event/v2/settings/email-notifications`
- **Controller:** `SettingsController@getEmailNotifications`
- **Route source:** `fluent-event/app/Http/Routes/api.php:32`
- **Controller source:** `fluent-event/app/Http/Controllers/SettingsController.php:169`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="getEmailNotificationSettings" specUrl="/openapi/public/settings/get-email-notification-settings.json" />
