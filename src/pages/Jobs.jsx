import { useEffect, useState, useCallback, memo } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { fetchJobs, reorderJob, patchJob } from '../services/jobs'
import { Link } from 'react-router-dom'
import JobModal from '../components/JobModal'
import CandidateModal from '../components/CandidateModal'
import Spinner from '../components/Spinner'
import './Jobs.css'
import ToastNotification, { showGlobalToast } from '../components/ToastNotification'

export default function JobsPage() {
  const [jobs, setJobs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [showCandidateModal, setShowCandidateModal] = useState(false)
  const [applyJob, setApplyJob] = useState(null)
  const [updatingIds, setUpdatingIds] = useState([]) // track jobs currently updating (archive/unarchive)
  const [globalToast, setGlobalToast] = useState(null)

  const loadJobs = useCallback(() => {
    setLoading(true)
    fetchJobs({ search, status, page, pageSize }).then(data => {
      setJobs(data.items)
      setTotal(data.total)
    }).catch(() => {
      setJobs([])
    }).finally(() => setLoading(false))
  }, [search, status, page, pageSize])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  useEffect(() => {
    function onToast(e) {
      setGlobalToast(e.detail)
      setTimeout(() => setGlobalToast(null), e.detail?.duration || 3200)
    }
    window.addEventListener('global-toast', onToast)
    return () => window.removeEventListener('global-toast', onToast)
  }, [])

  const handleDragEnd = async (result) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destIndex = result.destination.index
    if (sourceIndex === destIndex) return

    const jobId = Number(result.draggableId)
    const job = jobs[sourceIndex]
    const fromOrder = job.order
    const toOrder = jobs[destIndex].order

    // optimistic update
    const newJobs = [...jobs]
    const [moved] = newJobs.splice(sourceIndex, 1)
    newJobs.splice(destIndex, 0, moved)
    setJobs(newJobs)

    try {
      await reorderJob(jobId, fromOrder, toOrder)
    } catch {
      // rollback on failure
      loadJobs()
    }
  }

  const handleCreateJob = () => {
    setEditingJob(null)
    setShowModal(true)
  }

  const handleEditJob = useCallback((job) => {
    setEditingJob(job)
    setShowModal(true)
  }, [])

  const handleApplyToJob = useCallback((job) => {
    setApplyJob(job)
    setShowCandidateModal(true)
  }, [])

  // listen for global apply event (used by JobContent to avoid prop drilling inside memo)
  useEffect(() => {
    const onApply = (e) => {
      handleApplyToJob(e.detail)
    }
    window.addEventListener('apply-to-job', onApply)
    return () => window.removeEventListener('apply-to-job', onApply)
  }, [handleApplyToJob])

  // Listen for created candidates to show message
  useEffect(() => {
    function onCreated(e) {
      showGlobalToast(`Applied to ${e?.detail?.jobId ? 'Job #' + e.detail.jobId : 'job'}`, 'success')
    }
    window.addEventListener('candidate-created', onCreated)
    return () => window.removeEventListener('candidate-created', onCreated)
  }, [])

  const handleSaveJob = () => {
    setShowModal(false)
    loadJobs()
  }

  const handleArchiveJob = useCallback(async (job) => {
    const prevStatus = job.status
    const newStatus = prevStatus === 'active' ? 'archived' : 'active'

    // mark as updating
    setUpdatingIds(prev => Array.from(new Set([...prev, job.id])))

    // optimistic update: only update the changed job
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: newStatus } : j))

    try {
      await patchJob(job.id, { status: newStatus })
    } catch (err) {
      // rollback on failure
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: prevStatus } : j))
      console.error('Failed to update job status', err)
    } finally {
      // remove updating flag
      setUpdatingIds(prev => prev.filter(id => id !== job.id))
    }
  }, [])

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {globalToast && <ToastNotification {...globalToast} onClose={() => setGlobalToast(null)} />}
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
        background: 'linear-gradient(96deg,#f7fbff 60%,#e6effa 94%)',
        borderRadius: '1rem',
        boxShadow: '0 2px 18px #175ce511',
        padding: '2.1rem 2.7rem 1.5rem 2.3rem',
        border: '1.5px solid #e4eaf5'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.35rem', letterSpacing: 0.01, fontWeight: 900, color: '#2071c5', textShadow:'0 1px 14px #2071c52a,0 1px #fff', lineHeight: 1.1 }}>Jobs</h1>
          <div style={{ color: '#5371ad', fontSize: 17, marginTop: 12, fontWeight: 500 }}>Manage open roles, candidates, and stages</div>
        </div>
        <div>
          <button onClick={handleCreateJob} style={{ backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '1.1em 1.5em', borderRadius: 10, fontWeight: 700, fontSize: '1.15em', boxShadow: '0 2px 10px #185ec731', transition: 'background 0.14s' }}>Create Job</button>
        </div>
      </div>

      {/* Top search bar */}
      <div className="jobs-topbar">
        <input
          autoFocus
          placeholder="Search title or tags (e.g. engineer, frontend, Job 1)"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          onKeyDown={e => { if (e.key === 'Enter') setPage(1) }}
          className="jobs-search-input"
        />
        <button onClick={() => { setSearch(''); setStatus(''); setPage(1) }} className="btn btn-ghost">Clear</button>
      </div>

      {/* Filter navbar */}
      <div className="jobs-filters" role="toolbar" aria-label="Job filters">
        <button
          className={`filter-btn ${status === '' ? 'filter-active' : ''}`}
          onClick={() => { setStatus(''); setPage(1) }}
        >
          All
        </button>
        <button
          className={`filter-btn ${status === 'active' ? 'filter-active' : ''}`}
          onClick={() => { setStatus('active'); setPage(1) }}
        >
          Active
        </button>
        <button
          className={`filter-btn ${status === 'archived' ? 'filter-active' : ''}`}
          onClick={() => { setStatus('archived'); setPage(1) }}
        >
          Archived
        </button>
        {search && <div className="filter-badge">Search: <strong>{search}</strong></div>}
      </div>

      <div className="jobs-list">
        {loading && (
          <div className="jobs-list-overlay">
            <Spinner />
          </div>
        )}
        <div>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="jobs">
              {(provided) => (
                <ul {...provided.droppableProps} ref={provided.innerRef}>
                  {jobs.map((j,index) => (
                    <Draggable key={j.id} draggableId={String(j.id)} index={index}>
                      {(provided) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="job-card"
                          style={{ ...provided.draggableProps.style }}
                        >
                          <JobContent job={j} onEdit={handleEditJob} onArchive={handleArchiveJob} updating={updatingIds.includes(j.id)} />
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>

          <div className="pagination-row">
            <div className="pagination-controls">
              <button className="page-btn prev" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>Prev</button>

              {/* Numeric pagination: show a window around current page */}
              {(() => {
                const totalPages = Math.max(1, Math.ceil(total / pageSize))
                const windowSize = 5
                let start = Math.max(1, page - Math.floor(windowSize/2))
                let end = Math.min(totalPages, start + windowSize - 1)
                if (end - start < windowSize - 1) start = Math.max(1, end - windowSize + 1)

                const buttons = []
                if (start > 1) buttons.push(
                  <button key={`p-1`} className="page-btn" onClick={()=>setPage(1)}>1</button>
                )
                if (start > 2) buttons.push(<span key="dots-start" className="page-dots">…</span>)

                for (let p = start; p <= end; p++) {
                  buttons.push(
                    <button key={`p-${p}`} className={`page-btn ${p===page? 'page-btn-active' : ''}`} onClick={()=>setPage(p)} disabled={p===page}>{p}</button>
                  )
                }

                if (end < totalPages-1) buttons.push(<span key="dots-end" className="page-dots">…</span>)
                if (end < totalPages) buttons.push(
                  <button key={`p-last`} className="page-btn" onClick={()=>setPage(totalPages)}>{totalPages}</button>
                )

                return buttons
              })()}

              <button className="page-btn next" onClick={()=>setPage(p=>p+1)} disabled={page >= Math.ceil(total / pageSize) || jobs.length===0}>Next</button>
            </div>

            <div className="pagination-meta">
              <span className="meta-text">Page {page} of {Math.max(1, Math.ceil(total / pageSize))} — {total} total</span>
              <label className="page-size-label">
                <span className="meta-text">Show</span>
                <select className="page-size-select" value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1) }}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <JobModal
          job={editingJob}
          onClose={() => setShowModal(false)}
          onSave={handleSaveJob}
        />
      )}

      {showCandidateModal && (
        <CandidateModal
          job={applyJob}
          onClose={() => setShowCandidateModal(false)}
          onApplied={() => { setShowCandidateModal(false); /* keep Jobs list unchanged */ }}
        />
      )}
    </div>
  )
}

const JobContent = memo(function JobContent({ job, onEdit, onArchive, updating }) {
  return (
    <>
      <div style={{ flex: 1, paddingRight: 120 }}>
        <Link to={`/jobs/${job.id}`} className="job-title"><strong>{job.title}</strong></Link>
        <div className="job-meta">slug: {job.slug} — status: {job.status} — tags: {(job.tags||[]).join(', ')}</div>
      </div>

      <div className="job-actions">
        <button className="btn btn-archive" onClick={() => onArchive(job)} disabled={updating}>
          {updating ? <span className="spinner" aria-hidden="true"></span> : null}
          {job.status === 'active' ? 'Archive' : 'Unarchive'}
        </button>
        <Link className="btn" to={`/jobs/${job.id}/assessment`}>
          {job.hasAssessment ? 'Edit Assessment' : 'Create Assessment'}
        </Link>
        {/* Apply button should trigger CandidateModal; see JobsPage for handler */}
        <button className="btn btn-primary" onClick={() => window.dispatchEvent(new CustomEvent('apply-to-job', { detail: job }))}>Apply</button>
      </div>

      {/* Floating edit badge restored */}
      <button
        className="edit-badge"
        onClick={() => onEdit(job)}
        disabled={updating}
        aria-label={`Edit ${job.title}`}
      >
        Edit
      </button>
    </>
  )
}, (prev, next) => {
  const pj = prev.job, nj = next.job
  const tagsEqual = JSON.stringify(pj.tags || []) === JSON.stringify(nj.tags || [])
  const updatingEqual = prev.updating === next.updating
  return pj.id === nj.id && pj.title === nj.title && pj.slug === nj.slug && pj.status === nj.status && tagsEqual && updatingEqual
})
