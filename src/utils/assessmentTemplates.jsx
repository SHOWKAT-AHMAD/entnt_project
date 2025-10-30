import { v4 as uuidv4 } from 'uuid'

const QUESTION_TYPES = {
  SINGLE_CHOICE: 'single_choice',
  MULTI_CHOICE: 'multi_choice',
  SHORT_TEXT: 'short_text',
  LONG_TEXT: 'long_text',
  NUMERIC: 'numeric',
  FILE_UPLOAD: 'file_upload'
}

const createSection = (title, description = '') => ({
  id: uuidv4(),
  title,
  description,
  questions: []
})

const createQuestion = (text, type, options = [], required = true, validation = {}, conditions = []) => ({
  id: uuidv4(),
  text,
  type,
  required,
  validation,
  options,
  conditions
})

export const fullStackAssessment = {
  sections: [
    {
      ...createSection(
        'Technical Knowledge',
        'This section assesses your understanding of fundamental programming concepts and web technologies.'
      ),
      questions: [
        createQuestion(
          'Which of the following best describes RESTful architecture?',
          QUESTION_TYPES.SINGLE_CHOICE,
          [
            'A stateless client-server architecture using HTTP methods',
            'A database management system',
            'A frontend framework',
            'A programming language'
          ]
        ),
        createQuestion(
          'Select all JavaScript array methods that do not mutate the original array:',
          QUESTION_TYPES.MULTI_CHOICE,
          [
            'map()',
            'filter()',
            'push()',
            'reduce()',
            'sort()',
            'concat()'
          ]
        ),
        createQuestion(
          'What is the time complexity of a binary search algorithm?',
          QUESTION_TYPES.SINGLE_CHOICE,
          [
            'O(log n)',
            'O(n)',
            'O(n log n)',
            'O(n²)'
          ]
        ),
        createQuestion(
          'Explain the concept of database indexing and its importance.',
          QUESTION_TYPES.LONG_TEXT,
          [],
          true,
          { maxLength: 500 }
        )
      ]
    },
    {
      ...createSection(
        'Coding Challenge',
        'Write code to solve the following problems.'
      ),
      questions: [
        createQuestion(
          'Implement a function to find the first non-repeating character in a string. Provide the complete function implementation in JavaScript.',
          QUESTION_TYPES.LONG_TEXT,
          [],
          true,
          { maxLength: 1000 }
        ),
        createQuestion(
          'How would you design a real-time chat application? Describe the architecture, technologies, and potential scaling considerations.',
          QUESTION_TYPES.LONG_TEXT,
          [],
          true,
          { maxLength: 1000 }
        ),
        createQuestion(
          'Rate your proficiency in the following technologies (1-5):',
          QUESTION_TYPES.NUMERIC,
          [],
          true,
          { min: 1, max: 5 }
        )
      ]
    },
    {
      ...createSection(
        'System Design',
        'Demonstrate your understanding of system architecture and design patterns.'
      ),
      questions: [
        createQuestion(
          'Upload a system design diagram for a social media platform:',
          QUESTION_TYPES.FILE_UPLOAD,
          [],
          true,
          { 
            maxSize: 5,
            allowedExtensions: ['jpg', 'png', 'pdf']
          }
        ),
        createQuestion(
          'What design patterns have you used in your projects? Explain with examples.',
          QUESTION_TYPES.LONG_TEXT,
          [],
          true,
          { maxLength: 800 }
        ),
        createQuestion(
          'How would you handle authentication and authorization in a microservices architecture?',
          QUESTION_TYPES.LONG_TEXT,
          [],
          true,
          { maxLength: 600 }
        )
      ]
    }
  ]
}

export const productManagerAssessment = {
  sections: [
    {
      ...createSection(
        'Product Strategy',
        'Evaluate strategic thinking and product vision.'
      ),
      questions: [
        createQuestion(
          'How do you prioritize features in a product backlog?',
          QUESTION_TYPES.LONG_TEXT,
          [],
          true,
          { maxLength: 500 }
        ),
        createQuestion(
          'Which metrics would you track for a B2B SaaS product?',
          QUESTION_TYPES.MULTI_CHOICE,
          [
            'Customer Acquisition Cost (CAC)',
            'Monthly Recurring Revenue (MRR)',
            'Net Promoter Score (NPS)',
            'Customer Lifetime Value (CLV)',
            'Churn Rate',
            'Feature Adoption Rate'
          ]
        ),
        createQuestion(
          'Describe a product you managed from conception to launch.',
          QUESTION_TYPES.LONG_TEXT,
          [],
          true,
          { maxLength: 1000 }
        )
      ]
    },
    {
      ...createSection(
        'User Research',
        'Demonstrate your approach to understanding user needs.'
      ),
      questions: [
        createQuestion(
          'Which user research methods do you prefer?',
          QUESTION_TYPES.MULTI_CHOICE,
          [
            'User Interviews',
            'Surveys',
            'A/B Testing',
            'Usage Analytics',
            'Usability Testing',
            'Focus Groups'
          ]
        ),
        createQuestion(
          'How do you validate product-market fit?',
          QUESTION_TYPES.LONG_TEXT,
          [],
          true,
          { maxLength: 600 }
        ),
        createQuestion(
          'Upload a sample product requirement document:',
          QUESTION_TYPES.FILE_UPLOAD,
          [],
          true,
          {
            maxSize: 10,
            allowedExtensions: ['pdf', 'doc', 'docx']
          }
        )
      ]
    },
    {
      ...createSection(
        'Problem Solving',
        'Analyze your approach to product challenges.'
      ),
      questions: [
        createQuestion(
          'How would you reduce customer churn for a subscription-based product?',
          QUESTION_TYPES.LONG_TEXT,
          [],
          true,
          { maxLength: 800 }
        ),
        createQuestion(
          'What steps would you take to internationalize a product?',
          QUESTION_TYPES.LONG_TEXT,
          [],
          true,
          { maxLength: 600 }
        ),
        createQuestion(
          'Rate the importance of these factors in product decisions (1-5):',
          QUESTION_TYPES.NUMERIC,
          [],
          true,
          { min: 1, max: 5 }
        )
      ]
    }
  ]
}

export const uiuxDesignerAssessment = {
  sections: [
    {
      ...createSection(
        'Design Principles',
        'Evaluate understanding of core design principles and best practices.'
      ),
      questions: [
        createQuestion(
          'Which design principles are most important for mobile interfaces?',
          QUESTION_TYPES.MULTI_CHOICE,
          [
            'Consistency',
            'Accessibility',
            'Visual Hierarchy',
            'Feedback',
            'Simplicity',
            'Progressive Disclosure'
          ]
        ),
        createQuestion(
          'Explain the concept of visual hierarchy and its importance.',
          QUESTION_TYPES.LONG_TEXT,
          [],
          true,
          { maxLength: 500 }
        ),
        createQuestion(
          'How do you ensure accessibility in your designs?',
          QUESTION_TYPES.LONG_TEXT,
          [],
          true,
          { maxLength: 600 }
        )
      ]
    },
    {
      ...createSection(
        'Design Process',
        'Share your approach to design challenges.'
      ),
      questions: [
        createQuestion(
          'Upload your portfolio or case study:',
          QUESTION_TYPES.FILE_UPLOAD,
          [],
          true,
          {
            maxSize: 20,
            allowedExtensions: ['pdf', 'zip']
          }
        ),
        createQuestion(
          'Describe your design process from research to implementation.',
          QUESTION_TYPES.LONG_TEXT,
          [],
          true,
          { maxLength: 800 }
        ),
        createQuestion(
          'Which design tools do you use regularly?',
          QUESTION_TYPES.MULTI_CHOICE,
          [
            'Figma',
            'Adobe XD',
            'Sketch',
            'InVision',
            'Principle',
            'Protopie'
          ]
        )
      ]
    },
    {
      ...createSection(
        'Practical Challenge',
        'Demonstrate your practical design skills.'
      ),
      questions: [
        createQuestion(
          'How would you redesign our product\'s onboarding experience?',
          QUESTION_TYPES.LONG_TEXT,
          [],
          true,
          { maxLength: 1000 }
        ),
        createQuestion(
          'What metrics do you use to measure design success?',
          QUESTION_TYPES.MULTI_CHOICE,
          [
            'User Engagement',
            'Task Completion Rate',
            'User Satisfaction Score',
            'Time on Task',
            'Error Rate',
            'Conversion Rate'
          ]
        ),
        createQuestion(
          'Rate your expertise in the following areas (1-5):',
          QUESTION_TYPES.NUMERIC,
          [],
          true,
          { min: 1, max: 5 }
        )
      ]
    }
  ]
}