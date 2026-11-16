---
title: Code Snippets
description: Copy-ready PHP snippets for common FluentEvent customizations.
---

# Code Snippets

Put these in a small custom plugin or a code snippets plugin. Each one waits for [`fluent_event/loaded`](/hooks/actions/system#fluent-event-loaded) when it uses FluentEvent classes.

## Send New Guests to FluentCRM

```php
add_action('fluent_event/guest/created', function ($guest) {
    if ($guest->status !== 'going' || !function_exists('FluentCrmApi')) {
        return;
    }

    $event = $guest->event;

    FluentCrmApi('contacts')->createOrUpdate([
        'email'      => $guest->email,
        'first_name' => $guest->name,
        'tags'       => ['event-' . $event->id],
    ]);
});
```

## Notify a Host When Someone Cancels

```php
add_action('fluent_event/guest/updated', function ($guest, $previousStatus) {
    $leftSeat = in_array($previousStatus, ['going', 'checked_in'], true)
        && in_array($guest->status, ['not_going', 'cancelled'], true);

    if (!$leftSeat) {
        return;
    }

    $event = $guest->event;
    $host  = get_userdata(get_post_field('post_author', $event->post_id));

    if ($host) {
        wp_mail(
            $host->user_email,
            sprintf('%s cancelled', $guest->name),
            sprintf('%s is no longer going to "%s".', $guest->name, $event->title)
        );
    }
}, 10, 2);
```

## Add a Field to the Admin Event Response

```php
add_filter('fluent_event/event_api_response', function ($data, $event) {
    $data['attendance_goal'] = (int) get_post_meta($event->post_id, '_attendance_goal', true);

    return $data;
}, 10, 2);
```

`wp_postmeta` on the `fe_event` post is the place for add-on data that you never query by. For data you filter or sort by, use your own table.

## Allow Longer Venue Names and Calendar Titles

```php
add_filter('fluent_event/event_venue_max_length', fn () => 200);
add_filter('fluent_event/calendar_title_max_length', fn () => 150);
```

Both are capped at 255 characters.

## List Upcoming Events in a Template

```php
use FluentEvent\App\Models\Event;
use FluentEvent\App\Services\EventPageService;

$events = Event::query()
    ->with(['post', 'calendar'])
    ->byStatus('public')
    ->whereHas('calendar', fn ($q) => $q->byStatus('public'))
    ->byPeriod('upcoming')
    ->limit(5)
    ->get();

echo '<ul>';
foreach ($events as $event) {
    printf(
        '<li><a href="%s">%s</a> — %s</li>',
        esc_url(EventPageService::url($event)),
        esc_html($event->title),
        esc_html(wp_date('M j, g:i a', strtotime($event->start_at . ' UTC')))
    );
}
echo '</ul>';
```

## Create an Event from Code

`EventService::createEvent()` writes the post and the details row in one transaction. Fire the created hook yourself so reminders are scheduled and other add-ons hear about it.

```php
use FluentEvent\App\Http\Requests\EventRequest;
use FluentEvent\App\Services\EventService;

$event = EventService::createEvent(EventRequest::format([
    'calendar_id'    => 3,
    'title'          => 'Monthly Meetup',
    'description_md' => 'Bring a friend!',
    'status'         => 'public',
    'start_at'       => '2026-12-10 18:00:00',
    'end_at'         => '2026-12-10 20:00:00',
    'timezone'       => 'Europe/Berlin',
    'venue_type'     => 'offline',
    'venue'          => 'Community Hall',
    'entry_type'     => 'rsvp',
]));

do_action('fluent_event/event/created', $event);
```

`EventRequest::format()` does not validate. Validate input from users first, or call the REST API instead.

## Check In a Guest by Email

```php
use FluentEvent\App\Models\Guest;

$guest = Guest::query()
    ->where('event_id', $eventId)
    ->where('email', sanitize_email($email))
    ->first();

if ($guest && $guest->status === 'going') {
    $previous = $guest->status;
    $guest->fill(['status' => 'checked_in', 'checked_in_at' => current_time('mysql')])->save();

    do_action('fluent_event/guest/updated', $guest, $previous);
}
```

## Call the REST API from Another Server

```bash
# List the next 10 upcoming events.
curl -u "admin:abcd efgh ijkl mnop qrst uvwx" \
  "https://yourwebsite.com/wp-json/fluent-event/v2/events?period=upcoming&per_page=10"

# Add a guest and send the confirmation email.
curl -u "admin:abcd efgh ijkl mnop qrst uvwx" \
  -H "Content-Type: application/json" \
  -d '{"name":"Maya Chen","email":"maya@example.com","send_email":true}' \
  "https://yourwebsite.com/wp-json/fluent-event/v2/events/12/guests"
```
