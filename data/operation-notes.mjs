/**
 * Prose for the REST API, keyed by `Controller@action`. The generator reads method,
 * path, policy, validation rules and sanitizers from the source; this file names each
 * operation and explains what the code cannot say.
 *
 *   'XController@action': {
 *     slug, title, summary,       // slug is the page and spec file name
 *     notes,                      // markdown, optional
 *     params: {                   // optional, per field
 *       name: { desc, enum, required, type, in: 'query' | 'body', schema, notes: [] } | false,
 *     },
 *     errors: [{ status, when }], // extra error responses
 *   }
 *
 * `false` removes a field the generator found but that is not a real input.
 */

const PAGING = 'Pagination follows the WPFluent paginator: the response has `data`, `total`, `per_page`, `current_page`, `last_page` and the page URLs.'

export const PARAM_NOTES = {
  id: 'Record ID.',
  eventId: 'Event ID (`fe_event_details.id`).',
  guestId: 'Guest ID (`fe_guests.id`).',
  page: 'Page number, starting at 1.',
  per_page: 'Items per page.',
  search: 'Free-text search.',
  order_by: 'Column to sort by.',
  order_type: 'Sort direction.',
  send_email: 'Send the matching guest email (confirmation or cancellation).',
  calendar_id: 'Calendar ID (`fe_calendars.id`).',
  title: 'Title.',
  status: 'Status.',
  nonce: 'The form nonce printed on the page.',
  website: 'Honeypot field. Leave it empty: a request with a value is accepted silently and nothing is saved.',
}

/** Permission text per resolved policy method (`Policy::method`) and per policy name. */
export const POLICY_NOTES = {
  'Policy::verifyRequest': 'Requires the `manage_options` capability (a site administrator). FluentEvent has no separate staff roles: its admin API is for administrators only.',
  Policy: 'Every endpoint requires the `manage_options` capability. Send a cookie plus `X-WP-Nonce`, or use an Application Password.',
  'CommunityPolicy::verifyRequest': 'Open to anyone FluentCommunity lets into its portal, logged in or not, while the FluentEvent feature is on in FluentCommunity. A member whose community profile is not `active` is refused. Each event is then shown only if its community post is visible to the caller.',
  'CommunityPolicy::register': 'A logged-in WordPress user with portal access and an `active` community profile. The REST cookie nonce (`X-WP-Nonce`) is checked by WordPress.',
  'CommunityPolicy::registerGuest': 'Logged-out visitors only, on a portal that is open to visitors. The handler also checks the per-event `nonce`.',
  CommunityPolicy: 'Follows FluentCommunity: the caller needs portal access, and the FluentEvent feature must be on in FluentCommunity. Event visibility follows the event\'s community post.',
  'PortalPolicy::registerGuest': 'Public: anyone who can see the event page, logged in or not, is treated as a visitor. The handler checks the per-event `nonce` before it looks the event up.',
  PortalPolicy: 'Public. Each request carries a nonce that only the event page hands out.',
}

export const OPERATIONS = {
  __overview: `# REST API

FluentEvent registers {count} endpoints under the \`{namespace}\` namespace:

\`\`\`
https://yourwebsite.com/wp-json/{namespace}/
\`\`\`

The admin app in wp-admin uses the **Admin API**. The FluentCommunity portal and the public event page use the **Front-End API**.

## Authentication

Every Admin API endpoint requires the \`manage_options\` capability. There are two ways to authenticate:

- **Cookie + nonce.** In the browser, as a logged-in administrator, send the \`X-WP-Nonce\` header with a nonce from \`wp_create_nonce('wp_rest')\`. This is what the admin app does.
- **Application Passwords.** For server-to-server calls, create an Application Password under **Users → Profile** and send it with HTTP Basic auth.

\`\`\`bash
curl -u "admin:abcd efgh ijkl mnop qrst uvwx" \\
  "https://yourwebsite.com/wp-json/{namespace}/events?per_page=5"
\`\`\`

The Front-End API follows the visitor: the community endpoints use FluentCommunity's portal access rules, and the public event page's registration endpoint is open to anyone with the page's nonce.

## Conventions

- **Request bodies** are JSON (\`Content-Type: application/json\`) or form fields. Both reach the same validation.
- **Success** returns HTTP 200 with the payload object. Writes include a \`message\` you can show to the user.
- **Validation errors** return HTTP 422: \`{ "message": "...", "errors": { "field": { "rule": "message" } } }\`.
- **Missing records** return HTTP 404 from \`findOrFail()\`.
- **Dates** you send (\`start_at\`, \`end_at\`) are local times in the event's \`timezone\`. FluentEvent stores them in UTC. Responses carry both: \`start_at\` (UTC), \`start_at_local\` (event time zone) and \`start_at_site\` (site time zone).
- **Partial updates.** \`PATCH /events/{id}\` and \`PATCH /calendars/{id}\` validate the full record, so send every required field. \`PATCH\` on a guest is partial.
- **Method override.** If your server blocks \`PATCH\` or \`DELETE\`, send \`POST\` with an \`X-HTTP-Method-Override\` header.

## Rate Limits

The registration endpoints are throttled per minute, counted per account for a logged-in user and per IP address for a visitor: 10 requests for member registration, 5 for visitor registration. Over the limit, the API answers HTTP 429.

## Interactive Playground

Every operation page has a playground. Enter your site's domain and \`username:application_password\`, then send the request. Use a staging site for anything that writes.`,

  // -------------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------------

  'EventController@getAllEvents': {
    slug: 'list-events',
    title: 'List Events',
    summary: 'Returns events with their post title, calendar and guest count, filtered and paginated, for the admin events list and calendar grid.',
    notes: `Each event carries \`guests_count\`: every guest row of the event, whatever its status. Results are sorted by \`period\`. With both \`start_date\` and \`end_date\` set to a window of at most 62 days and \`paginate=false\`, the endpoint returns every event in the window as a plain list, which is what the calendar grid uses. Any other request is paginated. ${PAGING}`,
    params: {
      start_date: { desc: "Start of a date range, `Y-m-d`, in the site's time zone. Matches events that end on or after this day." },
      end_date: { desc: "End of a date range, `Y-m-d`, in the site's time zone. Matches events that start on or before this day." },
      search: { desc: 'Matches the event title.' },
      calendar_id: { desc: 'Only events in this calendar.' },
      status: { desc: 'Only events with this status.', enum: ['public', 'unlisted', 'private', 'draft'] },
      period: { desc: '`upcoming`: not ended yet, soonest first. `past`: ended, latest first. Anything else: upcoming first, then by distance from now.', enum: ['upcoming', 'past', 'all'] },
      paginate: { desc: 'Set to `false` with a date window of at most 62 days to get every event in the window without paging.', type: 'boolean' },
    },
  },

  'EventController@getEventBySlug': {
    slug: 'get-event-by-slug',
    title: 'Get Event by Slug',
    summary: 'Returns one event, looked up by its post slug, in the same shape as Get Event.',
    notes: 'The FluentCommunity portal edit page addresses events by slug. An unknown slug returns 404.',
    params: {
      slug: { desc: 'The event post slug (`post_name`).', required: true },
    },
  },

  'EventController@getEvent': {
    slug: 'get-event',
    title: 'Get Event',
    summary: 'Returns one event with its description, post, calendar and guest count, plus its public URL.',
    notes: '`event.description` is the rendered HTML; `event.meta.description_md` is the Markdown the editor shows. `event.guests_count` counts every guest row, whatever its status, as the events list does.',
  },

  'EventController@createEvent': {
    slug: 'create-event',
    title: 'Create Event',
    summary: 'Creates an event: the `fe_event` post and its `fe_event_details` row, in one transaction.',
    notes: `Send \`start_at\` and \`end_at\` as local date-times (\`Y-m-d H:i:s\`) in \`timezone\`. An empty or invalid \`timezone\` falls back to the site's. \`end_at\` must be after \`start_at\`.

\`online_meeting_url\` is required when \`venue_type\` is \`online\`; \`venue\` and \`address\` are cleared for an online event, and \`online_meeting_url\` for an offline one. Reminder emails are queued for the new event.`,
    params: {
      title: { desc: 'Event title.' },
      description_md: { desc: 'Description in Markdown.' },
      status: { desc: '`public` lists the event; `unlisted` opens only by direct link; `private` has no public page; `draft` is hidden everywhere.' },
      start_at: { desc: 'Start, `Y-m-d H:i:s`, in `timezone`.', schema: { type: 'string', format: 'date-time' } },
      end_at: { desc: 'End, `Y-m-d H:i:s`, in `timezone`. Must be after `start_at`.', schema: { type: 'string', format: 'date-time' } },
      timezone: { desc: 'IANA time zone, for example `Europe/Berlin`. Defaults to the site time zone.' },
      venue_type: { desc: 'Where the event happens.' },
      cover_url: { desc: 'Cover image URL.' },
      online_meeting_url: { desc: 'Meeting link. Required when `venue_type` is `online`. Shown only to guests who hold a seat.', required: false },
      venue: { desc: 'Venue name, for an offline event.', notes: ['Default limit 100 characters (`fluent_event/event_venue_max_length`).'] },
      address: { desc: 'Address, for an offline event.' },
      entry_type: { desc: '`rsvp`: logged-in going / not going. `open`: a Register button with name and email. `none`: view only.' },
      show_guest_count: { desc: 'Show how many guests are going.' },
    },
  },

  'EventController@updateEvent': {
    slug: 'update-event',
    title: 'Update Event',
    summary: 'Updates an event and its post. Send the full event: every required field is validated again.',
    notes: `When \`calendar_id\` changes, every guest row moves with the event and \`fluent_event/event/calendar_changed\` fires. When \`start_at\` changes, the reminder emails are rescheduled and sent again for the new time. Keys of \`meta\` you leave out keep their stored values.`,
    params: {
      title: { desc: 'Event title.' },
      description_md: { desc: 'Description in Markdown.' },
      status: { desc: 'Event status.' },
      start_at: { desc: 'Start, `Y-m-d H:i:s`, in `timezone`.', schema: { type: 'string', format: 'date-time' } },
      end_at: { desc: 'End, `Y-m-d H:i:s`, in `timezone`.', schema: { type: 'string', format: 'date-time' } },
      timezone: { desc: 'IANA time zone.' },
      venue_type: { desc: 'Where the event happens.' },
      cover_url: { desc: 'Cover image URL.' },
      online_meeting_url: { desc: 'Meeting link. Required when `venue_type` is `online`.', required: false },
      venue: { desc: 'Venue name, for an offline event.' },
      address: { desc: 'Address, for an offline event.' },
      entry_type: { desc: 'How people join.' },
      show_guest_count: { desc: 'Show how many guests are going.' },
    },
  },

  'EventController@deleteEvent': {
    slug: 'delete-event',
    title: 'Delete Event',
    summary: 'Deletes an event with its post, guests, meta and queued reminders.',
    notes: 'The delete runs in a transaction around `fluent_event/event/before_deleted`. If a listener throws, or the post cannot be deleted, nothing is removed and the API returns the error. No emails are sent to the guests.',
  },

  // -------------------------------------------------------------------------
  // Guests
  // -------------------------------------------------------------------------

  'GuestController@getGuests': {
    slug: 'list-guests',
    title: 'List Guests',
    summary: 'Returns the guests of one event, paginated, with a count per status for the tabs.',
    notes: `\`counts\` has \`all\` plus one key per status, each matching the current \`search\`. A status with no guests still reads 0. ${PAGING}`,
    params: {
      search: { desc: 'Matches guest name or email.' },
      status: { desc: 'Only guests with this status.', enum: ['going', 'not_going', 'checked_in', 'cancelled'] },
    },
  },

  'GuestController@createGuest': {
    slug: 'create-guest',
    title: 'Create Guest',
    summary: 'Adds a guest to an event by hand (`source = manual`).',
    notes: 'An email or WordPress user that is already on the event is refused with 422. With `send_email=true` and status `going`, the confirmation email is queued. The status defaults to `going`; `checked_in` also sets `checked_in_at`.',
    params: {
      name: { desc: 'Guest name.' },
      email: { desc: 'Guest email.' },
      status: { desc: 'Guest status. Default `going`.' },
      user_id: { desc: 'Link the guest to a WordPress user.' },
      send_email: { in: 'body', desc: 'Queue the confirmation email when the status is `going`.' },
    },
  },

  'GuestController@updateGuest': {
    slug: 'update-guest',
    title: 'Update Guest',
    summary: 'Changes a guest. Fields you leave out keep their values.',
    notes: 'Send `user_id: null` to unlink a WordPress user. Moving to `checked_in` stamps `checked_in_at` (kept if already set); leaving it clears it. With `send_email=true` and a status change, a move to `going` queues the confirmation email and a move to `not_going` or `cancelled` queues the cancellation email.',
    params: {
      name: { desc: 'Guest name.' },
      email: { desc: 'Guest email. Must stay unique on the event.' },
      status: { desc: 'Guest status.' },
      user_id: { desc: 'WordPress user ID, or `null` to unlink.' },
      send_email: { in: 'body', desc: 'Send the confirmation or cancellation email that matches the status change.' },
    },
  },

  'GuestController@deleteGuest': {
    slug: 'delete-guest',
    title: 'Delete Guest',
    summary: 'Removes a guest from an event.',
    notes: 'With `send_email=true` and a guest who held a seat (`going` or `checked_in`), the cancellation email is sent right away, during the request.',
    params: {
      send_email: { desc: 'Send the cancellation email.' },
    },
  },

  // -------------------------------------------------------------------------
  // Calendars
  // -------------------------------------------------------------------------

  'CalendarController@getAllCalendars': {
    slug: 'list-calendars',
    title: 'List Calendars',
    summary: 'Returns every calendar with its event and guest counts, plus a count per status for the tabs.',
    notes: 'Not paginated. `counts` ignores the `status` filter and follows `search`, so the tabs always show every status.',
    params: {
      search: { desc: 'Matches title or slug.' },
      status: { desc: 'Only calendars with this status.', enum: ['public', 'private', 'draft'] },
    },
  },

  'CalendarController@getCalendarOptions': {
    slug: 'list-calendar-options',
    title: 'List Calendar Options',
    summary: 'Returns calendars as dropdown options: ID, title, status and meta only, with no counts.',
    params: {
      search: { desc: 'Matches title or slug.' },
      status: { desc: 'Only calendars with this status.', enum: ['public', 'private', 'draft'] },
    },
  },

  'CalendarController@getCalendar': {
    slug: 'get-calendar',
    title: 'Get Calendar',
    summary: "Returns one calendar with its creator's name and its event and guest totals.",
  },

  'CalendarController@createCalendar': {
    slug: 'create-calendar',
    title: 'Create Calendar',
    summary: 'Creates a calendar. The current user becomes its creator.',
    notes: 'An empty `slug` is generated from the title. `theme_color` is stored in `meta`.',
    params: {
      title: { desc: 'Calendar title.', notes: ['Default limit 100 characters (`fluent_event/calendar_title_max_length`).'] },
      slug: { desc: 'Unique slug. Generated from the title when empty.', required: false },
      status: { desc: '`public`, `private` or `draft`. Events in a non-public calendar never appear on the public pages.' },
      theme_color: { desc: 'Six-digit hex colour, for example `#0099ff`.' },
    },
  },

  'CalendarController@updateCalendar': {
    slug: 'update-calendar',
    title: 'Update Calendar',
    summary: 'Updates a calendar. Send the full calendar: every required field is validated again.',
    params: {
      title: { desc: 'Calendar title.' },
      slug: { desc: 'Unique slug. Generated from the title when empty.', required: false },
      status: { desc: 'Calendar status.' },
      theme_color: { desc: 'Six-digit hex colour.' },
    },
  },

  'CalendarController@deleteCalendar': {
    slug: 'delete-calendar',
    title: 'Delete Calendar',
    summary: 'Deletes a calendar and every event in it, with their guests.',
    notes: 'Each event is deleted on its own and fires its own delete hooks. This cannot be undone.',
  },

  // -------------------------------------------------------------------------
  // Reports
  // -------------------------------------------------------------------------

  'ReportController@getReports': {
    slug: 'get-reports',
    title: 'Get Reports',
    summary: 'Returns the dashboard tiles (event and guest totals) with ongoing, upcoming and top events.',
    notes: 'Totals count every event, drafts included. Top events rank by guests who hold a seat.',
  },

  'ReportController@getGuestTrends': {
    slug: 'get-guest-trends',
    title: 'Get Guest Trends',
    summary: 'Returns new guests per day, or per month for ranges longer than 92 days, ready for a chart.',
    notes: 'Without dates, the range is the last 7 days. Reversed dates are swapped.',
    params: {
      start_date: { desc: 'First day, `Y-m-d`. Default: 6 days before `end_date`.' },
      end_date: { desc: 'Last day, `Y-m-d`. Default: today (UTC).' },
    },
  },

  // -------------------------------------------------------------------------
  // Settings
  // -------------------------------------------------------------------------

  'SettingsController@getGeneral': {
    slug: 'get-general-settings',
    title: 'Get General Settings',
    summary: 'Returns the general settings and the page chosen as the All Events page.',
  },

  'SettingsController@updateGeneral': {
    slug: 'update-general-settings',
    title: 'Update General Settings',
    summary: 'Saves the general settings. Send only the fields of the box you save; the others keep their values.',
    notes: 'A changed `event_slug` changes every event URL (`/<event_slug>/<post_slug>/`); WordPress rebuilds its rewrite rules on the next request. `events_page_id` must be a published page, or `0` for none.',
    params: {
      default_events_view: { desc: 'Default layout of the events list.' },
      disable_event_view_switch: { desc: '`yes` hides the layout switcher.' },
      events_page_id: { desc: 'The page that shows `[fluent_events]`, or `0`.' },
      event_slug: { desc: 'URL base for event pages and the events archive.' },
    },
  },

  'SettingsController@getPages': {
    slug: 'search-pages',
    title: 'Search Pages',
    summary: 'Searches published pages for a page setting, and says whether each page already holds the right shortcode or block.',
    notes: 'Returns at most 50 pages, by title.',
    params: {
      key: { desc: 'The page setting.', enum: ['events_page_id'] },
      search: { desc: 'Matches the page title or content.' },
    },
  },

  'SettingsController@createPage': {
    slug: 'create-page',
    title: 'Create Page',
    summary: 'Creates a published page that holds the events block, and selects it for the setting.',
    notes: 'The page content is fixed by the plugin; the request only sets the title.',
    params: {
      key: { desc: 'The page setting.', enum: ['events_page_id'] },
      title: { desc: 'Page title.' },
    },
  },

  'SettingsController@getEmail': {
    slug: 'get-email-settings',
    title: 'Get Email Settings',
    summary: 'Returns the sender name and address, reply-to and email footer used for guest emails.',
  },

  'SettingsController@updateEmail': {
    slug: 'update-email-settings',
    title: 'Update Email Settings',
    summary: 'Saves the sender, reply-to and footer for guest emails.',
    params: {
      from_name: { desc: 'Sender name.' },
      from_email: { desc: 'Sender address.' },
      reply_to_name: { desc: 'Reply-to name.' },
      reply_to_email: { desc: 'Reply-to address.' },
      email_footer: { desc: 'Footer HTML, filtered with `wp_kses_post()`.' },
    },
  },

  'SettingsController@getEmailNotifications': {
    slug: 'get-email-notification-settings',
    title: 'Get Email Notification Settings',
    summary: 'Returns which guest emails are on, and when reminders go out.',
  },

  'SettingsController@updateEmailNotifications': {
    slug: 'update-email-notification-settings',
    title: 'Update Email Notification Settings',
    summary: 'Turns the confirmation, cancellation and reminder emails on or off, and sets up to five reminder times.',
    notes: 'Each reminder time must be a whole number from 5 minutes to 30 days before the event. Saving requeues the reminders of every upcoming event in the background.',
    params: {
      registration_confirmation: { desc: '`{ "enabled": true }`' },
      registration_cancellation: { desc: '`{ "enabled": true }`' },
      reminder_to_guest: { desc: '`{ "enabled": true, "times": [{ "value": 24, "unit": "hours" }] }`' },
      'reminder_to_guest.enabled': { desc: 'Turn the reminder emails on or off.', type: 'boolean' },
      'reminder_to_guest.times': { desc: 'Up to five reminder times.' },
      'reminder_to_guest.times.*': false,
      'reminder_to_guest.times.*.value': { desc: 'How many units before the start.', schema: { type: 'integer', minimum: 1 }, required: true },
      'reminder_to_guest.times.*.unit': { desc: 'The unit.' },
    },
  },

  'SettingsController@previewEmail': {
    slug: 'preview-email',
    title: 'Preview Email',
    summary: 'Renders a guest email with sample data, so the settings screen can show it.',
    notes: 'Uses a sample online event that starts in 7 days and a sample guest. Nothing is sent.',
    params: {
      type: { desc: 'Which email to render.', enum: ['confirmation', 'cancellation', 'reminder'] },
    },
  },

  // -------------------------------------------------------------------------
  // Users, dashboard
  // -------------------------------------------------------------------------

  'UserController@getUsers': {
    slug: 'search-users',
    title: 'Search Users',
    summary: 'Searches WordPress users by login, email or display name, for the guest picker.',
    notes: 'Returns at most 50 users, by display name.',
    params: {
      search: { desc: 'Matches login, email or display name.' },
      role_in: { desc: 'Comma-separated roles, for example `subscriber,customer`.' },
    },
  },

  'DashboardController@get': {
    slug: 'get-dashboard',
    title: 'Get Dashboard',
    summary: 'Returns a welcome message. The admin dashboard reads its numbers from Get Reports.',
  },

  // -------------------------------------------------------------------------
  // Community portal
  // -------------------------------------------------------------------------

  'CommunityEventController@getEvents': {
    slug: 'list-community-events',
    title: 'List Community Events',
    summary: 'Returns the events the caller can see in the FluentCommunity portal, with their space and the caller\'s own status.',
    notes: `An event appears when its community post is published, its author's profile is active, and the caller can see the post's space (or, for an event outside any space, can see the portal feed). Draft events never appear.

With a \`from\`/\`to\` window of at most 62 days and \`paginate=false\`, every event in the window comes back in one page.`,
    params: {
      space: { desc: 'Only events in this space (slug).' },
      search: { desc: 'Matches the event title.' },
      from: { desc: '`Y-m-d`. Events that end on or after this day.' },
      to: { desc: '`Y-m-d`. Events that start on or before this day.' },
      scope: { desc: 'Which events, and in which order.', enum: ['upcoming', 'past', 'all'], schema: { default: 'upcoming' } },
      paginate: { desc: 'Set to `false` with a window of at most 62 days.', type: 'boolean' },
    },
  },

  'CommunityEventController@getEventBySlug': {
    slug: 'get-community-event-by-slug',
    title: 'Get Community Event by Slug',
    summary: 'Resolves a portal event URL (space slug + event slug) to the community post slug that shows it.',
    notes: 'Returns 404 when the event is not visible to the caller or the space slug does not match. Send an empty `space` for an event posted outside any space.',
    params: {
      slug: { desc: 'The event post slug.', required: true },
      space: { desc: 'The space slug in the URL. Empty for a community-wide event.' },
    },
    errors: [{ status: 404, when: 'The event does not exist, is not visible to the caller, or `space` does not match.' }],
  },

  'CommunityEventController@register': {
    slug: 'register-member',
    title: 'Register Member',
    summary: 'Records a logged-in member\'s RSVP or registration for an event.',
    notes: `For an \`rsvp\` event, \`status\` is \`going\` or \`not_going\`. For an \`open\` event, \`status\` is \`going\` (register) or \`cancelled\` (cancel a registration the member holds); \`name\` can replace the display name.

The member's existing row is reused, or a row an admin added under their email. A checked-in guest who says going again stays checked in. The confirmation or cancellation email is queued when the seat changes.

Errors: 404 when the event is not visible; 422 when the event does not take registrations, has ended, the status is not allowed, or another account holds the email; 409 when two requests changed the same registration at once.`,
    params: {
      status: { desc: 'The answer.', enum: ['going', 'not_going', 'cancelled'], required: true, in: 'body' },
      name: { desc: 'Open events only: the name to register under.', in: 'body' },
    },
    errors: [
      { status: 404, when: 'The event is not visible to the caller.' },
      { status: 409, when: 'The registration changed under this request. Try again.' },
    ],
  },

  'CommunityEventController@registerGuest': {
    slug: 'register-visitor-community',
    title: 'Register Visitor (Portal)',
    summary: 'Registers a logged-out visitor for an `open` event in the FluentCommunity portal, by name and email.',
    notes: 'The `nonce` comes from the portal page (`fe_guest_register_<event id>`). The visitor is always `going` and cannot undo it. The confirmation email is queued.',
    params: {
      nonce: { required: true, in: 'body' },
      website: { in: 'body' },
    },
    errors: [
      { status: 403, when: 'The nonce is missing or expired. Reload the page.' },
      { status: 404, when: 'The event is not visible.' },
    ],
  },

  // -------------------------------------------------------------------------
  // Public event page
  // -------------------------------------------------------------------------

  'PortalEventController@registerGuest': {
    slug: 'register-visitor',
    title: 'Register Visitor (Event Page)',
    summary: 'Registers anyone, logged in or not, for an `rsvp` or `open` event from its public page, by name and email.',
    notes: `The public event page treats every viewer as a visitor. The registration is always \`going\` and cannot be undone from the page.

The \`nonce\` (\`fe_portal_register_<event id>\`) is checked **before** the event is looked up, so walking IDs cannot find unlisted events. The event must be \`public\` or \`unlisted\`, in a \`public\` calendar. The response carries \`html\`: the event's side card, drawn for the new state, which the page swaps in.`,
    params: {
      nonce: { required: true, in: 'body' },
      website: { in: 'body' },
    },
    errors: [
      { status: 403, when: 'The nonce is missing or expired. Reload the page.' },
      { status: 404, when: 'The event is not on a public page.' },
    ],
  },
}
