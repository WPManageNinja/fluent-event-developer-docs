---
title: "Settings API"
description: "General, email sender and email notification settings, the All Events page, and email previews."
---

# Settings API

General, email sender and email notification settings, the All Events page, and email previews.

## Authentication

- Every endpoint requires the `manage_options` capability. Send a cookie plus `X-WP-Nonce`, or use an Application Password.

## Endpoints

| Method | Path | Operation | What it does |
| --- | --- | --- | --- |
| `GET` | `/settings/general` | [Get General Settings](/restapi/operations/settings/get-general-settings) | Returns the general settings and the page chosen as the All Events page. |
| `POST` | `/settings/general` | [Update General Settings](/restapi/operations/settings/update-general-settings) | Saves the general settings. Send only the fields of the box you save; the others keep their values. |
| `GET` | `/settings/pages` | [Search Pages](/restapi/operations/settings/search-pages) | Searches published pages for a page setting, and says whether each page already holds the right shortcode or block. |
| `POST` | `/settings/create-page` | [Create Page](/restapi/operations/settings/create-page) | Creates a published page that holds the events block, and selects it for the setting. |
| `GET` | `/settings/email` | [Get Email Settings](/restapi/operations/settings/get-email-settings) | Returns the sender name and address, reply-to and email footer used for guest emails. |
| `POST` | `/settings/email` | [Update Email Settings](/restapi/operations/settings/update-email-settings) | Saves the sender, reply-to and footer for guest emails. |
| `GET` | `/settings/email-notifications` | [Get Email Notification Settings](/restapi/operations/settings/get-email-notification-settings) | Returns which guest emails are on, and when reminders go out. |
| `POST` | `/settings/email-notifications` | [Update Email Notification Settings](/restapi/operations/settings/update-email-notification-settings) | Turns the confirmation, cancellation and reminder emails on or off, and sets up to five reminder times. |
| `GET` | `/settings/email-notifications/preview/{type}` | [Preview Email](/restapi/operations/settings/preview-email) | Renders a guest email with sample data, so the settings screen can show it. |
