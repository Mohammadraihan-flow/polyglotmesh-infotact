import { useState } from 'react'
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
    language: 'JavaScript',
    starterCode: 'console.log("Hello, PolyglotMesh!");\n',
  },
  {
    name: 'main.py',
    language: 'Python',
    starterCode: 'print("Hello, PolyglotMesh!")\n',
  },
  {
    name: 'Main.java',
    language: 'Java',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, PolyglotMesh!");\n    }\n}\n',
  },
  {
    name: 'main.c',
    language: 'C',
    starterCode:
      '#include <stdio.h>\n\nint main() {\n    printf("Hello, PolyglotMesh!\\n");\n    return 0;\n}\n',
  },
  {
    name: 'main.cpp',
    language: 'C++',
    starterCode:
      '#include <iostream>\n\nint main() {\n    std::cout << "Hello, PolyglotMesh!" << std::endl;\n    return 0;\n}\n',
  },
]

const languageToFileName = Object.fromEntries(
  fileDefinitions.map(({ language, name }) => [language, name]),
)

function createInitialFiles() {
  return fileDefinitions.map(({ name, language, starterCode }) => ({
    name,
    language,
    code: starterCode,
  }))
}

function App() {
  const [files, setFiles] = useState(createInitialFiles)
  const [activeFileName, setActiveFileName] = useState(fileDefinitions[0].name)

  const activeFile = files.find((file) => file.name === activeFileName) ?? files[0]
  const activeLanguage = activeFile?.language ?? languages[0]

  const handleSelectLanguage = (language) => {
    setActiveFileName(languageToFileName[language] ?? fileDefinitions[0].name)
  }

  const handleSelectFile = (fileName) => {
    setActiveFileName(fileName)
  }

  const handleEditorChange = (value) => {
    setFiles((currentFiles) =>
      currentFiles.map((file) =>
        file.name === activeFileName ? { ...file, code: value ?? '' } : file,
      ),
    )
  }

  return (
    <main className="ide-shell">
      <Header />

      <div className="ide-body">
        <Sidebar />

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
            onChange={handleEditorChange}
          />
          <ConsolePanel />
        </section>
      </div>
    </main>
  )
}

export default App
