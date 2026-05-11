import { useState } from 'react'
import Chrome from '../components/Chrome'

interface UWNote {
  when: string
  quoteId: string
  insured: string
  action: string
  note: string
}

const MOCK_NOTES: UWNote[] = [
  {
    when: '5/9/2026 14:22',
    quoteId: 'PMQ-SL-210512',
    insured: 'Lakeside Skilled Nursing & Rehab',
    action: 'Under Review',
    note: '120-bed SNF in FL. Two abuse claims in past 3 years (one open). Requesting facility CMS 5-Star report and incident logs.',
  },
  {
    when: '5/9/2026 11:08',
    quoteId: 'PMQ-PH-210622',
    insured: 'Westside Compounding LLC',
    action: 'Under Review',
    note: 'Sterile compounding (USP 797). Awaiting state board inspection report and USP 800 hazardous-drug program documentation.',
  },
  {
    when: '5/8/2026 16:42',
    quoteId: 'PMQ-DN-210488',
    insured: 'Bayview Dental Group',
    action: 'Approved',
    note: 'Standard 9-FTE dental group. No deep sedation. Loss-free 5 yrs. Bind authorized.',
  },
  {
    when: '5/7/2026 09:15',
    quoteId: 'PMQ-HH-210210',
    insured: 'Sun Belt Home Care',
    action: 'Declined',
    note: '3 abuse claims in last 2 years. Adverse loss history — outside risk appetite.',
  },
]

const DECISIONS = ['Approve', 'Decline', 'Conditional', 'Request More Info']

function actionPill(action: string) {
  if (action === 'Approved') return <span className="pill green">Approved</span>
  if (action === 'Declined') return <span className="pill red">Declined</span>
  if (action === 'Under Review') return <span className="pill amber">Under Review</span>
  return <span className="pill gray">{action}</span>
}

export default function UWNotes() {
  const [notes, setNotes] = useState<UWNote[]>(MOCK_NOTES)
  const [newQuote, setNewQuote] = useState('')
  const [newDecision, setNewDecision] = useState('Approve')
  const [newNote, setNewNote] = useState('')

  function saveNote(e: React.FormEvent) {
    e.preventDefault()
    if (!newQuote || !newNote) {
      alert('Quote # and note text are required.')
      return
    }
    const now = new Date()
    const when = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
    setNotes([
      { when, quoteId: newQuote, insured: '—', action: newDecision, note: newNote },
      ...notes,
    ])
    setNewQuote('')
    setNewDecision('Approve')
    setNewNote('')
    alert('Underwriting note recorded.')
  }

  const openNotes = notes.filter((n) => n.action === 'Under Review').length

  return (
    <Chrome>
      <div className="crumbs">
        Home <span className="sep">&rsaquo;</span>{' '}
        <a href="/dashboard">Assure Policy</a>{' '}
        <span className="sep">&rsaquo;</span> <span>Underwriting Notes</span>
      </div>
      <div className="pagetitle">
        Underwriting Notes
        <span className="id">WK-UW-NOTES-001</span>
      </div>

      <div className="kpi-row" style={{ marginTop: 12 }}>
        <div className="kpi"><div className="label">My Open Notes</div><div className="value">{openNotes}</div></div>
        <div className="kpi"><div className="label">Approved (MTD)</div><div className="value">{notes.filter((n) => n.action === 'Approved').length}</div></div>
        <div className="kpi"><div className="label">Declined (MTD)</div><div className="value">{notes.filter((n) => n.action === 'Declined').length}</div></div>
      </div>

      <div className="section-bar" style={{ marginTop: 14 }}>Underwriting Activity</div>
      <table className="gridview">
        <thead>
          <tr>
            <th>When</th>
            <th>Quote #</th>
            <th>Insured</th>
            <th>Action</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {notes.map((n, i) => (
            <tr key={i}>
              <td style={{ whiteSpace: 'nowrap' }}>{n.when}</td>
              <td className="mono">{n.quoteId}</td>
              <td>{n.insured}</td>
              <td>{actionPill(n.action)}</td>
              <td style={{ fontSize: 11 }}>{n.note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="section-bar" style={{ marginTop: 14 }}>Add Note</div>
      <div className="panel" style={{ borderTop: 'none' }}>
        <div className="panel-body">
          <form onSubmit={saveNote}>
            <table className="formgrid">
              <tbody>
                <tr>
                  <td className="label required">Quote #:</td>
                  <td className="field">
                    <input
                      type="text"
                      placeholder="PMQ-PH-...  /  PMQ-DN-..."
                      value={newQuote}
                      onChange={(e) => setNewQuote(e.target.value)}
                      required
                    />
                  </td>
                  <td className="label">Decision:</td>
                  <td className="field">
                    <select value={newDecision} onChange={(e) => setNewDecision(e.target.value)}>
                      {DECISIONS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </td>
                </tr>
                <tr>
                  <td className="label required">Note:</td>
                  <td className="field" colSpan={3}>
                    <textarea
                      rows={3}
                      style={{ width: 560 }}
                      placeholder="UW rationale, conditions, follow-ups..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      required
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: 8 }}>
              <button type="submit" className="btn primary">Save Note</button>
            </div>
          </form>
        </div>
      </div>
    </Chrome>
  )
}
