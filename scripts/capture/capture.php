<?php
/**
 * FluentEvent REST response capture harness.
 *
 *   FE_CAPTURE_OUT=/tmp/fe-capture wp eval-file scripts/capture/capture.php
 *
 * Dispatches internal REST requests against a development site, builds a throwaway
 * sandbox for the endpoints that write, and saves every raw response to
 * <out>/<module>/<slug>.json for scripts/capture/anonymize.mjs.
 *
 * Point it at a development site only: it creates and deletes data.
 */

if (!defined('ABSPATH')) {
    exit;
}

$FE_OUT_DIR = getenv('FE_CAPTURE_OUT') ?: __DIR__ . '/captured';
$FE_ONLY_PREFIX = getenv('FE_CAPTURE_ONLY') ?: '';

if (!is_dir($FE_OUT_DIR)) {
    mkdir($FE_OUT_DIR, 0777, true);
}

global $FE_CTX, $FE_LOG, $FE_OUT, $FE_ONLY;
$FE_CTX = [];
$FE_LOG = [];
$FE_OUT = $FE_OUT_DIR;
$FE_ONLY = $FE_ONLY_PREFIX;

require_once __DIR__ . '/mute.php';

wp_set_current_user(1);

// Never send real mail from a capture run.
add_filter('pre_wp_mail', '__return_true', 999);

function fe_ctx($key, $default = null)
{
    global $FE_CTX;
    return array_key_exists($key, $FE_CTX) ? $FE_CTX[$key] : $default;
}

function fe_set($key, $value)
{
    global $FE_CTX;
    $FE_CTX[$key] = $value;
}

/** Replaces {{key}} tokens from the shared context. */
function fe_interpolate($value)
{
    global $FE_CTX;

    if (is_array($value)) {
        foreach ($value as $k => $v) {
            $value[$k] = fe_interpolate($v);
        }
        return $value;
    }

    if (!is_string($value)) {
        return $value;
    }

    // A value that is only a token keeps the token's type (an int ID stays an int).
    if (preg_match('/^\{\{(\w+)\}\}$/', $value, $m) && array_key_exists($m[1], $FE_CTX)) {
        return $FE_CTX[$m[1]];
    }

    return preg_replace_callback('/\{\{(\w+)\}\}/', function ($m) use ($FE_CTX) {
        return array_key_exists($m[1], $FE_CTX) ? (string) $FE_CTX[$m[1]] : $m[0];
    }, $value);
}

/**
 * The WPFluent Request is a container singleton built once from $_GET/$_POST, and each
 * route merges its WP_REST_Request params into it. Across many dispatches in one PHP
 * process that leaks parameters from one call into the next, so clear it before each.
 * FluentCommunity runs on its own copy of the framework and needs the same reset.
 */
function fe_reset_framework_requests()
{
    foreach (['\FluentEvent\App\App', '\FluentCommunity\App\App'] as $facade) {
        if (!class_exists($facade)) {
            continue;
        }

        try {
            $request = $facade::make('request');
        } catch (\Throwable $e) {
            continue;
        }

        if (!is_object($request)) {
            continue;
        }

        $ref = new \ReflectionObject($request);
        foreach (['request', 'post', 'get', 'files', 'json'] as $prop) {
            if (!$ref->hasProperty($prop)) {
                continue;
            }
            $p = $ref->getProperty($prop);
            $p->setAccessible(true);
            $p->setValue($request, []);
        }
    }

    $_GET = $_POST = $_REQUEST = [];
}

/**
 * Sends one REST request and saves the response.
 *
 * @param string $slug   <module>/<operation-slug>, matching the OpenAPI file name.
 * @param string $method HTTP method.
 * @param string $path   Path below the namespace; may contain {{tokens}}.
 * @param array  $query  Query args.
 * @param array  $body   JSON body.
 * @param array  $opts   'as' => user ID (0 = visitor), 'save' => false, 'ns' => namespace.
 */
function fe_cap($slug, $method, $path, $query = [], $body = [], $opts = [])
{
    global $FE_LOG, $FE_OUT, $FE_ONLY;

    if ($FE_ONLY && strpos($slug, $FE_ONLY) !== 0 && !isset($opts['always'])) {
        return null;
    }

    $path = fe_interpolate($path);
    $query = fe_interpolate($query);
    $body = fe_interpolate($body);

    if (strpos($path, '{{') !== false) {
        $FE_LOG[] = ['slug' => $slug, 'status' => 'skipped', 'reason' => 'unresolved token in ' . $path];
        return null;
    }

    $asUser = array_key_exists('as', $opts) ? (int) $opts['as'] : 1;
    $namespace = isset($opts['ns']) ? $opts['ns'] : 'fluent-event/v2';

    wp_set_current_user($asUser);
    fe_reset_framework_requests();

    $request = new WP_REST_Request($method, '/' . $namespace . '/' . ltrim($path, '/'));
    foreach ($query as $k => $v) {
        $request->set_param($k, $v);
    }
    if ($body) {
        $request->set_header('content-type', 'application/json');
        $request->set_body(wp_json_encode($body));
        foreach ($body as $k => $v) {
            $request->set_param($k, $v);
        }
    }

    $start = microtime(true);
    try {
        $response = rest_do_request($request);
        $status = $response->get_status();
        $data = rest_get_server()->response_to_data($response, false);
        $error = null;
    } catch (\Throwable $e) {
        $status = 500;
        $data = null;
        $error = get_class($e) . ': ' . $e->getMessage();
    }
    $ms = round((microtime(true) - $start) * 1000);

    // Round-trip through JSON so models and paginators are saved as the client sees them.
    $data = json_decode(wp_json_encode($data), true);

    $record = [
        'slug'        => $slug,
        'method'      => $method,
        'path'        => '/' . ltrim($path, '/'),
        'query'       => (object) $query,
        'requestBody' => $body ? $body : null,
        'status'      => $status,
        'as_user'     => $asUser,
        'duration_ms' => $ms,
        'error'       => $error,
        'response'    => $data,
    ];

    $save = !isset($opts['save']) || $opts['save'] !== false;
    $failed = $status < 200 || $status >= 300;

    if ($save || $failed) {
        $file = $failed && !$save
            ? $FE_OUT . '/_failures/' . str_replace('/', '__', $slug) . '.json'
            : $FE_OUT . '/' . $slug . '.json';

        if (!is_dir(dirname($file))) {
            mkdir(dirname($file), 0777, true);
        }
        file_put_contents($file, wp_json_encode($record, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }

    $FE_LOG[] = ['slug' => $slug, 'status' => $status, 'ms' => $ms, 'error' => $error, 'saved' => $save];
    fwrite(STDERR, sprintf("[%s] %-6s %-55s %s\n", $status, $method, $path, $slug));

    return $data;
}

require __DIR__ . '/capture-plan.php';

$ok = 0;
$failures = [];
foreach ($FE_LOG as $entry) {
    if (isset($entry['status']) && is_int($entry['status']) && $entry['status'] >= 200 && $entry['status'] < 300) {
        $ok++;
    } else {
        $failures[] = $entry;
    }
}

file_put_contents($FE_OUT . '/_site.json', wp_json_encode(['home' => home_url(), 'site' => site_url()]));
file_put_contents($FE_OUT . '/_log.json', wp_json_encode($FE_LOG, JSON_PRETTY_PRINT));
fwrite(STDERR, sprintf("\n==== %d ok, %d failed of %d ====\n", $ok, count($failures), count($FE_LOG)));
foreach ($failures as $f) {
    fwrite(STDERR, sprintf("  FAIL %-45s %s %s\n", $f['slug'], $f['status'], isset($f['reason']) ? $f['reason'] : (string) $f['error']));
}
