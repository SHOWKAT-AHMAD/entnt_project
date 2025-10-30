import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { patchJob } from '../services/jobs'
import { checkAssessment } from '../services/assessments'
import JobModal from '../components/JobModal'

export default function JobDetail() {
  const { jobId } = useParams()

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showEdit, setShowEdit] = useState(false)

  const loadJob = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [jobResponse, hasAssessment] = await Promise.all([
        fetch(`/jobs/${jobId}`),
        checkAssessment(jobId)
      ])
      
      if (!jobResponse.ok) throw new Error('Job not found')
      const data = await jobResponse.json()
      
      setJob({
        ...data,
        hasAssessment
      })
    } catch (err) {
      setError(err.message)
      setJob(null)
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    loadJob()
  }, [loadJob])

  const handleToggleArchive = async () => {
    try {
      const updated = await patchJob(job.id, { 
        status: job.status === 'active' ? 'archived' : 'active' 
      })
      setJob(updated)
    } catch {
      // could show error toast
    }
  }

  const handleSave = () => {
    setShowEdit(false)
    loadJob()
  }

  if (loading) return <div style={{padding:20}}>Loading…</div>
  if (!job) return <div style={{padding:20}}>Job not found — <Link to="/jobs">Back to jobs</Link></div>

  return (
    <div style={{padding:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <h2>{job.title}</h2>
        <div>
          <button onClick={() => setShowEdit(true)} style={{marginRight:8}}>Edit</button>
          <button onClick={handleToggleArchive}>
            {job.status === 'active' ? 'Archive' : 'Unarchive'}
          </button>
        </div>
      </div>
      <div>Slug: {job.slug}</div>
      <div>Status: {job.status}</div>
      <div>Tags: {(job.tags||[]).join(', ')}</div>
      
      <div style={{marginTop: 20, marginBottom: 20}}>
        <h3>Assessment</h3>
        <Link 
          to="assessment"
          relative="path"
          className="assessment-link"
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: '#0066cc',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            marginTop: '10px'
          }}
        >
          {job.hasAssessment ? 'Edit Assessment' : 'Create Assessment'}
        </Link>
      </div>

      <div style={{marginTop:10}}><Link to="/jobs">Back to jobs</Link></div>

      {showEdit && (
        <JobModal
          job={job}
          onClose={() => setShowEdit(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
