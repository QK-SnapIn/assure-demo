import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Chrome from '../components/Chrome'
import { api } from '../lib/api'
import { fmtMoney, fmtDate } from '../lib/format'
import type { Policy } from '../lib/types'

export default function PolicySearch() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [lines, setLines] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [filtered, setFiltered] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchId, setSearchId] = useState('')
  const [searchInsured, setSearchInsured] = useState('')
  const [lineFilter, setLineFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api<Policy[]>('/api/policies'),
      api<string[]>('/api/lookups/lines'),
      api<string[]>('/api/lookups/states'),
    ])
      .then(([p, l, s]) => {
        setPolicies(p)
        setLines(l)
        setStates(s)
        setFiltered(p)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function doSearch() {
    const idLower = searchId.toLowerCase()
    const insuredLower = searchInsured.toLowerCase()
    setFiltered(
      policies.filter((p) => {
        if (idLower && !p.id.toLowerCase().includes(idLower)) return false
        if (insuredLower && !p.insured.toLowerCase().includes(insuredLower) && !(p.dba ?? '').toLowerCase().includes(insuredLower)) return false
        if (lineFilter && p.line !== lineFilter) return false
        if (stateFilter && p.state !== stateFilter) return false
        if (statusFilter && p.status !== statusFilter) return false
        return true
      })
    )
  }

  function clear() {
    setSearchId('')
    setSearchInsured('')
    setLineFilter('')
    setStateFilter('')
    setStatusFilter('')
    setFiltered(policies)
  }

  function statusPill(s: string) {
    if (s === 'In Force') return <span className="pill green">In Force</span>
    if (s === 'Quoted') return <span className="pill blue">Quoted</span>
    if (s === 'Referred') return <span className="pill amber">Referred</span>
    if (s === 'Pending Renewal') return <span className="pill amber">Pending Renewal</span>
    return <span className="pill gray">{s}</span>
  }

  return (
    <Chrome>
      <div className="crumbs">
        Home <span className="sep">&rsaquo;</span>{' '}
        <a href="/dashboard">Assure Policy</a>{' '}
        <span className="sep">&rsaquo;</span> <span>Policy Search</span>
      </div>
      <div className="pagetitle">
        Policy Search
        <span className="id">WK-POL-SRCH-001</span>
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
                <td className="label">Policy / Quote #:</td>
                <td className="field">
                  <input type="text" placeholder="PMP-PH-210441" value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                </td>
                <td className="label">Insured Name / DBA:</td>
                <td className="field">
                  <input type="text" placeholder="Riverside Community Pharmacy" value={searchInsured} onChange={(e) => setSearchInsured(e.target.value)} />
                </td>
              </tr>
              <tr>
                <td className="label">Line of Business:</td>
                <td className="field">
                  <select value={lineFilter} onChange={(e) => setLineFilter(e.target.value)}>
                    <option value="">— Any —</option>
                    {lines.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </td>
                <td className="label">State:</td>
                <td className="field">
                  <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
                    <option value="">— Any —</option>
                    {states.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="label">Status:</td>
                <td className="field">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">— Any —</option>
                    <option>In Force</option>
                    <option>Quoted</option>
                    <option>Referred</option>
                    <option>Pending Renewal</option>
                  </select>
                </td>
                <td />
                <td />
              </tr>
            </tbody>
          </table>
        </div>
        <div className="toolbar">
          <button className="btn primary" onClick={doSearch}>Search</button>
          <button className="btn" onClick={clear}>Clear</button>
          <span className="spacer" />
          <span className="muted">{policies.length} policies on file</span>
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
                <th>Policy #</th>
                <th>Insured</th>
                <th>Line of Business</th>
                <th>State</th>
                <th>City</th>
                <th>Effective</th>
                <th className="num">Premium</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="muted center">No policies match the criteria.</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/policy/${p.id}`)}>
                    <td className="mono">{p.id}</td>
                    <td>
                      {p.insured}
                      {p.dba && <div className="muted small">DBA {p.dba}</div>}
                    </td>
                    <td>{p.line}</td>
                    <td className="center">{p.state}</td>
                    <td>{p.city || ''}</td>
                    <td>{fmtDate(p.effective)}</td>
                    <td className="num">{fmtMoney(p.premium)}</td>
                    <td>{statusPill(p.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="pager">
            <span>Page</span>
            <span className="current">1</span>
            <span className="spacer" />
            <span>Showing 1–{filtered.length} of {filtered.length}</span>
          </div>
        </>
      )}
    </Chrome>
  )
}
