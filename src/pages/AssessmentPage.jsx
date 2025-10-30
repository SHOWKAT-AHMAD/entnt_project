import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import AssessmentBuilder from '../components/AssessmentBuilder'
import { fetchAssessment, saveAssessment } from '../services/assessments'
import { applyAssessmentTemplate } from '../services/assessmentTemplates'
import './AssessmentPage.css'

export default function AssessmentPage() {
  const { jobId } = useParams()
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
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