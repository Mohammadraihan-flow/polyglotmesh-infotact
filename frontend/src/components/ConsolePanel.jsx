function ConsolePanel() {
  return (
    <section className="console-panel" aria-labelledby="console-panel-title">
      <div className="panel-heading panel-heading--console">
        <div>
          <p className="panel-heading__eyebrow">Console Output</p>
          <h2 id="console-panel-title" className="panel-heading__title">
            Execution log
          </h2>
        </div>

        <div className="status-chip" aria-label="Console status">
          <span className="status-dot status-dot--ready" aria-hidden="true" />
          Ready
        </div>
      </div>

      <div className="console-panel__empty">Execution output will appear here.</div>
    </section>
  )
}

export default ConsolePanel