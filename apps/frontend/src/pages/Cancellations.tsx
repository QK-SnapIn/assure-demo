import { useState } from 'react'
import Chrome from '../components/Chrome'
import { fmtMoney } from '../lib/format'

const RECENT_ACTIVITY = [
  { date: '5/5/2026', policyId: 'PMP-PH-208841', action: 'Cancelled — Practice sold (M&A)', by: 'Megan Walters', refund: 2840.50 },
  { date: '4/22/2026', policyId: 'PMP-DN-208112', action: 'Cancelled — Non-payment (10-day notice)', by: 'System', refund: 0 },
  { date: '4/14/2026', policyId: 'PMP-VT-207998', action: 'Reinstated', by: 'Megan Walters', refund: 0 },
]

const CANCEL_REASONS = [
  'Non-payment of Premium',
  'Practice Sold / M&A',
  'Insured Request',
  'Underwriting Decision',
  'Non-Renewal',
  'Other',
]

export default function Cancellations() {
  const [policyId, setPolicyId] = useState('')
  const [reason, setReason] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!policyId || !reason || !effectiveDate) {
      alert('Policy ID, reason, and effective date are required.')
      return
    }
    setSubmitted(true)
    alert(`Cancellation request submitted for ${policyId}.\nReason: ${reason}\nEffective: ${effectiveDate}`)
  }

  function clear() {
    setPolicyId('')
    setReason('')
    setEffectiveDate('')
    setRefundAmount('')
    setSubmitted(false)
  }

  return (
    <Chrome>
      <div className="crumbs">
        Home <span className="sep">&rsaquo;</span>{' '}
        <a href="/dashboard">Assure Policy</a>{' '}
        <span className="sep">&rsaquo;</span> <span>Cancellations</span>
      </div>
      <div className="pagetitle">
        Cancellations &amp; Non-Renewals
        <span className="id">WK-CXL-001</span>
      </div>

      {/* KPI summary */}
      <div className="kpi-row" style={{ marginTop: 12 }}>
        <div className="kpi"><div className="label">Pending Cancel</div><div className="value">0</div></div>
        <div className="kpi"><div className="label">Cancelled (30d)</div><div className="value">2</div></div>
        <div className="kpi"><div className="label">Reinstated (30d)</div><div className="value">1</div></div>
      </div>

      {/* Cancel request form */}
      <div className="section-bar" style={{ marginTop: 14 }}>New Cancellation Request</div>
      <div className="panel" style={{ borderTop: 'none' }}>
        <div className="panel-body">
          {submitted && (
            <div className="msg ok" style={{ marginBottom: 10 }}>
              <div className="title">Cancellation submitted</div>
              Request for {policyId} has been queued for processing.
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <table className="formgrid">
              <tbody>
                <tr>
                  <td className="label required">Policy #:</td>
                  <td className="field">
                    <input
                      type="text"
                      placeholder="PMP-PH-210441"
                      value={policyId}
                      onChange={(e) => setPolicyId(e.target.value)}
                      required
                    />
                  </td>
                  <td className="label required">Cancel Reason:</td>
                  <td className="field">
                    <select value={reason} onChange={(e) => setReason(e.target.value)} required>
                      <option value="">— Select —</option>
                      {CANCEL_REASONS.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                </tr>
                <tr>
                  <td className="label required">Effective Date:</td>
                  <td className="field">
                    <input
                      type="date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      required
                    />
                  </td>
                  <td className="label">Refund Amount:</td>
                  <td className="field">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                    />
                    <span className="hint">Leave blank to calculate pro-rata</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="toolbar" style={{ marginTop: 10 }}>
              <button type="submit" className="btn primary">Submit Cancellation</button>
              <button type="button" className="btn" onClick={clear}>Clear</button>
            </div>
          </form>
        </div>
      </div>

      {/* Pending queue */}
      <div className="section-bar" style={{ marginTop: 14 }}>Pending Cancellation Requests</div>
      <table className="gridview">
        <thead>
          <tr>
            <th>Policy #</th>
            <th>Insured</th>
            <th>Type</th>
            <th>Effective</th>
            <th>Reason</th>
            <th>Refund Method</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr><td colSpan={7} className="muted center">No cancellation requests in queue.</td></tr>
        </tbody>
      </table>

      {/* Recent activity */}
      <div className="section-bar" style={{ marginTop: 14 }}>Recent Activity</div>
      <table className="gridview">
        <thead>
          <tr>
            <th>Date</th>
            <th>Policy #</th>
            <th>Action</th>
            <th>By</th>
            <th className="num">Refund (USD)</th>
          </tr>
        </thead>
        <tbody>
          {RECENT_ACTIVITY.map((row, i) => (
            <tr key={i}>
              <td>{row.date}</td>
              <td className="mono">{row.policyId}</td>
              <td>{row.action}</td>
              <td>{row.by}</td>
              <td className="num">{fmtMoney(row.refund)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Info panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="panel">
          <div className="section-bar">Extended Reporting Period (Tail)</div>
          <div className="panel-body" style={{ fontSize: 11 }}>
            <p>On cancellation or non-renewal of a claims-made policy, the insured may elect an Extended Reporting Period to report claims arising from wrongful acts before the cancellation date.</p>
            <ul style={{ margin: '0 0 0 16px', padding: 0, lineHeight: 1.6 }}>
              <li>30-day basic ERP: included at no charge</li>
              <li>1-year ERP: 100% of expiring annual premium</li>
              <li>3-year ERP: 200% of expiring annual premium</li>
              <li>Unlimited ERP: 300% of expiring annual premium</li>
            </ul>
          </div>
        </div>
        <div className="panel">
          <div className="section-bar">State Notice Requirements</div>
          <div className="panel-body" style={{ fontSize: 11 }}>
            <table className="formgrid">
              <tbody>
                <tr><td className="label">Non-payment cancellation:</td><td className="field">10 days written notice</td></tr>
                <tr><td className="label">All other cancellations:</td><td className="field">60 days written notice (varies by state)</td></tr>
                <tr><td className="label">Non-renewal notice:</td><td className="field">60 days before expiration</td></tr>
                <tr><td className="label">Conditional renewal:</td><td className="field">60 days notice with material change</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Chrome>
  )
}
