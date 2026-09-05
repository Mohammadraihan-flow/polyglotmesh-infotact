import { useCallback, useEffect, useRef, useState } from 'react'
import CommandPalette from './components/CommandPalette.jsx'
import ConsolePanel from './components/ConsolePanel.jsx'
import EditorPanel from './components/EditorPanel.jsx'
import Header from './components/Header.jsx'
import Sidebar from './components/Sidebar.jsx'
import {
  getExtension,
  getLanguageLabelFromFileName,
  getMonacoLanguageFromFileName,
  LANGUAGE_DEFAULT_FILENAMES,
} from './utils/languageUtils.js'
import { useMonacoMarkers } from './hooks/useMonacoMarkers.js'
import { useMonacoSymbols } from './hooks/useMonacoSymbols.js'
import './App.css'

const languages = [
  'JavaScript',
  'Python',
  'Java',
  'C',
  'C++',
  'C/C++ Header',
  'JSON',
  'HTML',
  'CSS',
]

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

const WORKSPACE_STORAGE_KEY = 'polyglotmesh-workspace'
const SETTINGS_STORAGE_KEY = 'polyglotmesh-editor-settings'
const LEGACY_SETTINGS_STORAGE_KEY = 'polyglotmesh_editor_settings'

function saveWorkspaceToLocalStorage(
  files,
  openFileNames,
  activeFileName,
  recentFileNames,
  isSplit = false,
  secondaryFileName = null,
) {
  try {
    const payload = {
      files: files.map((file) => ({
        id: file.id ?? file.name,
        name: file.name,
        label: file.label,
        language: file.language ?? file.monacoLanguage,
        monacoLanguage: file.monacoLanguage ?? file.language,
        code: file.code ?? file.content ?? '',
        content: file.content ?? file.code ?? '',
      })),
      openFileNames: openFileNames ?? [],
      activeFileName: activeFileName ?? null,
      recentFileNames: recentFileNames ?? [],
      isSplit: Boolean(isSplit),
      secondaryFileName: secondaryFileName ?? null,
    }
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(payload))
  } catch (e) {
    console.warn('PolyglotMesh: Unable to save workspace to localStorage.', e)
  }
}

function getInitialWorkspace() {
  const emptyWorkspace = {
    files: [],
    openFileNames: [],
    activeFileName: null,
    recentFileNames: [],
    isSplit: false,
    secondaryFileName: null,
  }

  try {
    const rawData = localStorage.getItem(WORKSPACE_STORAGE_KEY)
    if (!rawData) {
      return emptyWorkspace
    }

    const parsed = JSON.parse(rawData)
    if (!parsed || typeof parsed !== 'object') {
      return emptyWorkspace
    }

    if (!Array.isArray(parsed.files)) {
      return emptyWorkspace
    }

    const validFiles = parsed.files
      .filter((file) => file && typeof file.name === 'string' && file.name.trim().length > 0)
      .map((file) => {
        const monacoLanguage = file.monacoLanguage ?? getMonacoLanguageFromFileName(file.name)
        const label = file.label ?? getLanguageLabelFromFileName(file.name)
        const content =
          typeof file.code === 'string'
            ? file.code
            : typeof file.content === 'string'
            ? file.content
            : ''
        return {
          id: file.id ?? file.name,
          name: file.name,
          label,
          language: monacoLanguage,
          monacoLanguage,
          code: content,
          content,
          isDirty: false,
        }
      })

    const validNamesSet = new Set(validFiles.map((f) => f.name))

    const validOpenNames = Array.isArray(parsed.openFileNames)
      ? parsed.openFileNames.filter((name) => validNamesSet.has(name))
      : []

    let validActiveName = null
    if (typeof parsed.activeFileName === 'string' && validNamesSet.has(parsed.activeFileName)) {
      validActiveName = parsed.activeFileName
    } else if (validOpenNames.length > 0) {
      validActiveName = validOpenNames[0]
    } else if (validFiles.length > 0) {
      validActiveName = validFiles[0].name
    }

    if (validActiveName && !validOpenNames.includes(validActiveName)) {
      validOpenNames.push(validActiveName)
    }

    const validRecentNames = Array.isArray(parsed.recentFileNames)
      ? parsed.recentFileNames.filter((name) => validNamesSet.has(name)).slice(0, 5)
      : []

    const isSplit = Boolean(parsed.isSplit)
    let validSecondaryName = null
    if (typeof parsed.secondaryFileName === 'string' && validNamesSet.has(parsed.secondaryFileName)) {
      validSecondaryName = parsed.secondaryFileName
    }

    return {
      files: validFiles,
      openFileNames: validOpenNames,
      activeFileName: validActiveName,
      recentFileNames: validRecentNames,
      isSplit: isSplit && Boolean(validSecondaryName),
      secondaryFileName: validSecondaryName,
    }
  } catch (e) {
    console.warn('PolyglotMesh: Unable to parse saved workspace from localStorage.', e)
    return emptyWorkspace
  }
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
  const [initialWorkspaceState] = useState(getInitialWorkspace)
  const [files, setFiles] = useState(initialWorkspaceState.files)
  const [openFileNames, setOpenFileNames] = useState(initialWorkspaceState.openFileNames)
  const [activeFileName, setActiveFileName] = useState(initialWorkspaceState.activeFileName)
  const [recentFileNames, setRecentFileNames] = useState(initialWorkspaceState.recentFileNames)
  const [isSplit, setIsSplit] = useState(initialWorkspaceState.isSplit ?? false)
  const [secondaryFileName, setSecondaryFileName] = useState(initialWorkspaceState.secondaryFileName ?? null)
  const [activePane, setActivePane] = useState('primary')
  const [isRunning, setIsRunning] = useState(false)
  const [consoleMessage, setConsoleMessage] = useState('Click Run to execute your program.')
  const [editorSettings, setEditorSettings] = useState(getInitialSettings)
  const [isEditorSettingsOpen, setIsEditorSettingsOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const runTimerRef = useRef(null)
  const saveTimerRef = useRef(null)
  const autoSaveTimerRef = useRef(null)
  const pendingChangesRef = useRef({})

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(editorSettings))
      localStorage.setItem(LEGACY_SETTINGS_STORAGE_KEY, JSON.stringify(editorSettings))
      if (editorSettings.wordWrap && ['on', 'off', 'wordWrapColumn'].includes(editorSettings.wordWrap)) {
        localStorage.setItem('polyglotmesh-word-wrap', editorSettings.wordWrap)
      }
    } catch (e) {
      // Ignore error
    }
    const currentTheme = editorSettings.theme ?? 'vs-dark'
    document.documentElement.setAttribute('data-theme', currentTheme)
  }, [editorSettings])

  useEffect(() => {
    if (!activeFileName) return
    const fileExists = files.some((f) => f.name === activeFileName)
    if (!fileExists) return

    setRecentFileNames((prev) => {
      const filtered = prev.filter((name) => name !== activeFileName)
      return [activeFileName, ...filtered].slice(0, 5)
    })
  }, [activeFileName, files])

  useEffect(() => {
    const existingNames = new Set(files.map((f) => f.name))
    setRecentFileNames((prev) => {
      const filtered = prev.filter((name) => existingNames.has(name))
      return filtered.length === prev.length ? prev : filtered
    })
  }, [files])

  const filesRef = useRef(files)
  const openFileNamesRef = useRef(openFileNames)
  const activeFileNameRef = useRef(activeFileName)
  const recentFileNamesRef = useRef(recentFileNames)
  const isSplitRef = useRef(isSplit)
  const secondaryFileNameRef = useRef(secondaryFileName)
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
    )
  }, [openFileNames, activeFileName, recentFileNames, isSplit, secondaryFileName])

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

  const primaryFile = files.find((file) => file.name === activeFileName) ?? null
  const secondaryFile =
    isSplit && secondaryFileName
      ? files.find((file) => file.name === secondaryFileName) ?? null
      : null
  const activeFile =
    isSplit && activePane === 'secondary' && secondaryFile
      ? secondaryFile
      : primaryFile
  const activeLanguage = activeFile
    ? getLanguageLabelFromFileName(activeFile.name)
    : ''
  const openFiles = openFileNames
    .map((name) => files.find((file) => file.name === name))
    .filter(Boolean)
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
    setReferences([])
    setReferenceSymbol('')
    setIsLoadingReferences(false)
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

  const handleCreateFile = useCallback((fileName) => {
    flushAutoSave()
    const trimmedName = fileName ? fileName.trim() : 'untitled.js'
    if (!isValidFileName(trimmedName)) {
      return { success: false, message: 'Enter a valid file name.' }
    }

    const currentFiles = filesRef.current
    const currentOpenNames = openFileNamesRef.current

    const existingFile = currentFiles.find(
      (file) => file.name.toLowerCase() === trimmedName.toLowerCase(),
    )

    if (existingFile) {
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
    const monacoLanguage = getMonacoLanguageFromFileName(uniqueName)
    const label = getLanguageLabelFromFileName(uniqueName)

    const newFile = {
      id: uniqueName,
      name: uniqueName,
      label,
      language: monacoLanguage,
      monacoLanguage,
      code: '',
      content: '',
      isDirty: false,
    }

    const nextFiles = [...currentFiles, newFile]
    const nextOpen = currentOpenNames.includes(uniqueName)
      ? currentOpenNames
      : [...currentOpenNames, uniqueName]

    setFiles(nextFiles)
    setOpenFileNames(nextOpen)
    setActiveFileName(uniqueName)

    saveWorkspaceToLocalStorage(
      nextFiles,
      nextOpen,
      uniqueName,
      recentFileNamesRef.current,
      isSplitRef.current,
      secondaryFileNameRef.current,
    )

    return {
      success: true,
      fileName: uniqueName,
      message:
        uniqueName === trimmedName
          ? 'File created.'
          : `File created as ${uniqueName}.`,
    }
  }, [flushAutoSave])

  const handleSelectLanguage = (targetLanguage) => {
    flushAutoSave()
    const defaultFileName = LANGUAGE_DEFAULT_FILENAMES[targetLanguage] ?? 'main.js'

    const existingFile = files.find(
      (file) => file.name.toLowerCase() === defaultFileName.toLowerCase(),
    )

    if (existingFile) {
      if (!openFileNames.includes(existingFile.name)) {
        setOpenFileNames((prevOpen) => [...prevOpen, existingFile.name])
      }
      setActiveFileName(existingFile.name)
      return
    }

    handleCreateFile(defaultFileName)
  }

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
    (fileName, targetPane) => {
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
          (m) => m.uri.path === `/${fileName}` || m.uri.path === fileName,
        )
        targetModel?.dispose()
      } catch (e) {
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

    saveWorkspaceToLocalStorage(
      nextFiles,
      nextOpenNames,
      nextActive,
      nextRecent,
      isSplitRef.current,
      nextSecondary,
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
            (m) => m.uri.path === `/${oldFileName}` || m.uri.path === oldFileName,
          )
          oldModel?.dispose()
        } catch (e) {
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

      saveWorkspaceToLocalStorage(
        nextFiles,
        nextOpen,
        nextActive,
        nextRecent,
        isSplitRef.current,
        nextSecondary,
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

      if (!targetFile) return

      const newContent = value ?? ''

      pendingChangesRef.current[targetFile] = newContent
      setSaveMessage('Saving...')

      setFiles((currentFiles) =>
        currentFiles.map((file) => {
          if (file.name === targetFile) {
            const currentContent = file.code ?? file.content ?? ''
            if (currentContent === newContent) return file
            return {
              ...file,
              code: newContent,
              content: newContent,
              isDirty: true,
            }
          }
          return file
        }),
      )

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

  useEffect(() => {
    const onSaveEvent = () => handleSave()
    const onToggleSplitEvent = () => handleToggleSplit()
    const onOpenSplitEvent = () => {
      if (!isSplitRef.current) handleToggleSplit()
    }
    const onCloseSplitEvent = () => {
      if (isSplitRef.current) handleCloseSplit()
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
    window.addEventListener('polyglotmesh:focus-pane', onFocusPaneEvent)

    return () => {
      window.removeEventListener('polyglotmesh:save', onSaveEvent)
      window.removeEventListener('polyglotmesh:toggle-split', onToggleSplitEvent)
      window.removeEventListener('polyglotmesh:open-split', onOpenSplitEvent)
      window.removeEventListener('polyglotmesh:close-split', onCloseSplitEvent)
      window.removeEventListener('polyglotmesh:focus-pane', onFocusPaneEvent)
    }
  }, [handleSave, handleToggleSplit, handleCloseSplit])

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
    ],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [handleKeyDown])

  return (
    <main className="ide-shell">
      <Header />

      <div className="ide-body">
        <Sidebar
          files={files}
          activeFile={activeFile}
          activeFileName={activeFile?.name}
          recentFileNames={recentFileNames}
          onSelectFile={handleSelectFile}
          onRenameFile={handleRenameFile}
          onDeleteFile={handleDeleteFile}
          onToggleSettings={() => setIsEditorSettingsOpen((s) => !s)}
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
            activePane={activePane}
            onSetActivePane={setActivePane}
            openFiles={openFiles}
            files={files}
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
            onToggleSettings={() => setIsEditorSettingsOpen((s) => !s)}
            onCloseSettings={() => setIsEditorSettingsOpen(false)}
            saveMessage={saveMessage}
            problems={problems}
            onReferencesFound={handleReferencesFound}
          />

          <ConsolePanel
            message={consoleMessage}
            isRunning={isRunning}
            activeFile={activeFile}
            openFiles={openFiles}
            files={files}
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
      />
    </main>
  )
}

export default App
