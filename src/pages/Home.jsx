import { useState, useEffect } from 'react'
import './Home.css'
import { Link, useNavigate } from 'react-router-dom'
import LoginModal from '../components/LoginModal'
import SignupModal from '../components/SignupModal'

export default function Home() {
  const navigate = useNavigate()
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleGetStarted = () => {
    if (user) {
      navigate('/jobs')
    } else {
      setShowSignup(true)
    }
  }

  const handleSwitchToLogin = () => {
    setShowSignup(false)
    setShowLogin(true)
  }

  const handleSwitchToSignup = () => {
    setShowLogin(false)
    setShowSignup(true)
  }

  const handleAuthSuccess = (userData) => {
    setUser(userData)
    navigate('/jobs')
  }
  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <img src="/logo.svg" alt="TalentFlow logo" className="hero-logo" />
        <h1 className="hero-title">Welcome to TalentFlow</h1>
        <p className="hero-desc">Your complete recruitment platform. Streamline hiring, evaluate candidates, and make better hiring decisions with our comprehensive suite of tools.</p>
        <div className="cta-row">
          <button onClick={handleGetStarted} className="cta-btn">Get Started</button>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="features-title">Why Choose TalentFlow?</h2>
        <div className="features-grid">
          <FeatureCard
            title="Streamlined Workflow"
            description="All your recruitment tools in one place. From job posting to final hiring decision."
          />
          <FeatureCard
            title="Data-Driven Decisions"
            description="Make informed choices with comprehensive candidate assessments and analytics."
          />
          <FeatureCard
            title="Collaborative Hiring"
            description="Work together efficiently with your entire hiring team in a unified platform."
          />
        </div>
      </section>

      {/* Process Section */}
      <section className="process-section">
        <div className="process-container">
          <h2 className="process-title">A Better Way to Hire</h2>
          <div className="process-list">
            <ProcessStep
              number="1"
              title="Efficient Management"
              description="Organize your entire recruitment process in one place. Track progress, set reminders, and never miss an update."
            />
            <ProcessStep
              number="2"
              title="Quality Assessment"
              description="Use custom evaluation tools to thoroughly assess candidates and ensure the right fit for your team."
            />
            <ProcessStep
              number="3"
              title="Smart Collaboration"
              description="Work seamlessly with hiring managers, recruiters, and team members to make collective decisions."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2 className="cta-title">Ready to Transform Your Hiring?</h2>
        <p className="cta-desc">Join leading companies using TalentFlow to build great teams.</p>
        <button onClick={handleGetStarted} className="cta-btn">Get Started Now</button>
      </section>

      {showLogin && (
        <LoginModal 
          onClose={() => setShowLogin(false)}
          onLogin={handleAuthSuccess}
          onSignupClick={handleSwitchToSignup}
        />
      )}
      
      {showSignup && (
        <SignupModal 
          onClose={() => setShowSignup(false)}
          onSignup={handleAuthSuccess}
          onLoginClick={handleSwitchToLogin}
        />
      )}
    </div>
  )
}

function FeatureCard({ title, description }) {
  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '2rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      height: '100%'
    }}>
      <h3 style={{ marginBottom: '1rem' }}>{title}</h3>
      <p style={{ color: 'var(--text-light)' }}>{description}</p>
    </div>
  )
}

function ProcessStep({ number, title, description }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      gap: '1.5rem',
      alignItems: 'start'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: 'var(--primary-color)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        fontWeight: 'bold'
      }}>
        {number}
      </div>
      <div>
        <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
        <p style={{ color: 'var(--text-light)' }}>{description}</p>
      </div>
    </div>
  )
}

function StatCard({ number, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: '2.5rem',
        fontWeight: 'bold',
        color: 'var(--primary-color)',
        marginBottom: '0.5rem'
      }}>
        {number}
      </div>
      <div style={{ color: 'var(--text-light)' }}>{label}</div>
    </div>
  )
}

function StepCard({ number, title, description }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '2rem',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: 'var(--primary-color)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1rem',
        fontSize: '1.2rem',
        fontWeight: 'bold'
      }}>
        {number}
      </div>
      <h3 style={{ marginBottom: '1rem' }}>{title}</h3>
      <p style={{ color: 'var(--text-light)' }}>{description}</p>
    </div>
  )
}

