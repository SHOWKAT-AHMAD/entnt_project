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

  if (loading) return <div style={{padding:20, textAlign:'center'}}>Loading…</div>
  if (!job) return <div style={{padding:20, textAlign:'center'}}>Job not found — <Link to="/jobs">Back to jobs</Link></div>

  return (
    <div style={{padding:20, maxWidth: 900, margin: '0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20, gap: 12, flexWrap: 'wrap'}}>
        <h2 style={{margin:0}}>{job.title}</h2>
        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
          <button onClick={() => setShowEdit(true)} style={{padding:'8px 12px', borderRadius:8}}>Edit</button>
          <button onClick={handleToggleArchive} style={{padding:'8px 12px', borderRadius:8}}>
            {job.status === 'active' ? 'Archive' : 'Unarchive'}
          </button>
        </div>
      </div>

      {/* Job info card */}
      <div style={{
        background: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 6px 24px rgba(2,12,31,.08)',
        border: '1px solid #e5e7eb',
        padding: '16px 18px',
        marginBottom: 16
      }}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12}}>
          <div>
            <div style={{fontSize:12, color:'#6b7280', marginBottom:4}}>Slug</div>
            <div style={{fontWeight:600, color:'#111827'}}>{job.slug}</div>
          </div>
          <div>
            <div style={{fontSize:12, color:'#6b7280', marginBottom:4}}>Status</div>
            <span style={{
              display:'inline-block',
              padding:'6px 10px',
              borderRadius:9999,
              fontWeight:700,
              color: job.status === 'active' ? '#065f46' : '#7c2d12',
              background: job.status === 'active' ? '#d1fae5' : '#ffedd5',
              border: `1px solid ${job.status === 'active' ? '#a7f3d0' : '#fed7aa'}`
            }}>{job.status}</span>
          </div>
          <div style={{gridColumn:'1 / -1'}}>
            <div style={{fontSize:12, color:'#6b7280', marginBottom:6}}>Tags</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
              {(job.tags || []).length === 0 ? (
                <span style={{color:'#6b7280'}}>No tags</span>
              ) : (
                (job.tags || []).map((t, i) => (
                  <span key={i} style={{
                    display:'inline-block',
                    padding:'6px 10px',
                    borderRadius:9999,
                    background:'#eff6ff',
                    color:'#1d4ed8',
                    border:'1px solid #dbeafe',
                    fontWeight:600
                  }}>{t}</span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div style={{marginTop: 20, marginBottom: 20, textAlign:'center'}}>
        <h3 style={{marginTop:0}}>Assessment</h3>
        <Link 
          to="assessment"
          relative="path"
          className="assessment-link"
          style={{
            display: 'inline-block',
            padding: '10px 18px',
            backgroundColor: '#0066cc',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            marginTop: '10px'
          }}
        >
          {job.hasAssessment ? 'Edit Assessment' : 'Create Assessment'}
        </Link>
      </div>

      <div style={{marginTop:10, textAlign:'center'}}><Link to="/jobs">Back to jobs</Link></div>

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
