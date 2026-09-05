import { useEffect, useRef, useState } from 'react'

function getActiveMonacoEditor() {
  if (typeof window === 'undefined' || !window.monaco) return null
  const editors = window.monaco.editor.getEditors()
  if (!editors || editors.length === 0) return null
  const focused = editors.find((ed) => typeof ed.hasTextFocus === 'function' && ed.hasTextFocus())
  if (focused) return focused
  if (window.__polyglotmeshActiveEditor && editors.includes(window.__polyglotmeshActiveEditor)) {
    return window.__polyglotmeshActiveEditor
  }
  return editors[0]
}

function CommandPalette({
  isOpen,
  onClose,
  onRun,
  onSave,
  onOpenSettings,
  isSplit = false,
  onToggleSplit,
  onResetLayout,
}) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  const commands = [
    {
      id: 'run',
      label: 'Run',
      description: 'Execute current program in frontend',
      shortcut: 'Ctrl+Enter',
      action: onRun,
    },
    {
      id: 'save',
      label: 'Save',
      description: 'Save current editor content',
      shortcut: 'Ctrl+S',
      action: onSave,
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Open editor settings panel',
      shortcut: 'Settings',
      action: onOpenSettings,
    },
    {
      id: 'view-split-editor',
      label: 'View: Toggle Split Editor',
      description: 'Toggle side-by-side split editor layout',
      shortcut: 'Ctrl+\\',
      action: () => {
        if (onToggleSplit) {
          onToggleSplit()
        } else if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('polyglotmesh:toggle-split'))
        }
      },
    },
    {
      id: 'view-split-editor-right',
      label: 'View: Split Editor Right',
      description: 'Open a side-by-side secondary editor pane',
      shortcut: 'Split',
      action: () => {
        if (!isSplit && onToggleSplit) {
          onToggleSplit()
        } else if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('polyglotmesh:open-split'))
        }
      },
    },
    {
      id: 'view-close-split-editor',
      label: 'View: Close Split Editor',
      description: 'Close secondary editor pane and return to single layout',
      shortcut: 'Close Split',
      action: () => {
        if (isSplit && onToggleSplit) {
          onToggleSplit()
        } else if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('polyglotmesh:close-split'))
        }
      },
    },
    {
      id: 'view-reset-editor-layout',
      label: 'View: Reset Editor Layout',
      description: 'Reset editor split ratio to default 50/50',
      shortcut: 'Reset Layout',
      action: () => {
        if (onResetLayout) {
          onResetLayout()
        } else if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('polyglotmesh:reset-editor-layout'))
        }
      },
    },
    {
      id: 'format-document',
      label: 'Format Document',
      description: 'Format the entire active document',
      shortcut: 'Shift+Alt+F / Ctrl+Shift+I',
      action: () => {
        const activeEditor = getActiveMonacoEditor()
        if (activeEditor) {
          activeEditor.focus()
          activeEditor.getAction('editor.action.formatDocument')?.run()
        }
      },
    },
    {
      id: 'format-selection',
      label: 'Format Selection',
      description: 'Format selected text in active document',
      shortcut: 'Ctrl+K Ctrl+F',
      action: () => {
        const activeEditor = getActiveMonacoEditor()
        if (activeEditor) {
          activeEditor.focus()
          const selection = activeEditor.getSelection()
          if (selection && !selection.isEmpty()) {
            activeEditor.getAction('editor.action.formatSelection')?.run()
          }
        }
      },
    },
    {
      id: 'quick-fix',
      label: 'Quick Fix / Code Actions',
      description: 'Show code actions and quick fixes at cursor',
      shortcut: 'Ctrl+.',
      action: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('polyglotmesh:quick-fix'))
          const activeEditor = getActiveMonacoEditor()
          if (activeEditor) {
            activeEditor.focus()
            const action = activeEditor.getAction('editor.action.quickFix')
            if (action) {
              action.run()
            } else {
              activeEditor.trigger('commandPalette', 'editor.action.quickFix')
            }
          }
        }
      },
    },
    {
      id: 'gotoline',
      label: 'Go to Line',
      description: 'Jump to a specific line and column',
      shortcut: 'Ctrl+G',
      action: () => {
        const activeEditor = getActiveMonacoEditor()
        if (activeEditor) {
          activeEditor.focus()
          activeEditor.getAction('editor.action.gotoLine')?.run()
        }
      },
    },
    {
      id: 'goto-definition',
      label: 'Go to Definition',
      description: 'Navigate to definition of symbol at cursor',
      shortcut: 'F12',
      action: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('polyglotmesh:goto-definition'))
        }
      },
    },
    {
      id: 'peek-definition',
      label: 'Peek Definition',
      description: 'Inspect definition in an inline preview',
      shortcut: 'Alt+F12',
      action: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('polyglotmesh:peek-definition'))
        }
      },
    },
    {
      id: 'find-references',
      label: 'Find All References',
      description: 'Find references for symbol at cursor across files',
      shortcut: 'Shift+F12',
      action: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('polyglotmesh:find-references'))
        }
      },
    },
    {
      id: 'view-references',
      label: 'View: References Panel',
      description: 'Open bottom panel references view',
      shortcut: 'References',
      action: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('polyglotmesh:show-references'))
        }
      },
    },
    {
      id: 'view-outline',
      label: 'View: Open Outline / Symbol Navigation',
      description: 'Show symbols and outline hierarchy for active file',
      shortcut: 'Ctrl+Shift+O',
      action: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('polyglotmesh:open-outline'))
        }
      },
    },
    {
      id: 'view-problems',
      label: 'View: Toggle Problems / Diagnostics',
      description: 'Show Monaco diagnostics and problems panel',
      shortcut: 'Ctrl+Shift+M',
      action: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('polyglotmesh:toggle-problems'))
        }
      },
    },
    {
      id: 'view-console',
      label: 'View: Console Output',
      description: 'Show program execution log and console output',
      shortcut: 'Console',
      action: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('polyglotmesh:show-console'))
        }
      },
    },
    {
      id: 'select-all',
      label: 'Select All',
      description: 'Select all content in the active editor',
      shortcut: 'Ctrl+A',
      action: () => {
        if (typeof window !== 'undefined' && window.monaco) {
          const activeEditor = getActiveMonacoEditor()
          if (activeEditor) {
            activeEditor.focus()
            const act = activeEditor.getAction('editor.action.selectAll')
            if (act) {
              act.run()
            } else {
              activeEditor.trigger('commandPalette', 'selectAll')
            }
          }
        }
      },
    },
    {
      id: 'cut',
      label: 'Cut',
      description: 'Cut selection to clipboard',
      shortcut: 'Ctrl+X',
      action: () => {
        if (typeof window !== 'undefined' && window.monaco) {
          const activeEditor = getActiveMonacoEditor()
          if (activeEditor) {
            activeEditor.focus()
            activeEditor.trigger('commandPalette', 'editor.action.clipboardCutAction')
          }
        }
      },
    },
    {
      id: 'copy',
      label: 'Copy',
      description: 'Copy selection to clipboard',
      shortcut: 'Ctrl+C',
      action: () => {
        if (typeof window !== 'undefined' && window.monaco) {
          const activeEditor = getActiveMonacoEditor()
          if (activeEditor) {
            activeEditor.focus()
            activeEditor.trigger('commandPalette', 'editor.action.clipboardCopyAction')
          }
        }
      },
    },
    {
      id: 'paste',
      label: 'Paste',
      description: 'Paste clipboard content into editor',
      shortcut: 'Ctrl+V',
      action: () => {
        if (typeof window !== 'undefined' && window.monaco) {
          const activeEditor = getActiveMonacoEditor()
          if (activeEditor) {
            activeEditor.focus()
            activeEditor.trigger('commandPalette', 'editor.action.clipboardPasteAction')
          }
        }
      },
    },
    {
      id: 'selection-add-next-occurrence',
      label: 'Selection: Add Next Occurrence',
      description: 'Add next occurrence of current selection to multi-selection',
      shortcut: 'Ctrl+D',
      action: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('polyglotmesh:add-next-occurrence'))
          if (window.monaco) {
            const activeEditor = getActiveMonacoEditor()
            if (activeEditor) {
              activeEditor.focus()
              activeEditor.getAction('editor.action.addSelectionToNextFindMatch')?.run()
            }
          }
        }
      },
    },
    {
      id: 'selection-select-all-occurrences',
      label: 'Selection: Select All Occurrences',
      description: 'Select all occurrences of current find match or selection',
      shortcut: 'Ctrl+Shift+L',
      action: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('polyglotmesh:select-all-occurrences'))
          if (window.monaco) {
            const activeEditor = getActiveMonacoEditor()
            if (activeEditor) {
              activeEditor.focus()
              activeEditor.getAction('editor.action.selectHighlights')?.run()
            }
          }
        }
      },
    },
    {
      id: 'selection-add-cursor-above',
      label: 'Selection: Add Cursor Above',
      description: 'Insert cursor directly above current line',
      shortcut: 'Ctrl+Alt+Up',
      action: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('polyglotmesh:add-cursor-above'))
          if (window.monaco) {
            const activeEditor = getActiveMonacoEditor()
            if (activeEditor) {
              activeEditor.focus()
              activeEditor.getAction('editor.action.insertCursorAbove')?.run()
            }
          }
        }
      },
    },
    {
      id: 'selection-add-cursor-below',
      label: 'Selection: Add Cursor Below',
      description: 'Insert cursor directly below current line',
      shortcut: 'Ctrl+Alt+Down',
      action: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('polyglotmesh:add-cursor-below'))
          if (window.monaco) {
            const activeEditor = getActiveMonacoEditor()
            if (activeEditor) {
              activeEditor.focus()
              activeEditor.getAction('editor.action.insertCursorBelow')?.run()
            }
          }
        }
      },
    },
    {
      id: 'selection-add-cursors-to-line-ends',
      label: 'Selection: Add Cursors to Line Ends',
      description: 'Add a cursor at the end of each selected line',
      shortcut: 'Shift+Alt+I',
      action: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('polyglotmesh:add-cursors-to-line-ends'))
          if (window.monaco) {
            const activeEditor = getActiveMonacoEditor()
            if (activeEditor) {
              activeEditor.focus()
              activeEditor.getAction('editor.action.insertCursorAtEndOfEachLineSelected')?.run()
            }
          }
        }
      },
    },
    {
      id: 'selection-expand',
      label: 'Selection: Expand Selection',
      description: 'Smart expand selection to enclosing scope or block',
      shortcut: 'Shift+Alt+Right',
      action: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('polyglotmesh:expand-selection'))
          if (window.monaco) {
            const activeEditor = getActiveMonacoEditor()
            if (activeEditor) {
              activeEditor.focus()
              activeEditor.getAction('editor.action.smartSelect.expand')?.run()
            }
          }
        }
      },
    },
    {
      id: 'selection-shrink',
      label: 'Selection: Shrink Selection',
      description: 'Smart shrink selection to inner scope',
      shortcut: 'Shift+Alt+Left',
      action: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('polyglotmesh:shrink-selection'))
          if (window.monaco) {
            const activeEditor = getActiveMonacoEditor()
            if (activeEditor) {
              activeEditor.focus()
              activeEditor.getAction('editor.action.smartSelect.shrink')?.run()
            }
          }
        }
      },
    },
    {
      id: 'selection-toggle-column',
      label: 'Selection: Toggle Column Selection Mode',
      description: 'Toggle column / box selection mode in editor',
      shortcut: 'Alt+Click',
      action: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('polyglotmesh:toggle-column-selection'))
          if (window.monaco) {
            const activeEditor = getActiveMonacoEditor()
            if (activeEditor) {
              activeEditor.focus()
              activeEditor.getAction('editor.action.toggleColumnSelection')?.run()
            }
          }
        }
      },
    },
    {
      id: 'toggle-word-wrap',
      label: 'View: Toggle Word Wrap',
      description: 'Toggle word wrapping in the active editor',
      shortcut: 'Alt+Z',
      action: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('polyglotmesh:toggle-word-wrap'))
          if (window.monaco) {
            const activeEditor = getActiveMonacoEditor()
            if (activeEditor) {
              activeEditor.focus()
              activeEditor.getAction('editor.action.toggleWordWrap')?.run()
            }
          }
        }
      },
    },
  ]

  const filteredCommands = commands.filter((cmd) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleClose = () => {
    setQuery('')
    setSelectedIndex(0)
    onClose()
  }

  const handleSelectCommand = (cmd) => {
    cmd.action?.()
    handleClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (filteredCommands.length > 0 ? (prev + 1) % filteredCommands.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (filteredCommands.length > 0 ? (prev - 1 + filteredCommands.length) % filteredCommands.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredCommands[selectedIndex]) {
        handleSelectCommand(filteredCommands[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      handleClose()
    }
  }

  return (
    <div
      className="command-palette-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose()
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div className="command-palette">
        <div className="command-palette__header">
          <span className="command-palette__icon" aria-hidden="true">
            🔍
          </span>
          <input
            ref={inputRef}
            type="text"
            className="command-palette__input"
            placeholder="Type a command (Run, Save, Settings)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        <ul className="command-palette__list" role="menu">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, index) => {
              const isSelected = index === selectedIndex
              return (
                <li
                  key={cmd.id}
                  role="menuitem"
                  className={`command-palette__item${isSelected ? ' command-palette__item--selected' : ''}`}
                  onClick={() => handleSelectCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="command-palette__item-main">
                    <span className="command-palette__item-label">{cmd.label}</span>
                    <span className="command-palette__item-desc">{cmd.description}</span>
                  </div>
                  <span className="command-palette__shortcut">{cmd.shortcut}</span>
                </li>
              )
            })
          ) : (
            <div className="command-palette__empty">No matching commands found.</div>
          )}
        </ul>
      </div>
    </div>
  )
}

export default CommandPalette
