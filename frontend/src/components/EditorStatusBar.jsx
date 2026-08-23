import React, { useEffect, useState } from 'react'
import { getLanguageLabelFromFileName } from '../utils/languageUtils.js'

function EditorStatusBar({ editor, activeFile, editorSettings, saveMessage }) {
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 })
  const [lineCount, setLineCount] = useState(1)
  const [charCount, setCharCount] = useState(0)
  const [selectionStats, setSelectionStats] = useState(null)

  useEffect(() => {
    if (!editor || !activeFile) {
      setSelectionStats(null)
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

      const selection = editor.getSelection()
      const model = editor.getModel()
      if (selection && !selection.isEmpty() && model) {
        const selectedText = model.getValueInRange(selection)
        const selectedLineCount = Math.abs(selection.endLineNumber - selection.startLineNumber) + 1
        const selectedCharCount = selectedText.length
        setSelectionStats({
          selectedLineCount,
          selectedCharCount,
        })
      } else {
        setSelectionStats(null)
      }
    }

    updateModelStats()
    updateCursorAndSelection()

    const selectionListener = editor.onDidChangeCursorSelection((e) => {
      if (e.selection) {
        const position = editor.getPosition()
        if (position) {
          setCursorPos({ line: position.lineNumber, column: position.column })
        }
        const model = editor.getModel()
        if (e.selection && !e.selection.isEmpty() && model) {
          const selectedText = model.getValueInRange(e.selection)
          const selectedLineCount = Math.abs(e.selection.endLineNumber - e.selection.startLineNumber) + 1
          const selectedCharCount = selectedText.length
          setSelectionStats({
            selectedLineCount,
            selectedCharCount,
          })
        } else {
          setSelectionStats(null)
        }
      }
    })

    const contentListener = editor.onDidChangeModelContent(() => {
      updateModelStats()
      updateCursorAndSelection()
    })

    return () => {
      selectionListener.dispose()
      contentListener.dispose()
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

  return (
    <footer className="editor-status-bar" aria-label="Editor status bar">
      <div className="editor-status-bar__left">
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

