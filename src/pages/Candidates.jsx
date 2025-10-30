import React, { useEffect, useState } from 'react'
import './Candidates.css'
import { fetchCandidates } from '../services/candidates'
import CandidateCard from '../components/CandidateCard'
import '../components/CandidateCard.css'
import CandidatePipeline from '../components/CandidatePipeline'
import { useRef } from 'react'

export default function Candidates() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(false)
  const [page] = useState(1)
  const [total, setTotal] = useState(0)
  const [view, setView] = useState('pipeline') // 'list' or 'pipeline'
  const containerRef = useRef(null)
  const rowHeight = 76
  const [scrollTop, setScrollTop] = useState(0)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
      const res = await fetchCandidates({ page: 1, pageSize: 1000 })
        if (!mounted) return
        // keep full client-side list for virtualization and client-side search
        const items = res.items || []
        setCandidates(items)
        setTotal(items.length)
      } catch (e) {
        console.error('Failed to load candidates', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [page])

  return (
    <div className="candidates-page">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <h2 style={{ margin: 0 }}>Candidates</h2>
            <p className="muted" style={{ marginTop: 6 }}>Manage your candidate pipeline — list, filter, and review candidate profiles.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setView('pipeline')} className={view === 'pipeline' ? 'active' : ''}>Pipeline</button>
            <button onClick={() => setView('list')} className={view === 'list' ? 'active' : ''}>List</button>
          </div>
        </div>
      </div>

      {view === 'pipeline' ? (
        <CandidatePipeline />
      ) : (
        (loading ? (
          <div className="candidates-empty">Loading candidates…</div>
        ) : (
          <div>
            {candidates.length === 0 ? (
              <div className="candidates-empty">No candidates found.</div>
            ) : (
              <div>
                {/* Client-side search and stage filter */}
                <ListView
                  items={candidates}
                  rowHeight={rowHeight}
                  containerRef={containerRef}
                  scrollTop={scrollTop}
                  onScroll={(e) => setScrollTop(e.target.scrollTop)}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                  <div className="muted">Total: {total}</div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

function ListView({ items, rowHeight = 76, containerRef, scrollTop = 0, onScroll }) {
  const height = Math.min(600, window.innerHeight - 200)
  const total = items.length
  const visibleCount = Math.ceil(height / rowHeight) + 4
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 2)
  const endIndex = Math.min(total, startIndex + visibleCount)
  const slice = items.slice(startIndex, endIndex)

  return (
    <div style={{ height, overflow: 'auto' }} ref={containerRef} onScroll={onScroll}>
      <div style={{ height: total * rowHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: startIndex * rowHeight, left: 0, right: 0 }}>
          {slice.map(item => (
            <div key={item.id} style={{ height: rowHeight, boxSizing: 'border-box', padding: '8px 0' }}>
              <CandidateCard candidate={item} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
