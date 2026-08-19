import { useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
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

  const settingsContainerRef = useRef(null)
  const editorRef = useRef(null)
  const monacoRef = useRef(null)

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
            theme="polyglotmesh-dark"
            value={activeFile.code ?? activeFile.content ?? ''}
            onChange={onChange}
            onMount={(editor, monaco) => {
              editorRef.current = editor
              monacoRef.current = monaco
            }}
            beforeMount={(monaco) => {
              monaco.editor.defineTheme('polyglotmesh-dark', {
                base: 'vs-dark',
                inherit: true,
                rules: [
                  { token: '', foreground: 'd4d4d4' },
                  { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
                  { token: 'keyword', foreground: 'c586c0' },
                  { token: 'string', foreground: 'ce9178' },
                  { token: 'number', foreground: 'b5cea8' },
                  { token: 'type.identifier', foreground: '4ec9b0' },
                ],
                colors: {
                  'editor.background': '#1e1e1e',
                  'editor.foreground': '#d4d4d4',
                  'editorLineNumber.foreground': '#858585',
                  'editorLineNumber.activeForeground': '#c6c6c6',
                  'editorCursor.foreground': '#ffffff',
                  'editor.selectionBackground': '#264f78',
                  'editor.inactiveSelectionBackground': '#3a3d41',
                  'editor.lineHighlightBackground': '#2a2d2e',
                  'editorIndentGuide.background1': '#404040',
                  'editorIndentGuide.activeBackground1': '#707070',
                  'scrollbarSlider.background': '#5a5a5a66',
                  'scrollbarSlider.hoverBackground': '#79797966',
                  'scrollbarSlider.activeBackground': '#bfbfbf66',
                },
              })
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