import React from 'react'
import { Link } from 'react-router-dom'
import CandidateNotes from './CandidateNotes'
import './CandidateCard.css'

export default function CandidateCard({ candidate, updating = false, jobTitle, onUpdateNotes, children, actionButtons }) {
  if (!candidate) return null
  return (
    <div className="candidate-card">
      <div className="candidate-header">
        <div className="candidate-main">
          <div className="candidate-name"><Link to={`/candidates/${candidate.id}`}>{candidate.name}</Link></div>
          <div className="candidate-email">{candidate.email}</div>
        </div>
        <div className="candidate-meta">
          <span className={`candidate-stage stage-${candidate.stage || 'applied'}`}>{candidate.stage || 'applied'}</span>
        </div>
      </div>
      {/* Job role always below header for clear alignment */}
      <div className="candidate-job" title={jobTitle} style={{marginBottom: 8}}>
        {jobTitle || `Job #${candidate.jobId}`}
      </div>
      <CandidateNotes
        notes={candidate.notes}
        onSave={(notes) => onUpdateNotes(candidate.id, notes)}
      />
      {/* Render actions if present, always in styled wrapper */}
      {(children || actionButtons) && (
        <div className="candidate-actions">
          {actionButtons ? actionButtons : null}
          {children ? children : null}
        </div>
      )}
      {updating && (
        <div className="candidate-updating" aria-hidden>
          <div className="dot-spinner" />
        </div>
      )}
    </div>
  )
}
