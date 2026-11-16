---
title: "FluentCommunity Filters"
description: "FluentCommunity filter hooks in FluentEvent."
---

# FluentCommunity Filters

1 filter hook on this page, across 1 call site.

| Hook | Filters | Call Sites |
| --- | --- | --- |
| [`fluent_event/community/route_paths`](#fluent-event-community-route-paths) | Filters the FluentCommunity portal routes that FluentEvent adds. | 1 |

<a id="fluent-event-community-route-paths"></a>

## `fluent_event/community/route_paths`

- **Type:** filter
- **Call sites:** 1
- **When it fires:** Filters the FluentCommunity portal routes that FluentEvent adds.

Runs once, on first use, when the FluentEvent feature is on in FluentCommunity. The base slug comes from FluentCommunity's FluentEvent settings (default `events`); this filter can move any single route. Keep the `:event_slug` placeholder in the routes that have it.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$paths` | `array` | Route name => portal path. Keys: `events`, `create_event`, `edit_event`, `event_view`, `space_events`, `space_event_view`. |
| 2 | `$routeSlug` | `string` | The base slug, for example `events`. |

**Return:** `array` — the filtered paths.

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/Modules/FluentCommunity/PortalHandler.php:36` | `PortalHandler::routePaths()` | `[ 'events' => $this->routeSlug, 'create_event' => $this->routeSlug . '/create', 'edit_event' => $this->routeSlug . '/:event_slug/edit', 'event_view' => $this->routeSlug . '/:event_slug', 'space_events' => $this->routeSlug, 'space_event_view' => $this->routeSlug . '/:event_slug', ]`, `$this->routeSlug` |

### Example

```php
add_filter('fluent_event/community/route_paths', function ($paths, $routeSlug) {
    $paths['create_event'] = $routeSlug . '/new';

    return $paths;
}, 10, 2);
```
