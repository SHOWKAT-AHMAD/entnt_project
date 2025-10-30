import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchSubmissions } from '../services/assessments'
import './AssessmentPage.css'

export default function AssessmentSubmissions() {
  const { jobId } = useParams()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetchSubmissions(jobId)
        if (!mounted) return
        setSubmissions(res.items || [])
        setError(null)
      } catch (err) {
        if (!mounted) return
        setError(err.message || 'Failed to load submissions')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [jobId])

  const downloadJSON = (item) => {
    const blob = new Blob([JSON.stringify(item, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `submission_${item.id || item.submittedAt}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="assessment-page">
      <div className="builder-header">
        <h2>Submissions for Job {jobId}</h2>
        <div className="header-actions">
          <Link to={`/jobs/${jobId}/assessment`} className="preview-btn">Back to Assessment</Link>
        </div>
      </div>

      {loading && <div className="loading-spinner">Loading submissions...</div>}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="submissions-list">
          {submissions.length === 0 && <p>No submissions yet.</p>}
          {submissions.map(s => (
            <div key={s.id || s.submittedAt} className="submission-card">
              <div className="submission-meta">
                <strong>Submitted:</strong> {new Date(s.submittedAt).toLocaleString()}
                <button onClick={() => downloadJSON(s)} style={{marginLeft:12}}>Download</button>
              </div>
              <pre className="submission-body">{JSON.stringify(s.responses, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
