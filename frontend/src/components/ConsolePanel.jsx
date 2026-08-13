function ConsolePanel({ message, isRunning }) {
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
          <span className={`status-dot${isRunning ? '' : ' status-dot--ready'}`} aria-hidden="true" />
          {isRunning ? 'Running' : 'Ready'}
        </div>
      </div>

      <div className="console-panel__output" role="status" aria-live="polite">
        <p className="console-panel__message">{message}</p>
        <p className="console-panel__hint">The current run state is simulated in the frontend only.</p>
      </div>
    </section>
  )
}

export default ConsolePanel