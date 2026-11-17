---
title: Services & Utilities
description: Reference for the FluentEvent services and utility classes most useful to add-on developers.
---

# Services & Utilities

All classes are in the `FluentEvent\App\Services` or `FluentEvent\App\Utils` namespace, and every method listed is `public static`.

## EventService

`FluentEvent\App\Services\EventService`: event writes and the event payload the portal reads.

| Method | Description |
| --- | --- |
| `createEvent(array $data, $authorId = null)` | Creates the `fe_event` post and its `fe_event_details` row in one transaction and returns the `Event`. `$data` is the output of `EventRequest::format()`. Does not fire `fluent_event/event/created`. |
| `editUrl($eventId)` | The admin URL of the event editor. |
| `seatCounts(array $eventIds)` | Event ID → number of guests holding a seat (`going` or `checked_in`). |
| `formatEvents($events, $options = [])` | Formats events (loaded with `post`) for the portal: seat counts, the current user's status, permissions. Keyed by event ID. |
| `formatEvent($event, $seats, $myStatus, $isStaff, $canEdit)` | Formats one event. Hides the meeting link unless `$myStatus` holds a seat, the caller is staff, or the event is `none`. |

## RegistrationService

`FluentEvent\App\Services\RegistrationService`: self-registration, shared by the portal and the public event page. The callers check visibility, validate and fire the guest hooks.

| Method | Description |
| --- | --- |
| `refusal(Event $event, array $entryTypes)` | Why the event refuses a registration, or `''` when it takes one. Refuses when `meta.entry_type` is not in `$entryTypes`, or the event has ended. |
| `registerMember(Event $event, \WP_User $user, $status, $name, array $source)` | Creates or updates a member's guest row. A visitor's row that the member claims takes the member's name. Returns `[Guest, previous status, created]`, `null` when another account holds the email, or `false` when a concurrent request changed the row. |
| `registerVisitor(Event $event, array $data, array $source)` | Creates a `going` guest row from a validated `name` and `email`. |
| `hasGuestEmail(Event $event, $email)` | Whether any guest row on the event has this email. The visitor forms use it to answer a repeated email as a new registration, without saving. |
| `queueEmail(Guest $guest, $previousStatus)` | Queues the confirmation or cancellation email that matches the status change, if that email is turned on. |

## CalendarService

`FluentEvent\App\Services\CalendarService`: calendars that belong to FluentCommunity.

| Method | Description |
| --- | --- |
| `findBySpace($spaceId)` | The calendar of a FluentCommunity space (`meta.fcom_space_id`), or `null`. |
| `createForSpace($spaceId, $title, $slug)` | Creates a private calendar for a space. |
| `findGlobal()` | The shared Community calendar (`meta.fcom_global = true`), or `null`. |
| `createGlobal()` | Creates the Community calendar. |
| `uniqueSlug($slug, $ignoreId = 0)` | A calendar slug that is not taken yet. |

## ReportService

`FluentEvent\App\Services\ReportService`: the numbers behind the dashboard.

| Method | Description |
| --- | --- |
| `getStats()` | Dashboard tiles: total, upcoming, ongoing and completed events, and guest totals. |
| `getCalendarStats($calendarId)` | The same tiles for one calendar. |
| `getOngoingEvents($limit = 3)` | Events running now, soonest to end first. |
| `getUpcomingEvents($limit = 3, $calendarId = 0)` | Future events, soonest first. |
| `getTopEvents($limit = 5)` | Events ranked by guests holding a seat. |
| `getGuestTrends($start, $end)` | New guests per day (per month above 92 days) between two `Y-m-d` dates, as chart data. |

## Settings

`FluentEvent\App\Services\Settings`: plugin settings with their defaults merged in.

| Method | Description |
| --- | --- |
| `get($key = Settings::GENERAL)` | One settings group: `Settings::GENERAL` (from the `fe_settings` option), `Settings::EMAIL` or `Settings::EMAIL_NOTIFICATIONS` (from `fe_meta`). |
| `update($key, array $values)` | Saves a settings group and returns it. Does not fire the settings hooks. |
| `reminderInSeconds($reminder)` | `['value' => 24, 'unit' => 'hours']` → `86400`. |

```php
use FluentEvent\App\Services\Settings;

$slug = Settings::get()['event_slug'];                 // "event"
$from = Settings::get(Settings::EMAIL)['from_email'];
```

## EventPageService

`FluentEvent\App\Services\EventPageService`: URLs and markup of the public pages.

| Method | Description |
| --- | --- |
| `url(Event $event)` | The event's public URL. |
| `listUrl()` | The All Events page, or the events archive when none is set. |
| `pageId($key)` | The page chosen for a page setting while it is published, else `0`. |

## DateTimeHelper

`FluentEvent\App\Utils\DateTimeHelper`. `DateTimeHelper::FORMAT` is `Y-m-d H:i:s`.

| Method | Description |
| --- | --- |
| `convertToUtc($dateTime, $timezone, $format = FORMAT)` | A local date-time in `$timezone` → UTC. |
| `convertFromUtc($dateTime, $timezone, $format = FORMAT)` | A UTC date-time → local in `$timezone`. |
| `getValidatedTimeZone($timezone)` | The zone when it is valid, else the site's zone. |
| `isDate($value)` | Whether the value is a real `Y-m-d` date. |
| `dateTimeRange($start, $end, $zone)` | A readable span, for example "Nov 6, 3:52 PM – 5:52 PM (Asia/Dhaka)". |
| `icsFile(array $event)` | An iCalendar (`.ics`) file body for one event. |

## Utility

| Method | Description |
| --- | --- |
| `FluentEvent\App\Utils\Utility::mdToHtml($markdown)` | Markdown → sanitized HTML, as the event description is stored. |
