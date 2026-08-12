function Header() {
  return (
    <header className="app-header">
      <div>
        <p className="app-header__eyebrow">PolyglotMesh</p>
        <h1 className="app-header__title">Polyglot Runtime Sandbox</h1>
      </div>

      <div className="status-chip status-chip--header" aria-label="Runtime status">
        <span className="status-dot" aria-hidden="true" />
        Local Runtime
      </div>
    </header>
  )
}

export default Header