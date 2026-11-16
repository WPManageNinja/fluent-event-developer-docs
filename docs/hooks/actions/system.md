---
title: "System Actions"
description: "System action hooks in FluentEvent."
---

# System Actions

2 action hooks on this page, across 3 call sites.

| Hook | Fires | Call Sites |
| --- | --- | --- |
| [`fluent_event/loaded`](#fluent-event-loaded) | On `plugins_loaded`, once the FluentEvent application has booted. | 1 |
| [`fluent_event/update_verification_failed`](#fluent-event-update-verification-failed) | When a downloaded plugin update fails its checksum check and is not installed. | 2 |

<a id="fluent-event-loaded"></a>

## `fluent_event/loaded`

- **Type:** action
- **Call sites:** 1
- **When it fires:** On `plugins_loaded`, once the FluentEvent application has booted.

The safe place to start an add-on: the models, services and facades are loaded.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$app` | `FluentEvent\Framework\Foundation\Application` | The FluentEvent application container. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/boot/app.php:39` | — | `$app` |

### Example

```php
add_action('fluent_event/loaded', function ($app) {
    // FluentEvent is ready. Register your hooks here.
    require_once __DIR__ . '/includes/my-fluent-event-addon.php';
});
```

<a id="fluent-event-update-verification-failed"></a>

## `fluent_event/update_verification_failed`

- **Type:** action
- **Call sites:** 2
- **When it fires:** When a downloaded plugin update fails its checksum check and is not installed.

The updater refuses an update package whose checksum is missing or does not match the one published with the release. Only builds that ship the updater fire this; the WordPress.org build does not.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$slug` | `string` | The plugin slug. |
| 2 | `$reason` | `string` | `checksum_missing` or `checksum_mismatch`. |

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Services/PluginManager/PluginUpdater.php:316` | `PluginUpdater::verifyPackage()` | `$this->config['slug']`, `'checksum_missing'` |
| `fluent-event/app/Services/PluginManager/PluginUpdater.php:361` | `PluginUpdater::verifyPackage()` | `$this->config['slug']`, `'checksum_mismatch'` |

### Example

```php
add_action('fluent_event/update_verification_failed', function ($slug, $reason) {
    // Your code here.
}, 10, 2);
```
