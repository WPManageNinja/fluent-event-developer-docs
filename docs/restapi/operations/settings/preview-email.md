---
title: "Preview Email"
description: "Renders a guest email with sample data, so the settings screen can show it."
outline: false
aside: false
---

# Preview Email

Renders a guest email with sample data, so the settings screen can show it.

Uses a sample online event that starts in 7 days and a sample guest. Nothing is sent.

## Endpoint

- **Method:** `GET`
- **Path:** `/fluent-event/v2/settings/email-notifications/preview/{type}`
- **Controller:** `SettingsController@previewEmail`
- **Route source:** `fluent-event/app/Http/Routes/api.php:34`
- **Controller source:** `fluent-event/app/Http/Controllers/SettingsController.php:193`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="previewEmail" specUrl="/openapi/public/settings/preview-email.json" />
