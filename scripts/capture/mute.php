<?php
/**
 * FE_CAPTURE_MUTE=VendorA,VendorB removes every hook callback whose class sits in one of
 * those PHP namespaces, for this run only. A development site often carries plugins whose
 * own dependency is inactive (an affiliate plugin without WooCommerce, say) and that fatal
 * inside wp_delete_post(); muting them keeps the capture and the teardown running.
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!function_exists('fe_capture_mute')) {
    function fe_capture_mute()
    {
        global $wp_filter;

        $namespaces = array_filter(array_map('trim', explode(',', (string) getenv('FE_CAPTURE_MUTE'))));
        if (!$namespaces) {
            return;
        }

        foreach ($wp_filter as $hookName => $hook) {
            foreach ($hook->callbacks as $priority => $callbacks) {
                foreach ($callbacks as $callback) {
                    $fn = $callback['function'];
                    $class = '';

                    if (is_array($fn)) {
                        $class = is_object($fn[0]) ? get_class($fn[0]) : (string) $fn[0];
                    } elseif (is_string($fn) && strpos($fn, '::') !== false) {
                        $class = explode('::', $fn)[0];
                    }

                    foreach ($namespaces as $namespace) {
                        if ($class !== '' && strpos(ltrim($class, '\\'), $namespace) === 0) {
                            remove_filter($hookName, $fn, $priority);
                        }
                    }
                }
            }
        }
    }
}

fe_capture_mute();
