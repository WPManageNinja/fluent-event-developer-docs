<?php
/**
 * Removes every row a capture run created. Safe to run on its own, and run again.
 *
 *   wp eval-file scripts/capture/teardown.php
 *
 * Sandbox rows are found by name: calendars and events titled "Docs Sandbox …",
 * WordPress users whose login starts with "docs-sandbox-", and pages titled
 * "Docs Sandbox …". Deletes go through the same hooks the plugin uses, so guests,
 * meta and queued reminders go with them.
 */

if (!defined('ABSPATH')) {
    exit;
}

use FluentEvent\App\Models\Calendar;
use FluentEvent\App\Models\Event;
use FluentEvent\App\Models\Guest;

require_once __DIR__ . '/mute.php';

wp_set_current_user(1);
add_filter('pre_wp_mail', '__return_true', 999);

$removed = ['events' => 0, 'calendars' => 0, 'feeds' => 0, 'users' => 0, 'pages' => 0, 'actions' => 0];

$events = Event::query()
    ->whereHas('post', function ($query) {
        $query->where('post_title', 'LIKE', 'Docs Sandbox%');
    })
    ->get();

$guestIds = Guest::query()->whereIn('event_id', $events->pluck('id')->all() ?: [0])->pluck('id')->all();

// Community posts that carry a sandbox event, found through the event's fcom_feed_id link
// and by the message the plan posts them with. Collected before the events go, since
// deleting an event removes the link.
$feedIds = \FluentEvent\App\Models\Meta::query()
    ->where('object_type', 'event')
    ->where('meta_key', 'fcom_feed_id')
    ->whereIn('object_id', $events->pluck('id')->all() ?: [0])
    ->pluck('value')
    ->map('intval')
    ->all();

if (class_exists('\FluentCommunity\App\Models\Feed')) {
    $feedIds = array_merge($feedIds, \FluentCommunity\App\Models\Feed::query()
        ->where('message', 'LIKE', 'Join us: Docs Sandbox%')
        ->pluck('id')
        ->all());
}
$feedIds = array_unique(array_filter($feedIds));

foreach ($events as $event) {
    do_action('fluent_event/event/before_deleted', $event);
    $event->delete();
    do_action('fluent_event/event/deleted', $event);
    $removed['events']++;
}

foreach ($feedIds as $feedId) {
    $feed = \FluentCommunity\App\Models\Feed::query()->find($feedId);
    if ($feed) {
        \FluentCommunity\App\Models\Activity::query()->where('feed_id', $feed->id)->delete();
        $feed->delete();
        $removed['feeds']++;
    }
}

foreach (Calendar::query()->where('title', 'LIKE', 'Docs Sandbox%')->get() as $calendar) {
    do_action('fluent_event/calendar/before_deleted', $calendar);
    $calendar->delete();
    do_action('fluent_event/calendar/deleted', $calendar);
    $removed['calendars']++;
}

// Queued confirmation / cancellation emails for sandbox guests.
foreach ($guestIds as $guestId) {
    foreach (['fluent_event/send_registration_confirmation', 'fluent_event/send_registration_cancellation'] as $hook) {
        if (as_next_scheduled_action($hook, [(int) $guestId], 'fluent-event')) {
            as_unschedule_all_actions($hook, [(int) $guestId], 'fluent-event');
            $removed['actions']++;
        }
    }
}

require_once ABSPATH . 'wp-admin/includes/user.php';
foreach (get_users(['search' => 'docs-sandbox-*', 'search_columns' => ['user_login']]) as $user) {
    wp_delete_user($user->ID);
    $removed['users']++;
}

foreach (get_posts(['post_type' => 'page', 'post_status' => 'any', 'numberposts' => -1, 's' => 'Docs Sandbox']) as $page) {
    if (strpos($page->post_title, 'Docs Sandbox') === 0) {
        wp_delete_post($page->ID, true);
        $removed['pages']++;
    }
}

fwrite(STDERR, 'Teardown: ' . wp_json_encode($removed) . "\n");
