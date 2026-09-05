import { useEffect, useRef, useState } from 'react'

/**
 * Custom hook to monitor and synchronize Monaco Editor diagnostics/markers.
 * Listens to monaco.editor.onDidChangeMarkers and extracts markers for open files.
 *
 * @param {Array} openFiles - List of currently open file objects in the editor
 * @param {Array} files - Complete list of files in the workspace
 * @returns {Array} Array of formatted problem diagnostic objects
 */
export function useMonacoMarkers(openFiles = [], files = []) {
  const [problems, setProblems] = useState([])
  const lastFingerprintRef = useRef('')

  useEffect(() => {
    let isMounted = true
    let disposable = null

    const computeProblems = () => {
      if (typeof window === 'undefined' || !window.monaco?.editor) return

      try {
        const rawMarkers = window.monaco.editor.getModelMarkers({}) || []
        const openFileNames = new Set(openFiles.map((f) => f.name))

        const mapped = rawMarkers
          .map((marker) => {
            const path =
              marker.resource?.path ||
              marker.resource?.fsPath ||
              marker.resource?.toString() ||
              ''
            const cleanPath = path.replace(/^[/\\]+/, '')
            const lastSegment = cleanPath.split(/[/\\]/).pop() || ''
            const matchedFile = files.find(
              (f) =>
                f.name === lastSegment ||
                cleanPath.endsWith(f.name) ||
                path.endsWith(f.name)
            )
            const fileName = matchedFile ? matchedFile.name : lastSegment || 'Unknown'

            let severityLabel = 'Hint'
            if (marker.severity === 8) {
              severityLabel = 'Error'
            } else if (marker.severity === 4) {
              severityLabel = 'Warning'
            } else if (marker.severity === 2) {
              severityLabel = 'Info'
            }

            return {
              id: `${marker.resource?.toString()}-${marker.startLineNumber}-${marker.startColumn}-${marker.severity}-${marker.message}`,
              severityCode: marker.severity,
              severityLabel,
              message: marker.message,
              fileName,
              lineNumber: marker.startLineNumber,
              columnNumber: marker.startColumn,
              endLineNumber: marker.endLineNumber,
              endColumn: marker.endColumn,
              source: marker.source || marker.owner,
              rawMarker: marker,
            }
          })
          .filter((problem) => {
            // Keep problems belonging to open files in the editor
            return openFileNames.has(problem.fileName)
          })
          .sort((a, b) => {
            // Sort: Errors (8) -> Warnings (4) -> Info (2) -> Hints (1)
            if (b.severityCode !== a.severityCode) {
              return b.severityCode - a.severityCode
            }
            if (a.fileName !== b.fileName) {
              return a.fileName.localeCompare(b.fileName)
            }
            if (a.lineNumber !== b.lineNumber) {
              return a.lineNumber - b.lineNumber
            }
            return a.columnNumber - b.columnNumber
          })

        const fingerprint = mapped
          .map(
            (p) =>
              `${p.fileName}:${p.lineNumber}:${p.columnNumber}:${p.severityCode}:${p.message}`
          )
          .join(';;')

        if (fingerprint !== lastFingerprintRef.current) {
          lastFingerprintRef.current = fingerprint
          if (isMounted) {
            setProblems(mapped)
          }
        }
      } catch (err) {
        console.warn('PolyglotMesh: Error retrieving Monaco markers', err)
      }
    }

    // Initial check
    computeProblems()

    // Subscribe to Monaco's native markers change event
    if (window.monaco?.editor?.onDidChangeMarkers) {
      disposable = window.monaco.editor.onDidChangeMarkers(() => {
        computeProblems()
      })
    }

    // Fallback interval to ensure markers are captured when Monaco finishes initializing
    const interval = setInterval(() => {
      if (!disposable && window.monaco?.editor?.onDidChangeMarkers) {
        disposable = window.monaco.editor.onDidChangeMarkers(() => {
          computeProblems()
        })
      }
      computeProblems()
    }, 600)

    return () => {
      isMounted = false
      if (disposable && typeof disposable.dispose === 'function') {
        disposable.dispose()
      }
      clearInterval(interval)
    }
  }, [openFiles, files])

  return problems
}
