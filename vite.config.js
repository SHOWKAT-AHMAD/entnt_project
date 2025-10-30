import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Mock data for development
const mockCandidates = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: `Test Candidate ${i + 1}`,
  email: `candidate${i + 1}@example.com`,
  stage: ['applied', 'screen', 'tech', 'offer', 'hired'][Math.floor(Math.random() * 4)],
  jobId: Math.floor(Math.random() * 3) + 1,
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
}))

const mockJobs = [
  { id: 1, title: 'Frontend Developer', department: 'Engineering' },
  { id: 2, title: 'Backend Developer', department: 'Engineering' },
  { id: 3, title: 'Product Manager', department: 'Product' }
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/candidates': {
        target: 'http://localhost:5173',
        configure: (proxy, options) => {
          proxy.on('error', (err, _req, _res) => {
            console.warn('proxy error', err)
          })
        },
        selfHandleResponse: true,
        handler: (req, res) => {
          // Add CORS headers
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
          
          if (req.method === 'OPTIONS') {
            res.writeHead(204)
            res.end()
            return
          }

          // Handle GET /candidates
          if (req.method === 'GET' && req.url.startsWith('/candidates')) {
            const url = new URL(req.url, 'http://localhost')
            const jobId = url.searchParams.get('jobId')
            const stage = url.searchParams.get('stage')
            const search = url.searchParams.get('search') || ''
            
            console.log('Handling GET /candidates with params:', { jobId, stage, search })
            
            let filtered = [...mockCandidates]
            
            if (jobId) {
              filtered = filtered.filter(c => String(c.jobId) === jobId)
            }
            if (stage) {
              filtered = filtered.filter(c => c.stage === stage)
            }
            if (search) {
              const searchLower = search.toLowerCase()
              filtered = filtered.filter(c => 
                c.name.toLowerCase().includes(searchLower) || 
                c.email.toLowerCase().includes(searchLower)
              )
            }
            
            console.log(`Returning ${filtered.length} candidates`)
            
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ 
              items: filtered,
              total: filtered.length
            }))
            return
          }

          // Handle PATCH /candidates/:id
          if (req.method === 'PATCH' && req.url.match(/\/candidates\/\d+/)) {
            const id = parseInt(req.url.split('/').pop())
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', () => {
              const update = JSON.parse(body)
              const candidate = mockCandidates.find(c => c.id === id)
              if (candidate) {
                Object.assign(candidate, update)
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(candidate))
              } else {
                res.writeHead(404)
                res.end('Candidate not found')
              }
            })
            return
          }

          // Handle GET /jobs
          if (req.method === 'GET' && req.url === '/jobs') {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ items: mockJobs }))
            return
          }

          res.writeHead(404)
          res.end('Not found')
        }
      },
      '/jobs': {
        target: 'http://localhost:5173',
        configure: (proxy, options) => {
          proxy.on('error', (err, _req, _res) => {
            console.warn('proxy error', err)
          })
        },
        selfHandleResponse: true,
        handler: (req, res) => {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ items: mockJobs }))
        }
      }
    }
  }
})
