import React from 'react'

class AppErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('PolyglotMesh application rendering error:', error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <main className="app-recovery" role="alert" aria-labelledby="app-recovery-title">
        <div className="app-recovery__content">
          <span className="app-recovery__icon" aria-hidden="true">!</span>
          <p className="app-recovery__eyebrow">PolyglotMesh</p>
          <h1 id="app-recovery-title" className="app-recovery__title">
            The workspace needs a fresh start
          </h1>
          <p className="app-recovery__message">
            The editor could not finish rendering this view. Your saved workspace is not affected.
          </p>
          <div className="app-recovery__actions">
            <button type="button" className="app-recovery__primary" onClick={this.handleRetry}>
              Try Again
            </button>
            <button type="button" className="app-recovery__secondary" onClick={this.handleReload}>
              Reload Application
            </button>
          </div>
        </div>
      </main>
    )
  }
}

export default AppErrorBoundary
