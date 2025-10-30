import { useState } from 'react'
import './AuthModal.css'

export default function LoginModal({ onClose, onSwitchToSignup }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulate login - in real app this would call an auth API
    try {
      if (email === 'hr@example.com' && password === 'demo123') {
        // For demo, just store in localStorage
        localStorage.setItem('user', JSON.stringify({ email, role: 'hr' }))
        onClose()
        window.location.reload() // Refresh to update auth state
      } else {
        throw new Error('Invalid credentials')
      }
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-box">
        <h2 className="auth-title">Login to TalentFlow</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <div className="form-row form-row--large">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>
          {error && (
            <div className="auth-error">{error}</div>
          )}
          <div className="auth-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
          <div className="auth-secondary">
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              New to TalentFlow?{' '}
              <button
                onClick={onSwitchToSignup}
                className="btn-link"
              >
                Create an account
              </button>
            </div>
            <div className="auth-note">
              Demo credentials: hr@example.com / demo123
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}