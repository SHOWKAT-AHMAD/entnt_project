import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import AssessmentBuilder from '../components/AssessmentBuilder'
import { fetchAssessment, saveAssessment } from '../services/assessments'
import { applyAssessmentTemplate } from '../services/assessmentTemplates'
import { fetchJobs } from '../services/jobs'
import './AssessmentPage.css'

export default function AssessmentPage() {
  const { jobId } = useParams()
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [allJobs, setAllJobs] = useState([])
  const [allJobAssessments, setAllJobAssessments] = useState([])

  // If there's a jobId param, show builder for that job's assessment
  useEffect(() => {
    if (!jobId) return
    const loadAssessment = async () => {
      try {
        setLoading(true)
        const data = await fetchAssessment(jobId)
        setAssessment(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadAssessment()
  }, [jobId])

  // When /assessments page is loaded with no jobId, fetch jobs & their assessment status
  useEffect(() => {
    if (jobId) return
    async function loadJobsAndAssessments() {
      setLoading(true)
      try {
        const jobRes = await fetchJobs({ pageSize: 1000 })
        setAllJobs(jobRes.items || [])
        // Fetch assessment for each job
        const statuses = await Promise.all(
          (jobRes.items || []).map(async (job) => {
            try {
              const a = await fetchAssessment(job.id)
              return { jobId: job.id, status: a?.sections?.length ? 'Created' : 'Not started', updated: a?.updatedAt || undefined }
            } catch {
              return { jobId: job.id, status: 'Error', updated: null }
            }
          })
        )
        setAllJobAssessments(statuses)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadJobsAndAssessments()
  }, [jobId])

  const handleSave = async (sections) => {
    try {
      await saveAssessment(jobId, { sections })
      setAssessment(prev => ({ ...prev, sections }))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleApplyTemplate = async (templateType) => {
    try {
      setLoading(true)
      const template = await applyAssessmentTemplate(jobId, templateType)
      setAssessment(template)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!jobId) {
    if (loading) {
      return <div className="assessment-page loading"><div className="loading-spinner">Loading jobs…</div></div>
    }
    if (error) {
      return <div className="assessment-page error"><div className="error-message"><h3>Error loading assessments</h3><p>{error}</p></div></div>
    }
    return (
      <div className="assessment-page">
        <h2 style={{ marginBottom: 22 }}>Assessment per Job</h2>
        <table style={{ width:'100%', borderCollapse:'collapse',background:'#fff',borderRadius:'1em',boxShadow:'0 2px 14px #146ad010',overflow:'hidden',marginBottom:32 }}>
          <thead style={{ background:'#e6f0fb' }}>
            <tr style={{textAlign:'left'}}>
              <th style={{ padding: '1.25em 1em', fontWeight:800, color:'#2071c5', fontSize:'1.1em' }}>Job Title</th>
              <th style={{ padding: '1.25em 1em', fontWeight:700, color:'#3a6dab' }}>Assessment Status</th>
              <th style={{ padding: '1.25em 1em', fontWeight:700, color:'#3a6dab' }}>Edit/View</th>
            </tr>
          </thead>
          <tbody>
            {allJobs.map(job => {
              const ast = allJobAssessments.find(a => a.jobId === job.id)
              return (
                <tr key={job.id} style={{ borderBottom: '1px solid #ebeaea' }}>
                  <td style={{ padding:'1.2em 1em' }}>{job.title}</td>
                  <td style={{ padding:'1.2em 1em' }}>{ast ? ast.status : 'Loading…'}</td>
                  <td style={{ padding:'1.2em 1em' }}><Link to={`/jobs/${job.id}/assessment`} className="preview-btn">{ast && ast.status === 'Created' ? 'Edit' : 'Create'} Assessment</Link></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="assessment-page loading">
        <div className="loading-spinner">Loading assessment...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="assessment-page error">
        <div className="error-message">
          <h3>Error loading assessment</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    )
  }

  if (!assessment?.sections?.length) {
    return (
      <div className="assessment-page">
        <div className="template-selector">
          <h2>Select an Assessment Template</h2>
          <div className="template-options">
            <button onClick={() => handleApplyTemplate('full-stack-developer')}>
              Full Stack Developer Assessment
            </button>
            <button onClick={() => handleApplyTemplate('product-manager')}>
              Product Manager Assessment
            </button>
            <button onClick={() => handleApplyTemplate('ui-ux-designer')}>
              UI/UX Designer Assessment
            </button>
            <button onClick={() => setAssessment({ sections: [] })}>
              Start from Scratch
            </button>
            <Link to={`/jobs/${jobId}/assessment/submissions`} className="preview-btn">
              View Submissions
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="assessment-page">
      <AssessmentBuilder
        jobId={jobId}
        assessment={assessment}
        onSave={handleSave}
      />
    </div>
  )
}