/**
 * Central utility for detecting Monaco editor language, labels,
 * and starter templates from filenames and extensions.
 */

const EXTENSION_MAP = {
  js: {
    monacoLanguage: 'javascript',
    label: 'JavaScript',
    starterCode: 'console.log("Hello from JavaScript");\n',
  },
  py: {
    monacoLanguage: 'python',
    label: 'Python',
    starterCode: 'print("Hello from Python");\n',
  },
  java: {
    monacoLanguage: 'java',
    label: 'Java',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java");\n    }\n}\n',
  },
  c: {
    monacoLanguage: 'c',
    label: 'C',
    starterCode:
      '#include <stdio.h>\n\nint main() {\n    printf("Hello from C");\n    return 0;\n}\n',
  },
  cpp: {
    monacoLanguage: 'cpp',
    label: 'C++',
    starterCode:
      '#include <iostream>\n\nint main() {\n    std::cout << "Hello from C++";\n    return 0;\n}\n',
  },
  h: {
    monacoLanguage: 'cpp',
    label: 'C/C++ Header',
    starterCode:
      '#ifndef POLYGLOTMESH_H\n#define POLYGLOTMESH_H\n\nvoid hello();\n\n#endif\n',
  },
  json: {
    monacoLanguage: 'json',
    label: 'JSON',
    starterCode: '{\n  "name": "PolyglotMesh"\n}\n',
  },
  html: {
    monacoLanguage: 'html',
    label: 'HTML',
    starterCode:
      '<!DOCTYPE html>\n<html>\n<head>\n    <title>PolyglotMesh</title>\n</head>\n<body>\n    <h1>PolyglotMesh</h1>\n</body>\n</html>\n',
  },
  css: {
    monacoLanguage: 'css',
    label: 'CSS',
    starterCode:
      'body {\n    font-family: sans-serif;\n}\n',
  },
}

const FALLBACK_CONFIG = {
  monacoLanguage: 'plaintext',
  label: 'Plain Text',
  starterCode: '',
}

/**
 * Extracts the file extension from a filename in a case-insensitive manner,
 * trimming leading/trailing whitespace.
 *
 * @param {string} fileName
 * @returns {string} Lowercase extension without dot, or empty string.
 */
export function getExtension(fileName) {
  if (!fileName || typeof fileName !== 'string') return ''
  const trimmedName = fileName.trim()
  const dotIndex = trimmedName.lastIndexOf('.')

  if (dotIndex <= 0 || dotIndex === trimmedName.length - 1) {
    return ''
  }

  return trimmedName.slice(dotIndex + 1).toLowerCase()
}

/**
 * Returns the Monaco language identifier for a given filename.
 * Case-insensitive, handles whitespace and unsupported extensions gracefully with 'plaintext' fallback.
 *
 * @param {string} fileName
 * @returns {string} Monaco language identifier (e.g. 'javascript', 'python', 'cpp', 'plaintext')
 */
export function getMonacoLanguageFromFileName(fileName) {
  const ext = getExtension(fileName)
  return EXTENSION_MAP[ext]?.monacoLanguage ?? FALLBACK_CONFIG.monacoLanguage
}

/**
 * Returns the human-readable language label for a given filename.
 *
 * @param {string} fileName
 * @returns {string} Display label (e.g. 'JavaScript', 'Python', 'C/C++ Header', 'Plain Text')
 */
export function getLanguageLabelFromFileName(fileName) {
  const ext = getExtension(fileName)
  return EXTENSION_MAP[ext]?.label ?? FALLBACK_CONFIG.label
}

/**
 * Returns starter code template for a newly created file based on filename.
 *
 * @param {string} fileName
 * @returns {string} Starter code
 */
export function getStarterCodeFromFileName(fileName) {
  const ext = getExtension(fileName)
  return EXTENSION_MAP[ext]?.starterCode ?? FALLBACK_CONFIG.starterCode
}

/**
 * Mapping of UI language names to file extensions.
 */
export const LANGUAGE_TO_EXTENSION_MAP = {
  JavaScript: '.js',
  Python: '.py',
  Java: '.java',
  C: '.c',
  'C++': '.cpp',
  'C/C++ Header': '.h',
  Header: '.h',
  JSON: '.json',
  HTML: '.html',
  CSS: '.css',
}
