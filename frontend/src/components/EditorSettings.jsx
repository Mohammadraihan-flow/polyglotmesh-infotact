
import React from 'react'

const THEMES = [
  {
    id: 'vs-dark',
    name: 'Dark',
    bg: '#1e1e1e',
    fg: '#d4d4d4',
    accents: ['#c586c0', '#ce9178', '#4ec9b0'],
  },
  {
    id: 'vs',
    name: 'Light',
    bg: '#ffffff',
    fg: '#000000',
    accents: ['#0000ff', '#a31515', '#098658'],
  },
  {
    id: 'hc-black',
    name: 'High Contrast',
    bg: '#000000',
    fg: '#ffffff',
    accents: ['#ffff00', '#00ffff', '#ff00ff'],
  },
  {
    id: 'monokai',
    name: 'Monokai',
    bg: '#272822',
    fg: '#f8f8f2',
    accents: ['#f92672', '#e6db74', '#66d9ef'],
  },
  {
    id: 'dracula',
    name: 'Dracula',
    bg: '#282a36',
    fg: '#f8f8f2',
    accents: ['#ff79c6', '#f1fa8c', '#8be9fd'],
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    bg: '#002b36',
    fg: '#839496',
    accents: ['#859900', '#2aa198', '#b58900'],
  },
]

function EditorSettings({
  settings,
  onChange,
  onFoldAll,
  onUnfoldAll,
  onFormatDocument,
  onFormatSelection,
  onQuickFix,
  onAddNextOccurrence,
  onSelectAllOccurrences,
  onExpandSelection,
  onShrinkSelection,
  activeFile,
  onResetSession,
}) {
  const handleSettingChange = (key, value) => {
    onChange((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }))
  }

  const currentTheme = settings.theme ?? 'vs-dark'

  return (
    <div className="editor-settings" role="dialog" aria-label="Editor settings">
      <div className="editor-settings__header">
        <h4 className="editor-settings__title">Editor Settings</h4>
      </div>

      <div className="editor-settings__content">
        {/* Appearance Section */}
        <div className="editor-settings__group">
          <h5 className="editor-settings__group-title">Appearance</h5>

          <div className="editor-settings__section">
            <span className="editor-settings__label">Editor Theme</span>
            <div className="editor-settings__themes-grid" role="radiogroup" aria-label="Editor Theme">
              {THEMES.map((theme) => {
                const isActive = currentTheme === theme.id

                return (
                  <button
                    key={theme.id}
                    type="button"
                    className={`theme-card${isActive ? ' theme-card--active' : ''}`}
                    onClick={() => handleSettingChange('theme', theme.id)}
                    role="radio"
                    aria-checked={isActive}
                  >
                    <div className="theme-card__swatch" style={{ backgroundColor: theme.bg }}>
                      <div className="theme-card__dots">
                        {theme.accents.map((color, i) => (
                          <span key={i} className="theme-card__dot" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    </div>
                    <div className="theme-card__info">
                      <span className="theme-card__name">{theme.name}</span>
                      {isActive ? <span className="theme-card__check">✓</span> : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Editor Section */}
        <div className="editor-settings__group">
          <h5 className="editor-settings__group-title">Editor</h5>

          <div className="editor-settings__section">
            <label className="editor-settings__label" htmlFor="editor-font-size">
              Font Size
            </label>
            <select
              id="editor-font-size"
              className="editor-settings__select"
              value={settings.fontSize}
              onChange={(event) => handleSettingChange('fontSize', Number(event.target.value))}
            >
              {Array.from(new Set([10, 12, 14, 16, 18, 20, 24, 28, 32, settings.fontSize]))
                .sort((a, b) => a - b)
                .map((fontSize) => (
                  <option key={fontSize} value={fontSize}>
                    {fontSize}px
                  </option>
                ))}
            </select>

          </div>

          <div className="editor-settings__section">
            <label className="editor-settings__label" htmlFor="editor-tab-size">
              Tab Size
            </label>
            <select
              id="editor-tab-size"
              className="editor-settings__select"
              value={[2, 4, 8].includes(Number(settings.tabSize)) ? Number(settings.tabSize) : 4}
              onChange={(event) => {
                const val = Number(event.target.value)
                if ([2, 4, 8].includes(val)) {
                  handleSettingChange('tabSize', val)
                }
              }}
            >
              {[2, 4, 8].map((tabSize) => (
                <option key={tabSize} value={tabSize}>
                  {tabSize} spaces
                </option>
              ))}
            </select>
          </div>

          <div className="editor-settings__section">
            <span className="editor-settings__label">Line Numbers</span>
            <div className="editor-settings__toggle-group" role="radiogroup" aria-label="Line Numbers">
              {[
                { label: 'On', value: 'on' },
                { label: 'Off', value: 'off' },
              ].map((option) => {
                const isActive =
                  settings.lineNumbers === option.value ||
                  (option.value === 'on' && settings.lineNumbers === true) ||
                  (option.value === 'off' && settings.lineNumbers === false) ||
                  (option.value === 'on' && (settings.lineNumbers === undefined || settings.lineNumbers === null))

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`editor-settings__toggle${isActive ? ' editor-settings__toggle--active' : ''}`}
                    onClick={() => handleSettingChange('lineNumbers', option.value)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="editor-settings__section">
            <span className="editor-settings__label">Show Minimap</span>
            <div className="editor-settings__toggle-group" role="radiogroup" aria-label="Show Minimap">
              {[
                { label: 'On', value: true },
                { label: 'Off', value: false },
              ].map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  className={`editor-settings__toggle${settings.minimap === option.value ? ' editor-settings__toggle--active' : ''}`}
                  onClick={() => handleSettingChange('minimap', option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="editor-settings__section">
            <label className="editor-settings__label" htmlFor="editor-word-wrap">
              Word Wrap
            </label>
            <select
              id="editor-word-wrap"
              className="editor-settings__select"
              value={
                ['on', 'off', 'wordWrapColumn'].includes(settings.wordWrap)
                  ? settings.wordWrap
                  : settings.wordWrap === false
                  ? 'off'
                  : 'on'
              }
              onChange={(event) => handleSettingChange('wordWrap', event.target.value)}
            >
              <option value="on">On</option>
              <option value="off">Off</option>
              <option value="wordWrapColumn">Word Wrap Column</option>
            </select>
          </div>

          <div className="editor-settings__section">
            <span className="editor-settings__label">Bracket Pair Colorization</span>
            <div className="editor-settings__toggle-group" role="radiogroup" aria-label="Bracket Pair Colorization">
              {[
                { label: 'On', value: true },
                { label: 'Off', value: false },
              ].map((option) => {
                const isActive = (settings.bracketPairColorization ?? true) === option.value

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    className={`editor-settings__toggle${isActive ? ' editor-settings__toggle--active' : ''}`}
                    onClick={() => handleSettingChange('bracketPairColorization', option.value)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="editor-settings__section">
            <span className="editor-settings__label">Show Hover Information</span>
            <div className="editor-settings__toggle-group" role="radiogroup" aria-label="Show Hover Information">
              {[
                { label: 'On', value: true },
                { label: 'Off', value: false },
              ].map((option) => {
                const isActive = (settings.showHover ?? true) === option.value

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    className={`editor-settings__toggle${isActive ? ' editor-settings__toggle--active' : ''}`}
                    onClick={() => handleSettingChange('showHover', option.value)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="editor-settings__section">
            <span className="editor-settings__label">Auto Suggestions</span>
            <div className="editor-settings__toggle-group" role="radiogroup" aria-label="Auto Suggestions">
              {[
                { label: 'On', value: true },
                { label: 'Off', value: false },
              ].map((option) => {
                const isActive = (settings.autoSuggestions ?? true) === option.value

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    className={`editor-settings__toggle${isActive ? ' editor-settings__toggle--active' : ''}`}
                    onClick={() => handleSettingChange('autoSuggestions', option.value)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="editor-settings__section">
            <span className="editor-settings__label">Parameter Hints</span>
            <div className="editor-settings__toggle-group" role="radiogroup" aria-label="Parameter Hints">
              {[
                { label: 'Enabled', value: true },
                { label: 'Disabled', value: false },
              ].map((option) => {
                const isActive = (settings.parameterHints ?? true) === option.value

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    className={`editor-settings__toggle${isActive ? ' editor-settings__toggle--active' : ''}`}
                    onClick={() => handleSettingChange('parameterHints', option.value)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="editor-settings__section">
            <span className="editor-settings__label">Sticky Scroll</span>
            <div className="editor-settings__toggle-group" role="radiogroup" aria-label="Sticky Scroll">
              {[
                { label: 'Enabled', value: true },
                { label: 'Disabled', value: false },
              ].map((option) => {
                const isActive = (settings.stickyScroll ?? true) === option.value

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    className={`editor-settings__toggle${isActive ? ' editor-settings__toggle--active' : ''}`}
                    onClick={() => handleSettingChange('stickyScroll', option.value)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="editor-settings__section">
            <span className="editor-settings__label">Smooth Scrolling</span>
            <div className="editor-settings__toggle-group" role="radiogroup" aria-label="Smooth Scrolling">
              {[
                { label: 'Enabled', value: true },
                { label: 'Disabled', value: false },
              ].map((option) => {
                const isActive = (settings.smoothScrolling ?? true) === option.value

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    className={`editor-settings__toggle${isActive ? ' editor-settings__toggle--active' : ''}`}
                    onClick={() => handleSettingChange('smoothScrolling', option.value)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="editor-settings__section">
            <span className="editor-settings__label">Highlight Active Line</span>
            <div className="editor-settings__toggle-group" role="radiogroup" aria-label="Highlight Active Line">
              {[
                { label: 'Enabled', value: true },
                { label: 'Disabled', value: false },
              ].map((option) => {
                const isActive = (settings.highlightActiveLine ?? true) === option.value

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    className={`editor-settings__toggle${isActive ? ' editor-settings__toggle--active' : ''}`}
                    onClick={() => handleSettingChange('highlightActiveLine', option.value)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="editor-settings__section">
            <span className="editor-settings__label">Render Whitespace</span>
            <div className="editor-settings__toggle-group" role="radiogroup" aria-label="Render Whitespace">
              {[
                { label: 'None', value: 'none' },
                { label: 'Boundary', value: 'boundary' },
                { label: 'Selection', value: 'selection' },
                { label: 'All', value: 'all' },
              ].map((option) => {
                const isActive = (settings.renderWhitespace ?? 'none') === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`editor-settings__toggle${isActive ? ' editor-settings__toggle--active' : ''}`}
                    onClick={() => handleSettingChange('renderWhitespace', option.value)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="editor-settings__section">
            <label className="editor-settings__label" htmlFor="editor-cursor-style">
              Cursor Style
            </label>
            <select
              id="editor-cursor-style"
              className="editor-settings__select"
              value={['line', 'block', 'underline'].includes(settings.cursorStyle) ? settings.cursorStyle : 'line'}
              onChange={(event) => handleSettingChange('cursorStyle', event.target.value)}
            >
              <option value="line">Line</option>
              <option value="block">Block</option>
              <option value="underline">Underline</option>
            </select>
          </div>

          <div className="editor-settings__section">
            <label className="editor-settings__label" htmlFor="editor-cursor-blinking">
              Cursor Blinking
            </label>
            <select
              id="editor-cursor-blinking"
              className="editor-settings__select"
              value={
                ['smooth', 'blink', 'solid', 'phase', 'expand'].includes(settings.cursorBlinking)
                  ? settings.cursorBlinking
                  : 'smooth'
              }
              onChange={(event) => handleSettingChange('cursorBlinking', event.target.value)}
            >
              <option value="smooth">Smooth</option>
              <option value="blink">Blink</option>
              <option value="solid">Solid (No Blink)</option>
              <option value="phase">Phase</option>
              <option value="expand">Expand</option>
            </select>
          </div>

          <div className="editor-settings__section">
            <span className="editor-settings__label">Smooth Caret Animation</span>
            <div className="editor-settings__toggle-group" role="radiogroup" aria-label="Smooth Caret Animation">
              {[
                { label: 'On', value: 'on' },
                { label: 'Off', value: 'off' },
              ].map((option) => {
                const isActive = (settings.cursorSmoothCaretAnimation ?? 'on') === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`editor-settings__toggle${isActive ? ' editor-settings__toggle--active' : ''}`}
                    onClick={() => handleSettingChange('cursorSmoothCaretAnimation', option.value)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="editor-settings__section">
            <span className="editor-settings__label">Selection Highlight</span>
            <div className="editor-settings__toggle-group" role="radiogroup" aria-label="Selection Highlight">
              {[
                { label: 'On', value: true },
                { label: 'Off', value: false },
              ].map((option) => {
                const isActive = (settings.selectionHighlight ?? true) === option.value

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    className={`editor-settings__toggle${isActive ? ' editor-settings__toggle--active' : ''}`}
                    onClick={() => handleSettingChange('selectionHighlight', option.value)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Behavior Section */}
        <div className="editor-settings__group">
          <h5 className="editor-settings__group-title">Behavior</h5>

          <div className="editor-settings__section">
            <span className="editor-settings__label">Auto Indent</span>
            <div className="editor-settings__toggle-group" role="radiogroup" aria-label="Auto Indent">
              {[
                { label: 'On', value: 'full' },
                { label: 'Off', value: 'none' },
              ].map((option) => {
                const isActive =
                  settings.autoIndent === option.value ||
                  (option.value === 'full' && settings.autoIndent === true) ||
                  (option.value === 'none' && settings.autoIndent === false) ||
                  (option.value === 'full' && (settings.autoIndent === undefined || settings.autoIndent === null))

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`editor-settings__toggle${isActive ? ' editor-settings__toggle--active' : ''}`}
                    onClick={() => handleSettingChange('autoIndent', option.value)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="editor-settings__section">
            <span className="editor-settings__label">Automatic Layout</span>
            <div className="editor-settings__toggle-group" role="radiogroup" aria-label="Automatic Layout">
              {[
                { label: 'On', value: true },
                { label: 'Off', value: false },
              ].map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  className={`editor-settings__toggle${settings.automaticLayout === option.value ? ' editor-settings__toggle--active' : ''}`}
                  onClick={() => handleSettingChange('automaticLayout', option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Code Folding Section */}
        <div className="editor-settings__group">
          <h5 className="editor-settings__group-title">Code Folding</h5>

          <div className="editor-settings__section">
            <span className="editor-settings__label">Actions</span>
            <div className="editor-settings__toggle-group" role="group" aria-label="Code Folding Actions">
              <button
                type="button"
                className="editor-settings__toggle"
                onClick={onFoldAll}
                title="Fold all code blocks in active file"
              >
                Fold All
              </button>
              <button
                type="button"
                className="editor-settings__toggle"
                onClick={onUnfoldAll}
                title="Unfold all code blocks in active file"
              >
                Unfold All
              </button>
            </div>
          </div>
        </div>

        {/* Formatting Section */}
        <div className="editor-settings__group">
          <h5 className="editor-settings__group-title">Formatting & Indentation</h5>

          <div className="editor-settings__section">
            <span className="editor-settings__label">Actions</span>
            <div className="editor-settings__toggle-group" role="group" aria-label="Formatting Actions">
              <button
                type="button"
                className="editor-settings__toggle"
                onClick={onFormatDocument}
                disabled={!activeFile}
                title="Format entire active file (Shift+Alt+F / Ctrl+Shift+I)"
              >
                Format Document
              </button>
              <button
                type="button"
                className="editor-settings__toggle"
                onClick={onFormatSelection}
                disabled={!activeFile}
                title="Format selected text (Ctrl+K Ctrl+F)"
              >
                Format Selection
              </button>
              <button
                type="button"
                className="editor-settings__toggle"
                onClick={onQuickFix}
                disabled={!activeFile}
                title="Trigger Quick Fix / Code Actions at cursor (Ctrl+.)"
              >
                Quick Fix
              </button>
            </div>
          </div>

          <div className="editor-settings__section">
            <span className="editor-settings__label">Format on Type</span>
            <div className="editor-settings__toggle-group" role="radiogroup" aria-label="Format on Type">
              {[
                { label: 'On', value: true },
                { label: 'Off', value: false },
              ].map((option) => {
                const isActive = (settings.formatOnType ?? false) === option.value

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    className={`editor-settings__toggle${isActive ? ' editor-settings__toggle--active' : ''}`}
                    onClick={() => handleSettingChange('formatOnType', option.value)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Multi-Cursor & Selection Section */}
        <div className="editor-settings__group">
          <h5 className="editor-settings__group-title">Multi-Cursor & Selection</h5>

          <div className="editor-settings__section">
            <span className="editor-settings__label">Multi-Cursor Modifier</span>
            <div className="editor-settings__toggle-group" role="radiogroup" aria-label="Multi-Cursor Modifier">
              {[
                { label: 'Alt (Default)', value: 'alt' },
                { label: 'Ctrl / Cmd', value: 'ctrlCmd' },
              ].map((option) => {
                const isActive = (settings.multiCursorModifier ?? 'alt') === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`editor-settings__toggle${isActive ? ' editor-settings__toggle--active' : ''}`}
                    onClick={() => handleSettingChange('multiCursorModifier', option.value)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="editor-settings__section">
            <span className="editor-settings__label">Column Selection Mode</span>
            <div className="editor-settings__toggle-group" role="radiogroup" aria-label="Column Selection Mode">
              {[
                { label: 'On', value: true },
                { label: 'Off', value: false },
              ].map((option) => {
                const isActive = (settings.columnSelection ?? false) === option.value

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    className={`editor-settings__toggle${isActive ? ' editor-settings__toggle--active' : ''}`}
                    onClick={() => handleSettingChange('columnSelection', option.value)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="editor-settings__section">
            <span className="editor-settings__label">Actions</span>
            <div className="editor-settings__toggle-group" role="group" aria-label="Selection Actions">
              <button
                type="button"
                className="editor-settings__toggle"
                onClick={onAddNextOccurrence}
                disabled={!activeFile}
                title="Add Next Occurrence (Ctrl+D)"
              >
                Next Match
              </button>
              <button
                type="button"
                className="editor-settings__toggle"
                onClick={onSelectAllOccurrences}
                disabled={!activeFile}
                title="Select All Occurrences (Ctrl+Shift+L)"
              >
                All Matches
              </button>
              <button
                type="button"
                className="editor-settings__toggle"
                onClick={onExpandSelection}
                disabled={!activeFile}
                title="Expand Selection (Shift+Alt+Right)"
              >
                Expand
              </button>
              <button
                type="button"
                className="editor-settings__toggle"
                onClick={onShrinkSelection}
                disabled={!activeFile}
                title="Shrink Selection (Shift+Alt+Left)"
              >
                Shrink
              </button>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Section */}
        <div className="editor-settings__group">
          <h5 className="editor-settings__group-title">Keyboard Shortcuts</h5>
          <div className="editor-settings__shortcuts-list">
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Save File</span>
              <kbd className="editor-settings__kbd">Ctrl+S / Cmd+S</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">New File</span>
              <kbd className="editor-settings__kbd">Ctrl+N / Cmd+N</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Close Tab</span>
              <kbd className="editor-settings__kbd">Ctrl+W / Ctrl+Alt+W</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Switch Tab</span>
              <kbd className="editor-settings__kbd">Ctrl+Tab / Ctrl+Alt+→</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Find Text</span>
              <kbd className="editor-settings__kbd">Ctrl+F / Cmd+F</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Find & Replace</span>
              <kbd className="editor-settings__kbd">Ctrl+H / Cmd+Alt+F</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Go to Line</span>
              <kbd className="editor-settings__kbd">Ctrl+G / Cmd+G</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Command Palette</span>
              <kbd className="editor-settings__kbd">Ctrl+Shift+P / Cmd+Shift+P</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Run Program</span>
              <kbd className="editor-settings__kbd">Ctrl+Enter / Cmd+Enter</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Add Next Occurrence</span>
              <kbd className="editor-settings__kbd">Ctrl+D / Cmd+D</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Select All Occurrences</span>
              <kbd className="editor-settings__kbd">Ctrl+Shift+L / Cmd+Shift+L</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Add Cursor Above</span>
              <kbd className="editor-settings__kbd">Ctrl+Alt+Up / Cmd+Alt+Up</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Add Cursor Below</span>
              <kbd className="editor-settings__kbd">Ctrl+Alt+Down / Cmd+Alt+Down</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Add Cursors to Line Ends</span>
              <kbd className="editor-settings__kbd">Shift+Alt+I</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Expand Selection</span>
              <kbd className="editor-settings__kbd">Shift+Alt+Right</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Shrink Selection</span>
              <kbd className="editor-settings__kbd">Shift+Alt+Left</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Fold Block</span>
              <kbd className="editor-settings__kbd">Ctrl+Shift+[ / Cmd+Alt+[</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Unfold Block</span>
              <kbd className="editor-settings__kbd">Ctrl+Shift+] / Cmd+Alt+]</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Format Document</span>
              <kbd className="editor-settings__kbd">Shift+Alt+F / Ctrl+Shift+I</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Format Selection</span>
              <kbd className="editor-settings__kbd">Ctrl+K Ctrl+F</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Quick Fix / Code Actions</span>
              <kbd className="editor-settings__kbd">Ctrl+. / Cmd+.</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Toggle Problems</span>
              <kbd className="editor-settings__kbd">Ctrl+Shift+M / Cmd+Shift+M</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Zoom In / Out</span>
              <kbd className="editor-settings__kbd">Ctrl+= / Ctrl+-</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Reset Zoom</span>
              <kbd className="editor-settings__kbd">Ctrl+0</kbd>
            </div>

          </div>
        </div>

        {/* Session Section */}
        <div className="editor-settings__group">
          <h5 className="editor-settings__group-title">Session Storage</h5>

          <div className="editor-settings__section">
            <span className="editor-settings__label">Editor Session</span>
            <span className="editor-settings__hint">
              Open files, tabs, split layout, and read-only preview flags are automatically saved to your browser storage.
            </span>
            <div className="editor-settings__action-row" style={{ marginTop: '0.6rem' }}>
              <button
                type="button"
                className="btn btn--danger-outline editor-settings__action-btn"
                onClick={() => {
                  if (onResetSession) {
                    onResetSession()
                  } else if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('polyglotmesh:reset-session'))
                  }
                }}
                title="Clear saved editor session and return to clean workspace"
              >
                🔄 Reset Editor Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(EditorSettings)