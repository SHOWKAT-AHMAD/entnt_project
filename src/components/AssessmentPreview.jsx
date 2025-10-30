import React, { useState, useEffect } from 'react'
import './AssessmentPreview.css'
import { QUESTION_TYPES } from './AssessmentBuilder'
import { submitAssessment } from '../services/assessments'

const AssessmentPreview = ({ jobId, sections }) => {
  const [responses, setResponses] = useState({})
  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    if (!jobId) return
    // Load saved responses from localStorage
    const savedResponses = localStorage.getItem(`assessment_responses_${jobId}`)
    if (savedResponses) {
      setResponses(JSON.parse(savedResponses))
    }
  }, [jobId])

  useEffect(() => {
    if (!jobId) return
    // Save responses to localStorage
    localStorage.setItem(`assessment_responses_${jobId}`, JSON.stringify(responses))
  }, [responses, jobId])

  const validateResponse = (question, value) => {
    if (question.required && !value) {
      return 'This field is required'
    }

    switch (question.type) {
      case QUESTION_TYPES.NUMERIC: {
        const numValue = Number(value)
        if (question.validation.min !== null && numValue < question.validation.min) {
          return `Value must be at least ${question.validation.min}`
        }
        if (question.validation.max !== null && numValue > question.validation.max) {
          return `Value must be at most ${question.validation.max}`
        }
        break
      }

      case QUESTION_TYPES.SHORT_TEXT:
      case QUESTION_TYPES.LONG_TEXT:
        if (question.validation.maxLength && value.length > question.validation.maxLength) {
          return `Text must be no longer than ${question.validation.maxLength} characters`
        }
        break

      case QUESTION_TYPES.FILE_UPLOAD: {
        if (!value) break
        const file = value
        if (question.validation.maxSize && file.size > question.validation.maxSize * 1024 * 1024) {
          return `File must be smaller than ${question.validation.maxSize}MB`
        }
        if (question.validation.allowedExtensions) {
          const ext = file.name.split('.').pop().toLowerCase()
          if (!question.validation.allowedExtensions.includes(ext)) {
            return `File must be one of: ${question.validation.allowedExtensions.join(', ')}`
          }
        }
        break
      }
    }

    return null
  }

  const handleChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }))

    // Clear validation error when value changes
    setValidationErrors(prev => ({
      ...prev,
      [questionId]: null
    }))
  }

  const shouldShowQuestion = (question) => {
    if (!question.conditions || question.conditions.length === 0) {
      return true
    }

    return question.conditions.every(condition => {
      const dependentValue = responses[condition.questionId]
      switch (condition.operator) {
        case '===': return dependentValue === condition.value
        case '!==': return dependentValue !== condition.value
        case '>': return Number(dependentValue) > Number(condition.value)
        case '<': return Number(dependentValue) < Number(condition.value)
        default: return true
      }
    })
  }

  const renderQuestion = (question) => {
    if (!shouldShowQuestion(question)) {
      return null
    }

    const error = validationErrors[question.id]

    switch (question.type) {
      case QUESTION_TYPES.SINGLE_CHOICE:
        return (
          <div className="question-preview">
            <div className="question-text">
              {question.text}
              {question.required && <span className="required">*</span>}
            </div>
            <div className="radio-group">
              {question.options.map((option, idx) => (
                <label key={idx}>
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={responses[question.id] === option}
                    onChange={(e) => handleChange(question.id, e.target.value)}
                  />
                  {option}
                </label>
              ))}
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
        )

      case QUESTION_TYPES.MULTI_CHOICE:
        return (
          <div className="question-preview">
            <div className="question-text">
              {question.text}
              {question.required && <span className="required">*</span>}
            </div>
            <div className="checkbox-group">
              {question.options.map((option, idx) => (
                <label key={idx}>
                  <input
                    type="checkbox"
                    value={option}
                    checked={(responses[question.id] || []).includes(option)}
                    onChange={(e) => {
                      const currentValues = responses[question.id] || []
                      const newValues = e.target.checked
                        ? [...currentValues, option]
                        : currentValues.filter(v => v !== option)
                      handleChange(question.id, newValues)
                    }}
                  />
                  {option}
                </label>
              ))}
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
        )

      case QUESTION_TYPES.SHORT_TEXT:
        return (
          <div className="question-preview">
            <div className="question-text">
              {question.text}
              {question.required && <span className="required">*</span>}
            </div>
            <input
              type="text"
              value={responses[question.id] || ''}
              onChange={(e) => handleChange(question.id, e.target.value)}
              maxLength={question.validation.maxLength}
            />
            {error && <div className="error-message">{error}</div>}
          </div>
        )

      case QUESTION_TYPES.LONG_TEXT:
        return (
          <div className="question-preview">
            <div className="question-text">
              {question.text}
              {question.required && <span className="required">*</span>}
            </div>
            <textarea
              value={responses[question.id] || ''}
              onChange={(e) => handleChange(question.id, e.target.value)}
              maxLength={question.validation.maxLength}
            />
            {error && <div className="error-message">{error}</div>}
          </div>
        )

      case QUESTION_TYPES.NUMERIC:
        return (
          <div className="question-preview">
            <div className="question-text">
              {question.text}
              {question.required && <span className="required">*</span>}
            </div>
            <input
              type="number"
              value={responses[question.id] || ''}
              onChange={(e) => handleChange(question.id, e.target.value)}
              min={question.validation.min}
              max={question.validation.max}
            />
            {error && <div className="error-message">{error}</div>}
          </div>
        )

      case QUESTION_TYPES.FILE_UPLOAD:
        return (
          <div className="question-preview">
            <div className="question-text">
              {question.text}
              {question.required && <span className="required">*</span>}
            </div>
            <input
              type="file"
              onChange={(e) => handleChange(question.id, e.target.files[0])}
              accept={question.validation.allowedExtensions?.map(ext => `.${ext}`).join(',')}
            />
            {error && <div className="error-message">{error}</div>}
          </div>
        )

      default:
        return null
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const errors = {}
    let hasErrors = false

    sections.forEach(section => {
      section.questions.forEach(question => {
        if (shouldShowQuestion(question)) {
          const error = validateResponse(question, responses[question.id])
          if (error) {
            errors[question.id] = error
            hasErrors = true
          }
        }
      })
    })

    setValidationErrors(errors)

    if (!hasErrors) {
      // submit to API (MSW -> Dexie)
      (async () => {
        try {
          await submitAssessment(jobId || sections[0]?.jobId || 'unknown', responses)
          alert('Assessment responses saved')
        } catch (err) {
          console.error('Submission failed', err)
          alert('Failed to submit assessment: ' + (err?.message || 'unknown'))
        }
      })()
    }
  }

  return (
    <div className="assessment-preview">
      <form onSubmit={handleSubmit}>
        {sections.map(section => (
          <div key={section.id} className="preview-section">
            <h3>{section.title}</h3>
            {section.description && (
              <p className="section-description">{section.description}</p>
            )}
            <div className="questions">
              {section.questions.map(question => renderQuestion(question))}
            </div>
          </div>
        ))}
        <div className="preview-actions">
          <button type="submit" className="submit-btn">
            Submit Assessment
          </button>
        </div>
      </form>
    </div>
  )
}

export default AssessmentPreview