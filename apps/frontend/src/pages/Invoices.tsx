import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Chrome from '../components/Chrome'
import { api } from '../lib/api'
import { fmtMoney, fmtDate } from '../lib/format'
import type { Invoice } from '../lib/types'

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filtered, setFiltered] = useState<Invoice[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api<Invoice[]>('/api/invoices')
      .then((data) => {
        setInvoices(data)
        setFiltered(data)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function applyFilter(q: string, st: string) {
    const lower = q.toLowerCase()
    setFiltered(
      invoices.filter((i) => {
        const matchText =
          !lower ||
          i.id.toLowerCase().includes(lower) ||
          i.policyId.toLowerCase().includes(lower) ||
          i.insured.toLowerCase().includes(lower)
        const matchStatus = !st || i.status === st
        return matchText && matchStatus
      })
    )
  }

  function handleSearch(val: string) {
    setSearch(val)
    applyFilter(val, statusFilter)
  }

  function handleStatus(val: string) {
    setStatusFilter(val)
    applyFilter(search, val)
  }

  function clear() {
    setSearch('')
    setStatusFilter('')
    setFiltered(invoices)
  }

  function statusPill(s: string) {
    if (s === 'Paid') return <span className="pill green">Paid</span>
    if (s === 'Past Due') return <span className="pill red">Past Due</span>
    return <span className="pill blue">Due</span>
  }

  const openAR = invoices.reduce((a, i) => a + parseFloat(i.balance), 0)
  const pastDueAR = invoices
    .filter((i) => i.status === 'Past Due')
    .reduce((a, i) => a + parseFloat(i.balance), 0)

  return (
    <Chrome>
      <div className="crumbs">
        Home <span className="sep">&rsaquo;</span>{' '}
        <a href="/dashboard">Assure Billing</a>{' '}
        <span className="sep">&rsaquo;</span> <span>Invoices</span>
      </div>
      <div className="pagetitle">
        Invoices
        <span className="id">{invoices.length} invoices loaded</span>
      </div>

      {error && (
        <div className="msg error" style={{ marginTop: 10 }}>
          <div className="title">Error loading data</div>
          {error}
        </div>
      )}

      <div className="toolbar">
        <input
          type="text"
          placeholder="Insured, policy#, invoice#..."
          style={{ width: 240 }}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => handleStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option>Paid</option>
          <option>Due</option>
          <option>Past Due</option>
        </select>
        <button className="btn" onClick={() => applyFilter(search, statusFilter)}>Search</button>
        <button className="btn" onClick={clear}>Clear</button>
        <span className="spacer" />
        <button className="btn primary" onClick={() => navigate('/payment/')}>
          Take Payment
        </button>
      </div>

      {loading ? (
        <div className="msg info" style={{ marginTop: 10 }}>Loading…</div>
      ) : (
        <>
          <table className="gridview">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Policy #</th>
                <th>Insured</th>
                <th>Issued</th>
                <th>Due</th>
                <th className="num">Amount</th>
                <th className="num">Balance</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="muted center">No invoices match the filters.</td></tr>
              ) : (
                filtered.map((i) => (
                  <tr
                    key={i.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/payment/${i.id}`)}
                  >
                    <td className="mono">{i.id}</td>
                    <td className="mono">{i.policyId}</td>
                    <td>{i.insured}</td>
                    <td>{fmtDate(i.issued)}</td>
                    <td>{fmtDate(i.due)}</td>
                    <td className="num">{fmtMoney(i.amount)}</td>
                    <td className="num">{fmtMoney(i.balance)}</td>
                    <td>{statusPill(i.status)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {parseFloat(i.balance) > 0 ? (
                        <button className="btn small primary" onClick={() => navigate(`/payment/${i.id}`)}>Pay</button>
                      ) : (
                        <span className="muted small">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="pager">
            <span>Page</span>
            <span className="current">1</span>
            <span className="spacer" />
            <span>Showing {filtered.length} of {invoices.length}</span>
          </div>

          {/* KPI summary */}
          <div className="kpi-row" style={{ marginTop: 14 }}>
            <div className="kpi">
              <div className="label">Open A/R</div>
              <div className="value">{fmtMoney(openAR)}</div>
            </div>
            <div className="kpi">
              <div className="label">Past Due &gt; 30d</div>
              <div className="value">{fmtMoney(pastDueAR)}</div>
              <div className="delta down">↑ 12% MoM</div>
            </div>
            <div className="kpi">
              <div className="label">Avg Days to Pay</div>
              <div className="value">23d</div>
            </div>
          </div>
        </>
      )}
    </Chrome>
  )
}
