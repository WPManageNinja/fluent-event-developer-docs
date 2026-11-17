/**
 * Prose for the database pages. Column types, indexes, fillable lists, casts,
 * relationships and scopes are read from the source; this file says what they mean.
 */

export default {
  /** One line per table, for the inventory and the table heading. */
  tables: {
    fe_calendars: 'Calendars. Every event belongs to exactly one.',
    fe_event_details: 'The typed half of an event: dates, calendar, venue type and the `meta` JSON. 1:1 with its `fe_event` post.',
    fe_ticket_types: 'Reserved for the future `ticketed` entry mode. No code reads or writes it yet.',
    fe_guests: 'One row per person per event. A guest row is the registration; there is no separate registrations table.',
    fe_meta: 'Key-value storage for settings and per-event bookkeeping, scoped by `object_type`.',
    fe_notifications: 'Reserved for in-app notifications. No code reads or writes it yet.',
    fe_notification_users: 'Reserved for per-user notification delivery and preferences. No code reads or writes it yet.',
  },

  /** WordPress tables FluentEvent reads or writes, listed under the plugin tables. */
  wordpressTables: {
    wp_posts: 'Holds the `fe_event` post: title, slug, description (HTML), status and author.',
    wp_users: 'WordPress users. Hosts and logged-in guests link here through `user_id`.',
    wp_options: 'The general settings, under the option key `fe_settings`.',
  },

  /** Longer notes printed under a table's heading on the schema page. */
  tableNotes: {
    fe_event_details: `\`status\` is \`public\`, \`unlisted\`, \`private\` or \`draft\`, and the post's \`post_status\` follows it on every write (\`public\` and \`unlisted\` → \`publish\`, \`private\` → \`private\`, \`draft\` → \`draft\`). \`start_at\` and \`end_at\` are stored in **UTC**; \`timezone\` is the organizer's zone, used to show local times.`,
    fe_guests: `\`email\` and \`user_id\` are each unique per event, so one person cannot hold two rows on one event. \`group_id\` ties the rows of one order together and \`is_buyer = 1\` marks the row that carries the order; with RSVP and open registration every row is its own order. The payment columns (\`payment_status\`, \`payment_ref\`, \`price\`, \`paid_at\`) and \`ticket_type_id\` are reserved for ticketing and stay \`NULL\` today.`,
    fe_meta: `Rows in use today:

| \`object_type\` | \`object_id\` | \`meta_key\` | \`value\` |
| --- | --- | --- | --- |
| \`option\` | \`NULL\` | \`email\` | Email sender settings (JSON) |
| \`option\` | \`NULL\` | \`email_notifications\` | Email notification settings (JSON) |
| \`event\` | event ID | \`reminder_email:<seconds>\` | One reminder send: \`{"status": "scheduled\\|completed\\|skipped", "cursor": <last guest ID>}\` |
| \`event\` | event ID | \`fcom_feed_id\` | The FluentCommunity post that shows the event |`,
  },

  overview: `## Shared Behaviour

Every model extends \`FluentEvent\\App\\Models\\Model\`, which adds two things to the framework model:

- \`$guarded = ['id', 'ID']\`, on top of each model's explicit \`$fillable\`. Never pass raw request data to \`create()\` or \`fill()\`: pick the fields you need first.
- Dates serialize with the model's own date format (\`Y-m-d H:i:s\`), not ISO 8601, so JSON responses show the same strings the database holds.

## Writing Events

An event is two rows. Create and update it through \`EventService::createEvent()\` (or the REST API), which writes the \`fe_event\` post and the \`fe_event_details\` row in one transaction. \`Event::create()\` alone leaves an event with no post, which the app cannot read.

## Cleanup on Delete

There are no database foreign keys. Deleting an event or calendar fires the \`before_deleted\` hooks, and \`CleanupHandler\` removes the child rows in PHP:

- **Calendar** → each of its events, one by one.
- **Event** → its \`fe_event\` post, its guests and its \`fe_meta\` rows.
- **\`fe_event\` post deleted outside the plugin** → its event, the same way.
- **WordPress user deleted** → their guest rows stay, with \`user_id\` set to \`NULL\`.

Call \`$event->delete()\` directly and none of this happens. Fire the hooks yourself, or use the REST API.`,

  models: {
    Event: {
      summary: 'The typed half of an event: the `fe_event_details` row that sits beside its `fe_event` post.',
      notes: `The \`post\` relation holds the identity: \`title\` and \`description\` are computed attributes that read \`post_title\` and \`post_content\`. Eager load the post (\`->with('post')\`) whenever you read titles in a loop, or each event runs its own query.`,
      columns: {
        post_id: 'The `fe_event` post in `wp_posts`. Unique: one details row per post.',
        calendar_id: 'The calendar that holds the event.',
        parent_event_id: 'Reserved for recurrence. Always `NULL` today.',
        status: '`public`, `unlisted`, `private` or `draft`. The post status follows it.',
        start_at: 'Start, in UTC.',
        end_at: 'End, in UTC. Always after `start_at`.',
        timezone: "The organizer's time zone, for example `Europe/Berlin`. Local times are shown in it.",
        venue_type: '`offline` or `online`.',
        meta: 'Open-ended JSON. See below.',
      },
      notFillable: ' they are set by the database.',
      accessors: {
        title: 'The post title as plain text, with `&`, `<`, `>` and quotes decoded. Escape it wherever you print it.',
        description: 'The post content, run through `wp_kses_post()`. Not appended by default: call `->append(\'description\')`.',
        start_at_local: "`start_at` in the event's own time zone. Use it on the event page and in guest emails.",
        end_at_local: "`end_at` in the event's own time zone.",
        start_at_site: "`start_at` in the site's time zone. Lists and the date filters use it.",
        end_at_site: "`end_at` in the site's time zone.",
      },
      metaColumn: 'meta',
      meta: `\`Event::defaultMeta()\` documents the keys. Saves merge into the stored value, so a key you add yourself survives the plugin's own updates.

| Key | Meaning |
| --- | --- |
| \`entry_type\` | How people join: \`rsvp\` (going / not going), \`open\` (a Register button) or \`none\` (view only). |
| \`show_guest_count\` | \`yes\` or \`no\`: show how many people are going. |
| \`start_display\` | How the event page shows the time before the start: \`relative\` ("Starts in 3 days", the default) or \`countdown\` (a live countdown). |
| \`cover_url\` | Cover image URL. Images are stored as URLs, never as attachment IDs. |
| \`online_meeting_url\` | Meeting link for an online event. Shown only to guests who hold a seat. |
| \`venue\` | Venue name for an offline event. |
| \`address\` | Address for an offline event. |
| \`description_md\` | The description as Markdown, as typed in the editor. The post holds the rendered HTML. |`,
      consts: {
        STATUSES: 'Every event status.',
        LIVE_STATUSES: 'Statuses that count as a running event for reminders and the community portal.',
        VENUE_TYPES: 'Allowed `venue_type` values.',
        ENTRY_TYPES: 'Allowed `meta.entry_type` values.',
        SEAT_STATUSES: 'Guest statuses that hold a seat. Only these get reminders and the meeting link.',
        POST_STATUSES: 'Event status → `post_status` of its post.',
      },
      scopes: {
        searchBy: 'Matches the post title with `LIKE`.',
        byCalendar: 'Limits to one calendar. A falsy ID adds no condition.',
        byStatus: 'Limits to one status or a list of statuses.',
        inDateRange: "Events that overlap a `Y-m-d` range, read as whole days in the site's time zone.",
        byPeriod: '`upcoming` (not ended, soonest first), `past` (ended, latest first), or anything else: upcoming first, then by distance from now.',
      },
      methods: {
        defaultMeta: 'The `meta` keys and their defaults.',
        venueMaxLength: 'The venue length limit, after the `fluent_event/event_venue_max_length` filter.',
        postStatusFor: 'Maps an event status to a `post_status`.',
      },
      example: `use FluentEvent\\App\\Models\\Event;

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
}`,
    },

    Calendar: {
      summary: 'A calendar holds events. Each event belongs to exactly one.',
      notes: `A calendar has no public page of its own, so its statuses are only \`public\`, \`private\` and \`draft\`: events in a private or draft calendar never appear on the public pages. With the FluentCommunity integration on, each discussion space gets its own calendar (\`meta.fcom_space_id\`) and posts outside any space go to a shared Community calendar (\`meta.fcom_global = true\`).`,
      columns: {
        title: 'Calendar name. Stored sanitized; read back as plain text.',
        slug: 'Unique slug. Generated from the title when empty.',
        description: 'Optional. No screen or endpoint sets it yet.',
        status: '`public`, `private` or `draft`.',
        meta: 'Open-ended JSON. See below.',
        created_by: 'The WordPress user who created the calendar. Set automatically on create.',
      },
      notFillable: ' `created_by` is set from the current user when the calendar is created.',
      accessors: {
        title: 'Decodes the stored title to plain text. Escape it wherever you print it.',
      },
      metaColumn: 'meta',
      meta: `\`Calendar::defaultMeta()\` documents the keys. New per-calendar settings land here without a migration.

| Key | Meaning |
| --- | --- |
| \`theme_color\` | Six-digit hex colour, default \`#0099ff\`. Colours the calendar's events in the admin. |
| \`fcom_space_id\` | Set by the FluentCommunity bridge: the space this calendar belongs to. |
| \`fcom_global\` | Set by the FluentCommunity bridge: \`true\` on the Community calendar. |`,
      consts: {
        STATUSES: 'Every calendar status.',
        DEFAULT_THEME_COLOR: 'The colour a new calendar gets.',
      },
      scopes: {
        searchBy: 'Matches `title` or `slug` with `LIKE`.',
        byStatus: 'Limits to one status or a list of statuses.',
      },
      methods: {
        titleMaxLength: 'The title length limit, after the `fluent_event/calendar_title_max_length` filter.',
        defaultMeta: 'The `meta` keys and their defaults.',
      },
      example: `use FluentEvent\\App\\Models\\Calendar;

$calendars = Calendar::query()
    ->byStatus('public')
    ->withCount(['events', 'guests'])
    ->orderBy('title')
    ->get();`,
    },

    Guest: {
      summary: 'One person on one event. A guest row is the registration.',
      notes: `Guests are not WordPress users. A visitor registers with a name and an email only; a logged-in member's row also stores their \`user_id\`. \`calendar_id\` is a copy of the event's calendar, kept in step when the event moves, so calendar-wide counts need no join.`,
      columns: {
        event_id: 'The event.',
        calendar_id: "Copy of the event's `calendar_id`.",
        ticket_type_id: 'Reserved for ticketing. Always `NULL` today.',
        group_id: 'Random 32-character order ID. Rows that share it are one order.',
        is_buyer: '`1` on the row that carries the order. Every RSVP or open registration is its own order, so it is `1` today.',
        name: 'Name the guest gave, or the member display name.',
        email: 'Email address. Unique per event.',
        user_id: 'The WordPress user, when a logged-in member registered or an admin linked one. Unique per event.',
        status: '`going`, `not_going`, `checked_in` or `cancelled`.',
        hash: 'Reserved for per-ticket links.',
        checked_in_at: 'When the guest was checked in. Cleared when the status leaves `checked_in`.',
        source: 'Where the row came from: `manual` (admin), `wordpress_pages` (public event page or a visitor on the portal) or `fluent_community` (a member on the portal).',
        source_id: 'ID in the source system, for example the FluentCommunity post ID.',
        meta: 'Open-ended JSON for per-guest data.',
      },
      accessors: {
        avatar: 'Gravatar URL for the user, or for the email when there is no user.',
      },
      consts: {
        STATUSES: 'Every guest status.',
        DEFAULT_STATUS: 'The status a new guest gets when none is given.',
      },
      scopes: {
        searchBy: 'Matches `name` or `email` with `LIKE`.',
        byStatus: 'Limits to one status.',
      },
      example: `use FluentEvent\\App\\Models\\Guest;
use FluentEvent\\App\\Models\\Event;

// Everyone holding a seat at event 42.
$guests = Guest::query()
    ->where('event_id', 42)
    ->whereIn('status', Event::SEAT_STATUSES)
    ->orderBy('name')
    ->get(['id', 'name', 'email', 'status']);`,
    },

    Meta: {
      summary: 'Key-value rows for settings and per-event bookkeeping.',
      notes: `See the [\`fe_meta\` table](/database/schema#fe-meta) for the rows in use. \`value\` is cast to an array, so store JSON-shaped data. Prefix your own \`meta_key\` with your plugin slug.`,
      columns: {
        object_type: '`option`, `user`, `calendar` or `event`.',
        object_id: 'The object the row belongs to. `NULL` for options.',
        meta_key: 'The key.',
        value: 'JSON value.',
      },
      consts: {
        OBJECT_TYPE_OPTION: 'Plugin-wide settings.',
        OBJECT_TYPE_USER: 'Per-user values.',
        OBJECT_TYPE_EVENT: 'Per-event values.',
      },
      scopes: {
        ofUser: 'Rows of one user.',
        byKey: 'Rows with one `meta_key`.',
      },
      example: `use FluentEvent\\App\\Models\\Meta;

// Store your own per-event value.
Meta::query()->updateOrCreate(
    ['object_type' => Meta::OBJECT_TYPE_EVENT, 'object_id' => $eventId, 'meta_key' => 'my_plugin_badge'],
    ['value' => ['label' => 'Featured']]
);`,
    },

    Post: {
      summary: 'Read-only view of `wp_posts`, limited to `fe_event` posts.',
      notes: `A global scope adds \`post_type = 'fe_event'\` to every query. Use it to read; write posts through \`wp_insert_post()\` / \`wp_update_post()\` (the plugin's \`PostService\` does this), so WordPress hooks and caches stay correct.`,
      scopes: {
        byStatus: 'Limits to one `post_status` or a list.',
      },
      example: `use FluentEvent\\App\\Models\\Post;

$drafts = Post::query()->byStatus('draft')->pluck('post_title', 'ID');`,
    },

    User: {
      summary: 'Read access to `wp_users`, with the framework user proxy.',
      notes: 'The `UserProxyTrait` forwards calls to the `WP_User` object, so `$user->has_cap(...)` and similar work on the model.',
      example: `use FluentEvent\\App\\Models\\User;

$user = User::query()->find(get_current_user_id());`,
    },
  },

  queryBuilder: `# Query Builder

FluentEvent models use the WPFluent ORM, an Eloquent-style query builder that runs on \`$wpdb\`. If you know Laravel's Eloquent, most of it will look familiar. Table prefixes are added for you: write \`fe_guests\`, not \`wp_fe_guests\`.

## Basic Queries

\`\`\`php
use FluentEvent\\App\\Models\\Event;
use FluentEvent\\App\\Models\\Guest;

$event  = Event::query()->find(42);          // null when missing
$event  = Event::query()->findOrFail(42);    // throws, which the REST layer turns into a 404
$count  = Guest::query()->where('event_id', 42)->count();
$emails = Guest::query()->where('event_id', 42)->pluck('email');
\`\`\`

## Scopes

Each model ships scopes that match what the admin screens filter by. Chain them like any other condition. A scope that receives an empty value adds no condition, so you can pass request input straight through.

\`\`\`php
$events = Event::query()
    ->searchBy($search)          // post title LIKE
    ->byCalendar($calendarId)    // 0 or null = every calendar
    ->byStatus(['public', 'unlisted'])
    ->inDateRange('2026-12-01', '2026-12-31')
    ->byPeriod('upcoming')
    ->get();
\`\`\`

## Eager Loading

An event's title lives on its post. Load the post with the events, or every \`$event->title\` runs its own query.

\`\`\`php
$events = Event::query()
    ->with(['post', 'calendar'])
    ->withCount('guests')
    ->limit(20)
    ->get();
\`\`\`

Limit the columns of a relation with a closure:

\`\`\`php
Event::query()->with([
    'post' => function ($query) {
        $query->select(['ID', 'post_title']);
    },
]);
\`\`\`

## Pagination

\`\`\`php
$page = Guest::query()
    ->where('event_id', 42)
    ->orderBy('id', 'DESC')
    ->paginate(20);   // reads ?page= from the request

$page->total();
$page->items();
\`\`\`

## Aggregates

\`\`\`php
// Guests per status for one event.
$rows = Guest::query()
    ->where('event_id', 42)
    ->selectRaw('status, COUNT(*) AS total')
    ->groupBy('status')
    ->pluck('total', 'status');
\`\`\`

## Transactions

Use the \`DB\` facade when two writes must land together. Let exceptions escape the closure: catching one inside it commits the half that already ran.

\`\`\`php
use FluentEvent\\Facade\\DB;

DB::transaction(function () use ($event, $calendarId) {
    $event->calendar_id = $calendarId;
    $event->save();

    Guest::query()->where('event_id', $event->id)->update(['calendar_id' => $calendarId]);
});
\`\`\`

## Rules of Thumb

- Pass validated, explicit fields to \`create()\` and \`fill()\`. Never pass the whole request.
- Bulk \`update()\` and \`delete()\` skip model events and FluentEvent's hooks. Use them for your own data, not to delete events or guests.
- \`start_at\` and \`end_at\` are UTC. Convert with \`FluentEvent\\App\\Utils\\DateTimeHelper::convertToUtc()\` before you compare them with local dates.
`,
}
