import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Chrome from '../components/Chrome'
import { api } from '../lib/api'
import { fmtMoney, fmtMoney0, fmtDate } from '../lib/format'
import type { Policy, Claim, Invoice } from '../lib/types'

const POLICY_ID = 'PMP-PH-210441'

export default function MyPolicy() {
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [claims, setClaims] = useState<Claim[]>([])
  const [dueInvoice, setDueInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api<Policy>(`/api/policies/${POLICY_ID}`),
      api<Claim[]>('/api/claims'),
      api<Invoice[]>(`/api/invoices/by-policy/${POLICY_ID}`),
    ])
      .then(([p, allClaims, invoices]) => {
        setPolicy(p)
        setClaims(allClaims.filter(c => c.policyId === POLICY_ID))
        const due = invoices.find(i => Number(i.balance) > 0) ?? null
        setDueInvoice(due)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function claimStatusPill(status: string) {
    if (status === 'Open') return <span className="pill red">Open</span>
    if (status === 'Closed') return <span className="pill green">Closed</span>
    return <span className="pill amber">In Review</span>
  }

  return (
    <Chrome>
      <div className="crumbs">
        Home <span className="sep">&rsaquo;</span>
        <span>My Policy</span>
      </div>

      {error && (
        <div className="msg error" style={{ marginTop: 10 }}>
          <div className="title">Error</div>{error}
        </div>
      )}

      {loading ? (
        <div className="msg info" style={{ marginTop: 10 }}>Loading…</div>
      ) : !policy ? (
        <div className="msg error" style={{ marginTop: 10 }}>
          <div className="title">Policy not found</div>
          Could not load policy {POLICY_ID}.
        </div>
      ) : (
        <>
          <div className="pagetitle">
            My Professional Liability Policy
            <span className="id">{policy.id} &middot; {policy.line}</span>
          </div>

          <div className="cols-3">
            <div className="kpi">
              <div className="label">Insured</div>
              <div className="value" style={{ fontSize: 13 }}>{policy.insured}</div>
              <div className="delta">{policy.dba ? `DBA ${policy.dba}` : `${policy.city}, ${policy.state}`}</div>
            </div>
            <div className="kpi">
              <div className="label">Annual Premium</div>
              <div className="value">{fmtMoney(policy.premium)}</div>
              <div className="delta">Monthly: {fmtMoney(Number(policy.premium) / 12)} / mo</div>
            </div>
            <div className="kpi">
              <div className="label">Renews</div>
              <div className="value" style={{ fontSize: 14 }}>{fmtDate(policy.expiration)}</div>
              <div className="delta">Claims-made &middot; Retro {fmtDate(policy.retroDate)}</div>
            </div>
          </div>

          <div className="cols-2">
            <div className="panel">
              <div className="section-bar">Policy Information</div>
              <div className="panel-body">
                <table className="formgrid">
                  <tbody>
                    <tr><td className="label">Policy #:</td><td className="field"><strong>{policy.id}</strong></td></tr>
                    <tr><td className="label">Line of Business:</td><td className="field">{policy.line}</td></tr>
                    <tr>
                      <td className="label">Coverage Form:</td>
                      <td className="field">
                        <strong>{policy.form ?? ''}</strong> <span className="muted">(claims-made)</span>
                      </td>
                    </tr>
                    <tr><td className="label">Named Insured:</td><td className="field">{policy.insured}</td></tr>
                    {policy.dba && (
                      <tr><td className="label">DBA:</td><td className="field">{policy.dba}</td></tr>
                    )}
                    <tr>
                      <td className="label">Practice Address:</td>
                      <td className="field">412 Main Street, {policy.city}, {policy.state} 50511</td>
                    </tr>
                    <tr>
                      <td className="label">Per-Occurrence Limit:</td>
                      <td className="field"><strong>{fmtMoney0(policy.occLimit)}</strong></td>
                    </tr>
                    <tr>
                      <td className="label">Annual Aggregate Limit:</td>
                      <td className="field"><strong>{fmtMoney0(policy.aggLimit)}</strong></td>
                    </tr>
                    <tr>
                      <td className="label">Retroactive Date:</td>
                      <td className="field">
                        <strong>{fmtDate(policy.retroDate)}</strong>{' '}
                        <span className="muted">(prior-acts coverage)</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="label">Status:</td>
                      <td className="field"><span className="pill green">{policy.status}</span></td>
                    </tr>
                    <tr>
                      <td className="label">Policy Period:</td>
                      <td className="field">{fmtDate(policy.effective)} – {fmtDate(policy.expiration)}</td>
                    </tr>
                    <tr>
                      <td className="label">Producer:</td>
                      <td className="field">
                        {policy.agentUserId ?? '—'}<br />
                        <span className="muted">Walters Risk Advisors &middot; (515) 295-2461</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 10 }}>
                  <a
                    className="btn primary"
                    href="#"
                    onClick={e => { e.preventDefault(); alert('Demo: PDF declarations would download here.') }}
                  >
                    📑 Declarations (PDF)
                  </a>{' '}
                  <a
                    className="btn"
                    href="#"
                    onClick={e => { e.preventDefault(); alert('Demo: COI generated and emailed.') }}
                  >
                    📇 Certificate of Insurance
                  </a>{' '}
                  <a
                    className="btn"
                    href="#"
                    onClick={e => { e.preventDefault(); alert('No active endorsements on this policy.') }}
                  >
                    ✎ Endorsement History
                  </a>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="section-bar">Quick Actions</div>
              <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Link className="btn" to="/file-claim" style={{ padding: '14px 10px' }}>
                  <strong>📄 File a Claim</strong><br />
                  <span className="muted small">Report an incident or allegation</span>
                </Link>
                {dueInvoice ? (
                  <Link className="btn" to={`/make-payment`} style={{ padding: '14px 10px' }}>
                    <strong>💳 Pay Premium</strong><br />
                    <span className="muted small">{fmtMoney(dueInvoice.balance)} due {fmtDate(dueInvoice.due)}</span>
                  </Link>
                ) : (
                  <Link className="btn" to="/make-payment" style={{ padding: '14px 10px' }}>
                    <strong>💳 Make Payment</strong><br />
                    <span className="muted small">No balance due</span>
                  </Link>
                )}
                <Link className="btn" to="/endorsement" style={{ padding: '14px 10px' }}>
                  <strong>✎ Request Endorsement</strong><br />
                  <span className="muted small">Add staff, change limits, add location</span>
                </Link>
                <a
                  className="btn"
                  href="#"
                  onClick={e => { e.preventDefault(); alert('Renewal quote will be available 60 days before expiration.') }}
                  style={{ padding: '14px 10px' }}
                >
                  <strong>🔄 Renew Policy</strong><br />
                  <span className="muted small">Available 11/15/2026</span>
                </a>
              </div>

              <div className="section-bar">Important Reminders</div>
              <div className="panel-body" style={{ fontSize: 11 }}>
                {dueInvoice && (
                  <div style={{ padding: '5px 0', borderBottom: '1px dotted #ccc' }}>
                    <strong>Quarterly premium installment — {fmtMoney(dueInvoice.balance)}</strong><br />
                    <span className="muted">
                      Due {fmtDate(dueInvoice.due)} &middot;{' '}
                      <Link to="/make-payment">Pay now ›</Link>
                    </span>
                  </div>
                )}
                <div style={{ padding: '5px 0', borderBottom: '1px dotted #ccc' }}>
                  <strong>State pharmacy board CE deadline</strong><br />
                  <span className="muted">Iowa Board of Pharmacy CE renewal due 6/30/2026</span>
                </div>
                <div style={{ padding: '5px 0' }}>
                  <strong>Renewal quote window opens</strong><br />
                  <span className="muted">11/15/2026 (60 days before expiration)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="section-bar">My Claims</div>
            <table className="gridview">
              <thead>
                <tr>
                  <th>Claim #</th>
                  <th>Date of Loss</th>
                  <th>Loss Type</th>
                  <th>Allegation</th>
                  <th className="num">Paid to Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {claims.length === 0 ? (
                  <tr><td colSpan={7} className="muted center">No claims on file.</td></tr>
                ) : claims.map(c => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{fmtDate(c.dol)}</td>
                    <td>{c.lossType}</td>
                    <td>{c.cause}</td>
                    <td className="num">{fmtMoney(c.paid)}</td>
                    <td>{claimStatusPill(c.status)}</td>
                    <td><Link className="btn small" to={`/claim-workflow`}>View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <div className="section-bar">Recent Documents</div>
            <table className="gridview">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Declarations Page — Policy {policy.id}</td>
                  <td>Policy</td>
                  <td>{fmtDate(policy.effective)}</td>
                  <td>
                    <a className="btn small" href="#" onClick={e => { e.preventDefault(); alert('Demo file') }}>📥 Download</a>
                  </td>
                </tr>
                <tr>
                  <td>Certificate of Insurance</td>
                  <td>COI</td>
                  <td>{fmtDate(policy.effective)}</td>
                  <td>
                    <a className="btn small" href="#" onClick={e => { e.preventDefault(); alert('Demo file') }}>📥 Download</a>
                  </td>
                </tr>
                <tr>
                  <td>Premium Receipt — Q4 2025 (Paid)</td>
                  <td>Receipt</td>
                  <td>1/15/2026</td>
                  <td>
                    <a className="btn small" href="#" onClick={e => { e.preventDefault(); alert('Demo file') }}>📥 Download</a>
                  </td>
                </tr>
                <tr>
                  <td>HIPAA Breach Response Plan</td>
                  <td>Risk Mgmt</td>
                  <td>1/15/2026</td>
                  <td>
                    <a className="btn small" href="#" onClick={e => { e.preventDefault(); alert('Demo file') }}>📥 Download</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </Chrome>
  )
}
