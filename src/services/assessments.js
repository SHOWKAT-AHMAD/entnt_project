// API service for managing assessments

export const fetchCandidateTimeline = async (candidateId) => {
  try {
    const response = await fetch(`/api/candidates/${candidateId}/timeline`)
    if (!response.ok) throw new Error('Failed to fetch candidate timeline')
    return await response.json()
  } catch (error) {
    console.error('Error fetching candidate timeline:', error)
    throw error
  }
}

// Check if assessment exists for a job
export const checkAssessment = async (jobId) => {
  try {
    const res = await fetch(`/api/assessments/${jobId}`)
    if (!res.ok) return false
    const data = await res.json()
    return !!(data && data.sections && data.sections.length > 0)
  } catch {
    return false
  }
}

export const fetchAssessment = async (jobId) => {
  try {
    const res = await fetch(`/api/assessments/${jobId}`)
    if (!res.ok) {
      throw new Error('Failed to fetch assessment')
    }
    const data = await res.json()
    return data
  } catch {
    // fallback default
    return { sections: [] }
  }
}

export const saveAssessment = async (jobId, assessmentData) => {
  try {
    const res = await fetch(`/api/assessments/${jobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assessmentData)
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to save assessment')
    }
    return await res.json()
  } catch (error) {
    console.error('Error saving assessment:', error)
    throw error
  }
}

export const submitAssessment = async (jobId, responses) => {
  try {
    const response = await fetch(`/api/assessments/${jobId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responses)
    })
    if (!response.ok) throw new Error('Failed to submit assessment')
    return await response.json()
  } catch (error) {
    console.error('Error submitting assessment:', error)
    throw error
  }
}

export const fetchSubmissions = async (jobId) => {
  try {
    const res = await fetch(`/api/assessments/${jobId}/submissions`)
    if (!res.ok) throw new Error('Failed to fetch submissions')
    return await res.json()
  } catch (err) {
    console.error('Error fetching submissions:', err)
    throw err
  }
}

// Utility function to prepare form data for file uploads
export const prepareFormData = (responses) => {
  const formData = new FormData()
  
  // Iterate through responses and handle file uploads
  Object.entries(responses).forEach(([questionId, response]) => {
    if (response instanceof File) {
      formData.append(questionId, response)
    } else {
      formData.append(questionId, JSON.stringify(response))
    }
  })
  
  return formData
}

// Submit assessment with file uploads
export const submitAssessmentWithFiles = async (jobId, responses) => {
  try {
    const formData = prepareFormData(responses)
    
    const response = await fetch(`/api/assessments/${jobId}/submit`, {
      method: 'POST',
      body: formData // FormData automatically sets the correct Content-Type
    })
    
    if (!response.ok) throw new Error('Failed to submit assessment')
    return await response.json()
  } catch (error) {
    console.error('Error submitting assessment:', error)
    throw error
  }
}