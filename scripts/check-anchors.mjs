#!/usr/bin/env node
/**
 * VitePress fails the build on a link to a missing page, but not on a link to a
 * missing `#anchor`. This walks the built site and checks every internal hash link.
 * Run after `docs:build`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const DIST = new URL('../.vitepress/dist', import.meta.url).pathname
if (!existsSync(DIST)) {
  console.error('Build the site first: npm run docs:build')
  process.exit(1)
}

const pages = new Map()
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full)
    else if (entry.endsWith('.html')) {
      const route = '/' + relative(DIST, full).replace(/index\.html$/, '').replace(/\.html$/, '')
      pages.set(route, readFileSync(full, 'utf8'))
    }
  }
}
walk(DIST)

const ids = new Map([...pages].map(([route, html]) => [route, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]))
const broken = []

for (const [route, html] of pages) {
  for (const [, href] of html.matchAll(/href="([^"]*#[^"]+)"/g)) {
    if (/^(https?:|mailto:)/.test(href)) continue
    const [path, hash] = href.split('#')
    const target = path === '' ? route : path.replace(/\.html$/, '')
    const known = ids.get(target) || ids.get(target.replace(/\/$/, '')) || ids.get(target + '/')
    if (!known) broken.push(`${route} → ${href} (no page)`)
    else if (!known.has(decodeURIComponent(hash))) broken.push(`${route} → ${href}`)
  }
}

if (broken.length) {
  console.error(`${broken.length} broken anchor link(s):\n` + [...new Set(broken)].join('\n'))
  process.exit(1)
}
console.log(`Anchors OK across ${pages.size} pages.`)
