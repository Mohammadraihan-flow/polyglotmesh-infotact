import React, { useEffect, useRef, useState } from 'react'
import FileIcon from './FileIcon.jsx'

function EditorTabs({ openFiles = [], activeFileName, onSelectFile, onCloseTab, onCreateFile }) {
  const [isCreatingFile, setIsCreatingFile] = useState(false)
  const [fileName, setFileName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const activeTabRef = useRef(null)

  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      })
    }
  }, [activeFileName])

  const handleOpenCreate = () => {
    setIsCreatingFile(true)
    setFileName('')
    setErrorMessage('')
  }

  const handleCancelCreate = () => {
    setIsCreatingFile(false)
    setFileName('')
    setErrorMessage('')
  }

  const handleCreateSubmit = (event) => {
    event.preventDefault()

    const result = onCreateFile(fileName)

    if (!result?.success) {
      setErrorMessage(result?.message ?? 'Enter a valid file name.')
      return
    }

    setIsCreatingFile(false)
    setFileName('')
    setErrorMessage('')
  }

  return (
    <div className="editor-tabs__shell">
      <div className="editor-tabs__header">
        <div className="editor-tabs" role="tablist" aria-label="Editor file tabs">
          {openFiles.map((file) => {
            const isActive = file.name === activeFileName

            return (
              <div
                key={file.name}
                ref={isActive ? activeTabRef : null}
                className={`editor-tabs__tab-shell${
                  isActive ? ' editor-tabs__tab-shell--active' : ''
                }`}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`editor-tabs__tab${isActive ? ' editor-tabs__tab--active' : ''}`}
                  onClick={() => onSelectFile(file.name)}
                  title={file.name}
                >
                  <span className="editor-tabs__tab-icon" aria-hidden="true">
                    <FileIcon fileName={file.name} size={15} />
                  </span>
                  <span className="editor-tabs__tab-name">{file.name}</span>
                  {file.isReadOnly ? (
                    <span
                      className="editor-tabs__readonly-badge"
                      title={`${file.name} is in Read-Only Preview Mode`}
                      aria-label="Read-Only"
                    >
                      🔒
                    </span>
                  ) : null}
                  {file.isDirty ? (
                    <span className="editor-tabs__dirty-dot" title="Unsaved changes">
                      ●
                    </span>
                  ) : null}
                </button>


                <button
                  type="button"
                  className="editor-tabs__close-button"
                  aria-label={`Close ${file.name} tab`}
                  title="Close tab"
                  onClick={(e) => {
                    e.stopPropagation()
                    onCloseTab?.(file.name)
                  }}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          className="editor-tabs__create-button"
          aria-label="Create new file"
          title="Create new file"
          onClick={handleOpenCreate}
        >
          +
        </button>
      </div>

      {isCreatingFile ? (
        <form className="editor-tabs__create-panel" onSubmit={handleCreateSubmit}>
          <label className="editor-tabs__create-label" htmlFor="new-file-name">
            New file name
          </label>
          <div className="editor-tabs__create-row">
            <input
              id="new-file-name"
              className="editor-tabs__create-input"
              type="text"
              value={fileName}
              placeholder="test.js"
              autoComplete="off"
              spellCheck="false"
              onChange={(event) => {
                setFileName(event.target.value)
                if (errorMessage) {
                  setErrorMessage('')
                }
              }}
            />

            <button type="submit" className="editor-tabs__create-confirm">
              Create
            </button>
            <button
              type="button"
              className="editor-tabs__create-cancel"
              onClick={handleCancelCreate}
            >
              Cancel
            </button>
          </div>

          <p className="editor-tabs__create-hint">
            Use a filename like `program.py` or `main.cpp`.
          </p>
          {errorMessage ? <p className="editor-tabs__create-error">{errorMessage}</p> : null}
        </form>
      ) : null}
    </div>
  )
}

export default React.memo(EditorTabs)