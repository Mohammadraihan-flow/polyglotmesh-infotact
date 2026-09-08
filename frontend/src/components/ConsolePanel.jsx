import React, { useEffect, useMemo, useState } from 'react'
import ProblemsPanel from './ProblemsPanel.jsx'
import ReferencesPanel from './ReferencesPanel.jsx'

function ConsolePanel({
  message,
  isRunning,
  activeFile,
  files = [],
  onSelectFile,
  problems = [],
  references = [],
  referenceSymbol = '',
  isLoadingReferences = false,
  onClearReferences,
  activeTab: controlledTab,
  onTabChange,
  onNavigateToProblem: customNavigate,
  onNavigateToReference: customNavigateReference,
}) {
  const [internalTab, setInternalTab] = useState('console')
  const currentTab = controlledTab !== undefined ? controlledTab : internalTab

  const handleTabChange = React.useCallback(
    (tab) => {
      if (onTabChange) {
        onTabChange(tab)
      } else {
        setInternalTab(tab)
      }
    },
    [onTabChange],
  )

  useEffect(() => {
    const handleShowProblems = () => handleTabChange('problems')
    const handleShowConsole = () => handleTabChange('console')
    const handleShowReferences = () => handleTabChange('references')
    const handleToggleProblems = () => {
      handleTabChange(currentTab === 'problems' ? 'console' : 'problems')
    }
    const handleToggleReferences = () => {
      handleTabChange(currentTab === 'references' ? 'console' : 'references')
    }

    window.addEventListener('polyglotmesh:show-problems', handleShowProblems)
    window.addEventListener('polyglotmesh:show-console', handleShowConsole)
    window.addEventListener('polyglotmesh:show-references', handleShowReferences)
    window.addEventListener('polyglotmesh:toggle-problems', handleToggleProblems)
    window.addEventListener('polyglotmesh:toggle-references', handleToggleReferences)

    return () => {
      window.removeEventListener('polyglotmesh:show-problems', handleShowProblems)
      window.removeEventListener('polyglotmesh:show-console', handleShowConsole)
      window.removeEventListener('polyglotmesh:show-references', handleShowReferences)
      window.removeEventListener('polyglotmesh:toggle-problems', handleToggleProblems)
      window.removeEventListener('polyglotmesh:toggle-references', handleToggleReferences)
    }
  }, [currentTab, handleTabChange])

  const { errorCount, warningCount, totalProblems } = useMemo(() => {
    let errs = 0
    let warns = 0
    for (let i = 0; i < problems.length; i++) {
      if (problems[i].severityCode === 8) errs++
      else if (problems[i].severityCode === 4) warns++
    }
    return { errorCount: errs, warningCount: warns, totalProblems: problems.length }
  }, [problems])
  const totalReferences = references.length

  const handleNavigateToProblem = (problem) => {
    if (customNavigate) {
      customNavigate(problem)
      return
    }

    if (!problem) return

    // 1. Switch file if problem belongs to another open file
    if (problem.fileName && (!activeFile || activeFile.name !== problem.fileName)) {
      const targetFile = files.find((f) => f.name === problem.fileName)
      if (targetFile && onSelectFile) {
        onSelectFile(targetFile)
      }
    }

    // 2. Position cursor and reveal line in Monaco Editor
    const jumpToLocation = () => {
      if (typeof window !== 'undefined' && window.monaco) {
        const editors = window.monaco.editor.getEditors()
        const activeEditor = editors && editors[0]
        if (activeEditor) {
          const line = Number(problem.lineNumber) || 1
          const col = Number(problem.columnNumber) || 1
          activeEditor.setPosition({ lineNumber: line, column: col })
          activeEditor.revealPositionInCenterIfOutsideViewport({ lineNumber: line, column: col })
          activeEditor.focus()
        }
      }
    }

    jumpToLocation()
    setTimeout(jumpToLocation, 60)
    setTimeout(jumpToLocation, 180)
  }

  const handleNavigateToReference = (ref) => {
    if (customNavigateReference) {
      customNavigateReference(ref)
      return
    }

    if (!ref) return

    // 1. Switch file if reference belongs to another file
    if (ref.targetFileName && (!activeFile || activeFile.name !== ref.targetFileName)) {
      const targetFile = files.find((f) => f.name === ref.targetFileName)
      if (targetFile && onSelectFile) {
        onSelectFile(targetFile)
      }
    }

    // 2. Position cursor and highlight reference range in Monaco
    const jumpToLocation = () => {
      if (typeof window !== 'undefined' && window.monaco) {
        const editors = window.monaco.editor.getEditors()
        const activeEditor = editors && editors[0]
        if (activeEditor) {
          const startLine = Number(ref.lineNumber) || 1
          const startCol = Number(ref.columnNumber) || 1
          const endLine = Number(ref.endLineNumber) || startLine
          const endCol = Number(ref.endColumnNumber) || startCol + (referenceSymbol ? referenceSymbol.length : 1)

          activeEditor.setPosition({ lineNumber: startLine, column: startCol })
          activeEditor.setSelection({
            startLineNumber: startLine,
            startColumn: startCol,
            endLineNumber: endLine,
            endColumn: endCol,
          })
          activeEditor.revealPositionInCenterIfOutsideViewport({ lineNumber: startLine, column: startCol })
          activeEditor.focus()
        }
      }
    }

    jumpToLocation()
    setTimeout(jumpToLocation, 60)
    setTimeout(jumpToLocation, 180)
  }

  return (
    <section className="console-panel" aria-labelledby="bottom-panel-title">
      <div className="panel-heading panel-heading--console">
        <div className="panel-tabs" role="tablist" aria-label="Bottom panel tabs">
          <button
            type="button"
            role="tab"
            id="tab-console"
            aria-controls="panel-console-content"
            aria-selected={currentTab === 'console'}
            className={`panel-tab${currentTab === 'console' ? ' panel-tab--active' : ''}`}
            onClick={() => handleTabChange('console')}
          >
            <span className="panel-tab__icon" aria-hidden="true">
              🖥️
            </span>
            <span className="panel-tab__title">Console Output</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-problems"
            aria-controls="panel-problems-content"
            aria-selected={currentTab === 'problems'}
            className={`panel-tab${currentTab === 'problems' ? ' panel-tab--active' : ''}`}
            onClick={() => handleTabChange('problems')}
            title="Toggle Problems / Diagnostics (Ctrl+Shift+M)"
          >
            <span className="panel-tab__icon" aria-hidden="true">
              ⚠️
            </span>
            <span className="panel-tab__title">Problems</span>
            {totalProblems > 0 ? (
              <span className="panel-tab__badge-group" aria-label={`${totalProblems} problems`}>
                {errorCount > 0 ? (
                  <span className="panel-tab__count-chip panel-tab__count-chip--error" title={`${errorCount} errors`}>
                    ⛔ {errorCount}
                  </span>
                ) : null}
                {warningCount > 0 ? (
                  <span className="panel-tab__count-chip panel-tab__count-chip--warning" title={`${warningCount} warnings`}>
                    ⚠️ {warningCount}
                  </span>
                ) : null}
                {errorCount === 0 && warningCount === 0 ? (
                  <span className="panel-tab__count-chip panel-tab__count-chip--info">
                    {totalProblems}
                  </span>
                ) : null}
              </span>
            ) : (
              <span className="panel-tab__count-chip panel-tab__count-chip--zero">0</span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            id="tab-references"
            aria-controls="panel-references-content"
            aria-selected={currentTab === 'references'}
            className={`panel-tab${currentTab === 'references' ? ' panel-tab--active' : ''}`}
            onClick={() => handleTabChange('references')}
            title="Find All References (Shift+F12)"
          >
            <span className="panel-tab__icon" aria-hidden="true">
              🔍
            </span>
            <span className="panel-tab__title">References</span>
            {totalReferences > 0 ? (
              <span className="panel-tab__count-chip panel-tab__count-chip--info" title={`${totalReferences} references`}>
                {totalReferences}
              </span>
            ) : null}
          </button>
        </div>

        {currentTab === 'console' ? (
          <div className="status-chip" aria-label="Console status">
            <span className={`status-dot${isRunning ? '' : ' status-dot--ready'}`} aria-hidden="true" />
            {isRunning ? 'Running' : 'Ready'}
          </div>
        ) : currentTab === 'problems' ? (
          <div className="problems-panel__summary-chip" aria-label="Problem summary status">
            {totalProblems === 0 ? (
              <span className="problems-summary--clean">✓ No problems</span>
            ) : (
              <span className="problems-summary--counts">
                {errorCount > 0 ? `${errorCount} ${errorCount === 1 ? 'error' : 'errors'}` : ''}
                {errorCount > 0 && warningCount > 0 ? ', ' : ''}
                {warningCount > 0 ? `${warningCount} ${warningCount === 1 ? 'warning' : 'warnings'}` : ''}
                {errorCount === 0 && warningCount === 0 ? `${totalProblems} items` : ''}
              </span>
            )}
          </div>
        ) : (
          <div className="references-panel__summary-chip" aria-label="References status">
            {totalReferences > 0 ? (
              <span className="references-summary--active">
                {referenceSymbol ? `Symbol: ${referenceSymbol}` : `${totalReferences} references`}
              </span>
            ) : (
              <span className="references-summary--clean">No active search</span>
            )}
          </div>
        )}
      </div>

      {currentTab === 'console' ? (
        <div
          id="panel-console-content"
          role="tabpanel"
          aria-labelledby="tab-console"
          className="console-panel__output"
          aria-live="polite"
        >
          <p className="console-panel__message">{message}</p>
          <p className="console-panel__hint">The current run state is simulated in the frontend only.</p>
        </div>
      ) : currentTab === 'problems' ? (
        <div
          id="panel-problems-content"
          role="tabpanel"
          aria-labelledby="tab-problems"
          className="console-panel__problems-wrapper"
        >
          <ProblemsPanel
            problems={problems}
            activeFile={activeFile}
            onNavigateToProblem={handleNavigateToProblem}
          />
        </div>
      ) : (
        <div
          id="panel-references-content"
          role="tabpanel"
          aria-labelledby="tab-references"
          className="console-panel__references-wrapper"
        >
          <ReferencesPanel
            references={references}
            symbolName={referenceSymbol}
            isLoading={isLoadingReferences}
            onNavigateToReference={handleNavigateToReference}
            onClear={onClearReferences}
            activeFile={activeFile}
          />
        </div>
      )}
    </section>
  )
}

export default React.memo(ConsolePanel)