import React, { useMemo, useState } from 'react'

function ReferencesPanel({
  references = [],
  symbolName = '',
  isLoading = false,
  onNavigateToReference,
  onClear,
  activeFile,
}) {
  const [filterQuery, setFilterQuery] = useState('')
  const [selectedFileFilter, setSelectedFileFilter] = useState('all')

  // List of distinct files in the results
  const filesInResults = useMemo(() => {
    const map = new Map()
    references.forEach((ref) => {
      const count = (map.get(ref.targetFileName) || 0) + 1
      map.set(ref.targetFileName, count)
    })
    return Array.from(map.entries()).map(([fileName, count]) => ({
      fileName,
      count,
    }))
  }, [references])

  const filteredReferences = useMemo(() => {
    return references.filter((ref) => {
      // 1. File filter
      if (selectedFileFilter !== 'all' && ref.targetFileName !== selectedFileFilter) {
        return false
      }

      // 2. Text search query filter
      if (filterQuery.trim()) {
        const q = filterQuery.trim().toLowerCase()
        const matchText = (ref.lineText || '').toLowerCase().includes(q)
        const matchFile = (ref.targetFileName || '').toLowerCase().includes(q)
        const matchLine = `line ${ref.lineNumber}`.includes(q) || `${ref.lineNumber}` === q
        if (!matchText && !matchFile && !matchLine) {
          return false
        }
      }

      return true
    })
  }, [references, selectedFileFilter, filterQuery])

  return (
    <div className="references-panel" role="region" aria-label="References Panel">
      {/* Toolbar */}
      <div className="references-panel__toolbar">
        <div className="references-panel__info">
          {symbolName ? (
            <span className="references-panel__symbol-badge">
              Symbol: <strong>{symbolName}</strong> ({references.length}{' '}
              {references.length === 1 ? 'reference' : 'references'})
            </span>
          ) : (
            <span className="references-panel__symbol-badge references-panel__symbol-badge--idle">
              Find All References
            </span>
          )}
        </div>

        {references.length > 0 ? (
          <div className="references-panel__controls">
            <div className="references-panel__search-box">
              <span className="references-panel__search-icon" aria-hidden="true">
                🔍
              </span>
              <input
                type="text"
                className="references-panel__search-input"
                placeholder="Filter references..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                aria-label="Filter references"
              />
              {filterQuery ? (
                <button
                  type="button"
                  className="references-panel__clear-btn"
                  onClick={() => setFilterQuery('')}
                  title="Clear filter"
                  aria-label="Clear filter"
                >
                  ×
                </button>
              ) : null}
            </div>

            {filesInResults.length > 1 ? (
              <div className="references-panel__file-filters" role="group" aria-label="Filter by file">
                <button
                  type="button"
                  className={`references-filter-btn${selectedFileFilter === 'all' ? ' references-filter-btn--active' : ''}`}
                  onClick={() => setSelectedFileFilter('all')}
                >
                  All Files ({references.length})
                </button>
                {filesInResults.map(({ fileName, count }) => (
                  <button
                    key={fileName}
                    type="button"
                    className={`references-filter-btn${selectedFileFilter === fileName ? ' references-filter-btn--active' : ''}`}
                    onClick={() => setSelectedFileFilter(fileName)}
                    title={`Only references in ${fileName}`}
                  >
                    {fileName} ({count})
                  </button>
                ))}
              </div>
            ) : null}

            {onClear ? (
              <button
                type="button"
                className="references-panel__reset-btn"
                onClick={onClear}
                title="Clear reference results"
                aria-label="Clear reference results"
              >
                Clear
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Body */}
      <div className="references-panel__body">
        {isLoading ? (
          <div className="references-panel__loading" role="status" aria-live="polite">
            <div className="references-panel__spinner" aria-hidden="true" />
            <p>Searching for references with Monaco language service...</p>
          </div>
        ) : references.length === 0 ? (
          <div className="references-panel__empty" role="region" aria-label="No references">
            <span className="references-panel__empty-icon" aria-hidden="true">
              🔍
            </span>
            {symbolName ? (
              <>
                <h4 className="references-panel__empty-title">
                  No references found for &ldquo;{symbolName}&rdquo;
                </h4>
                <p className="references-panel__empty-description">
                  The active language service could not locate any additional references in your workspace files.
                </p>
              </>
            ) : (
              <>
                <h4 className="references-panel__empty-title">No references searched</h4>
                <p className="references-panel__empty-description">
                  Place the cursor on any function, variable, class, or symbol, and press{' '}
                  <kbd>Shift+F12</kbd> or right-click to <strong>Find All References</strong>.
                </p>
              </>
            )}
          </div>
        ) : filteredReferences.length === 0 ? (
          <div className="references-panel__empty" role="region" aria-label="No matching references">
            <span className="references-panel__empty-icon" aria-hidden="true">
              🔎
            </span>
            <h4 className="references-panel__empty-title">No matching references</h4>
            <p className="references-panel__empty-description">
              No references match your current filter query &ldquo;{filterQuery}&rdquo;.
            </p>
            <button
              type="button"
              className="references-panel__clear-filter-btn"
              onClick={() => {
                setFilterQuery('')
                setSelectedFileFilter('all')
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <ul className="references-panel__list" role="list" aria-label="References list">
            {filteredReferences.map((ref) => {
              const isCurrentFile = activeFile?.name === ref.targetFileName

              return (
                <li
                  key={ref.id}
                  className={`reference-item${isCurrentFile ? ' reference-item--current' : ''}`}
                  role="listitem"
                  tabIndex={0}
                  onClick={() => onNavigateToReference?.(ref)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onNavigateToReference?.(ref)
                    }
                  }}
                  title={`Click to jump to ${ref.targetFileName} line ${ref.lineNumber}, column ${ref.columnNumber}`}
                >
                  <div className="reference-item__meta">
                    <span className="reference-item__file-badge" title={ref.targetFileName}>
                      📄 {ref.targetFileName}
                    </span>
                    <span className="reference-item__loc-badge">
                      Ln {ref.lineNumber}, Col {ref.columnNumber}
                    </span>
                    {ref.isDefinition ? (
                      <span className="reference-item__type-tag reference-item__type-tag--def" title="Definition">
                        def
                      </span>
                    ) : ref.isWrite ? (
                      <span className="reference-item__type-tag reference-item__type-tag--write" title="Write access">
                        write
                      </span>
                    ) : (
                      <span className="reference-item__type-tag reference-item__type-tag--read" title="Reference / Read">
                        ref
                      </span>
                    )}
                  </div>

                  <div className="reference-item__code">
                    <span className="reference-item__line-num">{ref.lineNumber}</span>
                    <span className="reference-item__code-text">{ref.lineText || '<empty line>'}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default React.memo(ReferencesPanel)
