import React, { useCallback, useEffect, useRef, useState } from 'react'
import Editor, { useMonaco } from '@monaco-editor/react'
import EditorSettings from './EditorSettings.jsx'
import EditorTabs from './EditorTabs.jsx'
import EditorStatusBar from './EditorStatusBar.jsx'
import EditorBreadcrumb from './EditorBreadcrumb.jsx'
import PeekDefinitionWidget from './PeekDefinitionWidget.jsx'
import { getMonacoLanguageFromFileName } from '../utils/languageUtils.js'
import { findDefinition, findReferences } from '../utils/monacoNavigationService.js'

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
  cursorWidth: 2,
  cursorBlinking: 'smooth',
  cursorStyle: 'line',
  cursorSmoothCaretAnimation: 'on',
  cursorSurroundingLines: 1,
  cursorSurroundingLinesStyle: 'default',
  roundedSelection: true,
  selectionHighlight: true,
  occurrencesHighlight: 'singleFile',
  multiCursorModifier: 'alt',
  multiCursorPaste: 'spread',
  matchBrackets: 'always',
  formatOnType: false,
  lightbulb: { enabled: true },
  glyphMargin: true,
  overviewRulerLanes: 3,
  overviewRulerBorder: true,
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
        'editor.selectionHighlightBackground': '#49483e88',
        'editor.wordHighlightBackground': '#49483e66',
        'editor.wordHighlightStrongBackground': '#f9267244',
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
        'editorError.foreground': '#f87171',
        'editorWarning.foreground': '#fbbf24',
        'editorInfo.foreground': '#60a5fa',
        'editorHint.foreground': '#c084fc',
        'editorOverviewRuler.errorForeground': '#f87171cc',
        'editorOverviewRuler.warningForeground': '#fbbf24cc',
        'editorOverviewRuler.infoForeground': '#60a5facc',
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
        'editor.selectionHighlightBackground': '#44475a88',
        'editor.wordHighlightBackground': '#bd93f933',
        'editor.wordHighlightStrongBackground': '#ff79c644',
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
        'editorError.foreground': '#ff5555',
        'editorWarning.foreground': '#ffb86c',
        'editorInfo.foreground': '#8be9fd',
        'editorHint.foreground': '#bd93f9',
        'editorOverviewRuler.errorForeground': '#ff5555cc',
        'editorOverviewRuler.warningForeground': '#ffb86ccc',
        'editorOverviewRuler.infoForeground': '#8be9fdcc',
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
        'editor.selectionHighlightBackground': '#586e7555',
        'editor.wordHighlightBackground': '#073642aa',
        'editor.wordHighlightStrongBackground': '#2aa19844',
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
        'editorError.foreground': '#dc322f',
        'editorWarning.foreground': '#b58900',
        'editorInfo.foreground': '#268bd2',
        'editorHint.foreground': '#6c71c4',
        'editorOverviewRuler.errorForeground': '#dc322fcc',
        'editorOverviewRuler.warningForeground': '#b58900cc',
        'editorOverviewRuler.infoForeground': '#268bd2cc',
      },
    })
  } catch {
    // Ignore theme re-definition errors
  }
}

function EditorPanel({
  activeFile,
  openFiles = [],
  files = [],
  onSelectFile,
  onCloseTab,
  onCreateFile,
  onChange,
  isRunning,
  onRunClick,
  editorSettings,
  onEditorSettingsChange,
  isSettingsOpen,
  onToggleSettings,
  onCloseSettings,
  saveMessage,
  problems = [],
  onReferencesFound,
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
  const [codeActionFeedback, setCodeActionFeedback] = useState(null)
  const [navigationFeedback, setNavigationFeedback] = useState(null)
  const [peekDefinitionData, setPeekDefinitionData] = useState(null)
  const feedbackTimeoutRef = useRef(null)
  const navFeedbackTimerRef = useRef(null)
  const filesRef = useRef(files)
  filesRef.current = files
  const activeFileRef = useRef(activeFile)
  activeFileRef.current = activeFile
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

  const parameterHintsSetting =
    typeof safeEditorSettings.parameterHints === 'boolean'
      ? safeEditorSettings.parameterHints
      : true

  const stickyScrollSetting =
    typeof safeEditorSettings.stickyScroll === 'boolean'
      ? safeEditorSettings.stickyScroll
      : true

  const smoothScrollingSetting =
    typeof safeEditorSettings.smoothScrolling === 'boolean'
      ? safeEditorSettings.smoothScrolling
      : true

  const highlightActiveLineSetting =
    typeof safeEditorSettings.highlightActiveLine === 'boolean'
      ? safeEditorSettings.highlightActiveLine
      : true

  const renderWhitespaceSetting =
    ['none', 'boundary', 'selection', 'all'].includes(safeEditorSettings.renderWhitespace)
      ? safeEditorSettings.renderWhitespace
      : 'none'

  const cursorBlinkingSetting =
    ['smooth', 'blink', 'solid', 'phase', 'expand'].includes(safeEditorSettings.cursorBlinking)
      ? safeEditorSettings.cursorBlinking
      : 'smooth'

  const cursorStyleSetting =
    ['line', 'block', 'underline'].includes(safeEditorSettings.cursorStyle)
      ? safeEditorSettings.cursorStyle
      : 'line'

  const cursorSmoothCaretAnimationSetting =
    safeEditorSettings.cursorSmoothCaretAnimation === 'off' || safeEditorSettings.cursorSmoothCaretAnimation === false
      ? 'off'
      : 'on'

  const selectionHighlightSetting =
    typeof safeEditorSettings.selectionHighlight === 'boolean'
      ? safeEditorSettings.selectionHighlight
      : true

  const formatOnTypeSetting =
    typeof safeEditorSettings.formatOnType === 'boolean'
      ? safeEditorSettings.formatOnType
      : false

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
      enabled: parameterHintsSetting,
      cycle: true,
    },
    stickyScroll: {
      enabled: stickyScrollSetting,
      maxLineCount: 5,
    },
    smoothScrolling: smoothScrollingSetting,
    renderLineHighlight: highlightActiveLineSetting ? 'all' : 'none',
    renderWhitespace: renderWhitespaceSetting,
    cursorBlinking: cursorBlinkingSetting,
    cursorStyle: cursorStyleSetting,
    cursorSmoothCaretAnimation: cursorSmoothCaretAnimationSetting,
    cursorWidth: 2,
    cursorSurroundingLines: 1,
    cursorSurroundingLinesStyle: 'default',
    roundedSelection: true,
    selectionHighlight: selectionHighlightSetting,
    occurrencesHighlight: 'singleFile',
    multiCursorModifier: 'alt',
    multiCursorPaste: 'spread',
    matchBrackets: 'always',
    formatOnType: formatOnTypeSetting,
    wordBasedSuggestions: autoSuggestionsSetting ? 'currentDocument' : 'off',
    snippetSuggestions: 'inline',
    acceptSuggestionOnEnter: 'on',
    tabCompletion: 'on',
    lightbulb: { enabled: true },
    glyphMargin: true,
    overviewRulerLanes: 3,
    overviewRulerBorder: true,
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
      const unfoldAction = editor.getAction('editor.action.unfoldAll')
      if (unfoldAction) {
        unfoldAction.run()
      } else {
        editor.trigger('unfold', 'editor.unfoldAll')
      }
    }
  }

  const handleFormatDocument = useCallback(async () => {
    const editor = editorInstance || editorRef.current
    if (!editor || !activeFile) return
    try {
      editor.focus()
      const action = editor.getAction('editor.action.formatDocument')
      if (action) {
        await action.run()
      } else {
        editor.trigger('user', 'editor.action.formatDocument')
      }
    } catch {
      // Ignore if formatting provider is unavailable
    }
  }, [editorInstance, activeFile])

  const handleFormatSelection = useCallback(async () => {
    const editor = editorInstance || editorRef.current
    if (!editor || !activeFile) return
    try {
      editor.focus()
      const selection = editor.getSelection()
      if (!selection || selection.isEmpty()) {
        return
      }
      const action = editor.getAction('editor.action.formatSelection')
      if (action) {
        await action.run()
      } else {
        editor.trigger('user', 'editor.action.formatSelection')
      }
    } catch {
      // Ignore if formatting provider is unavailable
    }
  }, [editorInstance, activeFile])

  const showCodeActionFeedback = useCallback((msg) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
    }
    setCodeActionFeedback(msg)
    feedbackTimeoutRef.current = setTimeout(() => {
      setCodeActionFeedback(null)
    }, 3000)
  }, [])

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current)
      }
    }
  }, [])

  const handleQuickFix = useCallback(async () => {
    const editor = editorInstance || editorRef.current
    if (!editor || !activeFile) {
      showCodeActionFeedback('No active editor')
      return
    }

    try {
      editor.focus()
      const model = editor.getModel()
      if (!model) {
        showCodeActionFeedback('No active editor')
        return
      }

      let hasActions = false
      const monaco = monacoRef.current || globalMonaco || (typeof window !== 'undefined' ? window.monaco : null)
      if (monaco?.languages?.getCodeActions) {
        try {
          const position = editor.getPosition() || { lineNumber: 1, column: 1 }
          const selection = editor.getSelection()
          const range =
            selection && !selection.isEmpty()
              ? selection
              : new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)
          const markers = monaco.editor?.getModelMarkers
            ? monaco.editor.getModelMarkers({ resource: model.uri })
            : []
          const triggerType = monaco.languages.CodeActionTriggerType?.Invoke ?? 1

          const tokenSource = new monaco.CancellationTokenSource()
          const codeActionLists = await monaco.languages.getCodeActions(
            model,
            range,
            {
              trigger: triggerType,
              markers,
            },
            tokenSource.token
          )

          if (codeActionLists && Array.isArray(codeActionLists)) {
            for (const list of codeActionLists) {
              if (list && list.actions && list.actions.length > 0) {
                hasActions = true
                break
              }
            }
            for (const list of codeActionLists) {
              if (list?.dispose) {
                list.dispose()
              }
            }
          }
        } catch {
          // If checking getCodeActions fails or is unsupported, fall through
        }
      }

      const action = editor.getAction('editor.action.quickFix')
      if (action) {
        await action.run()
      } else {
        editor.trigger('user', 'editor.action.quickFix')
      }

      if (!hasActions) {
        showCodeActionFeedback('No code actions available')
      }
    } catch {
      showCodeActionFeedback('No code actions available')
    }
  }, [editorInstance, activeFile, globalMonaco, showCodeActionFeedback])

  useEffect(() => {
    const handleQuickFixEvent = () => {
      handleQuickFix()
    }
    window.addEventListener('polyglotmesh:quick-fix', handleQuickFixEvent)
    return () => {
      window.removeEventListener('polyglotmesh:quick-fix', handleQuickFixEvent)
    }
  }, [handleQuickFix])

  const showNavigationFeedback = useCallback((msg) => {
    if (navFeedbackTimerRef.current) {
      clearTimeout(navFeedbackTimerRef.current)
    }
    setNavigationFeedback(msg)
    navFeedbackTimerRef.current = setTimeout(() => {
      setNavigationFeedback(null)
    }, 3000)
  }, [])

  useEffect(() => {
    return () => {
      if (navFeedbackTimerRef.current) {
        clearTimeout(navFeedbackTimerRef.current)
      }
    }
  }, [])

  const handleGoToDefinition = useCallback(async () => {
    const editor = editorInstance || editorRef.current
    const monaco = monacoRef.current || globalMonaco || (typeof window !== 'undefined' ? window.monaco : null)
    if (!editor || !monaco || !activeFile) {
      showNavigationFeedback('No active editor')
      return
    }

    try {
      editor.focus()
      const result = await findDefinition(monaco, editor, activeFile, filesRef.current)
      if (result.success && result.definitions?.length > 0) {
        const def = result.definitions[0]
        setPeekDefinitionData(null)

        if (!def.isSameFile && def.targetFile) {
          onSelectFile?.(def.targetFile)
          const jump = () => {
            const currentEditors = monaco.editor?.getEditors?.() || [editor]
            const ed = currentEditors[0] || editor
            if (ed) {
              ed.setPosition({ lineNumber: def.range.startLineNumber, column: def.range.startColumn })
              ed.setSelection(def.range)
              ed.revealPositionInCenterIfOutsideViewport({ lineNumber: def.range.startLineNumber, column: def.range.startColumn })
              ed.focus()
            }
          }
          setTimeout(jump, 60)
          setTimeout(jump, 180)
          showNavigationFeedback(`Jumped to definition in ${def.targetFileName} (Line ${def.range.startLineNumber})`)
        } else {
          editor.setPosition({ lineNumber: def.range.startLineNumber, column: def.range.startColumn })
          editor.setSelection(def.range)
          editor.revealPositionInCenterIfOutsideViewport({ lineNumber: def.range.startLineNumber, column: def.range.startColumn })
          editor.focus()
          showNavigationFeedback(`Jumped to definition (Line ${def.range.startLineNumber})`)
        }
      } else {
        if (result.reason === 'no-symbol') {
          showNavigationFeedback('No symbol at cursor')
        } else {
          showNavigationFeedback(`Definition not available for "${result.symbolName || 'symbol'}"`)
        }
      }
    } catch {
      showNavigationFeedback('Definition query failed')
    }
  }, [editorInstance, globalMonaco, activeFile, onSelectFile, showNavigationFeedback])

  const handlePeekDefinition = useCallback(async () => {
    const editor = editorInstance || editorRef.current
    const monaco = monacoRef.current || globalMonaco || (typeof window !== 'undefined' ? window.monaco : null)
    if (!editor || !monaco || !activeFile) {
      showNavigationFeedback('No active editor')
      return
    }

    try {
      editor.focus()
      const result = await findDefinition(monaco, editor, activeFile, filesRef.current)
      if (result.success && result.definitions?.length > 0) {
        setPeekDefinitionData(result.definitions[0])
      } else {
        if (result.reason === 'no-symbol') {
          showNavigationFeedback('No symbol at cursor')
        } else {
          showNavigationFeedback(`Definition not available for "${result.symbolName || 'symbol'}"`)
        }
      }
    } catch {
      showNavigationFeedback('Peek definition query failed')
    }
  }, [editorInstance, globalMonaco, activeFile, showNavigationFeedback])

  const handleFindReferences = useCallback(async () => {
    const editor = editorInstance || editorRef.current
    const monaco = monacoRef.current || globalMonaco || (typeof window !== 'undefined' ? window.monaco : null)
    if (!editor || !monaco || !activeFile) {
      showNavigationFeedback('No active editor')
      return
    }

    try {
      editor.focus()
      const result = await findReferences(monaco, editor, activeFile, filesRef.current)
      if (result.success && result.references?.length > 0) {
        onReferencesFound?.(result.references, result.symbolName)
        window.dispatchEvent(new CustomEvent('polyglotmesh:show-references'))
        showNavigationFeedback(
          `Found ${result.references.length} ${result.references.length === 1 ? 'reference' : 'references'} for "${result.symbolName}"`
        )
      } else {
        if (result.reason === 'no-symbol') {
          showNavigationFeedback('No symbol at cursor')
        } else {
          onReferencesFound?.([], result.symbolName || '')
          window.dispatchEvent(new CustomEvent('polyglotmesh:show-references'))
          showNavigationFeedback(`No references found for "${result.symbolName || 'symbol'}"`)
        }
      }
    } catch {
      showNavigationFeedback('Find references query failed')
    }
  }, [editorInstance, globalMonaco, activeFile, onReferencesFound, showNavigationFeedback])

  const handleGoToDefinitionRef = useRef(handleGoToDefinition)
  handleGoToDefinitionRef.current = handleGoToDefinition
  const handlePeekDefinitionRef = useRef(handlePeekDefinition)
  handlePeekDefinitionRef.current = handlePeekDefinition
  const handleFindReferencesRef = useRef(handleFindReferences)
  handleFindReferencesRef.current = handleFindReferences

  useEffect(() => {
    const onGoToDef = () => handleGoToDefinitionRef.current?.()
    const onPeekDef = () => handlePeekDefinitionRef.current?.()
    const onFindRefs = () => handleFindReferencesRef.current?.()

    window.addEventListener('polyglotmesh:goto-definition', onGoToDef)
    window.addEventListener('polyglotmesh:peek-definition', onPeekDef)
    window.addEventListener('polyglotmesh:find-references', onFindRefs)

    return () => {
      window.removeEventListener('polyglotmesh:goto-definition', onGoToDef)
      window.removeEventListener('polyglotmesh:peek-definition', onPeekDef)
      window.removeEventListener('polyglotmesh:find-references', onFindRefs)
    }
  }, [])

  useEffect(() => {
    setPeekDefinitionData(null)
  }, [activeFile?.name])

  useEffect(() => {
    const monaco = monacoRef.current || globalMonaco || (typeof window !== 'undefined' ? window.monaco : null)
    if (!monaco?.editor || !Array.isArray(files) || files.length === 0) return

    files.forEach((file) => {
      try {
        const uri = monaco.Uri.parse(`file:///${file.name}`)
        let m = monaco.editor.getModel(uri)
        const lang = getMonacoLanguageFromFileName(file.name)
        const content = file.code ?? file.content ?? ''

        if (!m) {
          monaco.editor.createModel(content, lang, uri)
        } else if (file.name !== activeFile?.name) {
          const curr = m.getValue()
          if (curr !== content) {
            m.setValue(content)
          }
          if (m.getLanguageId() !== lang) {
            monaco.editor.setModelLanguage(m, lang)
          }
        }
      } catch {
        // Ignore model sync errors
      }
    })
  }, [files, activeFile?.name, globalMonaco])

  const decorationsByUriRef = useRef(new Map())

  const updateModelDecorations = useCallback(() => {
    const editor = editorInstance || editorRef.current
    const monaco = monacoRef.current || globalMonaco || (typeof window !== 'undefined' ? window.monaco : null)
    if (!editor || !monaco) return

    const model = editor.getModel()
    if (!model || model.isDisposed()) return

    try {
      const uriStr = model.uri.toString()
      const oldDecorations = decorationsByUriRef.current.get(uriStr) || []
      const markers = monaco.editor.getModelMarkers({ resource: model.uri }) || []

      // Group markers by start line so that glyph margin and line hover can prioritize severity
      const markersByLine = new Map()
      markers.forEach((m) => {
        const line = m.startLineNumber || 1
        if (!markersByLine.has(line)) {
          markersByLine.set(line, [])
        }
        markersByLine.get(line).push(m)
      })

      const newDecorations = markers.map((marker) => {
        const isError = marker.severity === 8
        const isWarning = marker.severity === 4
        const isInfo = marker.severity === 2

        const startLine = marker.startLineNumber || 1
        const startCol = marker.startColumn || 1
        const endLine = marker.endLineNumber || startLine
        const endCol = marker.endColumn || startCol

        const rulerColor = isError
          ? '#f87171cc'
          : isWarning
          ? '#fbbf24cc'
          : isInfo
          ? '#60a5facc'
          : '#c084fccc'

        // Determine glyph on this line: assign glyph only to the primary marker on each line
        const lineMarkers = markersByLine.get(startLine) || [marker]
        const maxSeverityOnLine = Math.max(...lineMarkers.map((lm) => lm.severity || 1))
        const primaryMarkerOnLine = lineMarkers.find((lm) => (lm.severity || 1) === maxSeverityOnLine)

        let glyphClass = undefined
        let glyphHoverMessage = undefined

        if (primaryMarkerOnLine === marker) {
          glyphClass = maxSeverityOnLine === 8
            ? 'monaco-diagnostic-glyph monaco-diagnostic-glyph--error'
            : maxSeverityOnLine === 4
            ? 'monaco-diagnostic-glyph monaco-diagnostic-glyph--warning'
            : maxSeverityOnLine === 2
            ? 'monaco-diagnostic-glyph monaco-diagnostic-glyph--info'
            : 'monaco-diagnostic-glyph monaco-diagnostic-glyph--hint'

          const hoverEntries = lineMarkers.map((lm) => {
            const sev = lm.severity === 8 ? 'Error' : lm.severity === 4 ? 'Warning' : lm.severity === 2 ? 'Info' : 'Hint'
            const src = lm.source ? ` *(${lm.source})*` : ''
            const loc = `[Line ${lm.startLineNumber}, Col ${lm.startColumn}]`
            return `• **${sev}** ${loc}: ${lm.message}${src}`
          })

          glyphHoverMessage = {
            value: hoverEntries.join('\n\n'),
          }
        }

        return {
          range: new monaco.Range(startLine, startCol, endLine, endCol),
          options: {
            isWholeLine: false,
            glyphMarginClassName: glyphClass,
            glyphMarginHoverMessage: glyphHoverMessage,
            overviewRuler: {
              color: rulerColor,
              position: isError
                ? monaco.editor.OverviewRulerLane.Right
                : isWarning
                ? monaco.editor.OverviewRulerLane.Center
                : monaco.editor.OverviewRulerLane.Left,
            },
            minimap: {
              color: rulerColor,
              position: monaco.editor.MinimapPosition.Inline,
            },
          },
        }
      })

      const appliedDecorations = editor.deltaDecorations(oldDecorations, newDecorations)
      decorationsByUriRef.current.set(uriStr, appliedDecorations)
    } catch {
      // Ignore if editor or model is in transition
    }
  }, [editorInstance, globalMonaco])

  useEffect(() => {
    updateModelDecorations()
  }, [activeFile?.id, activeFile?.name, updateModelDecorations])

  useEffect(() => {
    const monaco = monacoRef.current || globalMonaco || (typeof window !== 'undefined' ? window.monaco : null)
    if (!monaco?.editor?.onDidChangeMarkers) return

    const disposable = monaco.editor.onDidChangeMarkers((affectedUris) => {
      const editor = editorInstance || editorRef.current
      const model = editor?.getModel()
      if (!model || model.isDisposed()) return

      const currentUriStr = model.uri.toString()
      const isAffected =
        !affectedUris ||
        affectedUris.length === 0 ||
        affectedUris.some((uri) => uri.toString() === currentUriStr)

      if (isAffected) {
        updateModelDecorations()
      }
    })

    return () => {
      disposable.dispose()
    }
  }, [editorInstance, globalMonaco, updateModelDecorations])

  useEffect(() => {
    return () => {
      const monaco = monacoRef.current || globalMonaco || (typeof window !== 'undefined' ? window.monaco : null)
      if (monaco?.editor) {
        decorationsByUriRef.current.forEach((decIds, uriStr) => {
          try {
            const m = monaco.editor.getModel(monaco.Uri.parse(uriStr))
            if (m && !m.isDisposed()) {
              m.deltaDecorations(decIds, [])
            }
          } catch {
            // Ignore
          }
        })
        decorationsByUriRef.current.clear()
      }
    }
  }, [editorInstance, globalMonaco])

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
      } catch {
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
      } catch {
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
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault()
        handleFormatDocument()
      } else if (e.shiftKey && e.altKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault()
        handleFormatDocument()
      } else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key === '.') {
        e.preventDefault()
        handleQuickFix()
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [handleOpenCommandPalette, handleFormatDocument, handleQuickFix])

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
    parameterHintsSetting,
    stickyScrollSetting,
    smoothScrollingSetting,
    highlightActiveLineSetting,
    renderWhitespaceSetting,
    cursorBlinkingSetting,
    cursorStyleSetting,
    cursorSmoothCaretAnimationSetting,
    selectionHighlightSetting,
    formatOnTypeSetting,
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
            {codeActionFeedback ? (
              <span className="code-action-status-badge" role="status">
                ℹ {codeActionFeedback}
              </span>
            ) : null}
            {navigationFeedback ? (
              <span className="navigation-status-badge" role="status">
                📍 {navigationFeedback}
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
                onFormatDocument={handleFormatDocument}
                onFormatSelection={handleFormatSelection}
                onQuickFix={handleQuickFix}
                activeFile={activeFile}
              />
            </div>
          ) : null}

          <button
            type="button"
            className="command-palette-button goto-def-button"
            aria-label="Go to Definition"
            title="Go to Definition (F12)"
            onClick={handleGoToDefinition}
            disabled={!activeFile}
          >
            <span className="command-palette-button__icon">↗</span>
            <span className="command-palette-button__text">Go to Def</span>
          </button>

          <button
            type="button"
            className="command-palette-button quick-fix-button"
            aria-label="Quick Fix / Code Actions"
            title="Quick Fix / Code Actions (Ctrl+.)"
            onClick={handleQuickFix}
            disabled={!activeFile}
          >
            <span className="command-palette-button__icon">💡</span>
            <span className="command-palette-button__text">Quick Fix</span>
          </button>

          <button
            type="button"
            className="command-palette-button format-document-button"
            aria-label="Format Document"
            title="Format Document (Shift+Alt+F / Ctrl+Shift+I)"
            onClick={handleFormatDocument}
            disabled={!activeFile}
          >
            <span className="command-palette-button__icon">✨</span>
            <span className="command-palette-button__text">Format</span>
          </button>

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
            {peekDefinitionData ? (
              <PeekDefinitionWidget
                definition={peekDefinitionData}
                onGoToDefinition={(def) => {
                  setPeekDefinitionData(null)
                  if (!def.isSameFile && def.targetFile) {
                    onSelectFile?.(def.targetFile)
                    setTimeout(() => {
                      const ed = editorRef.current || editorInstance
                      if (ed) {
                        ed.setPosition({ lineNumber: def.range.startLineNumber, column: def.range.startColumn })
                        ed.setSelection(def.range)
                        ed.revealPositionInCenterIfOutsideViewport({ lineNumber: def.range.startLineNumber, column: def.range.startColumn })
                        ed.focus()
                      }
                    }, 60)
                  } else {
                    const ed = editorRef.current || editorInstance
                    if (ed) {
                      ed.setPosition({ lineNumber: def.range.startLineNumber, column: def.range.startColumn })
                      ed.setSelection(def.range)
                      ed.revealPositionInCenterIfOutsideViewport({ lineNumber: def.range.startLineNumber, column: def.range.startColumn })
                      ed.focus()
                    }
                  }
                }}
                onClose={() => setPeekDefinitionData(null)}
              />
            ) : null}
            <Editor
              path={activeFile.name}
              className="editor-panel__editor"
              defaultLanguage={monacoLanguage}
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
                  monaco.editor.registerEditorOpener({
                    openCodeEditor(source, resource, selectionOrPosition) {
                      const rawPath = resource.path || resource.fsPath || resource.toString()
                      const cleanName = rawPath.replace(/^file:\/\/\//, '').replace(/^\//, '').split('/').pop()
                      const targetFile = filesRef.current.find(
                        (f) => f.name === cleanName || resource.toString().endsWith(f.name),
                      )
                      if (targetFile) {
                        onSelectFile?.(targetFile)
                        if (selectionOrPosition) {
                          setTimeout(() => {
                            const line = selectionOrPosition.lineNumber || selectionOrPosition.startLineNumber || 1
                            const col = selectionOrPosition.column || selectionOrPosition.startColumn || 1
                            source.setPosition({ lineNumber: line, column: col })
                            source.revealPositionInCenterIfOutsideViewport({ lineNumber: line, column: col })
                            source.focus()
                          }, 60)
                        }
                        return true
                      }
                      return false
                    },
                  })
                } catch {
                  // Ignore opener registration error
                }

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
                  editor.addCommand(
                    monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyI,
                    () => {
                      handleFormatDocument()
                    }
                  )
                  editor.addCommand(
                    monaco.KeyMod.CtrlCmd | monaco.KeyCode.Period,
                    () => {
                      handleQuickFix()
                    }
                  )
                  editor.addCommand(monaco.KeyCode.F12, () => {
                    handleGoToDefinitionRef.current?.()
                  })
                  editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.F12, () => {
                    handlePeekDefinitionRef.current?.()
                  })
                  editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.F12, () => {
                    handleFindReferencesRef.current?.()
                  })
                } catch {
                  // Ignore if shortcut binding exists
                }

                try {
                  editor.addAction({
                    id: 'polyglotmesh.gotoDefinition',
                    label: 'Go to Definition',
                    keybindings: [monaco.KeyCode.F12],
                    contextMenuGroupId: 'navigation',
                    contextMenuOrder: 1.1,
                    run: () => {
                      handleGoToDefinitionRef.current?.()
                    },
                  })
                  editor.addAction({
                    id: 'polyglotmesh.peekDefinition',
                    label: 'Peek Definition',
                    keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.F12],
                    contextMenuGroupId: 'navigation',
                    contextMenuOrder: 1.2,
                    run: () => {
                      handlePeekDefinitionRef.current?.()
                    },
                  })
                  editor.addAction({
                    id: 'polyglotmesh.findReferences',
                    label: 'Find All References',
                    keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.F12],
                    contextMenuGroupId: 'navigation',
                    contextMenuOrder: 1.3,
                    run: () => {
                      handleFindReferencesRef.current?.()
                    },
                  })
                } catch {
                  // Ignore action registration error
                }

                editor.onDidChangeCursorPosition(() => {
                  if (activeFileNameRef.current) {
                    try {
                      const state = editor.saveViewState()
                      if (state) {
                        viewStatesRef.current[activeFileNameRef.current] = state
                      }
                    } catch {
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
                    } catch {
                      // Ignore
                    }
                  }
                })

                editor.onDidChangeModel(() => {
                  const currentName = activeFileNameRef.current
                  if (currentName && viewStatesRef.current[currentName]) {
                    try {
                      editor.restoreViewState(viewStatesRef.current[currentName])
                    } catch {
                      // Ignore
                    }
                  }
                  updateModelDecorations()
                })
                updateModelDecorations()
              }}
              beforeMount={(monaco) => {
                defineMonacoThemes(monaco)
              }}
              options={editorOptions}
            />
            <EditorStatusBar
              editor={editorInstance}
              activeFile={activeFile}
              editorSettings={editorSettings}
              saveMessage={saveMessage}
              problems={problems}
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