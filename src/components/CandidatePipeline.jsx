import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { fetchCandidates, patchCandidate } from '../services/candidates'
import { fetchJobs } from '../services/jobs'
import CandidateCard from './CandidateCard'
import SkeletonCard from './SkeletonCard'
import ToastNotification from './ToastNotification'
import './CandidatePipeline.css'

const STAGES = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected']

const KEYBOARD_SHORTCUTS = {
  MOVE_RIGHT: ['ArrowRight'],
  MOVE_LEFT: ['ArrowLeft'],
  CANCEL: ['Escape']
}

function getNextStage(currentStage) {
  const currentIndex = STAGES.indexOf(currentStage)
  return currentIndex < STAGES.length - 1 ? STAGES[currentIndex + 1] : null
}

function getPreviousStage(currentStage) {
  const currentIndex = STAGES.indexOf(currentStage)
  return currentIndex > 0 ? STAGES[currentIndex - 1] : null
}

export default function CandidatePipeline() {
  const [columns, setColumns] = useState(() => STAGES.reduce((acc, s) => { acc[s] = []; return acc }, {}))
  const [loading, setLoading] = useState(() => STAGES.reduce((acc, s) => { acc[s] = false; return acc }, {}))
  const [hasMore, setHasMore] = useState(() => STAGES.reduce((acc, s) => { acc[s] = true; return acc }, {}))
  const [pages, setPages] = useState(() => STAGES.reduce((acc, s) => { acc[s] = 1; return acc }, {}))
  const [updatingIds, setUpdatingIds] = useState(new Set())
  const [jobs, setJobs] = useState([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [activeCardId, setActiveCardId] = useState(null)

  const updateCandidateNotes = useCallback(async (candidateId, notes) => {
    const stage = Object.keys(columns).find(stage => 
      columns[stage].some(c => c.id === candidateId)
    )
    if (!stage) return

    const candidate = columns[stage].find(c => c.id === candidateId)
    if (!candidate) return

    setUpdatingIds(s => new Set(s).add(candidateId))

    try {
      await patchCandidate(candidateId, { notes })
      
      setColumns(prev => ({
        ...prev,
        [stage]: prev[stage].map(c => 
          c.id === candidateId ? { ...c, notes } : c
        )
      }))

      setToast({
        message: 'Notes updated successfully',
        type: 'success'
      })
    } catch (err) {
      console.error('Failed to update notes', err)
      setToast({
        message: 'Failed to update notes. Please try again.',
        type: 'error'
      })
    } finally {
      setUpdatingIds(s => {
        const ns = new Set(s)
        ns.delete(candidateId)
        return ns
      })
    }
  }, [columns])

  // ✅ Create memoized map for fast candidate lookup
  const candidateMap = useMemo(() => {
    const map = new Map()
    STAGES.forEach(stage => {
      columns[stage]?.forEach(c => map.set(c.id, { ...c, stage }))
    })
    return map
  }, [columns])

  // ✅ Optimized updateCandidateStage using callback state updates
  const updateCandidateStage = useCallback(async (candidateId, from, to, index = 0) => {
    setColumns(prev => {
      const prevFrom = [...prev[from]]
      const prevTo = [...prev[to]]
      const moved = prevFrom.find(c => c.id === candidateId)
      if (!moved) return prev

      const newFrom = prevFrom.filter(c => c.id !== candidateId)
      const newTo = [...prevTo]
      newTo.splice(index, 0, { ...moved, stage: to })

      return { ...prev, [from]: newFrom, [to]: newTo }
    })

    setUpdatingIds(s => new Set(s).add(candidateId))

    try {
      await patchCandidate(candidateId, { stage: to })
      setUpdatingIds(s => {
        const ns = new Set(s)
        ns.delete(candidateId)
        return ns
      })
      setToast({ message: `Moved candidate to ${to.charAt(0).toUpperCase() + to.slice(1)} stage`, type: 'success' })
    } catch (err) {
      console.error('Failed to update candidate stage, rolling back', err)
      // Revert back
      setColumns(prev => {
        const fromCandidates = [...prev[from], candidateMap.get(candidateId)]
        const toCandidates = prev[to].filter(c => c.id !== candidateId)
        return { ...prev, [from]: fromCandidates, [to]: toCandidates }
      })
      setUpdatingIds(s => {
        const ns = new Set(s)
        ns.delete(candidateId)
        return ns
      })
      setToast({ message: 'Failed to move candidate. Please try again.', type: 'error' })
    }
  }, [candidateMap])

  const onDragEnd = useCallback((result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    const from = source.droppableId
    const to = destination.droppableId
    if (from === to) return
    const candidateId = Number(draggableId)
    updateCandidateStage(candidateId, from, to, destination.index)
  }, [updateCandidateStage])

  // ✅ Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      if (!activeCardId) return
      const candidate = candidateMap.get(Number(activeCardId))
      if (!candidate) return

      if (KEYBOARD_SHORTCUTS.MOVE_RIGHT.includes(e.key)) {
        const nextStage = getNextStage(candidate.stage)
        if (nextStage) updateCandidateStage(candidate.id, candidate.stage, nextStage)
      } else if (KEYBOARD_SHORTCUTS.MOVE_LEFT.includes(e.key)) {
        const prevStage = getPreviousStage(candidate.stage)
        if (prevStage) updateCandidateStage(candidate.id, candidate.stage, prevStage)
      } else if (KEYBOARD_SHORTCUTS.CANCEL.includes(e.key)) {
        setActiveCardId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeCardId, candidateMap, updateCandidateStage])

  // ✅ Load candidates for a given stage
  const loadCandidates = useCallback(async (stage) => {
    setLoading(prev => ({ ...prev, [stage]: true }))
    try {
      const res = await fetchCandidates({
        stage,
        jobId: selectedJobId,
        search,
        page: pages[stage],
        pageSize: 20
      })

      const items = res.items || []
      const hasMoreItems = items.length === 20

      setColumns(prev => ({
        ...prev,
        [stage]: pages[stage] === 1 ? items : [...prev[stage], ...items]
      }))
      setHasMore(prev => ({ ...prev, [stage]: hasMoreItems }))
    } catch (e) {
      console.error(`Failed to load candidates for ${stage}`, e)
      setToast({ message: `Failed to load candidates for ${stage} stage`, type: 'error' })
    } finally {
      setLoading(prev => ({ ...prev, [stage]: false }))
    }
  }, [selectedJobId, search, pages])

  // ✅ Load more when page changes
  useEffect(() => {
    STAGES.forEach(stage => loadCandidates(stage))
  }, [pages, loadCandidates])

  // ✅ Handle scroll (only sets page number)
  const handleScroll = useCallback((stage, e) => {
    const target = e.target
    if (!loading[stage] && hasMore[stage] &&
      target.scrollHeight - target.scrollTop <= target.clientHeight + 100
    ) {
      setPages(prev => ({ ...prev, [stage]: prev[stage] + 1 }))
    }
  }, [loading, hasMore])

  // ✅ Initial load of jobs
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetchJobs({ pageSize: 200 })
        if (mounted) setJobs(res.items || [])
      } catch (err) {
        console.error('Failed to load jobs', err)
      }
    })()
    return () => { mounted = false }
  }, [])

  // ✅ Reset and load candidates when filters change
  useEffect(() => {
    setPages(STAGES.reduce((acc, s) => { acc[s] = 1; return acc }, {}))
    setHasMore(STAGES.reduce((acc, s) => { acc[s] = true; return acc }, {}))
    setColumns(STAGES.reduce((acc, s) => { acc[s] = []; return acc }, {}))
  }, [selectedJobId, search])

  // ✅ Auto-hide toast after 3s
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  // Listen for external candidate creation to live-update pipeline
  useEffect(() => {
    function onCreated(e) {
      const c = e.detail
      if (!c || !c.id) return
      // Respect job filter
      if (selectedJobId && String(c.jobId) !== String(selectedJobId)) return
      const stage = (c.stage || 'applied')
      setColumns(prev => ({
        ...prev,
        [stage]: [c, ...(prev[stage] || [])]
      }))
    }
    window.addEventListener('candidate-created', onCreated)
    return () => window.removeEventListener('candidate-created', onCreated)
  }, [selectedJobId])

  return (
    <div className="candidate-pipeline">
      <div className="pipeline-header">
        <div className="pipeline-searchbar">
          <div className="search-wrapper">
            <input
              className="pipeline-search-input"
              type="text"
              placeholder="🔍 Search candidates by name or email"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <div className="search-info">
                {Object.values(columns).flat().length} results
              </div>
            )}
          </div>
        </div>

        <div className="pipeline-job-select">
          <label htmlFor="job-select">Job:</label>
          <select id="job-select" value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)}>
            <option value="">All jobs</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="pipeline-board">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="pipeline-columns">
            {STAGES.map(stage => (
              <Droppable droppableId={stage} key={stage}>
                {(provided) => (
                  <div className="pipeline-column" ref={provided.innerRef} {...provided.droppableProps}>
                    <div className="column-header">
                      {stage.charAt(0).toUpperCase() + stage.slice(1)}
                      <span className="count">{columns[stage]?.length}</span>
                    </div>
                    <div className="column-body" onScroll={e => handleScroll(stage, e)}>
                      {columns[stage]?.length === 0 && !loading[stage] ? (
                        <div className="empty-state">
                          {stage === 'rejected' ? 'No rejected candidates' : `No candidates in ${stage} stage`}
                        </div>
                      ) : (
                        <>
                          {columns[stage]?.map((c, idx) => (
                            <Draggable draggableId={String(c.id)} index={idx} key={c.id}>
                              {(prov) => (
                                <div
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  {...prov.dragHandleProps}
                                  tabIndex={0}
                                  className={activeCardId === String(c.id) ? 'focused' : ''}
                                  onFocus={() => setActiveCardId(String(c.id))}
                                  onBlur={() => setActiveCardId(null)}
                                >
                                  <CandidateCard
                                    candidate={c}
                                    updating={updatingIds.has(c.id)}
                                    jobTitle={jobs.find(j => j.id === c.jobId)?.title}
                                    onUpdateNotes={updateCandidateNotes}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {loading[stage] && (
                            <div className="loading-more">
                              <SkeletonCard />
                            </div>
                          )}
                        </>
                      )}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>

      {toast && <ToastNotification {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}
