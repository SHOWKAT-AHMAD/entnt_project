import React, { useEffect } from 'react'
import './ToastNotification.css'

export default function ToastNotification({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  return (
    <div className={`toast-notification ${type}`}>
      <div className="toast-content">
        {type === 'success' && <span className="toast-icon">✓</span>}
        {type === 'error' && <span className="toast-icon">⚠</span>}
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  )
}

export function showGlobalToast(message, type = 'error', duration = 3200) {
  try {
    window.dispatchEvent(new CustomEvent('global-toast', { detail: { message, type, duration } }))
  } catch {}
}