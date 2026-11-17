---
title: "Update Email Settings"
description: "Saves the sender, reply-to and footer for guest emails."
outline: false
aside: false
---

# Update Email Settings

Saves the sender, reply-to and footer for guest emails.

## Endpoint

- **Method:** `POST`
- **Path:** `/fluent-event/v2/settings/email`
- **Controller:** `SettingsController@updateEmail`
- **Route source:** `fluent-event/app/Http/Routes/api.php:29`
- **Controller source:** `fluent-event/app/Http/Controllers/SettingsController.php:153`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

## Hooks Fired

- [`fluent_event/settings/email_updated`](/hooks/actions/settings#fluent-event-settings-email-updated)

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="updateEmailSettings" specUrl="/openapi/public/settings/update-email-settings.json" />
