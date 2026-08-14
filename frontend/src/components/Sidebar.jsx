import FileExplorer from './FileExplorer.jsx'

const navItems = ['Workspace', 'Scripts', 'Settings']

function Sidebar({ files, activeFileName, onSelectFile, onRenameFile, onToggleSettings }) {
  return (
    <aside className="sidebar" aria-label="Workspace navigation">
      <div className="sidebar__section">
        <p className="sidebar__eyebrow">Project</p>
        <h2 className="sidebar__title">Polyglot Workspace</h2>
        <p className="sidebar__description">
          Organize sandbox assets, scripts, and local IDE settings.
        </p>
      </div>

      <FileExplorer
        files={files}
        activeFileName={activeFileName}
        onSelectFile={onSelectFile}
        onRenameFile={onRenameFile}
      />

      <nav className="sidebar__nav" aria-label="Primary workspace navigation">
        {navItems.map((item, index) => (
          <button
            key={item}
            type="button"
            className={`sidebar__item${index === 0 ? ' sidebar__item--active' : ''}`}
            onClick={item === 'Settings' ? () => onToggleSettings && onToggleSettings() : undefined}
          >
            <span className="sidebar__bullet" aria-hidden="true">
              {index + 1}
            </span>
            <span>{item}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar