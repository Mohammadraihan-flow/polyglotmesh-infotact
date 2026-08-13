function EditorTabs({ files, activeFileName, onSelectFile }) {
  return (
    <div className="editor-tabs" role="tablist" aria-label="Editor file tabs">
      {files.map((file) => {
        const isActive = file.name === activeFileName

        return (
          <button
            key={file.name}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`editor-tabs__tab${isActive ? ' editor-tabs__tab--active' : ''}`}
            onClick={() => onSelectFile(file.name)}
          >
            {file.name}
          </button>
        )
      })}
    </div>
  )
}

export default EditorTabs