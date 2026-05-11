import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Chrome from '../components/Chrome'
import { api } from '../lib/api'
import { fmtMoney } from '../lib/format'
import type { Policy } from '../lib/types'

export default function QuoteInquiry() {
  const [quotes, setQuotes] = useState<Policy[]>([])
  const [filtered, setFiltered] = useState<Policy[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api<Policy[]>('/api/policies')
      .then((data) => {
        const q = data.filter((p) => p.status === 'Quoted' || p.status === 'Referred')
        setQuotes(q)
        setFiltered(q)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function doSearch() {
    const lower = search.toLowerCase()
    setFiltered(
      quotes.filter(
        (q) =>
          !lower ||
          q.id.toLowerCase().includes(lower) ||
          q.insured.toLowerCase().includes(lower) ||
          (q.dba ?? '').toLowerCase().includes(lower)
      )
    )
  }

  function statusPill(s: string) {
    if (s === 'Quoted') return <span className="pill blue">Quoted</span>
    if (s === 'Referred') return <span className="pill amber">Referred</span>
    return <span className="pill gray">{s}</span>
  }

  return (
    <Chrome>
      <div className="crumbs">
        Home <span className="sep">&rsaquo;</span>{' '}
        <a href="/dashboard">Assure Policy</a>{' '}
        <span className="sep">&rsaquo;</span> <span>Quote Inquiry</span>
      </div>
      <div className="pagetitle">
        Quote Inquiry
        <span className="id">WK-QI-001</span>
      </div>

      {error && (
        <div className="msg error" style={{ marginTop: 10 }}>
          <div className="title">Error loading data</div>
          {error}
        </div>
      )}

      <div className="panel">
        <div className="section-bar">Open Quotes &amp; Referrals</div>
        <div className="toolbar">
          <input
            type="text"
            placeholder="Quote # or Insured Name / DBA"
            style={{ width: 280 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
          />
          <button className="btn primary" onClick={doSearch}>Search</button>
          <span className="spacer" />
          <button className="btn primary" onClick={() => navigate('/new-business')}>
            ＋ New Healthcare PL Quote
          </button>
        </div>

        {loading ? (
          <div className="msg info" style={{ margin: 10 }}>Loading…</div>
        ) : (
          <table className="gridview">
            <thead>
              <tr>
                <th>Quote #</th>
                <th>Insured</th>
                <th>Line</th>
                <th>State</th>
                <th className="num">Premium</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="muted center">No open quotes.</td></tr>
              ) : (
                filtered.map((q) => (
                  <tr key={q.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/policy/${q.id}`)}>
                    <td className="mono">{q.id}</td>
                    <td>
                      {q.insured}
                      {q.dba && <div className="muted small">DBA {q.dba}</div>}
                    </td>
                    <td>{q.line}</td>
                    <td className="center">{q.state}</td>
                    <td className="num">{fmtMoney(q.premium)}</td>
                    <td>{statusPill(q.status)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button className="btn small" onClick={() => navigate('/new-business')}>Resume</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </Chrome>
  )
}
