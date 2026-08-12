function EditorPanel({ activeLanguage }) {
  return (
    <section className="editor-panel" aria-labelledby="editor-panel-title">
      <div className="panel-heading">
        <div>
          <p className="panel-heading__eyebrow">Editor</p>
          <h2 id="editor-panel-title" className="panel-heading__title">
            {activeLanguage} workspace
          </h2>
        </div>

        <button type="button" className="run-button" disabled>
          Run
        </button>
      </div>

      <div className="editor-placeholder" role="status" aria-live="polite">
        <p className="editor-placeholder__language">{activeLanguage}</p>
        <p className="editor-placeholder__message">
          Monaco Editor will be integrated in a later commit.
        </p>
        <p className="editor-placeholder__hint">
          This area is reserved for the code editor surface and future run controls.
        </p>
      </div>
    </section>
  )
}

export default EditorPanel