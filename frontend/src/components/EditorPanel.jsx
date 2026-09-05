import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useMonaco } from '@monaco-editor/react'
import EditorSettings from './EditorSettings.jsx'
import EditorStatusBar from './EditorStatusBar.jsx'
import EditorToolbar from './EditorToolbar.jsx'
import EditorPane from './EditorPane.jsx'
import { getMonacoLanguageFromFileName } from '../utils/languageUtils.js'
import { findDefinition, findReferences } from '../utils/monacoNavigationService.js'

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
  primaryFile,
  secondaryFile,
  isSplit = false,
  onToggleSplit,
  onCloseSplit,
  activePane = 'primary',
  onSetActivePane,
  openFiles = [],
  files = [],
  onSelectFile,
  onCloseTab,
  onCreateFile,
  onChange,
  onSave,
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
  const selectedTheme = safeEditorSettings.theme ?? 'vs-dark'

  const settingsContainerRef = useRef(null)
  const primaryEditorRef = useRef(null)
  const secondaryEditorRef = useRef(null)
  const monacoRef = useRef(null)
  const [activeEditorInstance, setActiveEditorInstance] = useState(null)
  const [codeActionFeedback, setCodeActionFeedback] = useState(null)
  const [navigationFeedback, setNavigationFeedback] = useState(null)
  const [peekDefinitionData, setPeekDefinitionData] = useState(null)
  const feedbackTimeoutRef = useRef(null)
  const navFeedbackTimerRef = useRef(null)
  const filesRef = useRef(files)
  filesRef.current = files
  const viewStatesRef = useRef({})
  const decorationsByUriRef = useRef(new Map())
  const globalMonaco = useMonaco()

  // Determine currently active file
  const currentActiveFile =
    isSplit && activePane === 'secondary' && secondaryFile
      ? secondaryFile
      : primaryFile || activeFile

  // Determine currently active editor
  const getActiveEditor = useCallback(() => {
    if (isSplit && activePane === 'secondary' && secondaryEditorRef.current) {
      return secondaryEditorRef.current
    }
    return primaryEditorRef.current || activeEditorInstance
  }, [isSplit, activePane, activeEditorInstance])

  const getActiveFile = useCallback(() => {
    if (isSplit && activePane === 'secondary' && secondaryFile) {
      return secondaryFile
    }
    return primaryFile || activeFile
  }, [isSplit, activePane, secondaryFile, primaryFile, activeFile])

  // Editor options calculation
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

  const columnSelectionSetting =
    typeof safeEditorSettings.columnSelection === 'boolean'
      ? safeEditorSettings.columnSelection
      : false

  const multiCursorModifierSetting =
    safeEditorSettings.multiCursorModifier === 'ctrlCmd'
      ? 'ctrlCmd'
      : 'alt'

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
    columnSelection: columnSelectionSetting,
    multiCursorModifier: multiCursorModifierSetting,
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

  // Handle pane activation
  const handleActivatePane = useCallback((paneId) => {
    onSetActivePane?.(paneId)
    const targetEditor = paneId === 'secondary' ? secondaryEditorRef.current : primaryEditorRef.current
    if (targetEditor) {
      setActiveEditorInstance(targetEditor)
      if (typeof window !== 'undefined') {
        window.__polyglotmeshActiveEditor = targetEditor
      }
    }
  }, [onSetActivePane])

  // Handle pane mount
  const handlePaneMount = useCallback((editor, monaco, paneId) => {
    monacoRef.current = monaco
    if (paneId === 'primary') {
      primaryEditorRef.current = editor
    } else {
      secondaryEditorRef.current = editor
    }

    if (paneId === activePane || !activeEditorInstance) {
      setActiveEditorInstance(editor)
      if (typeof window !== 'undefined') {
        window.__polyglotmeshActiveEditor = editor
      }
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
            onSelectFile?.(targetFile.name, activePane)
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
      // Ignore
    }
  }, [activePane, activeEditorInstance, selectedTheme, onSelectFile])

  // Sync theme changes
  useEffect(() => {
    const activeMonaco = globalMonaco || monacoRef.current
    if (activeMonaco && selectedTheme) {
      defineMonacoThemes(activeMonaco)
      activeMonaco.editor.setTheme(selectedTheme)
    }
  }, [globalMonaco, selectedTheme])

  // Sync active pane to window.__polyglotmeshActiveEditor
  useEffect(() => {
    const targetEditor = activePane === 'secondary' ? secondaryEditorRef.current : primaryEditorRef.current
    if (targetEditor) {
      setActiveEditorInstance(targetEditor)
      if (typeof window !== 'undefined') {
        window.__polyglotmeshActiveEditor = targetEditor
      }
    }
  }, [activePane])

  // Feedback helpers
  const showCodeActionFeedback = useCallback((msg) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
    }
    setCodeActionFeedback(msg)
    feedbackTimeoutRef.current = setTimeout(() => {
      setCodeActionFeedback(null)
    }, 3000)
  }, [])

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
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
      if (navFeedbackTimerRef.current) clearTimeout(navFeedbackTimerRef.current)
    }
  }, [])

  // Toolbar action handlers that target activeEditor and currentActiveFile
  const handleSave = useCallback(() => {
    const fileToSave = getActiveFile()
    if (onSave) {
      onSave(fileToSave?.name)
    } else {
      window.dispatchEvent(new CustomEvent('polyglotmesh:save'))
    }
  }, [getActiveFile, onSave])

  const handleFormatDocument = useCallback(async () => {
    const editor = getActiveEditor()
    const file = getActiveFile()
    if (!editor || !file) return
    try {
      editor.focus()
      const action = editor.getAction('editor.action.formatDocument')
      if (action) {
        await action.run()
      } else {
        editor.trigger('user', 'editor.action.formatDocument')
      }
    } catch {
      // Ignore
    }
  }, [getActiveEditor, getActiveFile])

  const handleFormatSelection = useCallback(async () => {
    const editor = getActiveEditor()
    const file = getActiveFile()
    if (!editor || !file) return
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
      // Ignore
    }
  }, [getActiveEditor, getActiveFile])

  const handleQuickFix = useCallback(async () => {
    const editor = getActiveEditor()
    const file = getActiveFile()
    if (!editor || !file) {
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
          // Ignore
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
  }, [getActiveEditor, getActiveFile, globalMonaco, showCodeActionFeedback])

  const handleGoToDefinition = useCallback(async () => {
    const editor = getActiveEditor()
    const file = getActiveFile()
    const monaco = monacoRef.current || globalMonaco || (typeof window !== 'undefined' ? window.monaco : null)
    if (!editor || !monaco || !file) {
      showNavigationFeedback('No active editor')
      return
    }

    try {
      editor.focus()
      const result = await findDefinition(monaco, editor, file, filesRef.current)
      if (result.success && result.definitions?.length > 0) {
        const def = result.definitions[0]
        setPeekDefinitionData(null)

        if (!def.isSameFile && def.targetFile) {
          onSelectFile?.(def.targetFile, activePane)
          const jump = () => {
            const ed = getActiveEditor() || editor
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
  }, [getActiveEditor, getActiveFile, globalMonaco, activePane, onSelectFile, showNavigationFeedback])

  const handlePeekDefinition = useCallback(async () => {
    const editor = getActiveEditor()
    const file = getActiveFile()
    const monaco = monacoRef.current || globalMonaco || (typeof window !== 'undefined' ? window.monaco : null)
    if (!editor || !monaco || !file) {
      showNavigationFeedback('No active editor')
      return
    }

    try {
      editor.focus()
      const result = await findDefinition(monaco, editor, file, filesRef.current)
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
  }, [getActiveEditor, getActiveFile, globalMonaco, showNavigationFeedback])

  const handleFindReferences = useCallback(async () => {
    const editor = getActiveEditor()
    const file = getActiveFile()
    const monaco = monacoRef.current || globalMonaco || (typeof window !== 'undefined' ? window.monaco : null)
    if (!editor || !monaco || !file) {
      showNavigationFeedback('No active editor')
      return
    }

    try {
      editor.focus()
      const result = await findReferences(monaco, editor, file, filesRef.current)
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
  }, [getActiveEditor, getActiveFile, globalMonaco, onReferencesFound, showNavigationFeedback])

  const handleSelectPeekDefinition = useCallback((def, targetPaneId) => {
    setPeekDefinitionData(null)
    if (!def.isSameFile && def.targetFile) {
      onSelectFile?.(def.targetFile, targetPaneId)
      setTimeout(() => {
        const ed = targetPaneId === 'secondary' ? secondaryEditorRef.current : primaryEditorRef.current
        if (ed) {
          ed.setPosition({ lineNumber: def.range.startLineNumber, column: def.range.startColumn })
          ed.setSelection(def.range)
          ed.revealPositionInCenterIfOutsideViewport({ lineNumber: def.range.startLineNumber, column: def.range.startColumn })
          ed.focus()
        }
      }, 60)
    } else {
      const ed = targetPaneId === 'secondary' ? secondaryEditorRef.current : primaryEditorRef.current
      if (ed) {
        ed.setPosition({ lineNumber: def.range.startLineNumber, column: def.range.startColumn })
        ed.setSelection(def.range)
        ed.revealPositionInCenterIfOutsideViewport({ lineNumber: def.range.startLineNumber, column: def.range.startColumn })
        ed.focus()
      }
    }
  }, [onSelectFile])

  // Multi-cursor and selection handlers
  const handleAddCursorAbove = useCallback(() => {
    const editor = getActiveEditor()
    if (!editor) return
    editor.focus()
    const act = editor.getAction('editor.action.insertCursorAbove')
    if (act) act.run()
    else editor.trigger('selection', 'editor.action.insertCursorAbove')
  }, [getActiveEditor])

  const handleAddCursorBelow = useCallback(() => {
    const editor = getActiveEditor()
    if (!editor) return
    editor.focus()
    const act = editor.getAction('editor.action.insertCursorBelow')
    if (act) act.run()
    else editor.trigger('selection', 'editor.action.insertCursorBelow')
  }, [getActiveEditor])

  const handleAddCursorsToLineEnds = useCallback(() => {
    const editor = getActiveEditor()
    if (!editor) return
    editor.focus()
    const act = editor.getAction('editor.action.insertCursorAtEndOfEachLineSelected')
    if (act) act.run()
    else editor.trigger('selection', 'editor.action.insertCursorAtEndOfEachLineSelected')
  }, [getActiveEditor])

  const handleAddNextOccurrence = useCallback(() => {
    const editor = getActiveEditor()
    if (!editor) return
    editor.focus()
    const act = editor.getAction('editor.action.addSelectionToNextFindMatch')
    if (act) act.run()
    else editor.trigger('selection', 'editor.action.addSelectionToNextFindMatch')
  }, [getActiveEditor])

  const handleSelectAllOccurrences = useCallback(() => {
    const editor = getActiveEditor()
    if (!editor) return
    editor.focus()
    const act = editor.getAction('editor.action.selectHighlights')
    if (act) act.run()
    else editor.trigger('selection', 'editor.action.selectHighlights')
  }, [getActiveEditor])

  const handleExpandSelection = useCallback(() => {
    const editor = getActiveEditor()
    if (!editor) return
    editor.focus()
    const act = editor.getAction('editor.action.smartSelect.expand')
    if (act) act.run()
    else editor.trigger('selection', 'editor.action.smartSelect.expand')
  }, [getActiveEditor])

  const handleShrinkSelection = useCallback(() => {
    const editor = getActiveEditor()
    if (!editor) return
    editor.focus()
    const act = editor.getAction('editor.action.smartSelect.shrink')
    if (act) act.run()
    else editor.trigger('selection', 'editor.action.smartSelect.shrink')
  }, [getActiveEditor])

  const handleToggleColumnSelection = useCallback(() => {
    const editor = getActiveEditor()
    if (!editor) return
    editor.focus()
    const act = editor.getAction('editor.action.toggleColumnSelection')
    if (act) act.run()
    else editor.trigger('selection', 'editor.action.toggleColumnSelection')
  }, [getActiveEditor])

  const handleToggleWordWrap = useCallback(() => {
    onEditorSettingsChange?.((prev) => {
      const current = prev?.wordWrap === 'off' || prev?.wordWrap === false ? 'off' : 'on'
      const next = current === 'off' ? 'on' : 'off'
      return {
        ...prev,
        wordWrap: next,
      }
    })
    const editor = getActiveEditor()
    if (editor) {
      editor.focus()
      const action = editor.getAction('editor.action.toggleWordWrap')
      if (action) {
        action.run()
      } else {
        editor.trigger('user', 'editor.action.toggleWordWrap')
      }
    }
  }, [getActiveEditor, onEditorSettingsChange])

  const handleFoldAll = useCallback(() => {
    const editor = getActiveEditor()
    if (editor) {
      editor.focus()
      const foldAction = editor.getAction('editor.foldAll')
      if (foldAction) {
        foldAction.run()
      } else {
        editor.trigger('fold', 'editor.foldAll')
      }
    }
  }, [getActiveEditor])

  const handleUnfoldAll = useCallback(() => {
    const editor = getActiveEditor()
    if (editor) {
      editor.focus()
      const unfoldAction = editor.getAction('editor.action.unfoldAll')
      if (unfoldAction) {
        unfoldAction.run()
      } else {
        editor.trigger('unfold', 'editor.unfoldAll')
      }
    }
  }, [getActiveEditor])

  const handleOpenCommandPalette = useCallback(() => {
    const editor = getActiveEditor()
    if (editor) {
      editor.focus()
      const action = editor.getAction('editor.action.quickCommand')
      if (action) {
        action.run()
      } else {
        editor.trigger('toolbar', 'editor.action.quickCommand')
      }
    }
  }, [getActiveEditor])

  // Zoom controls
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

  // Diagnostic decorations
  const updateModelDecorations = useCallback(() => {
    const monaco = monacoRef.current || globalMonaco || (typeof window !== 'undefined' ? window.monaco : null)
    if (!monaco) return

    const editorsToUpdate = [primaryEditorRef.current, secondaryEditorRef.current].filter(Boolean)
    editorsToUpdate.forEach((editor) => {
      const model = editor.getModel()
      if (!model || model.isDisposed()) return

      try {
        const uriStr = model.uri.toString()
        const oldDecorations = decorationsByUriRef.current.get(uriStr) || []
        const markers = monaco.editor.getModelMarkers({ resource: model.uri }) || []

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

          const lineMarkers = markersByLine.get(startLine) || [marker]
          const maxSeverityOnLine = Math.max(...lineMarkers.map((lm) => lm.severity || 1))
          const primaryMarkerOnLine = lineMarkers.find((lm) => (lm.severity || 1) === maxSeverityOnLine)

          let glyphClass = undefined
          let glyphHoverMessage = undefined

          if (primaryMarkerOnLine === marker) {
            glyphClass =
              maxSeverityOnLine === 8
                ? 'monaco-diagnostic-glyph monaco-diagnostic-glyph--error'
                : maxSeverityOnLine === 4
                ? 'monaco-diagnostic-glyph monaco-diagnostic-glyph--warning'
                : maxSeverityOnLine === 2
                ? 'monaco-diagnostic-glyph monaco-diagnostic-glyph--info'
                : 'monaco-diagnostic-glyph monaco-diagnostic-glyph--hint'

            const hoverEntries = lineMarkers.map((lm) => {
              const sev =
                lm.severity === 8
                  ? 'Error'
                  : lm.severity === 4
                  ? 'Warning'
                  : lm.severity === 2
                  ? 'Info'
                  : 'Hint'
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
        // Ignore
      }
    })
  }, [globalMonaco])

  useEffect(() => {
    updateModelDecorations()
  }, [currentActiveFile?.id, currentActiveFile?.name, updateModelDecorations])

  useEffect(() => {
    const monaco = monacoRef.current || globalMonaco || (typeof window !== 'undefined' ? window.monaco : null)
    if (!monaco?.editor?.onDidChangeMarkers) return

    const disposable = monaco.editor.onDidChangeMarkers(() => {
      updateModelDecorations()
    })

    return () => {
      disposable.dispose()
    }
  }, [globalMonaco, updateModelDecorations])

  // Global polyglotmesh custom events
  useEffect(() => {
    const onQuickFixEvent = () => handleQuickFix()
    const onGoToDefEvent = () => handleGoToDefinition()
    const onPeekDefEvent = () => handlePeekDefinition()
    const onFindRefsEvent = () => handleFindReferences()
    const onCursorAboveEvent = () => handleAddCursorAbove()
    const onCursorBelowEvent = () => handleAddCursorBelow()
    const onLineEndsEvent = () => handleAddCursorsToLineEnds()
    const onNextOccurEvent = () => handleAddNextOccurrence()
    const onSelectAllOccurEvent = () => handleSelectAllOccurrences()
    const onExpandSelEvent = () => handleExpandSelection()
    const onShrinkSelEvent = () => handleShrinkSelection()
    const onToggleColEvent = () => handleToggleColumnSelection()
    const onToggleWrapEvent = () => handleToggleWordWrap()

    window.addEventListener('polyglotmesh:quick-fix', onQuickFixEvent)
    window.addEventListener('polyglotmesh:goto-definition', onGoToDefEvent)
    window.addEventListener('polyglotmesh:peek-definition', onPeekDefEvent)
    window.addEventListener('polyglotmesh:find-references', onFindRefsEvent)
    window.addEventListener('polyglotmesh:add-cursor-above', onCursorAboveEvent)
    window.addEventListener('polyglotmesh:add-cursor-below', onCursorBelowEvent)
    window.addEventListener('polyglotmesh:add-cursors-to-line-ends', onLineEndsEvent)
    window.addEventListener('polyglotmesh:add-next-occurrence', onNextOccurEvent)
    window.addEventListener('polyglotmesh:select-all-occurrences', onSelectAllOccurEvent)
    window.addEventListener('polyglotmesh:expand-selection', onExpandSelEvent)
    window.addEventListener('polyglotmesh:shrink-selection', onShrinkSelEvent)
    window.addEventListener('polyglotmesh:toggle-column-selection', onToggleColEvent)
    window.addEventListener('polyglotmesh:toggle-word-wrap', onToggleWrapEvent)

    return () => {
      window.removeEventListener('polyglotmesh:quick-fix', onQuickFixEvent)
      window.removeEventListener('polyglotmesh:goto-definition', onGoToDefEvent)
      window.removeEventListener('polyglotmesh:peek-definition', onPeekDefEvent)
      window.removeEventListener('polyglotmesh:find-references', onFindRefsEvent)
      window.removeEventListener('polyglotmesh:add-cursor-above', onCursorAboveEvent)
      window.removeEventListener('polyglotmesh:add-cursor-below', onCursorBelowEvent)
      window.removeEventListener('polyglotmesh:add-cursors-to-line-ends', onLineEndsEvent)
      window.removeEventListener('polyglotmesh:add-next-occurrence', onNextOccurEvent)
      window.removeEventListener('polyglotmesh:select-all-occurrences', onSelectAllOccurEvent)
      window.removeEventListener('polyglotmesh:expand-selection', onExpandSelEvent)
      window.removeEventListener('polyglotmesh:shrink-selection', onShrinkSelEvent)
      window.removeEventListener('polyglotmesh:toggle-column-selection', onToggleColEvent)
      window.removeEventListener('polyglotmesh:toggle-word-wrap', onToggleWrapEvent)
    }
  }, [
    handleQuickFix,
    handleGoToDefinition,
    handlePeekDefinition,
    handleFindReferences,
    handleAddCursorAbove,
    handleAddCursorBelow,
    handleAddCursorsToLineEnds,
    handleAddNextOccurrence,
    handleSelectAllOccurrences,
    handleExpandSelection,
    handleShrinkSelection,
    handleToggleColumnSelection,
    handleToggleWordWrap,
  ])

  // Sync background models
  useEffect(() => {
    const monaco = monacoRef.current || globalMonaco || (typeof window !== 'undefined' ? window.monaco : null)
    if (!monaco?.editor || !Array.isArray(files) || files.length === 0) return

    const primaryName = (primaryFile || activeFile)?.name
    const secondaryName = secondaryFile?.name

    files.forEach((file) => {
      try {
        const uri = monaco.Uri.parse(`file:///${file.name}`)
        let m = monaco.editor.getModel(uri)
        const lang = getMonacoLanguageFromFileName(file.name)
        const content = file.code ?? file.content ?? ''

        if (!m) {
          monaco.editor.createModel(content, lang, uri)
        } else if (file.name !== primaryName && file.name !== secondaryName) {
          const curr = m.getValue()
          if (curr !== content) {
            m.setValue(content)
          }
          if (m.getLanguageId() !== lang) {
            monaco.editor.setModelLanguage(m, lang)
          }
        }
      } catch {
        // Ignore
      }
    })
  }, [files, primaryFile?.name, secondaryFile?.name, activeFile?.name, globalMonaco])

  // Close settings popup when clicking outside
  useEffect(() => {
    const handleDocumentMouseDown = (event) => {
      if (!isSettingsOpen) return
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
              {currentActiveFile ? `${currentActiveFile.name} workspace` : 'No open file'}
              {isSplit ? (
                <span className="split-panel-title-badge">
                  [Split View • {activePane === 'primary' ? 'Pane 1 Active' : 'Pane 2 Active'}]
                </span>
              ) : null}
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
                onAddCursorAbove={handleAddCursorAbove}
                onAddCursorBelow={handleAddCursorBelow}
                onAddNextOccurrence={handleAddNextOccurrence}
                onSelectAllOccurrences={handleSelectAllOccurrences}
                onExpandSelection={handleExpandSelection}
                onShrinkSelection={handleShrinkSelection}
                onToggleColumnSelection={handleToggleColumnSelection}
                activeFile={currentActiveFile}
              />
            </div>
          ) : null}

          <EditorToolbar
            activeFile={currentActiveFile}
            onSave={handleSave}
            onFormatDocument={handleFormatDocument}
            onQuickFix={handleQuickFix}
            onGoToDefinition={handleGoToDefinition}
            onFindReferences={handleFindReferences}
            onToggleWordWrap={handleToggleWordWrap}
            isWordWrapOn={wordWrapSetting === 'on'}
            isSplit={isSplit}
            onToggleSplit={onToggleSplit}
            onOpenCommandPalette={handleOpenCommandPalette}
            currentFontSize={currentFontSize}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={handleResetZoom}
            onToggleSettings={onToggleSettings}
            onRunClick={onRunClick}
            isRunning={isRunning}
          />
        </div>
      </div>

      <div className={`editor-panel__surface ${isSplit ? 'editor-panel__surface--split' : ''}`}>
        {isSplit ? (
          <div className="editor-panel__split-container">
            <EditorPane
              paneId="primary"
              file={primaryFile || activeFile}
              isActive={activePane === 'primary'}
              isSplit={true}
              openFiles={openFiles}
              files={files}
              otherActiveFileName={secondaryFile?.name}
              onActivate={handleActivatePane}
              onSelectFile={(fileName) => onSelectFile?.(fileName, 'primary')}
              onCloseTab={(fileName) => onCloseTab?.(fileName, 'primary')}
              onCreateFile={onCreateFile}
              onChange={onChange}
              onMount={handlePaneMount}
              editorOptions={editorOptions}
              selectedTheme={selectedTheme}
              viewStatesRef={viewStatesRef}
              onGoToDefinition={handleGoToDefinition}
              onPeekDefinition={handlePeekDefinition}
              onFindReferences={handleFindReferences}
              onQuickFix={handleQuickFix}
              onFormatDocument={handleFormatDocument}
              onUpdateModelDecorations={updateModelDecorations}
              peekDefinitionData={activePane === 'primary' ? peekDefinitionData : null}
              onClosePeekDefinition={() => setPeekDefinitionData(null)}
              onSelectPeekDefinition={handleSelectPeekDefinition}
            />

            <div
              className="split-editor__divider"
              role="separator"
              aria-orientation="vertical"
              title="Split editor divider"
            />

            <EditorPane
              paneId="secondary"
              file={secondaryFile}
              isActive={activePane === 'secondary'}
              isSplit={true}
              openFiles={openFiles}
              files={files}
              otherActiveFileName={(primaryFile || activeFile)?.name}
              onActivate={handleActivatePane}
              onSelectFile={(fileName) => onSelectFile?.(fileName, 'secondary')}
              onCloseTab={(fileName) => onCloseTab?.(fileName, 'secondary')}
              onCreateFile={onCreateFile}
              onCloseSplit={onCloseSplit}
              onChange={onChange}
              onMount={handlePaneMount}
              editorOptions={editorOptions}
              selectedTheme={selectedTheme}
              viewStatesRef={viewStatesRef}
              onGoToDefinition={handleGoToDefinition}
              onPeekDefinition={handlePeekDefinition}
              onFindReferences={handleFindReferences}
              onQuickFix={handleQuickFix}
              onFormatDocument={handleFormatDocument}
              onUpdateModelDecorations={updateModelDecorations}
              peekDefinitionData={activePane === 'secondary' ? peekDefinitionData : null}
              onClosePeekDefinition={() => setPeekDefinitionData(null)}
              onSelectPeekDefinition={handleSelectPeekDefinition}
            />
          </div>
        ) : (
          <EditorPane
            paneId="primary"
            file={primaryFile || activeFile}
            isActive={true}
            isSplit={false}
            openFiles={openFiles}
            files={files}
            onActivate={handleActivatePane}
            onSelectFile={(fileName) => onSelectFile?.(fileName, 'primary')}
            onCloseTab={(fileName) => onCloseTab?.(fileName, 'primary')}
            onCreateFile={onCreateFile}
            onChange={onChange}
            onMount={handlePaneMount}
            editorOptions={editorOptions}
            selectedTheme={selectedTheme}
            viewStatesRef={viewStatesRef}
            onGoToDefinition={handleGoToDefinition}
            onPeekDefinition={handlePeekDefinition}
            onFindReferences={handleFindReferences}
            onQuickFix={handleQuickFix}
            onFormatDocument={handleFormatDocument}
            onUpdateModelDecorations={updateModelDecorations}
            peekDefinitionData={peekDefinitionData}
            onClosePeekDefinition={() => setPeekDefinitionData(null)}
            onSelectPeekDefinition={handleSelectPeekDefinition}
          />
        )}

        <EditorStatusBar
          editor={getActiveEditor()}
          activeFile={currentActiveFile}
          editorSettings={editorSettings}
          saveMessage={saveMessage}
          problems={problems}
          paneId={isSplit ? activePane : null}
        />
      </div>
    </section>
  )
}

export default EditorPanel