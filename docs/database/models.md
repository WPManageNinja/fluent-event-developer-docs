---
title: "Models"
description: "The FluentEvent ORM models, what each one maps to, and the rules every model follows."
---

# Models

FluentEvent ships 6 models in `app/Models/`. They extend `FluentEvent\App\Models\Model`, which extends the WPFluent ORM model (an Eloquent-style query builder over `$wpdb`). Load them only after FluentEvent has booted, for example inside `fluent_event/loaded` or any later hook.

| Model | Table | Fillable columns | Description |
| --- | --- | --- | --- |
| [`Event`](/database/models/event) | `fe_event_details` | 9 | The typed half of an event: the `fe_event_details` row that sits beside its `fe_event` post. |
| [`Calendar`](/database/models/calendar) | `fe_calendars` | 4 | A calendar holds events. Each event belongs to exactly one. |
| [`Guest`](/database/models/guest) | `fe_guests` | 12 | One person on one event. A guest row is the registration. |
| [`Meta`](/database/models/meta) | `fe_meta` | 4 | Key-value rows for settings and per-event bookkeeping. |
| [`Post`](/database/models/post) | `posts` | — | Read-only view of `wp_posts`, limited to `fe_event` posts. |
| [`User`](/database/models/user) | `users` | — | Read access to `wp_users`, with the framework user proxy. |

## Shared Behaviour

Every model extends `FluentEvent\App\Models\Model`, which adds two things to the framework model:

- `$guarded = ['id', 'ID']`, on top of each model's explicit `$fillable`. Never pass raw request data to `create()` or `fill()`: pick the fields you need first.
- Dates serialize with the model's own date format (`Y-m-d H:i:s`), not ISO 8601, so JSON responses show the same strings the database holds.

## Writing Events

An event is two rows. Create and update it through `EventService::createEvent()` (or the REST API), which writes the `fe_event` post and the `fe_event_details` row in one transaction. `Event::create()` alone leaves an event with no post, which the app cannot read.

## Cleanup on Delete

There are no database foreign keys. Deleting an event or calendar fires the `before_deleted` hooks, and `CleanupHandler` removes the child rows in PHP:

- **Calendar** → each of its events, one by one.
- **Event** → its `fe_event` post, its guests and its `fe_meta` rows.
- **`fe_event` post deleted outside the plugin** → its event, the same way.
- **WordPress user deleted** → their guest rows stay, with `user_id` set to `NULL`.

Call `$event->delete()` directly and none of this happens. Fire the hooks yourself, or use the REST API.
