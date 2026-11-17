---
title: "Update General Settings"
description: "Saves the general settings. Send only the fields of the box you save; the others keep their values."
outline: false
aside: false
---

# Update General Settings

Saves the general settings. Send only the fields of the box you save; the others keep their values.

A changed `event_slug` changes every event URL (`/<event_slug>/<post_slug>/`); WordPress rebuilds its rewrite rules on the next request. `events_page_id` must be a published page, or `0` for none.

## Endpoint

- **Method:** `POST`
- **Path:** `/fluent-event/v2/settings/general`
- **Controller:** `SettingsController@updateGeneral`
- **Route source:** `fluent-event/app/Http/Routes/api.php:24`
- **Controller source:** `fluent-event/app/Http/Controllers/SettingsController.php:26`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

## Hooks Fired

- [`fluent_event/settings/general_updated`](/hooks/actions/settings#fluent-event-settings-general-updated)

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="updateGeneralSettings" specUrl="/openapi/public/settings/update-general-settings.json" />
