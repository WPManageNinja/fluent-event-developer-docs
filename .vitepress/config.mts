/// <reference types="node" />

import { defineConfig } from 'vitepress'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'fs'
import { dirname, join, relative } from 'path'
import { fileURLToPath } from 'url'
// One rule, one place: the card filenames the generator writes and the og:image
// URLs here have to agree, and a mismatch silently serves default.png.
// @ts-ignore -- plain JS helper, shared with scripts/generate-featured-images.mjs
import { cardNameFor } from '../scripts/lib/featured-card.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')
const generatedDir = join(projectRoot, '.generated')

function readGenerated<T>(file: string, fallback: T): T {
  const path = join(generatedDir, file)
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback
}

// Canonical origin. Changing the host should only ever mean editing this line.
const SITE_URL = 'https://dev.fluentevent.com'
const REPO_URL = 'https://github.com/WPManageNinja/fluent-event-developer-docs'

// ---------------------------------------------------------------------------
// Sidebars. The generated sections come from .generated/, written by
// scripts/generate-docs.mjs, so a new model, hook page or endpoint is linked
// without editing this file. Hand-written pages are listed here.
// ---------------------------------------------------------------------------

const MODEL_GROUPS = readGenerated<{ text: string; items: { text: string; link: string }[] }[]>('database-model-order.json', [])

const databaseSidebar = [
  {
    text: 'Database',
    items: [
      { text: 'Schema', link: '/database/schema' },
      { text: 'Models Overview', link: '/database/models' },
      { text: 'Query Builder', link: '/database/query-builder' },
    ],
  },
  ...MODEL_GROUPS,
]

const HOOK_PAGE_ORDER = readGenerated<Record<string, string[]>>('hook-page-order.json', { action: [], filter: [] })
const HOOK_PAGE_LABELS = readGenerated<Record<string, string>>('hook-page-labels.json', {})

function hookPagesFor(kind: 'action' | 'filter') {
  const segment = kind === 'action' ? 'actions' : 'filters'
  return (HOOK_PAGE_ORDER[kind] || []).map((page) => ({
    text: HOOK_PAGE_LABELS[page] || page,
    link: `/hooks/${segment}/${page}`,
  }))
}

const helperPages = [
  { text: 'Overview', link: '/helpers/' },
  { text: 'Services & Utilities', link: '/helpers/services' },
]

const hooksSidebar = [
  { text: 'Actions', collapsed: false, items: [{ text: 'Overview', link: '/hooks/actions/' }, ...hookPagesFor('action')] },
  { text: 'Filters', collapsed: false, items: [{ text: 'Overview', link: '/hooks/filters/' }, ...hookPagesFor('filter')] },
  { text: 'Helpers', collapsed: true, items: helperPages },
]

const guidePages = [
  { text: 'Guides Overview', link: '/guides/' },
  { text: 'Public Pages, Shortcodes & Blocks', link: '/guides/public-pages' },
  { text: 'Emails & Reminders', link: '/guides/emails-and-reminders' },
  { text: 'FluentCommunity Integration', link: '/guides/fluentcommunity' },
  { text: 'Code Snippets', link: '/guides/code-snippets' },
]

const MODULE_ORDER = readGenerated<Record<string, string[]>>('restapi-module-order.json', {})
const MODULES = readGenerated<{ key: string; title: string; group: string }[]>('restapi-modules.json', [])

function operationItems(moduleKey: string) {
  const dir = join(projectRoot, 'docs', 'restapi', 'operations', moduleKey)
  if (!existsSync(dir)) return []
  const order = MODULE_ORDER[moduleKey] || []

  return readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const slug = file.replace(/\.md$/, '')
      const title = (readFileSync(join(dir, file), 'utf8').match(/^title:\s*(.+)$/m)?.[1] || slug).replace(/['"]/g, '').trim()
      return { text: title, link: `/restapi/operations/${moduleKey}/${slug}`, slug }
    })
    .sort((a, b) => {
      const ia = order.indexOf(a.slug)
      const ib = order.indexOf(b.slug)
      return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib) || a.text.localeCompare(b.text)
    })
    .map(({ slug, ...item }) => item)
}

function restApiSidebar() {
  const groups = [...new Set(MODULES.map((module) => module.group))]
  return [
    { text: 'Getting Started', items: [{ text: 'API Overview', link: '/restapi/' }] },
    ...groups.map((group) => ({
      text: group,
      collapsed: false,
      items: MODULES.filter((module) => module.group === group).map((module) => {
        const items = operationItems(module.key)
        return items.length
          ? { text: module.title, link: `/restapi/${module.key}`, collapsed: true, items }
          : { text: module.title, link: `/restapi/${module.key}` }
      }),
    })),
  ]
}

// ---------------------------------------------------------------------------
// Per-page link-preview cards. scripts/generate-featured-images.mjs renders one
// 1200x630 PNG per page into public/images/featured/; a page without one falls
// back to default.png. The URL must be absolute: scrapers ignore relative ones.
// ---------------------------------------------------------------------------

const FEATURED_DIR = join(projectRoot, 'public', 'images', 'featured')

function featuredImageFor(relativePath: string): string {
  const name = cardNameFor(relativePath)
  const file = existsSync(join(FEATURED_DIR, name)) ? name : 'default.png'
  return `${SITE_URL}/images/featured/${encodeURIComponent(file)}`
}

export default defineConfig({
  srcDir: 'docs',
  title: 'FluentEvent Developer Docs',
  description: 'Database schema, models, hooks and REST API reference for FluentEvent.',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: { hostname: SITE_URL },
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/images/fluent-event-icon.png' }],
    ['meta', { name: 'theme-color', content: '#12A9B5' }],
    ['meta', { property: 'og:site_name', content: 'FluentEvent Developer Docs' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en_US' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],
  vite: {
    publicDir: join(projectRoot, 'public'),
    assetsInclude: ['**/*.json'],
    plugins: [
      {
        // The playground fetches specs from /openapi/public/<module>/<slug>.json.
        name: 'fluentevent-openapi-assets',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (!req.url?.startsWith('/openapi/public/')) {
              next()
              return
            }
            const fullPath = join(projectRoot, 'public', 'openapi', req.url.replace('/openapi/public/', '').split('?')[0])
            if (!existsSync(fullPath)) {
              next()
              return
            }
            res.setHeader('Content-Type', 'application/json')
            res.end(readFileSync(fullPath, 'utf8'))
          })
        },
        closeBundle() {
          const sourceDir = join(projectRoot, 'public', 'openapi')
          const targetDir = join(__dirname, 'dist', 'openapi', 'public')
          if (!existsSync(sourceDir)) return
          const files: string[] = []

          const copy = (from: string, to: string) => {
            if (statSync(from).isDirectory()) {
              mkdirSync(to, { recursive: true })
              for (const entry of readdirSync(from)) copy(join(from, entry), join(to, entry))
              return
            }
            if (!from.endsWith('.json')) return
            mkdirSync(dirname(to), { recursive: true })
            copyFileSync(from, to)
            files.push(`/openapi/public/${relative(sourceDir, from).replace(/\\/g, '/')}`)
          }

          copy(sourceDir, targetDir)
          writeFileSync(join(targetDir, 'manifest.json'), JSON.stringify({ files, generated: new Date().toISOString() }, null, 2))
        },
      },
    ],
  },
  markdown: {
    config(md) {
      const fence = md.renderer.rules.fence
      if (!fence) return
      md.renderer.rules.fence = (tokens, index, options, env, renderer) => {
        const token = tokens[index]
        const language = (token.info ? md.utils.unescapeAll(token.info).trim() : '').split(/\s+/g)[0]
        if (language === 'mermaid') {
          return `<Mermaid content="${md.utils.escapeHtml(token.content)}" />`
        }
        return fence(tokens, index, options, env, renderer)
      }
    },
  },
  transformPageData(pageData, { siteConfig }) {
    const path = pageData.relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')
    const url = path ? `${SITE_URL}/${path}` : `${SITE_URL}/`
    const title = pageData.frontmatter.title || pageData.title || siteConfig.site.title
    const description = pageData.frontmatter.description || pageData.description || siteConfig.site.description
    const image = featuredImageFor(pageData.relativePath)

    // Generated pages are rewritten on every run, so an edit on GitHub would be lost.
    if (/^(database|hooks|restapi)\//.test(pageData.relativePath) || pageData.relativePath === 'getting-started.md') {
      pageData.frontmatter.editLink = false
    }

    pageData.frontmatter.head ??= []
    pageData.frontmatter.head.push(
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:image', content: image }],
      ['meta', { property: 'og:image:alt', content: title }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }],
      ['meta', { name: 'twitter:image', content: image }],
    )
  },
  themeConfig: {
    logo: '/images/fluent-event-icon.png',
    siteTitle: 'FluentEvent',
    nav: [
      { text: 'Getting Started', link: '/getting-started' },
      {
        text: 'Database',
        items: [
          { text: 'Schema', link: '/database/schema' },
          { text: 'Models', link: '/database/models' },
          { text: 'Query Builder', link: '/database/query-builder' },
        ],
      },
      {
        text: 'Hooks',
        items: [
          { text: 'Action Hooks', link: '/hooks/actions/' },
          { text: 'Filter Hooks', link: '/hooks/filters/' },
          { text: 'Helpers', link: '/helpers/' },
        ],
      },
      { text: 'REST API', link: '/restapi/' },
      { text: 'Guides', items: guidePages.filter((page) => page.link !== '/guides/') },
    ],
    sidebar: {
      '/database/': databaseSidebar,
      '/hooks/': hooksSidebar,
      '/helpers/': hooksSidebar,
      '/restapi/': restApiSidebar(),
      '/guides/': [{ text: 'Guides', items: guidePages }],
      '/getting-started': [
        {
          text: 'Start Here',
          items: [
            { text: 'Getting Started', link: '/getting-started' },
            { text: 'Database Schema', link: '/database/schema' },
            { text: 'Action Hooks', link: '/hooks/actions/' },
            { text: 'REST API', link: '/restapi/' },
            { text: 'Guides', link: '/guides/' },
          ],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: REPO_URL }],
    search: { provider: 'local' },
    outline: { level: [2, 3], label: 'On this page' },
    editLink: { pattern: `${REPO_URL}/edit/main/docs/:path` },
    footer: {
      message: 'FluentEvent developer documentation',
      copyright: 'Copyright © 2026 WPManageNinja',
    },
  },
})
