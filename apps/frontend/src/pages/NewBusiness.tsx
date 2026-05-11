import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Chrome from '../components/Chrome'
import { api } from '../lib/api'
import { fmtMoney, fmtMoney0, fmtDate } from '../lib/format'

// ── Types ─────────────────────────────────────────────────────────────────────

type LineKind = 'pharm' | 'dental' | 'vet' | 'homehealth' | 'senior'

interface UWQuestion {
  key: string
  label: string
  type: 'yn' | 'text'
}

interface PremiumBreakdown {
  base: number
  limitFactor: number
  lossFactor: number
  umbrella: number
  fee: number
  tax: number
  total: number
}

interface NBState {
  step: number
  quoteId: string
  insured: {
    name: string; dba: string; taxId: string; email: string; phone: string
    addr: string; city: string; stateCode: string; zip: string
  }
  practice: {
    line: string; headcount: number; payroll: number; bedCount: number
    sitesCount: number; yearsInBusiness: number; priorActsCoverage: boolean
    priorCarrier: string
  }
  risk: {
    lossCount3yr: number; lossPaid3yr: number; priorClaimNotes: string
    hasDisciplinaryAction: boolean
  }
  coverage: {
    occLimit: number; aggLimit: number; retroDate: string; cyberAdd: boolean
    abuseAdd: boolean; umbrella: number; effDate: string
  }
  uwAnswers: Record<string, string | null>
  quotedPremium: PremiumBreakdown | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function lineKind(line: string): LineKind {
  const l = line.toLowerCase()
  if (l.includes('pharm')) return 'pharm'
  if (l.includes('dent')) return 'dental'
  if (l.includes('vet')) return 'vet'
  if (l.includes('home health') || l.includes('hospice') || l.includes('home medical')) return 'homehealth'
  if (l.includes('senior') || l.includes('snf') || l.includes('nursing')) return 'senior'
  return 'pharm'
}

function labelForKind(kind: LineKind): string {
  const map: Record<LineKind, string> = {
    pharm: 'Pharmacy', dental: 'Dental Practice', vet: 'Veterinary Practice',
    homehealth: 'Home Health & Hospice', senior: 'Senior Living / SNF',
  }
  return map[kind]
}

function uwQuestions(kind: LineKind): UWQuestion[] {
  if (kind === 'pharm') return [
    { key: 'compounding', label: 'Does the pharmacy perform sterile (USP 797) or non-sterile (USP 795) compounding?', type: 'yn' },
    { key: 'dme', label: 'Does the pharmacy dispense durable medical equipment (DME)?', type: 'yn' },
    { key: 'immunize', label: 'Do pharmacists administer immunizations or point-of-care testing?', type: 'yn' },
    { key: 'rxVolume', label: 'Average weekly prescription volume:', type: 'text' },
    { key: 'autoScripts', label: 'Is the dispensing system automated (e.g. Parata, ScriptPro)?', type: 'yn' },
  ]
  if (kind === 'dental') return [
    { key: 'oralSurgery', label: 'Are oral surgery / extraction procedures performed in-office?', type: 'yn' },
    { key: 'sedation', label: 'Is IV moderate or deep sedation used (beyond local anesthetic)?', type: 'yn' },
    { key: 'implants', label: 'Are dental implants placed in-house?', type: 'yn' },
    { key: 'orthodontics', label: 'Does the practice provide orthodontic services?', type: 'yn' },
    { key: 'avgPatients', label: 'Average patients per dentist per day:', type: 'text' },
  ]
  if (kind === 'vet') return [
    { key: 'speciesMix', label: 'Species mix (small / large / equine / exotic):', type: 'text' },
    { key: 'emergency', label: 'Does the clinic provide after-hours emergency or 24/7 care?', type: 'yn' },
    { key: 'surgery', label: 'Are major surgeries (orthopedic, soft-tissue) performed in-house?', type: 'yn' },
    { key: 'boarding', label: 'Is boarding or grooming offered as a service?', type: 'yn' },
    { key: 'controlledSub', label: 'Does the clinic store DEA-controlled substances on-premises?', type: 'yn' },
  ]
  if (kind === 'homehealth') return [
    { key: 'serviceMix', label: 'Service mix (Skilled Nursing / Home Health Aide / Hospice / PT-OT):', type: 'text' },
    { key: 'rnSupervision', label: 'Is every patient under written RN supervision and care plan?', type: 'yn' },
    { key: 'backgroundChk', label: 'Are all caregivers run through state and federal background checks every 12 months?', type: 'yn' },
    { key: 'medAdmin', label: 'Do caregivers administer medications (oral, injection, IV)?', type: 'yn' },
    { key: 'pediatric', label: 'Does the agency serve pediatric or ventilator-dependent patients?', type: 'yn' },
  ]
  // senior
  return [
    { key: 'careLevels', label: 'Care levels offered (Independent / Assisted / Memory Care / SNF):', type: 'text' },
    { key: 'cmsRating', label: 'Current CMS Five-Star Quality Rating:', type: 'text' },
    { key: 'pressureUlcer', label: 'Pressure ulcer rate in past 12 months (per 1,000 resident days):', type: 'text' },
    { key: 'fallRate', label: 'Average falls per 1,000 resident days (last 12 months):', type: 'text' },
    { key: 'abuseProgram', label: 'Does the facility have a formal abuse prevention training program (annual)?', type: 'yn' },
    { key: 'elopement', label: 'Are exit doors alarmed and electronically monitored 24/7?', type: 'yn' },
  ]
}

function calcPremium(s: NBState): PremiumBreakdown {
  const kind = lineKind(s.practice.line)
  const ratePerUnit: Record<LineKind, number> = { pharm: 380, dental: 540, vet: 460, homehealth: 720, senior: 980 }
  const units = (kind === 'senior' || kind === 'homehealth')
    ? Math.max(s.practice.bedCount || s.practice.headcount, 1)
    : Math.max(s.practice.headcount, 1)
  const base = ratePerUnit[kind] * units
  const limitFactorMap: Record<number, number> = { 500000: 0.75, 1000000: 1.0, 2000000: 1.45, 3000000: 1.80 }
  const limitFactor = limitFactorMap[s.coverage.occLimit] ?? 1.0
  const lossFactor = s.risk.lossCount3yr >= 3 ? 1.50 : s.risk.lossCount3yr === 2 ? 1.25 : s.risk.lossCount3yr === 1 ? 1.10 : 1.0
  const core = base * limitFactor * lossFactor
  let umbrella = 0
  if (s.coverage.umbrella === 1000000) umbrella = 1800
  if (s.coverage.umbrella === 5000000) umbrella = 5400
  const endorsements = (s.coverage.cyberAdd ? 480 : 0) + (s.coverage.abuseAdd ? 1200 : 0)
  const subtotal = core + umbrella + endorsements
  const fee = 75
  const tax = +(subtotal * 0.03).toFixed(2)
  const total = +(subtotal + fee + tax).toFixed(2)
  return { base, limitFactor, lossFactor, umbrella, fee, tax, total }
}

function needsReferral(s: NBState): string | null {
  if (s.risk.lossCount3yr >= 3) return '3 or more prior claims in 3 years.'
  if (s.risk.hasDisciplinaryAction) return 'Disciplinary / board action disclosed.'
  if ((s.coverage.umbrella || 0) >= 5000000) return 'Umbrella limit ≥ $5M requires UW approval.'
  if (s.practice.bedCount >= 100) return 'Senior living / hospice facilities with 100+ beds require UW approval.'
  if (lineKind(s.practice.line) === 'pharm' && s.uwAnswers['compounding'] === 'Yes') return 'Sterile compounding (USP 797) requires UW review.'
  return null
}

function defaultEffDate(): string {
  return new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
}

function makeQuoteId(): string {
  return 'PMQ-' + Math.floor(Math.random() * 900000 + 100000)
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NewBusiness() {
  const navigate = useNavigate()
  const [lines, setLines] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])

  const [s, setS] = useState<NBState>(() => ({
    step: 1,
    quoteId: makeQuoteId(),
    insured: { name: '', dba: '', taxId: '', email: '', phone: '', addr: '', city: '', stateCode: 'IA', zip: '' },
    practice: { line: 'Pharmacist Professional Liability', headcount: 1, payroll: 0, bedCount: 0, sitesCount: 1, yearsInBusiness: 5, priorActsCoverage: false, priorCarrier: '' },
    risk: { lossCount3yr: 0, lossPaid3yr: 0, priorClaimNotes: '', hasDisciplinaryAction: false },
    coverage: { occLimit: 1000000, aggLimit: 3000000, retroDate: '', cyberAdd: false, abuseAdd: false, umbrella: 0, effDate: defaultEffDate() },
    uwAnswers: {},
    quotedPremium: null,
  }))

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api<string[]>('/api/lookups/lines'),
      api<string[]>('/api/lookups/states'),
    ]).then(([l, st]) => { setLines(l); setStates(st) })
      .catch(e => setError(e.message))
  }, [])

  const STEPS = ['Insured & Practice', 'Risk Profile', 'Coverage', 'UW Questions', 'Quote & Bind']
  const kind = lineKind(s.practice.line)

  function update(patch: Partial<NBState>) {
    setS(prev => ({ ...prev, ...patch }))
  }

  function updateInsured(patch: Partial<NBState['insured']>) {
    setS(prev => ({ ...prev, insured: { ...prev.insured, ...patch } }))
  }

  function updatePractice(patch: Partial<NBState['practice']>) {
    setS(prev => ({ ...prev, practice: { ...prev.practice, ...patch } }))
  }

  function updateRisk(patch: Partial<NBState['risk']>) {
    setS(prev => ({ ...prev, risk: { ...prev.risk, ...patch } }))
  }

  function updateCoverage(patch: Partial<NBState['coverage']>) {
    setS(prev => ({ ...prev, coverage: { ...prev.coverage, ...patch }, quotedPremium: null }))
  }

  function updateUWAnswer(key: string, val: string | null) {
    setS(prev => ({ ...prev, uwAnswers: { ...prev.uwAnswers, [key]: val } }))
  }

  function nextStep() {
    if (s.step === 1) {
      if (!s.insured.name || !s.insured.taxId || !s.insured.addr || !s.insured.city || !s.insured.zip || !s.practice.headcount) {
        setError('Please complete all required fields marked with a red asterisk before continuing.')
        return
      }
    }
    setError(null)
    update({ step: s.step + 1 })
  }

  function prevStep() {
    setError(null)
    update({ step: s.step - 1 })
  }

  function getOrCalcPremium(): PremiumBreakdown {
    if (s.quotedPremium) return s.quotedPremium
    const p = calcPremium(s)
    setS(prev => ({ ...prev, quotedPremium: p }))
    return p
  }

  function handleBind() {
    const p = getOrCalcPremium()
    const abbr: Record<LineKind, string> = { pharm: 'PH', dental: 'DN', vet: 'VT', homehealth: 'HH', senior: 'SL' }
    const seq = s.quoteId.replace(/^PMQ-?/, '').replace(/\D/g, '').slice(-6) || String(Math.floor(Math.random() * 900000 + 100000))
    const newId = `PMP-${abbr[kind]}-${seq}`
    if (!confirm(`Bind policy ${newId} for ${fmtMoney(p.total)}?`)) return
    alert('Quote submitted (demo)')
    navigate('/policy-search')
  }

  function handleReferral() {
    alert(`Quote ${s.quoteId} has been routed to David Chen for underwriting review. Expected response: 1-2 business days.`)
  }

  // ── Step Renders ─────────────────────────────────────────────────────────────

  function renderStep1() {
    const isSenior = kind === 'senior'
    const isHomeHealth = kind === 'homehealth'
    return (
      <>
        <div className="section-bar">Line of Business</div>
        <table className="formgrid">
          <tbody>
            <tr>
              <td className="label required">Line of Business:</td>
              <td className="field">
                <select value={s.practice.line} onChange={e => updatePractice({ line: e.target.value })}>
                  {lines.map(l => <option key={l}>{l}</option>)}
                </select>
                <div className="hint">Selecting a line will tailor the underwriting questions and supplemental applications.</div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="section-bar">Named Insured / DBA</div>
        <table className="formgrid">
          <tbody>
            <tr><td className="label required">Legal Entity Name:</td><td className="field"><input value={s.insured.name} onChange={e => updateInsured({ name: e.target.value })} placeholder="e.g. Riverside Community Pharmacy LLC" style={{ width: 360 }} /></td></tr>
            <tr><td className="label">DBA / Trade Name:</td><td className="field"><input value={s.insured.dba} onChange={e => updateInsured({ dba: e.target.value })} style={{ width: 360 }} /></td></tr>
            <tr><td className="label required">Federal Tax ID (EIN):</td><td className="field"><input value={s.insured.taxId} onChange={e => updateInsured({ taxId: e.target.value })} placeholder="XX-XXXXXXX" /></td></tr>
            <tr><td className="label">Contact Email:</td><td className="field"><input value={s.insured.email} onChange={e => updateInsured({ email: e.target.value })} style={{ width: 280 }} /></td></tr>
            <tr><td className="label">Contact Phone:</td><td className="field"><input value={s.insured.phone} onChange={e => updateInsured({ phone: e.target.value })} placeholder="(515) 555-0100" /></td></tr>
          </tbody>
        </table>

        <div className="section-bar">Mailing Address</div>
        <table className="formgrid">
          <tbody>
            <tr><td className="label required">Street Address:</td><td className="field"><input value={s.insured.addr} onChange={e => updateInsured({ addr: e.target.value })} style={{ width: 380 }} /></td></tr>
            <tr><td className="label required">City:</td><td className="field"><input value={s.insured.city} onChange={e => updateInsured({ city: e.target.value })} /></td></tr>
            <tr>
              <td className="label required">State:</td>
              <td className="field">
                <select value={s.insured.stateCode} onChange={e => updateInsured({ stateCode: e.target.value })}>
                  {states.map(st => <option key={st}>{st}</option>)}
                </select>
              </td>
            </tr>
            <tr><td className="label required">ZIP:</td><td className="field"><input value={s.insured.zip} onChange={e => updateInsured({ zip: e.target.value })} maxLength={10} /></td></tr>
          </tbody>
        </table>

        <div className="section-bar">Practice / Facility Details</div>
        <table className="formgrid">
          <tbody>
            <tr><td className="label required">Total Headcount (W-2 + 1099):</td><td className="field"><input type="number" value={s.practice.headcount} onChange={e => updatePractice({ headcount: parseInt(e.target.value) || 0 })} /></td></tr>
            <tr><td className="label">Annual Payroll (USD):</td><td className="field"><input type="number" value={s.practice.payroll} onChange={e => updatePractice({ payroll: parseFloat(e.target.value) || 0 })} style={{ width: 160 }} /></td></tr>
            <tr><td className="label">Years in Business:</td><td className="field"><input type="number" value={s.practice.yearsInBusiness} onChange={e => updatePractice({ yearsInBusiness: parseInt(e.target.value) || 0 })} /></td></tr>
            {isSenior && <>
              <tr><td className="label required">Licensed Bed Count:</td><td className="field"><input type="number" value={s.practice.bedCount} onChange={e => updatePractice({ bedCount: parseInt(e.target.value) || 0 })} /></td></tr>
              <tr><td className="label">Number of Sites:</td><td className="field"><input type="number" value={s.practice.sitesCount} onChange={e => updatePractice({ sitesCount: parseInt(e.target.value) || 1 })} /></td></tr>
            </>}
            {isHomeHealth && <>
              <tr><td className="label required">Active Patient Census:</td><td className="field"><input type="number" value={s.practice.bedCount} onChange={e => updatePractice({ bedCount: parseInt(e.target.value) || 0 })} /></td></tr>
              <tr><td className="label">Number of Service Areas:</td><td className="field"><input type="number" value={s.practice.sitesCount} onChange={e => updatePractice({ sitesCount: parseInt(e.target.value) || 1 })} /></td></tr>
            </>}
            {!isSenior && !isHomeHealth &&
              <tr><td className="label">Number of Practice Locations:</td><td className="field"><input type="number" value={s.practice.sitesCount} onChange={e => updatePractice({ sitesCount: parseInt(e.target.value) || 1 })} /></td></tr>
            }
          </tbody>
        </table>
      </>
    )
  }

  function renderStep2() {
    return (
      <>
        <div className="section-bar">Prior Loss History (Past 3 Policy Years)</div>
        <table className="formgrid">
          <tbody>
            <tr><td className="label required">Number of Reported Incidents:</td><td className="field"><input type="number" value={s.risk.lossCount3yr} onChange={e => updateRisk({ lossCount3yr: parseInt(e.target.value) || 0 })} /></td></tr>
            <tr><td className="label">Total Amount Paid (USD):</td><td className="field"><input type="number" value={s.risk.lossPaid3yr} onChange={e => updateRisk({ lossPaid3yr: parseFloat(e.target.value) || 0 })} style={{ width: 160 }} /></td></tr>
            <tr><td className="label">Brief Description of Prior Claims:</td><td className="field"><textarea value={s.risk.priorClaimNotes} onChange={e => updateRisk({ priorClaimNotes: e.target.value })} style={{ width: 480, height: 70 }} /></td></tr>
            <tr>
              <td className="label">Disciplinary Action / Board Complaint?</td>
              <td className="field">
                <label><input type="radio" name="r_disc" checked={s.risk.hasDisciplinaryAction} onChange={() => updateRisk({ hasDisciplinaryAction: true })} value="1" /> Yes</label>
                &nbsp;&nbsp;
                <label><input type="radio" name="r_disc" checked={!s.risk.hasDisciplinaryAction} onChange={() => updateRisk({ hasDisciplinaryAction: false })} value="0" /> No</label>
              </td>
            </tr>
            <tr><td className="label">Prior Carrier:</td><td className="field"><input value={s.practice.priorCarrier} onChange={e => updatePractice({ priorCarrier: e.target.value })} /></td></tr>
            <tr>
              <td className="label">Prior Acts (Retro Date) Coverage Required?</td>
              <td className="field">
                <label><input type="checkbox" checked={s.practice.priorActsCoverage} onChange={e => updatePractice({ priorActsCoverage: e.target.checked })} /> Yes — request retroactive coverage from prior carrier inception</label>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="msg info"><div className="title">Underwriting Note</div>3+ paid claims in the past 3 policy years will trigger an automatic referral to underwriting.</div>
      </>
    )
  }

  function renderStep3() {
    const showAbuse = kind === 'senior' || kind === 'homehealth'
    return (
      <>
        <div className="section-bar">Limit Selection</div>
        <table className="formgrid">
          <tbody>
            <tr>
              <td className="label required">Per-Occurrence Limit:</td>
              <td className="field">
                <select value={s.coverage.occLimit} onChange={e => updateCoverage({ occLimit: parseInt(e.target.value) })}>
                  {[500000, 1000000, 2000000, 3000000].map(v => <option key={v} value={v}>{fmtMoney0(v)}</option>)}
                </select>
              </td>
            </tr>
            <tr>
              <td className="label required">Annual Aggregate Limit:</td>
              <td className="field">
                <select value={s.coverage.aggLimit} onChange={e => updateCoverage({ aggLimit: parseInt(e.target.value) })}>
                  {[1000000, 3000000, 5000000, 10000000].map(v => <option key={v} value={v}>{fmtMoney0(v)}</option>)}
                </select>
              </td>
            </tr>
            <tr><td className="label required">Policy Effective Date:</td><td className="field"><input type="date" value={s.coverage.effDate} onChange={e => updateCoverage({ effDate: e.target.value })} /></td></tr>
            <tr>
              <td className="label">Retroactive Date:</td>
              <td className="field">
                <input type="date" value={s.coverage.retroDate || s.coverage.effDate} onChange={e => updateCoverage({ retroDate: e.target.value })} />
                <div className="hint">Required for claims-made coverage. Defaults to effective date for first-time buyers.</div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="section-bar">Optional Endorsements</div>
        <table className="formgrid">
          <tbody>
            <tr><td className="label">Cyber Liability / HIPAA Breach Response:</td><td className="field"><label><input type="checkbox" checked={s.coverage.cyberAdd} onChange={e => updateCoverage({ cyberAdd: e.target.checked })} /> Add $100K / $250K sublimit (+ $480/yr)</label></td></tr>
            {showAbuse && <tr><td className="label">Sexual Abuse &amp; Molestation:</td><td className="field"><label><input type="checkbox" checked={s.coverage.abuseAdd} onChange={e => updateCoverage({ abuseAdd: e.target.checked })} /> Add $500K / $1M sublimit (+ $1,200/yr)</label></td></tr>}
            <tr>
              <td className="label">Commercial Umbrella:</td>
              <td className="field">
                <select value={s.coverage.umbrella} onChange={e => updateCoverage({ umbrella: parseInt(e.target.value) || 0 })}>
                  <option value={0}>None</option>
                  <option value={1000000}>$1M Umbrella (+ ~$1,800/yr)</option>
                  <option value={5000000}>$5M Umbrella (+ ~$5,400/yr)</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </>
    )
  }

  function renderStep4() {
    const qs = uwQuestions(kind)
    return (
      <>
        <div className="section-bar">{labelForKind(kind)} — Supplemental Underwriting Questions</div>
        {qs.map((q, i) => (
          <div key={q.key} className="uw-q">
            <label>{i + 1}. {q.label}</label>
            {q.type === 'yn' ? (
              <>
                <label><input type="radio" name={`q_${q.key}`} value="Yes" checked={s.uwAnswers[q.key] === 'Yes'} onChange={() => updateUWAnswer(q.key, 'Yes')} /> Yes</label>
                &nbsp;&nbsp;
                <label><input type="radio" name={`q_${q.key}`} value="No" checked={s.uwAnswers[q.key] === 'No'} onChange={() => updateUWAnswer(q.key, 'No')} /> No</label>
              </>
            ) : (
              <input type="text" value={s.uwAnswers[q.key] || ''} onChange={e => updateUWAnswer(q.key, e.target.value)} style={{ width: '90%' }} />
            )}
          </div>
        ))}
      </>
    )
  }

  function renderStep5() {
    const p = s.quotedPremium ?? calcPremium(s)
    if (!s.quotedPremium) setS(prev => ({ ...prev, quotedPremium: p }))
    const referred = needsReferral(s)
    const censusLabel = (kind === 'senior') ? 'Bed Count / Census' : (kind === 'homehealth') ? 'Active Patient Census' : 'Headcount'
    return (
      <>
        <div className="section-bar">Indicative Premium</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
          <div>
            <table className="formgrid">
              <tbody>
                <tr><td className="label">Insured:</td><td>{s.insured.name || <span className="muted">(missing)</span>}</td></tr>
                <tr><td className="label">Line:</td><td><span className="pill line">{s.practice.line}</span></td></tr>
                <tr><td className="label">Per-Occurrence Limit:</td><td>{fmtMoney0(s.coverage.occLimit)}</td></tr>
                <tr><td className="label">Aggregate Limit:</td><td>{fmtMoney0(s.coverage.aggLimit)}</td></tr>
                <tr><td className="label">Effective Date:</td><td>{fmtDate(s.coverage.effDate)}</td></tr>
                <tr><td className="label">Retroactive Date:</td><td>{fmtDate(s.coverage.retroDate || s.coverage.effDate)}</td></tr>
                <tr><td className="label">{censusLabel}:</td><td>{kind === 'senior' || kind === 'homehealth' ? (s.practice.bedCount || s.practice.headcount) : s.practice.headcount}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="pricepanel">
            <div className="row"><span>Base Premium</span><span>{fmtMoney(p.base)}</span></div>
            <div className="row"><span>Limit Factor</span><span>x {p.limitFactor.toFixed(2)}</span></div>
            <div className="row"><span>Loss Experience</span><span>{p.lossFactor >= 1 ? '+' : ''}{((p.lossFactor - 1) * 100).toFixed(1)}%</span></div>
            {s.coverage.cyberAdd && <div className="row"><span>Cyber Endorsement</span><span>{fmtMoney(480)}</span></div>}
            {s.coverage.abuseAdd && <div className="row"><span>Abuse Endorsement</span><span>{fmtMoney(1200)}</span></div>}
            {!!s.coverage.umbrella && <div className="row"><span>Umbrella (${s.coverage.umbrella / 1e6}M)</span><span>{fmtMoney(p.umbrella)}</span></div>}
            <div className="row"><span>Policy Fee</span><span>{fmtMoney(p.fee)}</span></div>
            <div className="row"><span>Surplus Lines Tax (3%)</span><span>{fmtMoney(p.tax)}</span></div>
            <div className="row total"><span>Total Annual Premium</span><span>{fmtMoney(p.total)}</span></div>
          </div>
        </div>

        <div className="section-bar">Bind Authority</div>
        {referred ? (
          <>
            <div className="msg warning"><div className="title">Referral Required</div>{referred} You may submit this quote to underwriting for review.</div>
            <button className="btn primary" onClick={handleReferral}>Submit to Underwriter</button>
          </>
        ) : (
          <>
            <div className="msg success"><div className="title">Eligible for Direct Bind</div>This quote falls within agent binding authority. You may bind immediately.</div>
            <button className="btn primary" onClick={handleBind}>Bind Policy</button>
          </>
        )}
        <button className="btn" onClick={() => alert(`Draft saved. Quote ${s.quoteId} can be retrieved from Quote Inquiry.`)} style={{ marginLeft: 8 }}>Save Draft</button>
      </>
    )
  }

  return (
    <Chrome>
      <div className="crumbs">
        <span className="link" onClick={() => navigate('/dashboard')}>Home</span>
        <span className="sep">&rsaquo;</span> New Business
      </div>

      <div className="pagetitle">
        New Business Quote
        <span className="id">{s.quoteId} &middot; {s.practice.line}</span>
      </div>

      {/* Wizard Steps */}
      <div className="wiz-steps">
        {STEPS.map((label, i) => {
          const n = i + 1
          const cls = n === s.step ? 's active' : n < s.step ? 's done' : 's'
          return <div key={n} className={cls}>Step {n}. {label}</div>
        })}
      </div>

      {error && <div className="msg error" style={{ marginBottom: 8 }}><div className="title">Validation Error</div>{error}</div>}

      <div className="panel">
        <div className="panel-body">
          {s.step === 1 && renderStep1()}
          {s.step === 2 && renderStep2()}
          {s.step === 3 && renderStep3()}
          {s.step === 4 && renderStep4()}
          {s.step === 5 && renderStep5()}
        </div>
      </div>

      {/* Footer nav */}
      <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
        {s.step > 1 && <button className="btn" onClick={prevStep}>‹ Back</button>}
        <span style={{ flex: 1 }} />
        <button className="btn" onClick={() => { if (confirm('Discard this quote and return to the dashboard?')) navigate('/dashboard') }}>Cancel Quote</button>
        {s.step < 5 && <button className="btn primary" onClick={nextStep}>Continue ›</button>}
      </div>
    </Chrome>
  )
}
