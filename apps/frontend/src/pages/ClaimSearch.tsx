import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Chrome from '../components/Chrome'
import { api } from '../lib/api'
import { fmtMoney, fmtDate } from '../lib/format'
import type { Claim } from '../lib/types'

export default function ClaimSearch() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [filtered, setFiltered] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchClaim, setSearchClaim] = useState('')
  const [searchPolicy, setSearchPolicy] = useState('')
  const [searchInsured, setSearchInsured] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dolFrom, setDolFrom] = useState('')
  const [dolTo, setDolTo] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    api<Claim[]>('/api/claims')
      .then((data) => {
        setClaims(data)
        setFiltered(data)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function doSearch() {
    const clLower = searchClaim.toLowerCase()
    const polLower = searchPolicy.toLowerCase()
    const insLower = searchInsured.toLowerCase()
    setFiltered(
      claims.filter((c) => {
        if (clLower && !c.id.toLowerCase().includes(clLower)) return false
        if (polLower && !c.policyId.toLowerCase().includes(polLower)) return false
        if (insLower && !c.insured.toLowerCase().includes(insLower)) return false
        if (statusFilter && c.status !== statusFilter) return false
        if (dolFrom && c.dol < dolFrom) return false
        if (dolTo && c.dol > dolTo) return false
        return true
      })
    )
  }

  function clear() {
    setSearchClaim('')
    setSearchPolicy('')
    setSearchInsured('')
    setStatusFilter('')
    setDolFrom('')
    setDolTo('')
    setFiltered(claims)
  }

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
        <span className="sep">&rsaquo;</span> <span>Claim Search</span>
      </div>
      <div className="pagetitle">
        Claim Search
        <span className="id">WK-CLM-SRCH-001</span>
      </div>

      {error && (
        <div className="msg error" style={{ marginTop: 10 }}>
          <div className="title">Error loading data</div>
          {error}
        </div>
      )}

      <div className="panel">
        <div className="section-bar">Search Criteria</div>
        <div className="panel-body">
          <table className="formgrid">
            <tbody>
              <tr>
                <td className="label">Claim #:</td>
                <td className="field">
                  <input type="text" placeholder="CLM-77981" value={searchClaim} onChange={(e) => setSearchClaim(e.target.value)} />
                </td>
                <td className="label">Policy #:</td>
                <td className="field">
                  <input type="text" placeholder="PMP-PH-210441" value={searchPolicy} onChange={(e) => setSearchPolicy(e.target.value)} />
                </td>
              </tr>
              <tr>
                <td className="label">Insured:</td>
                <td className="field">
                  <input type="text" value={searchInsured} onChange={(e) => setSearchInsured(e.target.value)} />
                </td>
                <td className="label">Status:</td>
                <td className="field">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">— Any —</option>
                    <option>Open</option>
                    <option>In Review</option>
                    <option>Closed</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td className="label">DOL From:</td>
                <td className="field">
                  <input type="date" value={dolFrom} onChange={(e) => setDolFrom(e.target.value)} />
                </td>
                <td className="label">DOL To:</td>
                <td className="field">
                  <input type="date" value={dolTo} onChange={(e) => setDolTo(e.target.value)} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="toolbar">
          <button className="btn primary" onClick={doSearch}>Search</button>
          <button className="btn" onClick={clear}>Clear</button>
          <span className="spacer" />
          <button className="btn primary" onClick={() => navigate('/fnol')}>File New FNOL</button>
        </div>
      </div>

      {loading ? (
        <div className="msg info" style={{ marginTop: 10 }}>Loading…</div>
      ) : (
        <>
          <div className="section-bar">Results</div>
          <table className="gridview">
            <thead>
              <tr>
                <th>Claim #</th>
                <th>Insured</th>
                <th>Policy #</th>
                <th>DOL</th>
                <th>Cause</th>
                <th>Severity</th>
                <th className="num">Reserve</th>
                <th className="num">Paid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="muted center">No claims match the criteria.</td></tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/claim/${c.id}`)}>
                    <td className="mono">{c.id}</td>
                    <td>{c.insured}</td>
                    <td className="mono">{c.policyId}</td>
                    <td>{fmtDate(c.dol)}</td>
                    <td>{c.cause}</td>
                    <td>{severityPill(c.severity)}</td>
                    <td className="num">{fmtMoney(c.reserve)}</td>
                    <td className="num">{fmtMoney(c.paid)}</td>
                    <td>{statusPill(c.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}
    </Chrome>
  )
}
