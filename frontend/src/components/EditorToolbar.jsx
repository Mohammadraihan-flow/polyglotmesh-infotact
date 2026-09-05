import React from 'react'

function EditorToolbar({
  activeFile,
  onSave,
  onFormatDocument,
  onQuickFix,
  onGoToDefinition,
  onFindReferences,
  onToggleWordWrap,
  isWordWrapOn,
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

  return (
    <div className="editor-toolbar" role="toolbar" aria-label="Editor command toolbar">
      <div className="editor-toolbar__group editor-toolbar__group--primary">
        {/* Save */}
        <button
          type="button"
          className={`command-palette-button save-button editor-toolbar__btn editor-toolbar__btn--save ${
            isDirty ? 'editor-toolbar__btn--dirty' : ''
          }`}
          aria-label={
            activeFile
              ? isDirty
                ? 'Save File (Ctrl+S) - Unsaved changes'
                : 'Save File (Ctrl+S) - Saved'
              : 'Save File (Ctrl+S)'
          }
          title={
            activeFile
              ? isDirty
                ? 'Save (Ctrl+S) - Unsaved changes'
                : 'Save (Ctrl+S) - Up to date'
              : 'Save (Ctrl+S)'
          }
          onClick={onSave}
          disabled={!activeFile}
        >
          <span className="command-palette-button__icon editor-toolbar__icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          </span>
          <span className="command-palette-button__text editor-toolbar__label">Save</span>
          {isDirty ? (
            <span
              className="editor-toolbar__dirty-badge"
              title="Unsaved changes"
              aria-hidden="true"
            />
          ) : null}
        </button>

        {/* Format Document */}
        <button
          type="button"
          className="command-palette-button format-document-button editor-toolbar__btn editor-toolbar__btn--format"
          aria-label="Format Document (Shift+Alt+F / Ctrl+Shift+I)"
          title="Format Document (Shift+Alt+F / Ctrl+Shift+I)"
          onClick={onFormatDocument}
          disabled={!activeFile}
        >
          <span className="command-palette-button__icon editor-toolbar__icon" aria-hidden="true">
            ✨
          </span>
          <span className="command-palette-button__text editor-toolbar__label">Format</span>
        </button>

        {/* Code Actions / Quick Fix */}
        <button
          type="button"
          className="command-palette-button quick-fix-button editor-toolbar__btn editor-toolbar__btn--quickfix"
          aria-label="Code Actions / Quick Fix (Ctrl+.)"
          title="Code Actions / Quick Fix (Ctrl+.)"
          onClick={onQuickFix}
          disabled={!activeFile}
        >
          <span className="command-palette-button__icon editor-toolbar__icon" aria-hidden="true">
            💡
          </span>
          <span className="command-palette-button__text editor-toolbar__label">Quick Fix</span>
        </button>
      </div>

      <span className="editor-toolbar__divider" aria-hidden="true" />

      <div className="editor-toolbar__group editor-toolbar__group--nav">
        {/* Go to Definition */}
        <button
          type="button"
          className="command-palette-button goto-def-button editor-toolbar__btn editor-toolbar__btn--gotodef"
          aria-label="Go to Definition (F12)"
          title="Go to Definition (F12)"
          onClick={onGoToDefinition}
          disabled={!activeFile}
        >
          <span className="command-palette-button__icon editor-toolbar__icon" aria-hidden="true">
            ↗
          </span>
          <span className="command-palette-button__text editor-toolbar__label">Go to Def</span>
        </button>

        {/* Find References */}
        <button
          type="button"
          className="command-palette-button references-button editor-toolbar__btn editor-toolbar__btn--references"
          aria-label="Find References (Shift+F12)"
          title="Find References (Shift+F12)"
          onClick={onFindReferences}
          disabled={!activeFile}
        >
          <span className="command-palette-button__icon editor-toolbar__icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <span className="command-palette-button__text editor-toolbar__label">References</span>
        </button>
      </div>

      <span className="editor-toolbar__divider" aria-hidden="true" />

      <div className="editor-toolbar__group editor-toolbar__group--view">
        {/* Toggle Word Wrap */}
        <button
          type="button"
          className={`command-palette-button word-wrap-button editor-toolbar__btn editor-toolbar__btn--wordwrap ${
            isWordWrapOn ? 'editor-toolbar__btn--active' : ''
          }`}
          aria-label={`Toggle Word Wrap (Alt+Z) - Currently ${isWordWrapOn ? 'On' : 'Off'}`}
          title={`Toggle Word Wrap (Alt+Z) - Currently ${isWordWrapOn ? 'On' : 'Off'}`}
          onClick={onToggleWordWrap}
          disabled={!activeFile}
        >
          <span className="command-palette-button__icon editor-toolbar__icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 10 4 15 9 20" />
              <path d="M20 4v7a4 4 0 0 1-4 4H4" />
            </svg>
          </span>
          <span className="command-palette-button__text editor-toolbar__label">Word Wrap</span>
        </button>

        {/* Command Palette */}
        <button
          type="button"
          className="command-palette-button editor-toolbar__btn editor-toolbar__btn--palette"
          aria-label="Command Palette (Ctrl+Shift+P)"
          title="Command Palette (Ctrl+Shift+P)"
          onClick={onOpenCommandPalette}
        >
          <span className="command-palette-button__icon editor-toolbar__icon" aria-hidden="true">
            ⌘
          </span>
          <span className="command-palette-button__text editor-toolbar__label">Palette</span>
        </button>
      </div>

      <span className="editor-toolbar__divider" aria-hidden="true" />

      <div className="editor-toolbar__group editor-toolbar__group--controls">
        {/* Zoom Controls */}
        <div className="editor-panel__zoom-controls" role="group" aria-label="Editor Zoom Controls">
          <button
            type="button"
            className="editor-panel__zoom-btn"
            onClick={onZoomOut}
            disabled={currentFontSize <= 10}
            title="Zoom Out (Ctrl+-)"
            aria-label="Zoom Out"
          >
            −
          </button>
          <button
            type="button"
            className={`editor-panel__zoom-reset-btn${
              currentFontSize === 14 ? ' editor-panel__zoom-reset-btn--disabled' : ''
            }`}
            onClick={onResetZoom}
            disabled={currentFontSize === 14}
            title={`Reset Zoom (${currentFontSize}px)`}
            aria-label="Reset Zoom"
          >
            {currentFontSize}px
          </button>
          <button
            type="button"
            className="editor-panel__zoom-btn"
            onClick={onZoomIn}
            disabled={currentFontSize >= 32}
            title="Zoom In (Ctrl+=)"
            aria-label="Zoom In"
          >
            +
          </button>
        </div>

        {/* Settings Toggle */}
        <button
          type="button"
          className="settings-button editor-toolbar__btn--settings"
          aria-label="Editor Settings"
          title="Editor Settings"
          onClick={onToggleSettings}
        >
          ⚙️
        </button>

        {/* Run Button */}
        <button
          type="button"
          className="run-button editor-toolbar__btn--run"
          disabled={isRunning || !activeFile}
          onClick={onRunClick}
          title="Run Program (Ctrl+Enter)"
          aria-label={isRunning ? 'Program running' : 'Run program (Ctrl+Enter)'}
        >
          {isRunning ? 'Running...' : 'Run'}
        </button>
      </div>
    </div>
  )
}

export default React.memo(EditorToolbar)
