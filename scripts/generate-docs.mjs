#!/usr/bin/env node
/**
 * Generates the reference half of the FluentEvent developer docs from the plugin source
 * one directory up: database schema and models, hooks, and the REST API (pages plus one
 * OpenAPI spec per operation).
 *
 * Every run deletes and rewrites the generated paths listed in GENERATED_PATHS. Never
 * hand-edit them. Prose lives in data/*.mjs; page templates live in this file.
 *
 *   node scripts/generate-docs.mjs            # plugin at ../
 *   FE_PLUGIN_DIR=/path/to/fluent-event node scripts/generate-docs.mjs
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSource, PLUGIN_SLUG, snake } from './lib/source.mjs'
import HOOK_NOTES from '../data/hook-notes.mjs'
import MODEL_NOTES from '../data/model-notes.mjs'
import { OPERATIONS, PARAM_NOTES, POLICY_NOTES } from '../data/operation-notes.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PLUGIN_DIR = resolve(process.env.FE_PLUGIN_DIR || join(ROOT, '..'))
const DOCS = join(ROOT, 'docs')
const PUBLIC_OPENAPI = join(ROOT, 'public', 'openapi')
const GENERATED_DIR = join(ROOT, '.generated')

const GENERATED_PATHS = [
  join(DOCS, 'database'),
  join(DOCS, 'hooks'),
  join(DOCS, 'restapi'),
  join(DOCS, 'index.md'),
  join(DOCS, 'getting-started.md'),
  GENERATED_DIR,
  PUBLIC_OPENAPI,
]

if (!existsSync(join(PLUGIN_DIR, 'fluent-event.php'))) {
  console.error(`FluentEvent source not found at ${PLUGIN_DIR}. Set FE_PLUGIN_DIR.`)
  process.exit(1)
}

const source = createSource(PLUGIN_DIR)
const META = source.pluginMeta()
const warnings = []

// ---------------------------------------------------------------------------
// Metadata that has no home in the PHP source
// ---------------------------------------------------------------------------

/** REST modules: one sidebar entry and one overview page each, in this order. */
const MODULES = [
  { key: 'events', title: 'Events', group: 'Admin API', controllers: ['EventController'], description: 'Create, read, update and delete events. An event is a `fe_event` post plus its `fe_event_details` row, written together.' },
  { key: 'guests', title: 'Guests', group: 'Admin API', controllers: ['GuestController'], description: 'List, add, edit and remove the guests of one event. A guest row is one person on one event.' },
  { key: 'calendars', title: 'Calendars', group: 'Admin API', controllers: ['CalendarController'], description: 'Create and manage calendars, the containers that hold events.' },
  { key: 'reports', title: 'Reports', group: 'Admin API', controllers: ['ReportController'], description: 'Dashboard numbers: totals, ongoing and upcoming events, top events and the guest trend chart.' },
  { key: 'settings', title: 'Settings', group: 'Admin API', controllers: ['SettingsController'], description: 'General, email sender and email notification settings, the All Events page, and email previews.' },
  { key: 'users', title: 'Users', group: 'Admin API', controllers: ['UserController'], description: 'WordPress user lookup for the guest picker.' },
  { key: 'dashboard', title: 'Dashboard', group: 'Admin API', controllers: ['DashboardController'], description: 'Placeholder endpoint for the admin dashboard.' },
  { key: 'community', title: 'Community Portal', group: 'Front-End API', controllers: ['CommunityEventController'], description: 'Member-facing endpoints that the FluentCommunity portal uses: the events list, event lookup by slug, and registration.' },
  { key: 'portal', title: 'Public Event Page', group: 'Front-End API', controllers: ['PortalEventController'], description: 'Registration from the public event page that WordPress serves at `/<event_slug>/<post_slug>/`.' },
]
const MODULE_BY_CONTROLLER = Object.fromEntries(MODULES.flatMap((m) => m.controllers.map((c) => [c, m])))

/** Hook pages, in sidebar order. `test` receives the hook name. */
const HOOK_PAGES = [
  { key: 'events', title: 'Events', test: (n) => /^fluent_event\/(event\/|events?_api_response|event_venue)/.test(n) },
  { key: 'guests', title: 'Guests', test: (n) => /^fluent_event\/guest\/(?!confirmation_sent|cancellation_sent)/.test(n) },
  { key: 'calendars', title: 'Calendars', test: (n) => /^fluent_event\/calendars?[/_]/.test(n) },
  { key: 'emails', title: 'Emails & Reminders', test: (n) => /^fluent_event\/(send_|reschedule_|guest_reminders_sent|guest\/confirmation_sent|guest\/cancellation_sent)/.test(n) },
  { key: 'settings', title: 'Settings', test: (n) => /^fluent_event\/settings\//.test(n) },
  { key: 'community', title: 'FluentCommunity', test: (n) => /^fluent_event\/community\//.test(n) },
  { key: 'system', title: 'System', test: () => true },
]

/** Parameter types by variable name, when neither a docblock nor hook-notes names one. */
const TYPE_HINTS = {
  $event: '\\FluentEvent\\App\\Models\\Event',
  $guest: '\\FluentEvent\\App\\Models\\Guest',
  $calendar: '\\FluentEvent\\App\\Models\\Calendar',
  $settings: 'array',
  $data: 'array',
  $request: 'array',
  $app: '\\FluentEvent\\Framework\\Foundation\\Application',
  $sent: 'int',
  $previousStatus: 'string',
  $previousCalendarId: 'int',
}

const MODEL_ORDER = ['Event', 'Calendar', 'Guest', 'Meta', 'Post', 'User']

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content.replace(/\n{3,}/g, '\n\n').replace(/\s*$/, '\n'))
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n')
}

function frontmatter(fields) {
  const lines = Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? JSON.stringify(value) : value}`)
  return `---\n${lines.join('\n')}\n---\n\n`
}

function cell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ')
}

function code(value) {
  return '`' + String(value).replace(/`/g, '\\`') + '`'
}

function src(file, line) {
  return code(`${PLUGIN_SLUG}/${file}${line ? `:${line}` : ''}`)
}

function slugify(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function anchorFor(hook) {
  return hook.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()
}

function titleCase(value) {
  return String(value)
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function camel(slug) {
  return slug.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
}

function shortType(type) {
  return String(type || 'mixed').replace(/^\\?FluentEvent\\App\\Models\\/, '').replace(/^\\/, '')
}

function loadJson(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {}
}

// ---------------------------------------------------------------------------
// Clean
// ---------------------------------------------------------------------------

for (const path of GENERATED_PATHS) {
  rmSync(path, { recursive: true, force: true })
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

const TABLES = source.tables()
const MODELS = source.models()
  .filter((model) => model.className !== 'Model')
  .sort((a, b) => MODEL_ORDER.indexOf(a.className) - MODEL_ORDER.indexOf(b.className))

const TABLE_TO_MODEL = Object.fromEntries(MODELS.map((m) => [m.table, m]))

/** Links between tables, read from column comments (`fe_calendars.id`, `wp_posts.ID`). */
function tableEdges() {
  const edges = []
  for (const table of TABLES) {
    for (const column of table.columns) {
      const ref = column.comment.match(/\b(wp_)?(fe_\w+|posts|users)\.(id|ID)\b/)
      if (ref) {
        edges.push({ from: ref[2].startsWith('fe_') ? ref[2] : `wp_${ref[2]}`, to: table.name, column: column.name })
      }
    }
  }
  return edges
}

function mermaidType(type) {
  return type.replace(/\(.*$/, '').replace(/\s+unsigned/, '').toLowerCase()
}

function schemaPage() {
  const edges = tableEdges()
  const er = ['erDiagram']

  for (const edge of edges) {
    er.push(`  ${edge.from} ||--o{ ${edge.to} : "${edge.column}"`)
  }

  for (const table of TABLES) {
    er.push(`  ${table.name} {`)
    for (const column of table.columns) {
      const keys = []
      if (column.primary) keys.push('PK')
      if (edges.some((e) => e.to === table.name && e.column === column.name)) keys.push('FK')
      else if (table.indexes.some((i) => i.unique && !column.primary && i.columns.length === 1 && i.columns[0] === column.name)) keys.push('UK')
      er.push(`    ${mermaidType(column.type)} ${column.name}${keys.length ? ' ' + keys.join(',') : ''}`)
    }
    er.push('  }')
  }

  let out = frontmatter({ title: 'Database Schema', description: 'Every FluentEvent table, its columns and indexes, and how the tables link to each other and to WordPress.' })
  out += `# Database Schema\n\n`
  out += `FluentEvent creates ${TABLES.length} tables, all prefixed \`{$wpdb->prefix}fe_\`. Each table has its own migrator in \`database/Migrations/\`, and \`DBMigrator\` runs them on activation and on upgrade. The current schema version is \`${META.dbVersion}\` (\`FLUENT_EVENT_DB_VERSION\`).\n\n`
  out += `An event is a **custom post type hybrid**. The \`fe_event\` post in \`wp_posts\` holds the title, slug, description, status and author. The \`fe_event_details\` row holds everything typed: dates, calendar, venue and the \`meta\` JSON. The two rows are 1:1 on \`post_id\` and are always written in one transaction.\n\n`
  out += `::: tip Three things people get wrong\n`
  out += `- **There is no registrations table.** A guest row *is* the registration. An order is the set of guest rows that share a \`group_id\`; the \`is_buyer = 1\` row carries the payment fields.\n`
  out += `- **No inheritance between events.** \`parent_event_id\` is reserved for recurrence, but every row owns its own post and its own full values.\n`
  out += `- **Images are URLs.** A cover image is \`event_details.meta.cover_url\`, never an attachment ID or an image column.\n`
  out += `:::\n\n`

  out += `## Table Inventory\n\n| Table | Model | Purpose | Migration |\n| --- | --- | --- | --- |\n`
  for (const table of TABLES) {
    const model = TABLE_TO_MODEL[table.name]
    const note = MODEL_NOTES.tables?.[table.name] || ''
    out += `| \`${table.name}\` | ${model ? `[\`${model.className}\`](/database/models/${slugify(model.className)})` : '—'} | ${cell(note)} | \`${table.file}\` |\n`
  }
  for (const [name, note] of Object.entries(MODEL_NOTES.wordpressTables || {})) {
    const model = TABLE_TO_MODEL[name.replace(/^wp_/, '')]
    out += `| \`${name}\` | ${model ? `[\`${model.className}\`](/database/models/${slugify(model.className)})` : '—'} | ${cell(note)} | WordPress core |\n`
  }

  out += `\n## Relationships\n\n\`\`\`mermaid\n${er.join('\n')}\n\`\`\`\n\n`
  out += `The diagram is built from the column comments in the migrations, so it shows the links the schema declares. There are no database-level foreign keys: WordPress tables are often MyISAM, and the plugin removes child rows in PHP (see [Cleanup](/database/models#cleanup-on-delete)).\n\n`

  for (const table of TABLES) {
    const model = TABLE_TO_MODEL[table.name]
    out += `## \`${table.name}\`\n\n`
    if (MODEL_NOTES.tables?.[table.name]) out += `${MODEL_NOTES.tables[table.name]}\n\n`
    if (MODEL_NOTES.tableNotes?.[table.name]) out += `${MODEL_NOTES.tableNotes[table.name]}\n\n`
    if (model) out += `Model: [\`${model.className}\`](/database/models/${slugify(model.className)}) · `
    out += `Source: ${src(table.file)}\n\n`
    out += `| Column | Type | Nullable | Default | Notes |\n| --- | --- | --- | --- | --- |\n`
    for (const column of table.columns) {
      const extra = [column.primary ? 'Primary key' : '', column.autoIncrement ? 'auto increment' : ''].filter(Boolean).join(', ')
      out += `| \`${column.name}\` | \`${column.type}\` | ${column.nullable ? 'Yes' : 'No'} | ${column.default === null ? '—' : `\`${column.default}\``} | ${cell([extra, column.comment].filter(Boolean).join('. '))} |\n`
    }
    out += `\n**Indexes**\n\n| Name | Columns | Unique |\n| --- | --- | --- |\n`
    for (const index of table.indexes) {
      out += `| \`${index.name}\` | ${index.columns.map(code).join(', ')} | ${index.unique ? 'Yes' : 'No'} |\n`
    }
    out += '\n'
  }

  write(join(DOCS, 'database', 'schema.md'), out)
}

function columnsFor(model) {
  const table = TABLES.find((t) => t.name === model.table)
  return table ? table.columns : []
}

function modelPage(model) {
  const notes = MODEL_NOTES.models?.[model.className] || {}
  const columns = columnsFor(model)
  const isWpTable = !model.table?.startsWith('fe_')

  let out = frontmatter({ title: `${model.className} Model`, description: notes.summary || `ORM reference for FluentEvent\\App\\Models\\${model.className}.` })
  out += `# ${model.className} Model\n\n`
  out += `${notes.summary || ''}\n\n`
  if (notes.notes) out += `${notes.notes}\n\n`

  out += `## Class\n\n`
  out += `- **Class:** \`FluentEvent\\App\\Models\\${model.className}\`\n`
  out += `- **Table:** \`${isWpTable ? 'wp_' : '{prefix}'}${model.table}\`\n`
  out += `- **Primary key:** \`${model.primaryKey}\`\n`
  out += `- **Extends:** \`${model.extends}\`\n`
  if (!model.timestamps) out += `- **Timestamps:** off (\`$timestamps = false\`)\n`
  if (model.globalScopes.length) out += `- **Global scopes:** ${model.globalScopes.map(code).join(', ')}\n`
  if (model.bootEvents.length) out += `- **Model events:** ${model.bootEvents.map(code).join(', ')} (registered in \`booted()\`)\n`
  out += `- **Source:** ${src(model.file)}\n\n`

  if (columns.length) {
    out += `## Attributes\n\n| Column | Type | Cast | Fillable | Description |\n| --- | --- | --- | --- | --- |\n`
    for (const column of columns) {
      const desc = notes.columns?.[column.name] || column.comment || ''
      out += `| \`${column.name}\` | \`${column.type}\` | ${model.casts[column.name] ? code(model.casts[column.name]) : '—'} | ${model.fillable.includes(column.name) ? 'Yes' : 'No'} | ${cell(desc)} |\n`
    }
    out += '\n'
  } else if (model.fillable.length) {
    out += `## Fillable\n\n${model.fillable.map(code).join(', ')}\n\n`
  }

  if (model.fillable.length) {
    const notFillable = columns.map((c) => c.name).filter((c) => !model.fillable.includes(c) && !['id', 'created_at', 'updated_at'].includes(c))
    if (notFillable.length) {
      out += `::: info Mass assignment\nOnly the columns marked *Fillable* can be set through \`create()\` or \`fill()\`. ${notFillable.map(code).join(', ')} ${notFillable.length === 1 ? 'is' : 'are'} not fillable${notes.notFillable ? ': ' + notes.notFillable : '.'}\n:::\n\n`
    }
  }

  if (model.appends.length || model.accessors.length) {
    out += `## Computed Attributes\n\n| Attribute | Appended to JSON | Description |\n| --- | --- | --- |\n`
    for (const accessor of model.accessors) {
      const desc = notes.accessors?.[accessor.name] || accessor.comment || ''
      out += `| \`${accessor.name}\` | ${model.appends.includes(accessor.name) ? 'Yes' : 'No'} | ${cell(desc)} |\n`
    }
    out += '\n'
  }

  if (model.hidden.length) {
    out += `Hidden from JSON: ${model.hidden.map(code).join(', ')}.\n\n`
  }

  if (notes.meta) {
    out += `## The \`${notes.metaColumn || 'meta'}\` Column\n\n${notes.meta}\n\n`
  }

  const constEntries = Object.entries(model.consts)
  if (constEntries.length) {
    out += `## Constants\n\n| Constant | Value | Meaning |\n| --- | --- | --- |\n`
    for (const [name, value] of constEntries) {
      out += `| \`${model.className}::${name}\` | ${code(JSON.stringify(value))} | ${cell(notes.consts?.[name] || '')} |\n`
    }
    out += '\n'
  }

  if (model.relationships.length) {
    out += `## Relationships\n\n| Method | Type | Related Model | Keys |\n| --- | --- | --- | --- |\n`
    for (const rel of model.relationships) {
      const target = MODELS.find((m) => m.className === rel.target)
      const keys = [rel.foreignKey, rel.ownerKey].filter(Boolean).map(code).join(' → ')
      out += `| \`${rel.name}()\` | \`${rel.type}\` | ${target ? `[${rel.target}](/database/models/${slugify(rel.target)})` : rel.target} | ${keys || '—'} |\n`
    }
    out += '\n'
  }

  if (model.scopes.length) {
    out += `## Scopes\n\n| Scope | Parameters | Description |\n| --- | --- | --- |\n`
    for (const scope of model.scopes) {
      const desc = notes.scopes?.[scope.name] || scope.comment || ''
      out += `| \`${scope.name}()\` | ${scope.params.map(code).join(', ') || '—'} | ${cell(desc)} |\n`
    }
    out += '\n'
  }

  const methods = model.methods.filter((m) => !notes.hideMethods?.includes(m.name))
  if (methods.length) {
    out += `## Methods\n\n| Method | Description |\n| --- | --- |\n`
    for (const method of methods) {
      const desc = notes.methods?.[method.name] || method.comment || ''
      out += `| \`${method.isStatic ? '::' : '->'}${method.name}(${method.params})\` | ${cell(desc)} |\n`
    }
    out += '\n'
  }

  out += `## Usage\n\n\`\`\`php\n${notes.example || defaultModelExample(model)}\n\`\`\`\n`

  write(join(DOCS, 'database', 'models', `${slugify(model.className)}.md`), out)
}

function defaultModelExample(model) {
  return `use FluentEvent\\App\\Models\\${model.className};\n\n$rows = ${model.className}::query()->limit(10)->get();`
}

function modelsOverviewPage() {
  let out = frontmatter({ title: 'Models', description: 'The FluentEvent ORM models, what each one maps to, and the rules every model follows.' })
  out += `# Models\n\n`
  out += `FluentEvent ships ${MODELS.length} models in \`app/Models/\`. They extend \`FluentEvent\\App\\Models\\Model\`, which extends the WPFluent ORM model (an Eloquent-style query builder over \`$wpdb\`). Load them only after FluentEvent has booted, for example inside \`fluent_event/loaded\` or any later hook.\n\n`
  out += `| Model | Table | Fillable columns | Description |\n| --- | --- | --- | --- |\n`
  for (const model of MODELS) {
    const notes = MODEL_NOTES.models?.[model.className] || {}
    out += `| [\`${model.className}\`](/database/models/${slugify(model.className)}) | \`${model.table}\` | ${model.fillable.length || '—'} | ${cell(notes.summary || '')} |\n`
  }
  out += `\n${MODEL_NOTES.overview || ''}\n`
  write(join(DOCS, 'database', 'models.md'), out)
}

function queryBuilderPage() {
  write(join(DOCS, 'database', 'query-builder.md'), frontmatter({ title: 'Query Builder', description: 'Query FluentEvent data with the WPFluent ORM: scopes, eager loading, pagination and the DB facade.' }) + MODEL_NOTES.queryBuilder)
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

const HOOK_DATA = source.hooks()

function paramFromArg(arg, index) {
  const text = arg.trim()
  let m
  if ((m = text.match(/^&?\$this->(\w+)$/))) return `$${m[1]}`
  if ((m = text.match(/^&?\$(\w+)$/))) return `$${m[1]}`
  if ((m = text.match(/^\$(\w+)->all\(\)$/))) return `$${m[1]}`
  if ((m = text.match(/\['(\w+)'\]$/))) return `$${m[1]}`
  if ((m = text.match(/^(?:\(\w+\)\s*)?\$(\w+)/))) return `$${m[1]}`
  if (/^\w+\(\)$/.test(text)) return `$${camel(snake(text.replace('()', '')).replace(/_/g, '-'))}`
  return `$arg${index + 1}`
}

function buildHooks() {
  const byName = new Map()

  const entry = (name, kind) => {
    if (!byName.has(name)) {
      byName.set(name, { name, kind, callSites: [], scheduled: [], listeners: [] })
    }
    return byName.get(name)
  }

  for (const site of HOOK_DATA.callSites) entry(site.name, site.kind).callSites.push(site)
  for (const site of HOOK_DATA.scheduled) entry(site.name, 'action').scheduled.push(site)
  for (const listener of HOOK_DATA.listeners) {
    if (byName.has(listener.name)) byName.get(listener.name).listeners.push(listener)
  }

  for (const hook of byName.values()) {
    const notes = HOOK_NOTES[hook.name] || {}
    const richest = [...hook.callSites].sort((a, b) => b.args.length - a.args.length)[0]
    const documented = hook.callSites.find((s) => s.docblock.params.length)?.docblock

    if (notes.params) {
      hook.params = notes.params
    } else if (richest) {
      hook.params = richest.args.map((arg, i) => {
        const doc = documented?.params[i]
        const name = doc?.name || paramFromArg(arg, i)
        return { name, type: doc?.type || TYPE_HINTS[name] || 'mixed', desc: doc?.desc || '' }
      })
    } else {
      hook.params = []
    }

    hook.byRef = hook.callSites.some((s) => s.byRef)
    hook.summary = notes.summary || documented?.summary || ''
    hook.notes = notes.notes || ''
    hook.example = notes.example || ''
    hook.page = HOOK_PAGES.find((p) => p.test(hook.name)).key
    hook.isScheduled = !hook.callSites.length && hook.scheduled.length > 0

    if (!notes.summary) warnings.push(`hook-notes: no summary for ${hook.name}`)
  }

  for (const key of Object.keys(HOOK_NOTES).filter((k) => !k.startsWith('__'))) {
    if (!byName.has(key)) warnings.push(`hook-notes: "${key}" matches no hook in the source`)
  }

  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name))
}

const HOOKS = buildHooks()

function hookLink(name) {
  const hook = HOOKS.find((h) => h.name === name)
  if (!hook) return code(name)
  return `[\`${name}\`](/hooks/${hook.kind === 'action' ? 'actions' : 'filters'}/${hook.page}#${anchorFor(name)})`
}

function linkHooksInProse(text) {
  // `fluent_event/x` written in prose becomes a link to its section.
  return text.replace(/(?<!\[)`(fluent_event\/[\w/{}]+)`(?!\])/g, (match, name) => (HOOKS.some((h) => h.name === name) ? hookLink(name) : match))
}

function hookExample(hook) {
  if (hook.example) return hook.example
  const params = hook.params.map((p) => p.name).join(', ')
  const count = hook.params.length || 1
  if (hook.kind === 'filter') {
    return `add_filter('${hook.name}', function (${params}) {\n    // Change and return the first argument.\n    return ${hook.params[0]?.name || '$value'};\n}, 10, ${count});`
  }
  return `add_action('${hook.name}', function (${params}) {\n    // Your code here.\n}, 10, ${count});`
}

function hookSection(hook) {
  let out = `<a id="${anchorFor(hook.name)}"></a>\n\n## \`${hook.name}\`\n\n`
  const type = hook.isScheduled ? 'action (run by Action Scheduler)' : hook.kind
  out += `- **Type:** ${type}\n`
  if (hook.byRef) out += `- **Passed by reference:** yes (\`do_action_ref_array\`)\n`
  out += `- **${hook.isScheduled ? 'Scheduled from' : 'Call sites'}:** ${hook.isScheduled ? hook.scheduled.length : hook.callSites.length}\n`
  if (hook.summary) out += `- **When it fires:** ${linkHooksInProse(hook.summary)}\n`
  out += '\n'

  if (hook.notes) out += `${linkHooksInProse(hook.notes)}\n\n`

  if (hook.params.length) {
    out += `### Parameters\n\n| # | Name | Type | Description |\n| --- | --- | --- | --- |\n`
    hook.params.forEach((p, i) => {
      out += `| ${i + 1} | \`${p.name}\` | \`${shortType(p.type)}\` | ${cell(linkHooksInProse(p.desc || ''))} |\n`
    })
    out += '\n'
  }

  if (hook.kind === 'filter' && hook.params[0]) {
    out += `**Return:** \`${shortType(hook.params[0].type)}\` — the filtered ${hook.params[0].name.replace('$', '')}.\n\n`
  }

  if (hook.callSites.length) {
    out += `### Call Sites\n\n| Source | Context | Arguments |\n| --- | --- | --- |\n`
    for (const site of hook.callSites) {
      out += `| ${src(site.file, site.line)} | ${site.context ? code(site.context) : '—'} | ${site.args.length ? cell(site.args.map(code).join(', ')) : '—'} |\n`
    }
    out += '\n'
  }

  if (hook.scheduled.length) {
    out += `### Scheduled From\n\nAction Scheduler runs this hook in the \`fluent-event\` group. These are the places that queue it:\n\n| Source | Context | When | Arguments |\n| --- | --- | --- | --- |\n`
    for (const site of hook.scheduled) {
      out += `| ${src(site.file, site.line)} | ${site.context ? code(site.context) : '—'} | ${code(site.when)} | ${code(site.args)} |\n`
    }
    out += '\n'
  }

  if (hook.listeners.length) {
    out += `### Listeners Inside FluentEvent\n\nFluentEvent itself listens to this hook. Use a priority below or above these to run before or after them.\n\n| Priority | Handler | Source |\n| --- | --- | --- |\n`
    for (const listener of hook.listeners) {
      out += `| ${listener.priority} | ${code(listener.handler)} | ${src(listener.file, listener.line)} |\n`
    }
    out += '\n'
  }

  out += `### Example\n\n\`\`\`php\n${hookExample(hook)}\n\`\`\`\n\n`
  return out
}

function hookPages() {
  const order = { action: [], filter: [] }

  for (const kind of ['action', 'filter']) {
    const segment = kind === 'action' ? 'actions' : 'filters'
    const label = kind === 'action' ? 'Actions' : 'Filters'

    for (const page of HOOK_PAGES) {
      const hooks = HOOKS.filter((h) => h.kind === kind && h.page === page.key)
      if (!hooks.length) continue
      order[kind].push(page.key)

      const callSites = hooks.reduce((sum, h) => sum + h.callSites.length, 0)
      let out = frontmatter({ title: `${page.title} ${label}`, description: `${page.title} ${kind} hooks in FluentEvent.` })
      out += `# ${page.title} ${label}\n\n`
      out += `${hooks.length} ${kind} hook${hooks.length === 1 ? '' : 's'} on this page${callSites ? `, across ${callSites} call site${callSites === 1 ? '' : 's'}` : ''}.\n\n`
      out += `| Hook | ${kind === 'action' ? 'Fires' : 'Filters'} | Call Sites |\n| --- | --- | --- |\n`
      for (const hook of hooks) {
        out += `| [\`${hook.name}\`](#${anchorFor(hook.name)}) | ${cell(hook.summary)} | ${hook.isScheduled ? `${hook.scheduled.length} (scheduled)` : hook.callSites.length} |\n`
      }
      out += '\n'
      for (const hook of hooks) out += hookSection(hook)
      write(join(DOCS, 'hooks', segment, `${page.key}.md`), out)
    }

    const all = HOOKS.filter((h) => h.kind === kind)
    let index = frontmatter({ title: `${label} Hooks`, description: `Every FluentEvent ${kind} hook, grouped by area.` })
    index += `# ${label} Hooks\n\n`
    index += kind === 'action'
      ? `Actions let your code run when something happens in FluentEvent: an event is created, a guest registers, a reminder batch goes out. FluentEvent has ${all.length} action hooks. ${all.filter((h) => h.isScheduled).length} of them are run by Action Scheduler rather than by a \`do_action()\` call.\n\n`
      : `Filters let your code change a value before FluentEvent uses it: an API response, a length limit, a route path. FluentEvent has ${all.length} filter hooks. Always return a value of the same type you receive.\n\n`
    index += `Every hook name starts with \`fluent_event/\`. Nouns and verbs are separated by \`/\`: \`fluent_event/<noun>/<verb>\` for lifecycle actions, \`fluent_event/<noun>_api_response\` for response filters.\n\n`
    index += `## Pages\n\n| Page | Hooks |\n| --- | --- |\n`
    for (const key of order[kind]) {
      const page = HOOK_PAGES.find((p) => p.key === key)
      index += `| [${page.title}](/hooks/${segment}/${key}) | ${all.filter((h) => h.page === key).length} |\n`
    }
    index += `\n## All ${label}\n\n| Hook | Page | Description |\n| --- | --- | --- |\n`
    for (const hook of all) {
      const page = HOOK_PAGES.find((p) => p.key === hook.page)
      index += `| ${hookLink(hook.name)} | ${page.title} | ${cell(hook.summary)} |\n`
    }
    index += `\n${HOOK_NOTES.__intro?.[kind] || ''}\n`
    write(join(DOCS, 'hooks', segment, 'index.md'), index)
  }

  writeJson(join(GENERATED_DIR, 'hook-page-order.json'), order)
  writeJson(join(GENERATED_DIR, 'hook-page-labels.json'), Object.fromEntries(HOOK_PAGES.map((p) => [p.key, p.title])))
}

// ---------------------------------------------------------------------------
// REST API
// ---------------------------------------------------------------------------

const RESPONSE_EXAMPLES = loadJson(join(ROOT, 'data', 'response-examples.json'))
const MANUAL_EXAMPLES = loadJson(join(ROOT, 'data', 'manual-examples.json'))

function exampleFor(moduleKey, slug) {
  const live = RESPONSE_EXAMPLES.modules?.[moduleKey]?.[slug]
  if (live) return { ...live, origin: 'live' }
  const manual = MANUAL_EXAMPLES.modules?.[moduleKey]?.[slug]
  if (manual) return { ...manual, origin: 'manual' }
  return null
}

function schemaFromExample(value) {
  if (value === null || value === undefined) return { nullable: true }
  if (Array.isArray(value)) {
    const objects = value.filter((v) => v && typeof v === 'object' && !Array.isArray(v))
    if (objects.length) {
      return { type: 'array', items: schemaFromExample(Object.assign({}, ...objects.slice(0, 3).reverse())) }
    }
    return { type: 'array', items: value.length ? schemaFromExample(value[0]) : {} }
  }
  if (typeof value === 'object') {
    return { type: 'object', properties: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, schemaFromExample(v)])) }
  }
  if (typeof value === 'boolean') return { type: 'boolean' }
  if (typeof value === 'number') return { type: Number.isInteger(value) ? 'integer' : 'number' }
  return { type: 'string' }
}

const SANITIZER_TYPES = {
  intval: { type: 'integer' },
  absint: { type: 'integer', minimum: 0 },
  rest_sanitize_boolean: { type: 'boolean' },
  sanitize_email: { type: 'string', format: 'email' },
  web_url: { type: 'string', format: 'uri' },
  sanitize_hex_color: { type: 'string' },
}

/** One field's OpenAPI schema from its validation tokens and sanitizer. */
function fieldSchema(field) {
  const tokens = field.rule || []
  const schema = { ...(SANITIZER_TYPES[field.sanitizer] || {}) }
  const notes = []

  for (const token of tokens) {
    const [name, arg = ''] = token.split(/:(.*)/s)
    switch (name) {
      case 'string': schema.type ??= 'string'; break
      case 'integer': case 'int': case 'numeric': schema.type = 'integer'; break
      case 'array': schema.type = 'array'; break
      case 'boolean': schema.type = 'boolean'; break
      case 'email': schema.type = 'string'; schema.format = 'email'; break
      case 'url': schema.type = 'string'; schema.format = 'uri'; break
      case 'in': if (!arg.includes('?')) schema.enum = arg.split(','); break
      case 'max':
        if (arg === '?' || arg === '') notes.push('The length limit is filterable.')
        else if (schema.type === 'array') schema.maxItems = Number(arg)
        else if (schema.type === 'integer') schema.maximum = Number(arg)
        else schema.maxLength = Number(arg)
        break
      case 'min': schema.type === 'integer' ? (schema.minimum = Number(arg)) : (schema.minLength = Number(arg)); break
      case 'regex': schema.pattern = arg.replace(/^\/|\/[a-z]*$/g, ''); break
      case 'alphadash': schema.pattern = '^[A-Za-z0-9_-]+$'; break
      case 'nullable': schema.nullable = true; break
      case 'exists': notes.push(`Must exist in \`${arg.split(',')[0]}.${arg.split(',')[1] || 'id'}\`.`); break
      case 'unique': {
        const [table, column] = arg.split(',')
        notes.push(arg.includes('event_id') ? `Unique per event in \`${table}.${column}\`.` : `Must be unique in \`${table}.${column}\`.`)
        break
      }
      default: break
    }
  }

  if (field.enum) schema.enum = field.enum
  if (field.default !== undefined && typeof field.default !== 'object') schema.default = field.default
  if (field.perPage) {
    schema.type = 'integer'
    schema.minimum = 1
    if (field.perPage.max) schema.maximum = field.perPage.max
    if (field.perPage.default) schema.default = field.perPage.default
  }
  if (field.sanitizer === 'markdown') notes.push('The server converts the Markdown to HTML for the post body.')
  if (!schema.type) schema.type = 'string'
  if (schema.type === 'array' && !schema.items) schema.items = {}

  return { schema, notes, required: tokens.includes('required') && !tokens.includes('sometimes'), sometimes: tokens.includes('sometimes') }
}

/** Turns dotted field names (`reminder_to_guest.times.*.unit`) into a nested object schema. */
function nestFields(fields) {
  const root = { type: 'object', properties: {}, required: [] }

  for (const [name, field] of Object.entries(fields)) {
    const parts = name.split('.')
    let node = root
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const last = i === parts.length - 1

      if (part === '*') {
        node.type = 'array'
        node.items ??= { type: 'object', properties: {}, required: [] }
        node = node.items
        if (last) Object.assign(node, field.schema)
        continue
      }

      node.type = node.type === 'array' ? 'array' : 'object'
      if (node.type === 'array') {
        node.items ??= { type: 'object', properties: {}, required: [] }
        node = node.items
      }
      node.properties ??= {}
      node.required ??= []
      if (last) {
        node.properties[part] = { ...(node.properties[part] || {}), ...field.schema, ...(node.properties[part]?.properties ? { properties: node.properties[part].properties } : {}), ...(node.properties[part]?.items ? { items: node.properties[part].items } : {}) }
        if (field.description) node.properties[part].description = field.description
        if (field.required && !node.required.includes(part)) node.required.push(part)
      } else {
        node.properties[part] ??= { type: 'object', properties: {}, required: [] }
        node = node.properties[part]
      }
    }
  }

  const tidy = (node) => {
    if (!node || typeof node !== 'object') return node
    if (node.required && !node.required.length) delete node.required
    if (node.properties) {
      if (!Object.keys(node.properties).length) delete node.properties
      else Object.values(node.properties).forEach(tidy)
    }
    if (node.items) tidy(node.items)
    if (node.type === 'array' && node.items?.type === 'object' && !node.items.properties) node.items = {}
    return node
  }
  return tidy(root)
}

function sampleValue(name, schema) {
  if (schema.enum) return schema.enum[0]
  if (schema.default !== undefined) return schema.default
  if (schema.type === 'integer') return /id$/.test(name) ? 12 : 1
  if (schema.type === 'boolean') return true
  if (schema.format === 'email') return 'maya.chen@example.com'
  if (schema.format === 'uri') return 'https://example.com'
  if (schema.type === 'array') return []
  return 'string'
}

function operationsFor() {
  const routes = source.routes()
  const operations = []

  for (const route of routes) {
    const module = MODULE_BY_CONTROLLER[route.controller]
    if (!module) {
      warnings.push(`route ${route.method} ${route.path}: no module for ${route.controller}`)
      continue
    }
    const key = `${route.controller}@${route.action}`
    const notes = OPERATIONS[key] || {}
    if (!OPERATIONS[key]) warnings.push(`operation-notes: no entry for ${key}`)

    const slug = notes.slug || slugify(route.action)
    const title = notes.title || titleCase(route.action)
    const { fields, method } = source.actionInputs(route.controller, route.action)
    const policy = source.policy(route.policy, route.action)
    const pathParams = [...route.path.matchAll(/\{(\w+)\}/g)].map((m) => m[1])
    const isRead = route.method === 'GET'
    const inQuery = isRead || route.method === 'DELETE'
    const overrides = notes.params || {}

    const query = []
    const bodyFields = {}

    const allFields = { ...fields }
    for (const [name, override] of Object.entries(overrides)) {
      if (override === false) {
        delete allFields[name]
        continue
      }
      if (!allFields[name]) allFields[name] = {}
    }

    for (const [name, field] of Object.entries(allFields)) {
      if (pathParams.includes(name)) continue
      const override = overrides[name] || {}
      const base = fieldSchema(field)
      const schema = { ...base.schema, ...(override.schema || {}) }
      if (override.enum) schema.enum = override.enum
      if (override.type) schema.type = override.type
      const description = [override.desc || PARAM_NOTES[name] || '', ...base.notes, ...(override.notes || [])].filter(Boolean).join(' ')
      const required = override.required ?? base.required
      const location = override.in || (inQuery ? 'query' : 'body')

      if (location === 'query' && !name.includes('.')) {
        query.push({ name, in: 'query', required, description, schema })
      } else {
        bodyFields[name] = { schema, required, description }
      }
    }

    const parameters = [
      ...pathParams.map((name) => ({
        name,
        in: 'path',
        required: true,
        description: overrides[name]?.desc || PARAM_NOTES[name] || '',
        schema: route.constraints[name] === 'int' ? { type: 'integer', minimum: 1 } : { type: 'string', pattern: '^[A-Za-z0-9_-]+$' },
      })),
      ...query,
    ]

    operations.push({
      key,
      route,
      module,
      slug,
      title,
      operationId: camel(slug),
      summary: notes.summary || `${title}.`,
      notes: notes.notes || '',
      errors: notes.errors || [],
      policy,
      method,
      parameters,
      body: Object.keys(bodyFields).length ? nestFields(bodyFields) : null,
      bodyFields,
      example: exampleFor(module.key, slug),
      isPublic: route.policy === 'PortalPolicy' || route.policy === 'CommunityPolicy',
    })
  }

  for (const key of Object.keys(OPERATIONS).filter((k) => !k.startsWith('__'))) {
    if (!routes.some((r) => `${r.controller}@${r.action}` === key)) warnings.push(`operation-notes: "${key}" matches no route`)
  }

  return operations
}

// The per-minute limit a controller action enforces with RateLimiter::isSpamming('action', count).
function rateLimit(op) {
  const m = (op.method?.body || '').match(/RateLimiter::isSpamming\(\s*'(\w+)'\s*,\s*(\d+)\s*\)/)
  return m ? { action: m[1], count: Number(m[2]) } : null
}

function policyText(op) {
  const id = `${op.policy.name}::${op.policy.method}`
  const text = POLICY_NOTES[id]
  if (!text) warnings.push(`operation-notes: no POLICY_NOTES entry for ${id}`)
  return text || `Checked by \`${id}\`.`
}

function openApiSpec(op) {
  const { route } = op
  const responses = {}
  const example = op.example

  responses['200'] = {
    description: 'Success',
    content: {
      'application/json': {
        schema: example?.response !== undefined ? schemaFromExample(example.response) : { type: 'object' },
        ...(example?.response !== undefined ? { example: example.response } : {}),
      },
    },
  }

  const errorStatuses = new Map()
  if (op.policy.name === 'Policy') errorStatuses.set('403', 'The current user does not have the `manage_options` capability, or the nonce is missing.')
  if (Object.keys(op.bodyFields).length || /validate\(/.test(op.method?.body || '')) errorStatuses.set('422', 'Validation failed. `errors` holds one object per failing field.')
  if (/findOrFail\(/.test(op.method?.body || '') || /->find(?:OrFail)?\(\$id\)/.test(op.method?.body || '')) errorStatuses.set('404', 'No record with that ID.')
  const limit = rateLimit(op)
  if (limit) errorStatuses.set('429', `More than ${limit.count} requests in one minute from this account or IP.`)
  for (const error of op.errors) errorStatuses.set(String(error.status), error.when)

  for (const [status, description] of errorStatuses) {
    responses[status] = {
      description,
      content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, errors: { type: 'object' } } } } },
    }
  }

  const operation = {
    operationId: op.operationId,
    summary: op.title,
    description: `${op.summary}\n\nController: \`${op.key}\`\nRoute source: \`${PLUGIN_SLUG}/${route.file}:${route.line}\``,
    tags: [op.module.title],
    parameters: op.parameters.map((p) => {
      const exampleQuery = example?.query?.[p.name]
      return { ...p, ...(exampleQuery !== undefined ? { example: exampleQuery } : {}) }
    }),
    responses,
  }

  if (op.isPublic) operation.security = op.policy.name === 'PortalPolicy' ? [] : [{ cookieAuth: [] }]

  if (op.body) {
    const bodyExample = example?.requestBody || Object.fromEntries(
      Object.entries(op.bodyFields)
        .filter(([name, f]) => f.required && !name.includes('.'))
        .map(([name, f]) => [name, sampleValue(name, f.schema)]),
    )
    operation.requestBody = {
      required: Object.values(op.bodyFields).some((f) => f.required),
      content: { 'application/json': { schema: op.body, example: bodyExample } },
    }
  }

  return {
    openapi: '3.0.4',
    info: {
      title: 'FluentEvent API',
      description: 'REST API for FluentEvent, the WordPress events plugin by WPManageNinja.',
      version: META.version,
    },
    servers: [
      {
        url: `https://{website}/wp-json/${META.namespace}`,
        description: 'Your WordPress site',
        variables: { website: { default: 'yourwebsite.com', description: 'Your WordPress site domain, without https://' } },
      },
    ],
    components: {
      securitySchemes: {
        ApplicationPasswords: { type: 'http', scheme: 'basic', description: 'A WordPress username and an Application Password.' },
        cookieAuth: { type: 'apiKey', in: 'header', name: 'X-WP-Nonce', description: 'Logged-in cookie plus a `wp_rest` nonce. The browser sends the cookie.' },
      },
    },
    security: [{ ApplicationPasswords: [] }],
    paths: { [route.path]: { [route.method.toLowerCase()]: operation } },
  }
}

function provenance(example) {
  if (!example) {
    return `::: info Sample\nNo response has been recorded for this endpoint yet, so the response below shows the shape only.\n:::\n\n`
  }
  if (example.origin === 'live') {
    return `::: tip Live sample\nThe request and response below were recorded on a running FluentEvent site and then anonymised. Names, emails and event titles are fictional, and long lists are cut to a few items.\n:::\n\n`
  }
  return `::: info Reconstructed sample\nThis response was written by hand from the controller code${example.reason ? `, because ${example.reason}` : ''}. The field names match the code; the values are illustrative.\n:::\n\n`
}

function operationPage(op) {
  const { route } = op
  let out = frontmatter({ title: op.title, description: op.summary, outline: false, aside: false })
  out += `# ${op.title}\n\n${op.summary}\n\n`
  if (op.notes) out += `${linkHooksInProse(op.notes)}\n\n`
  out += `## Endpoint\n\n`
  out += `- **Method:** \`${route.method}\`\n`
  out += `- **Path:** \`/${META.namespace}${route.path}\`\n`
  out += `- **Controller:** \`${op.key}\`\n`
  out += `- **Route source:** ${src(route.file, route.line)}\n`
  if (op.method) out += `- **Controller source:** ${src(op.method.file, op.method.line)}\n`
  out += `\n## Permissions\n\n- ${policyText(op)}\n`
  const limit = rateLimit(op)
  if (limit) out += `- Rate limit: ${limit.count} requests per minute, counted per account for a logged-in user and per IP address for a visitor (\`RateLimiter::isSpamming('${limit.action}')\`). Actions that share a counter name share the limit across every event.\n`
  out += '\n'

  const hooks = HOOKS.filter((h) => h.callSites.some((s) => s.file === op.method?.file && s.line >= op.method.line && s.line <= op.method.line + op.method.body.split('\n').length))
  if (hooks.length) {
    out += `## Hooks Fired\n\n${hooks.map((h) => `- ${hookLink(h.name)}`).join('\n')}\n\n`
  }

  out += provenance(op.example)
  out += `<OAOperation operationId="${op.operationId}" specUrl="/openapi/public/${op.module.key}/${op.slug}.json" />\n`
  write(join(DOCS, 'restapi', 'operations', op.module.key, `${op.slug}.md`), out)
}

function modulePage(module, ops) {
  let out = frontmatter({ title: `${module.title} API`, description: module.description })
  out += `# ${module.title} API\n\n${module.description}\n\n`
  const policies = [...new Set(ops.map((op) => op.policy.name))]
  out += `## Authentication\n\n`
  out += policies.map((name) => `- ${POLICY_NOTES[name] || POLICY_NOTES[`${name}::verifyRequest`] || name}`).join('\n') + '\n\n'
  out += `## Endpoints\n\n| Method | Path | Operation | What it does |\n| --- | --- | --- | --- |\n`
  for (const op of ops) {
    out += `| \`${op.route.method}\` | \`${op.route.path}\` | [${op.title}](/restapi/operations/${module.key}/${op.slug}) | ${cell(op.summary)} |\n`
  }
  write(join(DOCS, 'restapi', `${module.key}.md`), out)
}

function restApi() {
  const ops = operationsFor()
  const order = {}
  const origins = { live: 0, manual: 0, none: [] }

  for (const op of ops) {
    operationPage(op)
    writeJson(join(PUBLIC_OPENAPI, op.module.key, `${op.slug}.json`), openApiSpec(op))
    ;(order[op.module.key] ||= []).push(op.slug)
    if (op.example?.origin === 'live') origins.live++
    else if (op.example?.origin === 'manual') origins.manual++
    else origins.none.push(`${op.module.key}/${op.slug}`)
  }

  for (const module of MODULES) {
    const moduleOps = ops.filter((op) => op.module.key === module.key)
    if (moduleOps.length) modulePage(module, moduleOps)
  }

  // Overview
  let out = frontmatter({ title: 'REST API', description: `Authentication, conventions and the full endpoint list for the FluentEvent REST API (${META.namespace}).` })
  out += OPERATIONS.__overview
    .replace(/\{namespace\}/g, META.namespace)
    .replace(/\{count\}/g, String(ops.length))
  out += `\n\n## Endpoints\n\n`
  for (const group of [...new Set(MODULES.map((m) => m.group))]) {
    out += `### ${group}\n\n| Method | Path | Operation |\n| --- | --- | --- |\n`
    for (const module of MODULES.filter((m) => m.group === group)) {
      for (const op of ops.filter((o) => o.module.key === module.key)) {
        out += `| \`${op.route.method}\` | \`${op.route.path}\` | [${op.title}](/restapi/operations/${module.key}/${op.slug}) |\n`
      }
    }
    out += '\n'
  }
  write(join(DOCS, 'restapi', 'index.md'), out)

  writeJson(join(GENERATED_DIR, 'restapi-module-order.json'), order)
  writeJson(join(GENERATED_DIR, 'restapi-modules.json'), MODULES.map(({ key, title, group }) => ({ key, title, group })))

  return { ops, origins }
}

// ---------------------------------------------------------------------------
// Landing + getting started
// ---------------------------------------------------------------------------

function landingPages(ops) {
  const actions = HOOKS.filter((h) => h.kind === 'action').length
  const filters = HOOKS.filter((h) => h.kind === 'filter').length
  const stats = { tables: TABLES.length, models: MODELS.length, routes: ops.length, hooks: HOOKS.length }

  write(
    join(DOCS, 'index.md'),
    frontmatter({ title: 'FluentEvent Developer Docs', description: 'Database schema, models, hooks and the REST API for FluentEvent, the WordPress events plugin.', layout: 'page', sidebar: false, aside: false, prev: false, next: false, editLink: false, pageClass: 'docs-home' }) +
      `<DocsHome :stats="${JSON.stringify(stats).replace(/"/g, "'")}" />\n`,
  )

  let out = frontmatter({ title: 'Getting Started', description: 'How FluentEvent is built, where its code lives, and how to extend it.' })
  out += `# Getting Started\n\n`
  out += `FluentEvent is a WordPress events plugin: **calendars hold events, and events collect guests.** It is built on the WPFluent framework, the same base as the other Fluent plugins. This site is generated from FluentEvent ${META.version} source, so the routes, hooks, tables and models here match the code.\n\n`
  out += `## At a Glance\n\n| | |\n| --- | --- |\n`
  out += `| Plugin version | \`${META.version}\` (\`FLUENT_EVENT_PLUGIN_VERSION\`) |\n`
  out += `| Requires | WordPress ${META.requiresWp}+, PHP ${META.requiresPhp}+ |\n`
  out += `| PHP namespace | \`FluentEvent\\\\\` |\n`
  out += `| REST namespace | \`${META.namespace}\` |\n`
  out += `| Hook prefix | \`fluent_event/\` |\n`
  out += `| Text domain | \`fluent-event\` |\n`
  out += `| Database tables | ${TABLES.length}, prefixed \`fe_\` |\n`
  out += `| Post type | \`fe_event\` |\n`
  out += `| REST endpoints | ${ops.length} |\n`
  out += `| Hooks | ${actions} actions, ${filters} filters |\n\n`
  out += readFileSync(join(ROOT, 'data', 'getting-started.md'), 'utf8')
  write(join(DOCS, 'getting-started.md'), out)
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

schemaPage()
modelsOverviewPage()
queryBuilderPage()
for (const model of MODELS) modelPage(model)
writeJson(
  join(GENERATED_DIR, 'database-model-order.json'),
  [{ text: 'Models', items: MODELS.map((m) => ({ text: m.className, link: `/database/models/${slugify(m.className)}` })) }],
)

for (const key of Object.keys(MODEL_NOTES.models || {})) {
  if (!MODELS.some((m) => m.className === key)) warnings.push(`model-notes: "${key}" matches no model`)
}

hookPages()
const { ops, origins } = restApi()
landingPages(ops)

const hookProse = HOOKS.filter((h) => HOOK_NOTES[h.name]?.summary).length
const opProse = ops.filter((op) => OPERATIONS[op.key]?.summary).length

console.log(`FluentEvent ${META.version} — ${TABLES.length} tables, ${MODELS.length} models, ${ops.length} routes, ${HOOKS.length} hooks`)
console.log(`Prose: hooks ${hookProse}/${HOOKS.length}, operations ${opProse}/${ops.length}`)
console.log(`Samples: ${origins.live} live, ${origins.manual} manual, ${origins.none.length} none`)
if (origins.none.length) console.log(`  no sample: ${origins.none.join(', ')}`)
for (const warning of warnings) console.warn(`warning: ${warning}`)
