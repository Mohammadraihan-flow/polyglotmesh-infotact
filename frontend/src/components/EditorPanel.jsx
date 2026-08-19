import { useEffect, useRef } from 'react'
import Editor, { useMonaco } from '@monaco-editor/react'
import EditorSettings from './EditorSettings.jsx'
import EditorTabs from './EditorTabs.jsx'
import { getMonacoLanguageFromFileName } from '../utils/languageUtils.js'

const baseEditorOptions = {
  fontSize: 14,
  fontFamily: 'Cascadia Code, Consolas, "Courier New", monospace',
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  tabSize: 2,
  renderWhitespace: 'selection',
}

function defineMonacoThemes(monaco) {
  if (!monaco) return

  try {
    monaco.editor.defineTheme('monokai', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: 'f8f8f2' },
        { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'f92672' },
        { token: 'string', foreground: 'e6db74' },
        { token: 'number', foreground: 'ae81ff' },
        { token: 'type', foreground: '66d9ef' },
        { token: 'type.identifier', foreground: '66d9ef' },
        { token: 'function', foreground: 'a6e22e' },
        { token: 'variable', foreground: 'f8f8f2' },
        { token: 'delimiter', foreground: 'f8f8f2' },
      ],
      colors: {
        'editor.background': '#272822',
        'editor.foreground': '#f8f8f2',
        'editorCursor.foreground': '#f8f8f0',
        'editor.selectionBackground': '#49483e',
        'editor.inactiveSelectionBackground': '#3a3a30',
        'editor.lineHighlightBackground': '#3e3d32',
        'editorLineNumber.foreground': '#90908a',
        'editorLineNumber.activeForeground': '#c4c4bf',
        'editorIndentGuide.background': '#464741',
        'editorIndentGuide.activeBackground': '#767771',
      },
    })

    monaco.editor.defineTheme('dracula', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: 'f8f8f2' },
        { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff79c6' },
        { token: 'string', foreground: 'f1fa8c' },
        { token: 'number', foreground: 'bd93f9' },
        { token: 'type', foreground: '8be9fd' },
        { token: 'type.identifier', foreground: '8be9fd' },
        { token: 'function', foreground: '50fa7b' },
        { token: 'variable', foreground: 'f8f8f2' },
        { token: 'delimiter', foreground: 'f8f8f2' },
      ],
      colors: {
        'editor.background': '#282a36',
        'editor.foreground': '#f8f8f2',
        'editorCursor.foreground': '#f8f8f2',
        'editor.selectionBackground': '#44475a',
        'editor.inactiveSelectionBackground': '#343746',
        'editor.lineHighlightBackground': '#44475a44',
        'editorLineNumber.foreground': '#6272a4',
        'editorLineNumber.activeForeground': '#f8f8f2',
        'editorIndentGuide.background': '#3b3d4f',
        'editorIndentGuide.activeBackground': '#6272a4',
      },
    })

    monaco.editor.defineTheme('solarized-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: '839496' },
        { token: 'comment', foreground: '586e75', fontStyle: 'italic' },
        { token: 'keyword', foreground: '859900' },
        { token: 'string', foreground: '2aa198' },
        { token: 'number', foreground: 'd33682' },
        { token: 'type', foreground: 'b58900' },
        { token: 'type.identifier', foreground: 'b58900' },
        { token: 'function', foreground: '268bd2' },
        { token: 'variable', foreground: '839496' },
        { token: 'delimiter', foreground: '839496' },
      ],
      colors: {
        'editor.background': '#002b36',
        'editor.foreground': '#839496',
        'editorCursor.foreground': '#839496',
        'editor.selectionBackground': '#073642',
        'editor.inactiveSelectionBackground': '#002129',
        'editor.lineHighlightBackground': '#073642',
        'editorLineNumber.foreground': '#586e75',
        'editorLineNumber.activeForeground': '#93a1a1',
        'editorIndentGuide.background': '#073642',
        'editorIndentGuide.activeBackground': '#586e75',
      },
    })
  } catch (e) {
    // Ignore theme re-definition errors
  }
}

function EditorPanel({
  activeFile,
  openFiles = [],
  onSelectFile,
  onCloseTab,
  onCreateFile,
  onDeleteFile,
  onChange,
  isRunning,
  onRunClick,
  editorSettings,
  onEditorSettingsChange,
  isSettingsOpen,
  onCloseSettings,
  saveMessage,
}) {
  const monacoLanguage = activeFile
    ? getMonacoLanguageFromFileName(activeFile.name)
    : 'plaintext'

  const selectedTheme = editorSettings.theme ?? 'vs-dark'

  const settingsContainerRef = useRef(null)
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const globalMonaco = useMonaco()

  const validTabSizes = [2, 4, 8]
  const parsedTabSize = Number(editorSettings.tabSize)
  const tabSize = validTabSizes.includes(parsedTabSize) ? parsedTabSize : 4

  const autoIndentSetting =
    editorSettings.autoIndent === false || editorSettings.autoIndent === 'none'
      ? 'none'
      : 'full'

  const editorOptions = {
    ...baseEditorOptions,
    fontSize: editorSettings.fontSize,
    wordWrap:
      typeof editorSettings.wordWrap === 'boolean'
        ? editorSettings.wordWrap
          ? 'on'
          : 'off'
        : editorSettings.wordWrap ?? 'on',
    minimap: { enabled: editorSettings.minimap },
    lineNumbers:
      typeof editorSettings.lineNumbers === 'boolean'
        ? editorSettings.lineNumbers
          ? 'on'
          : 'off'
        : editorSettings.lineNumbers ?? 'on',
    tabSize,
    autoIndent: autoIndentSetting,
    automaticLayout: editorSettings.automaticLayout,
  }

  useEffect(() => {
    const handleDocumentMouseDown = (event) => {
      if (!isSettingsOpen) {
        return
      }

      if (settingsContainerRef.current && !settingsContainerRef.current.contains(event.target)) {
        onCloseSettings?.()
      }
    }

    document.addEventListener('mousedown', handleDocumentMouseDown)

    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown)
    }
  }, [isSettingsOpen, onCloseSettings])

  useEffect(() => {
    if (editorRef.current && monacoRef.current && activeFile) {
      const model = editorRef.current.getModel()
      if (model) {
        const currentLang = model.getLanguageId()
        if (currentLang !== monacoLanguage) {
          monacoRef.current.editor.setModelLanguage(model, monacoLanguage)
        }
      }
    }
  }, [monacoLanguage, activeFile])

  useEffect(() => {
    const activeMonaco = globalMonaco || monacoRef.current
    if (activeMonaco && selectedTheme) {
      defineMonacoThemes(activeMonaco)
      activeMonaco.editor.setTheme(selectedTheme)
    }
  }, [globalMonaco, selectedTheme])

  return (
    <section className="editor-panel" aria-labelledby="editor-panel-title">
      <div className="panel-heading">
        <div>
          <p className="panel-heading__eyebrow">Editor</p>
          <div className="panel-heading__title-row">
            <h2 id="editor-panel-title" className="panel-heading__title">
              {activeFile ? `${activeFile.name} workspace` : 'No open file'}
            </h2>
            {saveMessage ? (
              <span className="save-status-badge" role="status">
                ✓ {saveMessage}
              </span>
            ) : null}
          </div>
        </div>

        <div className="editor-panel__actions" ref={settingsContainerRef}>
          {isSettingsOpen ? (
            <div className="editor-settings__popover">
              <EditorSettings settings={editorSettings} onChange={onEditorSettingsChange} />
            </div>
          ) : null}

          <button type="button" className="run-button" disabled={isRunning || !activeFile} onClick={onRunClick}>
            {isRunning ? 'Running...' : 'Run'}
          </button>
        </div>
      </div>

      <EditorTabs
        openFiles={openFiles}
        activeFileName={activeFile?.name}
        onSelectFile={onSelectFile}
        onCloseTab={onCloseTab}
        onCreateFile={onCreateFile}
      />

      <div className="editor-panel__surface">
        {activeFile ? (
          <Editor
            path={activeFile.name}
            className="editor-panel__editor"
            defaultLanguage="plaintext"
            language={monacoLanguage}
            theme={selectedTheme}
            value={activeFile.code ?? activeFile.content ?? ''}
            onChange={onChange}
            onMount={(editor, monaco) => {
              editorRef.current = editor
              monacoRef.current = monaco
              defineMonacoThemes(monaco)
              monaco.editor.setTheme(selectedTheme)
            }}
            beforeMount={(monaco) => {
              defineMonacoThemes(monaco)
            }}
            options={editorOptions}
          />
        ) : (
          <div className="editor-panel__empty-state">
            <div className="editor-panel__empty-content">
              <span className="editor-panel__empty-icon">📂</span>
              <h3 className="editor-panel__empty-title">Select a file to start editing</h3>
              <p className="editor-panel__empty-description">
                Open a file from the File Explorer sidebar or click + to create a new file.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default EditorPanel