---
title: Helpers
description: The FluentEvent services and utilities that are safe to call from add-on code.
---

# Helpers

FluentEvent keeps logic with more than one caller in services under `app/Services/`, and small tools under `app/Utils/`. The [Services & Utilities](/helpers/services) page lists the ones that are useful from add-on code.

A few rules apply to all of them:

- **Services do not fire hooks.** The controllers that call them do. When you call a service that writes, fire the matching `fluent_event/...` hook yourself, as the [code snippets](/guides/code-snippets#create-an-event-from-code) show.
- **Call them after boot.** Use [`fluent_event/loaded`](/hooks/actions/system#fluent-event-loaded) or a later hook.
- **They are internal.** Signatures can change between releases. Hooks and the REST API are the stable surface; prefer them when they do the job.
