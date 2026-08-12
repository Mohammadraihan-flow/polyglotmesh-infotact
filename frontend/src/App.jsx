import './App.css'

function App() {
  return (
    <main className="app-shell">
      <section className="hero-panel" aria-labelledby="app-title">
        <p className="eyebrow">PolyglotMesh</p>
        <h1 id="app-title">React frontend foundation for the sandbox</h1>
        <p className="intro">
          A lightweight browser IDE shell for the future Monaco-based workflow.
        </p>

        <div className="status-row" aria-label="Project status">
          <span className="status-pill status-pill--active">Frontend ready</span>
          <span className="status-pill">React + Vite</span>
          <span className="status-pill">Monaco later</span>
        </div>
      </section>

      <section className="overview-grid" aria-label="Workspace overview">
        <article className="card">
          <h2>What this commit delivers</h2>
          <p>
            A clean, branded entry screen that confirms the app is running and
            leaves room for editor and runtime features later.
          </p>
        </article>

        <article className="card">
          <h2>Planned next layers</h2>
          <p>
            Editor surface, language tabs, run controls, and backend integration
            will be added in later commits.
          </p>
        </article>
      </section>
    </main>
  )
}

export default App
