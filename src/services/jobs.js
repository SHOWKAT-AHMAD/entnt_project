export async function fetchJobs({ search = '', status = '', page = 1, pageSize = 10 } = {}) {
  const params = new URLSearchParams({ search, status, page: String(page), pageSize: String(pageSize) })
  const res = await fetch(`/jobs?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch jobs')
  return res.json()
}

export async function createJob(payload) {
  try {
    console.log('Creating job with payload:', payload)
    
    // Ensure payload is properly formatted
    const formattedPayload = {
      ...payload,
      tags: Array.isArray(payload.tags) ? payload.tags : 
            typeof payload.tags === 'string' ? payload.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    }
    
    console.log('Formatted payload:', formattedPayload)
    
    const res = await fetch('/jobs', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formattedPayload)
    })
    
    console.log('Create job response status:', res.status)
    console.log('Response headers:', [...res.headers.entries()])
    
    const text = await res.text()
    console.log('Raw response:', text)
    
    let data
    try {
      data = text ? JSON.parse(text) : null
    } catch (e) {
      console.error('Failed to parse response:', e)
      throw new Error('Invalid response from server')
    }
    
    if (!res.ok) {
      throw new Error(data?.message || 'Failed to create job')
    }
    
    if (!data) {
      throw new Error('No data received from server')
    }
    
    return data
  } catch (error) {
    console.error('Create job error:', error)
    throw error
  }
}

export async function patchJob(id, payload) {
  const res = await fetch(`/jobs/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
  if (!res.ok) throw new Error('patch failed')
  return res.json()
}

export async function reorderJob(id, fromOrder, toOrder) {
  const res = await fetch(`/jobs/${id}/reorder`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ fromOrder, toOrder }) })
  if (!res.ok) {
    const err = await res.json().catch(()=>({message:'error'}))
    throw new Error(err.message || 'reorder failed')
  }
  return res.json()
}
