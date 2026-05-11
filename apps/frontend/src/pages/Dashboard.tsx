import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Chrome from '../components/Chrome'
import { api } from '../lib/api'
import { getUser } from '../lib/auth'
import { fmtMoney, fmtDate } from '../lib/format'
import type { Policy, Claim, Invoice, Referral } from '../lib/types'

export default function Dashboard() {
  const user = getUser()
  const role = user?.role ?? 'PRODUCER'
  const navigate = useNavigate()

  const [policies, setPolicies] = useState<Policy[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api<Policy[]>('/api/policies'),
      api<Claim[]>('/api/claims'),
      api<Invoice[]>('/api/invoices'),
      api<Referral[]>('/api/referrals'),
    ])
      .then(([p, c, i, r]) => {
        setPolicies(p)
        setClaims(c)
        setInvoices(i)
        setReferrals(r)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // ---- KPI rows by persona ----
  function renderKpiRow() {
    if (role === 'ADJUSTER') {
      const openClaims = claims.filter((c) => c.status === 'Open').length
      const inReview = claims.filter((c) => c.status === 'In Review').length
      const totalReserve = claims.reduce((a, c) => a + parseFloat(c.reserve), 0)
      const totalPaid = claims.reduce((a, c) => a + parseFloat(c.paid), 0)
      return (
        <div className="kpi-row">
          <div className="kpi"><div className="label">Open Claims</div><div className="value">{openClaims}</div><div className="delta">+1 this week</div></div>
          <div className="kpi"><div className="label">In Review</div><div className="value">{inReview}</div></div>
          <div className="kpi"><div className="label">Total Reserves</div><div className="value">{fmtMoney(totalReserve)}</div></div>
          <div className="kpi"><div className="label">Paid YTD</div><div className="value">{fmtMoney(totalPaid)}</div></div>
        </div>
      )
    }

    if (role === 'POLICYHOLDER') {
      const myPolicy = policies[0]
      const myInvoice = invoices.find((i) => myPolicy && i.policyId === myPolicy.id && i.status !== 'Paid')
      return (
        <div className="kpi-row">
          <div className="kpi"><div className="label">Active Policies</div><div className="value">1</div><div className="delta">{myPolicy?.line ?? '—'}</div></div>
          <div className="kpi"><div className="label">Next Premium Installment</div><div className="value">{fmtMoney(myInvoice ? myInvoice.balance : '402')}</div><div className="delta">Due {fmtDate(myInvoice ? myInvoice.due : '2026-05-30')}</div></div>
          <div className="kpi"><div className="label">Open Claims</div><div className="value">1</div><div className="delta">CLM-77981 · Med Error</div></div>
          <div className="kpi"><div className="label">Docs Available</div><div className="value">7</div></div>
        </div>
      )
    }

    if (role === 'UNDERWRITER') {
      const inForce = policies.filter((p) => p.status === 'In Force').length
      const quoted = policies.filter((p) => p.status === 'Quoted').length
      const referred = policies.filter((p) => p.status === 'Referred').length
      const totalPremium = policies.reduce((a, p) => a + parseFloat(p.premium), 0)
      return (
        <div className="kpi-row">
          <div className="kpi"><div className="label">Policies In Force</div><div className="value">{inForce}</div><div className="delta">+2 this month</div></div>
          <div className="kpi"><div className="label">Quotes Open</div><div className="value">{quoted}</div></div>
          <div className="kpi"><div className="label">UW Referrals</div><div className="value">{referrals.length}</div><div className="delta down">{referred} pending bind</div></div>
          <div className="kpi"><div className="label">Written Premium</div><div className="value">{fmtMoney(totalPremium)}</div></div>
        </div>
      )
    }

    // AGENCY_ADMIN, PRODUCER, CSR — policy view
    const inForce = policies.filter((p) => p.status === 'In Force').length
    const openClaims = claims.filter((c) => c.status === 'Open' || c.status === 'In Review').length
    const totalPremium = policies.reduce((a, p) => a + parseFloat(p.premium), 0)
    const pastDue = invoices.filter((i) => i.status === 'Past Due').length
    return (
      <div className="kpi-row">
        <div className="kpi"><div className="label">Active Policies</div><div className="value">{inForce}</div><div className="delta">{policies.length} total</div></div>
        <div className="kpi"><div className="label">Open Claims</div><div className="value">{openClaims}</div><div className="delta">{claims.length} total</div></div>
        <div className="kpi"><div className="label">Total Written Premium</div><div className="value">{fmtMoney(totalPremium)}</div><div className="delta">across {policies.length} policies</div></div>
        <div className="kpi"><div className="label">Past-Due Invoices</div><div className="value" style={pastDue > 0 ? { color: '#7a1f1f' } : {}}>{pastDue}</div><div className={`delta${pastDue > 0 ? ' down' : ''}`}>{pastDue > 0 ? 'Action required' : 'All current'}</div></div>
      </div>
    )
  }

  // ---- Quick actions by persona ----
  function renderQuickActions() {
    const tile = (label: string, href: string) => (
      <button key={label} className="btn" style={{ minWidth: 160, textAlign: 'left', padding: '8px 12px' }} onClick={() => navigate(href)}>
        <strong>{label}</strong>
      </button>
    )
    if (role === 'ADJUSTER') {
      return [
        tile('File FNOL', '/fnol'),
        tile('My Diary', '/diary'),
        tile('Search Claims', '/claim-search'),
      ]
    }
    if (role === 'POLICYHOLDER') {
      return [
        tile('My Policy', '/my-policy'),
        tile('File a Claim', '/file-claim'),
        tile('Make a Payment', '/payment/'),
      ]
    }
    if (role === 'UNDERWRITER') {
      return [
        tile('Referral Queue', '/referrals'),
        tile('Policy Search', '/policy-search'),
        tile('UW Notes', '/uw-notes'),
      ]
    }
    return [
      tile('New Business Quote', '/new-business'),
      tile('Search Policies', '/policy-search'),
      tile('Referral Queue', '/referrals'),
      tile('Endorsement', '/endorsement'),
    ]
  }

  // ---- Workspace grid by persona ----
  function renderWorkspace() {
    if (role === 'ADJUSTER') {
      return (
        <>
          <div className="section-bar">My Active Claims</div>
          <div className="panel" style={{ borderTop: 'none' }}>
            <table className="gridview">
              <thead>
                <tr>
                  <th>Claim #</th><th>Insured</th><th>DOL</th><th>Cause</th>
                  <th>Severity</th><th className="num">Reserve</th><th className="num">Paid</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c) => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/claim/${c.id}`)}>
                    <td className="mono">{c.id}</td>
                    <td>{c.insured}</td>
                    <td>{fmtDate(c.dol)}</td>
                    <td>{c.cause}</td>
                    <td><span className={`pill ${c.severity === 'High' ? 'red' : c.severity === 'Medium' ? 'amber' : 'green'}`}>{c.severity}</span></td>
                    <td className="num">{fmtMoney(c.reserve)}</td>
                    <td className="num">{fmtMoney(c.paid)}</td>
                    <td><span className={`pill ${c.status === 'Open' ? 'red' : c.status === 'In Review' ? 'amber' : 'green'}`}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )
    }

    if (role === 'POLICYHOLDER') {
      const myPolicy = policies[0]
      return (
        <>
          <div className="section-bar">My Policies</div>
          <div className="panel" style={{ borderTop: 'none' }}>
            <table className="gridview">
              <thead>
                <tr>
                  <th>Policy #</th><th>Coverage</th><th>Effective</th><th>Expiration</th>
                  <th className="num">Annual Premium</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {myPolicy ? (
                  <tr>
                    <td className="mono">{myPolicy.id}</td>
                    <td>{myPolicy.line}</td>
                    <td>{fmtDate(myPolicy.effective)}</td>
                    <td>{fmtDate(myPolicy.expiration)}</td>
                    <td className="num">{fmtMoney(myPolicy.premium)}</td>
                    <td><span className={`pill ${myPolicy.status === 'In Force' ? 'green' : 'gray'}`}>{myPolicy.status}</span></td>
                    <td><button className="btn small" onClick={() => navigate('/my-policy')}>View</button></td>
                  </tr>
                ) : (
                  <tr><td colSpan={7} className="muted center">No policies found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )
    }

    if (role === 'UNDERWRITER') {
      return (
        <>
          <div className="section-bar">Referral Queue (Top 4)</div>
          <div className="panel" style={{ borderTop: 'none' }}>
            <table className="gridview">
              <thead>
                <tr>
                  <th>Referral #</th><th>Quote #</th><th>Insured</th><th>Line</th>
                  <th>State</th><th className="num">Premium</th><th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {referrals.slice(0, 4).map((r) => (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/referrals')}>
                    <td className="mono">{r.id}</td>
                    <td className="mono">{r.quoteId}</td>
                    <td>{r.insured}</td>
                    <td>{r.line}</td>
                    <td className="center">{r.state}</td>
                    <td className="num">{fmtMoney(r.premium)}</td>
                    <td><span className={`pill ${r.priority === 'Expedite' ? 'red' : 'gray'}`}>{r.priority}</span></td>
                  </tr>
                ))}
                {referrals.length === 0 && (
                  <tr><td colSpan={7} className="muted center">No referrals pending.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )
    }

    // Agent / admin / producer / CSR
    return (
      <>
        <div className="section-bar">My Recent Policies &amp; Quotes</div>
        <div className="panel" style={{ borderTop: 'none' }}>
          <table className="gridview">
            <thead>
              <tr>
                <th>Policy / Quote #</th><th>Insured</th><th>Line of Business</th>
                <th>State</th><th>Effective</th><th className="num">Premium</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {policies.slice(0, 6).map((p) => (
                <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/policy/${p.id}`)}>
                  <td className="mono">{p.id}</td>
                  <td>{p.insured}</td>
                  <td>{p.line}</td>
                  <td className="center">{p.state}</td>
                  <td>{fmtDate(p.effective)}</td>
                  <td className="num">{fmtMoney(p.premium)}</td>
                  <td>
                    <span className={`pill ${
                      p.status === 'In Force' ? 'green'
                        : p.status === 'Quoted' ? 'blue'
                        : p.status === 'Referred' ? 'amber'
                        : p.status === 'Pending Renewal' ? 'amber'
                        : 'gray'
                    }`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  const pageTitle =
    role === 'ADJUSTER' ? 'Assure Claims — Workspace'
    : role === 'POLICYHOLDER' ? 'Customer 360'
    : role === 'UNDERWRITER' ? 'Assure Policy — Workspace'
    : 'Agency Dashboard'

  return (
    <Chrome>
      <div className="crumbs">
        Home <span className="sep">&rsaquo;</span> <span>Dashboard</span>
      </div>
      <div className="pagetitle">
        {pageTitle}
        <span className="id">{user?.role} &middot; {user?.name}</span>
      </div>

      {error && (
        <div className="msg error" style={{ marginTop: 10 }}>
          <div className="title">Error loading data</div>
          {error}
        </div>
      )}

      {loading ? (
        <div className="msg info" style={{ marginTop: 10 }}>Loading…</div>
      ) : (
        <>
          <div style={{ marginTop: 12 }}>
            {renderKpiRow()}
          </div>

          <div className="section-bar" style={{ marginTop: 14 }}>Quick Actions</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 0' }}>
            {renderQuickActions()}
          </div>

          <div style={{ marginTop: 4 }}>
            {renderWorkspace()}
          </div>
        </>
      )}
    </Chrome>
  )
}
