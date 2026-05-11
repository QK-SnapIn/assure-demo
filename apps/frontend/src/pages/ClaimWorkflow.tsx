import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Chrome from '../components/Chrome'
import { api } from '../lib/api'
import { fmtMoney, fmtMoney0, fmtDate } from '../lib/format'
import type { Claim, Policy } from '../lib/types'

type Tab = 'summary' | 'coverage' | 'reserves' | 'counsel' | 'notes' | 'docs'

export default function ClaimWorkflow() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('summary')
  const [claim, setClaim] = useState<Claim | null>(null)
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [states, setStates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api<Claim>(`/api/claims/${id}`)
      .then(c => {
        setClaim(c)
        return Promise.all([
          api<Policy>(`/api/policies/${c.policyId}`),
          api<string[]>('/api/lookups/states'),
        ])
      })
      .then(([p, st]) => { setPolicy(p); setStates(st) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Chrome><div className="msg info" style={{ marginTop: 10 }}>Loading…</div></Chrome>
  if (error || !claim || !policy) return <Chrome><div className="msg error" style={{ marginTop: 10 }}><div className="title">Error</div>{error ?? 'Claim not found'}</div></Chrome>

  const reserve = Number(claim.reserve)
  const paid = Number(claim.paid)
  const occ = policy.occLimit

  const TABS: { key: Tab; label: string }[] = [
    { key: 'summary', label: 'Summary' },
    { key: 'coverage', label: 'Coverage Analysis' },
    { key: 'reserves', label: 'Reserves & Payments' },
    { key: 'counsel', label: 'Defense Counsel' },
    { key: 'notes', label: 'Adjuster Notes' },
    { key: 'docs', label: 'Documents' },
  ]

  const statusPill = (st: string) => {
    const cls = st === 'Open' ? 'amber' : st === 'Closed' ? 'green' : 'blue'
    return <span className={`pill ${cls}`}>{st}</span>
  }

  // ── Summary Tab ─────────────────────────────────────────────────────────────

  function SummaryTab() {
    return (
      <>
        <div className="panel">
          <div className="section-bar">Claim Summary</div>
          <div className="panel-body">
            <table className="formgrid">
              <tbody>
                <tr>
                  <td className="label">Claim #:</td><td className="field"><strong>{claim!.id}</strong></td>
                  <td className="label">Status:</td><td className="field">{statusPill(claim!.status)}</td>
                </tr>
                <tr>
                  <td className="label">Insured:</td><td className="field"><strong>{claim!.insured}</strong></td>
                  <td className="label">Policy #:</td><td className="field"><a style={{ cursor: 'pointer' }} onClick={() => navigate(`/policy/${policy!.id}`)}>{policy!.id}</a></td>
                </tr>
                <tr>
                  <td className="label">Line:</td><td className="field">{policy!.line}</td>
                  <td className="label">Form:</td><td className="field">{policy!.form}</td>
                </tr>
                <tr>
                  <td className="label">Date of Loss:</td><td className="field">{fmtDate(claim!.dol)}</td>
                  <td className="label">Reported:</td><td className="field">{fmtDate(claim!.reported)}</td>
                </tr>
                <tr>
                  <td className="label">Loss Type:</td><td className="field">{claim!.lossType}</td>
                  <td className="label">Severity:</td>
                  <td className="field"><span className={`pill ${claim!.severity === 'High' ? 'red' : claim!.severity === 'Medium' ? 'amber' : 'green'}`}>{claim!.severity}</span></td>
                </tr>
                <tr>
                  <td className="label">Cause / Allegation:</td><td className="field" colSpan={3}>{claim!.cause}</td>
                </tr>
                <tr>
                  <td className="label">Adjuster:</td><td className="field">{claim!.adjusterUserId ?? 'Linda Park'}</td>
                  <td className="label">Defense Counsel:</td><td className="field">{claim!.counsel ?? 'Henson & Marx, LLP'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="section-bar">Financial Snapshot</div>
          <div className="panel-body">
            <div className="kpis">
              <div className="kpi"><div className="lbl">Indemnity Reserve</div><div className="val">{fmtMoney(reserve)}</div></div>
              <div className="kpi"><div className="lbl">Paid to Date</div><div className="val">{fmtMoney(paid)}</div></div>
              <div className="kpi"><div className="lbl">Incurred</div><div className="val">{fmtMoney(reserve + paid)}</div></div>
              <div className="kpi"><div className="lbl">Per-Occ Limit</div><div className="val">{fmtMoney0(occ)}</div></div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── Coverage Analysis Tab ───────────────────────────────────────────────────

  function CoverageTab() {
    const dolDate = new Date(claim!.dol)
    const reportedDate = new Date(claim!.reported)
    const retroDate = policy!.retroDate ? new Date(policy!.retroDate) : new Date(0)
    const effDate = policy!.effective ? new Date(policy!.effective) : new Date(0)
    const expDate = policy!.expiration ? new Date(policy!.expiration) : new Date()

    const dolAfterRetro = dolDate >= retroDate
    const reportedInPeriod = reportedDate >= effDate && reportedDate <= expDate

    return (
      <div className="panel">
        <div className="section-bar">Claims-Made Coverage Analysis</div>
        <div className="panel-body">
          <table className="formgrid">
            <tbody>
              <tr>
                <td className="label">Policy Period:</td>
                <td className="field">{fmtDate(policy!.effective)} – {fmtDate(policy!.expiration)}</td>
                <td className="label">Retroactive Date:</td>
                <td className="field"><strong>{fmtDate(policy!.retroDate)}</strong></td>
              </tr>
              <tr>
                <td className="label">Date of Loss:</td>
                <td className="field">{fmtDate(claim!.dol)}</td>
                <td className="label">Date Reported:</td>
                <td className="field">{fmtDate(claim!.reported)}</td>
              </tr>
              <tr>
                <td className="label">DOL ≥ Retro?</td>
                <td className="field">
                  <span className={`pill ${dolAfterRetro ? 'green' : 'red'}`}>
                    {dolAfterRetro ? 'Yes — within retro' : 'No — pre-retro, NOT COVERED'}
                  </span>
                </td>
                <td className="label">Reported in Period?</td>
                <td className="field">
                  <span className={`pill ${reportedInPeriod ? 'green' : 'amber'}`}>
                    {reportedInPeriod ? 'Yes' : 'No — check ERP'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="meta" style={{ marginTop: 8 }}>Claims-made coverage requires both: (1) the incident occurred on or after the retroactive date, and (2) the claim was reported during the policy period or any applicable Extended Reporting Period (ERP / tail).</div>
        </div>

        <div className="section-bar">Coverage Determination</div>
        <div className="panel-body">
          <table className="formgrid">
            <tbody>
              <tr>
                <td className="label">Coverage Position:</td>
                <td className="field">
                  <select defaultValue="Coverage Confirmed — defend & indemnify">
                    <option>Under Investigation</option>
                    <option>Coverage Confirmed — defend &amp; indemnify</option>
                    <option>Reservation of Rights — issued {fmtDate('2026-05-09')}</option>
                    <option>Denial — pre-retro date</option>
                    <option>Denial — known wrongful act</option>
                    <option>Denial — intentional act / exclusion applies</option>
                  </select>
                </td>
                <td className="label">Coverage Letter Sent:</td>
                <td className="field"><input type="date" defaultValue="2026-05-09" /></td>
              </tr>
              <tr>
                <td className="label">Exclusions Reviewed:</td>
                <td className="field" colSpan={3}>
                  <label><input type="checkbox" defaultChecked /> Intentional / criminal acts</label>&nbsp;
                  <label><input type="checkbox" defaultChecked /> Prior knowledge / known circumstances</label>&nbsp;
                  <label><input type="checkbox" defaultChecked /> Sexual misconduct (sublimit may apply)</label>&nbsp;
                  <label><input type="checkbox" /> Punitive damages (state-dependent)</label>&nbsp;
                  <label><input type="checkbox" defaultChecked /> Bodily injury to employees (WC)</label>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── Reserves Tab ────────────────────────────────────────────────────────────

  function ReservesTab() {
    return (
      <div className="panel">
        <div className="section-bar">Reserves</div>
        <div className="panel-body">
          <table className="gridview">
            <thead><tr><th>Category</th><th>Reserve</th><th>Paid</th><th>Outstanding</th><th>Last Update</th></tr></thead>
            <tbody>
              <tr><td>Indemnity</td><td>{fmtMoney(reserve)}</td><td>{fmtMoney(paid * 0.6)}</td><td>{fmtMoney(reserve - paid * 0.6)}</td><td>{fmtDate('2026-05-09')}</td></tr>
              <tr><td>Defense (ALAE)</td><td>{fmtMoney(reserve * 0.25)}</td><td>{fmtMoney(paid * 0.3)}</td><td>{fmtMoney(reserve * 0.25 - paid * 0.3)}</td><td>{fmtDate('2026-05-09')}</td></tr>
              <tr><td>Expense (ULAE)</td><td>{fmtMoney(reserve * 0.05)}</td><td>{fmtMoney(paid * 0.1)}</td><td>{fmtMoney(reserve * 0.05 - paid * 0.1)}</td><td>{fmtDate('2026-05-07')}</td></tr>
              <tr style={{ fontWeight: 600 }}><td>Total Incurred</td><td>{fmtMoney(reserve * 1.3)}</td><td>{fmtMoney(paid)}</td><td>{fmtMoney(reserve * 1.3 - paid)}</td><td>—</td></tr>
            </tbody>
          </table>
          <div className="toolbar">
            <button className="btn" onClick={() => alert('Reserve adjustment (demo — not saved)')}>+ Adjust Reserve</button>
            <button className="btn" onClick={() => alert('Payment issued (demo — not saved)')}>$ Issue Payment</button>
            <span className="spacer" />
            <span className="meta">Reserve changes &gt; $25,000 require supervisor approval</span>
          </div>
        </div>

        <div className="section-bar">Payment History</div>
        <div className="panel-body">
          <table className="gridview">
            <thead><tr><th>Date</th><th>Payee</th><th>Type</th><th>Method</th><th>Amount</th><th>Check #</th></tr></thead>
            <tbody>
              <tr><td>{fmtDate('2026-04-22')}</td><td>{claim!.insured}</td><td>Indemnity — partial</td><td>ACH</td><td>{fmtMoney(paid * 0.6)}</td><td>—</td></tr>
              <tr><td>{fmtDate('2026-04-30')}</td><td>{claim!.counsel ?? 'Henson & Marx, LLP'}</td><td>Defense fees — invoice #2026-04-1148</td><td>Check</td><td>{fmtMoney(paid * 0.3)}</td><td>104821</td></tr>
              <tr><td>{fmtDate('2026-05-05')}</td><td>Lexitas Court Reporting</td><td>Deposition transcript</td><td>Check</td><td>{fmtMoney(paid * 0.1)}</td><td>104822</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── Counsel Tab ─────────────────────────────────────────────────────────────

  function CounselTab() {
    const highVenueStates = ['CA', 'IL', 'FL']
    const isHighVenue = highVenueStates.includes(policy!.state)
    return (
      <div className="panel">
        <div className="section-bar">Defense Counsel Assignment</div>
        <div className="panel-body">
          <table className="formgrid">
            <tbody>
              <tr>
                <td className="label">Firm:</td><td className="field"><strong>{claim!.counsel ?? 'Henson & Marx, LLP'}</strong></td>
                <td className="label">Lead Attorney:</td><td className="field">Allison Marx, Partner</td>
              </tr>
              <tr>
                <td className="label">Email:</td><td className="field">amarx@hensonmarx.com</td>
                <td className="label">Direct:</td><td className="field">(312) 555-0144</td>
              </tr>
              <tr>
                <td className="label">Litigation Hold Issued:</td><td className="field">{fmtDate('2026-05-09')}</td>
                <td className="label">Hourly Rate:</td><td className="field">$285 / hr (partner) · $185 / hr (associate)</td>
              </tr>
              <tr>
                <td className="label">Jurisdiction:</td>
                <td className="field">
                  <select defaultValue={policy!.state}>
                    {states.map(st => <option key={st}>{st}</option>)}
                  </select>
                  &nbsp;— {policy!.city}
                </td>
                <td className="label">Venue Risk:</td>
                <td className="field"><span className={`pill ${isHighVenue ? 'red' : 'amber'}`}>{isHighVenue ? 'High' : 'Moderate'}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="section-bar">Settlement Authority</div>
        <div className="panel-body">
          <table className="formgrid">
            <tbody>
              <tr>
                <td className="label">Granted Authority:</td><td className="field">{fmtMoney(Math.min(reserve, 100000))}</td>
                <td className="label">Approved By:</td><td className="field">{claim!.adjusterUserId ?? 'Linda Park'}</td>
              </tr>
              <tr>
                <td className="label">Consent-to-Settle:</td>
                <td className="field">
                  <label><input type="radio" name="cts" defaultChecked /> Insured consent required (hammer clause)</label>&nbsp;
                  <label><input type="radio" name="cts" /> Insurer may settle unilaterally</label>
                </td>
                <td className="label">Insured Notified:</td>
                <td className="field">{fmtDate('2026-05-09')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── Notes Tab ───────────────────────────────────────────────────────────────

  function NotesTab() {
    return (
      <div className="panel">
        <div className="section-bar">Adjuster Diary</div>
        <div className="panel-body">
          <table className="gridview">
            <thead><tr><th>Date</th><th>By</th><th>Activity</th><th>Note</th></tr></thead>
            <tbody>
              <tr><td>{fmtDate('2026-05-09')}</td><td>Linda Park</td><td>Coverage Analysis</td><td>DOL {fmtDate(claim!.dol)} is post-retro ({fmtDate(policy!.retroDate)}). Coverage confirmed under {policy!.form}. ROR letter not required.</td></tr>
              <tr><td>{fmtDate('2026-05-07')}</td><td>Linda Park</td><td>Reserve Set</td><td>Indemnity reserve at {fmtMoney(reserve)} based on outcome ({claim!.severity} severity) and venue ({policy!.state}).</td></tr>
              <tr><td>{fmtDate('2026-05-05')}</td><td>Linda Park</td><td>Counsel Assigned</td><td>Retained {claim!.counsel ?? 'Henson & Marx, LLP'} per panel. Litigation hold issued to insured.</td></tr>
              <tr><td>{fmtDate(claim!.reported)}</td><td>System</td><td>FNOL Received</td><td>Routed to {claim!.adjusterUserId ?? 'Linda Park'} based on line ({policy!.line}) and state ({policy!.state}).</td></tr>
            </tbody>
          </table>
          <div className="toolbar">
            <button className="btn" onClick={() => alert('Diary note added (demo — not saved)')}>+ Add Note</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Docs Tab ────────────────────────────────────────────────────────────────

  function DocsTab() {
    return (
      <div className="panel">
        <div className="section-bar">Claim Documents</div>
        <div className="panel-body">
          <table className="gridview">
            <thead><tr><th>Type</th><th>Filename</th><th>Uploaded</th><th>Size</th><th></th></tr></thead>
            <tbody>
              <tr><td>FNOL</td><td>fnol_{claim!.id}.pdf</td><td>{fmtDate(claim!.reported)}</td><td>184 KB</td><td><a href="#">View</a></td></tr>
              <tr><td>Incident Report</td><td>incident_report_signed.pdf</td><td>{fmtDate(claim!.reported)}</td><td>340 KB</td><td><a href="#">View</a></td></tr>
              <tr><td>Coverage Letter</td><td>coverage_position_{fmtDate('2026-05-09')}.pdf</td><td>{fmtDate('2026-05-09')}</td><td>120 KB</td><td><a href="#">View</a></td></tr>
              <tr><td>Litigation Hold</td><td>lit_hold_{claim!.id}.pdf</td><td>{fmtDate('2026-05-09')}</td><td>96 KB</td><td><a href="#">View</a></td></tr>
              <tr><td>Medical Records</td><td>patient_records_redacted.pdf</td><td>{fmtDate('2026-05-08')}</td><td>4.2 MB</td><td><a href="#">View</a></td></tr>
            </tbody>
          </table>
          <div className="toolbar">
            <button className="btn">📎 Upload Document</button>
          </div>
        </div>
      </div>
    )
  }

  const claimStatusCls = claim.status === 'Open' ? 'amber' : claim.status === 'Closed' ? 'green' : 'blue'

  return (
    <Chrome>
      <div className="crumbs">
        <span className="link" onClick={() => navigate('/dashboard')}>Home</span>
        <span className="sep">&rsaquo;</span>
        <span className="link" onClick={() => navigate('/claim-search')}>Claims</span>
        <span className="sep">&rsaquo;</span>
        {claim.id}
      </div>

      <div className="pagetitle">
        Claim Workflow — {claim.id}
        <span className="id">{claim.lossType} · DOL {fmtDate(claim.dol)} · {policy.state}</span>
        <span className={`pill ${claimStatusCls}`} style={{ marginLeft: 10 }}>{claim.status}</span>
      </div>

      <div className="tabbar">
        {TABS.map(t => (
          <a key={t.key} className={`tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)} style={{ cursor: 'pointer' }}
            dangerouslySetInnerHTML={{ __html: t.label.replace('&', '&amp;') }}
          />
        ))}
      </div>

      {tab === 'summary' && <SummaryTab />}
      {tab === 'coverage' && <CoverageTab />}
      {tab === 'reserves' && <ReservesTab />}
      {tab === 'counsel' && <CounselTab />}
      {tab === 'notes' && <NotesTab />}
      {tab === 'docs' && <DocsTab />}
    </Chrome>
  )
}
