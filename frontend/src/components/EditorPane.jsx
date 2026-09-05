import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import Editor from '@monaco-editor/react'
import EditorTabs from './EditorTabs.jsx'
import EditorBreadcrumb from './EditorBreadcrumb.jsx'
import PeekDefinitionWidget from './PeekDefinitionWidget.jsx'
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

function EditorPane({
  paneId = 'primary',
  file,
  isActive = false,
  isSplit = false,
  openFiles = [],
  onActivate,
  onSelectFile,
  onCloseTab,
  onCreateFile,
  onCloseSplit,
  onToggleReadOnly,
  onChange,
  onMount,
  editorOptions,
  selectedTheme = 'vs-dark',
  viewStatesRef,
  onGoToDefinition,
  onPeekDefinition,
  onFindReferences,
  onQuickFix,
  onFormatDocument,
  onUpdateModelDecorations,
  peekDefinitionData,
  onClosePeekDefinition,
  onSelectPeekDefinition,
}) {
  const editorRef = useRef(null)
  const editorContainerRef = useRef(null)
  const monacoRef = useRef(null)
  const fileRef = useRef(file)
  const customActionDisposablesRef = useRef([])
  const editorListenersDisposablesRef = useRef([])

  useEffect(() => {
    fileRef.current = file
  }, [file])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      editorListenersDisposablesRef.current.forEach((d) => {
        try {
          d?.dispose?.()
        } catch {
          // Ignore
        }
      })
      editorListenersDisposablesRef.current = []

      customActionDisposablesRef.current.forEach((d) => {
        try {
          d?.dispose?.()
        } catch {
          // Ignore
        }
      })
      customActionDisposablesRef.current = []
    }
  }, [])

  useEffect(() => {
    const container = editorContainerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return undefined

    const observer = new ResizeObserver(() => {
      editorRef.current?.layout()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const monacoLanguage = file
    ? getMonacoLanguageFromFileName(file.name)
    : 'plaintext'

  const editorOptionsWithReadOnly = useMemo(
    () => ({
      ...editorOptions,
      readOnly: Boolean(file?.isReadOnly),
      domReadOnly: Boolean(file?.isReadOnly),
    }),
    [editorOptions, file?.isReadOnly],
  )

  const handleEditorChange = useCallback(
    (value) => {
      if (!file?.isReadOnly) {
        onChange?.(value, file?.name)
      }
    },
    [file, onChange],
  )

  // Notify parent of activation on pane click or focus
  const handlePaneClick = useCallback(() => {
    if (!isActive && onActivate) {
      onActivate(paneId)
    }
  }, [isActive, onActivate, paneId])

  // Save view state on cursor or scroll
  const saveViewState = useCallback(() => {
    const currentFileName = fileRef.current?.name
    if (editorRef.current && currentFileName && viewStatesRef?.current) {
      try {
        const state = editorRef.current.saveViewState()
        if (state) {
          viewStatesRef.current[currentFileName] = state
        }
      } catch {
        // Ignore
      }
    }
  }, [viewStatesRef])

  // Restore view state when file changes
  useEffect(() => {
    if (!editorRef.current || !file?.name || !viewStatesRef?.current) return
    const savedState = viewStatesRef.current[file.name]
    if (savedState) {
      try {
        editorRef.current.restoreViewState(savedState)
      } catch {
        // Ignore
      }
    }
  }, [file?.name, viewStatesRef])

  // Sync language with model if language changes
  useEffect(() => {
    if (editorRef.current && monacoRef.current && file) {
      const model = editorRef.current.getModel()
      if (model && !model.isDisposed()) {
        const currentLang = model.getLanguageId()
        if (currentLang !== monacoLanguage) {
          monacoRef.current.editor.setModelLanguage(model, monacoLanguage)
        }
      }
    }
  }, [monacoLanguage, file])

  // Update options on this editor instance
  useEffect(() => {
    if (editorRef.current && editorOptions) {
      editorRef.current.updateOptions({
        ...editorOptions,
        readOnly: Boolean(file?.isReadOnly),
        domReadOnly: Boolean(file?.isReadOnly),
      })
    }
  }, [editorOptions, file?.isReadOnly])

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    if (typeof window !== 'undefined') {
      window.monaco = monaco
      if (isActive || paneId === 'primary') {
        window.__polyglotmeshActiveEditor = editor
      }
    }

    // Pass editor instance up to parent
    onMount?.(editor, monaco, paneId)

    // Clean up previous event listener disposables
    editorListenersDisposablesRef.current.forEach((d) => {
      try {
        d?.dispose?.()
      } catch {
        // Ignore
      }
    })
    editorListenersDisposablesRef.current = []

    // Focus listener to set active pane
    const dFocus = editor.onDidFocusEditorWidget(() => {
      onActivate?.(paneId)
      if (typeof window !== 'undefined') {
        window.__polyglotmeshActiveEditor = editor
      }
    })
    if (dFocus) editorListenersDisposablesRef.current.push(dFocus)

    const dCursor = editor.onDidChangeCursorPosition(() => {
      saveViewState()
    })
    if (dCursor) editorListenersDisposablesRef.current.push(dCursor)

    const dScroll = editor.onDidScrollChange(() => {
      saveViewState()
    })
    if (dScroll) editorListenersDisposablesRef.current.push(dScroll)

    const dModel = editor.onDidChangeModel(() => {
      const currentFile = fileRef.current
      if (currentFile?.name && viewStatesRef?.current?.[currentFile.name]) {
        try {
          editor.restoreViewState(viewStatesRef.current[currentFile.name])
        } catch {
          // Ignore
        }
      }
      onUpdateModelDecorations?.(editor, monaco, currentFile)
    })
    if (dModel) editorListenersDisposablesRef.current.push(dModel)

    // Register commands on this specific editor instance
    try {
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
        () => {
          const action = editor.getAction('editor.action.quickCommand')
          if (action) action.run()
          else editor.trigger('keyboard', 'editor.action.quickCommand')
        }
      )
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyI,
        () => {
          onFormatDocument?.(editor)
        }
      )
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Period,
        () => {
          onQuickFix?.(editor)
        }
      )
      editor.addCommand(monaco.KeyCode.F12, () => {
        onGoToDefinition?.(editor, fileRef.current)
      })
      editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.F12, () => {
        onPeekDefinition?.(editor, fileRef.current)
      })
      editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.F12, () => {
        onFindReferences?.(editor, fileRef.current)
      })
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD,
        () => {
          const act = editor.getAction('editor.action.addSelectionToNextFindMatch')
          if (act) act.run()
          else editor.trigger('keyboard', 'editor.action.addSelectionToNextFindMatch')
        }
      )
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL,
        () => {
          const act = editor.getAction('editor.action.selectHighlights')
          if (act) act.run()
          else editor.trigger('keyboard', 'editor.action.selectHighlights')
        }
      )
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.UpArrow,
        () => {
          const act = editor.getAction('editor.action.insertCursorAbove')
          if (act) act.run()
          else editor.trigger('keyboard', 'editor.action.insertCursorAbove')
        }
      )
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.DownArrow,
        () => {
          const act = editor.getAction('editor.action.insertCursorBelow')
          if (act) act.run()
          else editor.trigger('keyboard', 'editor.action.insertCursorBelow')
        }
      )
      editor.addCommand(
        monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyI,
        () => {
          const act = editor.getAction('editor.action.insertCursorAtEndOfEachLineSelected')
          if (act) act.run()
          else editor.trigger('keyboard', 'editor.action.insertCursorAtEndOfEachLineSelected')
        }
      )
      editor.addCommand(
        monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.RightArrow,
        () => {
          const act = editor.getAction('editor.action.smartSelect.expand')
          if (act) act.run()
          else editor.trigger('keyboard', 'editor.action.smartSelect.expand')
        }
      )
      editor.addCommand(
        monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.LeftArrow,
        () => {
          const act = editor.getAction('editor.action.smartSelect.shrink')
          if (act) act.run()
          else editor.trigger('keyboard', 'editor.action.smartSelect.shrink')
        }
      )
    } catch {
      // Ignore shortcut error
    }

    // Context menu deduplication
    try {
      const ctxMenuContrib = editor.getContribution('editor.contrib.contextmenu')
      if (ctxMenuContrib && !ctxMenuContrib._polyglotmeshWrapped) {
        const origGetMenuActions = ctxMenuContrib._getMenuActions.bind(ctxMenuContrib)
        ctxMenuContrib._getMenuActions = function (model, contextMenuId) {
          const list = origGetMenuActions(model, contextMenuId)
          return list.filter((item) => item.id !== 'editor.action.revealDefinition')
        }
        ctxMenuContrib._polyglotmeshWrapped = true
      }
    } catch {
      // Ignore
    }

    // Clean up previous custom action disposables
    customActionDisposablesRef.current.forEach((d) => {
      try {
        d?.dispose?.()
      } catch {
        // Ignore
      }
    })
    customActionDisposablesRef.current = []

    try {
      const dGoto = editor.addAction({
        id: `polyglotmesh.gotoDefinition.${paneId}`,
        label: 'Go to Definition',
        keybindings: [monaco.KeyCode.F12],
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.1,
        run: () => {
          onGoToDefinition?.(editor, fileRef.current)
        },
      })
      if (dGoto) customActionDisposablesRef.current.push(dGoto)

      const dPeek = editor.addAction({
        id: `polyglotmesh.peekDefinition.${paneId}`,
        label: 'Peek Definition',
        keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.F12],
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.2,
        run: () => {
          onPeekDefinition?.(editor, fileRef.current)
        },
      })
      if (dPeek) customActionDisposablesRef.current.push(dPeek)

      const dRefs = editor.addAction({
        id: `polyglotmesh.findReferences.${paneId}`,
        label: 'Find All References',
        keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.F12],
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.3,
        run: () => {
          onFindReferences?.(editor, fileRef.current)
        },
      })
      if (dRefs) customActionDisposablesRef.current.push(dRefs)

      const dToggleReadOnly = editor.addAction({
        id: `polyglotmesh.toggleReadOnly.${paneId}`,
        label: 'Toggle Read-Only / Preview Mode',
        keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyP],
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.4,
        run: () => {
          onToggleReadOnly?.(fileRef.current?.name)
        },
      })
      if (dToggleReadOnly) customActionDisposablesRef.current.push(dToggleReadOnly)

      const dQuickFix = editor.addAction({
        id: `polyglotmesh.quickFix.${paneId}`,
        label: 'Quick Fix / Code Actions',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Period],
        contextMenuGroupId: '1_modification',
        contextMenuOrder: 0.5,
        run: () => {
          onQuickFix?.(editor)
        },
      })
      if (dQuickFix) customActionDisposablesRef.current.push(dQuickFix)

      const dSelectAll = editor.addAction({
        id: `polyglotmesh.selectAll.${paneId}`,
        label: 'Select All',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA],
        contextMenuGroupId: '9_cutcopypaste',
        contextMenuOrder: 4,
        run: (ed) => {
          ed.focus()
          const act = ed.getAction('editor.action.selectAll')
          if (act) act.run()
          else ed.trigger('contextmenu', 'selectAll')
        },
      })
      if (dSelectAll) customActionDisposablesRef.current.push(dSelectAll)

      const dNextOccur = editor.addAction({
        id: `polyglotmesh.addNextOccurrence.${paneId}`,
        label: 'Add Next Occurrence',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD],
        contextMenuGroupId: '2_selection',
        contextMenuOrder: 1,
        run: (ed) => {
          ed.focus()
          const act = ed.getAction('editor.action.addSelectionToNextFindMatch')
          if (act) act.run()
          else ed.trigger('contextmenu', 'editor.action.addSelectionToNextFindMatch')
        },
      })
      if (dNextOccur) customActionDisposablesRef.current.push(dNextOccur)

      const dSelectAllOccur = editor.addAction({
        id: `polyglotmesh.selectAllOccurrences.${paneId}`,
        label: 'Select All Occurrences',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL],
        contextMenuGroupId: '2_selection',
        contextMenuOrder: 2,
        run: (ed) => {
          ed.focus()
          const act = ed.getAction('editor.action.selectHighlights')
          if (act) act.run()
          else ed.trigger('contextmenu', 'editor.action.selectHighlights')
        },
      })
      if (dSelectAllOccur) customActionDisposablesRef.current.push(dSelectAllOccur)

      const dExpandSel = editor.addAction({
        id: `polyglotmesh.expandSelection.${paneId}`,
        label: 'Expand Selection',
        keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.RightArrow],
        contextMenuGroupId: '2_selection',
        contextMenuOrder: 3,
        run: (ed) => {
          ed.focus()
          const act = ed.getAction('editor.action.smartSelect.expand')
          if (act) act.run()
          else ed.trigger('contextmenu', 'editor.action.smartSelect.expand')
        },
      })
      if (dExpandSel) customActionDisposablesRef.current.push(dExpandSel)

      const dShrinkSel = editor.addAction({
        id: `polyglotmesh.shrinkSelection.${paneId}`,
        label: 'Shrink Selection',
        keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.LeftArrow],
        contextMenuGroupId: '2_selection',
        contextMenuOrder: 4,
        run: (ed) => {
          ed.focus()
          const act = ed.getAction('editor.action.smartSelect.shrink')
          if (act) act.run()
          else ed.trigger('contextmenu', 'editor.action.smartSelect.shrink')
        },
      })
      if (dShrinkSel) customActionDisposablesRef.current.push(dShrinkSel)

      const dCursorAbove = editor.addAction({
        id: `polyglotmesh.addCursorAbove.${paneId}`,
        label: 'Add Cursor Above',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.UpArrow],
        run: (ed) => {
          ed.focus()
          const act = ed.getAction('editor.action.insertCursorAbove')
          if (act) act.run()
          else ed.trigger('keyboard', 'editor.action.insertCursorAbove')
        },
      })
      if (dCursorAbove) customActionDisposablesRef.current.push(dCursorAbove)

      const dCursorBelow = editor.addAction({
        id: `polyglotmesh.addCursorBelow.${paneId}`,
        label: 'Add Cursor Below',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.DownArrow],
        run: (ed) => {
          ed.focus()
          const act = ed.getAction('editor.action.insertCursorBelow')
          if (act) act.run()
          else ed.trigger('keyboard', 'editor.action.insertCursorBelow')
        },
      })
      if (dCursorBelow) customActionDisposablesRef.current.push(dCursorBelow)

      const dCursorsToLineEnds = editor.addAction({
        id: `polyglotmesh.addCursorsToLineEnds.${paneId}`,
        label: 'Add Cursors to Line Ends',
        keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyI],
        run: (ed) => {
          ed.focus()
          const act = ed.getAction('editor.action.insertCursorAtEndOfEachLineSelected')
          if (act) act.run()
          else ed.trigger('keyboard', 'editor.action.insertCursorAtEndOfEachLineSelected')
        },
      })
      if (dCursorsToLineEnds) customActionDisposablesRef.current.push(dCursorsToLineEnds)

      const dColSel = editor.addAction({
        id: `polyglotmesh.toggleColumnSelection.${paneId}`,
        label: 'Toggle Column Selection Mode',
        run: (ed) => {
          ed.focus()
          const act = ed.getAction('editor.action.toggleColumnSelection')
          if (act) act.run()
          else ed.trigger('keyboard', 'editor.action.toggleColumnSelection')
        },
      })
      if (dColSel) customActionDisposablesRef.current.push(dColSel)
    } catch {
      // Ignore registration error
    }

    onUpdateModelDecorations?.(editor, monaco, fileRef.current)
  }

  return (
    <div
      className={`editor-pane editor-pane--${paneId} ${
        isActive ? 'editor-pane--active' : 'editor-pane--inactive'
      }`}
      onMouseDown={handlePaneClick}
      data-pane={paneId}
    >
      <div className="editor-pane__header-bar">
        <div className="editor-pane__tabs-wrapper">
          <EditorTabs
            openFiles={openFiles}
            activeFileName={file?.name}
            onSelectFile={(name) => onSelectFile?.(name, paneId)}
            onCloseTab={(name) => onCloseTab?.(name, paneId)}
            onCreateFile={onCreateFile}
          />
        </div>

        <div className="editor-pane__controls">
          {file?.isReadOnly ? (
            <span
              className="editor-pane__readonly-badge"
              title={`${file.name} is in Read-Only Preview Mode`}
              aria-label="Read-Only Mode"
            >
              🔒 Read-Only
            </span>
          ) : null}
          {isSplit ? (
            <>
              <span
                className={`editor-pane__indicator-badge ${
                  isActive ? 'editor-pane__indicator-badge--active' : ''
                }`}
                title={isActive ? 'Active Editor Pane' : 'Click to activate this pane'}
              >
                {paneId === 'primary' ? 'Pane 1' : 'Pane 2'}
                {isActive ? ' • Active' : ''}
              </span>
              {paneId === 'secondary' && onCloseSplit ? (
                <button
                  type="button"
                  className="editor-pane__close-split-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    onCloseSplit()
                  }}
                  aria-label="Close secondary editor pane"
                  title="Close Split (Ctrl+\)"
                >
                  ✕
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div ref={editorContainerRef} className="editor-pane__body">
        {file ? (
          <EditorErrorBoundary>
            <EditorBreadcrumb activeFile={file} />
            {peekDefinitionData ? (
              <PeekDefinitionWidget
                definition={peekDefinitionData}
                onGoToDefinition={(def) => {
                  onSelectPeekDefinition?.(def, paneId)
                }}
                onClose={onClosePeekDefinition}
              />
            ) : null}
            <Editor
              path={file.name}
              keepCurrentModel
              className="editor-panel__editor"
              defaultLanguage={monacoLanguage}
              language={monacoLanguage}
              theme={selectedTheme}
              defaultValue={file.code ?? file.content ?? ''}
              onChange={handleEditorChange}
              loading={
                <div className="editor-panel__loading-state" role="status" aria-live="polite">
                  <div className="editor-panel__loading-spinner" aria-hidden="true" />
                  <p className="editor-panel__loading-title">Loading Editor...</p>
                  <p className="editor-panel__loading-subtext">
                    Initializing Monaco Editor workspace
                  </p>
                </div>
              }
              onMount={handleEditorMount}
              options={editorOptionsWithReadOnly}
            />
          </EditorErrorBoundary>
        ) : (
          <div className="editor-panel__empty-state" role="region" aria-label="No file selected">
            <div className="editor-panel__empty-content">
              <span className="editor-panel__empty-icon" aria-hidden="true">
                📂
              </span>
              <h3 className="editor-panel__empty-title">No file selected</h3>
              <p className="editor-panel__empty-description">
                {isSplit && paneId === 'secondary'
                  ? 'Select a file from the explorer or tabs to view side-by-side'
                  : 'Create or select a file to start editing'}
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
    </div>
  )
}

export default React.memo(EditorPane)
