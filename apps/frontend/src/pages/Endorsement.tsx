import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Chrome from '../components/Chrome'
import { api } from '../lib/api'
import { fmtMoney, fmtDate } from '../lib/format'
import type { Policy } from '../lib/types'

const ENDORSEMENT_TYPES = [
  { value: 'limitInc',    label: 'Increase Per-Occurrence Limit' },
  { value: 'aggInc',      label: 'Increase Aggregate Limit' },
  { value: 'addEmployee', label: 'Add Scheduled Employee (W-2)' },
  { value: 'add1099',     label: 'Add Scheduled Contractor (1099)' },
  { value: 'retroChange', label: 'Change Retroactive Date' },
  { value: 'cyber',       label: 'Add Cyber / HIPAA Breach Endorsement' },
  { value: 'abuse',       label: 'Add Sexual Abuse & Molestation Sublimit' },
  { value: 'addLocation', label: 'Add Practice Location' },
  { value: 'nameChange',  label: 'Change Insured Name / DBA' },
  { value: 'addAI',       label: 'Add Additional Insured' },
]

export default function Endorsement() {
  const navigate = useNavigate()
  const [policies, setPolicies] = useState<Policy[]>([])
  const [states, setStates] = useState<string[]>([])
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('PMP-PH-210441')
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [endType, setEndType] = useState('')
  const [effDate, setEffDate] = useState('2026-06-01')
  const [reason, setReason] = useState('')
  const [premiumDelta, setPremiumDelta] = useState(0)
  const [issued, setIssued] = useState(false)

  // Dynamic form sub-fields
  const [limSel, setLimSel] = useState('0')
  const [retroSel, setRetroSel] = useState('')
  const [cybSel, setCybSel] = useState('0')
  const [abuSel, setAbuSel] = useState('0')

  // addEmployee / add1099
  const [personName, setPersonName] = useState('')
  const [personRole, setPersonRole] = useState('')
  const [personLicense, setPersonLicense] = useState('')

  // addLocation
  const [locStreet, setLocStreet] = useState('')
  const [locCity, setLocCity] = useState('')
  const [locState, setLocState] = useState('')
  const [locZip, setLocZip] = useState('')

  // nameChange
  const [newName, setNewName] = useState('')
  const [nameReason, setNameReason] = useState('Re-brand')

  // addAI
  const [aiName, setAiName] = useState('')
  const [aiType, setAiType] = useState('Landlord (premises)')

  useEffect(() => {
    Promise.all([
      api<Policy[]>('/api/policies'),
      api<string[]>('/api/lookups/states'),
    ])
      .then(([p, s]) => {
        setPolicies(p)
        setStates(s)
        const found = p.find(x => x.id === 'PMP-PH-210441') ?? p[0] ?? null
        setPolicy(found)
        if (found) setSelectedPolicyId(found.id)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function handlePolicyChange(id: string) {
    setSelectedPolicyId(id)
    const found = policies.find(p => p.id === id) ?? null
    setPolicy(found)
    setPremiumDelta(0)
    setEndType('')
  }

  function handleTypeChange(t: string) {
    setEndType(t)
    setLimSel('0')
    setRetroSel('')
    setCybSel('0')
    setAbuSel('0')
    // Flat-rate deltas
    const flatDeltas: Record<string, number> = {
      addEmployee: 320,
      add1099: 240,
      retroChange: 850,
      addLocation: 1450,
      nameChange: 0,
      addAI: 75,
    }
    if (t in flatDeltas) setPremiumDelta(flatDeltas[t])
    else setPremiumDelta(0)
  }

  function handleLimSel(v: string) {
    setLimSel(v)
    setPremiumDelta(parseFloat(v) || 0)
  }
  function handleRetroSel(v: string) {
    setRetroSel(v)
    setPremiumDelta(v ? 850 : 0)
  }
  function handleCybSel(v: string) {
    setCybSel(v)
    setPremiumDelta(parseFloat(v) || 0)
  }
  function handleAbuSel(v: string) {
    setAbuSel(v)
    setPremiumDelta(parseFloat(v) || 0)
  }

  const proRata = premiumDelta * (220 / 365)
  const basePremium = policy ? Number(policy.premium) : 0
  const sign = (n: number) => (n >= 0 ? '+' : '−')
  const deltaColor = premiumDelta < 0 ? '#7a1f1f' : '#2e6a22'

  function issueEndorsement() {
    if (!endType) { alert('Please select an endorsement type before issuing.'); return }
    setIssued(true)
    alert(`Endorsement END-${selectedPolicyId.slice(-6)}-002 has been issued effective ${effDate}. Revised declarations page has been emailed to ${policy?.insured ?? 'the insured'}.`)
  }

  function renderDynamicForm() {
    if (!endType) return null
    switch (endType) {
      case 'limitInc':
        return (
          <>
            <div className="section-bar">Details</div>
            <div className="panel-body">
              <table className="formgrid">
                <tbody>
                  <tr>
                    <td className="label required">New Per-Occurrence Limit:</td>
                    <td className="field">
                      <select value={limSel} onChange={e => handleLimSel(e.target.value)}>
                        <option value="0">— Select —</option>
                        <option value="850">$1M → $2M (+$850)</option>
                        <option value="1450">$1M → $3M (+$1,450)</option>
                        <option value="600">$2M → $3M (+$600)</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )
      case 'aggInc':
        return (
          <>
            <div className="section-bar">Details</div>
            <div className="panel-body">
              <table className="formgrid">
                <tbody>
                  <tr>
                    <td className="label required">New Aggregate Limit:</td>
                    <td className="field">
                      <select value={limSel} onChange={e => handleLimSel(e.target.value)}>
                        <option value="0">— Select —</option>
                        <option value="425">$3M → $5M (+$425)</option>
                        <option value="1100">$3M → $10M (+$1,100)</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )
      case 'addEmployee':
        return (
          <>
            <div className="section-bar">Details</div>
            <div className="panel-body">
              <table className="formgrid">
                <tbody>
                  <tr>
                    <td className="label required">Full Name:</td>
                    <td className="field" colSpan={3}><input type="text" value={personName} onChange={e => setPersonName(e.target.value)} style={{ width: 280 }} /></td>
                  </tr>
                  <tr>
                    <td className="label required">Role:</td>
                    <td className="field"><input type="text" value={personRole} onChange={e => setPersonRole(e.target.value)} placeholder="Staff Pharmacist / RN / DDS / DVM" style={{ width: 220 }} /></td>
                    <td className="label required">License #:</td>
                    <td className="field"><input type="text" value={personLicense} onChange={e => setPersonLicense(e.target.value)} /></td>
                  </tr>
                  <tr>
                    <td className="label">Hire Date:</td>
                    <td className="field"><input type="date" /></td>
                    <td className="label">Full-time:</td>
                    <td className="field"><label><input type="checkbox" defaultChecked /> Yes</label></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )
      case 'add1099':
        return (
          <>
            <div className="section-bar">Details</div>
            <div className="panel-body">
              <table className="formgrid">
                <tbody>
                  <tr>
                    <td className="label required">Contractor Name:</td>
                    <td className="field" colSpan={3}><input type="text" value={personName} onChange={e => setPersonName(e.target.value)} style={{ width: 280 }} /></td>
                  </tr>
                  <tr>
                    <td className="label required">Role / Title:</td>
                    <td className="field"><input type="text" value={personRole} onChange={e => setPersonRole(e.target.value)} /></td>
                    <td className="label required">License #:</td>
                    <td className="field"><input type="text" value={personLicense} onChange={e => setPersonLicense(e.target.value)} /></td>
                  </tr>
                  <tr>
                    <td className="label">Anticipated Hours / Year:</td>
                    <td className="field"><input type="number" /></td>
                    <td className="label">Per-Diem Rate:</td>
                    <td className="field"><input type="text" placeholder="$650/day" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )
      case 'retroChange':
        return (
          <>
            <div className="section-bar">Details</div>
            <div className="panel-body">
              <table className="formgrid">
                <tbody>
                  <tr>
                    <td className="label required">Current Retroactive Date:</td>
                    <td className="field">{fmtDate(policy?.retroDate)}</td>
                  </tr>
                  <tr>
                    <td className="label required">New Retroactive Date:</td>
                    <td className="field"><input type="date" value={retroSel} onChange={e => handleRetroSel(e.target.value)} /></td>
                  </tr>
                </tbody>
              </table>
              <div className="msg warning" style={{ marginTop: 10 }}>
                <div className="title">Important</div>
                Earlier retroactive dates expand prior-acts coverage and trigger additional premium. The retroactive date may never be advanced (moved later) once set.
              </div>
            </div>
          </>
        )
      case 'cyber':
        return (
          <>
            <div className="section-bar">Details</div>
            <div className="panel-body">
              <table className="formgrid">
                <tbody>
                  <tr>
                    <td className="label required">Sublimit:</td>
                    <td className="field">
                      <select value={cybSel} onChange={e => handleCybSel(e.target.value)}>
                        <option value="0">— Select —</option>
                        <option value="480">$100K / $250K (+$480/yr)</option>
                        <option value="960">$250K / $500K (+$960/yr)</option>
                        <option value="1850">$500K / $1M (+$1,850/yr)</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="msg info" style={{ marginTop: 10 }}>
                <div className="title">Cyber / HIPAA Breach Response</div>
                Covers forensic investigation, regulatory notification, credit monitoring and PR consulting following a covered privacy event.
              </div>
            </div>
          </>
        )
      case 'abuse':
        return (
          <>
            <div className="section-bar">Details</div>
            <div className="panel-body">
              <table className="formgrid">
                <tbody>
                  <tr>
                    <td className="label required">Sublimit:</td>
                    <td className="field">
                      <select value={abuSel} onChange={e => handleAbuSel(e.target.value)}>
                        <option value="0">— Select —</option>
                        <option value="1200">$500K / $1M (+$1,200/yr)</option>
                        <option value="2400">$1M / $2M (+$2,400/yr)</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="msg warning" style={{ marginTop: 10 }}>
                <div className="title">Abuse &amp; Molestation</div>
                Recommended for senior living, home health and hospice exposures. Carrier requires a formal abuse-prevention training program to bind this endorsement.
              </div>
            </div>
          </>
        )
      case 'addLocation':
        return (
          <>
            <div className="section-bar">Details</div>
            <div className="panel-body">
              <table className="formgrid">
                <tbody>
                  <tr>
                    <td className="label required">Street Address:</td>
                    <td className="field" colSpan={3}><input type="text" value={locStreet} onChange={e => setLocStreet(e.target.value)} style={{ width: 380 }} /></td>
                  </tr>
                  <tr>
                    <td className="label required">City:</td>
                    <td className="field"><input type="text" value={locCity} onChange={e => setLocCity(e.target.value)} /></td>
                    <td className="label required">State / ZIP:</td>
                    <td className="field">
                      <select value={locState} onChange={e => setLocState(e.target.value)} style={{ width: 70 }}>
                        {states.map(s => <option key={s}>{s}</option>)}
                      </select>{' '}
                      <input type="text" value={locZip} onChange={e => setLocZip(e.target.value)} style={{ width: 90 }} placeholder="ZIP" />
                    </td>
                  </tr>
                  <tr>
                    <td className="label">Headcount at this site:</td>
                    <td className="field"><input type="number" /></td>
                    <td className="label">Opens:</td>
                    <td className="field"><input type="date" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )
      case 'nameChange':
        return (
          <>
            <div className="section-bar">Details</div>
            <div className="panel-body">
              <table className="formgrid">
                <tbody>
                  <tr>
                    <td className="label required">Current Legal Name:</td>
                    <td className="field" colSpan={3}>{policy?.insured}</td>
                  </tr>
                  <tr>
                    <td className="label required">New Legal Name / DBA:</td>
                    <td className="field" colSpan={3}><input type="text" value={newName} onChange={e => setNewName(e.target.value)} style={{ width: 380 }} /></td>
                  </tr>
                  <tr>
                    <td className="label">Reason:</td>
                    <td className="field" colSpan={3}>
                      <select value={nameReason} onChange={e => setNameReason(e.target.value)}>
                        <option>Re-brand</option>
                        <option>M&amp;A — Asset Purchase</option>
                        <option>M&amp;A — Stock Purchase</option>
                        <option>Conversion (LLC ↔ Corp)</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )
      case 'addAI':
        return (
          <>
            <div className="section-bar">Details</div>
            <div className="panel-body">
              <table className="formgrid">
                <tbody>
                  <tr>
                    <td className="label required">Additional Insured:</td>
                    <td className="field" colSpan={3}><input type="text" value={aiName} onChange={e => setAiName(e.target.value)} placeholder="Landlord / Vendor / Hospital" style={{ width: 380 }} /></td>
                  </tr>
                  <tr>
                    <td className="label required">Type:</td>
                    <td className="field">
                      <select value={aiType} onChange={e => setAiType(e.target.value)}>
                        <option>Landlord (premises)</option>
                        <option>Vendor</option>
                        <option>Hospital / Health System</option>
                        <option>Contract — Required AI</option>
                      </select>
                    </td>
                    <td className="label">Form:</td>
                    <td className="field">CG 20 11</td>
                  </tr>
                  <tr>
                    <td className="label">Certificate Holder Address:</td>
                    <td className="field" colSpan={3}><input type="text" style={{ width: 380 }} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )
      default:
        return (
          <>
            <div className="section-bar">Details</div>
            <div className="panel-body">
              <div className="muted">Choose an endorsement type to see required details.</div>
            </div>
          </>
        )
    }
  }

  return (
    <Chrome>
      <div className="crumbs">
        Home <span className="sep">&rsaquo;</span>
        Assure Policy <span className="sep">&rsaquo;</span>
        {policy && <><span className="sep" />{policy.id} <span className="sep">&rsaquo;</span></>}
        <span>Issue Endorsement</span>
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
            Issue Policy Endorsement
            {policy && (
              <span className="id">
                {policy.id} &middot; {policy.line} &middot; {policy.insured}
              </span>
            )}
          </div>

          {/* Policy picker */}
          {policies.length > 1 && (
            <div style={{ marginBottom: 10 }}>
              <label className="label" style={{ marginRight: 8 }}>Policy:</label>
              <select value={selectedPolicyId} onChange={e => handlePolicyChange(e.target.value)}>
                {policies.map(p => (
                  <option key={p.id} value={p.id}>{p.id} — {p.insured}</option>
                ))}
              </select>
            </div>
          )}

          <div className="panel">
            <div className="section-bar">Endorsement Type</div>
            <div className="panel-body">
              <table className="formgrid">
                <tbody>
                  <tr>
                    <td className="label required">Endorsement Type:</td>
                    <td className="field">
                      <select value={endType} onChange={e => handleTypeChange(e.target.value)}>
                        <option value="">— Select —</option>
                        {ENDORSEMENT_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="label required">Effective Date:</td>
                    <td className="field">
                      <input type="date" value={effDate} onChange={e => setEffDate(e.target.value)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="label">Reason:</td>
                    <td className="field" colSpan={3}>
                      <input
                        type="text"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        style={{ width: 560 }}
                        placeholder="Brief description for the audit trail"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {renderDynamicForm()}

            <div className="section-bar">Premium Impact</div>
            <div className="panel-body">
              <table className="formgrid" style={{ maxWidth: 560 }}>
                <tbody>
                  <tr>
                    <td className="label">Current Annual Premium:</td>
                    <td className="field" style={{ textAlign: 'right' }}>{fmtMoney(basePremium)}</td>
                  </tr>
                  <tr>
                    <td className="label">Premium Change:</td>
                    <td className="field">
                      <span style={{ fontSize: 13, fontWeight: 600, color: deltaColor }}>
                        {sign(premiumDelta)}{fmtMoney(Math.abs(premiumDelta))}
                      </span>{' '}
                      <span className="hint">
                        {premiumDelta === 0 ? 'Select an endorsement type to calculate' : 'Premium recalculated'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="label">Pro-Rata Adjustment:</td>
                    <td className="field">
                      <span style={{ fontSize: 13, color: '#666' }}>
                        {sign(proRata)}{fmtMoney(Math.abs(proRata))}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="label">New Annual Premium:</td>
                    <td className="field" style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: 14, color: '#1c3a66' }}>{fmtMoney(basePremium + premiumDelta)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="toolbar" style={{ borderTop: '1px solid #1c3a66' }}>
            <button className="btn" onClick={() => navigate(-1)}>‹ Cancel</button>
            <button className="btn" onClick={() => alert('Saved as draft — this endorsement was saved as a draft and can be resumed later.')}>
              Save Draft
            </button>
            <span className="spacer" />
            <button
              className="btn primary"
              onClick={issueEndorsement}
              disabled={issued}
            >
              Issue Endorsement
            </button>
          </div>
        </>
      )}
    </Chrome>
  )
}
