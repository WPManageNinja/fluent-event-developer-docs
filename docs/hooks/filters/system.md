---
title: "System Filters"
description: "System filter hooks in FluentEvent."
---

# System Filters

1 filter hook on this page, across 1 call site.

| Hook | Filters | Call Sites |
| --- | --- | --- |
| [`fluent_event/is_rtl`](#fluent-event-is-rtl) | Filters whether FluentEvent loads the right-to-left versions of its stylesheets. | 1 |

<a id="fluent-event-is-rtl"></a>

## `fluent_event/is_rtl`

- **Type:** filter
- **Call sites:** 1
- **When it fires:** Filters whether FluentEvent loads the right-to-left versions of its stylesheets.

Defaults to WordPress's `is_rtl()`. The admin app, the public pages and the FluentCommunity portal chunks all read this one answer, so they never load different files.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$isRtl` | `bool` | Whether to load the `.rtl.css` files. |

**Return:** `bool` — the filtered isRtl.

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Utils/Enqueuer/Vite.php:146` | `Vite::isRtl()` | `is_rtl()` |

### Example

```php
add_filter('fluent_event/is_rtl', function ($isRtl) {
    // Change and return the first argument.
    return $isRtl;
}, 10, 1);
```
