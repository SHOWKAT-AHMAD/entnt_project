import { useState, useEffect } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import LoginModal from './LoginModal'
import SignupModal from './SignupModal'
import './Layout.css'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [user, setUser] = useState(null)
  const [initialAuthChecked, setInitialAuthChecked] = useState(false)
  const [isNavOpen, setIsNavOpen] = useState(false)

  // Initial auth check - run synchronously to avoid UI flash
  if (!initialAuthChecked) {
    const savedUser = localStorage.getItem('user')
    if (savedUser) setUser(JSON.parse(savedUser))
    setInitialAuthChecked(true)
  }

  // Ensure we pick up changes to localStorage after initial check
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) setUser(JSON.parse(savedUser))
  }, [initialAuthChecked])

  // Close mobile nav on route change
  useEffect(() => { setIsNavOpen(false) }, [location.pathname])

  // Protect routes except home
  useEffect(() => {
    const isHome = location.pathname === '/'
    if (!user && !isHome && initialAuthChecked) {
      setShowLogin(true)
    }
  }, [user, location.pathname, initialAuthChecked])

  // Update document title to reflect current page
  useEffect(() => {
    const p = location.pathname
    let page = 'Home'
    if (p.startsWith('/jobs')) page = 'Jobs'
    else if (p.startsWith('/candidates')) page = 'Candidates'
    else if (p.startsWith('/assessments')) page = 'Assessments'
    else if (p !== '/') {
      page = p.replace('/', '').split('/')[0]
      page = page.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    }
    document.title = `TalentFlow — ${page}`
  }, [location.pathname])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    navigate('/')
  }

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    setShowLogin(false)
    const isHome = location.pathname === '/'
    if (isHome) navigate('/jobs')
  }

  const switchToSignup = () => {
    setShowLogin(false)
    setShowSignup(true)
  }

  const switchToLogin = () => {
    setShowSignup(false)
    setShowLogin(true)
  }

  return (
    <div className="app-container">
      <header className="site-header">
        <div className={`header-inner ${isNavOpen ? 'mobile-open' : ''}`}>
          <Link to="/" className="site-brand">
            <img src="/logo.svg" alt="TalentFlow logo" style={{ width: 40, height: 40 }} />
            <h1 className="site-title">TalentFlow</h1>
          </Link>

          <button
            className={`nav-toggle ${isNavOpen ? 'open' : ''}`}
            aria-label="Toggle navigation"
            aria-expanded={isNavOpen}
            aria-controls="primary-navigation"
            type="button"
            onClick={() => setIsNavOpen(v => !v)}
          >
            <span className="nav-toggle-bar" />
            <span className="nav-toggle-bar" />
            <span className="nav-toggle-bar" />
          </button>

          <div className={`nav-block ${isNavOpen ? 'open' : ''}`} id="primary-navigation">
            <nav className="main-nav">
              {user && (
                <>
                  <Link to="/jobs" className={`nav-link ${location.pathname.startsWith('/jobs') ? 'active' : ''}`}>Jobs</Link>
                  <Link to="/candidates" className={`nav-link ${location.pathname.startsWith('/candidates') ? 'active' : ''}`}>Candidates</Link>
                  <Link to="/assessments" className={`nav-link ${location.pathname.startsWith('/assessments') ? 'active' : ''}`}>Assessments</Link>
                </>
              )}
            </nav>

            <div className="auth-row">
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <span className="user-email">{user.email}</span>
                  <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button onClick={() => setShowLogin(true)} className="login-btn">Login</button>
                  <button onClick={() => setShowSignup(true)} className="signup-btn">Sign Up</button>
                </div>
              )}
            </div>
          </div>
        </div>
        {isNavOpen && (
          <button className="nav-overlay" aria-label="Close navigation" onClick={() => setIsNavOpen(false)} />
        )}
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-col">
            <h3>TalentFlow</h3>
            <p style={{ fontSize: '0.9rem' }}>Streamline your hiring process with our comprehensive recruitment platform.</p>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/jobs">Jobs</Link></li>
              <li><Link to="/candidates">Candidates</Link></li>
              <li><Link to="/assessments">Assessments</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <div style={{ fontSize: '0.9rem' }}>
              <p style={{ marginBottom: '0.5rem' }}>Email: support@talentflow.com</p>
              <p>Phone: (555) 123-4567</p>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 TalentFlow. Built with care by the TalentFlow Team. For recruitment solutions and assistance, visit www.talentflow.com or email support@talentflow.com</p>
        </div>
      </footer>

      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onSwitchToSignup={switchToSignup} />
      )}

      {showSignup && (
        <SignupModal onClose={() => setShowSignup(false)} onSwitchToLogin={switchToLogin} />
      )}
    </div>
  )
}
