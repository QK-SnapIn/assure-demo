import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Chrome from '../components/Chrome'
import { api } from '../lib/api'
import { fmtMoney0, fmtDate } from '../lib/format'
import type { Policy } from '../lib/types'

const POLICY_ID = 'PMP-PH-210441'

export default function FileClaim() {
  const navigate = useNavigate()
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [lossTypes, setLossTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // Form fields
  const [dol, setDol] = useState('')
  const [discovered, setDiscovered] = useState('')
  const [lossType, setLossType] = useState('')
  const [outcome, setOutcome] = useState('No — near miss / no injury')
  const [description, setDescription] = useState('')
  const [patient, setPatient] = useState('')
  const [patientAge, setPatientAge] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [attorney, setAttorney] = useState('N')
  const [board, setBoard] = useState('N')
  const [hipaa, setHipaa] = useState('N')
  const [reporter, setReporter] = useState('David Park')
  const [reporterPhone, setReporterPhone] = useState('(515) 555-0188')
  const [reporterEmail, setReporterEmail] = useState('dpark@riversiderx.com')

  useEffect(() => {
    Promise.all([
      api<Policy>(`/api/policies/${POLICY_ID}`),
      api<string[]>('/api/lookups/loss-types'),
    ])
      .then(([p, lt]) => {
        setPolicy(p)
        setLossTypes(lt)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function submitClaim() {
    if (!dol || !lossType || !description || !reporter) {
      alert('Date of Loss, Type of Incident, Description, and Your Name are required.')
      return
    }
    if (policy && policy.retroDate && new Date(dol) < new Date(policy.retroDate)) {
      const proceed = window.confirm(
        `The date of loss (${fmtDate(dol)}) is before your retroactive date (${fmtDate(policy.retroDate)}). ` +
        `This incident may NOT be covered under your claims-made policy. Submit anyway for adjuster review?`
      )
      if (!proceed) return
    }
    if (!window.confirm('Submit this claim? A claim number will be assigned and an adjuster will contact you within 1 business day.')) return

    const claimId = 'CLM-77' + String(Math.floor(Math.random() * 899) + 100)
    setSubmitted(true)
    alert(
      `Claim Submitted — ${claimId}\n\n` +
      `Adjuster Linda Park will contact you at ${reporterPhone} within 1 business day.`
    )
  }

  return (
    <Chrome>
      <div className="crumbs">
        Home <span className="sep">&rsaquo;</span>
        Customer 360 <span className="sep">&rsaquo;</span>
        <span>File a Claim</span>
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
            File a New Claim
            <span className="id">Step 1 of 3 — Incident Details</span>
          </div>

          <div className="msg info">
            <div className="title">Before you start</div>
            Use this form to report a professional liability incident under your Pharmacists Mutual policy. If a patient
            has been seriously injured, has retained an attorney, or has filed a complaint with the state board, please{' '}
            <strong>also call (800) 247-5930</strong> immediately. Coverage is claims-made — incidents must fall on or
            after your retroactive date.
          </div>

          <div className="panel">
            <div className="section-bar">Your Policy</div>
            <div className="panel-body">
              {policy ? (
                <table className="formgrid">
                  <tbody>
                    <tr>
                      <td className="label">Insured:</td>
                      <td className="field"><strong>{policy.insured}</strong></td>
                      <td className="label">Policy #:</td>
                      <td className="field"><strong>{policy.id}</strong></td>
                    </tr>
                    <tr>
                      <td className="label">Line of Business:</td>
                      <td className="field">{policy.line}</td>
                      <td className="label">Status:</td>
                      <td className="field"><span className="pill green">{policy.status}</span></td>
                    </tr>
                    <tr>
                      <td className="label">Policy Period:</td>
                      <td className="field">{fmtDate(policy.effective)} – {fmtDate(policy.expiration)}</td>
                      <td className="label">Retroactive Date:</td>
                      <td className="field"><strong>{fmtDate(policy.retroDate)}</strong></td>
                    </tr>
                    <tr>
                      <td className="label">Per-Occurrence Limit:</td>
                      <td className="field">{fmtMoney0(policy.occLimit)}</td>
                      <td className="label">Aggregate Limit:</td>
                      <td className="field">{fmtMoney0(policy.aggLimit)}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <div className="muted">Policy not found.</div>
              )}
            </div>

            <div className="section-bar">What Happened?</div>
            <div className="panel-body">
              <table className="formgrid">
                <tbody>
                  <tr>
                    <td className="label required">Date of Loss / Incident:</td>
                    <td className="field">
                      <input type="date" value={dol} onChange={e => setDol(e.target.value)} />
                    </td>
                    <td className="label">Date You Discovered It:</td>
                    <td className="field">
                      <input type="date" value={discovered} onChange={e => setDiscovered(e.target.value)} />
                    </td>
                  </tr>
                  <tr>
                    <td className="label required">Type of Incident:</td>
                    <td className="field">
                      <select value={lossType} onChange={e => setLossType(e.target.value)}>
                        <option value="">— Select —</option>
                        {lossTypes.map(t => <option key={t}>{t}</option>)}
                        <option>Other</option>
                      </select>
                    </td>
                    <td className="label required">Was anyone hurt?</td>
                    <td className="field">
                      <select value={outcome} onChange={e => setOutcome(e.target.value)}>
                        <option>No — near miss / no injury</option>
                        <option>Minor — patient seen, no admission</option>
                        <option>Hospitalization required</option>
                        <option>Permanent impairment</option>
                        <option>Death</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className="label required">Describe what happened:</td>
                    <td className="field" colSpan={3}>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={5}
                        style={{ width: 600 }}
                        placeholder="Please describe the incident in your own words. Include: where it happened, what medication / procedure / activity was involved, who was on duty, and what action you have already taken (retraining, suspension, reporting). Stick to facts — do not speculate on fault."
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="section-bar">Patient / Claimant</div>
            <div className="panel-body">
              <table className="formgrid">
                <tbody>
                  <tr>
                    <td className="label">Patient Name:</td>
                    <td className="field">
                      <input type="text" value={patient} onChange={e => setPatient(e.target.value)} style={{ width: 260 }} />
                    </td>
                    <td className="label">Patient Age:</td>
                    <td className="field">
                      <input type="number" value={patientAge} onChange={e => setPatientAge(e.target.value)} min={0} max={120} style={{ width: 80 }} />
                    </td>
                  </tr>
                  <tr>
                    <td className="label">Phone:</td>
                    <td className="field">
                      <input type="text" value={patientPhone} onChange={e => setPatientPhone(e.target.value)} placeholder="(515) 555-0142" />
                    </td>
                    <td className="label">Has an attorney been retained?</td>
                    <td className="field">
                      <label style={{ marginRight: 12 }}>
                        <input type="radio" name="atty" value="N" checked={attorney === 'N'} onChange={() => setAttorney('N')} /> No / Don't Know
                      </label>
                      <label>
                        <input type="radio" name="atty" value="Y" checked={attorney === 'Y'} onChange={() => setAttorney('Y')} /> Yes
                      </label>
                    </td>
                  </tr>
                  <tr>
                    <td className="label">Has the patient filed a complaint with the state board?</td>
                    <td className="field" colSpan={3}>
                      <label style={{ marginRight: 12 }}>
                        <input type="radio" name="board" value="N" checked={board === 'N'} onChange={() => setBoard('N')} /> No / Don't Know
                      </label>
                      <label>
                        <input type="radio" name="board" value="Y" checked={board === 'Y'} onChange={() => setBoard('Y')} /> Yes — board has contacted us
                      </label>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="section-bar">HIPAA &amp; Privacy</div>
            <div className="panel-body">
              <table className="formgrid">
                <tbody>
                  <tr>
                    <td className="label">Does this incident involve a HIPAA / PHI breach?</td>
                    <td className="field" colSpan={3}>
                      <label style={{ marginRight: 12 }}>
                        <input type="radio" name="hipaa" value="N" checked={hipaa === 'N'} onChange={() => setHipaa('N')} /> No
                      </label>
                      <label>
                        <input type="radio" name="hipaa" value="Y" checked={hipaa === 'Y'} onChange={() => setHipaa('Y')} /> Yes — unauthorized disclosure of patient information
                      </label>
                      <div className="meta" style={{ marginTop: 6 }}>
                        If yes, we will engage our breach-coach panel within 4 hours. HHS breach notification timelines may apply (60 days for breaches affecting 500+ individuals).
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="section-bar">Your Contact Information</div>
            <div className="panel-body">
              <table className="formgrid">
                <tbody>
                  <tr>
                    <td className="label required">Your Name:</td>
                    <td className="field">
                      <input type="text" value={reporter} onChange={e => setReporter(e.target.value)} style={{ width: 280 }} />
                    </td>
                    <td className="label required">Your Role:</td>
                    <td className="field">
                      <input type="text" defaultValue="Pharmacy Owner / Pharmacist-in-Charge" style={{ width: 280 }} readOnly />
                    </td>
                  </tr>
                  <tr>
                    <td className="label">Best Phone:</td>
                    <td className="field">
                      <input type="text" value={reporterPhone} onChange={e => setReporterPhone(e.target.value)} />
                    </td>
                    <td className="label">Best Email:</td>
                    <td className="field">
                      <input type="email" value={reporterEmail} onChange={e => setReporterEmail(e.target.value)} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="toolbar" style={{ borderTop: '1px solid #1c3a66' }}>
            <button className="btn" onClick={() => navigate('/my-policy')}>‹ Cancel</button>
            <button className="btn" onClick={() => alert('Draft saved. You can resume from My Policy » Claims.')}>
              Save Draft
            </button>
            <span className="spacer" />
            <button className="btn primary" onClick={submitClaim} disabled={submitted}>
              Submit Claim ›
            </button>
          </div>
        </>
      )}
    </Chrome>
  )
}
