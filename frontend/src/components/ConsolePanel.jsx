import { useEffect, useState } from 'react'
import ProblemsPanel from './ProblemsPanel.jsx'

function ConsolePanel({
  message,
  isRunning,
  activeFile,
  files = [],
  onSelectFile,
  problems = [],
  activeTab: controlledTab,
  onTabChange,
  onNavigateToProblem: customNavigate,
}) {
  const [internalTab, setInternalTab] = useState('console')
  const currentTab = controlledTab !== undefined ? controlledTab : internalTab

  const handleTabChange = (tab) => {
    if (onTabChange) {
      onTabChange(tab)
    } else {
      setInternalTab(tab)
    }
  }

  useEffect(() => {
    const handleShowProblems = () => handleTabChange('problems')
    const handleShowConsole = () => handleTabChange('console')
    const handleToggleProblems = () => {
      handleTabChange(currentTab === 'problems' ? 'console' : 'problems')
    }

    window.addEventListener('polyglotmesh:show-problems', handleShowProblems)
    window.addEventListener('polyglotmesh:show-console', handleShowConsole)
    window.addEventListener('polyglotmesh:toggle-problems', handleToggleProblems)

    return () => {
      window.removeEventListener('polyglotmesh:show-problems', handleShowProblems)
      window.removeEventListener('polyglotmesh:show-console', handleShowConsole)
      window.removeEventListener('polyglotmesh:toggle-problems', handleToggleProblems)
    }
  }, [currentTab])

  const errorCount = problems.filter((p) => p.severityCode === 8).length
  const warningCount = problems.filter((p) => p.severityCode === 4).length
  const totalProblems = problems.length

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
        </div>

        {currentTab === 'console' ? (
          <div className="status-chip" aria-label="Console status">
            <span className={`status-dot${isRunning ? '' : ' status-dot--ready'}`} aria-hidden="true" />
            {isRunning ? 'Running' : 'Ready'}
          </div>
        ) : (
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
      ) : (
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
      )}
    </section>
  )
}

export default ConsolePanel