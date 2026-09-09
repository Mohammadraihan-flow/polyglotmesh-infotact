import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CommandPalette from './components/CommandPalette.jsx'
import ConsolePanel from './components/ConsolePanel.jsx'
import EditorPanel from './components/EditorPanel.jsx'
import Header from './components/Header.jsx'
import Sidebar from './components/Sidebar.jsx'
import {
  getExtension,
  getLanguageLabelFromFileName,
  getMonacoLanguageFromFileName,
} from './utils/languageUtils.js'
import {
  loadEditorSession,
  saveEditorSession,
  clearEditorSession,
  validateSplitRatio,
  LEGACY_SPLIT_RATIO_KEY,
} from './utils/sessionManager.js'
import { useMonacoMarkers } from './hooks/useMonacoMarkers.js'
import { useMonacoSymbols } from './hooks/useMonacoSymbols.js'
import './App.css'

function isValidFileName(fileName) {
  const trimmedName = fileName ? fileName.trim() : ''
  return trimmedName.length > 0 && !/[\\/:*?"<>|]/.test(trimmedName)
}

function makeUniqueFileName(desiredName, existingFiles) {
  const existingNames = new Set(existingFiles.map((file) => file.name.toLowerCase()))
  const trimmedName = desiredName.trim()

  if (!existingNames.has(trimmedName.toLowerCase())) {
    return trimmedName
  }

  const dotIndex = trimmedName.lastIndexOf('.')
  const baseName = dotIndex > 0 ? trimmedName.slice(0, dotIndex) : trimmedName
  const extension = dotIndex > 0 ? trimmedName.slice(dotIndex) : ''

  let suffix = 1
  let candidateName = `${baseName}-${suffix}${extension}`

  while (existingNames.has(candidateName.toLowerCase())) {
    suffix += 1
    candidateName = `${baseName}-${suffix}${extension}`
  }

  return candidateName
}

const SETTINGS_STORAGE_KEY = 'polyglotmesh-editor-settings'
const LEGACY_SETTINGS_STORAGE_KEY = 'polyglotmesh_editor_settings'

function saveWorkspaceToLocalStorage(
  files,
  openFileNames,
  activeFileName,
  recentFileNames,
  isSplit = false,
  secondaryFileName = null,
  splitRatio = 0.5,
  readOnlyFileNames = [],
  activePane = 'primary',
) {
  saveEditorSession({
    files,
    openFileNames,
    activeFileName,
    recentFileNames,
    isSplit,
    secondaryFileName,
    splitRatio,
    readOnlyFileNames,
    activePane,
  })
}

const defaultSettings = {
  fontSize: 14,
  wordWrap: 'on',
  minimap: true,
  lineNumbers: 'on',
  tabSize: 4,
  autoIndent: 'full',
  automaticLayout: true,
  bracketPairColorization: true,
  showHover: true,
  autoSuggestions: true,
  parameterHints: true,
  stickyScroll: true,
  smoothScrolling: true,
  highlightActiveLine: true,
  renderWhitespace: 'none',
  cursorBlinking: 'smooth',
  cursorStyle: 'line',
  cursorSmoothCaretAnimation: 'on',
  selectionHighlight: true,
  formatOnType: false,
  theme: 'vs-dark',
}

const getInitialSettings = () => {
  let settings = defaultSettings
  try {
    const stored =
      localStorage.getItem(SETTINGS_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_SETTINGS_STORAGE_KEY)
    const storedWordWrap = localStorage.getItem('polyglotmesh-word-wrap')

    let wordWrapVal = undefined
    if (storedWordWrap && ['on', 'off', 'wordWrapColumn'].includes(storedWordWrap)) {
      wordWrapVal = storedWordWrap
    }

    if (stored) {
      const parsed = JSON.parse(stored)
      if (!wordWrapVal) {
        if (parsed.wordWrap === true) wordWrapVal = 'on'
        else if (parsed.wordWrap === false) wordWrapVal = 'off'
        else if (['on', 'off', 'wordWrapColumn'].includes(parsed.wordWrap)) {
          wordWrapVal = parsed.wordWrap
        }
      }
      settings = {
        ...defaultSettings,
        ...parsed,
        wordWrap: wordWrapVal ?? 'on',
        bracketPairColorization:
          typeof parsed.bracketPairColorization === 'boolean'
            ? parsed.bracketPairColorization
            : true,
        showHover:
          typeof parsed.showHover === 'boolean'
            ? parsed.showHover
            : true,
        autoSuggestions:
          typeof parsed.autoSuggestions === 'boolean'
            ? parsed.autoSuggestions
            : true,
        parameterHints:
          typeof parsed.parameterHints === 'boolean'
            ? parsed.parameterHints
            : true,
        stickyScroll:
          typeof parsed.stickyScroll === 'boolean'
            ? parsed.stickyScroll
            : true,
        smoothScrolling:
          typeof parsed.smoothScrolling === 'boolean'
            ? parsed.smoothScrolling
            : true,
        highlightActiveLine:
          typeof parsed.highlightActiveLine === 'boolean'
            ? parsed.highlightActiveLine
            : true,
        renderWhitespace:
          ['none', 'boundary', 'selection', 'all'].includes(parsed.renderWhitespace)
            ? parsed.renderWhitespace
            : 'none',
        cursorBlinking:
          ['smooth', 'blink', 'solid', 'phase', 'expand'].includes(parsed.cursorBlinking)
            ? parsed.cursorBlinking
            : 'smooth',
        cursorStyle:
          ['line', 'block', 'underline'].includes(parsed.cursorStyle)
            ? parsed.cursorStyle
            : 'line',
        cursorSmoothCaretAnimation:
          parsed.cursorSmoothCaretAnimation === 'off' || parsed.cursorSmoothCaretAnimation === false
            ? 'off'
            : 'on',
        selectionHighlight:
          typeof parsed.selectionHighlight === 'boolean'
            ? parsed.selectionHighlight
            : true,
        formatOnType:
          typeof parsed.formatOnType === 'boolean'
            ? parsed.formatOnType
            : false,
      }
    } else if (wordWrapVal) {
      settings = { ...defaultSettings, wordWrap: wordWrapVal }
    }
  } catch {
    // Ignore error
  }
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', settings.theme ?? 'vs-dark')
  }
  return settings
}

function App() {
  const [initialSessionResult] = useState(loadEditorSession)
  const initialWorkspaceState = initialSessionResult.session
  const [files, setFiles] = useState(initialWorkspaceState.files)
  const [openFileNames, setOpenFileNames] = useState(initialWorkspaceState.openFileNames)
  const [activeFileName, setActiveFileName] = useState(initialWorkspaceState.activeFileName)
  const [recentFileNames, setRecentFileNames] = useState(initialWorkspaceState.recentFileNames)
  const [isSplit, setIsSplit] = useState(initialWorkspaceState.isSplit ?? false)
  const [secondaryFileName, setSecondaryFileName] = useState(initialWorkspaceState.secondaryFileName ?? null)
  const [splitRatio, setSplitRatio] = useState(initialWorkspaceState.splitRatio ?? 0.5)
  const [readOnlyFileNames, setReadOnlyFileNames] = useState(initialWorkspaceState.readOnlyFileNames ?? [])
  const [activePane, setActivePane] = useState(initialWorkspaceState.activePane || 'primary')
  const [isRunning, setIsRunning] = useState(false)
  const [consoleMessage, setConsoleMessage] = useState('Click Run to execute your program.')
  const [editorSettings, setEditorSettings] = useState(getInitialSettings)
  const [isEditorSettingsOpen, setIsEditorSettingsOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [saveMessage, setSaveMessage] = useState(() =>
    initialSessionResult.isRestored && initialWorkspaceState.files.length > 0
      ? 'Session restored'
      : '',
  )
  const runTimerRef = useRef(null)
  const saveTimerRef = useRef(null)
  const autoSaveTimerRef = useRef(null)
  const pendingChangesRef = useRef({})

  // Clear session restored message after delay
  useEffect(() => {
    if (saveMessage === 'Session restored') {
      const timer = setTimeout(() => {
        setSaveMessage('')
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [saveMessage])

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(editorSettings))
      localStorage.setItem(LEGACY_SETTINGS_STORAGE_KEY, JSON.stringify(editorSettings))
      if (editorSettings.wordWrap && ['on', 'off', 'wordWrapColumn'].includes(editorSettings.wordWrap)) {
        localStorage.setItem('polyglotmesh-word-wrap', editorSettings.wordWrap)
      }
    } catch {
      // Ignore error
    }
    const currentTheme = editorSettings.theme ?? 'vs-dark'
    document.documentElement.setAttribute('data-theme', currentTheme)
  }, [editorSettings])

  useEffect(() => {
    if (!activeFileName) return
    const fileExists = files.some((f) => f.name === activeFileName)
    if (!fileExists) return

    const timer = setTimeout(() => {
      setRecentFileNames((prev) => {
        const filtered = prev.filter((name) => name !== activeFileName)
        return [activeFileName, ...filtered].slice(0, 5)
      })
    }, 0)
    return () => clearTimeout(timer)
  }, [activeFileName, files])

  useEffect(() => {
    const existingNames = new Set(files.map((f) => f.name))
    const timer = setTimeout(() => {
      setRecentFileNames((prev) => {
        const filtered = prev.filter((name) => existingNames.has(name))
        return filtered.length === prev.length ? prev : filtered
      })
    }, 0)
    return () => clearTimeout(timer)
  }, [files])

  const filesRef = useRef(files)
  const openFileNamesRef = useRef(openFileNames)
  const activeFileNameRef = useRef(activeFileName)
  const recentFileNamesRef = useRef(recentFileNames)
  const isSplitRef = useRef(isSplit)
  const secondaryFileNameRef = useRef(secondaryFileName)
  const splitRatioRef = useRef(splitRatio)
  const readOnlyFileNamesRef = useRef(readOnlyFileNames)
  const activePaneRef = useRef(activePane)

  useEffect(() => {
    filesRef.current = files
  }, [files])

  useEffect(() => {
    openFileNamesRef.current = openFileNames
  }, [openFileNames])

  useEffect(() => {
    activeFileNameRef.current = activeFileName
  }, [activeFileName])

  useEffect(() => {
    recentFileNamesRef.current = recentFileNames
  }, [recentFileNames])

  useEffect(() => {
    isSplitRef.current = isSplit
  }, [isSplit])

  useEffect(() => {
    secondaryFileNameRef.current = secondaryFileName
  }, [secondaryFileName])

  useEffect(() => {
    splitRatioRef.current = splitRatio
  }, [splitRatio])

  useEffect(() => {
    readOnlyFileNamesRef.current = readOnlyFileNames
  }, [readOnlyFileNames])

  useEffect(() => {
    activePaneRef.current = activePane
  }, [activePane])

  useEffect(() => {
    saveWorkspaceToLocalStorage(
      filesRef.current,
      openFileNames,
      activeFileName,
      recentFileNames,
      isSplit,
      secondaryFileName,
      splitRatio,
      readOnlyFileNames,
      activePane,
    )
  }, [openFileNames, activeFileName, recentFileNames, isSplit, secondaryFileName, splitRatio, readOnlyFileNames, activePane])

  const flushAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }

    const pending = pendingChangesRef.current
    const pendingNames = Object.keys(pending)
    if (pendingNames.length > 0) {
      const changes = { ...pending }
      pendingChangesRef.current = {}

      const updatedFiles = filesRef.current.map((file) => {
        if (changes[file.name] !== undefined) {
          const val = changes[file.name]
          return { ...file, code: val, content: val, isDirty: false }
        }
        return file
      })

      setFiles(updatedFiles)
      saveWorkspaceToLocalStorage(
        updatedFiles,
        openFileNamesRef.current,
        activeFileNameRef.current,
        recentFileNamesRef.current,
        isSplitRef.current,
        secondaryFileNameRef.current,
        splitRatioRef.current,
        readOnlyFileNamesRef.current,
        activePaneRef.current,
      )

      setSaveMessage('Workspace saved')
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
      saveTimerRef.current = setTimeout(() => {
        setSaveMessage('')
        saveTimerRef.current = null
      }, 2000)
    }
  }, [])

  useEffect(() => {
    const handleBeforeUnload = () => {
      flushAutoSave()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [flushAutoSave])

  const filesWithReadOnly = useMemo(() => {
    return files.map((file) => ({
      ...file,
      isReadOnly: Boolean(readOnlyFileNames.includes(file.name)),
    }))
  }, [files, readOnlyFileNames])

  const primaryFile = filesWithReadOnly.find((file) => file.name === activeFileName) ?? null
  const secondaryFile =
    isSplit && secondaryFileName
      ? filesWithReadOnly.find((file) => file.name === secondaryFileName) ?? null
      : null
  const activeFile =
    isSplit && activePane === 'secondary' && secondaryFile
      ? secondaryFile
      : primaryFile
  const openFiles = useMemo(
    () =>
      openFileNames
        .map((name) => filesWithReadOnly.find((file) => file.name === name))
        .filter(Boolean),
    [filesWithReadOnly, openFileNames],
  )
  const problems = useMonacoMarkers(openFiles, files)
  const {
    symbols,
    isLoading: isLoadingSymbols,
    hasProvider: hasSymbolProvider,
    error: symbolError,
    refresh: handleRefreshSymbols,
  } = useMonacoSymbols(activeFile)

  const [references, setReferences] = useState([])
  const [referenceSymbol, setReferenceSymbol] = useState('')
  const [isLoadingReferences, setIsLoadingReferences] = useState(false)

  // Clear references when active file or active pane changes to prevent stale results
  useEffect(() => {
    const timer = setTimeout(() => {
      setReferences([])
      setReferenceSymbol('')
      setIsLoadingReferences(false)
    }, 0)
    return () => clearTimeout(timer)
  }, [activeFileName, secondaryFileName, activePane])

  const handleReferencesFound = useCallback((refs, symbol) => {
    setReferences(refs)
    setReferenceSymbol(symbol)
    setIsLoadingReferences(false)
  }, [])

  const handleClearReferences = useCallback(() => {
    setReferences([])
    setReferenceSymbol('')
  }, [])

  const handleCreateFile = useCallback((fileName, forceNew = false) => {
    flushAutoSave()
    const trimmedName = fileName ? fileName.trim() : 'untitled.js'

    if (!isValidFileName(trimmedName)) {
      return {
        success: false,
        message: 'Invalid file name. Please avoid / \\ : * ? " < > | characters.',
      }
    }

    const currentFiles = filesRef.current
    const currentOpenNames = openFileNamesRef.current

    const existingFile = currentFiles.find(
      (file) => file.name.toLowerCase() === trimmedName.toLowerCase(),
    )

    if (existingFile && !forceNew) {
      if (!currentOpenNames.includes(existingFile.name)) {
        setOpenFileNames((prevOpen) => [...prevOpen, existingFile.name])
      }
      setActiveFileName(existingFile.name)
      return {
        success: true,
        fileName: existingFile.name,
        message: `Selected existing ${existingFile.name}.`,
      }
    }

    const uniqueName = makeUniqueFileName(trimmedName, currentFiles)
    const newFile = {
      id: uniqueName,
      name: uniqueName,
      code: '',
      isDirty: false,
      isReadOnly: false,
      lastModified: Date.now(),
    }

    setFiles((prevFiles) => [...prevFiles, newFile])
    setOpenFileNames((prevOpen) => [...prevOpen, uniqueName])
    setActiveFileName(uniqueName)

    return {
      success: true,
      fileName: uniqueName,
      message:
        uniqueName === trimmedName
          ? 'File created.'
          : `File created as ${uniqueName}.`,
    }
  }, [flushAutoSave])

  const handleSelectFile = useCallback(
    (fileName, targetPane) => {
      flushAutoSave()
      const pane = targetPane || (isSplitRef.current ? activePaneRef.current : 'primary')

      if (isSplitRef.current) {
        if (pane === 'secondary') {
          // If already open in primary pane, switch focus to primary pane and notify user
          if (fileName === activeFileNameRef.current) {
            setActivePane('primary')
            setSaveMessage(`${fileName} is already open in Pane 1`)
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
            saveTimerRef.current = setTimeout(() => setSaveMessage(''), 2500)
            return
          }
          setOpenFileNames((prevOpen) =>
            prevOpen.includes(fileName) ? prevOpen : [...prevOpen, fileName],
          )
          setSecondaryFileName(fileName)
          setActivePane('secondary')
          return
        } else {
          // pane === 'primary'
          // If already open in secondary pane, switch focus to secondary pane and notify user
          if (fileName === secondaryFileNameRef.current) {
            setActivePane('secondary')
            setSaveMessage(`${fileName} is already open in Pane 2`)
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
            saveTimerRef.current = setTimeout(() => setSaveMessage(''), 2500)
            return
          }
          setOpenFileNames((prevOpen) =>
            prevOpen.includes(fileName) ? prevOpen : [...prevOpen, fileName],
          )
          setActiveFileName(fileName)
          setActivePane('primary')
          return
        }
      }

      // Not split
      setOpenFileNames((prevOpen) =>
        prevOpen.includes(fileName) ? prevOpen : [...prevOpen, fileName],
      )
      setActiveFileName(fileName)
      setActivePane('primary')
    },
    [flushAutoSave],
  )

  const handleCloseTab = useCallback(
    (fileName) => {
      flushAutoSave()
      const index = openFileNamesRef.current.indexOf(fileName)
      if (index === -1) return

      const targetFile = filesRef.current.find((f) => f.name === fileName)
      if (targetFile?.isDirty) {
        const confirmClose = window.confirm(
          `"${fileName}" has unsaved changes. Are you sure you want to close it?`,
        )
        if (!confirmClose) return
      }

      const nextOpenNames = openFileNamesRef.current.filter((name) => name !== fileName)
      setOpenFileNames(nextOpenNames)

      // Handle secondary pane if closed file was displayed there
      if (isSplitRef.current && fileName === secondaryFileNameRef.current) {
        const remainingSecondaryCandidates = nextOpenNames.filter(
          (name) => name !== activeFileNameRef.current,
        )
        const nextSecondary =
          remainingSecondaryCandidates[0] ??
          filesRef.current
            .map((f) => f.name)
            .find(
              (name) =>
                name !== activeFileNameRef.current && name !== fileName,
            ) ??
          null
        setSecondaryFileName(nextSecondary)
      }

      // Handle primary pane if closed file was displayed there
      if (fileName === activeFileNameRef.current) {
        if (nextOpenNames.length === 0) {
          setActiveFileName(null)
        } else {
          const nonSecondaryOpen = nextOpenNames.filter(
            (name) => !isSplitRef.current || name !== secondaryFileNameRef.current,
          )
          const nextActive =
            nonSecondaryOpen[index - 1] ??
            nonSecondaryOpen[index] ??
            nonSecondaryOpen[0] ??
            nextOpenNames[0]
          setActiveFileName(nextActive)
        }
      }
    },
    [flushAutoSave],
  )

  const handleCloseActiveTab = useCallback(() => {
    const currentTargetName =
      isSplitRef.current && activePaneRef.current === 'secondary' && secondaryFileNameRef.current
        ? secondaryFileNameRef.current
        : activeFileNameRef.current
    if (!currentTargetName) return
    handleCloseTab(currentTargetName)
  }, [handleCloseTab])

  const handleNextTab = useCallback(() => {
    flushAutoSave()
    const openNames = openFileNamesRef.current
    if (openNames.length <= 1) return
    const currentActiveName =
      isSplitRef.current && activePaneRef.current === 'secondary' && secondaryFileNameRef.current
        ? secondaryFileNameRef.current
        : activeFileNameRef.current
    const currentIndex = openNames.indexOf(currentActiveName)
    const nextIndex = (currentIndex + 1) % openNames.length
    const nextFileName = openNames[nextIndex]
    handleSelectFile(nextFileName)
  }, [flushAutoSave, handleSelectFile])

  const handlePrevTab = useCallback(() => {
    flushAutoSave()
    const openNames = openFileNamesRef.current
    if (openNames.length <= 1) return
    const currentActiveName =
      isSplitRef.current && activePaneRef.current === 'secondary' && secondaryFileNameRef.current
        ? secondaryFileNameRef.current
        : activeFileNameRef.current
    const currentIndex = openNames.indexOf(currentActiveName)
    const prevIndex = (currentIndex - 1 + openNames.length) % openNames.length
    const prevFileName = openNames[prevIndex]
    handleSelectFile(prevFileName)
  }, [flushAutoSave, handleSelectFile])

  const handleDeleteFile = useCallback((fileName) => {
    if (pendingChangesRef.current?.[fileName]) {
      delete pendingChangesRef.current[fileName]
    }

    if (typeof window !== 'undefined' && window.monaco) {
      try {
        const models = window.monaco.editor.getModels()
        const targetModel = models.find(
          (m) =>
            m.uri.path === `/${fileName}` ||
            m.uri.path === fileName ||
            m.uri.fsPath === fileName ||
            m.uri.toString().endsWith(`/${fileName}`) ||
            m.uri.toString().endsWith(fileName),
        )
        targetModel?.dispose()
      } catch {
        // Ignore error
      }
    }

    const currentFiles = filesRef.current
    const currentOpenNames = openFileNamesRef.current
    const currentActiveName = activeFileNameRef.current

    const fileIndex = currentFiles.findIndex((file) => file.name === fileName)
    if (fileIndex === -1) return

    const nextFiles = currentFiles.filter((file) => file.name !== fileName)
    setFiles(nextFiles)

    const openIndex = currentOpenNames.indexOf(fileName)
    const nextOpenNames = currentOpenNames.filter((name) => name !== fileName)
    setOpenFileNames(nextOpenNames)
    const nextRecent = recentFileNamesRef.current.filter((name) => name !== fileName)
    setRecentFileNames(nextRecent)

    let nextActive = null
    if (fileName === currentActiveName) {
      if (nextOpenNames.length > 0) {
        nextActive = nextOpenNames[Math.max(0, openIndex - 1)] ?? nextOpenNames[0]
        setActiveFileName(nextActive)
      } else if (nextFiles.length > 0) {
        const fallbackFile = nextFiles[Math.max(0, fileIndex - 1)] ?? nextFiles[0]
        nextOpenNames.push(fallbackFile.name)
        setOpenFileNames([fallbackFile.name])
        nextActive = fallbackFile.name
        setActiveFileName(fallbackFile.name)
      } else {
        setActiveFileName(null)
      }
    } else {
      nextActive = currentActiveName
    }

    let nextSecondary = secondaryFileNameRef.current
    if (fileName === secondaryFileNameRef.current) {
      const remainingSecondary = nextFiles
        .map((f) => f.name)
        .filter((name) => name !== nextActive)
      nextSecondary = remainingSecondary[0] ?? null
      setSecondaryFileName(nextSecondary)
    }

    const nextReadOnly = readOnlyFileNamesRef.current.filter((name) => name !== fileName)
    setReadOnlyFileNames(nextReadOnly)

    saveWorkspaceToLocalStorage(
      nextFiles,
      nextOpenNames,
      nextActive,
      nextRecent,
      isSplitRef.current,
      nextSecondary,
      splitRatioRef.current,
      nextReadOnly,
      activePaneRef.current,
    )
  }, [])

  const handleRenameFile = useCallback(
    (oldFileName, newFileName) => {
      flushAutoSave()
      let trimmedNewName = newFileName.trim()

      if (!trimmedNewName) {
        return { success: false, message: 'File name cannot be empty.' }
      }

      const oldExt = getExtension(oldFileName)
      const newExt = getExtension(trimmedNewName)

      if (!newExt && oldExt) {
        trimmedNewName = `${trimmedNewName}.${oldExt}`
      }

      if (!isValidFileName(trimmedNewName)) {
        return { success: false, message: 'Enter a valid file name.' }
      }

      const currentFiles = filesRef.current
      if (trimmedNewName.toLowerCase() === oldFileName.toLowerCase()) {
        if (trimmedNewName === oldFileName) {
          return { success: true, message: 'No changes made.' }
        }
      } else {
        const isDuplicate = currentFiles.some(
          (file) => file.name.toLowerCase() === trimmedNewName.toLowerCase(),
        )

        if (isDuplicate) {
          return { success: false, message: 'A file with this name already exists.' }
        }
      }

      if (typeof window !== 'undefined' && window.monaco) {
        try {
          const models = window.monaco.editor.getModels()
          const oldModel = models.find(
            (m) =>
              m.uri.path === `/${oldFileName}` ||
              m.uri.path === oldFileName ||
              m.uri.fsPath === oldFileName ||
              m.uri.toString().endsWith(`/${oldFileName}`) ||
              m.uri.toString().endsWith(oldFileName),
          )
          oldModel?.dispose()
        } catch {
          // Ignore error
        }
      }

      const monacoLanguage = getMonacoLanguageFromFileName(trimmedNewName)
      const label = getLanguageLabelFromFileName(trimmedNewName)

      const nextFiles = currentFiles.map((file) => {
        if (file.name === oldFileName) {
          return {
            ...file,
            id: trimmedNewName,
            name: trimmedNewName,
            label,
            language: monacoLanguage,
            monacoLanguage,
          }
        }
        return file
      })
      setFiles(nextFiles)

      const nextOpen = openFileNamesRef.current.map((name) =>
        name === oldFileName ? trimmedNewName : name,
      )
      setOpenFileNames(nextOpen)

      const nextRecent = recentFileNamesRef.current.map((name) =>
        name === oldFileName ? trimmedNewName : name,
      )
      setRecentFileNames(nextRecent)

      const nextActive =
        oldFileName === activeFileNameRef.current
          ? trimmedNewName
          : activeFileNameRef.current
      if (oldFileName === activeFileNameRef.current) {
        setActiveFileName(trimmedNewName)
      }

      let nextSecondary = secondaryFileNameRef.current
      if (oldFileName === secondaryFileNameRef.current) {
        nextSecondary = trimmedNewName
        setSecondaryFileName(trimmedNewName)
      }

      const nextReadOnly = readOnlyFileNamesRef.current.map((name) =>
        name === oldFileName ? trimmedNewName : name,
      )
      setReadOnlyFileNames(nextReadOnly)

      saveWorkspaceToLocalStorage(
        nextFiles,
        nextOpen,
        nextActive,
        nextRecent,
        isSplitRef.current,
        nextSecondary,
        splitRatioRef.current,
        nextReadOnly,
        activePaneRef.current,
      )

      return { success: true, message: 'File renamed.' }
    },
    [flushAutoSave],
  )

  const handleEditorChange = useCallback(
    (value, targetFileName) => {
      const targetFile =
        targetFileName ||
        (isSplitRef.current && activePaneRef.current === 'secondary'
          ? secondaryFileNameRef.current
          : activeFileNameRef.current)

      if (!targetFile || readOnlyFileNamesRef.current.includes(targetFile)) return

      const newContent = value ?? ''

      pendingChangesRef.current[targetFile] = newContent

      setFiles((currentFiles) => {
        const file = currentFiles.find((f) => f.name === targetFile)
        if (file && !file.isDirty) {
          return currentFiles.map((f) =>
            f.name === targetFile ? { ...f, isDirty: true } : f,
          )
        }
        return currentFiles
      })

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

      autoSaveTimerRef.current = setTimeout(() => {
        flushAutoSave()
      }, 400)
    },
    [flushAutoSave],
  )

  const handleRunClick = useCallback(() => {
    if (isRunning) {
      return
    }

    if (runTimerRef.current) {
      clearTimeout(runTimerRef.current)
    }

    setIsRunning(true)
    setConsoleMessage('Execution started...')

    runTimerRef.current = window.setTimeout(() => {
      setIsRunning(false)
      setConsoleMessage('Ready for backend execution.')
      runTimerRef.current = null
    }, 1000)
  }, [isRunning])

  const handleSave = useCallback(() => {
    flushAutoSave()
    const currentTargetName =
      isSplitRef.current && activePaneRef.current === 'secondary' && secondaryFileNameRef.current
        ? secondaryFileNameRef.current
        : activeFileNameRef.current

    if (!currentTargetName) return

    const isReadOnly = readOnlyFileNamesRef.current.includes(currentTargetName)
    if (isReadOnly) {
      setSaveMessage(`${currentTargetName} is in Read-Only Preview Mode`)
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
      saveTimerRef.current = window.setTimeout(() => {
        setSaveMessage('')
        saveTimerRef.current = null
      }, 2500)
      return
    }

    setFiles((currentFiles) =>
      currentFiles.map((file) =>
        file.name === currentTargetName ? { ...file, isDirty: false } : file,
      ),
    )

    setSaveMessage(`Saved ${currentTargetName}`)
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = window.setTimeout(() => {
      setSaveMessage('')
      saveTimerRef.current = null
    }, 2500)
  }, [flushAutoSave])

  const handleToggleReadOnly = useCallback(
    (targetFileName) => {
      const currentTarget =
        targetFileName ||
        (isSplitRef.current && activePaneRef.current === 'secondary' && secondaryFileNameRef.current
          ? secondaryFileNameRef.current
          : activeFileNameRef.current)

      if (!currentTarget) return

      setReadOnlyFileNames((prev) => {
        const isCurrentlyReadOnly = prev.includes(currentTarget)
        const next = isCurrentlyReadOnly
          ? prev.filter((n) => n !== currentTarget)
          : [...prev, currentTarget]

        saveWorkspaceToLocalStorage(
          filesRef.current,
          openFileNamesRef.current,
          activeFileNameRef.current,
          recentFileNamesRef.current,
          isSplitRef.current,
          secondaryFileNameRef.current,
          splitRatioRef.current,
          next,
          activePaneRef.current,
        )

        setSaveMessage(
          isCurrentlyReadOnly
            ? `${currentTarget}: Edit Mode active`
            : `${currentTarget}: Preview Mode active (Read-Only)`,
        )
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current)
        }
        saveTimerRef.current = window.setTimeout(() => {
          setSaveMessage('')
          saveTimerRef.current = null
        }, 2500)

        return next
      })
    },
    [],
  )

  const handleToggleSplit = useCallback(() => {
    flushAutoSave()
    setIsSplit((prev) => {
      if (prev) {
        setActivePane('primary')
        return false
      } else {
        const curActive = activeFileNameRef.current
        const openCandidates = openFileNamesRef.current.filter((name) => name !== curActive)
        const allCandidates = filesRef.current
          .map((f) => f.name)
          .filter((name) => name !== curActive)

        let candidateSecondary = null
        if (
          secondaryFileNameRef.current &&
          secondaryFileNameRef.current !== curActive &&
          filesRef.current.some((f) => f.name === secondaryFileNameRef.current)
        ) {
          candidateSecondary = secondaryFileNameRef.current
        } else if (openCandidates.length > 0) {
          candidateSecondary = openCandidates[0]
        } else if (allCandidates.length > 0) {
          candidateSecondary = allCandidates[0]
        }

        if (candidateSecondary && !openFileNamesRef.current.includes(candidateSecondary)) {
          setOpenFileNames((prevOpen) => [...prevOpen, candidateSecondary])
        }

        setSecondaryFileName(candidateSecondary)
        setActivePane('secondary')
        return true
      }
    })
  }, [flushAutoSave])

  const handleCloseSplit = useCallback(() => {
    flushAutoSave()
    setIsSplit(false)
    setActivePane('primary')
  }, [flushAutoSave])

  const handleSplitRatioChange = useCallback((newRatio) => {
    const valid = validateSplitRatio(newRatio, 0.5)
    setSplitRatio(valid)
    try {
      localStorage.setItem(LEGACY_SPLIT_RATIO_KEY, String(valid))
    } catch {
      // Ignore
    }
  }, [])

  const handleResetLayout = useCallback(() => {
    setSplitRatio(0.5)
    setSaveMessage('Editor layout reset to 50/50')
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = setTimeout(() => {
      setSaveMessage('')
      saveTimerRef.current = null
    }, 2500)
  }, [])

  const handleResetSession = useCallback(() => {
    const confirmed = window.confirm(
      'Are you sure you want to reset your editor session? This will close all open tabs, split view, and return to a clean editor workspace.',
    )
    if (!confirmed) return

    clearEditorSession()
    setFiles([])
    setOpenFileNames([])
    setActiveFileName(null)
    setRecentFileNames([])
    setIsSplit(false)
    setSecondaryFileName(null)
    setSplitRatio(0.5)
    setReadOnlyFileNames([])
    setActivePane('primary')
    setSaveMessage('Session reset')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      setSaveMessage('')
      saveTimerRef.current = null
    }, 2500)
  }, [])

  useEffect(() => {
    const onSaveEvent = () => handleSave()
    const onToggleSplitEvent = () => handleToggleSplit()
    const onOpenSplitEvent = () => {
      if (!isSplitRef.current) handleToggleSplit()
    }
    const onCloseSplitEvent = () => {
      if (isSplitRef.current) handleCloseSplit()
    }
    const onResetLayoutEvent = () => handleResetLayout()
    const onResetSessionEvent = () => handleResetSession()
    const onToggleReadOnlyEvent = (e) => {
      const target = e?.detail?.fileName
      handleToggleReadOnly(target)
    }
    const onFocusPaneEvent = (e) => {
      const target = e?.detail?.pane
      if (target === 'primary' || target === 'secondary') {
        setActivePane(target)
      }
    }

    window.addEventListener('polyglotmesh:save', onSaveEvent)
    window.addEventListener('polyglotmesh:toggle-split', onToggleSplitEvent)
    window.addEventListener('polyglotmesh:open-split', onOpenSplitEvent)
    window.addEventListener('polyglotmesh:close-split', onCloseSplitEvent)
    window.addEventListener('polyglotmesh:reset-editor-layout', onResetLayoutEvent)
    window.addEventListener('polyglotmesh:reset-session', onResetSessionEvent)
    window.addEventListener('polyglotmesh:toggle-readonly', onToggleReadOnlyEvent)
    window.addEventListener('polyglotmesh:focus-pane', onFocusPaneEvent)

    return () => {
      window.removeEventListener('polyglotmesh:save', onSaveEvent)
      window.removeEventListener('polyglotmesh:toggle-split', onToggleSplitEvent)
      window.removeEventListener('polyglotmesh:open-split', onOpenSplitEvent)
      window.removeEventListener('polyglotmesh:close-split', onCloseSplitEvent)
      window.removeEventListener('polyglotmesh:reset-editor-layout', onResetLayoutEvent)
      window.removeEventListener('polyglotmesh:reset-session', onResetSessionEvent)
      window.removeEventListener('polyglotmesh:toggle-readonly', onToggleReadOnlyEvent)
      window.removeEventListener('polyglotmesh:focus-pane', onFocusPaneEvent)
    }
  }, [handleSave, handleToggleSplit, handleCloseSplit, handleResetLayout, handleResetSession, handleToggleReadOnly])

  useEffect(
    () => () => {
      if (runTimerRef.current) {
        clearTimeout(runTimerRef.current)
      }
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    },
    [],
  )

  const handleKeyDown = useCallback(
    (event) => {
      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
      const modifier = isMac ? event.metaKey : event.ctrlKey
      const key = event.key.toLowerCase()

      // 1. Ctrl+Shift+P / Cmd+Shift+P -> Command Palette
      if (modifier && event.shiftKey && key === 'p') {
        event.preventDefault()
        event.stopPropagation()
        setIsCommandPaletteOpen((prev) => !prev)
        return
      }

      // 2. Escape -> Close Command Palette or Settings panel
      if (event.key === 'Escape') {
        if (isCommandPaletteOpen) {
          event.preventDefault()
          event.stopPropagation()
          setIsCommandPaletteOpen(false)
          return
        }
        if (isEditorSettingsOpen) {
          event.preventDefault()
          event.stopPropagation()
          setIsEditorSettingsOpen(false)
          return
        }
        return
      }

      // 3. Ctrl+S / Cmd+S -> Save
      if (modifier && key === 's' && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        event.stopPropagation()
        handleSave()
        return
      }

      // 4. Ctrl+N / Cmd+N -> New File
      if (modifier && key === 'n' && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        event.stopPropagation()
        handleCreateFile('untitled.js')
        return
      }

      // 5. Ctrl+W / Cmd+W or Ctrl+Alt+W -> Close Tab
      if (modifier && key === 'w' && !event.shiftKey) {
        event.preventDefault()
        event.stopPropagation()
        handleCloseActiveTab()
        return
      }

      // 6. Ctrl+Tab / Ctrl+Alt+Right / Cmd+Alt+Right / Ctrl+PageDown -> Next Tab
      if (
        (modifier && event.key === 'Tab' && !event.shiftKey) ||
        (modifier && event.altKey && event.key === 'ArrowRight') ||
        (modifier && event.key === 'PageDown')
      ) {
        event.preventDefault()
        event.stopPropagation()
        handleNextTab()
        return
      }

      // 7. Ctrl+Shift+Tab / Ctrl+Alt+Left / Cmd+Alt+Left / Ctrl+PageUp -> Prev Tab
      if (
        (modifier && event.key === 'Tab' && event.shiftKey) ||
        (modifier && event.altKey && event.key === 'ArrowLeft') ||
        (modifier && event.key === 'PageUp')
      ) {
        event.preventDefault()
        event.stopPropagation()
        handlePrevTab()
        return
      }

      // 8. Ctrl+Enter / Cmd+Enter -> Run
      if (modifier && event.key === 'Enter') {
        event.preventDefault()
        event.stopPropagation()
        handleRunClick()
        return
      }

      // Split Editor Toggle: Ctrl+\ or Cmd+\
      if (modifier && (key === '\\' || event.code === 'Backslash')) {
        event.preventDefault()
        event.stopPropagation()
        handleToggleSplit()
        return
      }

      // 9. Ctrl+F / Cmd+F -> Open Monaco Find Widget
      if (modifier && key === 'f' && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        event.stopPropagation()
        if (typeof window !== 'undefined' && window.monaco) {
          const activeEditor =
            window.__polyglotmeshActiveEditor ||
            window.monaco.editor.getEditors().find((e) => e.hasTextFocus()) ||
            window.monaco.editor.getEditors()[0]
          if (activeEditor) {
            activeEditor.focus()
            activeEditor.getAction('actions.find')?.run()
          }
        }
        return
      }

      // 10. Ctrl+H / Cmd+Option+F -> Open Monaco Replace Widget
      if (
        (modifier && key === 'h' && !event.shiftKey && !event.altKey) ||
        (modifier && event.altKey && key === 'f' && !event.shiftKey)
      ) {
        event.preventDefault()
        event.stopPropagation()
        if (typeof window !== 'undefined' && window.monaco) {
          const activeEditor =
            window.__polyglotmeshActiveEditor ||
            window.monaco.editor.getEditors().find((e) => e.hasTextFocus()) ||
            window.monaco.editor.getEditors()[0]
          if (activeEditor) {
            activeEditor.focus()
            activeEditor.getAction('editor.action.startFindReplaceAction')?.run()
          }
        }
        return
      }

      // 11. Ctrl+G / Cmd+G -> Open Monaco Go to Line Widget
      if (modifier && key === 'g' && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        event.stopPropagation()
        if (typeof window !== 'undefined' && window.monaco) {
          const activeEditor =
            window.__polyglotmeshActiveEditor ||
            window.monaco.editor.getEditors().find((e) => e.hasTextFocus()) ||
            window.monaco.editor.getEditors()[0]
          if (activeEditor) {
            activeEditor.focus()
            const gotoAction = activeEditor.getAction('editor.action.gotoLine')
            if (gotoAction) {
              gotoAction.run()
            }
          }
        }
        return
      }

      // 12. Ctrl+= / Ctrl++ / Cmd+= -> Zoom In
      if (modifier && (key === '=' || key === '+' || event.key === '=' || event.key === '+') && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        event.stopPropagation()
        setEditorSettings((prev) => ({
          ...prev,
          fontSize: Math.min(32, (prev.fontSize ?? 14) + 1),
        }))
        return
      }

      // 13. Ctrl+- / Cmd+- -> Zoom Out
      if (modifier && (key === '-' || event.key === '-') && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        event.stopPropagation()
        setEditorSettings((prev) => ({
          ...prev,
          fontSize: Math.max(10, (prev.fontSize ?? 14) - 1),
        }))
        return
      }

      // 14. Ctrl+0 / Cmd+0 -> Reset Zoom
      if (modifier && key === '0' && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        event.stopPropagation()
        setEditorSettings((prev) => ({
          ...prev,
          fontSize: 14,
        }))
        return
      }

      // 15. Ctrl+Shift+M / Cmd+Shift+M -> Toggle Problems Panel
      if (modifier && event.shiftKey && key === 'm') {
        event.preventDefault()
        event.stopPropagation()
        window.dispatchEvent(new CustomEvent('polyglotmesh:toggle-problems'))
        return
      }

      // 16. Ctrl+Shift+O / Cmd+Shift+O -> Open Outline / Symbol Navigation
      if (modifier && event.shiftKey && key === 'o') {
        event.preventDefault()
        event.stopPropagation()
        window.dispatchEvent(new CustomEvent('polyglotmesh:open-outline'))
        return
      }

      // 17. F12 -> Go to Definition
      if (event.key === 'F12' && !event.shiftKey && !event.altKey && !modifier) {
        event.preventDefault()
        event.stopPropagation()
        window.dispatchEvent(new CustomEvent('polyglotmesh:goto-definition'))
        return
      }

      // 18. Alt+F12 -> Peek Definition
      if (event.key === 'F12' && event.altKey && !event.shiftKey && !modifier) {
        event.preventDefault()
        event.stopPropagation()
        window.dispatchEvent(new CustomEvent('polyglotmesh:peek-definition'))
        return
      }

      // 19. Shift+F12 -> Find All References
      if (event.key === 'F12' && event.shiftKey && !event.altKey && !modifier) {
        event.preventDefault()
        event.stopPropagation()
        window.dispatchEvent(new CustomEvent('polyglotmesh:find-references'))
        return
      }

      // 20. Alt+P -> Toggle Read-Only / Preview Mode
      if ((event.key === 'p' || event.key === 'P') && event.altKey && !event.shiftKey && !modifier) {
        event.preventDefault()
        event.stopPropagation()
        handleToggleReadOnly()
        return
      }
    },
    [
      isCommandPaletteOpen,
      isEditorSettingsOpen,
      handleSave,
      handleCreateFile,
      handleCloseActiveTab,
      handleNextTab,
      handlePrevTab,
      handleRunClick,
      handleToggleSplit,
      handleToggleReadOnly,
    ],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [handleKeyDown])

  const handleToggleSettings = useCallback(() => {
    setIsEditorSettingsOpen((current) => !current)
  }, [])

  const handleCloseSettings = useCallback(() => {
    setIsEditorSettingsOpen(false)
  }, [])

  return (
    <main className="ide-shell">
      <Header />

      <div className="ide-body">
        <Sidebar
          files={filesWithReadOnly}
          activeFile={activeFile}
          activeFileName={activeFile?.name}
          recentFileNames={recentFileNames}
          onSelectFile={handleSelectFile}
          onRenameFile={handleRenameFile}
          onDeleteFile={handleDeleteFile}
          onToggleSettings={handleToggleSettings}
          symbols={symbols}
          isLoadingSymbols={isLoadingSymbols}
          hasSymbolProvider={hasSymbolProvider}
          symbolError={symbolError}
          onRefreshSymbols={handleRefreshSymbols}
        />

        <section className="workspace" aria-label="PolyglotMesh workspace">
          <EditorPanel
            activeFile={activeFile}
            primaryFile={primaryFile}
            secondaryFile={secondaryFile}
            isSplit={isSplit}
            onToggleSplit={handleToggleSplit}
            onCloseSplit={handleCloseSplit}
            splitRatio={splitRatio}
            onSplitRatioChange={handleSplitRatioChange}
            onResetLayout={handleResetLayout}
            isReadOnly={Boolean(activeFile?.isReadOnly)}
            onToggleReadOnly={handleToggleReadOnly}
            activePane={activePane}
            onSetActivePane={setActivePane}
            openFiles={openFiles}
            files={filesWithReadOnly}
            onSelectFile={handleSelectFile}
            onCloseTab={handleCloseTab}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            onChange={handleEditorChange}
            onSave={handleSave}
            isRunning={isRunning}
            onRunClick={handleRunClick}
            editorSettings={editorSettings}
            onEditorSettingsChange={setEditorSettings}
            isSettingsOpen={isEditorSettingsOpen}
            onToggleSettings={handleToggleSettings}
            onCloseSettings={handleCloseSettings}
            saveMessage={saveMessage}
            problems={problems}
            onReferencesFound={handleReferencesFound}
            onResetSession={handleResetSession}
          />

          <ConsolePanel
            message={consoleMessage}
            isRunning={isRunning}
            activeFile={activeFile}
            openFiles={openFiles}
            files={filesWithReadOnly}
            onSelectFile={handleSelectFile}
            problems={problems}
            references={references}
            referenceSymbol={referenceSymbol}
            isLoadingReferences={isLoadingReferences}
            onClearReferences={handleClearReferences}
          />
        </section>
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onRun={handleRunClick}
        onSave={handleSave}
        onOpenSettings={() => setIsEditorSettingsOpen(true)}
        isSplit={isSplit}
        onToggleSplit={handleToggleSplit}
        onResetLayout={handleResetLayout}
        isReadOnly={Boolean(activeFile?.isReadOnly)}
        onToggleReadOnly={handleToggleReadOnly}
        onResetSession={handleResetSession}
      />
    </main>
  )
}

export default App
