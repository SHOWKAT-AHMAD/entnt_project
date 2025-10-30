import { rest } from 'msw'
import db, { ensureSeeded } from '../db/index'

// artificial latency and occasional write errors
const randomLatency = () => 200 + Math.floor(Math.random() * 1000) // 200-1200ms
const maybeFail = (errRate = 0.08) => Math.random() < errRate

// helper to apply query params
function paginate(array, page = 1, pageSize = 10) {
  const p = Math.max(1, Number(page))
  const ps = Math.max(1, Number(pageSize))
  const total = array.length
  const start = (p - 1) * ps
  const items = array.slice(start, start + ps)
  return { items, total }
}

export const handlers = [
  // Jobs list
  rest.get('/jobs', async (req, res, ctx) => {
    await ensureSeeded()
    const search = req.url.searchParams.get('search') || ''
    const status = req.url.searchParams.get('status') || ''
    const page = req.url.searchParams.get('page') || '1'
    const pageSize = req.url.searchParams.get('pageSize') || '10'

    let all = await db.jobs.orderBy('order').toArray()
    if (search) {
      const s = search.toLowerCase()
      all = all.filter(j => j.title.toLowerCase().includes(s) || (j.tags||[]).some(t=>t.includes(s)))
    }
    if (status) {
      all = all.filter(j => j.status === status)
    }

    const { items, total } = paginate(all, page, pageSize)

    return res(
      ctx.delay(randomLatency()),
      ctx.status(200),
      ctx.json({ items, total })
    )
  }),

  // Get single job by id
  rest.get('/jobs/:id', async (req, res, ctx) => {
    await ensureSeeded()
    const { id } = req.params
    const job = await db.jobs.get(Number(id))
    if (!job) return res(ctx.delay(randomLatency()), ctx.status(404), ctx.json({message:'not found'}))
    return res(ctx.delay(randomLatency()), ctx.status(200), ctx.json(job))
  }),

  // Create job
  rest.post('/jobs', async (req, res, ctx) => {
    console.log('Mock handler: Creating job...')
    try {
      await ensureSeeded()
      
      let body
      try {
        body = await req.json()
        console.log('Received request body:', body)
      } catch (e) {
        console.error('Failed to parse request body:', e)
        return res(
          ctx.status(400),
          ctx.json({ message: 'Invalid request body' })
        )
      }
      
      // Validate required fields
      if (!body.title?.trim()) {
        return res(
          ctx.status(400),
          ctx.json({ message: 'Title is required' })
        )
      }
      
      if (!body.slug?.trim()) {
        return res(
          ctx.status(400),
          ctx.json({ message: 'Slug is required' })
        )
      }

      // Check for existing slug
      const exists = await db.jobs.where('slug').equals(body.slug).first()
      if (exists) {
        return res(
          ctx.status(400),
          ctx.json({ message: 'Slug already exists' })
        )
      }

      // Create the job
      const orderMax = await db.jobs.orderBy('order').last().then(r => r?.order || 0)
      const toAdd = {
        ...body,
        status: body.status || 'active',
        order: orderMax + 1,
        tags: body.tags ? (typeof body.tags === 'string' ? body.tags.split(',').map(t => t.trim()).filter(Boolean) : body.tags) : []
      }

      const id = await db.jobs.add(toAdd)
      const created = await db.jobs.get(id)
      console.log('Mock handler: Job created successfully', created)

      return res(
        ctx.delay(100),
        ctx.status(201),
        ctx.set('Content-Type', 'application/json'),
        ctx.body(JSON.stringify(created))
      )
    } catch (error) {
      console.error('Mock handler error:', error)
      return res(
        ctx.status(500),
        ctx.set('Content-Type', 'application/json'),
        ctx.body(JSON.stringify({ message: 'Internal server error', error: error.message }))
      )
    }
  }),

  // Patch job
  rest.patch('/jobs/:id', async (req, res, ctx) => {
    await ensureSeeded()
    const { id } = req.params
    const patch = await req.json()
    await db.jobs.update(Number(id), patch)
    const updated = await db.jobs.get(Number(id))
    return res(ctx.delay(randomLatency()), ctx.status(200), ctx.json(updated))
  }),

  // Reorder
  rest.patch('/jobs/:id/reorder', async (req, res, ctx) => {
    await ensureSeeded()
    const { id } = req.params
    const body = await req.json() // { fromOrder, toOrder }
    // occasional failure to test rollback
    if (maybeFail(0.08)) {
      return res(ctx.delay(randomLatency()), ctx.status(500), ctx.json({message: 'random reorder failure'}))
    }
    // naive reorder: shift other jobs accordingly
    const fromOrder = Number(body.fromOrder)
    const toOrder = Number(body.toOrder)
    if (fromOrder === toOrder) {
      return res(ctx.delay(randomLatency()), ctx.status(200), ctx.json({ok:true}))
    }
    const tx = db.transaction('rw', db.jobs, async () => {
      if (fromOrder < toOrder) {
        // decrement others between
        const between = await db.jobs.where('order').above(fromOrder).and(j => j.order <= toOrder).toArray()
        for (const b of between) {
          await db.jobs.update(b.id, { order: b.order - 1 })
        }
      } else {
        const between = await db.jobs.where('order').below(fromOrder).and(j => j.order >= toOrder).toArray()
        for (const b of between) {
          await db.jobs.update(b.id, { order: b.order + 1 })
        }
      }
      await db.jobs.update(Number(id), { order: toOrder })
    })
    await tx
    return res(ctx.delay(randomLatency()), ctx.status(200), ctx.json({ok:true}))
  })
,

  // Candidates list
  rest.get('/candidates', async (req, res, ctx) => {
    await ensureSeeded()
    const search = req.url.searchParams.get('search') || ''
    const stage = req.url.searchParams.get('stage') || ''
    const jobId = req.url.searchParams.get('jobId') || ''
    const page = req.url.searchParams.get('page') || '1'
    const pageSize = req.url.searchParams.get('pageSize') || '10'

  let all = await db.candidates.toArray()
  // server-side cap: never return more than 1000 candidates
  if (all.length > 1000) all = all.slice(0, 1000)
    if (search) {
      const s = search.toLowerCase()
      all = all.filter(c => c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s))
    }
    if (stage) all = all.filter(c => c.stage === stage)
    if (jobId) all = all.filter(c => String(c.jobId) === String(jobId))

    const { items, total } = paginate(all, page, pageSize)

    return res(ctx.delay(randomLatency()), ctx.status(200), ctx.json({ items, total }))
  }),

  // Get single candidate
  rest.get('/candidates/:id', async (req, res, ctx) => {
    await ensureSeeded()
    const { id } = req.params
    const c = await db.candidates.get(Number(id))
    if (!c) return res(ctx.delay(randomLatency()), ctx.status(404), ctx.json({ message: 'not found' }))
    return res(ctx.delay(randomLatency()), ctx.status(200), ctx.json(c))
  }),

  // Create candidate
  rest.post('/candidates', async (req, res, ctx) => {
    await ensureSeeded()
    let body
    try {
      body = await req.json()
    } catch (err) {
      console.error('Failed to parse candidate body', err)
      return res(ctx.status(400), ctx.json({ message: 'Invalid body' }))
    }
    const now = Date.now()
    const stage = body.stage || 'applied'
    const toAdd = {
      name: body.name || 'Unnamed Candidate',
      email: body.email || `candidate${Date.now()}@gmail.com`,
      jobId: body.jobId || 1,
      stage,
      history: [{ at: now, from: null, to: stage }],
      notes: []
    }
    const id = await db.candidates.add(toAdd)
    const created = await db.candidates.get(id)
    return res(ctx.delay(150), ctx.status(201), ctx.json(created))
  }),

  // Patch candidate
  rest.patch('/candidates/:id', async (req, res, ctx) => {
    await ensureSeeded()
    const { id } = req.params
    const patch = await req.json()
    // If stage change, append to history
    if (patch.stage !== undefined) {
      const cur = await db.candidates.get(Number(id))
      const now = Date.now()
      const from = cur?.stage || null
      const to = patch.stage
      const history = Array.isArray(cur?.history) ? cur.history.slice() : []
      history.push({ at: now, from, to })
      patch.history = history
    }
    await db.candidates.update(Number(id), patch)
    const updated = await db.candidates.get(Number(id))
    return res(ctx.delay(randomLatency()), ctx.status(200), ctx.json(updated))
  })
,

  // Add a note to candidate
  rest.post('/candidates/:id/notes', async (req, res, ctx) => {
    await ensureSeeded()
    const { id } = req.params
    let body
    try {
      body = await req.json()
    } catch {
      return res(ctx.status(400), ctx.json({ message: 'Invalid body' }))
    }
    const cur = await db.candidates.get(Number(id))
    if (!cur) return res(ctx.delay(randomLatency()), ctx.status(404), ctx.json({ message: 'not found' }))
    const notes = Array.isArray(cur.notes) ? cur.notes.slice() : []
    const note = { id: Date.now(), text: body.text || '', at: Date.now() }
    notes.push(note)
    await db.candidates.update(Number(id), { notes })
    await db.candidates.get(Number(id))
    return res(ctx.delay(100), ctx.status(201), ctx.json(note))
  })

  // Get assessment for a job
  ,rest.get('/api/assessments/:jobId', async (req, res, ctx) => {
    await ensureSeeded()
    const { jobId } = req.params
    const a = await db.assessments.get(Number(jobId))
    if (!a) {
      // default empty assessment
      return res(ctx.delay(randomLatency()), ctx.status(200), ctx.json({ sections: [] }))
    }
    return res(ctx.delay(randomLatency()), ctx.status(200), ctx.json(a))
  })

  // Save/replace assessment for a job
  ,rest.put('/api/assessments/:jobId', async (req, res, ctx) => {
    await ensureSeeded()
    const { jobId } = req.params
    const body = await req.json()
    // occasional failure for writes (5-10%)
    if (maybeFail(0.08)) {
      return res(ctx.delay(randomLatency()), ctx.status(500), ctx.json({ message: 'random write failure' }))
    }
    const toSave = { jobId: Number(jobId), ...body }
    await db.assessments.put(toSave)
    const saved = await db.assessments.get(Number(jobId))
    return res(ctx.delay(randomLatency()), ctx.status(200), ctx.json(saved))
  })

  // Submit assessment responses for a job
  ,rest.post('/api/assessments/:jobId/submit', async (req, res, ctx) => {
    await ensureSeeded()
    const { jobId } = req.params
    // Accept both JSON and FormData (files)
    let body
    try {
      body = await req.json()
    } catch (err) {
      try {
        // fallback for FormData: msw provides body as whatever, but we accept empty fallback
        body = { files: {}, fields: {} }
      } catch (e) {
        body = { }
      }
    }

    // occasional failure for submissions
    if (maybeFail(0.06)) {
      return res(ctx.delay(randomLatency()), ctx.status(500), ctx.json({ message: 'random submit failure' }))
    }

    const record = {
      jobId: Number(jobId),
      responses: body,
      submittedAt: Date.now()
    }
    const id = await db.assessmentResponses.add(record)
    const saved = await db.assessmentResponses.get(id)
    return res(ctx.delay(randomLatency()), ctx.status(201), ctx.json(saved))
  })

  // Get submissions for a job
  ,rest.get('/api/assessments/:jobId/submissions', async (req, res, ctx) => {
    await ensureSeeded()
    const { jobId } = req.params
    const all = await db.assessmentResponses.where('jobId').equals(Number(jobId)).toArray()
    // return newest first
    const items = (all || []).sort((a,b) => b.submittedAt - a.submittedAt)
    return res(ctx.delay(randomLatency()), ctx.status(200), ctx.json({ items, total: items.length }))
  })
]
