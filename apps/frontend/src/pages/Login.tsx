import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { login } from '../lib/auth'
import type { User } from '../lib/types'

interface LoginResponse {
  token: string
  user: User
}

const PERSONAS = [
  { role: 'Agent (Megan Walters)', user: 'mwalters', pwd: 'Demo123!' },
  { role: 'Underwriter (David Chen)', user: 'dchen', pwd: 'Demo123!' },
  { role: 'Claims Adjuster (Linda Park)', user: 'lpark', pwd: 'Demo123!' },
  { role: 'Policyholder (Riverside Pharmacy)', user: 'riverside', pwd: 'Demo123!' },
]

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { token, user } = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        json: { username, password },
      })
      login(token, user)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function quickLogin(user: string, pwd: string) {
    setError(null)
    setLoading(true)
    try {
      const { token, user: u } = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        json: { username: user, password: pwd },
      })
      login(token, u)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1c3a66 0%, #2b4f81 50%, #4a76b8 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Top band */}
      <div
        className="topbar"
        style={{ width: '100%', position: 'fixed', top: 0, left: 0 }}
      >
        <div className="brand">
          ASSURE
          <span className="product">Suite for Healthcare Professional Liability</span>
        </div>
      </div>

      <div
        style={{
          marginTop: 80,
          width: 760,
          background: '#fff',
          border: '1px solid #0d2849',
          boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
        }}
      >
        {/* Left brand panel */}
        <div
          style={{
            background: 'linear-gradient(to bottom, #2b4f81 0%, #0d2849 100%)',
            color: '#fff',
            padding: '30px 26px',
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: 0.5 }}>ASSURE™</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>
            Suite for Healthcare Professional Liability
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.55, marginTop: 30, opacity: 0.92 }}>
            Integrated policy, claims, billing and<br />
            agency administration platform for<br />
            pharmacy, dental, veterinary, home<br />
            health &amp; senior living carriers.<br /><br />
            Powered by <strong>PMUW Assure</strong> — the leading
            admitted program for US healthcare
            professional liability.
          </div>
        </div>

        {/* Right form panel */}
        <div style={{ padding: '28px 30px 22px 30px' }}>
          <div style={{ fontSize: 16, color: '#1c3a66', marginBottom: 4, fontWeight: 600 }}>
            Sign in to your account
          </div>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 18 }}>
            Enter your network credentials. Session expires after 30 minutes of inactivity.
          </div>

          {error && (
            <div className="msg error" style={{ marginBottom: 12 }}>
              <div className="title">Sign-in failed</div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <table className="formgrid" style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td className="label required" style={{ width: 110 }}>User ID:</td>
                  <td className="field">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoFocus
                      required
                      style={{ width: '100%' }}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="label required">Password:</td>
                  <td className="field">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ width: '100%' }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #d4dae2', display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="submit"
                className="btn primary"
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
              <span style={{ fontSize: 10, color: '#888' }}>All passwords: Demo123!</span>
            </div>
          </form>

          {/* Quick personas */}
          <div
            style={{
              marginTop: 14,
              background: '#fffae6',
              border: '1px solid #d4b85a',
              padding: '10px 12px',
              fontSize: 11,
            }}
          >
            <div style={{ fontWeight: 700, color: '#6b4d00', marginBottom: 6, fontSize: 12 }}>
              Demo Credentials — click Sign in for one-click access
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 6 }}>
              <thead>
                <tr>
                  <th style={{ background: '#f0e3a8', textAlign: 'left', padding: '4px 6px', border: '1px solid #d4b85a', fontWeight: 600, color: '#4a3500' }}>Role</th>
                  <th style={{ background: '#f0e3a8', textAlign: 'left', padding: '4px 6px', border: '1px solid #d4b85a', fontWeight: 600, color: '#4a3500' }}>User ID</th>
                  <th style={{ background: '#f0e3a8', textAlign: 'left', padding: '4px 6px', border: '1px solid #d4b85a', fontWeight: 600, color: '#4a3500' }}>Password</th>
                  <th style={{ background: '#f0e3a8', textAlign: 'left', padding: '4px 6px', border: '1px solid #d4b85a', fontWeight: 600, color: '#4a3500' }}>Sign-in</th>
                </tr>
              </thead>
              <tbody>
                {PERSONAS.map((p) => (
                  <tr key={p.user}>
                    <td style={{ padding: '4px 6px', border: '1px solid #e3d18f', background: '#fff' }}>{p.role}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #e3d18f', background: '#fff' }}>
                      <code style={{ background: '#f7f3df', padding: '1px 5px', border: '1px solid #e3d18f', fontFamily: 'Consolas, monospace', color: '#1c3a66', fontWeight: 600 }}>{p.user}</code>
                    </td>
                    <td style={{ padding: '4px 6px', border: '1px solid #e3d18f', background: '#fff' }}>
                      <code style={{ background: '#f7f3df', padding: '1px 5px', border: '1px solid #e3d18f', fontFamily: 'Consolas, monospace', color: '#1c3a66', fontWeight: 600 }}>{p.pwd}</code>
                    </td>
                    <td style={{ padding: '4px 6px', border: '1px solid #e3d18f', background: '#fff' }}>
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: 10, padding: '2px 8px', background: '#1c3a66', border: '1px solid #0d2849', color: '#fff' }}
                        onClick={() => quickLogin(p.user, p.pwd)}
                        disabled={loading}
                      >
                        Sign in
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: 10, color: '#888' }}>All passwords are <code>Demo123!</code></div>
          </div>
        </div>
      </div>

      <div
        className="statusbar"
        style={{ width: '100%', position: 'fixed', bottom: 0, left: 0 }}
      >
        <span className="indicator" />
        PMUW Assure Demo
        <span className="spacer" />
        &copy; {new Date().getFullYear()} Pharmacists Mutual
      </div>
    </div>
  )
}
