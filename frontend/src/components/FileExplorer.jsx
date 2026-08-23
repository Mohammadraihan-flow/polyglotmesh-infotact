import React, { useEffect, useRef, useState } from 'react'
import { getExtension, getLanguageLabelFromFileName } from '../utils/languageUtils.js'
import FileIcon from './FileIcon.jsx'

function FileExplorer({
  files = [],
  activeFileName,
  recentFileNames = [],
  onSelectFile,
  onRenameFile,
  onDeleteFile,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [renamingFileName, setRenamingFileName] = useState(null)
  const [renameInput, setRenameInput] = useState('')
  const [renameError, setRenameError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (renamingFileName) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [renamingFileName])

  const handleStartRename = (fileName) => {
    setRenamingFileName(fileName)
    setRenameInput(fileName)
    setRenameError('')
  }

  const handleCancelRename = () => {
    setRenamingFileName(null)
    setRenameInput('')
    setRenameError('')
  }

  const handleConfirmRename = (oldFileName) => {
    if (!onRenameFile) {
      handleCancelRename()
      return
    }

    const result = onRenameFile(oldFileName, renameInput)
    if (!result?.success) {
      setRenameError(result?.message ?? 'Rename failed.')
      return
    }

    handleCancelRename()
  }

  const trimmedQuery = searchQuery.trim().toLowerCase()
  const filteredFiles = trimmedQuery
    ? files.filter((file) => file.name.toLowerCase().includes(trimmedQuery))
    : files

  const validRecentFiles = (recentFileNames || [])
    .map((name) => files.find((file) => file.name === name))
    .filter(Boolean)

  return (
    <div className="file-explorer" aria-label="Project File Explorer">
      <div className="file-explorer__header">
        <p className="file-explorer__eyebrow">POLYGLOTMESH</p>
        <h3 className="file-explorer__title">Files</h3>
        <div className="file-explorer__search-wrapper">
          <span className="file-explorer__search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            type="text"
            className="file-explorer__search-input"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search files"
            autoComplete="off"
            spellCheck="false"
          />
          {searchQuery ? (
            <button
              type="button"
              className="file-explorer__search-clear"
              aria-label="Clear search"
              title="Clear search"
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          ) : null}
        </div>
      </div>

      <div className="file-explorer__tree" role="tree" aria-label="Project files list">
        {files.length === 0 ? (
          <p className="file-explorer__empty">No files created</p>
        ) : filteredFiles.length === 0 ? (
          <p className="file-explorer__empty">No matching files</p>
        ) : (
          filteredFiles.map((file) => {
            const isActive = file.name === activeFileName
            const isRenaming = file.name === renamingFileName
            const ext = isRenaming ? getExtension(renameInput) : getExtension(file.name)

            if (isRenaming) {
              return (
                <form
                  key={file.name}
                  className="file-explorer__rename-form"
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleConfirmRename(file.name)
                  }}
                >
                  <div className="file-explorer__rename-row">
                    <span className="file-explorer__icon" aria-hidden="true">
                      <FileIcon extension={ext} />
                    </span>
                    <input
                      ref={inputRef}
                      type="text"
                      className="file-explorer__rename-input"
                      value={renameInput}
                      onChange={(e) => {
                        setRenameInput(e.target.value)
                        if (renameError) setRenameError('')
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          e.stopPropagation()
                          handleCancelRename()
                        }
                      }}
                      autoComplete="off"
                      spellCheck="false"
                    />
                    <button type="submit" className="file-explorer__action-btn" title="Confirm rename">
                      ✓
                    </button>
                    <button
                      type="button"
                      className="file-explorer__action-btn"
                      onClick={handleCancelRename}
                      title="Cancel rename"
                    >
                      ✕
                    </button>
                  </div>
                  {renameError ? <p className="file-explorer__rename-error">{renameError}</p> : null}
                </form>
              )
            }

            return (
              <div
                key={file.name}
                role="treeitem"
                aria-selected={isActive}
                className={`file-explorer__item${isActive ? ' file-explorer__item--active' : ''}`}
                onClick={() => onSelectFile?.(file.name)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  handleStartRename(file.name)
                }}
                title={file.name}
              >
                <span className="file-explorer__icon" aria-hidden="true">
                  <FileIcon extension={ext} />
                </span>
                <span className="file-explorer__name">{file.name}</span>
                {file.isDirty ? (
                  <span className="file-explorer__dirty-dot" title="Unsaved changes">
                    ●
                  </span>
                ) : null}

                <div className="file-explorer__actions">
                  <button
                    type="button"
                    className="file-explorer__action-btn file-explorer__action-btn--rename"
                    aria-label={`Rename ${file.name}`}
                    title="Rename file"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartRename(file.name)
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="file-explorer__action-btn file-explorer__action-btn--delete"
                    aria-label={`Delete ${file.name}`}
                    title="Delete file"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteFile?.(file.name)
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="file-explorer__recent-section" aria-label="Recent files">
        <h4 className="file-explorer__recent-title">Recent Files</h4>
        {validRecentFiles.length === 0 ? (
          <p className="file-explorer__recent-empty">No recent files</p>
        ) : (
          <div className="file-explorer__recent-list">
            {validRecentFiles.map((file) => {
              const isActive = file.name === activeFileName
              const lang = getLanguageLabelFromFileName(file.name)
              return (
                <div
                  key={`recent-${file.name}`}
                  role="button"
                  tabIndex={0}
                  className={`file-explorer__item file-explorer__recent-item${
                    isActive ? ' file-explorer__item--active' : ''
                  }`}
                  onClick={() => onSelectFile?.(file.name)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectFile?.(file.name)
                    }
                  }}
                  title={`Open ${file.name}`}
                >
                  <span className="file-explorer__icon" aria-hidden="true">
                    <FileIcon fileName={file.name} size={15} />
                  </span>
                  <span className="file-explorer__name">{file.name}</span>
                  <span className="file-explorer__recent-lang">{lang}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default FileExplorer

