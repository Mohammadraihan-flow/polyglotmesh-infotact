import React from 'react'
import { getExtension, getLanguageLabelFromFileName } from '../utils/languageUtils.js'
import FileIcon from './FileIcon.jsx'

function EditorBreadcrumb({ activeFile }) {
  if (!activeFile) return null

  const fileName = activeFile.name ?? ''
  const languageLabel = activeFile.label || getLanguageLabelFromFileName(fileName)
  const extension = getExtension(fileName)

  const normalizedPath = fileName.replace(/\\/g, '/')
  const pathSegments = normalizedPath.split('/').filter(Boolean)

  const folderSegments = pathSegments.length > 1 ? pathSegments.slice(0, -1) : []
  const actualFileName = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : fileName

  return (
    <nav className="editor-breadcrumb" aria-label="Editor breadcrumb">
      <ol className="editor-breadcrumb__list">
        <li className="editor-breadcrumb__item editor-breadcrumb__item--root">
          <span className="editor-breadcrumb__icon-root" aria-hidden="true">📂</span>
          <span className="editor-breadcrumb__text">Files</span>
        </li>

        {folderSegments.map((folder, index) => (
          <React.Fragment key={`folder-${index}-${folder}`}>
            <li className="editor-breadcrumb__separator" aria-hidden="true">›</li>
            <li className="editor-breadcrumb__item editor-breadcrumb__item--folder">
              <span className="editor-breadcrumb__text">{folder}</span>
            </li>
          </React.Fragment>
        ))}

        <li className="editor-breadcrumb__separator" aria-hidden="true">›</li>
        <li className="editor-breadcrumb__item editor-breadcrumb__item--language">
          <span className="editor-breadcrumb__text">{languageLabel}</span>
        </li>

        <li className="editor-breadcrumb__separator" aria-hidden="true">›</li>
        <li className="editor-breadcrumb__item editor-breadcrumb__item--active">
          <span className="editor-breadcrumb__file-icon" aria-hidden="true">
            <FileIcon extension={extension} size={14} />
          </span>

          <span className="editor-breadcrumb__text editor-breadcrumb__text--filename" title={actualFileName}>
            {actualFileName}
          </span>
        </li>
      </ol>
    </nav>
  )
}

export default EditorBreadcrumb
