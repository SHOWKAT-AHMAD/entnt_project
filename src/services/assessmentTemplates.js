import { 
  fullStackAssessment, 
  productManagerAssessment, 
  uiuxDesignerAssessment 
} from '../utils/assessmentTemplates.jsx'

const TEMPLATE_MAP = {
  'full-stack-developer': fullStackAssessment,
  'product-manager': productManagerAssessment,
  'ui-ux-designer': uiuxDesignerAssessment
}

export const applyAssessmentTemplate = async (jobId, templateType) => {
  try {
    const template = TEMPLATE_MAP[templateType]
    if (!template) {
      throw new Error('Invalid template type')
    }
    
    // Save the template as the job's assessment
    localStorage.setItem(`assessment_${jobId}`, JSON.stringify(template))
    return template
  } catch (error) {
    console.error('Error applying assessment template:', error)
    throw error
  }
}