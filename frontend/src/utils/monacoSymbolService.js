/**
 * Monaco Native Symbol Extraction Service
 * Fetches and normalizes document symbols using Monaco's native language workers and providers.
 */

export const SYMBOL_KINDS = {
  File: 0,
  Module: 1,
  Namespace: 2,
  Package: 3,
  Class: 4,
  Method: 5,
  Property: 6,
  Field: 7,
  Constructor: 8,
  Enum: 9,
  Interface: 10,
  Function: 11,
  Variable: 12,
  Constant: 13,
  String: 14,
  Number: 15,
  Boolean: 16,
  Array: 17,
  Object: 18,
  Key: 19,
  Null: 20,
  EnumMember: 21,
  Struct: 22,
  Event: 23,
  Operator: 24,
  TypeParameter: 25,
}

const LSP_KIND_LABELS = {
  [SYMBOL_KINDS.File]: { label: 'File', icon: '📄', badge: 'F', color: 'symbol-blue' },
  [SYMBOL_KINDS.Module]: { label: 'Module', icon: '📦', badge: 'M', color: 'symbol-purple' },
  [SYMBOL_KINDS.Namespace]: { label: 'Namespace', icon: '🏷️', badge: 'N', color: 'symbol-purple' },
  [SYMBOL_KINDS.Package]: { label: 'Package', icon: '📦', badge: 'P', color: 'symbol-purple' },
  [SYMBOL_KINDS.Class]: { label: 'Class', icon: '🏛️', badge: 'C', color: 'symbol-amber' },
  [SYMBOL_KINDS.Method]: { label: 'Method', icon: '⚡', badge: 'M', color: 'symbol-cyan' },
  [SYMBOL_KINDS.Property]: { label: 'Property', icon: '🔧', badge: 'P', color: 'symbol-blue' },
  [SYMBOL_KINDS.Field]: { label: 'Field', icon: '🔹', badge: 'F', color: 'symbol-blue' },
  [SYMBOL_KINDS.Constructor]: { label: 'Constructor', icon: '⚙️', badge: 'C', color: 'symbol-amber' },
  [SYMBOL_KINDS.Enum]: { label: 'Enum', icon: '🔢', badge: 'E', color: 'symbol-emerald' },
  [SYMBOL_KINDS.Interface]: { label: 'Interface', icon: '🔌', badge: 'I', color: 'symbol-blue' },
  [SYMBOL_KINDS.Function]: { label: 'Function', icon: 'ƒ', badge: 'ƒ', color: 'symbol-purple' },
  [SYMBOL_KINDS.Variable]: { label: 'Variable', icon: '𝓧', badge: 'x', color: 'symbol-sky' },
  [SYMBOL_KINDS.Constant]: { label: 'Constant', icon: '🔒', badge: 'K', color: 'symbol-emerald' },
  [SYMBOL_KINDS.String]: { label: 'String', icon: '💬', badge: '""', color: 'symbol-amber' },
  [SYMBOL_KINDS.Number]: { label: 'Number', icon: '#', badge: '#', color: 'symbol-sky' },
  [SYMBOL_KINDS.Boolean]: { label: 'Boolean', icon: '◐', badge: 'B', color: 'symbol-amber' },
  [SYMBOL_KINDS.Array]: { label: 'Array', icon: '[]', badge: '[]', color: 'symbol-sky' },
  [SYMBOL_KINDS.Object]: { label: 'Object', icon: '{}', badge: '{}', color: 'symbol-amber' },
  [SYMBOL_KINDS.Key]: { label: 'Key', icon: '🔑', badge: 'K', color: 'symbol-blue' },
  [SYMBOL_KINDS.Null]: { label: 'Null', icon: '∅', badge: '∅', color: 'symbol-gray' },
  [SYMBOL_KINDS.EnumMember]: { label: 'Enum Member', icon: '🔸', badge: 'EM', color: 'symbol-emerald' },
  [SYMBOL_KINDS.Struct]: { label: 'Struct', icon: '🧱', badge: 'S', color: 'symbol-amber' },
  [SYMBOL_KINDS.Event]: { label: 'Event', icon: '⚡', badge: 'Ev', color: 'symbol-amber' },
  [SYMBOL_KINDS.Operator]: { label: 'Operator', icon: '±', badge: '±', color: 'symbol-gray' },
  [SYMBOL_KINDS.TypeParameter]: { label: 'Type Parameter', icon: 'T', badge: 'T', color: 'symbol-blue' },
}

export function getSymbolKindMeta(kind) {
  if (typeof kind === 'number') {
    return (
      LSP_KIND_LABELS[kind] || {
        label: 'Symbol',
        icon: '•',
        badge: '•',
        color: 'symbol-gray',
      }
    )
  }

  const strKind = String(kind || '').toLowerCase()
  if (strKind.includes('func')) {
    return { label: 'Function', icon: 'ƒ', badge: 'ƒ', color: 'symbol-purple' }
  }
  if (strKind.includes('method')) {
    return { label: 'Method', icon: '⚡', badge: 'M', color: 'symbol-cyan' }
  }
  if (strKind.includes('class')) {
    return { label: 'Class', icon: '🏛️', badge: 'C', color: 'symbol-amber' }
  }
  if (strKind.includes('interface')) {
    return { label: 'Interface', icon: '🔌', badge: 'I', color: 'symbol-blue' }
  }
  if (strKind.includes('enum')) {
    return { label: 'Enum', icon: '🔢', badge: 'E', color: 'symbol-emerald' }
  }
  if (strKind.includes('const')) {
    return { label: 'Constant', icon: '🔒', badge: 'K', color: 'symbol-emerald' }
  }
  if (strKind.includes('let') || strKind.includes('var') || strKind.includes('variable')) {
    return { label: 'Variable', icon: '𝓧', badge: 'x', color: 'symbol-sky' }
  }
  if (strKind.includes('property') || strKind.includes('field') || strKind.includes('getter') || strKind.includes('setter')) {
    return { label: 'Property', icon: '🔧', badge: 'P', color: 'symbol-blue' }
  }
  if (strKind.includes('module') || strKind.includes('namespace') || strKind.includes('script')) {
    return { label: 'Module', icon: '📦', badge: 'M', color: 'symbol-purple' }
  }
  if (strKind.includes('constructor')) {
    return { label: 'Constructor', icon: '⚙️', badge: 'C', color: 'symbol-amber' }
  }
  if (strKind.includes('type')) {
    return { label: 'Type', icon: 'T', badge: 'T', color: 'symbol-blue' }
  }

  return { label: kind ? String(kind) : 'Symbol', icon: '•', badge: '•', color: 'symbol-gray' }
}

/**
 * Transform TypeScript AST NavigationTree into standard OutlineSymbol hierarchy
 */
function transformNavigationTree(node, model, parentId = '') {
  if (!node) return null

  // Calculate coordinates from span
  const span = (node.spans && node.spans[0]) || { start: 0, length: 0 }
  const startPos = model.getPositionAt(span.start)
  const endPos = model.getPositionAt(span.start + span.length)

  let nameStartPos = startPos
  let nameEndPos = endPos
  if (node.nameSpan) {
    nameStartPos = model.getPositionAt(node.nameSpan.start)
    nameEndPos = model.getPositionAt(node.nameSpan.start + node.nameSpan.length)
  }

  const kindMeta = getSymbolKindMeta(node.kind)
  const id = `${parentId}/${node.text}_${startPos.lineNumber}_${startPos.column}`

  const rawChildren = Array.isArray(node.childItems) ? node.childItems : []
  const children = rawChildren
    .map((child) => transformNavigationTree(child, model, id))
    .filter(Boolean)

  return {
    id,
    name: node.text || '<anonymous>',
    kind: node.kind,
    kindLabel: kindMeta.label,
    kindIcon: kindMeta.icon,
    kindBadge: kindMeta.badge,
    colorClass: kindMeta.color,
    range: {
      startLineNumber: startPos.lineNumber,
      startColumn: startPos.column,
      endLineNumber: endPos.lineNumber,
      endColumn: endPos.column,
    },
    selectionRange: {
      startLineNumber: nameStartPos.lineNumber,
      startColumn: nameStartPos.column,
      endLineNumber: nameEndPos.lineNumber,
      endColumn: nameEndPos.column,
    },
    children,
  }
}

/**
 * Transform LSP DocumentSymbol into standard OutlineSymbol hierarchy
 */
function transformLspDocumentSymbol(sym, parentId = '') {
  if (!sym) return null

  const kindMeta = getSymbolKindMeta(sym.kind)
  const startLine = (sym.range?.start?.line ?? 0) + 1
  const startCol = (sym.range?.start?.character ?? 0) + 1
  const endLine = (sym.range?.end?.line ?? sym.range?.start?.line ?? 0) + 1
  const endCol = (sym.range?.end?.character ?? sym.range?.start?.character ?? 0) + 1

  const selStartLine = (sym.selectionRange?.start?.line ?? sym.range?.start?.line ?? 0) + 1
  const selStartCol = (sym.selectionRange?.start?.character ?? sym.range?.start?.character ?? 0) + 1
  const selEndLine = (sym.selectionRange?.end?.line ?? sym.range?.end?.line ?? 0) + 1
  const selEndCol = (sym.selectionRange?.end?.character ?? sym.range?.end?.character ?? 0) + 1

  const id = `${parentId}/${sym.name}_${startLine}_${startCol}`

  const rawChildren = Array.isArray(sym.children) ? sym.children : []
  const children = rawChildren
    .map((c) => transformLspDocumentSymbol(c, id))
    .filter(Boolean)

  return {
    id,
    name: sym.name || '<property>',
    detail: sym.detail || '',
    kind: sym.kind,
    kindLabel: kindMeta.label,
    kindIcon: kindMeta.icon,
    kindBadge: kindMeta.badge,
    colorClass: kindMeta.color,
    range: {
      startLineNumber: startLine,
      startColumn: startCol,
      endLineNumber: endLine,
      endColumn: endCol,
    },
    selectionRange: {
      startLineNumber: selStartLine,
      startColumn: selStartCol,
      endLineNumber: selEndLine,
      endColumn: selEndCol,
    },
    children,
  }
}

/**
 * Main function: Fetch native document symbols from Monaco language workers or registered providers.
 */
export async function fetchDocumentSymbols(monaco, model, cancellationToken = { isCancelled: false }) {
  if (!monaco || !model || model.isDisposed()) {
    return { symbols: [], hasProvider: false }
  }

  const languageId = model.getLanguageId()
  const uriStr = model.uri.toString()

  try {
    // 1. JavaScript / TypeScript
    if (languageId === 'javascript' || languageId === 'typescript') {
      const getWorker =
        languageId === 'javascript'
          ? monaco.languages.typescript?.getJavaScriptWorker
          : monaco.languages.typescript?.getTypeScriptWorker

      if (typeof getWorker === 'function') {
        const client = await getWorker(model.uri)
        if (cancellationToken.isCancelled) return { symbols: [], hasProvider: true }

        if (client && typeof client.getNavigationTree === 'function') {
          const navTree = await client.getNavigationTree(uriStr)
          if (cancellationToken.isCancelled) return { symbols: [], hasProvider: true }

          if (navTree) {
            // Unwrap root script / global container if present
            const isRootContainer =
              navTree.text === '<global>' ||
              navTree.kind === 'script' ||
              navTree.text === ''

            let symbols = []
            if (isRootContainer && Array.isArray(navTree.childItems)) {
              symbols = navTree.childItems
                .map((item) => transformNavigationTree(item, model, 'root'))
                .filter(Boolean)
            } else {
              const rootSymbol = transformNavigationTree(navTree, model, 'root')
              symbols = rootSymbol ? [rootSymbol] : []
            }

            return { symbols, hasProvider: true }
          }
        }
      }
    }

    // 2. JSON
    if (languageId === 'json') {
      if (typeof monaco.languages.json?.getWorker === 'function') {
        const getWorker = monaco.languages.json.getWorker
        const client = await getWorker(model.uri)
        if (cancellationToken.isCancelled) return { symbols: [], hasProvider: true }

        if (client && typeof client.findDocumentSymbols === 'function') {
          const lspSymbols = await client.findDocumentSymbols(uriStr)
          if (cancellationToken.isCancelled) return { symbols: [], hasProvider: true }

          const symbols = (lspSymbols || [])
            .map((sym) => transformLspDocumentSymbol(sym, 'root'))
            .filter(Boolean)

          return { symbols, hasProvider: true }
        }
      }
    }

    // 3. CSS / LESS / SCSS
    if (languageId === 'css' || languageId === 'less' || languageId === 'scss') {
      if (typeof monaco.languages.css?.getWorker === 'function') {
        const getWorker = monaco.languages.css.getWorker
        const client = await getWorker(model.uri)
        if (cancellationToken.isCancelled) return { symbols: [], hasProvider: true }

        if (client && typeof client.findDocumentSymbols === 'function') {
          const lspSymbols = await client.findDocumentSymbols(uriStr)
          if (cancellationToken.isCancelled) return { symbols: [], hasProvider: true }

          const symbols = (lspSymbols || [])
            .map((sym) => transformLspDocumentSymbol(sym, 'root'))
            .filter(Boolean)

          return { symbols, hasProvider: true }
        }
      }
    }

    // 4. HTML
    if (languageId === 'html') {
      if (typeof monaco.languages.html?.getWorker === 'function') {
        const getWorker = monaco.languages.html.getWorker
        const client = await getWorker(model.uri)
        if (cancellationToken.isCancelled) return { symbols: [], hasProvider: true }

        if (client && typeof client.findDocumentSymbols === 'function') {
          const lspSymbols = await client.findDocumentSymbols(uriStr)
          if (cancellationToken.isCancelled) return { symbols: [], hasProvider: true }

          const symbols = (lspSymbols || [])
            .map((sym) => transformLspDocumentSymbol(sym, 'root'))
            .filter(Boolean)

          return { symbols, hasProvider: true }
        }
      }
    }

    // 5. Fallback check for custom registered DocumentSymbolProvider
    if (typeof monaco.languages.getDocumentSymbols === 'function') {
      const docSymbols = await monaco.languages.getDocumentSymbols(model)
      if (cancellationToken.isCancelled) return { symbols: [], hasProvider: true }

      const symbols = (docSymbols || [])
        .map((sym) => (sym.range?.start ? transformLspDocumentSymbol(sym, 'root') : sym))
        .filter(Boolean)

      return { symbols, hasProvider: true }
    }

    return { symbols: [], hasProvider: false }
  } catch (err) {
    if (cancellationToken.isCancelled) {
      return { symbols: [], hasProvider: false }
    }
    console.debug('Monaco symbol extraction notice:', err)
    return { symbols: [], hasProvider: false }
  }
}
