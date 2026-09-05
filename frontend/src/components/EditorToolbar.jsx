import React, { useState, useRef, useEffect } from 'react'

const Dropdown = ({ label, children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="toolbar-dropdown" ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="editor-toolbar__btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: isOpen ? 'var(--button-hover-bg, rgba(255,255,255,0.1))' : 'transparent',
          border: 'none',
          color: 'var(--text, #fff)',
          padding: '4px 12px',
          cursor: 'pointer',
          fontSize: '13px',
          borderRadius: '4px'
        }}
      >
        {label}
      </button>
      {isOpen && (
        <div 
          className="toolbar-dropdown-menu" 
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 1000,
            background: 'var(--surface, #1e1e1e)',
            border: '1px solid var(--border, #333)',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            minWidth: '180px',
            display: 'flex',
            flexDirection: 'column',
            padding: '4px 0',
            marginTop: '4px'
          }}
        >
          {React.Children.map(children, child => {
            if (!child) return null
            return React.cloneElement(child, {
              onClick: (e) => {
                setIsOpen(false)
                if (child.props.onClick) child.props.onClick(e)
              },
              style: {
                ...child.props.style,
                width: '100%',
                textAlign: 'left',
                padding: '8px 16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text, #d4d4d4)',
                cursor: child.props.disabled ? 'not-allowed' : 'pointer',
                opacity: child.props.disabled ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px'
              },
              onMouseEnter: (e) => {
                if (!child.props.disabled) {
                  e.currentTarget.style.background = 'var(--button-hover-bg, rgba(255,255,255,0.1))'
                }
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.background = 'transparent'
              }
            })
          })}
        </div>
      )}
    </div>
  )
}

function EditorToolbar({
  activeFile,
  isReadOnly = false,
  onToggleReadOnly,
  onCreateFile,
  onChange,
  onSave,
  onFormatDocument,
  onQuickFix,
  onGoToDefinition,
  onFindReferences,
  onToggleWordWrap,
  isWordWrapOn,
  isSplit = false,
  onToggleSplit,
  onResetLayout,
  onOpenCommandPalette,
  currentFontSize = 14,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleSettings,
  onRunClick,
  isRunning,
}) {
  const isDirty = Boolean(activeFile?.isDirty)

  const handleCreateFile = () => {
    if (onCreateFile) onCreateFile()
  }

  const handleNewWindow = () => {
    window.open(window.location.href, '_blank')
  }

  const handleSelectFile = async () => {
    try {
      const [fileHandle] = await window.showOpenFilePicker()
      const file = await fileHandle.getFile()
      const content = await file.text()
      if (onCreateFile) {
        const result = onCreateFile(file.name)
        if (result && result.fileName && onChange) {
          onChange(result.fileName, content)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleOpenFolder = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker()
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile()
          const content = await file.text()
          if (onCreateFile) {
            const result = onCreateFile(file.name)
            if (result && result.fileName && onChange) {
              onChange(result.fileName, content)
            }
          }
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Editor command toolbar" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px solid var(--border)' }}>
      <div className="editor-toolbar__group" style={{ display: 'flex', gap: '4px' }}>
        
        {/* FILE MENU */}
        <Dropdown label="File">
          <button
            type="button"
            onClick={handleCreateFile}
            title="Create File"
          >
            <span>📄</span>
            <span>Create File</span>
          </button>
          <button
            type="button"
            onClick={handleNewWindow}
            title="New Window"
          >
            <span>🪟</span>
            <span>New Window</span>
          </button>
          <button
            type="button"
            onClick={handleSelectFile}
            title="Select File"
          >
            <span>📂</span>
            <span>Select File</span>
          </button>
          <button
            type="button"
            onClick={handleOpenFolder}
            title="Open Folder"
          >
            <span>📁</span>
            <span>Open Folder</span>
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!activeFile}
            title={activeFile ? (isDirty ? 'Save (Ctrl+S) - Unsaved changes' : 'Save (Ctrl+S) - Up to date') : 'Save (Ctrl+S)'}
          >
            <span>💾</span>
            <span>Save {isDirty && '*'}</span>
          </button>
        </Dropdown>

        {/* EDIT MENU */}
        <Dropdown label="Edit">
          <button
            type="button"
            onClick={onFormatDocument}
            disabled={!activeFile || isReadOnly}
            title="Format Document (Shift+Alt+F)"
          >
            <span>✨</span>
            <span>Format Document</span>
          </button>
          <button
            type="button"
            onClick={onQuickFix}
            disabled={!activeFile || isReadOnly}
            title="Code Actions / Quick Fix (Ctrl+.)"
          >
            <span>💡</span>
            <span>Quick Fix</span>
          </button>
          <button
            type="button"
            onClick={onOpenCommandPalette}
            title="Command Palette (Ctrl+Shift+P)"
          >
            <span>⌘</span>
            <span>Command Palette</span>
          </button>
        </Dropdown>

        {/* SELECTION MENU */}
        <Dropdown label="Selection">
          <button
            type="button"
            onClick={onGoToDefinition}
            disabled={!activeFile}
            title="Go to Definition (F12)"
          >
            <span>↗</span>
            <span>Go to Definition</span>
          </button>
          <button
            type="button"
            onClick={onFindReferences}
            disabled={!activeFile}
            title="Find References (Shift+F12)"
          >
            <span>🔍</span>
            <span>Find References</span>
          </button>
        </Dropdown>

        {/* VIEW MENU */}
        <Dropdown label="View">
          <button
            type="button"
            onClick={() => onToggleReadOnly?.()}
            disabled={!activeFile}
          >
            <span>{isReadOnly ? '👁️' : '✏️'}</span>
            <span>{isReadOnly ? 'Switch to Edit Mode' : 'Switch to Preview Mode'}</span>
          </button>
          <button
            type="button"
            onClick={onToggleWordWrap}
            disabled={!activeFile}
          >
            <span>{isWordWrapOn ? '✅' : '⬛'}</span>
            <span>Word Wrap</span>
          </button>
          <button
            type="button"
            onClick={onToggleSplit}
          >
            <span>🪟</span>
            <span>{isSplit ? 'Close Split' : 'Split Editor'}</span>
          </button>
          {isSplit && onResetLayout && (
            <button
              type="button"
              onClick={onResetLayout}
            >
              <span>🔄</span>
              <span>Reset Layout</span>
            </button>
          )}
          <button type="button" onClick={onZoomIn} disabled={currentFontSize >= 32}>
            <span>➕</span>
            <span>Zoom In</span>
          </button>
          <button type="button" onClick={onZoomOut} disabled={currentFontSize <= 10}>
            <span>➖</span>
            <span>Zoom Out</span>
          </button>
          <button type="button" onClick={onResetZoom} disabled={currentFontSize === 14}>
            <span>🔍</span>
            <span>Reset Zoom ({currentFontSize}px)</span>
          </button>
        </Dropdown>
      </div>

      <div className="editor-toolbar__group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={onToggleSettings}
          title="Editor Settings"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          ⚙️
        </button>
        <button
          type="button"
          disabled={isRunning || !activeFile}
          onClick={onRunClick}
          title="Run Program (Ctrl+Enter)"
          style={{ 
            background: isRunning ? 'var(--button-disabled-bg, #555)' : 'var(--button-primary-bg, #007acc)',
            color: '#fff',
            border: 'none',
            padding: '4px 12px',
            borderRadius: '4px',
            cursor: isRunning || !activeFile ? 'not-allowed' : 'pointer'
          }}
        >
          {isRunning ? 'Running...' : 'Run ▶️'}
        </button>
      </div>
    </div>
  )
}

export default React.memo(EditorToolbar)
