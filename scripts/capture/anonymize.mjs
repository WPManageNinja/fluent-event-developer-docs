#!/usr/bin/env node
/**
 * Turns a capture run (scripts/capture/capture.php) into data/response-examples.json.
 *
 *   node scripts/capture/anonymize.mjs <capture-dir> [data/response-examples.json]
 *
 * The sandbox already uses fictional people (Maya Chen, Jonas Weber …, all @example.com).
 * What still needs work:
 *
 * - the site's own host  → https://yourwebsite.com;
 * - the "Docs Sandbox " / "docs-sandbox-" prefixes the harness uses to find its rows;
 * - rows that were already on the site (the reports list real upcoming and top events):
 *   their titles, calendars, venues, addresses and cover images are replaced from a
 *   fixed corpus, keyed on the original so the same event keeps the same name;
 * - nonces in request bodies;
 * - long lists (cut to 3 items) and very long strings.
 *
 * After a run, scan the output for anything that looks local before committing:
 *   grep -oiE 'fluent-plugins|\.test\b|r2\.dev|sandbox' data/response-examples.json
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const [, , inputDir, outputArg] = process.argv
if (!inputDir || !existsSync(inputDir)) {
  console.error('Usage: node scripts/capture/anonymize.mjs <capture-dir> [output.json]')
  process.exit(1)
}

const OUTPUT = resolve(outputArg || new URL('../../data/response-examples.json', import.meta.url).pathname)
const PUBLIC_HOST = 'https://yourwebsite.com'
const MAX_ITEMS = 3
const MAX_STRING = 1500

const site = existsSync(join(inputDir, '_site.json')) ? JSON.parse(readFileSync(join(inputDir, '_site.json'), 'utf8')) : {}
const siteHosts = [...new Set([site.home, site.site].filter(Boolean).map((url) => url.replace(/\/+$/, '')))]

// Hosts that may stay as they are.
const ALLOWED_HOSTS = ['example.com', 'www.w3.org', 'secure.gravatar.com', 'gravatar.com', 'calendar.google.com', 'yourwebsite.com']

// Per module: what the sample request searches for once the sandbox prefix is gone.
const SEARCH_TERMS = { events: 'meetup', calendars: 'meetup', settings: 'events', users: 'example.com' }

const CORPUS = {
  eventTitle: ['Monthly Community Call', 'Founders Breakfast', 'Photography Walk', 'Open Source Sprint', 'Book Club Evening', 'Volunteer Orientation', 'Design Critique Hour', 'Wellness Workshop'],
  calendarTitle: ['Community Events', 'Workshops', 'Local Chapter', 'Member Socials'],
  venue: ['Harbor View Studio', 'Oak Street Library', 'The Commons Hall', 'Maple Room'],
  address: ['45 Harbor Road, Portland', '210 Oak Street, Madison', '9 Elm Avenue, Austin', '77 Pine Lane, Denver'],
}

// The same original always gets the same replacement; different originals get different
// ones, in first-seen order, until a list runs out and wraps.
const assigned = new Map()
function pick(list, seed) {
  const kind = String(seed).split(':')[0]
  if (!assigned.has(seed)) {
    const used = [...assigned.keys()].filter((key) => key.split(':')[0] === kind).length
    assigned.set(seed, list[used % list.length])
  }
  return assigned.get(seed)
}

function isSandbox(value) {
  return typeof value === 'string' && /docs[ -]sandbox/i.test(value)
}

function scrubString(value) {
  let out = value
  for (const host of siteHosts) {
    out = out.split(host).join(PUBLIC_HOST)
    out = out.split(encodeURIComponent(host)).join(encodeURIComponent(PUBLIC_HOST))
  }
  out = out.replace(/Docs Sandbox /g, '').replace(/docs-sandbox-/g, '').replace(/docs_sandbox_/g, '')
  // Any other host becomes example.com, keeping the path.
  out = out.replace(/https?:\/\/([a-z0-9.-]+)(?=[/"'\s?#]|$)/gi, (match, host) =>
    ALLOWED_HOSTS.some((allowed) => host === allowed || host.endsWith('.' + allowed)) ? match : 'https://example.com',
  )
  // Nonces printed into HTML (data-event-nonce="…", name="nonce" value="…").
  out = out.replace(/(nonce="?\s*(?:value=")?)[a-f0-9]{10}\b/gi, '$1a1b2c3d4e5')
  if (out.length > MAX_STRING) out = out.slice(0, MAX_STRING) + ' … (truncated)'
  return out
}

/** An event row from the site rather than the sandbox: replace what identifies it. */
function scrubLocalEvent(event) {
  // Sandbox events are fictional already; their prefix goes in scrubString().
  if (isSandbox(event.title)) return
  const seed = event.id ?? event.title
  if (typeof event.title === 'string') {
    event.title = pick(CORPUS.eventTitle, `event:${seed}`)
  }
  if (event.meta && typeof event.meta === 'object') {
    if (event.meta.venue) event.meta.venue = pick(CORPUS.venue, `venue:${seed}`)
    if (event.meta.address) event.meta.address = pick(CORPUS.address, `address:${seed}`)
    if (event.meta.cover_url) event.meta.cover_url = 'https://example.com/images/event-cover.jpg'
    if (event.meta.description_md) event.meta.description_md = 'Join us for an afternoon together.'
  }
  if (typeof event.description === 'string' && event.description) event.description = '<p>Join us for an afternoon together.</p>'
}

function scrubLocalCalendar(calendar) {
  if (typeof calendar.title === 'string' && !isSandbox(calendar.title)) {
    calendar.title = pick(CORPUS.calendarTitle, `calendar:${calendar.id ?? calendar.title}`)
  }
}

function looksLikeEvent(node) {
  return node && typeof node === 'object' && 'post_id' in node && 'calendar_id' in node && 'start_at' in node
}

function looksLikeCalendar(node, key) {
  return node && typeof node === 'object' && key === 'calendar' && 'title' in node
}

function walk(node, key = '') {
  if (Array.isArray(node)) {
    return node.slice(0, MAX_ITEMS).map((item) => walk(item, key))
  }
  if (node && typeof node === 'object') {
    if (looksLikeEvent(node)) scrubLocalEvent(node)
    if (looksLikeCalendar(node, key)) scrubLocalCalendar(node)

    // A paginator's `data` is the list; keep its totals honest about the trim.
    const out = {}
    for (const [k, v] of Object.entries(node)) {
      if (/nonce/i.test(k) && typeof v === 'string' && v !== '') {
        out[k] = 'a1b2c3d4e5'
        continue
      }
      out[k] = walk(v, k)
    }
    return out
  }
  if (typeof node === 'string') return scrubString(node)
  return node
}

function files(dir) {
  const result = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (entry.startsWith('_')) continue
    if (statSync(full).isDirectory()) result.push(...files(full))
    else if (entry.endsWith('.json')) result.push(full)
  }
  return result
}

const output = { generated: new Date().toISOString().slice(0, 10), source: 'scripts/capture', modules: {} }
let count = 0

for (const file of files(inputDir)) {
  const record = JSON.parse(readFileSync(file, 'utf8'))
  if (record.status < 200 || record.status >= 300) continue

  const [moduleKey, slug] = relative(inputDir, file).replace(/\.json$/, '').split('/')
  // The harness searches for its own prefix; show a term that matches the anonymised results.
  const rawQuery = record.query && !Array.isArray(record.query) ? { ...record.query } : {}
  if (isSandbox(rawQuery.search)) {
    if (SEARCH_TERMS[moduleKey] === undefined) delete rawQuery.search
    else rawQuery.search = SEARCH_TERMS[moduleKey]
  }
  const query = Object.keys(rawQuery).length ? walk(rawQuery) : undefined

  ;(output.modules[moduleKey] ||= {})[slug] = {
    status: record.status,
    ...(query ? { query } : {}),
    ...(record.requestBody ? { requestBody: walk(record.requestBody) } : {}),
    response: walk(record.response),
  }
  count++
}

// Sorted keys keep diffs between captures readable.
for (const moduleKey of Object.keys(output.modules)) {
  output.modules[moduleKey] = Object.fromEntries(Object.entries(output.modules[moduleKey]).sort(([a], [b]) => a.localeCompare(b)))
}
output.modules = Object.fromEntries(Object.entries(output.modules).sort(([a], [b]) => a.localeCompare(b)))

writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + '\n')

const text = JSON.stringify(output)
const leaks = [...siteHosts.map((h) => h.replace(/^https?:\/\//, '')), 'Docs Sandbox', 'docs-sandbox'].filter((needle) => text.includes(needle))
console.log(`Wrote ${count} samples to ${OUTPUT}`)
if (leaks.length) {
  console.error(`LEAK: output still contains ${leaks.join(', ')}`)
  process.exit(1)
}
