---
title: "Meta Model"
description: "Key-value rows for settings and per-event bookkeeping."
---

# Meta Model

Key-value rows for settings and per-event bookkeeping.

See the [`fe_meta` table](/database/schema#fe-meta) for the rows in use. `value` is cast to an array, so store JSON-shaped data. Prefix your own `meta_key` with your plugin slug.

## Class

- **Class:** `FluentEvent\App\Models\Meta`
- **Table:** `{prefix}fe_meta`
- **Primary key:** `id`
- **Extends:** `Model`
- **Source:** `fluent-event/app/Models/Meta.php`

## Attributes

| Column | Type | Cast | Fillable | Description |
| --- | --- | --- | --- | --- |
| `id` | `bigint(20) unsigned` | — | No |  |
| `object_type` | `varchar(50)` | — | Yes | `option`, `user`, `calendar` or `event`. |
| `object_id` | `bigint(20) unsigned` | `int` | Yes | The object the row belongs to. `NULL` for options. |
| `meta_key` | `varchar(191)` | — | Yes | The key. |
| `value` | `longtext` | `array` | Yes | JSON value. |
| `created_at` | `timestamp` | — | No |  |
| `updated_at` | `timestamp` | — | No |  |

## Constants

| Constant | Value | Meaning |
| --- | --- | --- |
| `Meta::OBJECT_TYPE_OPTION` | `"option"` | Plugin-wide settings. |
| `Meta::OBJECT_TYPE_USER` | `"user"` | Per-user values. |
| `Meta::OBJECT_TYPE_EVENT` | `"event"` | Per-event values. |

## Scopes

| Scope | Parameters | Description |
| --- | --- | --- |
| `ofUser()` | `$userId` | Rows of one user. |
| `byKey()` | `$metaKey` | Rows with one `meta_key`. |

## Usage

```php
use FluentEvent\App\Models\Meta;

// Store your own per-event value.
Meta::query()->updateOrCreate(
    ['object_type' => Meta::OBJECT_TYPE_EVENT, 'object_id' => $eventId, 'meta_key' => 'my_plugin_badge'],
    ['value' => ['label' => 'Featured']]
);
```
