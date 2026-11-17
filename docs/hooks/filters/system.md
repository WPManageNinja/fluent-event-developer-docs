---
title: "System Filters"
description: "System filter hooks in FluentEvent."
---

# System Filters

4 filter hooks on this page, across 4 call sites.

| Hook | Filters | Call Sites |
| --- | --- | --- |
| [`fluent_event/admin_base_url`](#fluent-event-admin-base-url) | Filters the base URL of the FluentEvent admin app. | 1 |
| [`fluent_event/cloudflare_ip_ranges`](#fluent-event-cloudflare-ip-ranges) | Filters the Cloudflare IP ranges. A request from one of them supplies the visitor IP address in `CF-Connecting-IP`. | 1 |
| [`fluent_event/is_rtl`](#fluent-event-is-rtl) | Filters whether FluentEvent loads the right-to-left versions of its stylesheets. | 1 |
| [`fluent_event/trusted_proxies`](#fluent-event-trusted-proxies) | Filters the reverse proxies whose `X-Forwarded-For` header FluentEvent believes when it finds the visitor IP address. | 1 |

<a id="fluent-event-admin-base-url"></a>

## `fluent_event/admin_base_url`

- **Type:** filter
- **Call sites:** 1
- **When it fires:** Filters the base URL of the FluentEvent admin app.

The default is `admin.php?page=fluent-event#/` under `admin_url()`. The admin submenu, the top navigation and the admin app (as `baseUrl`) add their routes to this value, for example `events` or `settings/general`. Keep the trailing `#/`.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$url` | `string` | The admin app URL, ending in `#/`. |

**Return:** `string` — the filtered url.

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Hooks/Handlers/AdminMenuHandler.php:52` | `AdminMenuHandler::__construct()` | `admin_url('admin.php?page=' . $this->slug . '#/')` |

### Example

```php
add_filter('fluent_event/admin_base_url', function ($url) {
    // Change and return the first argument.
    return $url;
}, 10, 1);
```

<a id="fluent-event-cloudflare-ip-ranges"></a>

## `fluent_event/cloudflare_ip_ranges`

- **Type:** filter
- **Call sites:** 1
- **When it fires:** Filters the Cloudflare IP ranges. A request from one of them supplies the visitor IP address in `CF-Connecting-IP`.

The default is the IPv4 and IPv6 lists published at https://www.cloudflare.com/ips/. Add a range here when Cloudflare publishes a new one before a FluentEvent update ships it. Return an empty array to ignore `CF-Connecting-IP` on a site that is not behind Cloudflare.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$ranges` | `array` | CIDR ranges. |

**Return:** `array` — the filtered ranges.

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Utils/Utility.php:90` | `Utility::isCfIp()` | `[ '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13', '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22', '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32', '2405:8100::/32', '2a06:98c0::/29', '2c0f:f248::/32', ]` |

### Example

```php
add_filter('fluent_event/cloudflare_ip_ranges', '__return_empty_array');
```

<a id="fluent-event-is-rtl"></a>

## `fluent_event/is_rtl`

- **Type:** filter
- **Call sites:** 1
- **When it fires:** Filters whether FluentEvent loads the right-to-left versions of its stylesheets.

Defaults to WordPress's `is_rtl()`. The admin app, the public pages and the FluentCommunity portal chunks all read this one answer, so they never load different files.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$isRtl` | `bool` | Whether to load the `.rtl.css` files. |

**Return:** `bool` — the filtered isRtl.

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Utils/Enqueuer/Vite.php:146` | `Vite::isRtl()` | `is_rtl()` |

### Example

```php
add_filter('fluent_event/is_rtl', function ($isRtl) {
    // Change and return the first argument.
    return $isRtl;
}, 10, 1);
```

<a id="fluent-event-trusted-proxies"></a>

## `fluent_event/trusted_proxies`

- **Type:** filter
- **Call sites:** 1
- **When it fires:** Filters the reverse proxies whose `X-Forwarded-For` header FluentEvent believes when it finds the visitor IP address.

The rate limit on the registration endpoints counts a visitor by IP address. By default FluentEvent uses `REMOTE_ADDR`. It reads `X-Forwarded-For` only when `REMOTE_ADDR` matches an entry in this list, and then takes the right-most address in the header, because a client can send anything to the left of it.

The default list comes from `config/trustedproxy.php`, which is empty. Cloudflare needs no entry here: FluentEvent reads `CF-Connecting-IP` when `REMOTE_ADDR` is in [`fluent_event/cloudflare_ip_ranges`](#fluent-event-cloudflare-ip-ranges).

After this, the shared `fluent_auth/user_ip` filter can still replace the address.

### Parameters

| # | Name | Type | Description |
| --- | --- | --- | --- |
| 1 | `$proxies` | `array` | IP addresses or CIDR ranges, for example `10.0.0.0/8`. |

**Return:** `array` — the filtered proxies.

### Call Sites

| Source | Context | Arguments |
| --- | --- | --- |
| `fluent-event/app/Utils/Utility.php:35` | `Utility::getIp()` | `(array) App::config()->get('trustedproxy.proxies', [])` |

### Example

```php
// The site runs behind a load balancer on the private network.
add_filter('fluent_event/trusted_proxies', function ($proxies) {
    $proxies[] = '10.0.0.0/8';

    return $proxies;
});
```
