/**
 * Prose for each hook, keyed by the full hook name. The generator reads the call sites,
 * listeners and arguments from the source; this file adds what the code cannot say:
 * when the hook fires, what is already true at that moment, and a useful example.
 *
 * Shape:
 *   'fluent_event/x': {
 *     summary: 'One sentence, shown in tables and as "When it fires".',
 *     notes:   'Markdown. Caveats, ordering, transactions.',
 *     params:  [{ name: '$x', type: 'Event', desc: '...' }],   // optional; replaces inferred params
 *     example: 'PHP code',                                      // optional; replaces the default
 *   }
 *
 * A key that matches no hook is reported as a warning on every run.
 */

const EVENT = '\\FluentEvent\\App\\Models\\Event'
const GUEST = '\\FluentEvent\\App\\Models\\Guest'
const CALENDAR = '\\FluentEvent\\App\\Models\\Calendar'

export default {
  __intro: {
    action: `## Before You Hook In

- **Controllers fire the hooks.** A service never fires a request hook, so one REST call fires each hook once. The exceptions are paths with no controller: the cleanup handler, the FluentCommunity bridge and the Action Scheduler jobs.
- **Deletes fire twice.** \`before_deleted\` runs while the row still exists; \`deleted\` runs after it is gone. Read related data in the first one.
- **Background work goes through Action Scheduler**, group \`fluent-event\`. Queue your own slow work there too, with \`as_enqueue_async_action()\`, rather than doing it inside a request hook.`,
    filter: `## Before You Filter

- **Return the same type you receive.** The admin app reads the response filters directly, so a missing key breaks the screen.
- **Response filters run on admin requests only.** The \`*_api_response\` filters wrap the \`manage_options\` endpoints, not the public pages.`,
  },

  // -------------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------------

  'fluent_event/event/created': {
    summary: 'After a new event and its post are saved.',
    notes: `Fires from the admin **Create Event** endpoint and from the FluentCommunity bridge when a member posts an event in a space. Both the \`fe_event\` post and the \`fe_event_details\` row exist, and the transaction that wrote them has committed.

FluentEvent itself listens here to queue the guest reminder emails for the event.`,
    params: [{ name: '$event', type: EVENT, desc: 'The saved event. `$event->post_id` is the `fe_event` post.' }],
    example: `add_action('fluent_event/event/created', function ($event) {
    // Mirror new public events to an external calendar.
    if ($event->status !== 'public') {
        return;
    }

    as_enqueue_async_action('my_plugin/sync_event', [(int) $event->id], 'my-plugin');
});`,
  },

  'fluent_event/event/updated': {
    summary: 'After an event is saved with new values.',
    notes: `Fires from the admin **Update Event** endpoint, and from the FluentCommunity bridge when a community post moves to another space, when its post is deleted (the event becomes a draft), and when its space is deleted.

Use \`$event->wasChanged('start_at')\` and the other dirty-tracking methods to see what changed: the model has just been saved. FluentEvent listens here to reschedule the reminder emails, and resends them when the start time moved.`,
    params: [{ name: '$event', type: EVENT, desc: 'The saved event.' }],
    example: `add_action('fluent_event/event/updated', function ($event) {
    if (!$event->wasChanged('start_at')) {
        return;
    }

    // The start time moved: tell an external system.
    as_enqueue_async_action('my_plugin/event_rescheduled', [(int) $event->id], 'my-plugin');
});`,
  },

  'fluent_event/event/calendar_changed': {
    summary: 'After an update moves an event to another calendar.',
    notes: `Fires right after \`fluent_event/event/updated\`, and only when \`calendar_id\` changed. By then every guest row of the event already carries the new \`calendar_id\` too.

The FluentCommunity bridge listens here to move the event's community post to the matching space, or to unlink the post when the new calendar has no space.`,
    params: [
      { name: '$event', type: EVENT, desc: 'The saved event, with its new `calendar_id`.' },
      { name: '$previousCalendarId', type: 'int', desc: 'The calendar the event was in before.' },
    ],
    example: `add_action('fluent_event/event/calendar_changed', function ($event, $previousCalendarId) {
    error_log(sprintf('Event %d moved from calendar %d to %d', $event->id, $previousCalendarId, $event->calendar_id));
}, 10, 2);`,
  },

  'fluent_event/event/before_deleted': {
    summary: 'Before an event is deleted, while its post, guests and meta still exist.',
    notes: `This is the hook that does the cleanup. FluentEvent's own listeners run here in priority order:

1. Priority 5: cancel the queued reminder emails, and unlink the FluentCommunity post.
2. Priority 10: \`CleanupHandler::cleanEvent()\` deletes the \`fe_event\` post, every guest row (bracketed by the bulk guest hooks) and the event's \`fe_meta\` rows.

The admin delete runs this hook **inside a database transaction**. A listener that throws an exception rolls the whole delete back. The hook also fires when a calendar is deleted (once per event) and when the \`fe_event\` post is deleted outside the plugin, for example with WP-CLI.

Read anything you need from the guests at a priority below 10.`,
    params: [{ name: '$event', type: EVENT, desc: 'The event about to be deleted.' }],
    example: `add_action('fluent_event/event/before_deleted', function ($event) {
    // Runs before CleanupHandler (priority 10) deletes the guests.
    $emails = $event->guests()->pluck('email')->toArray();
    update_option('my_plugin_deleted_event_' . $event->id, $emails, false);
}, 9);`,
  },

  'fluent_event/event/deleted': {
    summary: 'After an event, its post, its guests and its meta are deleted.',
    notes: `The model instance still holds its last values, but nothing is left in the database. Use it to clean up your own data keyed by the event ID.`,
    params: [{ name: '$event', type: EVENT, desc: 'The deleted event. Its rows no longer exist.' }],
    example: `add_action('fluent_event/event/deleted', function ($event) {
    delete_option('my_plugin_event_' . $event->id);
});`,
  },

  'fluent_event/events_api_response': {
    summary: 'Filters the admin events list before it is returned.',
    notes: `Wraps \`GET /events\`. \`$data['events']\` is a paginator (with \`data\`, \`total\`, \`current_page\` and the rest) or, for a calendar window of at most 62 days with \`paginate=false\`, a plain collection. Each event has its \`post\` (ID and title) and \`calendar\` loaded, and a \`guests_count\` of every guest row.

The FluentCommunity bridge uses this filter to add \`feed_url\` to events that have a community post.`,
    params: [
      { name: '$data', type: 'array', desc: "`['events' => paginator or collection of Event]`." },
      { name: '$request', type: 'array', desc: 'All request parameters.' },
    ],
    example: `add_filter('fluent_event/events_api_response', function ($data, $request) {
    foreach ($data['events'] as $event) {
        $event->setAttribute('ticket_url', get_post_meta($event->post_id, '_my_ticket_url', true));
    }

    return $data;
}, 10, 2);`,
  },

  'fluent_event/event_api_response': {
    summary: 'Filters one event before the admin editor or the portal edit page loads it.',
    notes: `Wraps \`GET /events/{id}\` and \`GET /events/by-slug\`. The event has its \`post\` and \`calendar\` relations loaded, the \`description\` attribute appended, and \`guests_count\` set.`,
    params: [
      { name: '$data', type: 'array', desc: "`['event' => Event, 'public_url' => string]`." },
      { name: '$event', type: EVENT, desc: 'The event being returned.' },
    ],
    example: `add_filter('fluent_event/event_api_response', function ($data, $event) {
    $data['sponsor'] = get_post_meta($event->post_id, '_my_sponsor', true);

    return $data;
}, 10, 2);`,
  },

  'fluent_event/event_venue_max_length': {
    summary: 'Filters the longest venue name an event accepts, in characters.',
    notes: `The default is \`100\`. The value is clamped to 1–255, because 255 is the limit the validation rule had before the filter existed. The same limit drives the REST validation rule and its error message.`,
    params: [{ name: '$length', type: 'int', desc: 'Maximum venue length. Default `100`.' }],
    example: `add_filter('fluent_event/event_venue_max_length', function () {
    return 200;
});`,
  },

  // -------------------------------------------------------------------------
  // Guests
  // -------------------------------------------------------------------------

  'fluent_event/guest/created': {
    summary: 'After a new guest row is saved.',
    notes: `Fires on every path that adds a guest:

- an admin adds a guest (\`source = manual\`);
- a member registers or RSVPs from the FluentCommunity portal (\`source = fluent_community\`, \`source_id\` = the community post ID);
- a visitor registers from the portal or from the public event page (\`source = wordpress_pages\`).

The confirmation email is queued separately, after this hook, so it is not sent yet. Check \`$guest->status\`: an RSVP can also create a \`not_going\` row.`,
    params: [{ name: '$guest', type: GUEST, desc: 'The saved guest. `event_id`, `email`, `status` and `source` are set.' }],
    example: `add_action('fluent_event/guest/created', function ($guest) {
    if ($guest->status !== 'going') {
        return;
    }

    // Add the guest to a FluentCRM list.
    if (function_exists('FluentCrmApi')) {
        FluentCrmApi('contacts')->createOrUpdate([
            'email'      => $guest->email,
            'first_name' => $guest->name,
            'lists'      => [3],
        ]);
    }
});`,
  },

  'fluent_event/guest/updated': {
    summary: "After a guest row changes, including a member's RSVP change.",
    notes: `Fires when an admin edits a guest, and when a member changes their RSVP or cancels an open registration from the portal. On the portal path it fires only when the status really changed.

Compare \`$guest->status\` with \`$previousStatus\` to react to a status move, for example \`going\` → \`cancelled\`.`,
    params: [
      { name: '$guest', type: GUEST, desc: 'The saved guest.' },
      { name: '$previousStatus', type: 'string', desc: 'The status before this change: `going`, `not_going`, `checked_in` or `cancelled`.' },
    ],
    example: `add_action('fluent_event/guest/updated', function ($guest, $previousStatus) {
    if ($previousStatus !== 'checked_in' && $guest->status === 'checked_in') {
        do_action('my_plugin/guest_arrived', $guest);
    }
}, 10, 2);`,
  },

  'fluent_event/guest/before_deleted': {
    summary: 'Before an admin deletes one guest.',
    notes: `Fires from \`DELETE /events/{eventId}/guests/{guestId}\` only. Deleting a whole event removes its guests in bulk and fires \`fluent_event/guest/before_bulk_deleted\` instead.`,
    params: [{ name: '$guest', type: GUEST, desc: 'The guest about to be deleted.' }],
  },

  'fluent_event/guest/deleted': {
    summary: 'After an admin deletes one guest.',
    notes: `The row is gone. When the admin asked for it and the guest held a seat, the cancellation email is sent right after this hook, synchronously, because a queued job could no longer load the row.`,
    params: [{ name: '$guest', type: GUEST, desc: 'The deleted guest, with its last values.' }],
  },

  'fluent_event/guest/before_bulk_deleted': {
    summary: 'Before every guest of an event is deleted, as part of deleting the event.',
    notes: `Fires from \`CleanupHandler::cleanEvent()\`, after the event's post is deleted and before its guest rows are. There is no per-guest hook on this path: read \`$event->guests()\` here if you need the rows.`,
    params: [{ name: '$event', type: EVENT, desc: 'The event whose guests are about to be deleted.' }],
    example: `add_action('fluent_event/guest/before_bulk_deleted', function ($event) {
    foreach ($event->guests()->get() as $guest) {
        // Archive each guest before it is removed.
    }
});`,
  },

  'fluent_event/guest/bulk_deleted': {
    summary: "After every guest of an event is deleted, as part of deleting the event.",
    params: [{ name: '$event', type: EVENT, desc: 'The event whose guests were deleted.' }],
  },

  // -------------------------------------------------------------------------
  // Calendars
  // -------------------------------------------------------------------------

  'fluent_event/calendar/created': {
    summary: 'After a new calendar is saved.',
    notes: `Fires from the admin **Create Calendar** endpoint, and from the FluentCommunity bridge when the first event posted in a space (or outside any space) creates that space's calendar.`,
    params: [{ name: '$calendar', type: CALENDAR, desc: 'The saved calendar. `created_by` is the current user.' }],
  },

  'fluent_event/calendar/updated': {
    summary: 'After a calendar is saved with new values.',
    notes: `Fires from the admin **Update Calendar** endpoint, and from the FluentCommunity bridge when a space is deleted: the space calendar becomes a draft and loses its space link.`,
    params: [{ name: '$calendar', type: CALENDAR, desc: 'The saved calendar.' }],
  },

  'fluent_event/calendar/before_deleted': {
    summary: 'Before a calendar is deleted, while its events still exist.',
    notes: `\`CleanupHandler::cleanCalendar()\` listens here and deletes every event in the calendar, one at a time, so \`fluent_event/event/before_deleted\` and \`fluent_event/event/deleted\` fire once per event.`,
    params: [{ name: '$calendar', type: CALENDAR, desc: 'The calendar about to be deleted.' }],
  },

  'fluent_event/calendar/deleted': {
    summary: 'After a calendar and all of its events are deleted.',
    params: [{ name: '$calendar', type: CALENDAR, desc: 'The deleted calendar, with its last values.' }],
  },

  'fluent_event/calendars_api_response': {
    summary: 'Filters the admin calendars list before it is returned.',
    notes: `Wraps \`GET /calendars\`. Each calendar carries \`events_count\` and \`guests_count\`. The FluentCommunity bridge adds \`space_url\` to calendars that belong to a discussion space.`,
    params: [
      { name: '$data', type: 'array', desc: "`['calendars' => collection of Calendar, 'counts' => array]`. `counts` holds `all` plus one key per status." },
      { name: '$request', type: 'array', desc: 'All request parameters.' },
    ],
  },

  'fluent_event/calendar_api_response': {
    summary: "Filters one calendar's admin payload before it is returned.",
    notes: `Wraps \`GET /calendars/{id}\`. The calendar carries \`creator_name\`, and \`stats\` holds the calendar's event and guest totals.`,
    params: [
      { name: '$data', type: 'array', desc: "`['calendar' => Calendar, 'stats' => array]`." },
      { name: '$request', type: 'array', desc: 'All request parameters.' },
    ],
  },

  'fluent_event/calendar_title_max_length': {
    summary: 'Filters the longest calendar title accepted, in characters.',
    notes: `The default is \`100\`. The value is clamped to 1–255, the size of the \`title\` column.`,
    params: [{ name: '$length', type: 'int', desc: 'Maximum title length. Default `100`.' }],
    example: `add_filter('fluent_event/calendar_title_max_length', function () {
    return 150;
});`,
  },

  // -------------------------------------------------------------------------
  // Emails & reminders
  // -------------------------------------------------------------------------

  'fluent_event/guest/confirmation_sent': {
    summary: 'After the registration confirmation email is handed to `wp_mail()`.',
    notes: `Runs inside the \`fluent_event/send_registration_confirmation\` job. It does not fire when the email is turned off in **Settings → Email Notifications**, when the guest is no longer \`going\`, when the email address is not valid, or when the event is a draft.`,
    params: [
      { name: '$guest', type: GUEST, desc: 'The guest who received the email.' },
      { name: '$event', type: EVENT, desc: 'The event they registered for.' },
    ],
  },

  'fluent_event/guest/cancellation_sent': {
    summary: 'After the registration cancellation email is handed to `wp_mail()`.',
    notes: `Runs inside the \`fluent_event/send_registration_cancellation\` job, or synchronously when an admin deletes a guest with **send email** on. The same checks as the confirmation apply.`,
    params: [
      { name: '$guest', type: GUEST, desc: 'The guest who received the email. After a delete the row no longer exists.' },
      { name: '$event', type: EVENT, desc: 'The event.' },
    ],
  },

  'fluent_event/guest_reminders_sent': {
    summary: 'After one reminder send for an event has gone through every guest.',
    notes: `Fires once per reminder time (for example "24 hours before"), when the batch job has worked through every seated guest (\`going\` or \`checked_in\`). A send that hits the 45-second run limit continues in a new job and fires this hook only when it finishes.`,
    params: [
      { name: '$event', type: EVENT, desc: 'The event the reminder was for.' },
      { name: '$sent', type: 'int', desc: 'How many emails this run sent. Guests without a valid email are skipped and not counted.' },
    ],
    example: `add_action('fluent_event/guest_reminders_sent', function ($event, $sent) {
    error_log(sprintf('Sent %d reminders for "%s"', $sent, $event->title));
}, 10, 2);`,
  },

  'fluent_event/send_registration_confirmation': {
    summary: 'Action Scheduler job that sends the registration confirmation email to one guest.',
    notes: `Queued with \`as_enqueue_async_action()\` when a guest becomes \`going\`: an admin adds or edits a guest with **send email** on, or a member or visitor registers. \`EventReminderService::sendConfirmation()\` runs it.

Do not call this hook yourself to send an email: queue it, so a slow mail server never holds up a request.`,
    params: [{ name: '$guestId', type: 'int', desc: 'The guest row ID.' }],
    example: `// Queue a confirmation the same way FluentEvent does.
as_enqueue_async_action('fluent_event/send_registration_confirmation', [(int) $guest->id], 'fluent-event');`,
  },

  'fluent_event/send_registration_cancellation': {
    summary: 'Action Scheduler job that sends the registration cancellation email to one guest.',
    notes: `Queued when a guest leaves a seat: the status moves from \`going\` or \`checked_in\` to \`not_going\` or \`cancelled\`. \`EventReminderService::sendCancellation()\` runs it.`,
    params: [{ name: '$guestId', type: 'int', desc: 'The guest row ID.' }],
  },

  'fluent_event/send_event_reminders_to_guests': {
    summary: 'Action Scheduler job that sends one reminder email to every seated guest of an event.',
    notes: `One job is scheduled per configured reminder time, at \`start_at - lead time\`. Progress is stored in an \`fe_meta\` row with the key \`reminder_email:<lead time>\` (\`status\` and \`cursor\`), so a retried or continued job resumes after the last guest it emailed and never sends twice.

The job skips the send when the event is gone, is a draft, has already started, or no longer has that reminder time. It sends in batches of 50, at most 10 emails per second, and hands over to a fresh job after 45 seconds.`,
    params: [
      { name: '$eventId', type: 'int', desc: 'The event ID.' },
      { name: '$leadTime', type: 'int', desc: 'How long before the start this reminder goes out, in seconds.' },
    ],
    example: `// List the reminder sends queued for an event.
$actions = as_get_scheduled_actions([
    'hook'   => 'fluent_event/send_event_reminders_to_guests',
    'group'  => 'fluent-event',
    'status' => ActionScheduler_Store::STATUS_PENDING,
]);`,
  },

  'fluent_event/reschedule_event_reminders': {
    summary: 'Action Scheduler job that requeues the reminders of every upcoming event, 50 events per job.',
    notes: `Queued when the email notification settings are saved and when the plugin is activated (deactivation unschedules every queued job). Each run handles the next 50 upcoming live events after \`$afterId\`, then queues itself again for the next batch.`,
    params: [{ name: '$afterId', type: 'int', desc: 'The last event ID handled by the previous batch. `0` starts from the beginning.' }],
  },

  // -------------------------------------------------------------------------
  // Settings
  // -------------------------------------------------------------------------

  'fluent_event/settings/general_updated': {
    summary: 'After the general settings are saved, or the All Events page is created.',
    notes: `Fires from \`POST /settings/general\` and from \`POST /settings/create-page\`. When \`event_slug\` changed, FluentEvent has already deleted the \`rewrite_rules\` option, so WordPress rebuilds the rules on the next request.`,
    params: [{ name: '$settings', type: 'array', desc: 'The full general settings after the save: `default_events_view`, `disable_event_view_switch`, `events_page_id`, `event_slug`.' }],
  },

  'fluent_event/settings/email_updated': {
    summary: 'After the email sender settings are saved.',
    params: [{ name: '$settings', type: 'array', desc: 'The full email settings: `from_name`, `from_email`, `reply_to_name`, `reply_to_email`, `email_footer`.' }],
  },

  'fluent_event/settings/email_notifications_updated': {
    summary: 'After the email notification settings are saved.',
    notes: `FluentEvent listens here and queues \`fluent_event/reschedule_event_reminders\`, so a changed reminder time applies to every upcoming event.`,
    params: [{ name: '$settings', type: 'array', desc: 'The full notification settings: `registration_confirmation`, `registration_cancellation` and `reminder_to_guest`, each with `enabled`; the reminder also has `times`.' }],
  },

  // -------------------------------------------------------------------------
  // FluentCommunity
  // -------------------------------------------------------------------------

  'fluent_event/community/route_paths': {
    summary: 'Filters the FluentCommunity portal routes that FluentEvent adds.',
    notes: `Runs once, on first use, when the FluentEvent feature is on in FluentCommunity. The base slug comes from FluentCommunity's FluentEvent settings (default \`events\`); this filter can move any single route. Keep the \`:event_slug\` placeholder in the routes that have it.`,
    params: [
      { name: '$paths', type: 'array', desc: 'Route name => portal path. Keys: `events`, `create_event`, `edit_event`, `event_view`, `space_events`, `space_event_view`.' },
      { name: '$routeSlug', type: 'string', desc: 'The base slug, for example `events`.' },
    ],
    example: `add_filter('fluent_event/community/route_paths', function ($paths, $routeSlug) {
    $paths['create_event'] = $routeSlug . '/new';

    return $paths;
}, 10, 2);`,
  },

  // -------------------------------------------------------------------------
  // System
  // -------------------------------------------------------------------------

  'fluent_event/loaded': {
    summary: 'On `plugins_loaded`, once the FluentEvent application has booted.',
    notes: `The safe place to start an add-on: the models, services and facades are loaded.`,
    params: [{ name: '$app', type: '\\FluentEvent\\Framework\\Foundation\\Application', desc: 'The FluentEvent application container.' }],
    example: `add_action('fluent_event/loaded', function ($app) {
    // FluentEvent is ready. Register your hooks here.
    require_once __DIR__ . '/includes/my-fluent-event-addon.php';
});`,
  },

  'fluent_event/update_verification_failed': {
    summary: 'When a downloaded plugin update fails its checksum check and is not installed.',
    notes: `The updater refuses an update package whose checksum is missing or does not match the one published with the release. Only builds that ship the updater fire this; the WordPress.org build does not.`,
    params: [
      { name: '$slug', type: 'string', desc: 'The plugin slug.' },
      { name: '$reason', type: 'string', desc: '`checksum_missing` or `checksum_mismatch`.' },
    ],
  },

  'fluent_event/is_rtl': {
    summary: 'Filters whether FluentEvent loads the right-to-left versions of its stylesheets.',
    notes: `Defaults to WordPress's \`is_rtl()\`. The admin app, the public pages and the FluentCommunity portal chunks all read this one answer, so they never load different files.`,
    params: [{ name: '$isRtl', type: 'bool', desc: 'Whether to load the `.rtl.css` files.' }],
  },
}
