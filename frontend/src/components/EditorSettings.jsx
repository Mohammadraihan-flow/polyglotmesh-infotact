function EditorSettings({ settings, onChange }) {
  const handleSettingChange = (key, value) => {
    onChange((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }))
  }

  return (
    <div className="editor-settings" role="dialog" aria-label="Editor settings">
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
  )
}

export default EditorSettings