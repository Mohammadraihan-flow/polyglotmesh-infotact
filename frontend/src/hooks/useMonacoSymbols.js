import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchDocumentSymbols } from '../utils/monacoSymbolService.js'

/**
 * Custom hook to extract and manage document symbols from Monaco's native language workers.
 * Features:
 * - Debounced refreshes on source code edits (400ms)
 * - Immediate refresh on file / model switches
 * - Request cancellation token to avoid stale out-of-order responses
 * - Automatic cleanup of subscriptions and timers on unmount
 */
export function useMonacoSymbols(activeFile, monacoInstance, editorInstance) {
  const [symbols, setSymbols] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasProvider, setHasProvider] = useState(true)
  const [error, setError] = useState(null)

  const debounceTimerRef = useRef(null)
  const cancellationTokenRef = useRef({ isCancelled: false })
  const activeUriRef = useRef(null)

  const loadSymbols = useCallback(
    async (isDebounced = false) => {
      const monaco = monacoInstance || (typeof window !== 'undefined' ? window.monaco : null)
      const editor = editorInstance || (monaco?.editor?.getEditors ? monaco.editor.getEditors()[0] : null)

      if (!activeFile) {
        setSymbols([])
        setIsLoading(false)
        setHasProvider(true)
        setError(null)
        return
      }

      if (!monaco || !editor) {
        return
      }

      const model = editor.getModel()
      if (!model || model.isDisposed()) {
        setSymbols([])
        setIsLoading(false)
        return
      }

      // Cancel previous in-flight request
      if (cancellationTokenRef.current) {
        cancellationTokenRef.current.isCancelled = true
      }
      const token = { isCancelled: false }
      cancellationTokenRef.current = token

      if (!isDebounced) {
        setIsLoading(true)
      }
      setError(null)

      try {
        const result = await fetchDocumentSymbols(monaco, model, token)
        if (token.isCancelled) return

        setSymbols(result.symbols || [])
        setHasProvider(Boolean(result.hasProvider))
        setIsLoading(false)
      } catch (err) {
        if (!token.isCancelled) {
          setError(err.message || 'Failed to retrieve symbols')
          setSymbols([])
          setIsLoading(false)
        }
      }
    },
    [activeFile, monacoInstance, editorInstance],
  )

  // Refresh immediately when activeFile changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    // Small delay to allow Monaco to attach the new model
    const timer = setTimeout(() => {
      loadSymbols(false)
    }, 50)

    return () => {
      clearTimeout(timer)
      if (cancellationTokenRef.current) {
        cancellationTokenRef.current.isCancelled = true
      }
    }
  }, [activeFile?.id, activeFile?.name, loadSymbols])

  // Listen to model changes and content changes on the editor
  useEffect(() => {
    const monaco = monacoInstance || (typeof window !== 'undefined' ? window.monaco : null)
    const editor = editorInstance || (monaco?.editor?.getEditors ? monaco.editor.getEditors()[0] : null)
    if (!editor) return

    let contentDisposable = null

    const attachModelListeners = () => {
      if (contentDisposable) {
        contentDisposable.dispose()
        contentDisposable = null
      }

      const model = editor.getModel()
      if (!model || model.isDisposed()) return

      activeUriRef.current = model.uri.toString()

      // Debounced updates on typing/content change (400ms)
      contentDisposable = model.onDidChangeContent(() => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }
        debounceTimerRef.current = setTimeout(() => {
          loadSymbols(true)
        }, 400)
      })
    }

    attachModelListeners()

    // Listen to model switches
    const modelChangeDisposable = editor.onDidChangeModel(() => {
      attachModelListeners()
      loadSymbols(false)
    })

    return () => {
      if (contentDisposable) {
        contentDisposable.dispose()
      }
      modelChangeDisposable.dispose()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [editorInstance, monacoInstance, loadSymbols])

  const manualRefresh = useCallback(() => {
    loadSymbols(false)
  }, [loadSymbols])

  return {
    symbols,
    isLoading,
    hasProvider,
    error,
    refresh: manualRefresh,
  }
}
