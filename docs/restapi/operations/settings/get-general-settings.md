---
title: "Get General Settings"
description: "Returns the general settings and the page chosen as the All Events page."
outline: false
aside: false
---

# Get General Settings

Returns the general settings and the page chosen as the All Events page.

## Endpoint

- **Method:** `GET`
- **Path:** `/fluent-event/v2/settings/general`
- **Controller:** `SettingsController@getGeneral`
- **Route source:** `fluent-event/app/Http/Routes/api.php:23`
- **Controller source:** `fluent-event/app/Http/Controllers/SettingsController.php:18`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="getGeneralSettings" specUrl="/openapi/public/settings/get-general-settings.json" />
