---
title: "Event Model"
description: "The typed half of an event: the `fe_event_details` row that sits beside its `fe_event` post."
---

# Event Model

The typed half of an event: the `fe_event_details` row that sits beside its `fe_event` post.

The `post` relation holds the identity: `title` and `description` are computed attributes that read `post_title` and `post_content`. Eager load the post (`->with('post')`) whenever you read titles in a loop, or each event runs its own query.

## Class

- **Class:** `FluentEvent\App\Models\Event`
- **Table:** `{prefix}fe_event_details`
- **Primary key:** `id`
- **Extends:** `Model`
- **Source:** `fluent-event/app/Models/Event.php`

## Attributes

| Column | Type | Cast | Fillable | Description |
| --- | --- | --- | --- | --- |
| `id` | `bigint(20) unsigned` | — | No |  |
| `post_id` | `bigint(20) unsigned` | `int` | Yes | The `fe_event` post in `wp_posts`. Unique: one details row per post. |
| `calendar_id` | `bigint(20) unsigned` | `int` | Yes | The calendar that holds the event. |
| `parent_event_id` | `bigint(20) unsigned` | — | Yes | Reserved for recurrence. Always `NULL` today. |
| `status` | `varchar(64)` | — | Yes | `public`, `unlisted`, `private` or `draft`. The post status follows it. |
| `start_at` | `datetime` | — | Yes | Start, in UTC. |
| `end_at` | `datetime` | — | Yes | End, in UTC. Always after `start_at`. |
| `timezone` | `varchar(64)` | — | Yes | The organizer's time zone, for example `Europe/Berlin`. Local times are shown in it. |
| `venue_type` | `varchar(64)` | — | Yes | `offline` or `online`. |
| `meta` | `longtext` | `array` | Yes | Open-ended JSON. See below. |
| `created_at` | `timestamp` | — | No |  |
| `updated_at` | `timestamp` | — | No |  |

## Computed Attributes

| Attribute | Appended to JSON | Description |
| --- | --- | --- |
| `title` | Yes | The post title as plain text, with `&`, `<`, `>` and quotes decoded. Escape it wherever you print it. |
| `description` | No | The post content, run through `wp_kses_post()`. Not appended by default: call `->append('description')`. |
| `start_at_local` | Yes | `start_at` in the event's own time zone. Use it on the event page and in guest emails. |
| `end_at_local` | Yes | `end_at` in the event's own time zone. |
| `start_at_site` | Yes | `start_at` in the site's time zone. Lists and the date filters use it. |
| `end_at_site` | Yes | `end_at` in the site's time zone. |

Hidden from JSON: `post`.

## The `meta` Column

`Event::defaultMeta()` documents the keys. Saves merge into the stored value, so a key you add yourself survives the plugin's own updates.

| Key | Meaning |
| --- | --- |
| `entry_type` | How people join: `rsvp` (going / not going), `open` (a Register button) or `none` (view only). |
| `show_guest_count` | `yes` or `no`: show how many people are going. |
| `capacity` | The most guests that can be going at once, for `rsvp` and `open` events. `0` (the default) means no limit. Going and checked-in guests hold a seat. Admins can add guests past it. |
| `show_spots_left` | `yes` or `no` (the default): show the spots left on an event with a capacity. With `show_guest_count` also on, the event page shows a meter. |
| `start_display` | How the event page shows the time before the start: `relative` ("Starts in 3 days", the default) or `countdown` (a live countdown). |
| `cover_url` | Cover image URL. Images are stored as URLs, never as attachment IDs. |
| `online_meeting_url` | Meeting link for an online event. Shown only to guests who hold a seat. |
| `venue` | Venue name for an offline event. |
| `address` | Address for an offline event. |
| `description_md` | The description as Markdown, as typed in the editor. The post holds the rendered HTML. |

## Constants

| Constant | Value | Meaning |
| --- | --- | --- |
| `Event::STATUSES` | `"public,unlisted,private,draft"` | Every event status. |
| `Event::LIVE_STATUSES` | `["public","unlisted","private"]` | Statuses that count as a running event for reminders and the community portal. |
| `Event::VENUE_TYPES` | `"offline,online"` | Allowed `venue_type` values. |
| `Event::ENTRY_TYPES` | `"rsvp,open,none"` | Allowed `meta.entry_type` values. |
| `Event::SEAT_STATUSES` | `["going","checked_in"]` | Guest statuses that hold a seat. Only these get reminders and the meeting link. |
| `Event::POST_STATUSES` | `{"public":"publish","unlisted":"publish","private":"private","draft":"draft"}` | Event status → `post_status` of its post. |

## Relationships

| Method | Type | Related Model | Keys |
| --- | --- | --- | --- |
| `guests()` | `hasMany` | [Guest](/database/models/guest) | `event_id` → `id` |
| `calendar()` | `belongsTo` | [Calendar](/database/models/calendar) | `calendar_id` → `id` |
| `post()` | `belongsTo` | [Post](/database/models/post) | `post_id` → `ID` |

## Scopes

| Scope | Parameters | Description |
| --- | --- | --- |
| `searchBy()` | `$search` | Matches the post title with `LIKE`. |
| `byCalendar()` | `$calendarId` | Limits to one calendar. A falsy ID adds no condition. |
| `byStatus()` | `$status` | Limits to one status or a list of statuses. |
| `inDateRange()` | `$from`, `$to` | Events that overlap a `Y-m-d` range, read as whole days in the site's time zone. |
| `byPeriod()` | `$period` | `upcoming` (not ended, soonest first), `past` (ended, latest first), or anything else: upcoming first, then by distance from now. |

## Methods

| Method | Description |
| --- | --- |
| `::defaultMeta()` | The `meta` keys and their defaults. |
| `::venueMaxLength()` | The venue length limit, after the `fluent_event/event_venue_max_length` filter. |
| `::postStatusFor($status)` | Maps an event status to a `post_status`. |

## Usage

```php
use FluentEvent\App\Models\Event;

// The next five public events in calendar 3, with their posts loaded.
$events = Event::query()
    ->with('post')
    ->byCalendar(3)
    ->byStatus('public')
    ->byPeriod('upcoming')
    ->limit(5)
    ->get();

foreach ($events as $event) {
    echo esc_html($event->title) . ' — ' . esc_html($event->start_at_local);
}
```
