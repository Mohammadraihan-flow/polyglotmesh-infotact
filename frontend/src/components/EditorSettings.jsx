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

function EditorSettings({ settings, onChange, onFoldAll, onUnfoldAll }) {
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
              <span className="editor-settings__shortcut-label">Fold Block</span>
              <kbd className="editor-settings__kbd">Ctrl+Shift+[ / Cmd+Alt+[</kbd>
            </div>
            <div className="editor-settings__shortcut-item">
              <span className="editor-settings__shortcut-label">Unfold Block</span>
              <kbd className="editor-settings__kbd">Ctrl+Shift+] / Cmd+Alt+]</kbd>
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
      </div>
    </div>
  )
}

export default EditorSettings