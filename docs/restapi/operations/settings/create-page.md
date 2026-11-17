---
title: "Create Page"
description: "Creates a published page that holds the events block, and selects it for the setting."
outline: false
aside: false
---

# Create Page

Creates a published page that holds the events block, and selects it for the setting.

The page content is fixed by the plugin; the request only sets the title.

## Endpoint

- **Method:** `POST`
- **Path:** `/fluent-event/v2/settings/create-page`
- **Controller:** `SettingsController@createPage`
- **Route source:** `fluent-event/app/Http/Routes/api.php:26`
- **Controller source:** `fluent-event/app/Http/Controllers/SettingsController.php:86`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

## Hooks Fired

- [`fluent_event/settings/general_updated`](/hooks/actions/settings#fluent-event-settings-general-updated)

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="createPage" specUrl="/openapi/public/settings/create-page.json" />
