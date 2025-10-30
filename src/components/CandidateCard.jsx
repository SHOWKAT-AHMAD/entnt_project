import React from 'react'
import { Link } from 'react-router-dom'
import CandidateNotes from './CandidateNotes'
import './CandidateCard.css'

export default function CandidateCard({ candidate, updating = false, jobTitle, onUpdateNotes }) {
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
          <span className="candidate-job" title={jobTitle}>
            {jobTitle || `Job #${candidate.jobId}`}
          </span>
        </div>
      </div>
      <CandidateNotes
        notes={candidate.notes}
        onSave={(notes) => onUpdateNotes(candidate.id, notes)}
      />
      {updating && (
        <div className="candidate-updating" aria-hidden>
          <div className="dot-spinner" />
        </div>
      )}
    </div>
  )
}
