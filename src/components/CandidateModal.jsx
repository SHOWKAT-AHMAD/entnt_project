import React, { useState, useEffect } from 'react'
import { createCandidate, patchCandidate } from '../services/candidates'
import './CandidateModal.css'
import { showGlobalToast } from './ToastNotification'

export default function CandidateModal({ job, candidate = null, onClose, onApplied, onSaved }) {
  const [name, setName] = useState(candidate?.name || '')
  const [email, setEmail] = useState(candidate?.email || '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setName(candidate?.name || '')
    setEmail(candidate?.email || '')
  }, [candidate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (candidate && candidate.id) {
        await patchCandidate(candidate.id, { name, email })
        if (onSaved) onSaved()
      } else {
        const created = await createCandidate({ name, email, jobId: job?.id })
        // If no email provided, use proper fallback format
        if (!email) {
          created.email = `candidate${Date.now()}@gmail.com`
        }
        // Broadcast event for any open views to update immediately
        try { window.dispatchEvent(new CustomEvent('candidate-created', { detail: created })) } catch {}
        if (onApplied) onApplied(created)
      }
    } catch (err) {
      console.error('Failed to submit candidate', err)
      showGlobalToast('Failed to save. Try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>{candidate ? 'Edit candidate' : `Apply to: ${job?.title || ''}`}</h3>
        <form onSubmit={handleSubmit} className="candidate-form">
          <label>
            Full name
            <input value={name} onChange={e=>setName(e.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </label>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? (candidate ? 'Saving…' : 'Applying…') : (candidate ? 'Save' : 'Apply')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
