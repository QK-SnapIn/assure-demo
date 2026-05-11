import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Chrome from '../components/Chrome'
import { api } from '../lib/api'
import { fmtMoney, fmtMoney0, fmtDate } from '../lib/format'
import type { Policy, Claim, Invoice } from '../lib/types'

// ── Local helpers ─────────────────────────────────────────────────────────────

type Tab = 'summary' | 'insured' | 'coverages' | 'billing' | 'claims' | 'docs' | 'history'

function lineGroup(line: string): string {
  const l = line.toLowerCase()
  if (l.includes('pharm')) return 'Pharmacy'
  if (l.includes('dent')) return 'Dental'
  if (l.includes('vet')) return 'Veterinary'
  if (l.includes('home health') || l.includes('hospice') || l.includes('home medical')) return 'Home Health'
  if (l.includes('senior') || l.includes('snf') || l.includes('nursing')) return 'Senior Living'
  return 'Healthcare'
}

function premiumBreakdown(total: number) {
  const tax = Math.round(total * 0.03 * 100) / 100
  const fee = 75
  const net = Math.max(total - tax - fee, 0)
  return { net, fee, tax }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PolicyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('summary')
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [claims, setClaims] = useState<Claim[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      api<Policy>(`/api/policies/${id}`),
      api<Claim[]>(`/api/claims/by-policy/${id}`),
      api<Invoice[]>(`/api/invoices/by-policy/${id}`),
    ])
      .then(([p, c, inv]) => { setPolicy(p); setClaims(c); setInvoices(inv) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Chrome><div className="msg info" style={{ marginTop: 10 }}>Loading…</div></Chrome>
  if (error || !policy) return <Chrome><div className="msg error" style={{ marginTop: 10 }}><div className="title">Error</div>{error ?? 'Policy not found'}</div></Chrome>

  const lg = lineGroup(policy.line)
  const occ = policy.occLimit
  const agg = policy.aggLimit
  const premium = Number(policy.premium)
  const b = premiumBreakdown(premium)
  const censusLabel = lg === 'Senior Living' ? 'Licensed Bed Count' : lg === 'Home Health' ? 'Active Patient Census' : 'Headcount (W-2 + 1099)'
  const censusVal = (lg === 'Senior Living' || lg === 'Home Health') ? (policy.bedCount || policy.headcount || '—') : (policy.headcount || '—')

  const TABS: { key: Tab; label: string }[] = [
    { key: 'summary', label: 'Summary' },
    { key: 'insured', label: 'Insured & Practice' },
    { key: 'coverages', label: 'Coverage & Endorsements' },
    { key: 'billing', label: 'Billing' },
    { key: 'claims', label: 'Claims' },
    { key: 'docs', label: 'Documents' },
    { key: 'history', label: 'History' },
  ]

  // ── Tab bodies ──────────────────────────────────────────────────────────────

  function SummaryTab() {
    return (
      <div className="cols-2">
        <div>
          <div className="section-bar">Policy Information</div>
          <div className="panel-body">
            <table className="formgrid">
              <tbody>
                <tr><td className="label">Policy #:</td><td className="field"><strong>{policy!.id}</strong></td></tr>
                <tr><td className="label">Status:</td><td className="field"><span className="pill green">{policy!.status}</span></td></tr>
                <tr><td className="label">Line of Business:</td><td className="field">{policy!.line}</td></tr>
                <tr><td className="label">Form #:</td><td className="field">{policy!.form} (Claims-Made)</td></tr>
                <tr><td className="label">Policy Period:</td><td className="field">{fmtDate(policy!.effective)} — {fmtDate(policy!.expiration)}</td></tr>
                <tr><td className="label">Retroactive Date:</td><td className="field">{fmtDate(policy!.retroDate)}</td></tr>
                <tr><td className="label">Annual Premium:</td><td className="field"><strong>{fmtMoney(premium)}</strong></td></tr>
                <tr><td className="label">Producer:</td><td className="field">Megan Walters</td></tr>
                <tr><td className="label">Underwriter:</td><td className="field">David Chen</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="section-bar">Insured &amp; Practice Snapshot</div>
          <div className="panel-body">
            <table className="formgrid">
              <tbody>
                <tr><td className="label">Named Insured:</td><td className="field"><strong>{policy!.insured}</strong></td></tr>
                {policy!.dba && <tr><td className="label">DBA:</td><td className="field">{policy!.dba}</td></tr>}
                <tr><td className="label">Location:</td><td className="field">{policy!.city}, {policy!.state}</td></tr>
                <tr><td className="label">Per-Occurrence Limit:</td><td className="field"><strong>{fmtMoney0(occ)}</strong></td></tr>
                <tr><td className="label">Aggregate Limit:</td><td className="field"><strong>{fmtMoney0(agg)}</strong></td></tr>
                <tr><td className="label">{censusLabel}:</td><td className="field">{censusVal}</td></tr>
                <tr><td className="label">Open Claims:</td><td className="field">{claims.filter(c => c.status !== 'Closed').length}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <div className="section-bar">Premium Components (Annual)</div>
          <table className="gridview">
            <thead><tr><th>Component</th><th>Description</th><th className="num">Amount (USD)</th></tr></thead>
            <tbody>
              <tr><td>Net Professional Liability Premium</td><td>Rated on {censusLabel.toLowerCase()}, limits and loss history</td><td className="num">{fmtMoney(b.net)}</td></tr>
              <tr><td>Policy Fee</td><td>Flat issuance fee</td><td className="num">{fmtMoney(b.fee)}</td></tr>
              <tr><td>Surplus Lines Tax (3%)</td><td>State-mandated</td><td className="num">{fmtMoney(b.tax)}</td></tr>
              <tr><td colSpan={2}><strong>Total Annual Premium</strong></td><td className="num"><strong>{fmtMoney(premium)}</strong></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  function InsuredTab() {
    const p = policy!
    const naicClass = lg === 'Pharmacy' ? '5912' : lg === 'Dental' ? '8021' : lg === 'Veterinary' ? '0742' : lg === 'Senior Living' ? '8051' : '8082'
    const numSuffix = p.id.replace(/\D/g, '').slice(-6)
    return (
      <>
        <div className="section-bar">Named Insured</div>
        <div className="panel-body">
          <table className="formgrid">
            <tbody>
              <tr><td className="label">Legal Entity Name:</td><td className="field" colSpan={3}><strong>{p.insured}</strong></td></tr>
              {p.dba && <tr><td className="label">DBA / Trade Name:</td><td className="field" colSpan={3}>{p.dba}</td></tr>}
              <tr><td className="label">Federal Tax ID (EIN):</td><td className="field">42-{numSuffix.padStart(7, '0')}</td><td className="label">NAIC Class:</td><td className="field">{naicClass}</td></tr>
              <tr><td className="label">Primary Contact:</td><td className="field">Practice Administrator</td><td className="label">Email:</td><td className="field">admin@{p.insured.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com</td></tr>
              <tr><td className="label">Phone:</td><td className="field">(515) 555-0{p.id.slice(-3)}</td><td className="label">Fax:</td><td className="field">(515) 555-0199</td></tr>
              <tr><td className="label">Mailing Address:</td><td className="field" colSpan={3}>100 Main Street, {p.city}, {p.state} {p.state === 'IA' ? '50511' : '00000'}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="section-bar">Practice / Facility Profile</div>
        <div className="panel-body">
          <table className="formgrid">
            <tbody>
              <tr><td className="label">Line of Business:</td><td className="field">{p.line}</td><td className="label">Years in Business:</td><td className="field">{(parseInt(numSuffix.slice(-1)) % 9) + 5}</td></tr>
              <tr><td className="label">Headcount (W-2 + 1099):</td><td className="field">{p.headcount ?? '—'}</td><td className="label">Annual Payroll:</td><td className="field">{p.payroll ? fmtMoney0(p.payroll) : '—'}</td></tr>
              {p.bedCount != null && p.bedCount > 0 && <tr><td className="label">{lg === 'Senior Living' ? 'Licensed Bed Count' : 'Active Patient Census'}:</td><td className="field">{p.bedCount}</td><td className="label">Sites:</td><td className="field">1</td></tr>}
              <tr><td className="label">Risk Class:</td><td className="field">{lg}</td><td className="label">Loss-Free Discount:</td><td className="field">{claims.length === 0 ? '10%' : '0%'}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="section-bar">Key Personnel</div>
        <div className="panel-body">
          <table className="gridview">
            <thead><tr><th>Name</th><th>Role</th><th>License #</th><th>State</th><th>Status</th></tr></thead>
            <tbody>
              {lg === 'Pharmacy' && <>
                <tr><td>Sarah Johnson, PharmD</td><td>Pharmacist-in-Charge</td><td>PH-{numSuffix}</td><td>{p.state}</td><td><span className="pill green">Active</span></td></tr>
                <tr><td>Michael Reyes, PharmD</td><td>Staff Pharmacist</td><td>PH-{parseInt(numSuffix) + 1}</td><td>{p.state}</td><td><span className="pill green">Active</span></td></tr>
              </>}
              {lg === 'Dental' && <>
                <tr><td>Dr. Emily Chen, DDS</td><td>Practice Owner</td><td>DDS-{numSuffix}</td><td>{p.state}</td><td><span className="pill green">Active</span></td></tr>
                <tr><td>Dr. Mark Phillips, DDS</td><td>Associate Dentist</td><td>DDS-{parseInt(numSuffix) + 1}</td><td>{p.state}</td><td><span className="pill green">Active</span></td></tr>
              </>}
              {lg === 'Veterinary' && <>
                <tr><td>Dr. Rachel Knapp, DVM</td><td>Practice Owner</td><td>DVM-{numSuffix}</td><td>{p.state}</td><td><span className="pill green">Active</span></td></tr>
                <tr><td>Dr. Tom Schultz, DVM</td><td>Associate Veterinarian</td><td>DVM-{parseInt(numSuffix) + 1}</td><td>{p.state}</td><td><span className="pill green">Active</span></td></tr>
              </>}
              {lg === 'Home Health' && <>
                <tr><td>Lisa Marquez, RN</td><td>Director of Nursing</td><td>RN-{numSuffix}</td><td>{p.state}</td><td><span className="pill green">Active</span></td></tr>
                <tr><td>Joseph Bennett</td><td>Executive Director</td><td>—</td><td>{p.state}</td><td><span className="pill green">Active</span></td></tr>
              </>}
              {lg !== 'Pharmacy' && lg !== 'Dental' && lg !== 'Veterinary' && lg !== 'Home Health' && <>
                <tr><td>Karen Whitfield, NHA</td><td>Administrator</td><td>NHA-{numSuffix}</td><td>{p.state}</td><td><span className="pill green">Active</span></td></tr>
                <tr><td>Dr. Henry Allen, MD</td><td>Medical Director</td><td>MD-{parseInt(numSuffix) + 1}</td><td>{p.state}</td><td><span className="pill green">Active</span></td></tr>
              </>}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  function CoveragesTab() {
    const p = policy!
    const hasAbuse = p.abuseOccLimit != null && p.abuseOccLimit > 0
    const isSeniorOrHH = lg === 'Senior Living' || lg === 'Home Health'
    const numSuffix = p.id.replace(/\D/g, '').slice(-6)
    return (
      <>
        <div className="section-bar">Schedule of Coverages</div>
        <table className="gridview">
          <thead><tr><th>Coverage</th><th>Form</th><th>Per-Occurrence</th><th>Aggregate</th><th>Retro Date</th><th className="num">Premium</th></tr></thead>
          <tbody>
            <tr><td>{p.line}</td><td>{p.form}</td><td>{fmtMoney0(occ)}</td><td>{fmtMoney0(agg)}</td><td>{fmtDate(p.retroDate)}</td><td className="num">{fmtMoney(Math.round(premium * 0.82 * 100) / 100)}</td></tr>
            <tr><td>Commercial General Liability</td><td>CG 00 01</td><td>$1,000,000</td><td>$2,000,000</td><td>—</td><td className="num">{fmtMoney(Math.round(premium * 0.10 * 100) / 100)}</td></tr>
            <tr><td>Damage to Premises Rented</td><td>CG 00 01</td><td>$100,000</td><td>—</td><td>—</td><td className="num">{fmtMoney(0)}</td></tr>
            <tr><td>Medical Payments (others)</td><td>CG 00 01</td><td>$5,000</td><td>—</td><td>—</td><td className="num">{fmtMoney(0)}</td></tr>
            {hasAbuse && <tr><td>Sexual Abuse &amp; Molestation</td><td>PR 00 SM</td><td>{fmtMoney0(p.abuseOccLimit!)}</td><td>{fmtMoney0(p.abuseAggLimit!)}</td><td>{fmtDate(p.retroDate)}</td><td className="num">{fmtMoney(1200)}</td></tr>}
          </tbody>
        </table>

        <div className="section-bar" style={{ marginTop: 14 }}>Endorsements On File</div>
        <table className="gridview">
          <thead><tr><th>Endorsement #</th><th>Form</th><th>Description</th><th>Effective</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>END-{numSuffix}-001</td><td>PR 99 01</td><td>Additional Insured — Landlord</td><td>{fmtDate(p.effective)}</td><td><span className="pill green">Active</span></td></tr>
            {isSeniorOrHH && <tr><td>END-{numSuffix}-002</td><td>PR 99 14</td><td>HIPAA / Cyber Breach Response Sublimit ($100K/$250K)</td><td>{fmtDate(p.effective)}</td><td><span className="pill green">Active</span></td></tr>}
            <tr><td>END-{numSuffix}-003</td><td>PR 99 22</td><td>Defense Inside the Limits</td><td>{fmtDate(p.effective)}</td><td><span className="pill green">Active</span></td></tr>
          </tbody>
        </table>

        <div className="msg info"><div className="title">Claims-Made Coverage</div>This policy is written on a claims-made basis. A claim must be both (a) first made during the policy period (or any extended reporting period) and (b) arise from a wrongful act occurring on or after the retroactive date of {fmtDate(p.retroDate)} to be covered. An Extended Reporting Period (tail) is available on cancellation or non-renewal — see policy form for terms.</div>
      </>
    )
  }

  function BillingTab() {
    const balance = invoices.reduce((a, i) => a + Number(i.balance), 0)
    const nextDue = invoices.find(i => Number(i.balance) > 0)
    return (
      <>
        <div className="section-bar">Billing Summary</div>
        <div className="cols-3">
          <div className="kpi"><div className="label">Outstanding Balance</div><div className="value">{fmtMoney(balance)}</div></div>
          <div className="kpi"><div className="label">Next Payment Due</div><div className="value">{nextDue ? fmtMoney(nextDue.balance) : '—'}</div><div className="delta">{nextDue ? fmtDate(nextDue.due) : 'No payments due'}</div></div>
          <div className="kpi"><div className="label">Billing Plan</div><div className="value" style={{ fontSize: 14 }}>Direct Bill — Monthly</div></div>
        </div>
        <div className="section-bar">Invoices</div>
        <table className="gridview">
          <thead><tr><th>Invoice #</th><th>Issued</th><th>Due</th><th className="num">Amount</th><th className="num">Balance</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {invoices.length === 0
              ? <tr><td colSpan={7} className="muted center">No invoices on file.</td></tr>
              : invoices.map(inv => (
                <tr key={inv.id}>
                  <td>{inv.id}</td>
                  <td>{fmtDate(inv.issued)}</td>
                  <td>{fmtDate(inv.due)}</td>
                  <td className="num">{fmtMoney(inv.amount)}</td>
                  <td className="num">{fmtMoney(inv.balance)}</td>
                  <td>
                    {inv.status === 'Paid' ? <span className="pill green">Paid</span>
                      : inv.status === 'Past Due' ? <span className="pill red">Past Due</span>
                      : <span className="pill blue">Due</span>}
                  </td>
                  <td>{Number(inv.balance) > 0 && <button className="btn small" onClick={() => navigate(`/payment/${inv.id}`)}>Pay</button>}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </>
    )
  }

  function ClaimsTab() {
    return (
      <>
        <div className="section-bar">Claims on this Policy</div>
        <table className="gridview">
          <thead><tr><th>Claim #</th><th>DOL</th><th>Loss Type</th><th>Cause</th><th>Severity</th><th className="num">Reserve</th><th className="num">Paid</th><th>Status</th></tr></thead>
          <tbody>
            {claims.length === 0
              ? <tr><td colSpan={8} className="muted center">No claims on file.</td></tr>
              : claims.map(c => (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/claim/${c.id}`)}>
                  <td><a onClick={e => { e.stopPropagation(); navigate(`/claim/${c.id}`) }}>{c.id}</a></td>
                  <td>{fmtDate(c.dol)}</td>
                  <td>{c.lossType || '—'}</td>
                  <td>{c.cause}</td>
                  <td><span className={`pill ${c.severity === 'High' ? 'red' : c.severity === 'Medium' ? 'amber' : 'green'}`}>{c.severity}</span></td>
                  <td className="num">{fmtMoney(c.reserve)}</td>
                  <td className="num">{fmtMoney(c.paid)}</td>
                  <td><span className={`pill ${c.status === 'Open' ? 'red' : c.status === 'In Review' ? 'amber' : 'green'}`}>{c.status}</span></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </>
    )
  }

  function DocsTab() {
    return (
      <>
        <div className="section-bar">Documents</div>
        <table className="gridview">
          <thead><tr><th>Document</th><th>Type</th><th>Generated</th><th></th></tr></thead>
          <tbody>
            <tr><td>Declarations Page (DEC)</td><td>Policy Document</td><td>{fmtDate(policy!.effective)}</td><td><a className="btn small" href="#">View PDF</a></td></tr>
            <tr><td>Policy Form {policy!.form}</td><td>Coverage Form</td><td>{fmtDate(policy!.effective)}</td><td><a className="btn small" href="#">View PDF</a></td></tr>
            <tr><td>Certificate of Insurance (ACORD 25)</td><td>Cert</td><td>{fmtDate(policy!.effective)}</td><td><a className="btn small" href="#">View PDF</a></td></tr>
            <tr><td>Application (Signed)</td><td>Application</td><td>{fmtDate(policy!.effective)}</td><td><a className="btn small" href="#">View PDF</a></td></tr>
            <tr><td>Endorsement Schedule</td><td>Endorsements</td><td>{fmtDate(policy!.effective)}</td><td><a className="btn small" href="#">View PDF</a></td></tr>
            <tr><td>Premium Receipt</td><td>Receipt</td><td>{fmtDate(policy!.effective)}</td><td><a className="btn small" href="#">View PDF</a></td></tr>
            <tr><td>HIPAA Notice of Privacy Practices</td><td>Compliance</td><td>{fmtDate(policy!.effective)}</td><td><a className="btn small" href="#">View PDF</a></td></tr>
          </tbody>
        </table>
      </>
    )
  }

  function HistoryTab() {
    const p = policy!
    const eff = p.effective ? new Date(p.effective) : new Date()
    const dminus1 = new Date(eff.getTime() - 86400000)
    const dminus3 = new Date(eff.getTime() - 3 * 86400000)
    const quoteId = p.id.replace('PMP', 'PMQ')
    const numSuffix = p.id.replace(/\D/g, '').slice(-6)
    return (
      <>
        <div className="section-bar">Policy Audit Trail</div>
        <table className="gridview">
          <thead><tr><th>When</th><th>User</th><th>Activity</th><th>Reference</th></tr></thead>
          <tbody>
            <tr><td>5/9/2026 14:22:18</td><td>Megan Walters</td><td>Viewed policy detail</td><td>—</td></tr>
            <tr><td>3/15/2026 11:08:47</td><td>David Chen</td><td>Endorsement issued (END-{numSuffix}-003)</td><td>Defense inside the limits</td></tr>
            <tr><td>{fmtDate(p.effective)} 08:45:00</td><td>System</td><td>Policy bound and issued</td><td>{p.id}</td></tr>
            <tr><td>{fmtDate(dminus1.toISOString().slice(0, 10))} 16:22:11</td><td>David Chen</td><td>Quote approved</td><td>{quoteId}</td></tr>
            <tr><td>{fmtDate(dminus3.toISOString().slice(0, 10))} 10:14:55</td><td>Megan Walters</td><td>Quote created</td><td>{quoteId}</td></tr>
          </tbody>
        </table>
      </>
    )
  }

  return (
    <Chrome>
      <div className="crumbs">
        <span className="link" onClick={() => navigate('/dashboard')}>Home</span>
        <span className="sep">&rsaquo;</span>
        <span className="link" onClick={() => navigate('/policy-search')}>Policies</span>
        <span className="sep">&rsaquo;</span>
        {policy.id}
      </div>

      <div className="pagetitle">
        Policy: {policy.insured}
        <span className="id">{policy.id} &middot; {policy.line} &middot; Form {policy.form}</span>
      </div>

      <div className="tabstrip">
        {TABS.map(t => (
          <a key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)} style={{ cursor: 'pointer' }}>{t.label}</a>
        ))}
      </div>

      <div className="toolbar">
        <button className="btn" onClick={() => navigate(`/endorsement?id=${policy.id}`)}>✎ Issue Endorsement</button>
        <button className="btn" onClick={() => navigate('/renewals')}>↻ Renew Policy</button>
        <button className="btn" onClick={() => navigate(`/fnol?policy=${policy.id}`)}>📄 File FNOL</button>
        <button className="btn" onClick={() => navigate(`/payment/${policy.id}`)}>💳 Take Payment</button>
        <div className="sep" />
        <button className="btn" onClick={() => window.print()}>🖨 Print Declarations</button>
        <span className="spacer" />
        <span className="muted">Last activity: 2 days ago</span>
      </div>

      <div className="panel" style={{ borderTop: 'none' }}>
        {tab === 'summary' && <SummaryTab />}
        {tab === 'insured' && <InsuredTab />}
        {tab === 'coverages' && <CoveragesTab />}
        {tab === 'billing' && <BillingTab />}
        {tab === 'claims' && <ClaimsTab />}
        {tab === 'docs' && <DocsTab />}
        {tab === 'history' && <HistoryTab />}
      </div>
    </Chrome>
  )
}
