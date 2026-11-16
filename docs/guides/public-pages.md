---
title: Public Pages, Shortcodes & Blocks
description: How FluentEvent serves event pages, and how to place event lists and single events with shortcodes, blocks and theme templates.
---

# Public Pages, Shortcodes & Blocks

FluentEvent gives every event its own page and lists events on an archive page, with no setup. You can also place an event list or a single event on any page with a shortcode or a block.

## Event URLs

The `fe_event` post type is public. WordPress serves:

| URL | Shows |
| --- | --- |
| `/<event_slug>/<post_slug>/` | One event. |
| `/<event_slug>/` | The events archive: the same list as `[fluent_events]`. |

`event_slug` is a setting (**Settings → General**, default `event`). When an **All Events Page** is set, the archive links point to that page instead.

Which events the public sees depends on the event and its calendar:

| Event status | Calendar `public` | Calendar `private` or `draft` |
| --- | --- | --- |
| `public` | Listed and opens by link | Hidden |
| `unlisted` | Opens by link only | Hidden |
| `private`, `draft` | Hidden | Hidden |

Hidden events return a 404, stay out of search, embeds and canonical redirects, and get `noindex`. Use `EventPageService::url($event)` to build an event's URL in PHP.

::: info The public pages do not know their viewers
Everyone, logged in or not, sees the public pages as a visitor: nothing is prefilled and there is no member state. The meeting link of an online event shows only after the viewer registers on the page. The member experience lives in the [FluentCommunity portal](/guides/fluentcommunity).
:::

## Shortcodes

### `[fluent_events]`

An event list with search, calendar chips and a view switcher.

```text
[fluent_events calendar="team-meetups" view="calendar" filter="upcoming" view_switch="no" show_calendars="no"]
```

| Attribute | Values | Default | Meaning |
| --- | --- | --- | --- |
| `calendar` | A calendar slug | All public calendars | Start on this calendar. With `show_calendars="no"`, show only this calendar. A non-public calendar shows nothing. |
| `view` | `cards`, `timeline`, `calendar` | **Settings → General → Default view** | The layout to start in. |
| `filter` | `upcoming`, `all`, `past` | `upcoming` | Which events to start with. |
| `view_switch` | `yes`, `no` | **Settings → General** | `no` hides the layout switcher and locks the layout. |
| `show_calendars` | `yes`, `no` | `yes` | Show the calendar chips. |

Visitors can change the view, filter, search and calendar with query arguments (`view`, `filter`, `fe_search`, `fe_calendar`, `fe_page`, and `span`/`date` in the calendar view). Links to the list keep their state.

### `[fluent_event]`

One event, with its cover, details, description and registration card.

```text
[fluent_event event="spring-meetup"]
```

| Attribute | Values | Meaning |
| --- | --- | --- |
| `event` | An event post slug | The event to show. Without it, the shortcode shows the event of the current event page. |

Only events the public may see render. Anything else shows a "not found" message.

## Blocks

| Block | Attributes | Same as |
| --- | --- | --- |
| `fluent-event/events` | `calendar`, `view`, `filter`, `view_switch`, `show_calendars` | `[fluent_events]` |
| `fluent-event/event` | `event` | `[fluent_event]` |
| `fluent-event/event-cover` | — | The cover image of the current event |
| `fluent-event/event-title` | — | The title |
| `fluent-event/event-meta` | — | Date, time and location |
| `fluent-event/event-calendar` | — | The calendar badge |
| `fluent-event/event-description` | — | The description |
| `fluent-event/event-registration` | — | The registration card |

The `event-*` part blocks render the event of the current event page. Both list blocks support wide and full alignment. Block attributes accept the same values as the shortcode attributes; any other value is ignored.

## Theme Templates

**Block themes.** FluentEvent registers two templates you can edit in **Appearance → Editor → Templates**:

- `single-fe_event`: built from the `event-*` part blocks, so you can reorder or remove each piece.
- `archive-fe_event`: holds one `fluent-event/events` block.

**Classic themes.** FluentEvent renders event pages and the archive inside its own `theme-page.php`, between your theme's header and footer. To take over, add `single-fe_event.php` or `archive-fe_event.php` to your theme; FluentEvent then steps aside.

```php
<?php
// wp-content/themes/your-theme/single-fe_event.php
get_header();

echo do_shortcode('[fluent_event]');

get_footer();
```

## Registration on the Event Page

The registration card posts to [`POST /portal/events/{id}/register-guest`](/restapi/operations/portal/register-visitor) with a per-event nonce. It works for `rsvp` and `open` events while the event has not ended, and always records the guest as `going`. Successful registration fires [`fluent_event/guest/created`](/hooks/actions/guests#fluent-event-guest-created) with `source = wordpress_pages`.
