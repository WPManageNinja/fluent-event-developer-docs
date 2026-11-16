---
title: "Events Filters"
description: "Events filter hooks in FluentEvent."
---

# Events Filters

3 filter hooks on this page, across 3 call sites.

| Hook | Filters | Call Sites |
| --- | --- | --- |
| [`fluent_event/event_api_response`](#fluent-event-event-api-response) | Filters one event before the admin editor or the portal edit page loads it. | 1 |
| [`fluent_event/event_venue_max_length`](#fluent-event-event-venue-max-length) | Filters the longest venue name an event accepts, in characters. | 1 |
| [`fluent_event/events_api_response`](#fluent-event-events-api-response) | Filters the admin events list before it is returned. | 1 |

<a id="fluent-event-event-api-response"></a>

## `fluent_event/event_api_response`

- **Type:** filter
- **Call sites:** 1
- **When it fires:** Filters one event before the admin editor or the portal edit page loads it.

Wraps `GET /events/{id}` and `GET /events/by-slug`. The event has its `post` and `calendar` relations loaded, the `description` attribute appended, and `guests_count` set.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$data` | `array` | `['event' => Event, 'public_url' => string]`. |
| 2 | `$event` | `Event` | The event being returned. |

**Return:** `array` — the filtered data.

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Http/Controllers/EventController.php:88` | `EventController::getEvent()` | `$data`, `$event` |

### Listeners Inside FluentEvent

FluentEvent itself listens to this hook. Use a priority below or above these to run before or after them.

| Priority | Handler | Source |
| --- | --- | --- |
| 10 | `[$this, 'addFeedUrl']` | `fluent-event/Modules/FluentCommunity/FeedHandler.php:48` |

### Example

```php
add_filter('fluent_event/event_api_response', function ($data, $event) {
    $data['sponsor'] = get_post_meta($event->post_id, '_my_sponsor', true);

    return $data;
}, 10, 2);
```

<a id="fluent-event-event-venue-max-length"></a>

## `fluent_event/event_venue_max_length`

- **Type:** filter
- **Call sites:** 1
- **When it fires:** Filters the longest venue name an event accepts, in characters.

The default is `100`. The value is clamped to 1–255, because 255 is the limit the validation rule had before the filter existed. The same limit drives the REST validation rule and its error message.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$length` | `int` | Maximum venue length. Default `100`. |

**Return:** `int` — the filtered length.

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Models/Event.php:73` | `Event::venueMaxLength()` | `100` |

### Example

```php
add_filter('fluent_event/event_venue_max_length', function () {
    return 200;
});
```

<a id="fluent-event-events-api-response"></a>

## `fluent_event/events_api_response`

- **Type:** filter
- **Call sites:** 1
- **When it fires:** Filters the admin events list before it is returned.

Wraps `GET /events`. `$data['events']` is a paginator (with `data`, `total`, `current_page` and the rest) or, for a calendar window of at most 62 days with `paginate=false`, a plain collection. Each event has its `post` (ID and title) and `calendar` loaded, and a `guests_count` of every guest row.

The FluentCommunity bridge uses this filter to add `feed_url` to events that have a community post.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$data` | `array` | `['events' => paginator or collection of Event]`. |
| 2 | `$request` | `array` | All request parameters. |

**Return:** `array` — the filtered data.

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Http/Controllers/EventController.php:59` | `EventController::getAllEvents()` | `$data`, `$request->all()` |

### Listeners Inside FluentEvent

FluentEvent itself listens to this hook. Use a priority below or above these to run before or after them.

| Priority | Handler | Source |
| --- | --- | --- |
| 10 | `[$this, 'addFeedUrls']` | `fluent-event/Modules/FluentCommunity/FeedHandler.php:47` |

### Example

```php
add_filter('fluent_event/events_api_response', function ($data, $request) {
    foreach ($data['events'] as $event) {
        $event->setAttribute('ticket_url', get_post_meta($event->post_id, '_my_ticket_url', true));
    }

    return $data;
}, 10, 2);
```
