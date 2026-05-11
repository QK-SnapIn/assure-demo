import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Chrome from '../components/Chrome'
import { api } from '../lib/api'
import { fmtMoney0, fmtDate } from '../lib/format'
import type { Policy } from '../lib/types'

// ── Local types ───────────────────────────────────────────────────────────────

interface FNOLForm {
  policyNum: string
  dol: string
  tol: string
  reported: string
  discovered: string
  lossType: string
  severity: string
  location: string
  incidentState: string
  patientAge: string
  description: string
  staffName: string
  staffRole: string
  licenseNum: string
  licenseState: string
  onDuty: string
  substanceConcern: string
  claimantName: string
  claimantRelationship: string
  claimantPhone: string
  attorneyRetained: string
  outcome: string
  estDamages: string
  boardNotification: string
  adverseEventReport: string
  hipaaInvolved: string
  abuseReported: string
  reporterName: string
  reporterRole: string
  reporterPhone: string
  reporterEmail: string
}

const DEFAULT_FORM: FNOLForm = {
  policyNum: '', dol: '', tol: '', reported: '', discovered: '',
  lossType: '', severity: 'Medium — injury, treatment required',
  location: '', incidentState: '', patientAge: '', description: '',
  staffName: '', staffRole: 'Pharmacist (RPh / PharmD)', licenseNum: '', licenseState: '',
  onDuty: 'Y', substanceConcern: 'N',
  claimantName: '', claimantRelationship: 'Patient', claimantPhone: '',
  attorneyRetained: 'N', outcome: 'Minor — treated & released', estDamages: '',
  boardNotification: 'N', adverseEventReport: 'N', hipaaInvolved: 'N', abuseReported: 'NA',
  reporterName: '', reporterRole: 'Policyholder / Practice Owner', reporterPhone: '', reporterEmail: '',
}

const SAMPLE_DATA: Partial<FNOLForm> = {
  policyNum: 'PMP-PH-210441', dol: '2026-05-04', tol: '14:25', reported: '2026-05-07',
  discovered: '2026-05-05', lossType: 'Medication Dispensing Error',
  severity: 'Medium — injury, treatment required',
  location: 'Riverside Community Pharmacy, 412 Main St, Dispensing Window 2, Algona IA 50511',
  incidentState: 'IA', patientAge: '68',
  description: 'Patient received metoprolol tartrate 100mg in lieu of 10mg as prescribed. Error discovered on day 3 when patient presented to PCP with bradycardia (HR 42) and hypotension. Patient observed in ED overnight, no permanent injury. Pharmacist on duty has been retrained on tall-man lettering; bar-code verification was bypassed during a register outage.',
  staffName: 'Patricia Nguyen, PharmD', staffRole: 'Pharmacist (RPh / PharmD)',
  licenseNum: 'IA-RPh-28814', licenseState: 'IA',
  claimantName: 'Harold Anderson', claimantPhone: '(515) 555-0142',
  outcome: 'Hospitalization required', estDamages: '75000',
  reporterName: 'David Park (Pharmacy Owner)', reporterRole: 'Policyholder / Practice Owner',
  reporterPhone: '(515) 555-0188', reporterEmail: 'dpark@riversiderx.com',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FNOL() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const presetPolicy = searchParams.get('policy') ?? ''

  const [form, setForm] = useState<FNOLForm>({ ...DEFAULT_FORM, policyNum: presetPolicy })
  const [lossTypes, setLossTypes] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [lookedUpPolicy, setLookedUpPolicy] = useState<Policy | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [lookingUp, setLookingUp] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedId, setSubmittedId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api<string[]>('/api/lookups/loss-types'),
      api<string[]>('/api/lookups/states'),
    ]).then(([lt, st]) => { setLossTypes(lt); setStates(st) })

    if (presetPolicy) lookupPolicy(presetPolicy)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function set(patch: Partial<FNOLForm>) {
    setForm(prev => ({ ...prev, ...patch }))
  }

  function lookupPolicy(num?: string) {
    const policyNum = num ?? form.policyNum.trim()
    if (!policyNum) { setLookupError('Please enter a policy number.'); return }
    setLookingUp(true)
    setLookupError(null)
    setLookedUpPolicy(null)
    api<Policy>(`/api/policies/by-policy/${policyNum}`)
      .then(p => setLookedUpPolicy(p))
      .catch(() => setLookupError(`No policy matching "${policyNum}" was located. Try: PMP-PH-210441, PMP-DN-210522, PMP-VT-210588.`))
      .finally(() => setLookingUp(false))
  }

  function prefillSample() {
    setForm(prev => ({ ...prev, ...SAMPLE_DATA }))
    lookupPolicy(SAMPLE_DATA.policyNum)
  }

  function handleSubmit() {
    const requiredFilled = form.policyNum && form.dol && form.reported && form.lossType && form.description && form.staffName && form.reporterName
    if (!requiredFilled) {
      setFormError('Please complete: Policy Number, Date of Loss, Date Reported, Loss Type, Description, Primary Staff Name, and Reporter Name.')
      return
    }
    if (!confirm('Submit this FNOL? A claim number will be assigned, an adjuster + defense counsel will be auto-assigned, and reserves will be opened.')) return
    const claimId = 'CLM-77' + String(Math.floor(Math.random() * 899) + 100)
    setSubmittedId(claimId)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <Chrome>
        <div className="crumbs"><span className="link" onClick={() => navigate('/dashboard')}>Home</span><span className="sep">&rsaquo;</span> FNOL</div>
        <div className="msg success" style={{ marginTop: 16 }}>
          <div className="title">Claim Created — {submittedId}</div>
          Adjuster <strong>Linda Park</strong> and defense counsel <strong>Henson &amp; Marx, LLP</strong> have been assigned.{' '}
          <a style={{ cursor: 'pointer' }} onClick={() => navigate(`/claim/${submittedId}`)}>Open claim ›</a>
        </div>
      </Chrome>
    )
  }

  return (
    <Chrome>
      <div className="crumbs">
        <span className="link" onClick={() => navigate('/dashboard')}>Home</span>
        <span className="sep">&rsaquo;</span> First Notice of Loss (FNOL)
      </div>

      <div className="pagetitle">
        First Notice of Loss — Healthcare Professional Liability
        <span className="id">Intake Form &middot; Required fields marked with *</span>
      </div>

      <div className="msg info">
        <div className="title">Intake instructions</div>
        Complete this form to report a professional liability incident — clinical event, allegation, HIPAA breach, or premises incident. The claim will be assigned a number on submission and routed to a claims adjuster + defense counsel based on severity and state. Coverage is claims-made; the incident must fall on or after the retroactive date.
      </div>

      {formError && <div className="msg error" style={{ marginBottom: 8 }}><div className="title">Required fields missing</div>{formError}</div>}

      <div className="panel">
        {/* Policy Lookup */}
        <div className="section-bar">Policy Lookup</div>
        <div className="panel-body">
          <table className="formgrid">
            <tbody>
              <tr>
                <td className="label required">Policy Number:</td>
                <td className="field">
                  <input type="text" value={form.policyNum} onChange={e => set({ policyNum: e.target.value })} style={{ width: 240 }} placeholder="PMP-PH-210441" />
                  <button type="button" className="btn small" onClick={() => lookupPolicy()} style={{ marginLeft: 6 }} disabled={lookingUp}>🔍 Look Up</button>
                  <button type="button" className="btn small" onClick={prefillSample} style={{ marginLeft: 6 }}>🧪 Use Sample Data</button>
                </td>
              </tr>
            </tbody>
          </table>
          {lookupError && <div className="msg error"><div className="title">Policy not found</div>{lookupError}</div>}
          {lookedUpPolicy && (
            <div className="msg success" style={{ marginTop: 8 }}>
              <div className="title">Policy verified</div>
              <table className="formgrid" style={{ marginTop: 4 }}>
                <tbody>
                  <tr>
                    <td className="label">Insured:</td><td className="field"><strong>{lookedUpPolicy.insured}</strong>{lookedUpPolicy.dba ? ` (DBA ${lookedUpPolicy.dba})` : ''}</td>
                    <td className="label">Status:</td><td className="field"><span className="pill green">{lookedUpPolicy.status}</span></td>
                  </tr>
                  <tr>
                    <td className="label">Line:</td><td className="field">{lookedUpPolicy.line}</td>
                    <td className="label">Form:</td><td className="field">{lookedUpPolicy.form}</td>
                  </tr>
                  <tr>
                    <td className="label">Period:</td><td className="field">{fmtDate(lookedUpPolicy.effective)} – {fmtDate(lookedUpPolicy.expiration)}</td>
                    <td className="label">Retro Date:</td><td className="field"><strong>{fmtDate(lookedUpPolicy.retroDate)}</strong></td>
                  </tr>
                  <tr>
                    <td className="label">Per-Occ Limit:</td><td className="field">{fmtMoney0(lookedUpPolicy.occLimit)}</td>
                    <td className="label">Aggregate:</td><td className="field">{fmtMoney0(lookedUpPolicy.aggLimit)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="meta" style={{ marginTop: 6 }}>Verify date of loss is on or after the retroactive date and within the policy period (claims-made coverage).</div>
            </div>
          )}
        </div>

        {/* Incident Details */}
        <div className="section-bar">Incident Details</div>
        <div className="panel-body">
          <table className="formgrid">
            <tbody>
              <tr>
                <td className="label required">Date of Loss:</td><td className="field"><input type="date" value={form.dol} onChange={e => set({ dol: e.target.value })} /></td>
                <td className="label">Time of Incident:</td><td className="field"><input type="time" value={form.tol} onChange={e => set({ tol: e.target.value })} style={{ width: 120 }} /></td>
              </tr>
              <tr>
                <td className="label required">Date Reported:</td><td className="field"><input type="date" value={form.reported} onChange={e => set({ reported: e.target.value })} /></td>
                <td className="label">Date Discovered:</td><td className="field"><input type="date" value={form.discovered} onChange={e => set({ discovered: e.target.value })} /></td>
              </tr>
              <tr>
                <td className="label required">Type of Loss:</td>
                <td className="field">
                  <select value={form.lossType} onChange={e => set({ lossType: e.target.value })}>
                    <option value="">— Select —</option>
                    {lossTypes.map(t => <option key={t}>{t}</option>)}
                    <option>Other</option>
                  </select>
                </td>
                <td className="label required">Severity:</td>
                <td className="field">
                  <select value={form.severity} onChange={e => set({ severity: e.target.value })}>
                    <option>Low — minor / no injury</option>
                    <option>Medium — injury, treatment required</option>
                    <option>High — significant injury or death</option>
                    <option>Catastrophic — multi-claimant / class action</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td className="label">Incident Location:</td>
                <td className="field" colSpan={3}>
                  <input type="text" value={form.location} onChange={e => set({ location: e.target.value })} placeholder="Practice site / room — e.g. Riverside Rx, 412 Main St, Algona IA" style={{ width: 600 }} />
                </td>
              </tr>
              <tr>
                <td className="label">Incident State:</td>
                <td className="field">
                  <select value={form.incidentState} onChange={e => set({ incidentState: e.target.value })}>
                    <option value="">— Select —</option>
                    {states.map(st => <option key={st}>{st}</option>)}
                  </select>
                </td>
                <td className="label">Patient / Claimant Age:</td>
                <td className="field"><input type="number" value={form.patientAge} onChange={e => set({ patientAge: e.target.value })} min={0} max={120} style={{ width: 90 }} /></td>
              </tr>
              <tr>
                <td className="label required">Description:</td>
                <td className="field" colSpan={3}>
                  <textarea value={form.description} onChange={e => set({ description: e.target.value })} rows={4} style={{ width: 600 }} placeholder="Describe what happened: clinical setting, medication / procedure involved, patient outcome, immediate response. Do NOT include opinions on fault." />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Credentialed Staff */}
        <div className="section-bar">Credentialed Staff Involved</div>
        <div className="panel-body">
          <table className="formgrid">
            <tbody>
              <tr>
                <td className="label required">Primary Staff Name:</td>
                <td className="field"><input type="text" value={form.staffName} onChange={e => set({ staffName: e.target.value })} style={{ width: 280 }} /></td>
                <td className="label required">Role:</td>
                <td className="field">
                  <select value={form.staffRole} onChange={e => set({ staffRole: e.target.value })}>
                    {['Pharmacist (RPh / PharmD)', 'Pharmacy Technician', 'Dentist (DDS / DMD)', 'Dental Hygienist (RDH)', 'Veterinarian (DVM)', 'Veterinary Technician', 'RN — Registered Nurse', 'LPN / LVN', 'CNA', 'Caregiver / Direct Care Staff', 'Practice Owner', 'Other'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="label">License #:</td>
                <td className="field"><input type="text" value={form.licenseNum} onChange={e => set({ licenseNum: e.target.value })} placeholder="State board license number" /></td>
                <td className="label">License State:</td>
                <td className="field">
                  <select value={form.licenseState} onChange={e => set({ licenseState: e.target.value })}>
                    <option value="">— Select —</option>
                    {states.map(st => <option key={st}>{st}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="label">On-Duty at Time of Incident?</td>
                <td className="field">
                  <label><input type="radio" name="onduty" value="Y" checked={form.onDuty === 'Y'} onChange={() => set({ onDuty: 'Y' })} /> Yes</label>&nbsp;&nbsp;
                  <label><input type="radio" name="onduty" value="N" checked={form.onDuty === 'N'} onChange={() => set({ onDuty: 'N' })} /> No</label>
                </td>
                <td className="label">Substance Use Concern?</td>
                <td className="field">
                  <label><input type="radio" name="dui" value="N" checked={form.substanceConcern === 'N'} onChange={() => set({ substanceConcern: 'N' })} /> No</label>&nbsp;&nbsp;
                  <label><input type="radio" name="dui" value="Y" checked={form.substanceConcern === 'Y'} onChange={() => set({ substanceConcern: 'Y' })} /> Yes</label>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Claimant */}
        <div className="section-bar">Claimant / Patient Information</div>
        <div className="panel-body">
          <table className="formgrid">
            <tbody>
              <tr>
                <td className="label">Claimant Name:</td>
                <td className="field"><input type="text" value={form.claimantName} onChange={e => set({ claimantName: e.target.value })} style={{ width: 280 }} /></td>
                <td className="label">Relationship:</td>
                <td className="field">
                  <select value={form.claimantRelationship} onChange={e => set({ claimantRelationship: e.target.value })}>
                    {['Patient', "Patient's Family", 'Visitor / Third Party', 'Resident', 'Pet Owner', 'Estate / Executor'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="label">Claimant Phone:</td>
                <td className="field"><input type="text" value={form.claimantPhone} onChange={e => set({ claimantPhone: e.target.value })} placeholder="(515) 555-0142" /></td>
                <td className="label">Attorney Retained?</td>
                <td className="field">
                  <label><input type="radio" name="atty" value="N" checked={form.attorneyRetained === 'N'} onChange={() => set({ attorneyRetained: 'N' })} /> No</label>&nbsp;&nbsp;
                  <label><input type="radio" name="atty" value="Y" checked={form.attorneyRetained === 'Y'} onChange={() => set({ attorneyRetained: 'Y' })} /> Yes — name in description</label>
                </td>
              </tr>
              <tr>
                <td className="label">Injuries / Outcome:</td>
                <td className="field">
                  <select value={form.outcome} onChange={e => set({ outcome: e.target.value })}>
                    {['No injury — near miss', 'Minor — treated & released', 'Hospitalization required', 'Permanent impairment', 'Death', 'Property / financial only'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </td>
                <td className="label">Estimated Exposure:</td>
                <td className="field"><input type="number" value={form.estDamages} onChange={e => set({ estDamages: e.target.value })} placeholder="50000" /> <span className="meta">USD</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Regulatory */}
        <div className="section-bar">Regulatory &amp; Notice Requirements</div>
        <div className="panel-body">
          <table className="formgrid">
            <tbody>
              <tr>
                <td className="label">State Board Notification Required?</td>
                <td className="field">
                  <label><input type="radio" name="board" value="N" checked={form.boardNotification === 'N'} onChange={() => set({ boardNotification: 'N' })} /> No</label>&nbsp;&nbsp;
                  <label><input type="radio" name="board" value="Y" checked={form.boardNotification === 'Y'} onChange={() => set({ boardNotification: 'Y' })} /> Yes — pharmacy/dental/vet/nursing board</label>
                </td>
                <td className="label">Adverse Event Report Filed?</td>
                <td className="field">
                  <label><input type="radio" name="aer" value="N" checked={form.adverseEventReport === 'N'} onChange={() => set({ adverseEventReport: 'N' })} /> No</label>&nbsp;&nbsp;
                  <label><input type="radio" name="aer" value="Y" checked={form.adverseEventReport === 'Y'} onChange={() => set({ adverseEventReport: 'Y' })} /> Yes — FDA MedWatch / state DOH</label>
                </td>
              </tr>
              <tr>
                <td className="label">HIPAA / PHI Involved?</td>
                <td className="field">
                  <label><input type="radio" name="hipaa" value="N" checked={form.hipaaInvolved === 'N'} onChange={() => set({ hipaaInvolved: 'N' })} /> No</label>&nbsp;&nbsp;
                  <label><input type="radio" name="hipaa" value="Y" checked={form.hipaaInvolved === 'Y'} onChange={() => set({ hipaaInvolved: 'Y' })} /> Yes — breach notification may apply</label>
                </td>
                <td className="label">Abuse / APS Reported?</td>
                <td className="field">
                  <label><input type="radio" name="aps" value="NA" checked={form.abuseReported === 'NA'} onChange={() => set({ abuseReported: 'NA' })} /> N/A</label>&nbsp;&nbsp;
                  <label><input type="radio" name="aps" value="Y" checked={form.abuseReported === 'Y'} onChange={() => set({ abuseReported: 'Y' })} /> Yes — APS / law enforcement</label>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Reporter */}
        <div className="section-bar">Reporter Information</div>
        <div className="panel-body">
          <table className="formgrid">
            <tbody>
              <tr>
                <td className="label required">Reporter Name:</td>
                <td className="field"><input type="text" value={form.reporterName} onChange={e => set({ reporterName: e.target.value })} style={{ width: 280 }} /></td>
                <td className="label required">Reporter Role:</td>
                <td className="field">
                  <select value={form.reporterRole} onChange={e => set({ reporterRole: e.target.value })}>
                    {['Policyholder / Practice Owner', 'Risk Manager', 'Agent / Producer', 'Adjuster', 'Defense Counsel', 'Third Party'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="label">Phone:</td>
                <td className="field"><input type="text" value={form.reporterPhone} onChange={e => set({ reporterPhone: e.target.value })} placeholder="(515) 555-0188" /></td>
                <td className="label">Email:</td>
                <td className="field"><input type="email" value={form.reporterEmail} onChange={e => set({ reporterEmail: e.target.value })} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="toolbar" style={{ borderTop: '1px solid #1c3a66' }}>
        <button className="btn" onClick={() => navigate(-1)}>‹ Cancel</button>
        <button className="btn" onClick={() => alert('Saved as draft. You may resume this FNOL from My Diary.')}>Save Draft</button>
        <span className="spacer" />
        <button className="btn primary" onClick={handleSubmit}>Submit FNOL ›</button>
      </div>
    </Chrome>
  )
}
