import {
  getLanguageLabelFromFileName,
  getMonacoLanguageFromFileName,
} from './languageUtils.js'

export const SESSION_STORAGE_KEY = 'polyglotmesh-editor-session'
export const CURRENT_SESSION_VERSION = 1
export const LEGACY_WORKSPACE_KEY = 'polyglotmesh-workspace'
export const LEGACY_SPLIT_RATIO_KEY = 'polyglotmesh-editor-split-ratio'

export const DEFAULT_FRESH_SESSION = {
  files: [],
  openFileNames: [],
  activeFileName: null,
  recentFileNames: [],
  isSplit: false,
  secondaryFileName: null,
  splitRatio: 0.5,
  readOnlyFileNames: [],
  activePane: 'primary',
}

/**
 * Validates and clamps split ratio between 0.2 and 0.8
 */
export function validateSplitRatio(val, fallback = 0.5) {
  const num = typeof val === 'number' ? val : parseFloat(val)
  if (typeof num === 'number' && !isNaN(num) && isFinite(num) && num >= 0.2 && num <= 0.8) {
    return Math.round(num * 1000) / 1000
  }
  return fallback
}

/**
 * Sanitizes and validates a raw session object against corrupted data
 * @param {any} rawData
 * @returns {{ isValid: boolean, session: typeof DEFAULT_FRESH_SESSION }}
 */
export function sanitizeSessionData(rawData) {
  if (!rawData || typeof rawData !== 'object') {
    return { isValid: false, session: { ...DEFAULT_FRESH_SESSION } }
  }

  // Handle versioned payload envelope vs legacy direct session payload
  const sessionSource =
    rawData.version && rawData.session && typeof rawData.session === 'object'
      ? rawData.session
      : rawData

  if (!Array.isArray(sessionSource.files)) {
    return { isValid: false, session: { ...DEFAULT_FRESH_SESSION } }
  }

  try {
    // 1. Sanitize file list
    const validFiles = sessionSource.files
      .filter((file) => file && typeof file.name === 'string' && file.name.trim().length > 0)
      .map((file) => {
        const monacoLanguage = file.monacoLanguage ?? getMonacoLanguageFromFileName(file.name)
        const label = file.label ?? getLanguageLabelFromFileName(file.name)
        const content =
          typeof file.code === 'string'
            ? file.code
            : typeof file.content === 'string'
            ? file.content
            : ''

        return {
          id: file.id ?? file.name,
          name: file.name,
          label,
          language: monacoLanguage,
          monacoLanguage,
          code: content,
          content,
          isDirty: false, // Restored files start clean
        }
      })

    const validNamesSet = new Set(validFiles.map((f) => f.name))

    // 2. Sanitize open file tabs
    const validOpenNames = Array.isArray(sessionSource.openFileNames)
      ? sessionSource.openFileNames.filter((name) => typeof name === 'string' && validNamesSet.has(name))
      : []

    // 3. Sanitize active file
    let validActiveName = null
    if (typeof sessionSource.activeFileName === 'string' && validNamesSet.has(sessionSource.activeFileName)) {
      validActiveName = sessionSource.activeFileName
    } else if (validOpenNames.length > 0) {
      validActiveName = validOpenNames[0]
    } else if (validFiles.length > 0) {
      validActiveName = validFiles[0].name
    }

    if (validActiveName && !validOpenNames.includes(validActiveName)) {
      validOpenNames.push(validActiveName)
    }

    // 4. Sanitize recent files
    const validRecentNames = Array.isArray(sessionSource.recentFileNames)
      ? sessionSource.recentFileNames.filter((name) => typeof name === 'string' && validNamesSet.has(name)).slice(0, 5)
      : []

    // 5. Sanitize split editor settings
    const isSplitRaw = Boolean(
      sessionSource.isSplit ?? sessionSource.split?.isSplit,
    )
    let validSecondaryName = null
    const secondaryCandidate =
      sessionSource.secondaryFileName ?? sessionSource.split?.secondaryFileName

    if (
      typeof secondaryCandidate === 'string' &&
      validNamesSet.has(secondaryCandidate) &&
      secondaryCandidate !== validActiveName
    ) {
      validSecondaryName = secondaryCandidate
    }

    const rawRatio = sessionSource.splitRatio ?? sessionSource.split?.splitRatio
    const validSplitRatio = validateSplitRatio(rawRatio, 0.5)

    const rawActivePane = sessionSource.activePane ?? sessionSource.split?.activePane
    const validActivePane = rawActivePane === 'secondary' ? 'secondary' : 'primary'

    // 6. Sanitize read-only / preview mode flags
    const rawReadOnly = sessionSource.readOnlyFileNames ?? []
    const validReadOnlyNames = Array.isArray(rawReadOnly)
      ? rawReadOnly.filter((name) => typeof name === 'string' && validNamesSet.has(name))
      : []

    return {
      isValid: true,
      session: {
        files: validFiles,
        openFileNames: validOpenNames,
        activeFileName: validActiveName,
        recentFileNames: validRecentNames,
        isSplit: isSplitRaw && Boolean(validSecondaryName),
        secondaryFileName: validSecondaryName,
        splitRatio: validSplitRatio,
        readOnlyFileNames: validReadOnlyNames,
        activePane: validActivePane,
      },
    }
  } catch (err) {
    console.warn('PolyglotMesh: Error sanitizing session data. Falling back to default.', err)
    return { isValid: false, session: { ...DEFAULT_FRESH_SESSION } }
  }
}

/**
 * Loads the editor session from localStorage.
 * Handles migration from legacy keys and gracefully falls back on corruption.
 * @returns {{ isRestored: boolean, session: typeof DEFAULT_FRESH_SESSION }}
 */
export function loadEditorSession() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { isRestored: false, session: { ...DEFAULT_FRESH_SESSION } }
  }

  // 1. Try versioned session key first
  try {
    const rawSession = localStorage.getItem(SESSION_STORAGE_KEY)
    if (rawSession) {
      const parsed = JSON.parse(rawSession)
      const sanitized = sanitizeSessionData(parsed)
      if (sanitized.isValid) {
        return {
          isRestored: sanitized.session.files.length > 0,
          session: sanitized.session,
        }
      }
    }
  } catch (err) {
    console.warn('PolyglotMesh: Corrupted session storage detected. Attempting recovery.', err)
  }

  // 2. Fallback to legacy workspace storage key
  try {
    const legacyRaw = localStorage.getItem(LEGACY_WORKSPACE_KEY)
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw)
      const sanitized = sanitizeSessionData(legacyParsed)
      if (sanitized.isValid) {
        // Also check legacy split ratio if stored separately
        const storedSplitRatio = localStorage.getItem(LEGACY_SPLIT_RATIO_KEY)
        if (storedSplitRatio) {
          sanitized.session.splitRatio = validateSplitRatio(parseFloat(storedSplitRatio), sanitized.session.splitRatio)
        }

        // Migrate to versioned key
        saveEditorSession(sanitized.session)
        return {
          isRestored: sanitized.session.files.length > 0,
          session: sanitized.session,
        }
      }
    }
  } catch (err) {
    console.warn('PolyglotMesh: Corrupted legacy workspace storage detected.', err)
  }

  return { isRestored: false, session: { ...DEFAULT_FRESH_SESSION } }
}

/**
 * Saves editor session to localStorage with versioned schema envelope.
 * Also synchronizes legacy keys for backward compatibility.
 * @param {object} session
 */
export function saveEditorSession(session) {
  if (typeof window === 'undefined' || !window.localStorage || !session) return

  try {
    const validRatio = validateSplitRatio(session.splitRatio, 0.5)

    const payload = {
      files: (session.files || []).map((file) => ({
        id: file.id ?? file.name,
        name: file.name,
        label: file.label,
        language: file.language ?? file.monacoLanguage,
        monacoLanguage: file.monacoLanguage ?? file.language,
        code: file.code ?? file.content ?? '',
        content: file.content ?? file.code ?? '',
      })),
      openFileNames: session.openFileNames ?? [],
      activeFileName: session.activeFileName ?? null,
      recentFileNames: session.recentFileNames ?? [],
      isSplit: Boolean(session.isSplit),
      secondaryFileName: session.secondaryFileName ?? null,
      splitRatio: validRatio,
      readOnlyFileNames: Array.isArray(session.readOnlyFileNames) ? session.readOnlyFileNames : [],
      activePane: session.activePane === 'secondary' ? 'secondary' : 'primary',
    }

    const versionedEnvelope = {
      version: CURRENT_SESSION_VERSION,
      schema: 'polyglotmesh:editor-session',
      timestamp: Date.now(),
      session: payload,
    }

    // Save to versioned key
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(versionedEnvelope))

    // Synchronize legacy keys for total backward compatibility
    localStorage.setItem(LEGACY_WORKSPACE_KEY, JSON.stringify(payload))
    localStorage.setItem(LEGACY_SPLIT_RATIO_KEY, String(validRatio))
  } catch (err) {
    console.warn('PolyglotMesh: Unable to persist editor session to localStorage.', err)
  }
}

/**
 * Clears saved editor session storage without deleting unrelated settings (theme, font size, etc.)
 */
export function clearEditorSession() {
  if (typeof window === 'undefined' || !window.localStorage) return

  try {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    localStorage.removeItem(LEGACY_WORKSPACE_KEY)
    localStorage.removeItem(LEGACY_SPLIT_RATIO_KEY)
  } catch (err) {
    console.warn('PolyglotMesh: Unable to clear editor session from localStorage.', err)
  }
}
