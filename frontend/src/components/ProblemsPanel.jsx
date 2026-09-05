import { useMemo, useState } from 'react'

function ProblemsPanel({ problems = [], activeFile, onNavigateToProblem }) {
  const [filterText, setFilterText] = useState('')
  const [scope, setScope] = useState('all') // 'all' | 'current'
  const [severityFilter, setSeverityFilter] = useState('all') // 'all' | 'error' | 'warning' | 'info'

  const activeFileName = activeFile?.name

  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      // Scope filter
      if (scope === 'current' && activeFileName && problem.fileName !== activeFileName) {
        return false
      }

      // Severity filter
      if (severityFilter === 'error' && problem.severityCode !== 8) {
        return false
      }
      if (severityFilter === 'warning' && problem.severityCode !== 4) {
        return false
      }
      if (severityFilter === 'info' && problem.severityCode !== 2 && problem.severityCode !== 1) {
        return false
      }

      // Text query filter
      if (filterText.trim()) {
        const query = filterText.trim().toLowerCase()
        const matchMessage = problem.message.toLowerCase().includes(query)
        const matchFile = problem.fileName.toLowerCase().includes(query)
        const matchLine = `line ${problem.lineNumber}`.includes(query) || `${problem.lineNumber}` === query
        const matchSource = (problem.source || '').toLowerCase().includes(query)
        if (!matchMessage && !matchFile && !matchLine && !matchSource) {
          return false
        }
      }

      return true
    })
  }, [problems, scope, activeFileName, severityFilter, filterText])

  const totalErrors = problems.filter((p) => p.severityCode === 8).length
  const totalWarnings = problems.filter((p) => p.severityCode === 4).length
  const totalInfo = problems.filter((p) => p.severityCode === 2 || p.severityCode === 1).length
  const currentFileProblemsCount = activeFileName
    ? problems.filter((p) => p.fileName === activeFileName).length
    : 0

  return (
    <div className="problems-panel" role="region" aria-label="Problems and Diagnostics">
      {/* Controls / Filter Toolbar */}
      <div className="problems-panel__toolbar">
        <div className="problems-panel__search-box">
          <span className="problems-panel__search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            type="text"
            className="problems-panel__search-input"
            placeholder="Filter problems (e.g. error, demo.js, line 4)..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            aria-label="Filter problems"
          />
          {filterText ? (
            <button
              type="button"
              className="problems-panel__clear-btn"
              onClick={() => setFilterText('')}
              title="Clear search filter"
              aria-label="Clear search filter"
            >
              ×
            </button>
          ) : null}
        </div>

        <div className="problems-panel__filters" role="group" aria-label="Problem filter controls">
          <div className="problems-panel__scope-group" role="radiogroup" aria-label="Problem scope">
            <button
              type="button"
              className={`problems-filter-btn${scope === 'all' ? ' problems-filter-btn--active' : ''}`}
              onClick={() => setScope('all')}
              role="radio"
              aria-checked={scope === 'all'}
            >
              All Files ({problems.length})
            </button>
            {activeFileName ? (
              <button
                type="button"
                className={`problems-filter-btn${scope === 'current' ? ' problems-filter-btn--active' : ''}`}
                onClick={() => setScope('current')}
                role="radio"
                aria-checked={scope === 'current'}
                title={`Only problems in ${activeFileName}`}
              >
                Current ({currentFileProblemsCount})
              </button>
            ) : null}
          </div>

          <div className="problems-panel__severity-group" role="radiogroup" aria-label="Severity filter">
            <button
              type="button"
              className={`problems-filter-btn${severityFilter === 'all' ? ' problems-filter-btn--active' : ''}`}
              onClick={() => setSeverityFilter('all')}
              role="radio"
              aria-checked={severityFilter === 'all'}
            >
              All
            </button>
            <button
              type="button"
              className={`problems-filter-btn${severityFilter === 'error' ? ' problems-filter-btn--active' : ''}`}
              onClick={() => setSeverityFilter('error')}
              role="radio"
              aria-checked={severityFilter === 'error'}
              title="Show Errors only"
            >
              <span className="problems-dot problems-dot--error" aria-hidden="true" />
              Errors ({totalErrors})
            </button>
            <button
              type="button"
              className={`problems-filter-btn${severityFilter === 'warning' ? ' problems-filter-btn--active' : ''}`}
              onClick={() => setSeverityFilter('warning')}
              role="radio"
              aria-checked={severityFilter === 'warning'}
              title="Show Warnings only"
            >
              <span className="problems-dot problems-dot--warning" aria-hidden="true" />
              Warnings ({totalWarnings})
            </button>
            {totalInfo > 0 ? (
              <button
                type="button"
                className={`problems-filter-btn${severityFilter === 'info' ? ' problems-filter-btn--active' : ''}`}
                onClick={() => setSeverityFilter('info')}
                role="radio"
                aria-checked={severityFilter === 'info'}
                title="Show Info and Hints"
              >
                <span className="problems-dot problems-dot--info" aria-hidden="true" />
                Info ({totalInfo})
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Problems Content */}
      <div className="problems-panel__content">
        {problems.length === 0 ? (
          <div className="problems-panel__empty" role="status">
            <span className="problems-panel__empty-icon" aria-hidden="true">
              ✓
            </span>
            <h4 className="problems-panel__empty-title">No problems detected</h4>
            <p className="problems-panel__empty-description">
              Monaco Editor has not detected any syntax or diagnostic errors in the opened files.
            </p>
            <p className="problems-panel__empty-hint">
              Tip: Built-in diagnostics are provided for JavaScript, TypeScript, JSON, CSS, and HTML.
            </p>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="problems-panel__empty" role="status">
            <span className="problems-panel__empty-icon" aria-hidden="true">
              🔍
            </span>
            <h4 className="problems-panel__empty-title">No matching problems</h4>
            <p className="problems-panel__empty-description">
              No problems match your current search or filter criteria.
            </p>
            <button
              type="button"
              className="problems-panel__reset-btn"
              onClick={() => {
                setFilterText('')
                setScope('all')
                setSeverityFilter('all')
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <ul className="problems-panel__list" role="list" aria-label="Problems list">
            {filteredProblems.map((problem) => {
              const isError = problem.severityCode === 8
              const isWarning = problem.severityCode === 4
              const isInfo = problem.severityCode === 2

              const severityClass = isError
                ? 'problem-item__severity--error'
                : isWarning
                ? 'problem-item__severity--warning'
                : isInfo
                ? 'problem-item__severity--info'
                : 'problem-item__severity--hint'

              const severityIcon = isError ? '⛔' : isWarning ? '⚠️' : isInfo ? 'ℹ️' : '💡'

              return (
                <li
                  key={problem.id}
                  className="problem-item"
                  role="listitem"
                  tabIndex={0}
                  onClick={() => onNavigateToProblem?.(problem)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onNavigateToProblem?.(problem)
                    }
                  }}
                  title={`Click to jump to ${problem.fileName} line ${problem.lineNumber}, column ${problem.columnNumber}`}
                >
                  <div className="problem-item__header">
                    <span className={`problem-item__severity ${severityClass}`}>
                      <span className="problem-item__icon" aria-hidden="true">
                        {severityIcon}
                      </span>
                      <span>{problem.severityLabel}</span>
                    </span>

                    <span className="problem-item__message">{problem.message}</span>
                  </div>

                  <div className="problem-item__meta">
                    <span className="problem-item__badge problem-item__file" title={`File: ${problem.fileName}`}>
                      📄 {problem.fileName}
                    </span>

                    <span
                      className="problem-item__badge problem-item__location"
                      title={`Line ${problem.lineNumber}, Column ${problem.columnNumber}`}
                    >
                      Ln {problem.lineNumber}, Col {problem.columnNumber}
                    </span>

                    {problem.source ? (
                      <span className="problem-item__badge problem-item__source" title={`Source: ${problem.source}`}>
                        [{problem.source}]
                      </span>
                    ) : null}
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

export default ProblemsPanel
