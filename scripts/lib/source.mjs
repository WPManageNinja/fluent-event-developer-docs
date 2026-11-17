/**
 * Reads the FluentEvent plugin source into plain data: tables, models, routes,
 * request rules, policies and hook call sites. The generator turns that data into
 * pages; nothing here writes a file.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import {
  commentAbove,
  evalPhp,
  lineOf,
  maskComments,
  parseConstants,
  parseDocblock,
  parseFunctions,
  readBalanced,
  splitTopLevel,
  stringLiteral,
} from './php.mjs'

export const PLUGIN_SLUG = 'fluent-event'
export const HOOK_PREFIX = 'fluent_event/'

export function createSource(pluginDir) {
  const read = (rel) => readFileSync(join(pluginDir, rel), 'utf8')
  const exists = (rel) => existsSync(join(pluginDir, rel))
  const rel = (abs) => relative(pluginDir, abs).split('\\').join('/')

  function walkPhp(dir, files = []) {
    const abs = join(pluginDir, dir)
    if (!existsSync(abs)) return files
    for (const entry of readdirSync(abs)) {
      const full = join(abs, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) {
        if (entry === 'vendor' || entry === 'node_modules' || entry === 'Views') continue
        walkPhp(join(dir, entry), files)
      } else if (entry.endsWith('.php')) {
        files.push(rel(full))
      }
    }
    return files
  }

  // ---------------------------------------------------------------------------
  // Plugin meta
  // ---------------------------------------------------------------------------

  function pluginMeta() {
    const main = read('fluent-event.php')
    const config = read('config/app.php')
    const version = (main.match(/Version:\s*([\w.-]+)/) || [])[1] || ''
    const requiresWp = (main.match(/Requires at least:\s*([\w.-]+)/) || [])[1] || ''
    const requiresPhp = (main.match(/Requires PHP:\s*([\w.-]+)/) || [])[1] || ''
    const restNamespace = (config.match(/'rest_namespace'\s*=>\s*'([^']+)'/) || [])[1] || PLUGIN_SLUG
    const restVersion = (config.match(/'rest_version'\s*=>\s*'([^']+)'/) || [])[1] || 'v2'
    const dbVersion = (main.match(/FLUENT_EVENT_DB_VERSION',\s*'([^']+)'/) || [])[1] || ''

    return { version, requiresWp, requiresPhp, restNamespace, restVersion, namespace: `${restNamespace}/${restVersion}`, dbVersion }
  }

  // ---------------------------------------------------------------------------
  // Class constants, resolvable across files (Event::STATUSES, self::RULES)
  // ---------------------------------------------------------------------------

  const classFiles = {}
  for (const file of [...walkPhp('app'), ...walkPhp('Modules')]) {
    const raw = read(file)
    const name = (raw.match(/\bclass\s+(\w+)/) || [])[1]
    if (name && !classFiles[name]) classFiles[name] = file
  }

  const constCache = {}
  function classConstants(className) {
    if (constCache[className]) return constCache[className]
    const file = classFiles[className]
    constCache[className] = file ? parseConstants(read(file)) : {}
    return constCache[className]
  }

  function classFunctions(className) {
    const file = classFiles[className]
    return file ? parseFunctions(read(file)) : []
  }

  function parentOf(className) {
    const file = classFiles[className]
    if (!file) return null
    return (read(file).match(new RegExp(`class\\s+${className}\\s+extends\\s+([\\w\\\\]+)`)) || [])[1]?.split('\\').pop() || null
  }

  function resolveConst(className, ref, seen = new Set()) {
    const [owner, constName] = ref.split('::')
    let target = owner === 'self' || owner === 'static' ? className : owner.split('\\').pop()

    while (target) {
      const key = `${target}::${constName}`
      if (seen.has(key)) return undefined
      const consts = classConstants(target)
      if (consts[constName]) {
        seen.add(key)
        return evalPhp(consts[constName].expr, contextFor(target, seen))
      }
      // `static::X` and an inherited const both fall through to the parent.
      target = parentOf(target)
    }
    return undefined
  }

  function contextFor(className, seen = new Set()) {
    return {
      resolveConst: (ref) => resolveConst(className, ref, seen),
      resolveCall: (ref) => resolveRuleFunction(className, ref, seen),
    }
  }

  // ---------------------------------------------------------------------------
  // Request classes: rules and sanitizers
  // ---------------------------------------------------------------------------

  /**
   * Evaluates a `public static function xxxRules()` on a request class into a
   * field => rule map. Handles `return self::RULES`, `array_merge(...)`, `+`, and a
   * local `$rules = ...; $rules['k'] = ...;` build-up.
   */
  function resolveRuleFunction(className, ref, seen = new Set()) {
    const [owner, fnName] = ref.split('::')
    const target = owner === 'self' || owner === 'static' ? className : owner.split('\\').pop()
    const key = `${target}::${fnName}()`
    if (seen.has(key)) return undefined
    seen.add(key)

    const fn = classFunctions(target).find((f) => f.name === fnName)
    if (!fn) return undefined

    const ctx = contextFor(target, seen)
    const returned = fn.body.match(/return\s+([\s\S]+?);\s*$/)
    if (!returned) return undefined

    const expr = returned[1].trim()
    const local = expr.match(/^\$(\w+)$/)

    if (!local) {
      return evalPhp(expr, ctx)
    }

    const assign = fn.body.match(new RegExp(`\\$${local[1]}\\s*=\\s*([^;]+);`))
    let value = assign ? evalPhp(assign[1], ctx) : {}
    value = value && typeof value === 'object' && !value.__expr ? { ...value } : {}

    const keyRe = new RegExp(`\\$${local[1]}\\['([^']+)'\\]\\s*=\\s*([^;]+);`, 'g')
    let m
    while ((m = keyRe.exec(fn.body))) {
      const next = evalPhp(m[2], ctx)
      value[m[1]] = mergeRule(value[m[1]], next)
    }

    return value
  }

  /** A conditional rule keeps the union of both branches' tokens. */
  function mergeRule(current, next) {
    const tokens = new Set([...ruleTokens(current), ...ruleTokens(next)])
    return [...tokens].join('|')
  }

  function requestRules(className, fnName) {
    if (fnName === 'RULES') return resolveConst(className, 'self::RULES') || {}
    return resolveRuleFunction(className, `self::${fnName}`) || {}
  }

  function requestSanitizers(className) {
    return resolveConst(className, 'self::SANITIZERS') || {}
  }

  // ---------------------------------------------------------------------------
  // Migrations
  // ---------------------------------------------------------------------------

  function tables() {
    const result = []
    for (const file of walkPhp('database/Migrations')) {
      const raw = read(file)
      const name = (raw.match(/\$tableName\s*=\s*'([^']+)'/) || [])[1]
      if (!name) continue

      const createAt = raw.indexOf('CREATE TABLE')
      const open = raw.indexOf('(', createAt)
      const body = readBalanced(raw, open).inner
      const columns = []
      const indexes = []

      for (const rawLine of splitTopLevel(body, ',\n')) {
        const line = rawLine.replace(/\s+/g, ' ').trim()
        const col = line.match(/^`(\w+)`\s+([A-Z]+(?:\([^)]*\))?(?:\s+UNSIGNED)?)(.*)$/i)

        if (col) {
          const rest = col[3]
          const comment = (rest.match(/COMMENT\s+'((?:[^'\\]|\\.)*)'/i) || [])[1] || ''
          const def = (rest.match(/DEFAULT\s+('(?:[^']*)'|[\w.]+)/i) || [])[1]
          columns.push({
            name: col[1],
            type: col[2].toLowerCase(),
            nullable: !/NOT NULL/i.test(rest),
            default: def === undefined ? null : def.replace(/^'|'$/g, ''),
            primary: /PRIMARY KEY/i.test(rest),
            autoIncrement: /AUTO_INCREMENT/i.test(rest),
            comment,
          })
          continue
        }

        const idx = line.match(/^(UNIQUE KEY|INDEX|KEY)\s+`(\w+)`\s*\(([^)]*)\)/i)
        if (idx) {
          indexes.push({
            name: idx[2],
            unique: /UNIQUE/i.test(idx[1]),
            columns: idx[3].split(',').map((c) => c.replace(/[`\s]/g, '')),
          })
        }
      }

      for (const column of columns) {
        if (column.primary) indexes.unshift({ name: 'PRIMARY', unique: true, columns: [column.name] })
      }

      result.push({ name, file, columns, indexes })
    }

    const order = ['fe_calendars', 'fe_event_details', 'fe_ticket_types', 'fe_guests', 'fe_meta', 'fe_notifications', 'fe_notification_users']
    return result.sort((a, b) => indexOrEnd(order, a.name) - indexOrEnd(order, b.name))
  }

  // ---------------------------------------------------------------------------
  // Models
  // ---------------------------------------------------------------------------

  function models() {
    const result = []
    for (const file of walkPhp('app/Models')) {
      const raw = read(file)
      const masked = maskComments(raw)
      const className = (raw.match(/\bclass\s+(\w+)/) || [])[1]
      if (!className) continue

      const prop = (name) => {
        const m = masked.match(new RegExp(`\\$${name}\\s*=\\s*`))
        if (!m) return undefined
        const start = m.index + m[0].length
        const end = findStatementEnd(masked, start)
        return evalPhp(masked.slice(start, end), contextFor(className))
      }

      const functions = parseFunctions(raw)
      const relationships = []
      const scopes = []
      const accessors = []
      const methods = []

      for (const fn of functions) {
        const rel = fn.body.match(/\$this->(hasMany|hasOne|belongsTo|belongsToMany|hasManyThrough)\(\s*([\w\\]+)::class(?:\s*,\s*'([^']*)')?(?:\s*,\s*'([^']*)')?/)
        if (rel) {
          relationships.push({ name: fn.name, type: rel[1], target: rel[2].split('\\').pop(), foreignKey: rel[3] || '', ownerKey: rel[4] || '', line: fn.line, comment: fn.comment })
          continue
        }
        if (/^scope[A-Z]/.test(fn.name)) {
          const params = fn.params.split(',').map((p) => p.trim()).slice(1).map((p) => p.replace(/\s*=.*/, '').split(/\s+/).pop())
          scopes.push({ name: fn.name.slice(5, 6).toLowerCase() + fn.name.slice(6), params, line: fn.line, comment: fn.comment })
          continue
        }
        const accessor = fn.name.match(/^get(\w+)Attribute$/)
        if (accessor) {
          accessors.push({ name: snake(accessor[1]), method: fn.name, line: fn.line, comment: fn.comment })
          continue
        }
        if (fn.visibility === 'public' && fn.name !== 'booted') {
          methods.push({ name: fn.name, isStatic: fn.isStatic, params: fn.params, line: fn.line, comment: fn.comment })
        }
      }

      const consts = {}
      for (const [name, def] of Object.entries(classConstants(className))) {
        consts[name] = evalPhp(def.expr, contextFor(className))
      }

      const boot = functions.find((fn) => fn.name === 'booted')

      result.push({
        className,
        file,
        extends: parentOf(className),
        docblock: commentAbove(raw, raw.search(/\nclass\s/) + 1),
        table: prop('table'),
        primaryKey: prop('primaryKey') || 'id',
        timestamps: prop('timestamps') !== false,
        fillable: prop('fillable') || [],
        guarded: prop('guarded'),
        casts: prop('casts') || {},
        appends: prop('appends') || [],
        hidden: prop('hidden') || [],
        searchable: prop('searchable') || [],
        consts,
        relationships,
        scopes,
        accessors,
        methods,
        globalScopes: boot ? [...boot.body.matchAll(/addGlobalScope\('([^']+)'/g)].map((m) => m[1]) : [],
        bootEvents: boot ? [...boot.body.matchAll(/static::(\w+)\(/g)].map((m) => m[1]).filter((name) => name !== 'addGlobalScope') : [],
      })
    }
    return result
  }

  // ---------------------------------------------------------------------------
  // Routes, controllers, policies
  // ---------------------------------------------------------------------------

  function routes() {
    const file = 'app/Http/Routes/api.php'
    const raw = read(file)
    const masked = maskComments(raw)
    const lines = masked.split('\n')
    const stack = []
    const result = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (/->group\(\s*function/.test(line)) {
        stack.push({
          prefix: (line.match(/->prefix\('([^']*)'\)/) || [])[1] || '',
          policy: (line.match(/->withPolicy\('([^']+)'\)/) || [])[1] || (/withDefaultPolicy\(\)/.test(line) ? 'Policy' : ''),
        })
        continue
      }

      if (/^\s*\}\);\s*$/.test(line)) {
        stack.pop()
        continue
      }

      const route = line.match(/\$router->(get|post|put|patch|delete)\(/)
      if (!route) continue

      let statement = line
      let j = i
      while (!/;\s*$/.test(statement) && j < lines.length - 1) {
        j++
        statement += '\n' + lines[j]
      }

      const open = statement.indexOf('(', statement.indexOf(`->${route[1]}`))
      const args = splitTopLevel(readBalanced(statement, open).inner)
      const path = stringLiteral(args[0]) || ''
      let controller = ''
      let action = ''
      const handler = args[1] || ''
      const atForm = stringLiteral(handler)

      if (atForm) {
        ;[controller, action] = atForm.split('@')
      } else {
        const arr = handler.match(/\[\s*(\w+)::class\s*,\s*'(\w+)'\s*\]/)
        if (arr) [, controller, action] = arr
      }

      const constraints = {}
      for (const m of statement.matchAll(/->(int|alphaNumDash|alphaNum|alpha)\('(\w+)'\)/g)) {
        constraints[m[2]] = m[1]
      }

      const prefix = stack.map((s) => s.prefix).filter(Boolean).join('/')
      const fullPath = ('/' + [prefix, path.replace(/^\/|\/$/g, '')].filter(Boolean).join('/')).replace(/\/+/g, '/') || '/'
      const policy = [...stack].reverse().find((s) => s.policy)?.policy || ''

      result.push({
        method: route[1].toUpperCase(),
        path: fullPath === '' ? '/' : fullPath,
        controller,
        action,
        policy,
        constraints,
        file,
        line: i + 1,
      })
      i = j
    }

    return result
  }

  function controllerMethod(controller, action) {
    const file = `app/Http/Controllers/${controller}.php`
    if (!exists(file)) return null
    const fn = parseFunctions(read(file)).find((f) => f.name === action)
    return fn ? { ...fn, file } : null
  }

  function policy(policyName, action) {
    const file = `app/Http/Policies/${policyName}.php`
    if (!exists(file)) return { name: policyName, method: 'verifyRequest', file: null, line: null, comment: '' }
    const functions = parseFunctions(read(file))
    const own = functions.find((f) => f.name === action)
    const fallback = functions.find((f) => f.name === 'verifyRequest')
    const chosen = own || fallback
    if (!chosen && policyName !== 'Policy') {
      return policy('Policy', 'verifyRequest')
    }
    return {
      name: policyName,
      method: chosen ? chosen.name : 'verifyRequest',
      file,
      line: chosen ? chosen.line : null,
      comment: chosen ? chosen.comment : '',
      classComment: commentAbove(read(file), read(file).search(/\nclass\s/) + 1),
    }
  }

  /**
   * Request inputs a controller action reads: `$request->getSafe()` / `get()` calls,
   * the request class rules it validates against, and its paging/sorting helpers.
   */
  function actionInputs(controller, action, seen = new Set()) {
    const method = controllerMethod(controller, action)
    if (!method || seen.has(action)) return { fields: {}, method }
    seen.add(action)

    const body = method.body
    const fields = {}
    const add = (name, info) => {
      fields[name] = { ...(fields[name] || {}), ...info, sources: [...new Set([...(fields[name]?.sources || []), info.source].filter(Boolean))] }
    }

    for (const m of body.matchAll(/\$request->getSafe\(\s*'([\w.]+)'\s*(?:,\s*'(\w+)')?(?:\s*,\s*([^)]+))?\)/g)) {
      add(m[1], { sanitizer: m[2] || '', default: m[3] ? evalPhp(m[3]) : undefined, source: 'getSafe' })
    }
    for (const m of body.matchAll(/\$request->get\(\s*'([\w.]+)'/g)) {
      add(m[1], { source: 'get' })
    }

    // Rules from a request class: X::rules($data), X::createRules(...), X::RULES ...
    let only = null
    const onlyMatch = body.match(/Arr::only\(\s*(\w+Request)::(\w+)\([^)]*\)\s*,\s*\[([^\]]*)\]\s*\)/)
    if (onlyMatch) {
      only = splitTopLevel(onlyMatch[3]).map((k) => stringLiteral(k)).filter(Boolean)
    }

    const ruleCalls = [...body.matchAll(/(\w+Request)::(\w*[Rr]ules|RULES)\b/g)]
    for (const [, cls, fn] of ruleCalls) {
      const rules = requestRules(cls, fn)
      const sanitizers = requestSanitizers(cls)
      for (const [name, rule] of Object.entries(rules)) {
        if (only && !only.includes(name.split('.')[0])) continue
        add(name, { rule: ruleTokens(rule), sanitizer: typeof sanitizers[name] === 'string' ? sanitizers[name] : fields[name]?.sanitizer, source: `${cls}::${fn}` })
      }
    }

    // Inline $this->validate([...], [ 'key' => 'rule' ])
    for (const m of body.matchAll(/\$this->validate\(/g)) {
      const open = body.indexOf('(', m.index)
      const args = splitTopLevel(readBalanced(body, open).inner)
      const rules = args[1] ? evalPhp(args[1]) : null
      if (rules && typeof rules === 'object' && !Array.isArray(rules) && !rules.__expr) {
        for (const [name, rule] of Object.entries(rules)) {
          add(name, { rule: ruleTokens(rule), source: 'inline' })
        }
      }
    }

    const perPage = body.match(/(\w+Request)::perPage\(/)
    if (perPage) {
      add('per_page', { sanitizer: 'intval', perPage: { default: resolveConst(perPage[1], 'static::PER_PAGE'), max: resolveConst(perPage[1], 'static::PER_PAGE_MAX') }, source: 'perPage' })
      add('page', { sanitizer: 'intval', source: 'paginate' })
    }

    const sorting = body.match(/(\w+Request)::sorting\(/)
    if (sorting) {
      add('order_by', { sanitizer: 'sanitize_text_field', enum: resolveConst(sorting[1], 'static::SORTABLE'), default: resolveConst(sorting[1], 'static::ORDER_BY'), source: 'sorting' })
      add('order_type', { sanitizer: 'sanitize_text_field', enum: ['ASC', 'DESC'], default: resolveConst(sorting[1], 'static::ORDER_TYPE'), source: 'sorting' })
    }

    // An action that hands over to another one (getEventBySlug -> getEvent) reads its inputs too.
    for (const m of body.matchAll(/\$this->(\w+)\(\$request/g)) {
      const inner = actionInputs(controller, m[1], seen).fields
      for (const [name, info] of Object.entries(inner)) {
        if (!fields[name]) fields[name] = info
      }
    }

    return { fields, method }
  }

  // ---------------------------------------------------------------------------
  // Hooks
  // ---------------------------------------------------------------------------

  function hooks() {
    const files = [...walkPhp('app'), ...walkPhp('Modules'), ...walkPhp('boot'), ...walkPhp('database')]
    const callSites = []
    const listeners = []
    const scheduled = []

    for (const file of files) {
      const raw = read(file)
      const masked = maskComments(raw)

      for (const m of masked.matchAll(/\b(do_action_ref_array|do_action|apply_filters_ref_array|apply_filters)\s*\(/g)) {
        const open = m.index + m[0].length - 1
        const args = splitTopLevel(readBalanced(masked, open).inner)
        const name = hookName(args[0])
        if (!name || !name.startsWith(HOOK_PREFIX)) continue

        const lineStart = masked.lastIndexOf('\n', m.index) + 1
        const doc = parseDocblock(commentAbove(raw, lineStart))
        callSites.push({
          name,
          kind: m[1].startsWith('do_action') ? 'action' : 'filter',
          byRef: m[1].endsWith('_ref_array'),
          args: args.slice(1).map((arg) => arg.replace(/\s+/g, ' ').trim()),
          file,
          line: lineOf(raw, m.index),
          docblock: doc,
          context: enclosingFunction(raw, m.index),
        })
      }

      for (const m of masked.matchAll(/\badd_(action|filter)\s*\(/g)) {
        const open = m.index + m[0].length - 1
        const args = splitTopLevel(readBalanced(masked, open).inner)
        const name = hookName(args[0])
        if (!name || !name.startsWith(HOOK_PREFIX)) continue
        listeners.push({
          name,
          handler: (args[1] || '').replace(/\s+/g, ' ').trim(),
          priority: args[2] ? Number(args[2]) || args[2] : 10,
          acceptedArgs: args[3] ? Number(args[3]) || args[3] : 1,
          file,
          line: lineOf(raw, m.index),
        })
      }

      for (const m of masked.matchAll(/\b(as_enqueue_async_action|as_schedule_single_action)\s*\(/g)) {
        const open = m.index + m[0].length - 1
        const args = splitTopLevel(readBalanced(masked, open).inner)
        const hookArgIndex = m[1] === 'as_schedule_single_action' ? 1 : 0
        const name = hookName(args[hookArgIndex])
        if (!name || !name.startsWith(HOOK_PREFIX)) continue
        scheduled.push({
          name,
          kind: 'action',
          scheduler: m[1],
          when: m[1] === 'as_schedule_single_action' ? args[0].replace(/\s+/g, ' ').trim() : 'now (async)',
          args: args[hookArgIndex + 1] ? args[hookArgIndex + 1].replace(/\s+/g, ' ').trim() : '[]',
          file,
          line: lineOf(raw, m.index),
          context: enclosingFunction(raw, m.index),
        })
      }
    }

    return { callSites, listeners, scheduled }
  }

  function enclosingFunction(raw, index) {
    const before = maskComments(raw.slice(0, index))
    const fnMatches = [...before.matchAll(/function\s+(\w+)\s*\(/g)]
    const className = (raw.match(/\bclass\s+(\w+)/) || [])[1]
    const fn = fnMatches.length ? fnMatches[fnMatches.length - 1][1] : ''
    return className && fn ? `${className}::${fn}()` : fn ? `${fn}()` : ''
  }

  return {
    pluginDir,
    read,
    exists,
    pluginMeta,
    tables,
    models,
    routes,
    policy,
    actionInputs,
    controllerMethod,
    hooks,
    resolveConst,
  }
}

/** `'fluent_event/foo'` -> `fluent_event/foo`; `'fluent_event/x_' . $y` -> `fluent_event/x_{y}`. */
export function hookName(arg) {
  if (!arg) return null
  const literal = stringLiteral(arg)
  if (literal !== null) return literal
  const parts = splitTopLevel(arg, ' . ')
  if (parts.length > 1) {
    return parts
      .map((part) => {
        const lit = stringLiteral(part)
        if (lit !== null) return lit
        const variable = part.match(/\$(?:this->)?(\w+)(?:\['(\w+)'\])?/)
        return variable ? `{${variable[2] || variable[1]}}` : '{dynamic}'
      })
      .join('')
  }
  return null
}

/** Normalises a rule value (string, list, ternary, closure) into tokens. */
export function ruleTokens(rule) {
  if (rule === undefined || rule === null) return []
  if (typeof rule === 'string') return rule.split('|').map((t) => t.trim()).filter(Boolean)
  if (Array.isArray(rule)) return rule.flatMap((r) => (r && r.__closure ? ['custom'] : ruleTokens(r)))
  if (rule.__ternary) return [...new Set(rule.__ternary.flatMap((r) => ruleTokens(r)))]
  if (rule.__closure) return ['custom']
  return []
}

function findStatementEnd(src, start) {
  let depth = 0
  let i = start
  while (i < src.length) {
    const c = src[i]
    if (c === "'" || c === '"') {
      let j = i + 1
      while (j < src.length && src[j] !== c) {
        if (src[j] === '\\') j++
        j++
      }
      i = j + 1
      continue
    }
    if (c === '(' || c === '[' || c === '{') depth++
    else if (c === ')' || c === ']' || c === '}') depth--
    else if (c === ';' && depth === 0) return i
    i++
  }
  return src.length
}

function indexOrEnd(list, value) {
  const index = list.indexOf(value)
  return index === -1 ? list.length : index
}

export function snake(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()
}
