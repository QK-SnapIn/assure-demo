import { useEffect, useState } from 'react'
import Chrome from '../components/Chrome'
import { api } from '../lib/api'
import { fmtMoney, fmtDate } from '../lib/format'
import type { Referral } from '../lib/types'

export default function ReferralQueue() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [lines, setLines] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rowState, setRowState] = useState<Record<string, 'approved' | 'declined' | null>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [searchText, setSearchText] = useState('')
  const [filterLine, setFilterLine] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterState, setFilterState] = useState('')

  function fetchAll() {
    setLoading(true)
    Promise.all([
      api<Referral[]>('/api/referrals'),
      api<string[]>('/api/lookups/lines'),
      api<string[]>('/api/lookups/states'),
    ])
      .then(([r, l, s]) => {
        setReferrals(r)
        setLines(l)
        setStates(s)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  async function approveRef(id: string) {
    if (!window.confirm(`Approve referral ${id} and notify the agent?`)) return
    try {
      await api(`/api/referrals/${id}/approve`, { method: 'POST' })
      setRowState(prev => ({ ...prev, [id]: 'approved' }))
      alert(`Referral ${id} approved. Agent has been notified — quote is bindable.`)
      fetchAll()
    } catch (e: unknown) {
      alert(`Error: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  async function declineRef(id: string) {
    const reason = window.prompt('Decline reason:')
    if (!reason) return
    try {
      await api(`/api/referrals/${id}/decline`, { method: 'POST' })
      setRowState(prev => ({ ...prev, [id]: 'declined' }))
      alert(`Referral ${id} declined. Reason logged: "${reason}"`)
      fetchAll()
    } catch (e: unknown) {
      alert(`Error: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  function toggleAll(checked: boolean) {
    if (checked) setSelected(new Set(filtered.map(r => r.id)))
    else setSelected(new Set())
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function bulkAction(kind: 'approve' | 'decline') {
    const ids = Array.from(selected)
    if (!ids.length) { alert('Select one or more referrals first.'); return }
    if (!window.confirm(`${kind === 'approve' ? 'Approve' : 'Decline'} ${ids.length} referrals?`)) return
    try {
      await Promise.all(ids.map(id => api(`/api/referrals/${id}/${kind}`, { method: 'POST' })))
      const next: Record<string, 'approved' | 'declined'> = {}
      ids.forEach(id => { next[id] = kind === 'approve' ? 'approved' : 'declined' })
      setRowState(prev => ({ ...prev, ...next }))
      setSelected(new Set())
      alert(`${ids.length} referrals processed.`)
      fetchAll()
    } catch (e: unknown) {
      alert(`Error: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const filtered = referrals.filter(r => {
    if (searchText && !r.insured.toLowerCase().includes(searchText.toLowerCase()) &&
        !r.quoteId.toLowerCase().includes(searchText.toLowerCase())) return false
    if (filterLine && r.line !== filterLine) return false
    if (filterPriority && r.priority !== filterPriority) return false
    if (filterState && r.state !== filterState) return false
    return true
  })

  function rowStyle(id: string): React.CSSProperties {
    const s = rowState[id]
    if (s === 'approved') return { background: '#e1f4dd', opacity: 0.7 }
    if (s === 'declined') return { background: '#fde0e0', opacity: 0.7 }
    return {}
  }

  return (
    <Chrome>
      <div className="crumbs">
        Home <span className="sep">&rsaquo;</span>
        Assure Policy <span className="sep">&rsaquo;</span>
        Underwriting <span className="sep">&rsaquo;</span>
        <span>Referral Queue</span>
      </div>

      {error && (
        <div className="msg error" style={{ marginTop: 10 }}>
          <div className="title">Error</div>{error}
        </div>
      )}

      {loading ? (
        <div className="msg info" style={{ marginTop: 10 }}>Loading…</div>
      ) : (
        <>
          <div className="pagetitle">
            Underwriter Referral Queue
            <span className="id">{referrals.length} pending &middot; Auto-routed by line / state</span>
          </div>

          <div className="toolbar">
            <input
              type="text"
              placeholder="Search by insured, quote#, agent..."
              style={{ width: 280 }}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
            <select value={filterLine} onChange={e => setFilterLine(e.target.value)}>
              <option value="">All Lines</option>
              {lines.map(l => <option key={l}>{l}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">All Priorities</option>
              <option>Expedite</option>
              <option>Standard</option>
            </select>
            <select value={filterState} onChange={e => setFilterState(e.target.value)}>
              <option value="">All States</option>
              {states.map(s => <option key={s}>{s}</option>)}
            </select>
            <button className="btn">Search</button>
            <span className="spacer" />
            <span className="muted">SLA target: 2 business days</span>
          </div>

          <table className="gridview">
            <thead>
              <tr>
                <th style={{ width: 30 }}>
                  <input
                    type="checkbox"
                    onChange={e => toggleAll(e.target.checked)}
                    checked={selected.size === filtered.length && filtered.length > 0}
                  />
                </th>
                <th>Referral #</th>
                <th>Quote #</th>
                <th>Insured</th>
                <th>Line</th>
                <th>State</th>
                <th className="num">Premium</th>
                <th>Priority</th>
                <th>Submitted</th>
                <th>Reason</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={11} className="muted center">No referrals found.</td></tr>
              )}
              {filtered.map(r => (
                <tr key={r.id} style={rowStyle(r.id)}>
                  <td className="center">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={e => toggleOne(r.id, e.target.checked)}
                    />
                  </td>
                  <td>{r.id}</td>
                  <td><a href={`/new-business`}>{r.quoteId}</a></td>
                  <td>
                    <strong>{r.insured}</strong><br />
                    <span className="muted">{r.agentUserId ?? '—'}</span>
                  </td>
                  <td>{r.line}</td>
                  <td className="center">{r.state}</td>
                  <td className="num">{fmtMoney(r.premium)}</td>
                  <td>
                    {r.priority === 'Expedite'
                      ? <span className="pill red">Expedite</span>
                      : <span className="pill gray">Standard</span>}
                  </td>
                  <td>{fmtDate(r.submitted)}</td>
                  <td><span className="muted">{r.reason}</span></td>
                  <td>
                    <button className="btn small primary" onClick={() => approveRef(r.id)}>Approve</button>{' '}
                    <button className="btn small" onClick={() => declineRef(r.id)}>Decline</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pager">
            <span>Page</span><span className="current">1</span>
            <span className="spacer" />
            <button className="btn small" onClick={() => bulkAction('approve')}>Approve Selected</button>{' '}
            <button className="btn small" onClick={() => bulkAction('decline')}>Decline Selected</button>
          </div>

          <div className="cols-2" style={{ marginTop: 14 }}>
            <div className="panel">
              <div className="section-bar">Risk Appetite Reminders</div>
              <div className="panel-body" style={{ fontSize: 11 }}>
                <ul style={{ margin: '0 0 0 16px', padding: 0, lineHeight: 1.7 }}>
                  <li>Pharmacy: sterile compounding (USP 797) requires supplemental application + facility inspection.</li>
                  <li>Dental: deep sedation / IV moderate sedation requires anesthesia training records.</li>
                  <li>Veterinary: emergency / 24-hour clinics rated separately from day-practice.</li>
                  <li>Home Health &amp; Hospice: pediatric or ventilator-dependent patients require senior UW sign-off.</li>
                  <li>Senior Living: bed count ≥ 100 or 2+ abuse claims in 3 years requires Director approval.</li>
                  <li>Loss history: 3+ paid claims in 3 years — load 25-50% or decline.</li>
                </ul>
              </div>
            </div>
            <div className="panel">
              <div className="section-bar">SLA Performance — This Week</div>
              <div className="panel-body">
                <table className="formgrid" style={{ fontSize: 11 }}>
                  <tbody>
                    <tr><td className="label">Avg time to decision:</td><td className="field"><strong>1.3 days</strong></td></tr>
                    <tr><td className="label">Within SLA:</td><td className="field"><span className="pill green">94%</span></td></tr>
                    <tr><td className="label">Past SLA:</td><td className="field"><span className="pill amber">2 referrals</span></td></tr>
                    <tr><td className="label">Approval Rate:</td><td className="field">68%</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </Chrome>
  )
}
