import { useCallback, useEffect, useRef, useState } from 'react'
import CommandPalette from './components/CommandPalette.jsx'
import ConsolePanel from './components/ConsolePanel.jsx'
import EditorPanel from './components/EditorPanel.jsx'
import Header from './components/Header.jsx'
import LanguageTabs from './components/LanguageTabs.jsx'
import Sidebar from './components/Sidebar.jsx'
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

const languageToTemplateMap = {
  JavaScript: {
    extension: '.js',
    label: 'JavaScript',
    monacoLanguage: 'javascript',
    starterCode: 'console.log("Hello from JavaScript");\n',
  },
  Python: {
    extension: '.py',
    label: 'Python',
    monacoLanguage: 'python',
    starterCode: 'print("Hello from Python");\n',
  },
  Java: {
    extension: '.java',
    label: 'Java',
    monacoLanguage: 'java',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java");\n    }\n}\n',
  },
  C: {
    extension: '.c',
    label: 'C',
    monacoLanguage: 'c',
    starterCode:
      '#include <stdio.h>\n\nint main() {\n    printf("Hello from C");\n    return 0;\n}\n',
  },
  'C++': {
    extension: '.cpp',
    label: 'C++',
    monacoLanguage: 'cpp',
    starterCode:
      '#include <iostream>\n\nint main() {\n    std::cout << "Hello from C++";\n    return 0;\n}\n',
  },
  'C/C++ Header': {
    extension: '.h',
    label: 'C/C++ Header',
    monacoLanguage: 'cpp',
    starterCode:
      '#ifndef POLYGLOTMESH_H\n#define POLYGLOTMESH_H\n\nvoid hello();\n\n#endif\n',
  },
  Header: {
    extension: '.h',
    label: 'C/C++ Header',
    monacoLanguage: 'cpp',
    starterCode:
      '#ifndef POLYGLOTMESH_H\n#define POLYGLOTMESH_H\n\nvoid hello();\n\n#endif\n',
  },
  JSON: {
    extension: '.json',
    label: 'JSON',
    monacoLanguage: 'json',
    starterCode: '{\n  "name": "PolyglotMesh"\n}\n',
  },
  HTML: {
    extension: '.html',
    label: 'HTML',
    monacoLanguage: 'html',
    starterCode:
      '<!DOCTYPE html>\n<html>\n<head>\n    <title>PolyglotMesh</title>\n</head>\n<body>\n    <h1>PolyglotMesh</h1>\n</body>\n</html>\n',
  },
  CSS: {
    extension: '.css',
    label: 'CSS',
    monacoLanguage: 'css',
    starterCode:
      'body {\n    font-family: sans-serif;\n}\n',
  },
}

const fileDefinitions = [
  {
    name: 'main.js',
    label: 'JavaScript',
    monacoLanguage: 'javascript',
    starterCode: 'console.log("Hello from JavaScript");\n',
  },
  {
    name: 'main.py',
    label: 'Python',
    monacoLanguage: 'python',
    starterCode: 'print("Hello from Python");\n',
  },
  {
    name: 'Main.java',
    label: 'Java',
    monacoLanguage: 'java',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java");\n    }\n}\n',
  },
  {
    name: 'main.c',
    label: 'C',
    monacoLanguage: 'c',
    starterCode:
      '#include <stdio.h>\n\nint main() {\n    printf("Hello from C");\n    return 0;\n}\n',
  },
  {
    name: 'main.cpp',
    label: 'C++',
    monacoLanguage: 'cpp',
    starterCode:
      '#include <iostream>\n\nint main() {\n    std::cout << "Hello from C++";\n    return 0;\n}\n',
  },
]

const templateByExtension = {
  js: {
    label: 'JavaScript',
    monacoLanguage: 'javascript',
    starterCode: 'console.log("Hello from JavaScript");\n',
  },
  py: {
    label: 'Python',
    monacoLanguage: 'python',
    starterCode: 'print("Hello from Python");\n',
  },
  java: {
    label: 'Java',
    monacoLanguage: 'java',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java");\n    }\n}\n',
  },
  c: {
    label: 'C',
    monacoLanguage: 'c',
    starterCode:
      '#include <stdio.h>\n\nint main() {\n    printf("Hello from C");\n    return 0;\n}\n',
  },
  cpp: {
    label: 'C++',
    monacoLanguage: 'cpp',
    starterCode:
      '#include <iostream>\n\nint main() {\n    std::cout << "Hello from C++";\n    return 0;\n}\n',
  },
  h: {
    label: 'C/C++ Header',
    monacoLanguage: 'cpp',
    starterCode:
      '#ifndef POLYGLOTMESH_H\n#define POLYGLOTMESH_H\n\nvoid hello();\n\n#endif\n',
  },
  json: {
    label: 'JSON',
    monacoLanguage: 'json',
    starterCode: '{\n  "name": "PolyglotMesh"\n}\n',
  },
  html: {
    label: 'HTML',
    monacoLanguage: 'html',
    starterCode:
      '<!DOCTYPE html>\n<html>\n<head>\n    <title>PolyglotMesh</title>\n</head>\n<body>\n    <h1>PolyglotMesh</h1>\n</body>\n</html>\n',
  },
  css: {
    label: 'CSS',
    monacoLanguage: 'css',
    starterCode:
      'body {\n    font-family: sans-serif;\n}\n',
  },
}

function createInitialFiles() {
  return fileDefinitions.map(({ name, label, monacoLanguage, starterCode }) => ({
    name,
    label,
    monacoLanguage,
    code: starterCode,
  }))
}

function getExtension(fileName) {
  const trimmedName = fileName.trim()
  const dotIndex = trimmedName.lastIndexOf('.')

  if (dotIndex <= 0 || dotIndex === trimmedName.length - 1) {
    return ''
  }

  return trimmedName.slice(dotIndex + 1).toLowerCase()
}

function getFileTemplate(fileName) {
  return templateByExtension[getExtension(fileName)] ?? {
    label: 'Plain Text',
    monacoLanguage: 'plaintext',
    starterCode: '',
  }
}

function isValidFileName(fileName) {
  const trimmedName = fileName.trim()
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

function App() {
  const [files, setFiles] = useState(createInitialFiles)
  const [activeFileName, setActiveFileName] = useState(fileDefinitions[0].name)
  const [isRunning, setIsRunning] = useState(false)
  const [consoleMessage, setConsoleMessage] = useState('Click Run to execute your program.')
  const [editorSettings, setEditorSettings] = useState({
    fontSize: 14,
    wordWrap: 'on',
    minimap: true,
    automaticLayout: true,
  })
  const [isEditorSettingsOpen, setIsEditorSettingsOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const runTimerRef = useRef(null)
  const saveTimerRef = useRef(null)

  const activeFileNameRef = useRef(activeFileName)

  useEffect(() => {
    activeFileNameRef.current = activeFileName
  }, [activeFileName])

  const activeFile = files.find((file) => file.name === activeFileName) ?? files[0]
  const activeLanguage = activeFile?.label ?? languages[0]

  const handleSelectLanguage = (targetLanguage) => {
    const targetTemplate =
      languageToTemplateMap[targetLanguage] ?? languageToTemplateMap['JavaScript']
    const currentActiveName = activeFileNameRef.current ?? activeFileName
    const currentFile = files.find((file) => file.name === currentActiveName) ?? files[0]

    if (!currentFile) return

    const dotIndex = currentFile.name.lastIndexOf('.')
    let stem = dotIndex > 0 ? currentFile.name.slice(0, dotIndex) : currentFile.name

    if (targetTemplate.extension === '.java' && stem.toLowerCase() === 'main') {
      stem = 'Main'
    }

    const desiredName = `${stem}${targetTemplate.extension}`
    const otherFiles = files.filter((file) => file.name !== currentFile.name)
    const newFileName = makeUniqueFileName(desiredName, otherFiles)

    setFiles((currentFiles) =>
      currentFiles.map((file) => {
        if (file.name === currentFile.name) {
          return {
            ...file,
            name: newFileName,
            label: targetTemplate.label,
            monacoLanguage: targetTemplate.monacoLanguage,
            code: targetTemplate.starterCode,
          }
        }
        return file
      }),
    )

    setActiveFileName(newFileName)
  }

  const handleSelectFile = (fileName) => {
    setActiveFileName(fileName)
  }

  const handleCreateFile = (fileName) => {
    if (!isValidFileName(fileName)) {
      return { success: false, message: 'Enter a valid file name.' }
    }

    const uniqueName = makeUniqueFileName(fileName, files)
    const template = getFileTemplate(uniqueName)

    setFiles((currentFiles) => [
      ...currentFiles,
      {
        name: uniqueName,
        label: template.label,
        monacoLanguage: template.monacoLanguage,
        code: template.starterCode,
      },
    ])
    setActiveFileName(uniqueName)

    return {
      success: true,
      fileName: uniqueName,
      message:
        uniqueName === fileName.trim()
          ? 'File created.'
          : `File created as ${uniqueName}.`,
    }
  }

  const handleDeleteFile = (fileName) => {
    if (files.length === 1) {
      return
    }

    const fileIndex = files.findIndex((file) => file.name === fileName)

    if (fileIndex === -1) {
      return
    }

    const nextFiles = files.filter((file) => file.name !== fileName)

    if (fileName === activeFileName) {
      const nextActiveFile = nextFiles[fileIndex] ?? nextFiles[fileIndex - 1] ?? nextFiles[0]

      if (nextActiveFile) {
        setActiveFileName(nextActiveFile.name)
      }
    }

    setFiles(nextFiles)
  }

  const handleRenameFile = (oldFileName, newFileName) => {
    const trimmedNewName = newFileName.trim()

    if (!trimmedNewName) {
      return { success: false, message: 'File name cannot be empty.' }
    }

    if (!isValidFileName(trimmedNewName)) {
      return { success: false, message: 'Enter a valid file name.' }
    }

    if (trimmedNewName === oldFileName) {
      return { success: true, message: 'No changes made.' }
    }

    const isDuplicate = files.some(
      (file) =>
        file.name.toLowerCase() === trimmedNewName.toLowerCase() &&
        file.name.toLowerCase() !== oldFileName.toLowerCase(),
    )

    if (isDuplicate) {
      return { success: false, message: 'A file with this name already exists.' }
    }

    const template = getFileTemplate(trimmedNewName)

    setFiles((currentFiles) =>
      currentFiles.map((file) => {
        if (file.name === oldFileName) {
          return {
            ...file,
            name: trimmedNewName,
            label: template.label,
            monacoLanguage: template.monacoLanguage,
          }
        }
        return file
      }),
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
        file.name === currentActiveName ? { ...file, code: value ?? '' } : file,
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
          onToggleSettings={() => setIsEditorSettingsOpen((s) => !s)}
        />

        <section className="workspace" aria-label="PolyglotMesh workspace">
          <LanguageTabs
            activeLanguage={activeLanguage}
            languages={languages}
            onSelectLanguage={handleSelectLanguage}
          />

          <EditorPanel
            activeFile={activeFile}
            files={files}
            onSelectFile={handleSelectFile}
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
