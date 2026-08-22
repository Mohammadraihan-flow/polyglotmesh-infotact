import React, { useEffect, useState } from 'react'
import { getLanguageLabelFromFileName } from '../utils/languageUtils.js'

function EditorStatusBar({ editor, activeFile, editorSettings, saveMessage }) {
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 })
  const [lineCount, setLineCount] = useState(1)
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    if (!editor || !activeFile) return

    const updateModelStats = () => {
      const model = editor.getModel()
      if (model) {
        setLineCount(model.getLineCount())
        setCharCount(model.getValueLength())
      }
    }

    const updateCursorPos = () => {
      const position = editor.getPosition()
      if (position) {
        setCursorPos({ line: position.lineNumber, column: position.column })
      }
    }

    updateModelStats()
    updateCursorPos()

    const cursorListener = editor.onDidChangeCursorPosition((e) => {
      if (e.position) {
        setCursorPos({ line: e.position.lineNumber, column: e.position.column })
      }
    })

    const contentListener = editor.onDidChangeModelContent(() => {
      updateModelStats()
    })

    return () => {
      cursorListener.dispose()
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
        <span className="editor-status-bar__divider" aria-hidden="true">
          |
        </span>
        <span className="editor-status-bar__item editor-status-bar__item--lines">
          {lineCount} {lineCount === 1 ? 'line' : 'lines'}
        </span>
        <span className="editor-status-bar__divider" aria-hidden="true">
          |
        </span>
        <span className="editor-status-bar__item editor-status-bar__item--chars">
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
