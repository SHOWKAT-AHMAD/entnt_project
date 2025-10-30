import React, { useState, useRef, useEffect } from 'react'
import './MentionSuggestions.css'

export default function MentionSuggestions({
  query,
  suggestions,
  onSelect,
  position,
  visible
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef(null)

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    function handleKeyDown(e) {
      if (!visible) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(i => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (suggestions[selectedIndex]) {
            onSelect(suggestions[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onSelect(null)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [visible, suggestions, selectedIndex, onSelect])

  if (!visible || suggestions.length === 0) return null

  return (
    <div 
      className="mention-suggestions"
      style={{
        top: position.top,
        left: position.left
      }}
    >
      <ul ref={listRef}>
        {suggestions.map((suggestion, index) => (
          <li
            key={suggestion.id}
            className={index === selectedIndex ? 'selected' : ''}
            onClick={() => onSelect(suggestion)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <img src={suggestion.avatar} alt="" />
            <div className="suggestion-info">
              <div className="name">{suggestion.name}</div>
              <div className="role">{suggestion.role}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}