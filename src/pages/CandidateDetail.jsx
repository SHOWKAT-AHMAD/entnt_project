import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getCandidate, addCandidateNote, fetchCandidates } from '../services/candidates'
import CandidateModal from '../components/CandidateModal'
import './CandidateDetail.css'
import { useRef } from 'react'

export default function CandidateDetail() {
  const { id } = useParams()
  const [candidate, setCandidate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(candidate?.notes || [])
  const [noteText, setNoteText] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggest, setShowSuggest] = useState(false)
  const suggestRef = useRef(null)
  const [allNames, setAllNames] = useState([])

  useEffect(() => {
    setNotes(candidate?.notes || [])
  }, [candidate])

  // load candidate name suggestions (local list)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetchCandidates({ pageSize: 1000 })
        if (!mounted) return
        setAllNames((res.items || []).map(c => c.name).filter(Boolean))
      } catch (err) {
        console.error('Failed to load candidate names for mentions', err)
      }
    })()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const c = await getCandidate(id)
        if (mounted) setCandidate(c)
      } catch (err) {
        console.error('Failed to load candidate', err)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  const refresh = async () => {
    try {
      const c = await getCandidate(id)
      setCandidate(c)
      setNotes(c?.notes || [])
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading candidate…</div>
  if (!candidate) return <div style={{ padding: 24 }}>Candidate not found.</div>

  // helper: render mentions into highlighted HTML
  function renderMentions(text) {
    return String(text || '').replace(/@([\w\s.]+)/g, (m, name) => `<span class="mentions">@${escapeHtml(name.trim())}</span>`)
  }

  function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

  // handle inline mention suggestions as user types
  function onNoteChange(value) {
    setNoteText(value)
    const idx = value.lastIndexOf('@')
    if (idx >= 0) {
      const token = value.slice(idx + 1)
      const q = token.trim().toLowerCase()
      if (q.length === 0) {
        setSuggestions(allNames.slice(0, 5))
        return
      }
      const matches = allNames.filter(n => n.toLowerCase().includes(q)).slice(0, 8)
      setSuggestions(matches)
    } else {
      setSuggestions([])
    }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return
    try {
      const note = await addCandidateNote(Number(id), noteText.trim())
      setNotes(prev => [...(prev||[]), note])
      setNoteText('')
      setSuggestions([])
    } catch (err) {
      console.error('Failed to add note', err)
      alert('Failed to add note')
    }
  }

  function pickSuggestion(name) {
    const idx = noteText.lastIndexOf('@')
    const before = noteText.slice(0, idx + 1)
    setNoteText(before + name + ' ')
    setSuggestions([])
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ margin:0 }}>{candidate.name}</h2>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn" onClick={() => setEditing(true)}>Edit</button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div><strong>Email:</strong> {candidate.email}</div>
        <div><strong>Stage:</strong> {candidate.stage}</div>
        <div><strong>Job ID:</strong> {candidate.jobId}</div>
      </div>

      {editing && (
        <CandidateModal candidate={candidate} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); refresh() }} />
      )}
      
      <div className="candidate-timeline">
        <h4>Timeline</h4>
        {Array.isArray(candidate.history) && candidate.history.slice().reverse().map((h, idx) => (
          <div key={idx} className="timeline-item">
            <div className="timeline-time">{new Date(h.at).toLocaleString()}</div>
            <div>{h.from ? `${h.from} → ${h.to}` : `Initial: ${h.to}`}</div>
          </div>
        ))}
      </div>

      <div className="notes">
        <h4>Notes</h4>
        {notes && notes.length === 0 && <div className="muted">No notes yet.</div>}
        {notes && notes.map(n => (
          <div key={n.id} className="note">
            <div style={{ fontSize: 12, color: 'var(--muted,#666)' }}>{new Date(n.at).toLocaleString()}</div>
            <div dangerouslySetInnerHTML={{ __html: renderMentions(n.text) }} />
          </div>
        ))}

        <div style={{ position: 'relative' }}>
          <div className="note-input">
            <input
              placeholder="Write a note — use @ to mention"
              value={noteText}
              onChange={(e) => onNoteChange(e.target.value)}
              onFocus={() => setShowSuggest(true)}
              onBlur={() => setTimeout(()=>setShowSuggest(false), 200)}
            />
            <button className="btn btn-primary" onClick={handleAddNote} disabled={!noteText.trim()}>Add</button>
          </div>
          {showSuggest && suggestions.length > 0 && (
            <ul className="mention-suggest" ref={suggestRef}>
              {suggestions.map((s, i) => (
                <li key={i} onMouseDown={(e) => { e.preventDefault(); pickSuggestion(s) }}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}


