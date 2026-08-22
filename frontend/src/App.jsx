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

const defaultSettings = {
  fontSize: 14,
  wordWrap: 'on',
  minimap: true,
  lineNumbers: 'on',
  tabSize: 4,
  autoIndent: 'full',
  automaticLayout: true,
  theme: 'vs-dark',
}

const getInitialSettings = () => {
  let settings = defaultSettings
  try {
    const stored = localStorage.getItem('polyglotmesh_editor_settings')
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
      }
    } else if (wordWrapVal) {
      settings = { ...defaultSettings, wordWrap: wordWrapVal }
    }
  } catch (e) {
    // Ignore error
  }
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', settings.theme ?? 'vs-dark')
  }
  return settings
}

function App() {
  const [files, setFiles] = useState([])
  const [openFileNames, setOpenFileNames] = useState([])
  const [activeFileName, setActiveFileName] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [consoleMessage, setConsoleMessage] = useState('Click Run to execute your program.')
  const [editorSettings, setEditorSettings] = useState(getInitialSettings)
  const [isEditorSettingsOpen, setIsEditorSettingsOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const runTimerRef = useRef(null)
  const saveTimerRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem('polyglotmesh_editor_settings', JSON.stringify(editorSettings))
      if (editorSettings.wordWrap && ['on', 'off', 'wordWrapColumn'].includes(editorSettings.wordWrap)) {
        localStorage.setItem('polyglotmesh-word-wrap', editorSettings.wordWrap)
      }
    } catch (e) {
      // Ignore error
    }
    const currentTheme = editorSettings.theme ?? 'vs-dark'
    document.documentElement.setAttribute('data-theme', currentTheme)
  }, [editorSettings])

  const activeFileNameRef = useRef(activeFileName)

  useEffect(() => {
    activeFileNameRef.current = activeFileName
  }, [activeFileName])

  const activeFile = files.find((file) => file.name === activeFileName) ?? null
  const activeLanguage = activeFile
    ? getLanguageLabelFromFileName(activeFile.name)
    : ''
  const openFiles = openFileNames
    .map((name) => files.find((file) => file.name === name))
    .filter(Boolean)

  const handleCreateFile = (fileName) => {
    const trimmedName = fileName ? fileName.trim() : ''
    if (!isValidFileName(trimmedName)) {
      return { success: false, message: 'Enter a valid file name.' }
    }

    const existingFile = files.find(
      (file) => file.name.toLowerCase() === trimmedName.toLowerCase(),
    )

    if (existingFile) {
      if (!openFileNames.includes(existingFile.name)) {
        setOpenFileNames((prevOpen) => [...prevOpen, existingFile.name])
      }
      setActiveFileName(existingFile.name)
      return {
        success: true,
        fileName: existingFile.name,
        message: `Selected existing ${existingFile.name}.`,
      }
    }

    const uniqueName = makeUniqueFileName(trimmedName, files)
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

    setFiles((currentFiles) => [...currentFiles, newFile])

    setOpenFileNames((prevOpen) =>
      prevOpen.includes(uniqueName) ? prevOpen : [...prevOpen, uniqueName],
    )

    setActiveFileName(uniqueName)

    return {
      success: true,
      fileName: uniqueName,
      message:
        uniqueName === trimmedName
          ? 'File created.'
          : `File created as ${uniqueName}.`,
    }
  }

  const handleSelectLanguage = (targetLanguage) => {
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

  const handleSelectFile = (fileName) => {
    setOpenFileNames((prevOpen) =>
      prevOpen.includes(fileName) ? prevOpen : [...prevOpen, fileName],
    )
    setActiveFileName(fileName)
  }

  const handleCloseTab = (fileName) => {
    const index = openFileNames.indexOf(fileName)
    if (index === -1) return

    const nextOpenNames = openFileNames.filter((name) => name !== fileName)
    setOpenFileNames(nextOpenNames)

    if (fileName === activeFileName) {
      if (nextOpenNames.length === 0) {
        setActiveFileName(null)
      } else {
        const nextActive = nextOpenNames[index - 1] ?? nextOpenNames[index] ?? nextOpenNames[0]
        setActiveFileName(nextActive)
      }
    }
  }

  const handleDeleteFile = (fileName) => {
    const fileIndex = files.findIndex((file) => file.name === fileName)
    if (fileIndex === -1) return

    const nextFiles = files.filter((file) => file.name !== fileName)
    setFiles(nextFiles)

    const openIndex = openFileNames.indexOf(fileName)
    const nextOpenNames = openFileNames.filter((name) => name !== fileName)
    setOpenFileNames(nextOpenNames)

    if (fileName === activeFileName) {
      if (nextOpenNames.length > 0) {
        const nextActive = nextOpenNames[Math.max(0, openIndex - 1)] ?? nextOpenNames[0]
        setActiveFileName(nextActive)
      } else if (nextFiles.length > 0) {
        const fallbackFile = nextFiles[Math.max(0, fileIndex - 1)] ?? nextFiles[0]
        setOpenFileNames([fallbackFile.name])
        setActiveFileName(fallbackFile.name)
      } else {
        setActiveFileName(null)
      }
    }
  }

  const handleRenameFile = (oldFileName, newFileName) => {
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

    if (trimmedNewName.toLowerCase() === oldFileName.toLowerCase()) {
      if (trimmedNewName === oldFileName) {
        return { success: true, message: 'No changes made.' }
      }
    } else {
      const isDuplicate = files.some(
        (file) => file.name.toLowerCase() === trimmedNewName.toLowerCase(),
      )

      if (isDuplicate) {
        return { success: false, message: 'A file with this name already exists.' }
      }
    }

    const monacoLanguage = getMonacoLanguageFromFileName(trimmedNewName)
    const label = getLanguageLabelFromFileName(trimmedNewName)

    setFiles((currentFiles) =>
      currentFiles.map((file) => {
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
      }),
    )

    setOpenFileNames((prevOpen) =>
      prevOpen.map((name) => (name === oldFileName ? trimmedNewName : name)),
    )

    if (oldFileName === activeFileName) {
      setActiveFileName(trimmedNewName)
    }

    return { success: true, message: 'File renamed.' }
  }

  const handleEditorChange = useCallback((value) => {
    const currentActiveName = activeFileNameRef.current
    if (!currentActiveName) return

    setFiles((currentFiles) =>
      currentFiles.map((file) =>
        file.name === currentActiveName
          ? { ...file, code: value ?? '', content: value ?? '', isDirty: true }
          : file,
      ),
    )
  }, [])

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
    setSaveMessage(`Saved ${activeFile?.name ?? 'file'}`)
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = window.setTimeout(() => {
      setSaveMessage('')
      saveTimerRef.current = null
    }, 2500)
  }, [activeFile?.name])

  useEffect(
    () => () => {
      if (runTimerRef.current) {
        clearTimeout(runTimerRef.current)
      }
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
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

      // 4. Ctrl+Enter / Cmd+Enter -> Run
      if (modifier && event.key === 'Enter') {
        event.preventDefault()
        event.stopPropagation()
        handleRunClick()
        return
      }
    },
    [isCommandPaletteOpen, isEditorSettingsOpen, handleSave, handleRunClick],
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
          activeFileName={activeFile?.name}
          onSelectFile={handleSelectFile}
          onRenameFile={handleRenameFile}
          onDeleteFile={handleDeleteFile}
          onToggleSettings={() => setIsEditorSettingsOpen((s) => !s)}
        />

        <section className="workspace" aria-label="PolyglotMesh workspace">
          <EditorPanel
            activeFile={activeFile}
            openFiles={openFiles}
            files={files}
            onSelectFile={handleSelectFile}
            onCloseTab={handleCloseTab}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            onChange={handleEditorChange}
            isRunning={isRunning}
            onRunClick={handleRunClick}
            editorSettings={editorSettings}
            onEditorSettingsChange={setEditorSettings}
            isSettingsOpen={isEditorSettingsOpen}
            onToggleSettings={() => setIsEditorSettingsOpen((s) => !s)}
            onCloseSettings={() => setIsEditorSettingsOpen(false)}
            saveMessage={saveMessage}
          />

          <ConsolePanel message={consoleMessage} isRunning={isRunning} />
        </section>
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onRun={handleRunClick}
        onSave={handleSave}
        onOpenSettings={() => setIsEditorSettingsOpen(true)}
      />
    </main>
  )
}

export default App
