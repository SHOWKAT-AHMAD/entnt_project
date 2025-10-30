import { useState } from 'react'
import { createJob, patchJob } from '../services/jobs'
import './JobModal.css'

export default function JobModal({ job, onClose, onSave }) {
  const [title, setTitle] = useState(job?.title || '')
  const [slug, setSlug] = useState(job?.slug || '')
  const [role, setRole] = useState(job?.role || '')
  const [tags, setTags] = useState(job?.tags?.join(', ') || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const roleOptions = [
    { value: 'full-stack-developer', label: 'Full Stack Developer' },
    { value: 'product-manager', label: 'Product Manager' },
    { value: 'ui-ux-designer', label: 'UI/UX Designer' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!slug.trim()) {
      setError('Slug is required')
      return
    }
      if (!role) {
        setError('Role is required')
        return
      }
    setSaving(true)
    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
      const timestamp = new Date().getTime()
      const uniqueSlug = job ? slug.trim() : `${slug.trim()}-${timestamp}`
      const payload = { 
        title: title.trim(), 
        slug: uniqueSlug, 
        tags: tagList,
        role: role 
      }
      const saved = job
        ? await patchJob(job.id, payload)
        : await createJob(payload)
      onSave(saved)
    } catch (err) {
      setError(err.message || 'Failed to save')
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>{job ? 'Edit Job' : 'Create Job'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Title:
              <input
                className="form-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={saving}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Slug:
              <input
                className="form-input"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                disabled={saving}
              />
            </label>
          </div>
          <div className="form-row">
              <label>
                Role:
                <select
                  className="form-input"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  disabled={saving}
                >
                  <option value="">Select a role...</option>
                  {roleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-row">
            <label>
              Tags (comma-separated):
              <input
                className="form-input"
                value={tags}
                onChange={e => setTags(e.target.value)}
                disabled={saving}
              />
            </label>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" disabled={saving}>
              {saving ? 'Saving...' : (job ? 'Save' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}