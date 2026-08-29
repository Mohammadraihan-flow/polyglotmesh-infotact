import React, { useCallback, useEffect, useRef, useState } from 'react'
import Editor, { useMonaco } from '@monaco-editor/react'
import EditorSettings from './EditorSettings.jsx'
import EditorTabs from './EditorTabs.jsx'
import EditorStatusBar from './EditorStatusBar.jsx'
import EditorBreadcrumb from './EditorBreadcrumb.jsx'
import { getMonacoLanguageFromFileName } from '../utils/languageUtils.js'

class EditorErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Monaco Editor Error Boundary:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="editor-panel__error-state" role="alert" aria-live="assertive">
          <div className="editor-panel__error-content">
            <span className="editor-panel__error-icon" aria-hidden="true">
              ⚠️
            </span>
            <h3 className="editor-panel__error-title">Failed to load Editor</h3>
            <p className="editor-panel__error-description">
              Monaco Editor could not be initialized. Please check your connection or try again.
            </p>
            <button
              type="button"
              className="editor-panel__error-retry-btn"
              onClick={this.handleRetry}
              aria-label="Try loading Monaco Editor again"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const baseEditorOptions = {
  fontSize: 14,
  fontFamily: 'Cascadia Code, Consolas, "Courier New", monospace',
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  tabSize: 2,
  renderWhitespace: 'selection',
  folding: true,
  foldingStrategy: 'auto',
  showFoldingControls: 'always',
  foldingHighlight: true,
  find: {
    addExtraSpaceOnTop: false,
    autoFindInSelection: 'multiline',
    seedSearchStringFromSelection: 'always',
  },
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
        'editorGutter.foldingControlForeground': '#a6e22e',
        'editorWidget.background': '#272822',
        'editorWidget.foreground': '#f8f8f2',
        'editorWidget.border': '#75715e',
        'input.background': '#3e3d32',
        'input.foreground': '#f8f8f2',
        'input.border': '#75715e',
        'inputOption.activeBorder': '#a6e22e',
        'editor.findMatchBackground': '#e6db7444',
        'editor.findMatchHighlightBackground': '#49483e88',
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
        'editorGutter.foldingControlForeground': '#ff79c6',
        'editorWidget.background': '#282a36',
        'editorWidget.foreground': '#f8f8f2',
        'editorWidget.border': '#6272a4',
        'input.background': '#343746',
        'input.foreground': '#f8f8f2',
        'input.border': '#6272a4',
        'inputOption.activeBorder': '#ff79c6',
        'editor.findMatchBackground': '#ffb86c44',
        'editor.findMatchHighlightBackground': '#44475a88',
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
        'editorGutter.foldingControlForeground': '#268bd2',
        'editorWidget.background': '#002b36',
        'editorWidget.foreground': '#839496',
        'editorWidget.border': '#586e75',
        'input.background': '#073642',
        'input.foreground': '#93a1a1',
        'input.border': '#586e75',
        'inputOption.activeBorder': '#268bd2',
        'editor.findMatchBackground': '#b5890044',
        'editor.findMatchHighlightBackground': '#07364288',
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
  onToggleSettings,
  onCloseSettings,
  saveMessage,
}) {
  const safeEditorSettings = editorSettings || {}

  const monacoLanguage = activeFile
    ? getMonacoLanguageFromFileName(activeFile.name)
    : 'plaintext'

  const selectedTheme = safeEditorSettings.theme ?? 'vs-dark'

  const settingsContainerRef = useRef(null)
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const [editorInstance, setEditorInstance] = useState(null)
  const globalMonaco = useMonaco()

  const validTabSizes = [2, 4, 8]
  const parsedTabSize = Number(safeEditorSettings.tabSize)
  const tabSize = validTabSizes.includes(parsedTabSize) ? parsedTabSize : 4

  const autoIndentSetting =
    safeEditorSettings.autoIndent === false || safeEditorSettings.autoIndent === 'none'
      ? 'none'
      : 'full'

  const wordWrapSetting =
    safeEditorSettings.wordWrap === 'wordWrapColumn'
      ? 'wordWrapColumn'
      : safeEditorSettings.wordWrap === 'off' || safeEditorSettings.wordWrap === false
      ? 'off'
      : 'on'

  const bracketPairColorizationSetting =
    typeof safeEditorSettings.bracketPairColorization === 'boolean'
      ? safeEditorSettings.bracketPairColorization
      : true

  const showHoverSetting =
    typeof safeEditorSettings.showHover === 'boolean'
      ? safeEditorSettings.showHover
      : true

  const autoSuggestionsSetting =
    typeof safeEditorSettings.autoSuggestions === 'boolean'
      ? safeEditorSettings.autoSuggestions
      : true

  const editorOptions = {
    ...baseEditorOptions,
    fontSize: safeEditorSettings.fontSize ?? 14,
    wordWrap: wordWrapSetting,
    minimap: { enabled: safeEditorSettings.minimap ?? true },
    lineNumbers:
      typeof safeEditorSettings.lineNumbers === 'boolean'
        ? safeEditorSettings.lineNumbers
          ? 'on'
          : 'off'
        : safeEditorSettings.lineNumbers ?? 'on',
    tabSize,
    autoIndent: autoIndentSetting,
    automaticLayout: safeEditorSettings.automaticLayout ?? true,
    bracketPairColorization: {
      enabled: bracketPairColorizationSetting,
    },
    guides: {
      bracketPairs: bracketPairColorizationSetting,
      bracketPairsHorizontal: bracketPairColorizationSetting,
      highlightActiveBracketPair: bracketPairColorizationSetting,
      indentation: true,
    },
    hover: {
      enabled: showHoverSetting,
      delay: 300,
      sticky: true,
    },
    quickSuggestions: autoSuggestionsSetting
      ? { other: true, comments: false, strings: false }
      : { other: false, comments: false, strings: false },
    suggestOnTriggerCharacters: autoSuggestionsSetting,
    parameterHints: {
      enabled: autoSuggestionsSetting,
      cycle: true,
    },
    wordBasedSuggestions: autoSuggestionsSetting ? 'currentDocument' : 'off',
    snippetSuggestions: 'inline',
    acceptSuggestionOnEnter: 'on',
    tabCompletion: 'on',
  }

  const viewStatesRef = useRef({})
  const activeFileNameRef = useRef(activeFile?.name)

  const handleFoldAll = () => {
    const editor = editorInstance || editorRef.current
    if (editor) {
      editor.focus()
      const foldAction = editor.getAction('editor.foldAll')
      if (foldAction) {
        foldAction.run()
      } else {
        editor.trigger('fold', 'editor.foldAll')
      }
    }
  }

  const handleUnfoldAll = () => {
    const editor = editorInstance || editorRef.current
    if (editor) {
      editor.focus()
      const unfoldAction = editor.getAction('editor.unfoldAll')
      if (unfoldAction) {
        unfoldAction.run()
      } else {
        editor.trigger('unfold', 'editor.unfoldAll')
      }
    }
  }

  const currentFontSize = editorSettings?.fontSize ?? 14

  const handleZoomIn = () => {
    const nextSize = Math.min(32, currentFontSize + 1)
    onEditorSettingsChange?.({ ...editorSettings, fontSize: nextSize })
  }

  const handleZoomOut = () => {
    const nextSize = Math.max(10, currentFontSize - 1)
    onEditorSettingsChange?.({ ...editorSettings, fontSize: nextSize })
  }

  const handleResetZoom = () => {
    onEditorSettingsChange?.({ ...editorSettings, fontSize: 14 })
  }

  const saveCurrentViewState = useCallback(() => {
    const editor = editorRef.current || editorInstance
    const currentName = activeFileNameRef.current
    if (editor && currentName) {
      try {
        const state = editor.saveViewState()
        if (state) {
          viewStatesRef.current[currentName] = state
        }
      } catch (e) {
        // Ignore
      }
    }
  }, [editorInstance])

  useEffect(() => {
    saveCurrentViewState()
    activeFileNameRef.current = activeFile?.name
  }, [activeFile?.name, saveCurrentViewState])

  useEffect(() => {
    const editor = editorInstance || editorRef.current
    if (!editor || !activeFile?.name) return

    const currentName = activeFile.name
    if (viewStatesRef.current[currentName]) {
      try {
        editor.restoreViewState(viewStatesRef.current[currentName])
      } catch (e) {
        // Ignore
      }
    }
  }, [activeFile?.name, editorInstance])

  useEffect(() => {
    const openNamesSet = new Set(openFiles.map((f) => f.name))
    Object.keys(viewStatesRef.current).forEach((name) => {
      if (!openNamesSet.has(name)) {
        delete viewStatesRef.current[name]
      }
    })
  }, [openFiles])

  const handleOpenCommandPalette = useCallback(() => {
    const editor = editorInstance || editorRef.current
    if (editor) {
      editor.focus()
      const action = editor.getAction('editor.action.quickCommand')
      if (action) {
        action.run()
      } else {
        editor.trigger('toolbar', 'editor.action.quickCommand')
      }
    }
  }, [editorInstance])

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault()
        handleOpenCommandPalette()
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [handleOpenCommandPalette])

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions(editorOptions)
    }
  }, [
    editorSettings,
    wordWrapSetting,
    tabSize,
    autoIndentSetting,
    bracketPairColorizationSetting,
    showHoverSetting,
    autoSuggestionsSetting,
  ])

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
              <EditorSettings
                settings={editorSettings}
                onChange={onEditorSettingsChange}
                onFoldAll={handleFoldAll}
                onUnfoldAll={handleUnfoldAll}
              />
            </div>
          ) : null}

          <button
            type="button"
            className="command-palette-button"
            aria-label="Command Palette"
            title="Command Palette (Ctrl+Shift+P)"
            onClick={handleOpenCommandPalette}
            disabled={!activeFile}
          >
            <span className="command-palette-button__icon">⌘</span>
            <span className="command-palette-button__text">Command Palette</span>
          </button>

          <div className="editor-panel__zoom-controls" role="group" aria-label="Editor Zoom Controls">
            <button
              type="button"
              className="editor-panel__zoom-btn"
              onClick={handleZoomOut}
              disabled={currentFontSize <= 10}
              title="Zoom Out (Ctrl+-)"
              aria-label="Zoom Out"
            >
              −
            </button>
            <button
              type="button"
              className={`editor-panel__zoom-reset-btn${currentFontSize === 14 ? ' editor-panel__zoom-reset-btn--disabled' : ''}`}
              onClick={handleResetZoom}
              disabled={currentFontSize === 14}
              title={`Reset Zoom (${currentFontSize}px)`}
              aria-label="Reset Zoom"
            >
              {currentFontSize}px
            </button>
            <button
              type="button"
              className="editor-panel__zoom-btn"
              onClick={handleZoomIn}
              disabled={currentFontSize >= 32}
              title="Zoom In (Ctrl+=)"
              aria-label="Zoom In"
            >
              +
            </button>
          </div>

          <button
            type="button"
            className="settings-button"
            aria-label="Settings"
            title="Settings"
            onClick={onToggleSettings}
          >
            ⚙️
          </button>

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
          <EditorErrorBoundary>
            <EditorBreadcrumb activeFile={activeFile} />
            <Editor
              path={activeFile.name}
              className="editor-panel__editor"
              defaultLanguage="plaintext"
              language={monacoLanguage}
              theme={selectedTheme}
              value={activeFile.code ?? activeFile.content ?? ''}
              onChange={onChange}
              loading={
                <div className="editor-panel__loading-state" role="status" aria-live="polite">
                  <div className="editor-panel__loading-spinner" aria-hidden="true" />
                  <p className="editor-panel__loading-title">Loading Editor...</p>
                  <p className="editor-panel__loading-subtext">Initializing Monaco Editor workspace</p>
                </div>
              }
              onMount={(editor, monaco) => {
                editorRef.current = editor
                monacoRef.current = monaco
                setEditorInstance(editor)
                if (typeof window !== 'undefined') {
                  window.monaco = monaco
                }
                defineMonacoThemes(monaco)
                monaco.editor.setTheme(selectedTheme)

                try {
                  editor.addCommand(
                    monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
                    () => {
                      const action = editor.getAction('editor.action.quickCommand')
                      if (action) {
                        action.run()
                      } else {
                        editor.trigger('keyboard', 'editor.action.quickCommand')
                      }
                    }
                  )
                } catch (e) {
                  // Ignore if shortcut binding exists
                }

                editor.onDidChangeCursorPosition(() => {
                  if (activeFileNameRef.current) {
                    try {
                      const state = editor.saveViewState()
                      if (state) {
                        viewStatesRef.current[activeFileNameRef.current] = state
                      }
                    } catch (e) {
                      // Ignore
                    }
                  }
                })

                editor.onDidScrollChange(() => {
                  if (activeFileNameRef.current) {
                    try {
                      const state = editor.saveViewState()
                      if (state) {
                        viewStatesRef.current[activeFileNameRef.current] = state
                      }
                    } catch (e) {
                      // Ignore
                    }
                  }
                })

                editor.onDidChangeModel(() => {
                  const currentName = activeFileNameRef.current
                  if (currentName && viewStatesRef.current[currentName]) {
                    try {
                      editor.restoreViewState(viewStatesRef.current[currentName])
                    } catch (e) {
                      // Ignore
                    }
                  }
                })
              }}
              beforeMount={(monaco) => {
                defineMonacoThemes(monaco)
              }}
              options={editorOptions}
            />
            <EditorStatusBar
              editor={editorInstance || editorRef.current}
              activeFile={activeFile}
              editorSettings={editorSettings}
              saveMessage={saveMessage}
            />
          </EditorErrorBoundary>
        ) : (
          <div className="editor-panel__empty-state" role="region" aria-label="No file selected">
            <div className="editor-panel__empty-content">
              <span className="editor-panel__empty-icon" aria-hidden="true">📂</span>
              <h3 className="editor-panel__empty-title">No file selected</h3>
              <p className="editor-panel__empty-description">
                Create or select a file to start editing
              </p>
              {onCreateFile ? (
                <button
                  type="button"
                  className="editor-panel__empty-create-btn"
                  onClick={() => onCreateFile('untitled.js')}
                  aria-label="Create new file"
                >
                  + Create File
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default EditorPanel