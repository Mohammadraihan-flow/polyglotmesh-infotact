import { useState } from 'react'
import ConsolePanel from './components/ConsolePanel.jsx'
import EditorPanel from './components/EditorPanel.jsx'
import Header from './components/Header.jsx'
import LanguageTabs from './components/LanguageTabs.jsx'
import Sidebar from './components/Sidebar.jsx'
import './App.css'

const languages = ['JavaScript', 'Python', 'Java', 'C', 'C++']

const starterCodeByLanguage = {
  JavaScript: 'function main() {\n  console.log("Hello, PolyglotMesh!");\n}\n\nmain();\n',
  Python: 'def main():\n    print("Hello, PolyglotMesh!")\n\n\nif __name__ == "__main__":\n    main()\n',
  Java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, PolyglotMesh!");\n    }\n}\n',
  C: '#include <stdio.h>\n\nint main(void) {\n    printf("Hello, PolyglotMesh!\\n");\n    return 0;\n}\n',
  'C++': '#include <iostream>\n\nint main() {\n    std::cout << "Hello, PolyglotMesh!" << std::endl;\n    return 0;\n}\n',
}

function App() {
  const [activeLanguage, setActiveLanguage] = useState(languages[0])
  const [editorCode, setEditorCode] = useState(starterCodeByLanguage.JavaScript)

  const handleSelectLanguage = (language) => {
    setActiveLanguage(language)
    setEditorCode(starterCodeByLanguage[language] ?? starterCodeByLanguage.JavaScript)
  }

  const handleEditorChange = (value) => {
    setEditorCode(value ?? '')
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
            activeLanguage={activeLanguage}
            code={editorCode}
            onChange={handleEditorChange}
          />
          <ConsolePanel />
        </section>
      </div>
    </main>
  )
}

export default App
