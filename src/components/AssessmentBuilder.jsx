import React, { useState, useCallback, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import QuestionBuilder from './QuestionBuilder'
import AssessmentPreview from './AssessmentPreview'
import './AssessmentBuilder.css'

const QUESTION_TYPES = {
  SINGLE_CHOICE: 'single_choice',
  MULTI_CHOICE: 'multi_choice',
  SHORT_TEXT: 'short_text',
  LONG_TEXT: 'long_text',
  NUMERIC: 'numeric',
  FILE_UPLOAD: 'file_upload'
}

const initialSection = {
  id: uuidv4(),
  title: 'New Section',
  description: '',
  questions: []
}

const initialQuestion = {
  id: uuidv4(),
  type: QUESTION_TYPES.SHORT_TEXT,
  text: 'New Question',
  required: false,
  validation: {},
  options: [],
  conditions: []
}

export default function AssessmentBuilder({ jobId, assessment, onSave }) {
  const [sections, setSections] = useState(assessment?.sections || [initialSection])
  const [activeSection, setActiveSection] = useState(sections[0]?.id)
  // Remove showPreview - dual pane is always shown
  // Modern flex-row layout for builder + preview
  const [previewWidth, setPreviewWidth] = useState(48)
  const [saveStatus, setSaveStatus] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showTypes, setShowTypes] = useState(false)

  useEffect(() => {
    if (!jobId) return
    localStorage.setItem(`assessment_draft_${jobId}`, JSON.stringify(sections))
  }, [sections, jobId])
  useEffect(() => {
    if (!jobId) return
    const draft = localStorage.getItem(`assessment_draft_${jobId}`)
    if (draft) {
      setSections(JSON.parse(draft))
    }
  }, [jobId])

  const handleAddSection = useCallback(() => {
    const newSection = { ...initialSection, id: uuidv4() }
    setSections(prev => [...prev, newSection])
    setActiveSection(newSection.id)
  }, [])

  const handleUpdateSection = useCallback((sectionId, updates) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    ))
  }, [])

  const handleDeleteSection = useCallback((sectionId) => {
    setSections(prev => prev.filter(section => section.id !== sectionId))
    if (activeSection === sectionId) {
      setActiveSection(sections[0]?.id)
    }
  }, [activeSection, sections])

  const handleAddQuestion = useCallback((sectionId, type = QUESTION_TYPES.SHORT_TEXT) => {
    const newQuestion = { ...initialQuestion, id: uuidv4(), type }
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, questions: [...section.questions, newQuestion] }
        : section
    ))
  }, [])

  const handleUpdateQuestion = useCallback((sectionId, questionId, updates) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? {
            ...section,
            questions: section.questions.map(q =>
              q.id === questionId ? { ...q, ...updates } : q
            )
          }
        : section
    ))
  }, [])

  const handleDeleteQuestion = useCallback((sectionId, questionId) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? {
            ...section,
            questions: section.questions.filter(q => q.id !== questionId)
          }
        : section
    ))
  }, [])

  const handleMoveQuestion = useCallback((sectionId, dragIndex, hoverIndex) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section

      const questions = [...section.questions]
      const dragQuestion = questions[dragIndex]
      questions.splice(dragIndex, 1)
      questions.splice(hoverIndex, 0, dragQuestion)

      return { ...section, questions: questions }
    }))
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setSaveStatus(null) // clear any prior state
    try {
      await onSave(sections)
      setSaveStatus('saved')
    } catch (error) {
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }, [sections, onSave])

  const activeContent = sections.find(s => s.id === activeSection)

  return (
    <div className="assessment-builder dual-pane">
      <div className="builder-header">
        <h2>Assessment Builder</h2>
        <div className="header-actions">
          <button className="save-btn" onClick={handleSave} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save Assessment'}
          </button>
        </div>
      </div>
      {saveStatus === 'saved' && (
        <div className="save-banner success">Assessment saved!</div>
      )}
      {saveStatus === 'error' && (
        <div className="save-banner error">Failed to save assessment. Please try again.</div>
      )}
      <div className="builder-preview-row" style={{display:'flex', gap:32, alignItems:'flex-start', justifyContent:'stretch'}}>
        {/* Left: Builder UI */}
        <div className="builder-content" style={{ flex: 1 }}>
          <div className="sections-sidebar">
            <div className="sections-list">
              {sections.map(section => (
                <div 
                  key={section.id}
                  className={`section-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span>{section.title}</span>
                  {sections.length > 1 && (
                    <button
                      className="delete-section"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSection(section.id)
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button className="add-section-btn" onClick={handleAddSection}>Add Section</button>
          </div>
          {activeContent && (
            <div className="section-editor">
              <div className="section-header">
                <input
                  type="text"
                  value={activeContent.title}
                  onChange={e => handleUpdateSection(activeContent.id, { title: e.target.value })}
                  placeholder="Section Title"
                  className="section-title-input"
                />
                <textarea
                  value={activeContent.description}
                  onChange={e => handleUpdateSection(activeContent.id, { description: e.target.value })}
                  placeholder="Section Description (optional)"
                  className="section-description-input"
                />
              </div>
              <div className="questions-list">
                {activeContent.questions.map((question, index) => (
                  <QuestionBuilder
                    key={question.id}
                    question={question}
                    index={index}
                    sectionId={activeContent.id}
                    sections={sections}
                    onUpdate={(updates) => handleUpdateQuestion(activeContent.id, question.id, updates)}
                    onDelete={() => handleDeleteQuestion(activeContent.id, question.id)}
                    onMove={(dragIndex, hoverIndex) => 
                      handleMoveQuestion(activeContent.id, dragIndex, hoverIndex)
                    }
                  />
                ))}
              </div>
              <div className="add-question-menu">
                <button className="add-question-btn" onClick={() => setShowTypes(st => !st)}>
                  Add Question
                </button>
                {showTypes && (
                  <div className="question-types-menu">
                    {Object.entries(QUESTION_TYPES).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => {
                          handleAddQuestion(activeContent.id, value)
                          setShowTypes(false)
                        }}
                        className="question-type-btn"
                      >
                        {key.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                        ).join(' ')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Right: Live Preview UI */}
        <div className="dual-live-preview" style={{ minWidth:'350px', maxWidth:'50vw', flex: `0 0 ${previewWidth}%`, background:'#f7fafd', borderRadius:14, boxShadow:'0 2px 18px #175ce511', padding:'1.5em 1.2em', marginTop:12, border:'1.5px solid #e6eefb' }}>
          <AssessmentPreview
            jobId={jobId}
            sections={sections}
            onClose={() => {}}
            isLivePreview={true}
          />
        </div>
      </div>
    </div>
  )
}

export { QUESTION_TYPES }