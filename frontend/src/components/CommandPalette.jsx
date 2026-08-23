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
      setQuery('')
      setSelectedIndex(0)
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!isOpen) return null

  const handleSelectCommand = (cmd) => {
    cmd.action?.()
    onClose()
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
      onClose()
    }
  }

  return (
    <div
      className="command-palette-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
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
            onChange={(e) => setQuery(e.target.value)}
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
