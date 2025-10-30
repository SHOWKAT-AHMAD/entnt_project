import React, { useRef, useMemo } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { QUESTION_TYPES } from './AssessmentBuilder'
import './QuestionBuilder.css'

const QuestionBuilder = ({ 
  question, 
  index,
  sectionId,
  sections = [],
  onUpdate,
  onDelete,
  onMove
}) => {
  const ref = useRef(null)
  const addConditionRef = useRef(null)

  const [{ isDragging }, drag] = useDrag({
    type: 'QUESTION',
    item: { id: question.id, index },
    collect: monitor => ({
      isDragging: monitor.isDragging()
    })
  })

  const [{ handlerId }, drop] = useDrop({
    accept: 'QUESTION',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId()
      }
    },
    hover(item, monitor) {
      if (!ref.current) return
      const dragIndex = item.index
      const hoverIndex = index
      if (dragIndex === hoverIndex) return

      const hoverBoundingRect = ref.current?.getBoundingClientRect()
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      const clientOffset = monitor.getClientOffset()
      const hoverClientY = clientOffset.y - hoverBoundingRect.top

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return

      onMove(dragIndex, hoverIndex)
      item.index = hoverIndex
    }
  })

  drag(drop(ref))

  const renderQuestionTypeFields = () => {
    switch (question.type) {
      case QUESTION_TYPES.SINGLE_CHOICE:
      case QUESTION_TYPES.MULTI_CHOICE:
        return (
          <div className="options-container">
            {question.options.map((option, idx) => (
              <div key={idx} className="option-item">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...question.options]
                    newOptions[idx] = e.target.value
                    onUpdate({ options: newOptions })
                  }}
                />
                <button
                  onClick={() => {
                    const newOptions = question.options.filter((_, i) => i !== idx)
                    onUpdate({ options: newOptions })
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => onUpdate({ 
                options: [...question.options, ''] 
              })}
              className="add-option-btn"
            >
              Add Option
            </button>
          </div>
        )

      case QUESTION_TYPES.NUMERIC:
        return (
          <div className="numeric-range">
            <div className="range-input">
              <label>Min:</label>
              <input
                type="number"
                value={question.validation.min ?? ''}
                onChange={(e) => onUpdate({
                  validation: {
                    ...question.validation,
                    min: e.target.value ? Number(e.target.value) : null
                  }
                })}
              />
            </div>
            <div className="range-input">
              <label>Max:</label>
              <input
                type="number"
                value={question.validation.max ?? ''}
                onChange={(e) => onUpdate({
                  validation: {
                    ...question.validation,
                    max: e.target.value ? Number(e.target.value) : null
                  }
                })}
              />
            </div>
          </div>
        )

      case QUESTION_TYPES.SHORT_TEXT:
      case QUESTION_TYPES.LONG_TEXT:
        return (
          <div className="text-validation">
            <div className="validation-input">
              <label>Max Length:</label>
              <input
                type="number"
                value={question.validation.maxLength ?? ''}
                onChange={(e) => onUpdate({
                  validation: {
                    ...question.validation,
                    maxLength: e.target.value ? Number(e.target.value) : null
                  }
                })}
              />
            </div>
          </div>
        )

      case QUESTION_TYPES.FILE_UPLOAD:
        return (
          <div className="file-validation">
            <div className="validation-input">
              <label>Allowed Extensions:</label>
              <input
                type="text"
                placeholder="pdf,doc,docx"
                value={question.validation.allowedExtensions?.join(',') ?? ''}
                onChange={(e) => onUpdate({
                  validation: {
                    ...question.validation,
                    allowedExtensions: e.target.value.split(',').map(ext => ext.trim())
                  }
                })}
              />
            </div>
            <div className="validation-input">
              <label>Max File Size (MB):</label>
              <input
                type="number"
                value={question.validation.maxSize ?? ''}
                onChange={(e) => onUpdate({
                  validation: {
                    ...question.validation,
                    maxSize: e.target.value ? Number(e.target.value) : null
                  }
                })}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // compute eligible previous questions for conditional logic
  const eligibleQuestions = useMemo(() => {
    if (!Array.isArray(sections) || sections.length === 0) return []
    const list = []
    const sectionIndex = sections.findIndex(s => s.id === sectionId)
    if (sectionIndex === -1) return []

    for (let si = 0; si <= sectionIndex; si++) {
      const s = sections[si]
      const qs = Array.isArray(s.questions) ? s.questions : []
      if (si === sectionIndex) {
        qs.forEach((q, qi) => {
          if (qi < index && q.id !== question.id) {
            list.push({ ...q, sectionTitle: s.title })
          }
        })
      } else {
        qs.forEach(q => {
          if (q.id !== question.id) list.push({ ...q, sectionTitle: s.title })
        })
      }
    }

    return list
  }, [sections, sectionId, index, question.id])

  return (
    <div 
      ref={ref}
      className={`question-builder ${isDragging ? 'dragging' : ''}`}
      data-handler-id={handlerId}
    >
      <div className="question-header">
        <input
          type="text"
          value={question.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Question text"
          className="question-text-input"
        />
        <div className="question-controls">
          <label className="required-toggle">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
            />
            Required
          </label>
          <button className="delete-question" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      {renderQuestionTypeFields()}

      <div className="conditions-section">
        <h4>Conditional Display</h4>
        <div className="add-condition">
          <select
            ref={addConditionRef}
            defaultValue=""
            onChange={(e) => {
              const val = e.target.value
              if (!val) return
              const existing = Array.isArray(question.conditions) ? question.conditions.slice() : []
              existing.push({ questionId: val, operator: '===', value: '' })
              onUpdate({ conditions: existing })
              // reset the select to placeholder
              if (addConditionRef.current) addConditionRef.current.value = ''
            }}
          >
            <option value="">Add condition...</option>
            {eligibleQuestions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.sectionTitle ? `${q.sectionTitle} — ` : ''}{q.text ? q.text.slice(0, 80) : q.id}
              </option>
            ))}
          </select>
        </div>
        {question.conditions.map((condition, idx) => (
          <div key={idx} className="condition-item">
            <select
              value={condition.operator}
              onChange={(e) => {
                const newConditions = [...question.conditions]
                newConditions[idx] = { ...condition, operator: e.target.value }
                onUpdate({ conditions: newConditions })
              }}
            >
              <option value="===">=</option>
              <option value="!==">≠</option>
              <option value=">">&gt;</option>
              <option value="<">&lt;</option>
            </select>
            <input
              type="text"
              value={condition.value}
              onChange={(e) => {
                const newConditions = [...question.conditions]
                newConditions[idx] = { ...condition, value: e.target.value }
                onUpdate({ conditions: newConditions })
              }}
            />
            <button
              onClick={() => {
                const newConditions = question.conditions.filter((_, i) => i !== idx)
                onUpdate({ conditions: newConditions })
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default QuestionBuilder