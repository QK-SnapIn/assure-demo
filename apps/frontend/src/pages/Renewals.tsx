import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Chrome from '../components/Chrome'
import { api } from '../lib/api'
import { fmtMoney, fmtDate } from '../lib/format'
import type { Policy } from '../lib/types'

interface PolicyWithDays extends Policy {
  days: number
}

export default function Renewals() {
  const [renewing, setRenewing] = useState<PolicyWithDays[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api<Policy[]>('/api/policies')
      .then((data) => {
        const today = new Date()
        const withDays: PolicyWithDays[] = data
          .filter((p) => p.expiration)
          .map((p) => ({
            ...p,
            days: Math.round((new Date(p.expiration!).getTime() - today.getTime()) / 86400000),
          }))
          .sort((a, b) => a.days - b.days)
        setRenewing(withDays)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function daysPill(days: number) {
    if (days < 0) return <span className="pill red">Expired</span>
    if (days < 30) return <span className="pill red">Due in {days}d</span>
    if (days < 60) return <span className="pill amber">Due in {days}d</span>
    return <span className="pill green">In {days}d</span>
  }

  const due30 = renewing.filter((p) => p.days >= 0 && p.days < 30).length
  const due60 = renewing.filter((p) => p.days >= 0 && p.days < 60).length
  const renewalPremium = renewing.reduce(
    (a, p) => a + Math.round(parseFloat(p.premium) * 1.05 * 100) / 100,
    0
  )

  return (
    <Chrome>
      <div className="crumbs">
        Home <span className="sep">&rsaquo;</span>{' '}
        <a href="/dashboard">Assure Policy</a>{' '}
        <span className="sep">&rsaquo;</span> <span>Renewals</span>
      </div>
      <div className="pagetitle">
        Renewals Workspace
        <span className="id">WK-REN-001</span>
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
          <div className="kpi-row" style={{ marginTop: 12 }}>
            <div className="kpi">
              <div className="label">Due in 30 days</div>
              <div className="value">{due30}</div>
            </div>
            <div className="kpi">
              <div className="label">Due in 60 days</div>
              <div className="value">{due60}</div>
            </div>
            <div className="kpi">
              <div className="label">Renewal Premium (proj.)</div>
              <div className="value">{fmtMoney(renewalPremium)}</div>
            </div>
          </div>

          <div className="section-bar" style={{ marginTop: 14 }}>
            Upcoming Renewals — Healthcare Professional Liability
          </div>
          <table className="gridview">
            <thead>
              <tr>
                <th>Policy #</th>
                <th>Insured</th>
                <th>Line</th>
                <th>State</th>
                <th>Expires</th>
                <th>Status</th>
                <th className="num">Current Premium</th>
                <th className="num">Renewal Quote</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {renewing.length === 0 ? (
                <tr><td colSpan={9} className="muted center">No renewals in window.</td></tr>
              ) : (
                renewing.map((p) => (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/policy/${p.id}`)}>
                    <td className="mono">{p.id}</td>
                    <td>{p.insured}</td>
                    <td>{p.line}</td>
                    <td className="center">{p.state}</td>
                    <td>{fmtDate(p.expiration)}</td>
                    <td>{daysPill(p.days)}</td>
                    <td className="num">{fmtMoney(p.premium)}</td>
                    <td className="num">{fmtMoney(Math.round(parseFloat(p.premium) * 1.05 * 100) / 100)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn small primary"
                        onClick={() => alert(`Renewal quote drafted for ${p.id}.`)}
                      >
                        Renew
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="msg info" style={{ marginTop: 14 }}>
            <div className="title">Claims-Made Renewal Reminder</div>
            On renewal, the retroactive date must remain unchanged. Cancellation or non-renewal triggers a 60-day Extended Reporting Period (tail) option — see policy form for terms and pricing.
          </div>
        </>
      )}
    </Chrome>
  )
}
