<?php
/**
 * The ordered capture plan: build a sandbox, call every endpoint once, tear it down.
 * Required by capture.php; do not run on its own.
 *
 * Every sandbox row is named "Docs Sandbox …" (users: "docs-sandbox-…"), so
 * teardown.php can find it and anonymize.mjs can strip the prefix.
 */

if (!defined('ABSPATH')) {
    exit;
}

use FluentEvent\App\Services\Settings;

// A clean start: remove anything a failed earlier run left behind.
require __DIR__ . '/teardown.php';

$day = function ($days, $time) {
    return wp_date('Y-m-d', strtotime('+' . (int) $days . ' days')) . ' ' . $time;
};
$timezone = 'America/New_York';

// ---------------------------------------------------------------------------
// Sandbox users
// ---------------------------------------------------------------------------

foreach ([
    'maya'  => ['Maya Chen', 'maya.chen@example.com'],
    'jonas' => ['Jonas Weber', 'jonas.weber@example.com'],
    'priya' => ['Priya Raman', 'priya.raman@example.com'],
] as $key => $person) {
    $userId = wp_insert_user([
        'user_login'   => 'docs-sandbox-' . $key,
        'user_email'   => $person[1],
        'display_name' => $person[0],
        'first_name'   => strtok($person[0], ' '),
        'user_pass'    => wp_generate_password(24),
        'role'         => 'subscriber',
    ]);

    if (is_wp_error($userId)) {
        fwrite(STDERR, 'Could not create sandbox user ' . $key . ': ' . $userId->get_error_message() . "\n");
        return;
    }

    fe_set('user_' . $key, (int) $userId);
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

fe_cap('dashboard/get-dashboard', 'GET', 'dashboard');

// ---------------------------------------------------------------------------
// Calendars
// ---------------------------------------------------------------------------

$calendar = fe_cap('calendars/create-calendar', 'POST', 'calendars', [], [
    'title'       => 'Docs Sandbox Team Meetups',
    'slug'        => 'docs-sandbox-team-meetups',
    'status'      => 'public',
    'theme_color' => '#12A9B5',
]);
fe_set('calendar_id', (int) ($calendar['calendar']['id'] ?? 0));

$scratchCalendar = fe_cap('calendars/create-calendar-scratch', 'POST', 'calendars', [], [
    'title'  => 'Docs Sandbox Archive',
    'status' => 'draft',
], ['save' => false]);
fe_set('scratch_calendar_id', (int) ($scratchCalendar['calendar']['id'] ?? 0));

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

$meetup = fe_cap('events/create-event', 'POST', 'events', [], [
    'calendar_id'      => '{{calendar_id}}',
    'title'            => 'Docs Sandbox Spring Meetup',
    'description_md'   => "An evening of short talks and open networking.\n\n**Doors open at 6 PM.**",
    'status'           => 'public',
    'start_at'         => $day(21, '18:00:00'),
    'end_at'           => $day(21, '20:30:00'),
    'timezone'         => $timezone,
    'venue_type'       => 'offline',
    'venue'            => 'Riverside Community Hall',
    'address'          => '120 Market Street, Springfield',
    'cover_url'        => 'https://example.com/images/spring-meetup.jpg',
    'entry_type'       => 'rsvp',
    'show_guest_count' => 'yes',
]);
fe_set('event_id', (int) ($meetup['event']['id'] ?? 0));
fe_set('event_slug', get_post_field('post_name', (int) ($meetup['event']['post_id'] ?? 0)));

$webinar = fe_cap('events/create-event-webinar', 'POST', 'events', [], [
    'calendar_id'        => '{{calendar_id}}',
    'title'              => 'Docs Sandbox Product Webinar',
    'description_md'     => 'A walkthrough of what is new this quarter.',
    'status'             => 'public',
    'start_at'           => $day(10, '15:00:00'),
    'end_at'             => $day(10, '16:00:00'),
    'timezone'           => $timezone,
    'venue_type'         => 'online',
    'online_meeting_url' => 'https://example.com/meet/product-webinar',
    'entry_type'         => 'open',
    'show_guest_count'   => 'yes',
], ['save' => false]);
fe_set('webinar_id', (int) ($webinar['event']['id'] ?? 0));

$scratchEvent = fe_cap('events/create-event-scratch', 'POST', 'events', [], [
    'calendar_id' => '{{scratch_calendar_id}}',
    'title'       => 'Docs Sandbox Cancelled Workshop',
    'status'      => 'draft',
    'start_at'    => $day(30, '10:00:00'),
    'end_at'      => $day(30, '12:00:00'),
    'timezone'    => $timezone,
    'venue_type'  => 'offline',
    'entry_type'  => 'none',
], ['save' => false]);
fe_set('scratch_event_id', (int) ($scratchEvent['event']['id'] ?? 0));

// ---------------------------------------------------------------------------
// Guests
// ---------------------------------------------------------------------------

$maya = fe_cap('guests/create-guest', 'POST', 'events/{{event_id}}/guests', [], [
    'name'       => 'Maya Chen',
    'email'      => 'maya.chen@example.com',
    'user_id'    => '{{user_maya}}',
    'status'     => 'going',
    'send_email' => true,
]);
fe_set('guest_maya', (int) ($maya['guest']['id'] ?? 0));

fe_cap('guests/create-guest-jonas', 'POST', 'events/{{event_id}}/guests', [], [
    'name'   => 'Jonas Weber',
    'email'  => 'jonas.weber@example.com',
    'status' => 'not_going',
], ['save' => false]);

fe_cap('guests/create-guest-amara', 'POST', 'events/{{event_id}}/guests', [], [
    'name'  => 'Amara Okafor',
    'email' => 'amara.okafor@example.com',
], ['save' => false]);

$scratchGuest = fe_cap('guests/create-guest-scratch', 'POST', 'events/{{event_id}}/guests', [], [
    'name'  => 'Docs Sandbox Placeholder',
    'email' => 'placeholder@example.com',
], ['save' => false]);
fe_set('scratch_guest_id', (int) ($scratchGuest['guest']['id'] ?? 0));

fe_cap('guests/update-guest', 'PATCH', 'events/{{event_id}}/guests/{{guest_maya}}', [], [
    'status' => 'checked_in',
]);

fe_cap('guests/delete-guest', 'DELETE', 'events/{{event_id}}/guests/{{scratch_guest_id}}', ['send_email' => false]);

fe_cap('guests/list-guests', 'GET', 'events/{{event_id}}/guests', ['per_page' => 10, 'order_by' => 'name', 'order_type' => 'ASC']);

// ---------------------------------------------------------------------------
// Events, read and update
// ---------------------------------------------------------------------------

fe_cap('events/list-events', 'GET', 'events', ['search' => 'Docs Sandbox', 'period' => 'upcoming', 'per_page' => 5]);
fe_cap('events/get-event', 'GET', 'events/{{event_id}}');
fe_cap('events/get-event-by-slug', 'GET', 'events/by-slug', ['slug' => '{{event_slug}}']);

fe_cap('events/update-event', 'PATCH', 'events/{{event_id}}', [], [
    'calendar_id'      => '{{calendar_id}}',
    'title'            => 'Docs Sandbox Spring Meetup',
    'description_md'   => "An evening of short talks and open networking.\n\n**Doors open at 5:30 PM.**",
    'status'           => 'public',
    'start_at'         => $day(21, '17:30:00'),
    'end_at'           => $day(21, '20:30:00'),
    'timezone'         => $timezone,
    'venue_type'       => 'offline',
    'venue'            => 'Riverside Community Hall',
    'address'          => '120 Market Street, Springfield',
    'cover_url'        => 'https://example.com/images/spring-meetup.jpg',
    'entry_type'       => 'rsvp',
    'show_guest_count' => 'yes',
]);

fe_cap('events/delete-event', 'DELETE', 'events/{{scratch_event_id}}');

// ---------------------------------------------------------------------------
// Calendars, read and update
// ---------------------------------------------------------------------------

fe_cap('calendars/list-calendars', 'GET', 'calendars', ['search' => 'Docs Sandbox']);
fe_cap('calendars/list-calendar-options', 'GET', 'calendars/options', ['search' => 'Docs Sandbox', 'order_by' => 'title', 'order_type' => 'ASC']);
fe_cap('calendars/get-calendar', 'GET', 'calendars/{{calendar_id}}');
fe_cap('calendars/update-calendar', 'PATCH', 'calendars/{{calendar_id}}', [], [
    'title'       => 'Docs Sandbox Team Meetups',
    'slug'        => 'docs-sandbox-team-meetups',
    'status'      => 'public',
    'theme_color' => '#0E8E99',
]);
fe_cap('calendars/delete-calendar', 'DELETE', 'calendars/{{scratch_calendar_id}}');

// ---------------------------------------------------------------------------
// Reports, users
// ---------------------------------------------------------------------------

fe_cap('reports/get-reports', 'GET', 'reports');
fe_cap('reports/get-guest-trends', 'GET', 'reports/guest-trends', [
    'start_date' => wp_date('Y-m-d', strtotime('-6 days')),
    'end_date'   => wp_date('Y-m-d'),
]);

fe_cap('users/search-users', 'GET', 'users', ['search' => 'docs-sandbox']);

// ---------------------------------------------------------------------------
// Settings: each write is a round trip, then the stored value is put back.
// ---------------------------------------------------------------------------

$general = Settings::get(Settings::GENERAL);
$email = Settings::get(Settings::EMAIL);
$notifications = Settings::get(Settings::EMAIL_NOTIFICATIONS);

fe_cap('settings/get-general-settings', 'GET', 'settings/general');
fe_cap('settings/update-general-settings', 'POST', 'settings/general', [], [
    'default_events_view'       => $general['default_events_view'],
    'disable_event_view_switch' => $general['disable_event_view_switch'],
]);

fe_cap('settings/create-page', 'POST', 'settings/create-page', [], [
    'key'   => 'events_page_id',
    'title' => 'Docs Sandbox Events',
]);
fe_cap('settings/search-pages', 'GET', 'settings/pages', ['key' => 'events_page_id', 'search' => 'Docs Sandbox']);
Settings::update(Settings::GENERAL, ['events_page_id' => (int) $general['events_page_id']]);

fe_cap('settings/get-email-settings', 'GET', 'settings/email');
fe_cap('settings/update-email-settings', 'POST', 'settings/email', [], [
    'from_name'      => 'Community Events',
    'from_email'     => 'events@example.com',
    'reply_to_name'  => 'Events Team',
    'reply_to_email' => 'hello@example.com',
    'email_footer'   => '<p>You are receiving this email because you registered for an event.</p>',
]);
Settings::update(Settings::EMAIL, $email);

fe_cap('settings/get-email-notification-settings', 'GET', 'settings/email-notifications');
fe_cap('settings/update-email-notification-settings', 'POST', 'settings/email-notifications', [], [
    'registration_confirmation' => ['enabled' => true],
    'registration_cancellation' => ['enabled' => true],
    'reminder_to_guest'         => [
        'enabled' => true,
        'times'   => [
            ['value' => 1, 'unit' => 'days'],
            ['value' => 2, 'unit' => 'hours'],
        ],
    ],
]);
Settings::update(Settings::EMAIL_NOTIFICATIONS, $notifications);
// Put the reminder queue back for the restored settings.
as_unschedule_all_actions('fluent_event/reschedule_event_reminders', null, 'fluent-event');
as_enqueue_async_action('fluent_event/reschedule_event_reminders', [0], 'fluent-event');

fe_cap('settings/preview-email', 'GET', 'settings/email-notifications/preview/confirmation');

// ---------------------------------------------------------------------------
// FluentCommunity portal
// ---------------------------------------------------------------------------

if (did_action('fluent_community/fluent_event/init')) {
    $communityEvent = function ($title, $entryType, $days) use ($day, $timezone) {
        return [
            'message'      => 'Join us: ' . $title,
            'content_type' => 'event',
            'event'        => [
                'title'              => $title,
                'description_md'     => 'Bring your questions.',
                'start_at'           => $day($days, '14:00:00'),
                'end_at'             => $day($days, '15:30:00'),
                'timezone'           => $timezone,
                'venue_type'         => 'online',
                'online_meeting_url' => 'https://example.com/meet/' . sanitize_title($title),
                'entry_type'         => $entryType,
                'show_guest_count'   => 'yes',
            ],
        ];
    };

    $rsvpPost = fe_cap('community/create-feed-rsvp', 'POST', 'feeds', [], $communityEvent('Docs Sandbox Community Q&A', 'rsvp', 14), ['save' => false, 'ns' => 'fluent-community/v2']);
    $openPost = fe_cap('community/create-feed-open', 'POST', 'feeds', [], $communityEvent('Docs Sandbox Design Workshop', 'open', 16), ['save' => false, 'ns' => 'fluent-community/v2']);

    $rsvpEventId = (int) ($rsvpPost['feed']['meta']['event_id'] ?? 0);
    $openEventId = (int) ($openPost['feed']['meta']['event_id'] ?? 0);
    fe_set('community_event_id', $rsvpEventId);
    fe_set('community_open_event_id', $openEventId);
    fe_set('community_event_slug', $rsvpEventId ? get_post_field('post_name', \FluentEvent\App\Models\Event::query()->find($rsvpEventId)->post_id) : '');

    fe_cap('community/list-community-events', 'GET', 'community/events', ['search' => 'Docs Sandbox', 'scope' => 'upcoming', 'per_page' => 5], [], ['as' => fe_ctx('user_maya')]);
    fe_cap('community/get-community-event-by-slug', 'GET', 'community/events/by-slug', ['slug' => '{{community_event_slug}}', 'space' => ''], [], ['as' => fe_ctx('user_maya')]);
    fe_cap('community/register-member', 'POST', 'community/events/{{community_event_id}}/register', [], ['status' => 'going'], ['as' => fe_ctx('user_maya')]);

    // Nonces are bound to the user, so a visitor's nonce is made while logged out.
    wp_set_current_user(0);
    fe_set('community_nonce', wp_create_nonce('fe_guest_register_' . $openEventId));
    fe_cap('community/register-visitor-community', 'POST', 'community/events/{{community_open_event_id}}/register-guest', [], [
        'name'  => 'Lena Fischer',
        'email' => 'lena.fischer@example.com',
        'nonce' => '{{community_nonce}}',
    ], ['as' => 0]);
} else {
    fwrite(STDERR, "FluentCommunity integration is off: community endpoints not captured.\n");
}

// ---------------------------------------------------------------------------
// Public event page
// ---------------------------------------------------------------------------

wp_set_current_user(0);
fe_set('portal_nonce', wp_create_nonce('fe_portal_register_' . fe_ctx('event_id')));
fe_cap('portal/register-visitor', 'POST', 'portal/events/{{event_id}}/register-guest', [], [
    'name'  => 'Diego Alvarez',
    'email' => 'diego.alvarez@example.com',
    'nonce' => '{{portal_nonce}}',
], ['as' => 0]);

// ---------------------------------------------------------------------------
// Done: remove the sandbox.
// ---------------------------------------------------------------------------

wp_set_current_user(1);
require __DIR__ . '/teardown.php';
