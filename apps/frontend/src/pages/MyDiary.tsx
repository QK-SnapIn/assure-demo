import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Chrome from '../components/Chrome'
import { api } from '../lib/api'
import { getUser } from '../lib/auth'
import { fmtMoney, fmtDate } from '../lib/format'
import type { Claim } from '../lib/types'

interface DiaryEntry {
  id: string
  claimId: string
  subject: string
  dueDate: string
  status: 'Open' | 'Done'
  note: string
}

// Static mock diary entries
const MOCK_DIARY: DiaryEntry[] = [
  { id: 'D-001', claimId: 'CLM-77981', subject: 'Request medical records from Riverside Hospital', dueDate: '2026-05-15', status: 'Open', note: 'Follow up with risk mgr if no response by EOD.' },
  { id: 'D-002', claimId: 'CLM-77981', subject: 'Reserve review — Mediation scheduled', dueDate: '2026-05-22', status: 'Open', note: 'Confirm reserve adequacy before mediation session.' },
  { id: 'D-003', claimId: 'CLM-78142', subject: 'Expert witness retention letter', dueDate: '2026-05-10', status: 'Done', note: 'Dr. Patel engaged. Confirmation received.' },
  { id: 'D-004', claimId: 'CLM-78205', subject: 'ISO search results review', dueDate: '2026-05-08', status: 'Done', note: 'No prior claims found.' },
]

export default function MyDiary() {
  const user = getUser()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api<Claim[]>('/api/claims')
      .then((data) => {
        // Show all claims if adjuster, otherwise all
        setClaims(data)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const openClaims = claims.filter((c) => c.status === 'Open').length
  const inReview = claims.filter((c) => c.status === 'In Review').length
  const totalReserve = claims.reduce((a, c) => a + parseFloat(c.reserve), 0)

  const openDiary = MOCK_DIARY.filter((d) => d.status === 'Open').length

  function severityPill(s: string) {
    if (s === 'High') return <span className="pill red">High</span>
    if (s === 'Medium') return <span className="pill amber">Medium</span>
    return <span className="pill green">Low</span>
  }

  function statusPill(s: string) {
    if (s === 'Open') return <span className="pill red">Open</span>
    if (s === 'In Review') return <span className="pill amber">In Review</span>
    return <span className="pill green">Closed</span>
  }

  return (
    <Chrome>
      <div className="crumbs">
        Home <span className="sep">&rsaquo;</span>{' '}
        <a href="/dashboard">Assure Claims</a>{' '}
        <span className="sep">&rsaquo;</span> <span>My Diary</span>
      </div>
      <div className="pagetitle">
        My Claims Diary
        <span className="id">WK-CLM-DIARY-001</span>
      </div>

      {error && (
        <div className="msg error" style={{ marginTop: 10 }}>
          <div className="title">Error loading data</div>
          {error}
        </div>
      )}

      <div className="kpi-row" style={{ marginTop: 12 }}>
        <div className="kpi"><div className="label">Open Claims</div><div className="value">{openClaims}</div></div>
        <div className="kpi"><div className="label">In Review</div><div className="value">{inReview}</div></div>
        <div className="kpi"><div className="label">Reserves on My Desk</div><div className="value">{fmtMoney(totalReserve)}</div></div>
        <div className="kpi"><div className="label">Open Diary Items</div><div className="value">{openDiary}</div></div>
      </div>

      {/* Diary tasks */}
      <div className="section-bar" style={{ marginTop: 14 }}>Diary Tasks</div>
      <table className="gridview">
        <thead>
          <tr>
            <th>ID</th>
            <th>Claim #</th>
            <th>Subject</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Note</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {MOCK_DIARY.map((d) => (
            <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/claim/${d.claimId}`)}>
              <td className="mono">{d.id}</td>
              <td className="mono">{d.claimId}</td>
              <td>{d.subject}</td>
              <td>{fmtDate(d.dueDate)}</td>
              <td>
                <span className={`pill ${d.status === 'Open' ? 'amber' : 'green'}`}>{d.status}</span>
              </td>
              <td style={{ fontSize: 11 }}>{d.note}</td>
              <td onClick={(e) => e.stopPropagation()}>
                <button className="btn small" onClick={() => navigate(`/claim/${d.claimId}`)}>Open</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* My active claims */}
      <div className="section-bar" style={{ marginTop: 14 }}>My Active Claims</div>
      {loading ? (
        <div className="msg info" style={{ marginTop: 10 }}>Loading…</div>
      ) : (
        <table className="gridview">
          <thead>
            <tr>
              <th>Claim #</th>
              <th>Insured</th>
              <th>DOL</th>
              <th>Cause</th>
              <th>Severity</th>
              <th className="num">Reserve</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {claims.length === 0 ? (
              <tr><td colSpan={8} className="muted center">No claims assigned.</td></tr>
            ) : (
              claims.map((c) => (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/claim/${c.id}`)}>
                  <td className="mono">{c.id}</td>
                  <td>{c.insured}</td>
                  <td>{fmtDate(c.dol)}</td>
                  <td>{c.cause}</td>
                  <td>{severityPill(c.severity)}</td>
                  <td className="num">{fmtMoney(c.reserve)}</td>
                  <td>{statusPill(c.status)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button className="btn small" onClick={() => navigate(`/claim/${c.id}`)}>Open</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 10, fontSize: 11, color: '#888' }}>
        Logged in as: {user?.name ?? '—'} &middot; {user?.role}
      </div>
    </Chrome>
  )
}
