function EditorSettings({ settings, onChange }) {
  const handleSettingChange = (key, value) => {
    onChange((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }))
  }

  return (
    <div className="editor-settings" role="dialog" aria-label="Editor settings">
      <div className="editor-settings__header">
        <h4 className="editor-settings__title">Editor Settings</h4>
      </div>

      <div className="editor-settings__content">
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
            {[12, 14, 16, 18, 20].map((fontSize) => (
              <option key={fontSize} value={fontSize}>
                {fontSize}
              </option>
            ))}
          </select>
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
          <span className="editor-settings__label">Word Wrap</span>
          <div className="editor-settings__toggle-group" role="radiogroup" aria-label="Word Wrap">
            {[
              { label: 'On', value: 'on' },
              { label: 'Off', value: 'off' },
            ].map((option) => {
              const isActive =
                settings.wordWrap === option.value ||
                (option.value === 'on' && settings.wordWrap === true) ||
                (option.value === 'off' && settings.wordWrap === false)

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`editor-settings__toggle${isActive ? ' editor-settings__toggle--active' : ''}`}
                  onClick={() => handleSettingChange('wordWrap', option.value)}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
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
                {tabSize}
              </option>
            ))}
          </select>
        </div>

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
    </div>
  )
}

export default EditorSettings