---
title: "User Model"
description: "Read access to `wp_users`, with the framework user proxy."
---

# User Model

Read access to `wp_users`, with the framework user proxy.

The `UserProxyTrait` forwards calls to the `WP_User` object, so `$user->has_cap(...)` and similar work on the model.

## Class

- **Class:** `FluentEvent\App\Models\User`
- **Table:** `wp_users`
- **Primary key:** `ID`
- **Extends:** `Model`
- **Timestamps:** off (`$timestamps = false`)
- **Source:** `fluent-event/app/Models/User.php`

## Usage

```php
use FluentEvent\App\Models\User;

$user = User::query()->find(get_current_user_id());
```
