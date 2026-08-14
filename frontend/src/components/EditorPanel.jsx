import { useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import EditorSettings from './EditorSettings.jsx'
import EditorTabs from './EditorTabs.jsx'

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
  files,
  onSelectFile,
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
  const monacoLanguage = activeFile?.monacoLanguage ?? 'javascript'
  const settingsContainerRef = useRef(null)

  const editorOptions = {
    ...baseEditorOptions,
    fontSize: editorSettings.fontSize,
    wordWrap: editorSettings.wordWrap,
    minimap: { enabled: editorSettings.minimap },
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

  return (
    <section className="editor-panel" aria-labelledby="editor-panel-title">
      <div className="panel-heading">
        <div>
          <p className="panel-heading__eyebrow">Editor</p>
          <div className="panel-heading__title-row">
            <h2 id="editor-panel-title" className="panel-heading__title">
              {activeFile?.name ?? 'Editor'} workspace
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

          <button type="button" className="run-button" disabled={isRunning} onClick={onRunClick}>
            {isRunning ? 'Running...' : 'Run'}
          </button>
        </div>
      </div>

      <EditorTabs
        files={files}
        activeFileName={activeFile?.name}
        onSelectFile={onSelectFile}
        onCreateFile={onCreateFile}
        onDeleteFile={onDeleteFile}
      />

      <div className="editor-panel__surface">
        <Editor
          key={activeFile?.name}
          path={activeFile?.name}
          className="editor-panel__editor"
          defaultLanguage="javascript"
          language={monacoLanguage}
          theme="polyglotmesh-dark"
          value={activeFile?.code ?? ''}
          onChange={onChange}
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
      </div>
    </section>
  )
}

export default EditorPanel