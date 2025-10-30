import Dexie from 'dexie'

const db = new Dexie('TalentFlowDB')

// upgrade DB schema to add assessmentResponses store
db.version(1).stores({
  jobs: '++id,slug,title,status,tags,order',
  candidates: '++id,jobId,name,email,stage',
  assessments: 'jobId,questions'
})

db.version(2).stores({
  jobs: '++id,slug,title,status,tags,order',
  candidates: '++id,jobId,name,email,stage',
  assessments: 'jobId,questions',
  assessmentResponses: '++id,jobId,submittedAt'
})

// simple deterministic random helpers
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const STAGES = ['applied','screen','tech','offer','hired','rejected']

export async function ensureSeeded() {
  const jobsCount = await db.jobs.count()
  if (jobsCount > 0) return

  // Seed 25 jobs
  const tagsPool = ['frontend','backend','devops','design','product','qa']
  const jobs = []
  for (let i = 1; i <= 25; i++) {
    const title = `Job ${i} — ${['Engineer','Designer','Manager'][i%3]}`
    jobs.push({
      title,
      slug: slugify(title) + '-' + i,
      status: Math.random() < 0.8 ? 'active' : 'archived',
      tags: [tagsPool[i % tagsPool.length]],
      order: i
    })
  }
  await db.jobs.bulkAdd(jobs, {allKeys: true})

  // Seed 1000 candidates
  const names = ['Alex','Sam','Taylor','Jordan','Morgan','Casey','Riley','Jamie','Avery','Parker']
  const candidates = []
  for (let i = 1; i <= 1000; i++) {
    const name = `${names[randInt(0,names.length-1)]} ${String.fromCharCode(65 + (i%26))}.`;
    const email = `candidate${i}@example.com`
    const jobId = randInt(1, 25)
    const stage = STAGES[randInt(0, STAGES.length - 1)]
    candidates.push({name,email,jobId,stage})
  }
  await db.candidates.bulkAdd(candidates)

  // Seed 3 assessments (simple structure with 10 questions each)
  const assessments = []
  for (let j = 1; j <= 3; j++) {
    const questions = []
    for (let q = 1; q <= 10; q++) {
      questions.push({
        id: `q${q}`,
        label: `Question ${q} for assessment ${j}`,
        type: ['short','long','single','multi','numeric'][q % 5],
        required: q % 3 === 0
      })
    }
    assessments.push({jobId: j, questions})
  }
  for (const a of assessments) {
    await db.assessments.put(a)
  }
}

export default db
