import { useEffect, useState } from 'react'
import { getLanguageLabelFromFileName } from '../utils/languageUtils.js'

function EditorStatusBar({ editor, activeFile, editorSettings, saveMessage, problems = [] }) {
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 })
  const [lineCount, setLineCount] = useState(1)
  const [charCount, setCharCount] = useState(0)
  const [selectionStats, setSelectionStats] = useState(null)

  useEffect(() => {
    if (!editor || !activeFile) {
      return
    }

    const updateModelStats = () => {
      const model = editor.getModel()
      if (model) {
        setLineCount(model.getLineCount())
        setCharCount(model.getValueLength())
      }
    }

    const updateCursorAndSelection = () => {
      const position = editor.getPosition()
      if (position) {
        setCursorPos({ line: position.lineNumber, column: position.column })
      }

      const selections = editor.getSelections()
      const primarySelection = editor.getSelection()
      const model = editor.getModel()

      if (selections && selections.length > 1 && model) {
        let totalChars = 0
        let totalLines = 0
        selections.forEach((sel) => {
          if (!sel.isEmpty()) {
            totalChars += model.getValueInRange(sel).length
            totalLines += Math.abs(sel.endLineNumber - sel.startLineNumber) + 1
          }
        })
        setSelectionStats({
          selectedLineCount: totalLines,
          selectedCharCount: totalChars,
          multiCursorCount: selections.length,
        })
      } else if (primarySelection && !primarySelection.isEmpty() && model) {
        const selectedText = model.getValueInRange(primarySelection)
        const selectedLineCount = Math.abs(primarySelection.endLineNumber - primarySelection.startLineNumber) + 1
        const selectedCharCount = selectedText.length
        setSelectionStats({
          selectedLineCount,
          selectedCharCount,
          multiCursorCount: 0,
        })
      } else {
        setSelectionStats(null)
      }
    }

    updateModelStats()
    updateCursorAndSelection()

    const selectionListener = editor.onDidChangeCursorSelection(() => {
      updateCursorAndSelection()
    })

    const contentListener = editor.onDidChangeModelContent(() => {
      updateModelStats()
      updateCursorAndSelection()
    })

    return () => {
      selectionListener.dispose()
      contentListener.dispose()
      setSelectionStats(null)
    }
  }, [editor, activeFile])

  if (!activeFile) return null

  const languageLabel = activeFile.label || getLanguageLabelFromFileName(activeFile.name)

  let currentSaveState = 'Saved'
  if (saveMessage && saveMessage.toLowerCase().includes('saving')) {
    currentSaveState = 'Saving...'
  } else if (activeFile.isDirty) {
    currentSaveState = 'Unsaved'
  }

  const validTabSizes = [2, 4, 8]
  const parsedTabSize = Number(editorSettings?.tabSize)
  const tabSize = validTabSizes.includes(parsedTabSize) ? parsedTabSize : 4

  const errorCount = problems.filter((p) => p.severityCode === 8).length
  const warningCount = problems.filter((p) => p.severityCode === 4).length

  return (
    <footer className="editor-status-bar" aria-label="Editor status bar">
      <div className="editor-status-bar__left">
        <button
          type="button"
          className="editor-status-bar__item editor-status-bar__item--problems"
          onClick={() => window.dispatchEvent(new CustomEvent('polyglotmesh:toggle-problems'))}
          title="Toggle Problems Panel (Ctrl+Shift+M)"
          aria-label={`Problems: ${errorCount} errors, ${warningCount} warnings`}
        >
          {problems.length > 0 ? (
            <>
              {errorCount > 0 ? (
                <span className="status-bar-error">⛔ {errorCount}</span>
              ) : null}
              {warningCount > 0 ? (
                <span className="status-bar-warning">⚠️ {warningCount}</span>
              ) : null}
              {errorCount === 0 && warningCount === 0 ? (
                <span className="status-bar-info">ℹ️ {problems.length}</span>
              ) : null}
            </>
          ) : (
            <span className="status-bar-clean">✓ 0</span>
          )}
        </button>
        <span className="editor-status-bar__divider" aria-hidden="true">
          |
        </span>
        <span className="editor-status-bar__item editor-status-bar__item--language">
          {languageLabel}
        </span>
        <span className="editor-status-bar__divider" aria-hidden="true">
          |
        </span>
        <span className="editor-status-bar__item editor-status-bar__item--cursor">
          Ln {cursorPos.line}, Col {cursorPos.column}
        </span>
        {selectionStats ? (
          <>
            <span className="editor-status-bar__divider" aria-hidden="true">
              |
            </span>
            {selectionStats.multiCursorCount > 1 ? (
              <>
                <span className="editor-status-bar__item editor-status-bar__item--multicursor">
                  {selectionStats.multiCursorCount} cursors
                </span>
                <span className="editor-status-bar__divider" aria-hidden="true">
                  |
                </span>
              </>
            ) : null}
            <span className="editor-status-bar__item editor-status-bar__item--selection-lines">
              {selectionStats.selectedLineCount} {selectionStats.selectedLineCount === 1 ? 'line selected' : 'lines selected'}
            </span>
            <span className="editor-status-bar__divider" aria-hidden="true">
              |
            </span>
            <span className="editor-status-bar__item editor-status-bar__item--selection-chars">
              {selectionStats.selectedCharCount} {selectionStats.selectedCharCount === 1 ? 'character' : 'characters'}
            </span>
          </>
        ) : null}
        <span className="editor-status-bar__divider editor-status-bar__divider--secondary" aria-hidden="true">
          |
        </span>
        <span className="editor-status-bar__item editor-status-bar__item--lines editor-status-bar__item--secondary">
          {lineCount} {lineCount === 1 ? 'line' : 'lines'}
        </span>
        <span className="editor-status-bar__divider editor-status-bar__divider--secondary" aria-hidden="true">
          |
        </span>
        <span className="editor-status-bar__item editor-status-bar__item--chars editor-status-bar__item--secondary">
          {charCount} {charCount === 1 ? 'char' : 'chars'}
        </span>
      </div>

      <div className="editor-status-bar__right">
        <span
          className={`editor-status-bar__item editor-status-bar__item--status ${
            currentSaveState === 'Saving...' ? 'editor-status-bar__item--saving' : ''
          }`}
        >
          {currentSaveState}
        </span>
        <span className="editor-status-bar__divider" aria-hidden="true">
          |
        </span>
        <span className="editor-status-bar__item editor-status-bar__item--tabsize">
          Spaces: {tabSize}
        </span>
      </div>
    </footer>
  )
}

export default EditorStatusBar

