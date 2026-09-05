import React, { useMemo, useState } from 'react'

function filterSymbols(symbols, query) {
  if (!query) return symbols

  const lowerQuery = query.toLowerCase()

  function filterNode(node) {
    const nameMatches = node.name?.toLowerCase().includes(lowerQuery)
    const kindMatches = node.kindLabel?.toLowerCase().includes(lowerQuery)
    const detailMatches = node.detail?.toLowerCase().includes(lowerQuery)

    const isMatch = nameMatches || kindMatches || detailMatches

    let filteredChildren = []
    if (Array.isArray(node.children) && node.children.length > 0) {
      filteredChildren = node.children.map(filterNode).filter(Boolean)
    }

    if (isMatch || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren,
        isMatched: isMatch,
      }
    }

    return null
  }

  return symbols.map(filterNode).filter(Boolean)
}

function SymbolTreeItem({ symbol, depth = 0, onSelectSymbol, collapsedMap, onToggleCollapse, searchQuery }) {
  const hasChildren = Array.isArray(symbol.children) && symbol.children.length > 0
  const isCollapsed = Boolean(collapsedMap[symbol.id])

  const handleClick = (e) => {
    e.stopPropagation()
    onSelectSymbol(symbol)
  }

  const handleToggle = (e) => {
    e.stopPropagation()
    onToggleCollapse(symbol.id)
  }

  const startLine = symbol.selectionRange?.startLineNumber || symbol.range?.startLineNumber || 1
  const startCol = symbol.selectionRange?.startColumn || symbol.range?.startColumn || 1

  return (
    <div className="outline-item-group" role="treeitem" aria-expanded={hasChildren ? !isCollapsed : undefined}>
      <div
        className={`outline-item ${symbol.isMatched ? 'outline-item--matched' : ''}`}
        style={{ paddingLeft: `${0.5 + depth * 0.9}rem` }}
        onClick={handleClick}
        title={`${symbol.kindLabel}: ${symbol.name} (Line ${startLine}, Col ${startCol})`}
      >
        {hasChildren ? (
          <button
            type="button"
            className={`outline-item__chevron ${isCollapsed ? 'outline-item__chevron--collapsed' : ''}`}
            onClick={handleToggle}
            aria-label={isCollapsed ? `Expand ${symbol.name}` : `Collapse ${symbol.name}`}
          >
            ▾
          </button>
        ) : (
          <span className="outline-item__chevron-placeholder" aria-hidden="true" />
        )}

        <span className={`outline-item__badge ${symbol.colorClass || 'symbol-gray'}`} aria-hidden="true">
          {symbol.kindBadge || symbol.kindIcon || '•'}
        </span>

        <span className="outline-item__name">
          {symbol.name}
          {symbol.detail ? <span className="outline-item__detail">: {symbol.detail}</span> : null}
        </span>

        <span className="outline-item__line" title={`Go to line ${startLine}`}>
          {startLine}
        </span>
      </div>

      {hasChildren && !isCollapsed ? (
        <div className="outline-item__children" role="group">
          {symbol.children.map((child) => (
            <SymbolTreeItem
              key={child.id}
              symbol={child}
              depth={depth + 1}
              onSelectSymbol={onSelectSymbol}
              collapsedMap={collapsedMap}
              onToggleCollapse={onToggleCollapse}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function OutlinePanel({
  activeFile,
  symbols = [],
  isLoading = false,
  hasProvider = true,
  error = null,
  onRefresh,
  onClose,
  searchRef,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedMap, setCollapsedMap] = useState({})

  const filteredSymbols = useMemo(() => {
    return filterSymbols(symbols, searchQuery.trim())
  }, [symbols, searchQuery])

  const handleToggleCollapse = (id) => {
    setCollapsedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleExpandAll = () => {
    setCollapsedMap({})
  }

  const handleCollapseAll = () => {
    const allIds = {}
    function collect(list) {
      list.forEach((item) => {
        if (item.children && item.children.length > 0) {
          allIds[item.id] = true
          collect(item.children)
        }
      })
    }
    collect(symbols)
    setCollapsedMap(allIds)
  }

  const handleSelectSymbol = (symbol) => {
    if (!symbol) return

    const line = symbol.selectionRange?.startLineNumber || symbol.range?.startLineNumber || 1
    const col = symbol.selectionRange?.startColumn || symbol.range?.startColumn || 1

    if (typeof window !== 'undefined' && window.monaco) {
      const activeEditor = window.monaco.editor.getEditors()[0]
      if (activeEditor) {
        activeEditor.setPosition({ lineNumber: line, column: col })
        activeEditor.revealPositionInCenterIfOutsideViewport({ lineNumber: line, column: col })
        activeEditor.setSelection({
          startLineNumber: line,
          startColumn: col,
          endLineNumber: line,
          endColumn: col,
        })
        activeEditor.focus()
      }
    }
  }

  return (
    <div className="outline-panel" aria-label="Symbol Outline Panel">
      <div className="outline-panel__header">
        <div className="outline-panel__title-row">
          <div className="outline-panel__title-group">
            <h3 className="outline-panel__title">Outline</h3>
            {activeFile ? (
              <span className="outline-panel__file-badge" title={activeFile.name}>
                {activeFile.name}
              </span>
            ) : null}
          </div>

          <div className="outline-panel__actions">
            <button
              type="button"
              className="outline-panel__action-btn"
              onClick={handleExpandAll}
              title="Expand All"
              aria-label="Expand all symbols"
            >
              ⊞
            </button>
            <button
              type="button"
              className="outline-panel__action-btn"
              onClick={handleCollapseAll}
              title="Collapse All"
              aria-label="Collapse all symbols"
            >
              ⊟
            </button>
            {onRefresh ? (
              <button
                type="button"
                className={`outline-panel__action-btn${isLoading ? ' outline-panel__action-btn--spinning' : ''}`}
                onClick={onRefresh}
                title="Refresh Symbols"
                aria-label="Refresh symbols"
                disabled={isLoading}
              >
                ↻
              </button>
            ) : null}
            {onClose ? (
              <button
                type="button"
                className="outline-panel__action-btn outline-panel__action-btn--close"
                onClick={onClose}
                title="Close Outline"
                aria-label="Close outline"
              >
                ×
              </button>
            ) : null}
          </div>
        </div>

        {activeFile ? (
          <div className="outline-panel__search-wrapper">
            <span className="outline-panel__search-icon" aria-hidden="true">
              🔍
            </span>
            <input
              ref={searchRef}
              type="text"
              className="outline-panel__search-input"
              placeholder="Filter symbols... (e.g. function, test)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Filter symbols in outline"
              autoComplete="off"
              spellCheck="false"
            />
            {searchQuery ? (
              <button
                type="button"
                className="outline-panel__search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear filter"
                title="Clear filter"
              >
                ×
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="outline-panel__content" role="tree" aria-label="Symbols list">
        {!activeFile ? (
          <div className="outline-panel__empty">
            <span className="outline-panel__empty-icon" aria-hidden="true">
              📁
            </span>
            <p className="outline-panel__empty-title">No active file</p>
            <p className="outline-panel__empty-desc">Open a file from the workspace to inspect its symbols.</p>
          </div>
        ) : isLoading && symbols.length === 0 ? (
          <div className="outline-panel__loading">
            <div className="outline-panel__loading-skeleton" />
            <div className="outline-panel__loading-skeleton outline-panel__loading-skeleton--short" />
            <div className="outline-panel__loading-skeleton" />
            <p className="outline-panel__loading-text">Extracting document symbols...</p>
          </div>
        ) : error ? (
          <div className="outline-panel__empty outline-panel__empty--error">
            <span className="outline-panel__empty-icon" aria-hidden="true">
              ⚠️
            </span>
            <p className="outline-panel__empty-title">Symbol extraction notice</p>
            <p className="outline-panel__empty-desc">{error}</p>
          </div>
        ) : !hasProvider ? (
          <div className="outline-panel__empty">
            <span className="outline-panel__empty-icon" aria-hidden="true">
              ℹ️
            </span>
            <p className="outline-panel__empty-title">No symbols provider</p>
            <p className="outline-panel__empty-desc">
              Symbol outline is not available for this language ({activeFile.language || 'plain text'}).
            </p>
          </div>
        ) : symbols.length === 0 ? (
          <div className="outline-panel__empty">
            <span className="outline-panel__empty-icon" aria-hidden="true">
              📑
            </span>
            <p className="outline-panel__empty-title">No symbols found</p>
            <p className="outline-panel__empty-desc">
              This file does not contain top-level symbols such as functions, classes, or declarations.
            </p>
          </div>
        ) : filteredSymbols.length === 0 ? (
          <div className="outline-panel__empty">
            <span className="outline-panel__empty-icon" aria-hidden="true">
              🔍
            </span>
            <p className="outline-panel__empty-title">No matching symbols</p>
            <p className="outline-panel__empty-desc">No symbols match "{searchQuery}".</p>
          </div>
        ) : (
          <div className="outline-panel__tree">
            {filteredSymbols.map((symbol) => (
              <SymbolTreeItem
                key={symbol.id}
                symbol={symbol}
                depth={0}
                onSelectSymbol={handleSelectSymbol}
                collapsedMap={collapsedMap}
                onToggleCollapse={handleToggleCollapse}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default OutlinePanel
