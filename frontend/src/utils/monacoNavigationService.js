/**
 * Monaco Native Navigation Service
 * Uses Monaco's native language service workers and providers to resolve
 * Go to Definition, Peek Definition, and Find All References.
 */

/**
 * Utility: Convert a character offset in a string to a 1-based lineNumber and columnNumber
 */
export function getPositionFromOffset(content, offset) {
  if (!content || offset <= 0) {
    return { lineNumber: 1, column: 1 }
  }

  const safeOffset = Math.min(offset, content.length)
  const lines = content.slice(0, safeOffset).split('\n')
  const lineNumber = lines.length
  const column = lines[lines.length - 1].length + 1

  return { lineNumber, column }
}

/**
 * Utility: Extract a clean filename from a Monaco URI or file path string
 */
export function cleanFileNameFromUri(uriString) {
  if (!uriString) return ''
  const withoutScheme = uriString
    .replace(/^file:\/\/\//, '')
    .replace(/^file:\/\//, '')
    .replace(/^inmemory:\/\//, '')
    .replace(/^\//, '')
  return withoutScheme.split('/').pop() || withoutScheme
}

/**
 * Utility: Extract a snippet of surrounding lines for a code preview
 */
export function extractCodeExcerpt(content, targetLine, contextRadius = 4) {
  if (!content) return ''
  const lines = content.split('\n')
  const startIdx = Math.max(0, targetLine - 1 - contextRadius)
  const endIdx = Math.min(lines.length, targetLine + contextRadius)

  return lines
    .slice(startIdx, endIdx)
    .map((line, idx) => {
      const lineNum = startIdx + idx + 1
      const isTarget = lineNum === targetLine
      return {
        lineNumber: lineNum,
        text: line,
        isTarget,
      }
    })
}

/**
 * Query Monaco's native language services for the definition of the symbol at the cursor.
 * Returns structured definition locations across current or other workspace files.
 */
export async function findDefinition(monaco, editor, activeFile, files = [], token = { isCancelled: false }) {
  if (!monaco || !editor || !activeFile) {
    return { success: false, reason: 'no-editor' }
  }

  const model = editor.getModel()
  if (!model || model.isDisposed()) {
    return { success: false, reason: 'no-editor' }
  }

  const position = editor.getPosition()
  if (!position) {
    return { success: false, reason: 'no-position' }
  }

  const wordInfo = model.getWordAtPosition(position)
  if (!wordInfo || !wordInfo.word) {
    return { success: false, reason: 'no-symbol' }
  }

  const languageId = model.getLanguageId()
  const uriStr = model.uri.toString()
  const offset = model.getOffsetAt(position)

  try {
    // 1. JavaScript / TypeScript native worker
    if (languageId === 'javascript' || languageId === 'typescript') {
      const workerAccessor =
        languageId === 'javascript'
          ? await monaco.languages.typescript?.getJavaScriptWorker?.()
          : await monaco.languages.typescript?.getTypeScriptWorker?.()

      if (token.isCancelled) return { success: false, reason: 'cancelled' }

      if (typeof workerAccessor === 'function') {
        const client = await workerAccessor(model.uri)
        if (token.isCancelled) return { success: false, reason: 'cancelled' }

        if (client && typeof client.getDefinitionAtPosition === 'function') {
          const rawDefs = await client.getDefinitionAtPosition(uriStr, offset)
          if (token.isCancelled) return { success: false, reason: 'cancelled' }

          if (Array.isArray(rawDefs) && rawDefs.length > 0) {
            const definitions = rawDefs.map((def, idx) => {
              const targetFileName = cleanFileNameFromUri(def.fileName)
              const isSameFile =
                def.fileName === uriStr ||
                targetFileName === activeFile.name

              // Locate target file object and target Monaco model
              const targetFile =
                files.find((f) => f.name === targetFileName) || activeFile

              const targetModel =
                monaco.editor.getModel(monaco.Uri.parse(def.fileName)) ||
                (isSameFile ? model : null)

              let startLine = 1
              let startCol = 1
              let endLine = 1
              let endCol = 1

              if (targetModel && !targetModel.isDisposed()) {
                const sPos = targetModel.getPositionAt(def.textSpan.start)
                const ePos = targetModel.getPositionAt(def.textSpan.start + def.textSpan.length)
                startLine = sPos.lineNumber
                startCol = sPos.column
                endLine = ePos.lineNumber
                endCol = ePos.column
              } else {
                const fileContent = targetFile.code ?? targetFile.content ?? ''
                const sPos = getPositionFromOffset(fileContent, def.textSpan.start)
                const ePos = getPositionFromOffset(fileContent, def.textSpan.start + def.textSpan.length)
                startLine = sPos.lineNumber
                startCol = sPos.column
                endLine = ePos.lineNumber
                endCol = ePos.column
              }

              const targetContent =
                targetModel?.getValue() ??
                targetFile.code ??
                targetFile.content ??
                ''

              const excerpt = extractCodeExcerpt(targetContent, startLine, 4)

              return {
                id: `def_${targetFileName}_${startLine}_${startCol}_${idx}`,
                symbolName: wordInfo.word,
                targetFileName,
                targetFile,
                isSameFile,
                uriString: def.fileName,
                range: {
                  startLineNumber: startLine,
                  startColumn: startCol,
                  endLineNumber: endLine,
                  endColumn: endCol,
                },
                kind: def.kind || 'symbol',
                containerName: def.containerName || '',
                excerpt,
              }
            })

            return {
              success: true,
              symbolName: wordInfo.word,
              definitions,
            }
          }
        }
      }
    }

    // 2. CSS worker definition
    if (languageId === 'css' || languageId === 'less' || languageId === 'scss') {
      const getWorker = monaco.languages.css?.getWorker
      if (typeof getWorker === 'function') {
        const client = await getWorker(model.uri)
        if (token.isCancelled) return { success: false, reason: 'cancelled' }

        if (client && typeof client.findDefinition === 'function') {
          const loc = await client.findDefinition(uriStr, position)
          if (token.isCancelled) return { success: false, reason: 'cancelled' }

          if (loc && loc.range) {
            const startLine = (loc.range.start?.line ?? 0) + 1
            const startCol = (loc.range.start?.character ?? 0) + 1
            const endLine = (loc.range.end?.line ?? startLine - 1) + 1
            const endCol = (loc.range.end?.character ?? startCol - 1) + 1

            const targetFileName = cleanFileNameFromUri(loc.uri || uriStr)
            const isSameFile = targetFileName === activeFile.name
            const targetFile = files.find((f) => f.name === targetFileName) || activeFile
            const targetContent = targetFile.code ?? targetFile.content ?? ''

            return {
              success: true,
              symbolName: wordInfo.word,
              definitions: [
                {
                  id: `def_css_${startLine}_${startCol}`,
                  symbolName: wordInfo.word,
                  targetFileName,
                  targetFile,
                  isSameFile,
                  uriString: loc.uri || uriStr,
                  range: {
                    startLineNumber: startLine,
                    startColumn: startCol,
                    endLineNumber: endLine,
                    endColumn: endCol,
                  },
                  kind: 'property',
                  excerpt: extractCodeExcerpt(targetContent, startLine, 4),
                },
              ],
            }
          }
        }
      }
    }

    return {
      success: false,
      reason: 'not-found',
      symbolName: wordInfo.word,
    }
  } catch (err) {
    return {
      success: false,
      reason: 'error',
      symbolName: wordInfo.word,
      error: err.message || 'Definition query failed',
    }
  }
}

/**
 * Query Monaco's native language services for all references of the symbol at the cursor.
 * Returns structured reference locations across the current or other workspace files.
 */
export async function findReferences(monaco, editor, activeFile, files = [], token = { isCancelled: false }) {
  if (!monaco || !editor || !activeFile) {
    return { success: false, reason: 'no-editor' }
  }

  const model = editor.getModel()
  if (!model || model.isDisposed()) {
    return { success: false, reason: 'no-editor' }
  }

  const position = editor.getPosition()
  if (!position) {
    return { success: false, reason: 'no-position' }
  }

  const wordInfo = model.getWordAtPosition(position)
  if (!wordInfo || !wordInfo.word) {
    return { success: false, reason: 'no-symbol' }
  }

  const languageId = model.getLanguageId()
  const uriStr = model.uri.toString()
  const offset = model.getOffsetAt(position)

  try {
    // 1. JavaScript / TypeScript native worker
    if (languageId === 'javascript' || languageId === 'typescript') {
      const workerAccessor =
        languageId === 'javascript'
          ? await monaco.languages.typescript?.getJavaScriptWorker?.()
          : await monaco.languages.typescript?.getTypeScriptWorker?.()

      if (token.isCancelled) return { success: false, reason: 'cancelled' }

      if (typeof workerAccessor === 'function') {
        const client = await workerAccessor(model.uri)
        if (token.isCancelled) return { success: false, reason: 'cancelled' }

        if (client && typeof client.getReferencesAtPosition === 'function') {
          const rawRefs = await client.getReferencesAtPosition(uriStr, offset)
          if (token.isCancelled) return { success: false, reason: 'cancelled' }

          if (Array.isArray(rawRefs) && rawRefs.length > 0) {
            const references = rawRefs.map((ref, idx) => {
              const targetFileName = cleanFileNameFromUri(ref.fileName)
              const isSameFile =
                ref.fileName === uriStr ||
                targetFileName === activeFile.name

              const targetFile =
                files.find((f) => f.name === targetFileName) || activeFile

              const targetModel =
                monaco.editor.getModel(monaco.Uri.parse(ref.fileName)) ||
                (isSameFile ? model : null)

              let startLine = 1
              let startCol = 1
              let endLine = 1
              let endCol = 1
              let lineText = ''

              if (targetModel && !targetModel.isDisposed()) {
                const sPos = targetModel.getPositionAt(ref.textSpan.start)
                const ePos = targetModel.getPositionAt(ref.textSpan.start + ref.textSpan.length)
                startLine = sPos.lineNumber
                startCol = sPos.column
                endLine = ePos.lineNumber
                endCol = ePos.column
                lineText = targetModel.getLineContent(startLine) || ''
              } else {
                const fileContent = targetFile.code ?? targetFile.content ?? ''
                const sPos = getPositionFromOffset(fileContent, ref.textSpan.start)
                const ePos = getPositionFromOffset(fileContent, ref.textSpan.start + ref.textSpan.length)
                startLine = sPos.lineNumber
                startCol = sPos.column
                endLine = ePos.lineNumber
                endCol = ePos.column
                const lines = fileContent.split('\n')
                lineText = lines[startLine - 1] || ''
              }

              return {
                id: `ref_${targetFileName}_${startLine}_${startCol}_${idx}`,
                symbolName: wordInfo.word,
                targetFileName,
                targetFile,
                isSameFile,
                uriString: ref.fileName,
                lineNumber: startLine,
                columnNumber: startCol,
                endLineNumber: endLine,
                endColumnNumber: endCol,
                lineText: lineText.trim(),
                isWrite: Boolean(ref.isWriteAccess),
                isDefinition: Boolean(ref.isDefinition),
              }
            })

            return {
              success: true,
              symbolName: wordInfo.word,
              references,
            }
          }
        }
      }
    }

    return {
      success: false,
      reason: 'not-found',
      symbolName: wordInfo.word,
    }
  } catch (err) {
    return {
      success: false,
      reason: 'error',
      symbolName: wordInfo.word,
      error: err.message || 'Reference query failed',
    }
  }
}
