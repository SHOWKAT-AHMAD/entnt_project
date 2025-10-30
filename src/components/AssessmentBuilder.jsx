import React, { useState, useCallback } from 'react'
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
  const [showPreview, setShowPreview] = useState(false)

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
    try {
      await onSave(sections)
    } catch (error) {
      console.error('Failed to save assessment:', error)
    }
  }, [sections, onSave])

  const activeContent = sections.find(s => s.id === activeSection)

  return (
    <div className="assessment-builder">
      <div className="builder-header">
        <h2>Assessment Builder</h2>
        <div className="header-actions">
          <button 
            className="preview-btn"
            onClick={() => setShowPreview(prev => !prev)}
          >
            {showPreview ? 'Back to Editor' : 'Preview'}
          </button>
          <button className="save-btn" onClick={handleSave}>
            Save Assessment
          </button>
        </div>
      </div>

      {showPreview ? (
        <AssessmentPreview
          jobId={jobId}
          sections={sections}
          onClose={() => setShowPreview(false)}
        />
      ) : (
        <div className="builder-content">
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
            <button className="add-section-btn" onClick={handleAddSection}>
              Add Section
            </button>
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
                <button className="add-question-btn">Add Question</button>
                <div className="question-types-menu">
                  {Object.entries(QUESTION_TYPES).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => handleAddQuestion(activeContent.id, value)}
                      className="question-type-btn"
                    >
                      {key.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                      ).join(' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export { QUESTION_TYPES }