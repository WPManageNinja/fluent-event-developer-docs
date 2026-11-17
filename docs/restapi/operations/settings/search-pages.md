---
title: "Search Pages"
description: "Searches published pages for a page setting, and says whether each page already holds the right shortcode or block."
outline: false
aside: false
---

# Search Pages

Searches published pages for a page setting, and says whether each page already holds the right shortcode or block.

Returns at most 50 pages, by title.

## Endpoint

- **Method:** `GET`
- **Path:** `/fluent-event/v2/settings/pages`
- **Controller:** `SettingsController@getPages`
- **Route source:** `fluent-event/app/Http/Routes/api.php:25`
- **Controller source:** `fluent-event/app/Http/Controllers/SettingsController.php:61`

## Permissions

- Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.

::: tip Live sample
The request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.
:::

<OAOperation operationId="searchPages" specUrl="/openapi/public/settings/search-pages.json" />
