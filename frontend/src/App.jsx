import { useEffect, useRef, useState } from 'react'
import ConsolePanel from './components/ConsolePanel.jsx'
import EditorPanel from './components/EditorPanel.jsx'
import Header from './components/Header.jsx'
import LanguageTabs from './components/LanguageTabs.jsx'
import Sidebar from './components/Sidebar.jsx'
import './App.css'

const languages = ['JavaScript', 'Python', 'Java', 'C', 'C++']

const fileDefinitions = [
  {
    name: 'main.js',
    label: 'JavaScript',
    monacoLanguage: 'javascript',
    starterCode: 'console.log("Hello, PolyglotMesh!");\n',
  },
  {
    name: 'main.py',
    label: 'Python',
    monacoLanguage: 'python',
    starterCode: 'print("Hello, PolyglotMesh!")\n',
  },
  {
    name: 'Main.java',
    label: 'Java',
    monacoLanguage: 'java',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, PolyglotMesh!");\n    }\n}\n',
  },
  {
    name: 'main.c',
    label: 'C',
    monacoLanguage: 'c',
    starterCode:
      '#include <stdio.h>\n\nint main() {\n    printf("Hello, PolyglotMesh!\\n");\n    return 0;\n}\n',
  },
  {
    name: 'main.cpp',
    label: 'C++',
    monacoLanguage: 'cpp',
    starterCode:
      '#include <iostream>\n\nint main() {\n    std::cout << "Hello, PolyglotMesh!" << std::endl;\n    return 0;\n}\n',
  },
]

const templateByExtension = {
  js: {
    label: 'JavaScript',
    monacoLanguage: 'javascript',
    starterCode: 'console.log("Hello, PolyglotMesh!");\n',
  },
  py: {
    label: 'Python',
    monacoLanguage: 'python',
    starterCode: 'print("Hello, PolyglotMesh!")\n',
  },
  java: {
    label: 'Java',
    monacoLanguage: 'java',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, PolyglotMesh!");\n    }\n}\n',
  },
  c: {
    label: 'C',
    monacoLanguage: 'c',
    starterCode:
      '#include <stdio.h>\n\nint main() {\n    printf("Hello, PolyglotMesh!\\n");\n    return 0;\n}\n',
  },
  cpp: {
    label: 'C++',
    monacoLanguage: 'cpp',
    starterCode:
      '#include <iostream>\n\nint main() {\n    std::cout << "Hello, PolyglotMesh!" << std::endl;\n    return 0;\n}\n',
  },
  h: {
    label: 'C++',
    monacoLanguage: 'cpp',
    starterCode:
      '#include <iostream>\n\nint main() {\n    std::cout << "Hello, PolyglotMesh!" << std::endl;\n    return 0;\n}\n',
  },
  json: {
    label: 'JSON',
    monacoLanguage: 'json',
    starterCode: '{\n  "message": "Hello, PolyglotMesh!"\n}\n',
  },
  html: {
    label: 'HTML',
    monacoLanguage: 'html',
    starterCode:
      '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>PolyglotMesh</title>\n  </head>\n  <body>\n    <h1>Hello, PolyglotMesh!</h1>\n  </body>\n</html>\n',
  },
  css: {
    label: 'CSS',
    monacoLanguage: 'css',
    starterCode:
      'body {\n  margin: 0;\n  font-family: sans-serif;\n}\n',
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
  const runTimerRef = useRef(null)

  const activeFile = files.find((file) => file.name === activeFileName) ?? files[0]
  const activeLanguage = activeFile?.label ?? languages[0]

  const handleSelectLanguage = (language) => {
    const matchingFile = files.find((file) => file.label === language)
    setActiveFileName(matchingFile?.name ?? fileDefinitions[0].name)
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

  const handleEditorChange = (value) => {
    setFiles((currentFiles) =>
      currentFiles.map((file) =>
        file.name === activeFileName ? { ...file, code: value ?? '' } : file,
      ),
    )
  }

  const handleRunClick = () => {
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
  }

  useEffect(
    () => () => {
      if (runTimerRef.current) {
        clearTimeout(runTimerRef.current)
      }
    },
    [],
  )

  return (
    <main className="ide-shell">
      <Header />

      <div className="ide-body">
          <Sidebar onToggleSettings={() => setIsEditorSettingsOpen((s) => !s)} />

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
          />

          <ConsolePanel message={consoleMessage} isRunning={isRunning} />
        </section>
      </div>
    </main>
  )
}

export default App
