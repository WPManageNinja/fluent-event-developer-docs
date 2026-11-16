---
title: "Query Builder"
description: "Query FluentEvent data with the WPFluent ORM: scopes, eager loading, pagination and the DB facade."
---

# Query Builder

FluentEvent models use the WPFluent ORM, an Eloquent-style query builder that runs on `$wpdb`. If you know Laravel's Eloquent, most of it will look familiar. Table prefixes are added for you: write `fe_guests`, not `wp_fe_guests`.

## Basic Queries

```php
use FluentEvent\App\Models\Event;
use FluentEvent\App\Models\Guest;

$event  = Event::query()->find(42);          // null when missing
$event  = Event::query()->findOrFail(42);    // throws, which the REST layer turns into a 404
$count  = Guest::query()->where('event_id', 42)->count();
$emails = Guest::query()->where('event_id', 42)->pluck('email');
```

## Scopes

Each model ships scopes that match what the admin screens filter by. Chain them like any other condition. A scope that receives an empty value adds no condition, so you can pass request input straight through.

```php
$events = Event::query()
    ->searchBy($search)          // post title LIKE
    ->byCalendar($calendarId)    // 0 or null = every calendar
    ->byStatus(['public', 'unlisted'])
    ->inDateRange('2026-12-01', '2026-12-31')
    ->byPeriod('upcoming')
    ->get();
```

## Eager Loading

An event's title lives on its post. Load the post with the events, or every `$event->title` runs its own query.

```php
$events = Event::query()
    ->with(['post', 'calendar'])
    ->withCount('guests')
    ->limit(20)
    ->get();
```

Limit the columns of a relation with a closure:

```php
Event::query()->with([
    'post' => function ($query) {
        $query->select(['ID', 'post_title']);
    },
]);
```

## Pagination

```php
$page = Guest::query()
    ->where('event_id', 42)
    ->orderBy('id', 'DESC')
    ->paginate(20);   // reads ?page= from the request

$page->total();
$page->items();
```

## Aggregates

```php
// Guests per status for one event.
$rows = Guest::query()
    ->where('event_id', 42)
    ->selectRaw('status, COUNT(*) AS total')
    ->groupBy('status')
    ->pluck('total', 'status');
```

## Transactions

Use the `DB` facade when two writes must land together. Let exceptions escape the closure: catching one inside it commits the half that already ran.

```php
use FluentEvent\Facade\DB;

DB::transaction(function () use ($event, $calendarId) {
    $event->calendar_id = $calendarId;
    $event->save();

    Guest::query()->where('event_id', $event->id)->update(['calendar_id' => $calendarId]);
});
```

## Rules of Thumb

- Pass validated, explicit fields to `create()` and `fill()`. Never pass the whole request.
- Bulk `update()` and `delete()` skip model events and FluentEvent's hooks. Use them for your own data, not to delete events or guests.
- `start_at` and `end_at` are UTC. Convert with `FluentEvent\App\Utils\DateTimeHelper::convertToUtc()` before you compare them with local dates.
