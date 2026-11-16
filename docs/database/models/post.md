---
title: "Post Model"
description: "Read-only view of `wp_posts`, limited to `fe_event` posts."
---

# Post Model

Read-only view of `wp_posts`, limited to `fe_event` posts.

A global scope adds `post_type = 'fe_event'` to every query. Use it to read; write posts through `wp_insert_post()` / `wp_update_post()` (the plugin's `PostService` does this), so WordPress hooks and caches stay correct.

## Class

- **Class:** `FluentEvent\App\Models\Post`
- **Table:** `wp_posts`
- **Primary key:** `ID`
- **Extends:** `Model`
- **Timestamps:** off (`$timestamps = false`)
- **Global scopes:** `post_type`
- **Source:** `fluent-event/app/Models/Post.php`

## Scopes

| Scope | Parameters | Description |
| --- | --- | --- |
| `byStatus()` | `$status` | Limits to one `post_status` or a list. |

## Usage

```php
use FluentEvent\App\Models\Post;

$drafts = Post::query()->byStatus('draft')->pluck('post_title', 'ID');
```
