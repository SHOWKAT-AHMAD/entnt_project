import React, { useState, useRef} from 'react'
import MentionSuggestions from './MentionSuggestions'
import './CandidateNotes.css'

const teamMembers = [
  { id: 1, name: 'Sarah Johnson', role: 'Hiring Manager', avatar: 'https://i.pravatar.cc/150?u=sarah' },
  { id: 2, name: 'Mike Chen', role: 'Tech Lead', avatar: 'https://i.pravatar.cc/150?u=mike' },
  { id: 3, name: 'Lisa Smith', role: 'HR Manager', avatar: 'https://i.pravatar.cc/150?u=lisa' },
  { id: 4, name: 'David Kim', role: 'Senior Developer', avatar: 'https://i.pravatar.cc/150?u=david' },
  { id: 5, name: 'Emily Brown', role: 'Recruiter', avatar: 'https://i.pravatar.cc/150?u=emily' },
]

export default function CandidateNotes({ notes, onSave }) {
  const [isEditing, setIsEditing] = useState(false)
  const [currentNotes, setCurrentNotes] = useState(notes)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  const textareaRef = useRef(null)
  const [selectionStart, setSelectionStart] = useState(0)

  // Find mention suggestions based on query
  const suggestions = mentionQuery
    ? teamMembers.filter(member => 
        member.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : []

  const handleKeyUp = (e) => {
    const value = e.target.value
    const cursorPosition = e.target.selectionStart
    setSelectionStart(cursorPosition)

    // Find the @ symbol before the cursor
    const beforeCursor = value.slice(0, cursorPosition)
    const atIndex = beforeCursor.lastIndexOf('@')
    
    if (atIndex >= 0 && atIndex === beforeCursor.lastIndexOf('@')) {
      const query = beforeCursor.slice(atIndex + 1)
      // Only show suggestions if query is at least 1 character
      if (query.length > 0) {
        setMentionQuery(query)
        
        // Calculate position for suggestions
        const textArea = e.target
        const coordinates = getCaretCoordinates(textArea, atIndex)
        setMentionPosition({
          top: coordinates.top + 20,
          left: coordinates.left
        })
      } else {
        setMentionQuery('')
      }
    } else {
      setMentionQuery('')
    }
  }

  const handleMentionSelect = (member) => {
    if (!member) {
      setMentionQuery('')
      return
    }

    const value = textareaRef.current.value
    const beforeMention = value.slice(0, selectionStart).lastIndexOf('@')
    const newValue = 
      value.slice(0, beforeMention) +
      `@${member.name} ` +
      value.slice(selectionStart)

    setCurrentNotes(newValue)
    setMentionQuery('')

    // Set focus back to textarea
    textareaRef.current.focus()
  }

  const handleSave = () => {
    onSave(currentNotes)
    setIsEditing(false)
  }

  return (
    <div className="candidate-notes">
      {isEditing ? (
        <div className="notes-editor">
          <textarea
            ref={textareaRef}
            value={currentNotes}
            onChange={e => setCurrentNotes(e.target.value)}
            onKeyUp={handleKeyUp}
            placeholder="Add notes... Use @ to mention team members"
          />
          <div className="notes-actions">
            <button onClick={handleSave} className="save">
              Save
            </button>
            <button onClick={() => setIsEditing(false)} className="cancel">
              Cancel
            </button>
          </div>
          <MentionSuggestions
            query={mentionQuery}
            suggestions={suggestions}
            onSelect={handleMentionSelect}
            position={mentionPosition}
            visible={mentionQuery.length > 0}
          />
        </div>
      ) : (
        <div className="notes-viewer" onClick={() => setIsEditing(true)}>
          {renderNotesWithMentions(currentNotes || 'Click to add notes...')}
        </div>
      )}
    </div>
  )
}

function renderNotesWithMentions(text) {
  const safeText = typeof text === 'string' ? text : (text == null ? '' : String(text))
  return safeText.split(/(@[\w\s]+)/).map((part, index) => {
    if (part.startsWith('@')) {
      const name = part.slice(1).trim()
      const member = teamMembers.find(m => m.name === name)
      
      if (member) {
        return (
          <span key={index} className="mention">
            <img src={member.avatar} alt="" />
            {member.name}
          </span>
        )
      }
    }
    return part
  })
}

// Helper function to get caret coordinates
function getCaretCoordinates(element, position) {
  const { offsetLeft, offsetTop } = element
  const div = document.createElement('div')
  const style = getComputedStyle(element)
  
  div.style.fontSize = style.fontSize
  div.style.fontFamily = style.fontFamily
  div.style.fontWeight = style.fontWeight
  div.style.width = style.width
  div.style.padding = style.padding
  div.style.position = 'absolute'
  div.style.visibility = 'hidden'
  div.style.whiteSpace = 'pre-wrap'
  
  div.textContent = element.value.substring(0, position)
  
  const span = document.createElement('span')
  span.textContent = element.value.substring(position) || '.'
  div.appendChild(span)
  
  document.body.appendChild(div)
  const coordinates = {
    top: offsetTop + span.offsetTop,
    left: offsetLeft + span.offsetLeft
  }
  document.body.removeChild(div)
  
  return coordinates
}