import { useState } from 'react'
import ConsolePanel from './components/ConsolePanel.jsx'
import EditorPanel from './components/EditorPanel.jsx'
import Header from './components/Header.jsx'
import LanguageTabs from './components/LanguageTabs.jsx'
import Sidebar from './components/Sidebar.jsx'
import './App.css'

const languages = ['JavaScript', 'Python', 'Java', 'C', 'C++']

function App() {
  const [activeLanguage, setActiveLanguage] = useState(languages[0])

  const handleSelectLanguage = (language) => {
    setActiveLanguage(language)
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
            key={activeLanguage}
            activeLanguage={activeLanguage}
          />
          <ConsolePanel />
        </section>
      </div>
    </main>
  )
}

export default App
