import Editor from '@monaco-editor/react'
import EditorTabs from './EditorTabs.jsx'

const editorOptions = {
  automaticLayout: true,
  fontSize: 14,
  fontFamily: 'Cascadia Code, Consolas, "Courier New", monospace',
  lineNumbers: 'on',
  minimap: { enabled: true },
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  tabSize: 2,
  wordWrap: 'on',
  renderWhitespace: 'selection',
}

function EditorPanel({ activeFile, files, onSelectFile, onCreateFile, onDeleteFile, onChange }) {
  const monacoLanguage = activeFile?.monacoLanguage ?? 'javascript'

  return (
    <section className="editor-panel" aria-labelledby="editor-panel-title">
      <div className="panel-heading">
        <div>
          <p className="panel-heading__eyebrow">Editor</p>
          <h2 id="editor-panel-title" className="panel-heading__title">
            {activeFile?.name ?? 'Editor'} workspace
          </h2>
        </div>

        <button type="button" className="run-button" disabled>
          Run
        </button>
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