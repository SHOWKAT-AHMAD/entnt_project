import React from 'react'
import './SkeletonCard.css'

export default function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-main">
        <div className="skeleton-name"></div>
        <div className="skeleton-email"></div>
      </div>
      <div className="skeleton-meta">
        <div className="skeleton-stage"></div>
        <div className="skeleton-job"></div>
      </div>
    </div>
  )
}