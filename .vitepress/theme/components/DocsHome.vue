<template>
  <div class="home-container">
    <!-- Hero -->
    <section class="home-hero">
      <div class="home-hero__badge">Developer Documentation</div>
      <h1 class="home-hero__title">
        Build with <span class="home-hero__brand">FluentEvent</span>
      </h1>
      <p class="home-hero__lead">
        Everything you need to extend and integrate FluentEvent &mdash; calendars, events
        and guests: the database, hooks, REST API, and practical guides.
      </p>
      <div class="home-hero__actions">
        <a href="/getting-started" class="home-btn home-btn--primary">Get Started</a>
        <a href="/restapi/" class="home-btn home-btn--outline">API Reference</a>
      </div>
    </section>

    <!-- Main sections -->
    <div class="home-sections">
      <a
        v-for="section in sections"
        :key="section.href"
        :href="section.href"
        class="home-section-card"
      >
        <div class="home-section-card__icon" v-html="section.icon"></div>
        <h2 class="home-section-card__title">{{ section.title }}</h2>
        <p class="home-section-card__desc">{{ section.description }}</p>
        <span class="home-section-card__link">{{ section.linkText }} &rarr;</span>
      </a>
    </div>

    <!-- Quick start -->
    <section class="home-quickstart">
      <div class="home-quickstart__header">
        <h2>Common starting points</h2>
        <p>Jump straight into the tasks developers reach for first.</p>
      </div>
      <div class="home-quickstart__grid">
        <a
          v-for="item in quickLinks"
          :key="item.href"
          :href="item.href"
          class="home-quick-link"
        >
          <strong>{{ item.title }}</strong>
          <span>{{ item.desc }}</span>
        </a>
      </div>
    </section>

    <!-- Stats bar -->
    <div class="home-stats">
      <div v-for="stat in statItems" :key="stat.label" class="home-stat">
        <span class="home-stat__value">{{ stat.value }}</span>
        <span class="home-stat__label">{{ stat.label }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DocsHome',
  props: {
    stats: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      sections: [
        {
          href: '/restapi/',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 0 1 9-9"/></svg>',
          title: 'REST API',
          description: 'Every endpoint with its parameters, permissions and a recorded sample response. Try each one in the playground.',
          linkText: 'Browse endpoints',
        },
        {
          href: '/database/schema',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>',
          title: 'Database & Models',
          description: 'Tables, columns and indexes, the event post hybrid, and the ORM models with their scopes.',
          linkText: 'View schema',
        },
        {
          href: '/hooks/actions/',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-8.37 8.37a2.12 2.12 0 1 1-3-3L12 9"/><path d="M17.5 6.5 12 12"/><path d="M13 4.5 7.5 10"/><path d="M16 8 20.37 3.63a2.12 2.12 0 1 0-3-3L13 5"/></svg>',
          title: 'Hooks & Filters',
          description: 'Every action and filter with its arguments, call sites, built-in listeners and an example.',
          linkText: 'Explore hooks',
        },
        {
          href: '/guides/',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="m9 9.5 2 2 4-4"/></svg>',
          title: 'Guides',
          description: 'Public pages and blocks, emails and reminders, the FluentCommunity integration, and code snippets.',
          linkText: 'Read guides',
        },
      ],
      quickLinks: [
        {
          href: '/restapi/#authentication',
          title: 'Authenticate API requests',
          desc: 'Use Application Passwords or a cookie and nonce.',
        },
        {
          href: '/hooks/actions/guests#fluent-event-guest-created',
          title: 'React to new guests',
          desc: 'Run code when someone registers or is added.',
        },
        {
          href: '/hooks/actions/events#fluent-event-event-before-deleted',
          title: 'Hook into event deletes',
          desc: 'Read guests before the cleanup removes them.',
        },
        {
          href: '/database/models/event',
          title: 'Query events',
          desc: 'The post + details hybrid, scopes and time zones.',
        },
        {
          href: '/guides/public-pages',
          title: 'Place events on a page',
          desc: 'Shortcodes, blocks and theme templates.',
        },
        {
          href: '/guides/emails-and-reminders',
          title: 'Understand reminders',
          desc: 'How Action Scheduler sends guest emails.',
        },
      ],
    }
  },
  computed: {
    statItems() {
      return [
        { value: this.stats.tables, label: 'Tables' },
        { value: this.stats.models, label: 'Models' },
        { value: this.stats.routes, label: 'API Endpoints' },
        { value: this.stats.hooks, label: 'Hooks' },
      ]
    },
  },
}
</script>
