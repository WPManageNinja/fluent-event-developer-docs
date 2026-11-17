---
title: "Get Email Settings"
description: "Returns the sender name and address, reply-to and email footer used for guest emails."
outline: false
aside: false
---

# Get Email Settings

Returns the sender name and address, reply-to and email footer used for guest emails.

## Endpoint

- **Method:** `GET`
- **Path:** `/fluent-event/v2/settings/email`
- **Controller:** `SettingsController@getEmail`
- **Route source:** `fluent-event/app/Http/Routes/api.php:28`
- **Controller source:** `fluent-event/app/Http/Controllers/SettingsController.php:144`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="getEmailSettings" specUrl="/openapi/public/settings/get-email-settings.json" />
