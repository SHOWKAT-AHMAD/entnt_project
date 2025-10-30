// Simple candidates service wrapper
async function safeJson(res) {
  const txt = await res.text()
  try {
    return JSON.parse(txt)
  } catch {
    return null
  }
}

export async function fetchCandidates({ search = '', stage = '', jobId = '', page = 1, pageSize = 10 } = {}) {
  // Cap pageSize to 1000 to avoid loading excessive items
  const size = Math.min(Number(pageSize || 10), 1000)
  const qp = new URLSearchParams({ search, stage, jobId, page: String(page), pageSize: String(size) })
  const res = await fetch(`/candidates?${qp.toString()}`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Failed to fetch candidates')
  }
  return safeJson(res)
}

export async function getCandidate(id) {
  const res = await fetch(`/candidates/${id}`)
  if (!res.ok) throw new Error(await res.text())
  return safeJson(res)
}

export async function addCandidateNote(id, text) {
  const res = await fetch(`/candidates/${id}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })
  if (!res.ok) throw new Error(await res.text())
  return safeJson(res)
}

export async function createCandidate(payload) {
  const res = await fetch('/candidates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(await res.text())
  return safeJson(res)
}

export async function patchCandidate(id, patch) {
  const res = await fetch(`/candidates/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch)
  })
  if (!res.ok) throw new Error(await res.text())
  return safeJson(res)
}
