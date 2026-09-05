import { useEffect, useRef, useState } from 'react'

function CommandPalette({ isOpen, onClose, onRun, onSave, onOpenSettings }) {
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
      id: 'format-document',
      label: 'Format Document',
      description: 'Format the entire active document',
      shortcut: 'Shift+Alt+F / Ctrl+Shift+I',
      action: () => {
        if (typeof window !== 'undefined' && window.monaco) {
          const activeEditor = window.monaco.editor.getEditors()[0]
          if (activeEditor) {
            activeEditor.focus()
            activeEditor.getAction('editor.action.formatDocument')?.run()
          }
        }
      },
    },
    {
      id: 'format-selection',
      label: 'Format Selection',
      description: 'Format selected text in active document',
      shortcut: 'Ctrl+K Ctrl+F',
      action: () => {
        if (typeof window !== 'undefined' && window.monaco) {
          const activeEditor = window.monaco.editor.getEditors()[0]
          if (activeEditor) {
            activeEditor.focus()
            const selection = activeEditor.getSelection()
            if (selection && !selection.isEmpty()) {
              activeEditor.getAction('editor.action.formatSelection')?.run()
            }
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
          if (window.monaco) {
            const activeEditor = window.monaco.editor.getEditors()[0]
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
        }
      },
    },
    {
      id: 'gotoline',
      label: 'Go to Line',
      description: 'Jump to a specific line and column',
      shortcut: 'Ctrl+G',
      action: () => {
        if (typeof window !== 'undefined' && window.monaco) {
          const activeEditor = window.monaco.editor.getEditors()[0]
          if (activeEditor) {
            activeEditor.focus()
            activeEditor.getAction('editor.action.gotoLine')?.run()
          }
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
