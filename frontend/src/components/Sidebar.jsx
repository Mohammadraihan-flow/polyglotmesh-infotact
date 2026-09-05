import React, { useEffect, useRef, useState } from 'react'
import FileExplorer from './FileExplorer.jsx'
import OutlinePanel from './OutlinePanel.jsx'

const navItems = ['Workspace', 'Outline', 'Scripts', 'Settings']

function Sidebar({
  files,
  activeFile,
  activeFileName,
  recentFileNames,
  onSelectFile,
  onRenameFile,
  onDeleteFile,
  onToggleSettings,
  symbols = [],
  isLoadingSymbols = false,
  hasSymbolProvider = true,
  symbolError = null,
  onRefreshSymbols,
  sidebarView: controlledView,
  onSidebarViewChange,
}) {
  const [internalView, setInternalView] = useState('files')
  const currentView = controlledView !== undefined ? controlledView : internalView
  const outlineSearchRef = useRef(null)

  const resolvedActiveFile = activeFile || files.find((f) => f.name === activeFileName) || null

  const handleViewChange = (view) => {
    if (onSidebarViewChange) {
      onSidebarViewChange(view)
    } else {
      setInternalView(view)
    }
  }

  useEffect(() => {
    const handleOpenOutline = () => {
      handleViewChange('outline')
      setTimeout(() => {
        outlineSearchRef.current?.focus()
      }, 80)
    }

    const handleOpenFiles = () => {
      handleViewChange('files')
    }

    window.addEventListener('polyglotmesh:open-outline', handleOpenOutline)
    window.addEventListener('polyglotmesh:open-files', handleOpenFiles)

    return () => {
      window.removeEventListener('polyglotmesh:open-outline', handleOpenOutline)
      window.removeEventListener('polyglotmesh:open-files', handleOpenFiles)
    }
  }, [])

  return (
    <aside className="sidebar" aria-label="Workspace navigation">
      <div className="sidebar__section">
        <p className="sidebar__eyebrow">Project</p>
        <h2 className="sidebar__title">Polyglot Workspace</h2>
        <p className="sidebar__description">
          Organize sandbox assets, scripts, and local IDE settings.
        </p>

        <div className="sidebar-view-tabs" role="tablist" aria-label="Sidebar view mode">
          <button
            type="button"
            role="tab"
            aria-selected={currentView === 'files'}
            className={`sidebar-view-tab ${currentView === 'files' ? 'sidebar-view-tab--active' : ''}`}
            onClick={() => handleViewChange('files')}
          >
            <span className="sidebar-view-tab__icon" aria-hidden="true">📁</span>
            <span>Files</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={currentView === 'outline'}
            className={`sidebar-view-tab ${currentView === 'outline' ? 'sidebar-view-tab--active' : ''}`}
            onClick={() => handleViewChange('outline')}
          >
            <span className="sidebar-view-tab__icon" aria-hidden="true">📑</span>
            <span>Outline</span>
            {symbols.length > 0 ? (
              <span className="sidebar-view-tab__badge" title={`${symbols.length} top-level symbols`}>
                {symbols.length}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {currentView === 'outline' ? (
        <OutlinePanel
          activeFile={resolvedActiveFile}
          symbols={symbols}
          isLoading={isLoadingSymbols}
          hasProvider={hasSymbolProvider}
          error={symbolError}
          onRefresh={onRefreshSymbols}
          onClose={() => handleViewChange('files')}
          searchRef={outlineSearchRef}
        />
      ) : (
        <FileExplorer
          files={files}
          activeFileName={activeFileName}
          recentFileNames={recentFileNames}
          onSelectFile={onSelectFile}
          onRenameFile={onRenameFile}
          onDeleteFile={onDeleteFile}
        />
      )}

      <nav className="sidebar__nav" aria-label="Primary workspace navigation">
        {navItems.map((item, index) => {
          const isActive =
            (item === 'Workspace' && currentView === 'files') ||
            (item === 'Outline' && currentView === 'outline')

          const handleClick = () => {
            if (item === 'Workspace') {
              handleViewChange('files')
            } else if (item === 'Outline') {
              handleViewChange('outline')
            } else if (item === 'Settings') {
              onToggleSettings?.()
            }
          }

          return (
            <button
              key={item}
              type="button"
              className={`sidebar__item${isActive ? ' sidebar__item--active' : ''}`}
              onClick={handleClick}
            >
              <span className="sidebar__bullet" aria-hidden="true">
                {index + 1}
              </span>
              <span>{item}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar