/**
 * Just enough PHP reading for the doc generator: mask comments, read balanced
 * brackets, split argument lists, and evaluate the literal expressions FluentEvent
 * uses in its request classes (`const RULES = [...]`, `array_merge(self::RULES, [...])`,
 * `'required|in:' . Event::STATUSES`).
 *
 * This is not a PHP parser. Anything it cannot evaluate comes back as
 * `{ __expr: '<source>' }`, and the generator treats that as "unknown" rather
 * than guessing.
 */

/** Index just past the string literal that opens at `i`. */
export function skipString(src, i) {
  const quote = src[i]
  let j = i + 1
  while (j < src.length && src[j] !== quote) {
    if (src[j] === '\\') j++
    j++
  }
  return j + 1
}

/**
 * Same length as `src`, with every comment blanked to spaces (newlines kept), so
 * offsets and line numbers still line up with the raw file.
 */
export function maskComments(src) {
  let out = ''
  let i = 0
  const n = src.length

  while (i < n) {
    const c = src[i]
    const d = src[i + 1]

    if (c === "'" || c === '"') {
      const end = skipString(src, i)
      out += src.slice(i, end)
      i = end
      continue
    }

    if ((c === '/' && d === '/') || (c === '#' && d !== '[')) {
      let j = i
      while (j < n && src[j] !== '\n') j++
      out += ' '.repeat(j - i)
      i = j
      continue
    }

    if (c === '/' && d === '*') {
      let j = src.indexOf('*/', i + 2)
      if (j < 0) j = n - 2
      out += src.slice(i, j + 2).replace(/[^\n]/g, ' ')
      i = j + 2
      continue
    }

    out += c
    i++
  }

  return out
}

export function lineOf(src, index) {
  let line = 1
  for (let i = 0; i < index && i < src.length; i++) {
    if (src[i] === '\n') line++
  }
  return line
}

/** Reads the bracket group opening at `openIdx`; returns its inner text and closing index. */
export function readBalanced(src, openIdx) {
  let depth = 0
  let i = openIdx

  while (i < src.length) {
    const c = src[i]

    if (c === "'" || c === '"') {
      i = skipString(src, i)
      continue
    }

    if (c === '(' || c === '[' || c === '{') depth++
    else if (c === ')' || c === ']' || c === '}') {
      depth--
      if (depth === 0) {
        return { inner: src.slice(openIdx + 1, i), end: i }
      }
    }

    i++
  }

  return { inner: src.slice(openIdx + 1), end: src.length }
}

/** Splits on `sep` where it sits outside every string and bracket. */
export function splitTopLevel(str, sep = ',') {
  const parts = []
  let depth = 0
  let start = 0
  let i = 0

  while (i < str.length) {
    const c = str[i]

    if (c === "'" || c === '"') {
      i = skipString(str, i)
      continue
    }

    if (c === '(' || c === '[' || c === '{') depth++
    else if (c === ')' || c === ']' || c === '}') depth--
    else if (depth === 0 && str.startsWith(sep, i)) {
      parts.push(str.slice(start, i))
      i += sep.length
      start = i
      continue
    }

    i++
  }

  parts.push(str.slice(start))
  return parts.map((part) => part.trim()).filter((part, index, all) => part !== '' || index < all.length - 1)
}

export function stringLiteral(expr) {
  const text = expr.trim()
  if (/^'(?:[^'\\]|\\.)*'$/s.test(text)) {
    return text.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, '\\')
  }
  if (/^"(?:[^"\\]|\\.)*"$/s.test(text)) {
    return text.slice(1, -1)
  }
  return null
}

/**
 * Evaluates a PHP literal expression.
 *
 * @param {string} expr
 * @param {{ resolveConst?: (ref: string) => any, resolveCall?: (ref: string) => any }} ctx
 */
export function evalPhp(expr, ctx = {}) {
  const text = expr.trim()

  if (text === '') return undefined

  const literal = stringLiteral(text)
  if (literal !== null) return literal

  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text)
  if (/^true$/i.test(text)) return true
  if (/^false$/i.test(text)) return false
  if (/^null$/i.test(text)) return null

  if (/^function\s*\(/.test(text) || /^fn\s*\(/.test(text)) {
    return { __closure: true }
  }

  // Ternary: keep both outcomes; callers decide what to do with them.
  const question = splitTopLevel(text, ' ? ')
  if (question.length === 2) {
    const branches = splitTopLevel(question[1], ' : ')
    if (branches.length === 2) {
      return { __ternary: [evalPhp(branches[0], ctx), evalPhp(branches[1], ctx)] }
    }
  }

  const concat = splitTopLevel(text, ' . ')
  if (concat.length > 1) {
    const values = concat.map((part) => evalPhp(part, ctx))
    if (values.every((value) => typeof value === 'string' || typeof value === 'number')) {
      return values.join('')
    }
    return values.map((value) => (typeof value === 'string' || typeof value === 'number' ? value : '?')).join('')
  }

  if (text.startsWith('array_merge(') && text.endsWith(')')) {
    const args = splitTopLevel(text.slice('array_merge('.length, -1)).map((arg) => evalPhp(arg, ctx))
    return mergeValues(args)
  }

  const union = splitTopLevel(text, ' + ')
  if (union.length > 1) {
    const values = union.map((part) => evalPhp(part, ctx))
    // `+` keeps the left-hand key, so merge right to left.
    return mergeValues([...values].reverse())
  }

  if ((text.startsWith('[') && text.endsWith(']')) || (text.startsWith('array(') && text.endsWith(')'))) {
    const inner = text.startsWith('[') ? text.slice(1, -1) : text.slice('array('.length, -1)
    return evalArray(inner, ctx)
  }

  const constRef = text.match(/^((?:\\?[A-Za-z_][\w\\]*)|self|static)::([A-Z_][A-Z0-9_]*)$/)
  if (constRef && ctx.resolveConst) {
    const value = ctx.resolveConst(`${constRef[1]}::${constRef[2]}`)
    if (value !== undefined) return value
  }

  const callRef = text.match(/^((?:\\?[A-Za-z_][\w\\]*)|self|static)::(\w+)\((.*)\)$/s)
  if (callRef && ctx.resolveCall) {
    const value = ctx.resolveCall(`${callRef[1]}::${callRef[2]}`)
    if (value !== undefined) return value
  }

  return { __expr: text }
}

function evalArray(inner, ctx) {
  const entries = splitTopLevel(inner).filter((entry) => entry !== '')
  if (!entries.length) return []

  const keyed = entries.some((entry) => splitTopLevel(entry, '=>').length === 2)

  if (!keyed) {
    return entries.map((entry) => evalPhp(entry, ctx))
  }

  const result = {}
  for (const entry of entries) {
    const pair = splitTopLevel(entry, '=>')
    if (pair.length === 2) {
      const key = evalPhp(pair[0], ctx)
      result[typeof key === 'string' || typeof key === 'number' ? String(key) : pair[0].trim()] = evalPhp(pair[1], ctx)
    }
  }
  return result
}

function mergeValues(values) {
  if (values.every((value) => Array.isArray(value))) {
    return values.flat()
  }

  const result = {}
  for (const value of values) {
    if (value && typeof value === 'object' && !Array.isArray(value) && !value.__expr) {
      Object.assign(result, value)
    }
  }
  return result
}

/** Every `function name(...) { ... }` in a class body, with its comment and location. */
export function parseFunctions(raw) {
  const masked = maskComments(raw)
  const functions = []
  const re = /(?:^|\n)([ \t]*)((?:(?:public|protected|private|static|abstract|final)\s+)*)function\s+(\w+)\s*\(/g
  let match

  while ((match = re.exec(masked))) {
    const nameIndex = match.index + match[0].lastIndexOf(match[3])
    const parenIndex = masked.indexOf('(', nameIndex)
    const params = readBalanced(masked, parenIndex)
    const braceIndex = masked.indexOf('{', params.end)
    const semicolon = masked.indexOf(';', params.end)

    let body = ''
    let bodyStart = braceIndex
    let end = params.end

    if (braceIndex !== -1 && (semicolon === -1 || braceIndex < semicolon)) {
      const block = readBalanced(masked, braceIndex)
      body = block.inner
      end = block.end
    }

    const modifiers = match[2] || ''
    const lineStart = match.index + (match[0].startsWith('\n') ? 1 : 0)

    functions.push({
      name: match[3],
      visibility: /private/.test(modifiers) ? 'private' : /protected/.test(modifiers) ? 'protected' : 'public',
      isStatic: /static/.test(modifiers),
      params: params.inner.replace(/\s+/g, ' ').trim(),
      body,
      bodyOffset: bodyStart + 1,
      line: lineOf(raw, nameIndex),
      comment: commentAbove(raw, lineStart),
      end,
    })
  }

  return functions
}

/**
 * The comment directly above `index` (the start of a line): a docblock, or a run of
 * `//` lines. Returns plain text with the comment markers removed.
 */
export function commentAbove(raw, index) {
  const before = raw.slice(0, index).replace(/\s+$/, '')

  if (before.endsWith('*/')) {
    const start = before.lastIndexOf('/*')
    if (start === -1) return ''
    return before
      .slice(start + 2, -2)
      .split('\n')
      .map((line) => line.replace(/^\s*\*+ ?/, '').replace(/^\*+/, ''))
      .join('\n')
      .trim()
  }

  const lines = before.split('\n')
  const comment = []
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim()
    if (line.startsWith('//')) {
      comment.unshift(line.replace(/^\/\/\s?/, ''))
    } else {
      break
    }
  }
  return comment.join(' ').trim()
}

/** Splits a docblock into its summary and `@param` entries. */
export function parseDocblock(text) {
  const params = []
  const summary = []
  let returns = ''

  for (const line of String(text || '').split('\n')) {
    const param = line.match(/^@param\s+(\S+)\s+(&?\.{0,3}\$\w+)\s*(.*)$/)
    if (param) {
      params.push({ type: param[1], name: param[2].replace(/^&/, ''), desc: param[3].trim() })
      continue
    }
    const ret = line.match(/^@return\s+(.*)$/)
    if (ret) {
      returns = ret[1].trim()
      continue
    }
    if (line.startsWith('@')) continue
    if (!params.length) summary.push(line)
  }

  return { summary: summary.join(' ').replace(/\s+/g, ' ').trim(), params, returns }
}

/** `const NAME = <expr>;` declarations in a class, unevaluated. */
export function parseConstants(raw) {
  const masked = maskComments(raw)
  const consts = {}
  const re = /\bconst\s+([A-Z_][A-Z0-9_]*)\s*=\s*/g
  let match

  while ((match = re.exec(masked))) {
    let i = re.lastIndex
    let depth = 0
    while (i < masked.length) {
      const c = masked[i]
      if (c === "'" || c === '"') {
        i = skipString(masked, i)
        continue
      }
      if (c === '(' || c === '[' || c === '{') depth++
      else if (c === ')' || c === ']' || c === '}') depth--
      else if (c === ';' && depth === 0) break
      i++
    }
    consts[match[1]] = { expr: masked.slice(re.lastIndex, i).trim(), line: lineOf(raw, match.index) }
  }

  return consts
}
