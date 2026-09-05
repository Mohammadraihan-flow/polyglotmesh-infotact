import React, { useEffect, useRef } from 'react'

function PeekDefinitionWidget({
  definition,
  onGoToDefinition,
  onClose,
}) {
  const containerRef = useRef(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [onClose])

  if (!definition) return null

  const {
    symbolName,
    targetFileName,
    range,
    excerpt = [],
  } = definition

  const startLine = range?.startLineNumber || 1
  const startCol = range?.startColumn || 1

  return (
    <div
      ref={containerRef}
      className="peek-definition-card"
      role="dialog"
      aria-label={`Peek Definition for ${symbolName}`}
      aria-modal="false"
    >
      <div className="peek-definition-card__header">
        <div className="peek-definition-card__title-row">
          <span className="peek-definition-card__icon" aria-hidden="true">
            🔎
          </span>
          <span className="peek-definition-card__title">
            Peek Definition: <strong>{symbolName}</strong>
          </span>
          <span className="peek-definition-card__file-badge" title={`File: ${targetFileName}`}>
            📄 {targetFileName}
          </span>
          <span className="peek-definition-card__loc-badge">
            Ln {startLine}, Col {startCol}
          </span>
        </div>

        <div className="peek-definition-card__actions">
          <button
            type="button"
            className="peek-definition-card__goto-btn"
            onClick={() => onGoToDefinition?.(definition)}
            title="Jump directly to definition in editor"
          >
            Go to Definition ↗
          </button>
          <button
            type="button"
            className="peek-definition-card__close-btn"
            onClick={onClose}
            title="Close Peek (Esc)"
            aria-label="Close peek preview"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="peek-definition-card__content">
        <div className="peek-definition-card__code-view" tabIndex={0} aria-label="Code preview">
          {excerpt.map((lineItem) => (
            <div
              key={lineItem.lineNumber}
              className={`peek-code-line${lineItem.isTarget ? ' peek-code-line--target' : ''}`}
            >
              <span className="peek-code-line__num">{lineItem.lineNumber}</span>
              <span className="peek-code-line__text">{lineItem.text || ' '}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="peek-definition-card__footer">
        <span className="peek-definition-card__hint">
          Previewing without moving cursor. Press <kbd>Esc</kbd> or <strong>✕</strong> to dismiss.
        </span>
      </div>
    </div>
  )
}

export default React.memo(PeekDefinitionWidget)
