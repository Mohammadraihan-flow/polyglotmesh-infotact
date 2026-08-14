import React, { useEffect, useRef, useState } from 'react'

function getFileExtension(fileName) {
  const trimmed = fileName.trim()
  const dotIndex = trimmed.lastIndexOf('.')
  if (dotIndex <= 0 || dotIndex === trimmed.length - 1) {
    return ''
  }
  return trimmed.slice(dotIndex + 1).toLowerCase()
}

function FileIcon({ extension }) {
  switch (extension) {
    case 'js':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#F7DF1E" />
          <path d="M12 11.5v6.2c0 1.9-1.1 2.8-2.6 2.8-1.4 0-2.3-.8-2.7-1.8l1.7-1c.2.5.6.9 1.1.9.7 0 1-.4 1-1.3v-5.8H12zm5.5 0c1.7 0 2.8.9 3.2 1.9l-1.6 1c-.3-.5-.7-.9-1.5-.9-.8 0-1.3.4-1.3 1 0 .6.4.9 1.6 1.4 2.2.9 3.1 1.7 3.1 3.2 0 1.8-1.4 3-3.6 3-2.1 0-3.3-1.1-3.8-2.3l1.7-1c.3.7.9 1.3 2 1.3 1 0 1.6-.5 1.6-1.1 0-.7-.4-1-1.8-1.5-2.1-.8-2.9-1.7-2.9-3.1 0-1.7 1.4-2.9 3.5-2.9z" fill="#000000" />
        </svg>
      )
    case 'py':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.8 2c-5.1 0-4.8 2.2-4.8 2.2l.1 2.3h4.8v.7H5.2S2 6.8 2 12c0 5.1 2.8 4.9 2.8 4.9h1.7v-2.4s-.1-2.9 2.9-2.9h4.9s2.8 0 2.8-2.7V6.1s.4-4.1-5.3-4.1zm-2.6 1.5a.9.9 0 110 1.8.9.9 0 010-1.8z" fill="#3776AB" />
          <path d="M12.2 22c5.1 0 4.8-2.2 4.8-2.2l-.1-2.3h-4.8v-.7h6.7s3.2.4 3.2-4.8c0-5.1-2.8-4.9-2.8-4.9h-1.7v2.4s.1 2.9-2.9 2.9h-4.9s-2.8 0-2.8 2.7v4.8s-.4 4.1 5.3 4.1zm2.6-1.5a.9.9 0 110-1.8.9.9 0 010 1.8z" fill="#FFD43B" />
        </svg>
      )
    case 'java':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.5 19.5c3.5 1.2 9.5 1.2 13 0M6 21.5c3 1 7.5 1 10.5 0" stroke="#E76F51" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 3c-1.5 2-2 3.5-1 5 1.5 2.2-1 3.8-2.5 5M15 5c-1.5 1.8-1.8 3-1 4.2 1.2 1.8-1 3-2 4.3" stroke="#F4A261" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'c':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#A8B9CC" />
          <path d="M16 8.5c-.8-.7-1.9-1.1-3.2-1.1-2.8 0-4.8 2.1-4.8 4.8s2 4.8 4.8 4.8c1.3 0 2.4-.4 3.2-1.1v-2.1h-3.2v-1.6H16v4.3z" fill="#1E1E1E" />
        </svg>
      )
    case 'cpp':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#00599C" />
          <path d="M10 8.5c-.7-.6-1.6-.9-2.6-.9-2.2 0-3.9 1.7-3.9 3.9s1.7 3.9 3.9 3.9c1 0 1.9-.3 2.6-.9" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M13 11.5h3M14.5 10v3M18 11.5h3M19.5 10v3" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'h':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#685987" />
          <path d="M7 6v12M17 6v12M7 12h10" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'json':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#F59E0B" />
          <path d="M8 7c-1 0-1.5.5-1.5 1.5v2c0 .8-.5 1.2-1.2 1.5.7.3 1.2.7 1.2 1.5v2c0 1 .5 1.5 1.5 1.5M16 7c1 0 1.5.5 1.5 1.5v2c0 .8.5 1.2 1.2 1.5-.7.3-1.2.7-1.2 1.5v2c0 1-.5 1.5-1.5 1.5" stroke="#1E1E1E" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'html':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.5 3l1.4 15.6L12 21l6.1-2.4L19.5 3H4.5z" fill="#E44D26" />
          <path d="M12 4.7v14.6l4.9-1.9L18.1 4.7H12z" fill="#F16529" />
          <path d="M8 7.5h8l-.3 3H8.3l.3 3h7.1l-.5 5-3.2 1-3.2-1-.2-2.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'css':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.5 3l1.4 15.6L12 21l6.1-2.4L19.5 3H4.5z" fill="#264DE4" />
          <path d="M12 4.7v14.6l4.9-1.9L18.1 4.7H12z" fill="#2965F1" />
          <path d="M15.8 7.5H8.2l.2 2.8h7.2l-.6 6.2-3 1-3-1-.2-2.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="#9CA3AF" />
          <path d="M14 2v6h6" fill="#6B7280" />
        </svg>
      )
  }
}

function FileExplorer({ files = [], activeFileName, onSelectFile, onRenameFile, onDeleteFile }) {
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

  return (
    <div className="file-explorer" aria-label="Project File Explorer">
      <div className="file-explorer__header">
        <p className="file-explorer__eyebrow">POLYGLOTMESH</p>
        <h3 className="file-explorer__title">Files</h3>
      </div>

      <div className="file-explorer__tree" role="tree" aria-label="Project files list">
        {files.length === 0 ? (
          <p className="file-explorer__empty">No files available</p>
        ) : (
          files.map((file) => {
            const isActive = file.name === activeFileName
            const isRenaming = file.name === renamingFileName
            const ext = isRenaming ? getFileExtension(renameInput) : getFileExtension(file.name)

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
    </div>
  )
}

export default FileExplorer
