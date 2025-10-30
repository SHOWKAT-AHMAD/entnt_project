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
    <div className="candidate-detail-main" style={{ padding: 0, maxWidth: 700, margin: '2.5rem auto', position: 'relative', background: '#fff', borderRadius: '18px', boxShadow: '0 4px 20px #176ddb18', paddingTop: 38, paddingBottom: 36, paddingLeft: 38, paddingRight: 38 }}>
      {/* Floating status - moved slightly up and right */}
      <span className="candidate-stage" style={{ position: 'absolute', top: 10, right: 34 }}>{candidate.stage?.toUpperCase() || 'APPLIED'}</span>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', marginBottom: 20, position:'relative', zIndex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, width: '100%' }}>
          <h2 style={{ margin:0, flex:1 }}>{candidate.name}</h2>
          <button className="btn" onClick={() => setEditing(true)} style={{ minWidth: 70, marginTop: 2 }}>Edit</button>
        </div>
      </div>
      {/* Candidate info */}
      <div style={{ marginBottom: 16, fontSize: '1.07rem', color: '#315187', letterSpacing: 0.01 }}>
        <div><strong>Email:</strong> {candidate.email}</div>
        <div><strong>Job:</strong> <span className="candidate-job" style={{ fontWeight: 700 }}>{candidate.jobTitle || `Job #${candidate.jobId}`}</span></div>
      </div>
      {editing && (
        <CandidateModal candidate={candidate} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); refresh() }} />
      )}
      {/* Timeline Section */}
      <div className="candidate-timeline" style={{marginTop: 20}}>
        <h4 style={{ marginBottom: '0.6em', color: '#166790', fontWeight: 700, fontSize: '1.15rem' }}>Timeline</h4>
        {Array.isArray(candidate.history) && candidate.history.length === 0 && (
          <div className="muted" style={{padding:'0.7em 0'}}>No status changes yet.</div>
        )}
        {Array.isArray(candidate.history) && candidate.history.slice().reverse().map((h, idx) => (
          <div key={idx} className="timeline-item" style={{ borderLeft: '3px solid #ddeafe', paddingLeft: 13, marginBottom: '1.15em', position:'relative' }}>
            <span className="timeline-dot" style={{ position: 'absolute', left: -10, top: 4, width: 10, height: 10, borderRadius: 5, background: '#16bb74', display: 'inline-block', boxShadow: '0 1px 4px #16bb7424' }} />
            <div className="timeline-time" style={{ fontSize: '0.93em', color: '#7ea6c7', marginBottom: 2 }}>{new Date(h.at).toLocaleString()}</div>
            <div style={{ color: '#18886a', fontWeight: '600', fontSize:'1.04em' }}>{h.from ? `${h.from} → ${h.to}` : `Initial: ${h.to}`}</div>
          </div>
        ))}
      </div>
      {/* Notes Section Modernized */}
      <div className="notes" style={{ marginTop: 36 }}>
        <h4 style={{ color: '#1956b6', fontWeight: 700, fontSize:'1.12em',marginBottom:10 }}>Notes</h4>
        {notes && notes.length === 0 && <div className="muted">No notes yet.</div>}
        {notes && notes.map(n => (
          <div key={n.id} className="note" style={{ marginBottom: 10, border: 'none', borderBottom: '1.25px solid #f0f4f7', padding:'0.7em 0 0.3em 0' }}>
            <div style={{ fontSize: 12, color: '#94a2be', marginBottom: 2 }}>{new Date(n.at).toLocaleString()}</div>
            <div dangerouslySetInnerHTML={{ __html: renderMentions(n.text) }} style={{ color:'#2956a4',fontWeight:500,fontSize:'1.03em' }} />
          </div>
        ))}
        {/* Add note UI, matching the rest of app */}
        <div className="note-input" style={{ marginTop: 12, display:'flex', gap:8 }}>
          <input
            style={{ flex:1, borderRadius:8, border:'1.5px solid #ddeafe', background:'#f6fafd', padding:'0.6em 1em', fontSize:'1.01em', fontFamily:'inherit' }}
            placeholder="Write a note — use @ to mention"
            value={noteText}
            onChange={(e) => onNoteChange(e.target.value)}
            onFocus={() => setShowSuggest(true)}
            onBlur={() => setTimeout(()=>setShowSuggest(false), 200)}
          />
          <button className="btn btn-primary" style={{ borderRadius: 8, fontWeight: 600 }} onClick={handleAddNote} disabled={!noteText.trim()}>Add</button>
        </div>
        {showSuggest && suggestions.length > 0 && (
          <ul className="mention-suggest" ref={suggestRef} style={{marginTop:3}}>
            {suggestions.map((s, i) => (
              <li key={i} style={{fontSize:'1em',padding:'0.4em 0.8em'}} onMouseDown={(e) => { e.preventDefault(); pickSuggestion(s) }}>{s}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}


