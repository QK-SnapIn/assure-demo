import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Chrome from '../components/Chrome'
import { api } from '../lib/api'
import { fmtMoney, fmtDate } from '../lib/format'
import type { Invoice } from '../lib/types'

type PayMethod = 'ach' | 'card' | 'check'

export default function MakePayment() {
  const { id: paramId } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedInvId, setSelectedInvId] = useState<string>(paramId ?? '')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PayMethod>('ach')
  const [nameOnAcct, setNameOnAcct] = useState('')
  const [receiptEmail, setReceiptEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [ein, setEin] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [autopay, setAutopay] = useState(false)
  const [paid, setPaid] = useState(false)

  // ACH fields
  const [routing, setRouting] = useState('')
  const [account, setAccount] = useState('')
  const [acctType, setAcctType] = useState('Checking')
  const [bankName, setBankName] = useState('')

  // Card fields
  const [cardNum, setCardNum] = useState('')
  const [cvv, setCvv] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cardName, setCardName] = useState('')
  const [billingZip, setBillingZip] = useState('')

  useEffect(() => {
    const fetchInvoices = api<Invoice[]>('/api/invoices')
    const fetchSpecific = paramId
      ? api<Invoice>(`/api/invoices/${paramId}`)
      : Promise.resolve(null)

    Promise.all([fetchInvoices, fetchSpecific])
      .then(([all, specific]) => {
        const open = all.filter(i => Number(i.balance) > 0)
        setAllInvoices(open)
        const current = specific ?? open[0] ?? null
        if (current) {
          setInvoice(current)
          setSelectedInvId(current.id)
          setAmount(Number(current.balance).toFixed(2))
          setNameOnAcct(current.insured)
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [paramId])

  function changeInv(id: string) {
    const inv = allInvoices.find(i => i.id === id) ?? null
    setInvoice(inv)
    setSelectedInvId(id)
    if (inv) {
      setAmount(Number(inv.balance).toFixed(2))
      setNameOnAcct(inv.insured)
    }
  }

  const amt = parseFloat(amount) || 0
  const fee = method === 'card' ? amt * 0.029 : 0
  const total = amt + fee

  async function submitPayment() {
    if (!authorized) { alert('Please check the authorization box before processing the payment.'); return }
    if (!amt || amt <= 0) { alert('Enter a payment amount greater than $0.00.'); return }
    if (!nameOnAcct) { alert('Name on Account is required.'); return }
    if (!invoice) { alert('Please select an invoice.'); return }
    try {
      await api(`/api/invoices/${invoice.id}/pay`, { method: 'POST', json: { amount: amt, method } })
      const conf = 'PAY-' + Math.floor(100000 + Math.random() * 900000)
      setPaid(true)
      alert(
        `Transaction reference ${conf} · ${fmtMoney(total)} charged` +
        (method === 'card' ? ' (incl. 2.9% convenience fee)' : '') +
        '. Receipt sent to your email.'
      )
    } catch (e: unknown) {
      alert(`Payment error: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  function renderMethodForm() {
    switch (method) {
      case 'ach':
        return (
          <>
            <div className="section-bar">ACH / eCheck Details</div>
            <div className="panel-body">
              <table className="formgrid">
                <tbody>
                  <tr>
                    <td className="label required">Routing #:</td>
                    <td className="field">
                      <input type="text" value={routing} onChange={e => setRouting(e.target.value)}
                        placeholder="9-digit ABA routing #" maxLength={9} style={{ width: 160 }} />
                    </td>
                    <td className="label required">Account #:</td>
                    <td className="field">
                      <input type="text" value={account} onChange={e => setAccount(e.target.value)} style={{ width: 200 }} />
                    </td>
                  </tr>
                  <tr>
                    <td className="label required">Account Type:</td>
                    <td className="field">
                      {['Checking', 'Savings', 'Business Checking'].map(t => (
                        <label key={t} style={{ marginRight: 8 }}>
                          <input type="radio" name="acctType" checked={acctType === t} onChange={() => setAcctType(t)} /> {t}
                        </label>
                      ))}
                    </td>
                    <td className="label">Bank Name:</td>
                    <td className="field">
                      <input type="text" value={bankName} onChange={e => setBankName(e.target.value)}
                        placeholder="e.g. Wells Fargo Bank, N.A." style={{ width: 200 }} />
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="muted small">Funds typically settle in 2-3 business days. No processing fee.</div>
            </div>
          </>
        )
      case 'card':
        return (
          <>
            <div className="section-bar">Card Details</div>
            <div className="panel-body">
              <table className="formgrid">
                <tbody>
                  <tr>
                    <td className="label required">Card Number:</td>
                    <td className="field">
                      <input type="text" value={cardNum} onChange={e => setCardNum(e.target.value)}
                        placeholder="•••• •••• •••• ••••" style={{ width: 200 }} maxLength={19} />
                    </td>
                    <td className="label required">CVV:</td>
                    <td className="field">
                      <input type="password" value={cvv} onChange={e => setCvv(e.target.value)} style={{ width: 60 }} maxLength={4} />
                    </td>
                  </tr>
                  <tr>
                    <td className="label required">Expiry:</td>
                    <td className="field">
                      <input type="text" value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM/YY" style={{ width: 80 }} maxLength={5} />
                    </td>
                    <td className="label required">Name on Card:</td>
                    <td className="field">
                      <input type="text" value={cardName} onChange={e => setCardName(e.target.value)} style={{ width: 200 }} />
                    </td>
                  </tr>
                  <tr>
                    <td className="label required">Billing ZIP:</td>
                    <td className="field">
                      <input type="text" value={billingZip} onChange={e => setBillingZip(e.target.value)} placeholder="50511" maxLength={10} style={{ width: 100 }} />
                    </td>
                    <td className="label" />
                    <td className="field">
                      <span className="muted">Visa / Mastercard / Amex / Discover &middot; 2.9% convenience fee applies</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )
      case 'check':
        return (
          <>
            <div className="section-bar">Mail a Check</div>
            <div className="panel-body">
              <div className="msg info">
                Mail your check to:<br /><br />
                <strong>Pharmacists Mutual Insurance Company</strong><br />
                <strong>P.O. Box 370</strong><br />
                <strong>Algona, IA 50511-0370</strong><br /><br />
                Make checks payable to <em>Pharmacists Mutual Insurance Company</em>. Include your policy number{' '}
                <code>{invoice?.policyId ?? 'PMP-PH-xxxxxx'}</code> in the memo line. Payments are credited the business day they are received and processed.<br /><br />
                <span className="muted">Allow 5-7 business days for mail delivery. No processing fee.</span>
              </div>
            </div>
          </>
        )
    }
  }

  return (
    <Chrome>
      <div className="crumbs">
        Home <span className="sep">&rsaquo;</span>
        Assure Billing <span className="sep">&rsaquo;</span>
        <span>Make Payment</span>
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
            Make a Payment
            {invoice && <span className="id">Invoice {invoice.id} &middot; {invoice.insured}</span>}
          </div>

          <div className="cols-2">
            <div>
              <div className="panel">
                <div className="section-bar">Payment Details</div>
                <div className="panel-body">
                  <table className="formgrid">
                    <tbody>
                      <tr>
                        <td className="label required">Invoice:</td>
                        <td className="field">
                          <select value={selectedInvId} onChange={e => changeInv(e.target.value)}>
                            {allInvoices.map(i => (
                              <option key={i.id} value={i.id}>
                                {i.id} — {i.insured} — {fmtMoney(i.balance)} due
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                      <tr>
                        <td className="label">Policy:</td>
                        <td className="field">{invoice?.policyId ?? '—'}</td>
                      </tr>
                      <tr>
                        <td className="label">Balance Due:</td>
                        <td className="field"><strong>{invoice ? fmtMoney(invoice.balance) : '—'}</strong></td>
                      </tr>
                      <tr>
                        <td className="label required">Payment Amount (USD):</td>
                        <td className="field">
                          $<input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            step="0.01"
                            style={{ width: 120 }}
                          />{' '}
                          <button
                            className="btn small"
                            type="button"
                            onClick={() => invoice && setAmount(Number(invoice.balance).toFixed(2))}
                          >
                            Pay in Full
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="label required">Payment Method:</td>
                        <td className="field">
                          <select value={method} onChange={e => setMethod(e.target.value as PayMethod)}>
                            <option value="ach">ACH / eCheck (Bank Transfer)</option>
                            <option value="card">Credit / Debit Card</option>
                            <option value="check">Mail a Check</option>
                          </select>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {renderMethodForm()}

                <div className="section-bar">Billing Contact</div>
                <div className="panel-body">
                  <table className="formgrid">
                    <tbody>
                      <tr>
                        <td className="label required">Name on Account:</td>
                        <td className="field">
                          <input type="text" value={nameOnAcct} onChange={e => setNameOnAcct(e.target.value)} style={{ width: 280 }} />
                        </td>
                      </tr>
                      <tr>
                        <td className="label required">Email Receipt To:</td>
                        <td className="field">
                          <input type="email" value={receiptEmail} onChange={e => setReceiptEmail(e.target.value)} style={{ width: 280 }} />
                        </td>
                      </tr>
                      <tr>
                        <td className="label">Mobile (for SMS):</td>
                        <td className="field">
                          <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(515) 555-0188" />
                        </td>
                      </tr>
                      <tr>
                        <td className="label">Federal EIN (optional):</td>
                        <td className="field">
                          <input type="text" value={ein} onChange={e => setEin(e.target.value)} placeholder="e.g. 42-1234567" style={{ width: 180 }} />
                          <span className="muted">&nbsp;For business expense records</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <div className="panel">
                <div className="section-bar">Confirmation</div>
                <div className="panel-body">
                  <table className="formgrid">
                    <tbody>
                      <tr>
                        <td className="label">Premium Installment:</td>
                        <td className="field" style={{ textAlign: 'right' }}>{fmtMoney(amt)}</td>
                      </tr>
                      <tr>
                        <td className="label">Processing Fee:</td>
                        <td className="field" style={{ textAlign: 'right' }}>{fmtMoney(fee)}</td>
                      </tr>
                      <tr>
                        <td colSpan={2}><hr className="thin" /></td>
                      </tr>
                      <tr>
                        <td className="label"><strong>Total Charge:</strong></td>
                        <td className="field" style={{ textAlign: 'right' }}>
                          <strong style={{ fontSize: 14, color: '#1c3a66' }}>{fmtMoney(total)}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="msg info" style={{ marginTop: 12 }}>
                    <div className="title">Secure transaction</div>
                    Payments are processed via Pharmacists Mutual's PCI-DSS compliant gateway. We do not store full card or bank account numbers. ACH payments have no processing fee; card payments carry a 2.9% convenience fee.
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <label>
                      <input type="checkbox" checked={authorized} onChange={e => setAuthorized(e.target.checked)} />{' '}
                      I authorize this one-time payment for the amount shown above.
                    </label>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <label>
                      <input type="checkbox" checked={autopay} onChange={e => setAutopay(e.target.checked)} />{' '}
                      Enroll in monthly Auto-Pay via ACH (no processing fee on future payments)
                    </label>
                  </div>

                  <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                    <button className="btn" onClick={() => navigate(-1)}>‹ Cancel</button>
                    <button
                      className="btn primary"
                      style={{ flex: 1 }}
                      onClick={submitPayment}
                      disabled={paid}
                    >
                      {paid ? '✓ Paid' : '💳 Process Payment'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="panel" style={{ marginTop: 14 }}>
                <div className="section-bar">Saved Payment Methods</div>
                <div className="panel-body" style={{ fontSize: 11 }}>
                  <div style={{ padding: '6px 0', borderBottom: '1px dotted #ccc' }}>
                    🏦 Wells Fargo — Business Checking ****8821{' '}
                    <a href="#" style={{ float: 'right' }} onClick={e => { e.preventDefault(); alert('Payment method removed.') }}>Remove</a>
                  </div>
                  <div style={{ padding: '6px 0', borderBottom: '1px dotted #ccc' }}>
                    💳 Chase Business Visa ending in 4421 &middot; Expires 09/27{' '}
                    <a href="#" style={{ float: 'right' }} onClick={e => { e.preventDefault(); alert('Payment method removed.') }}>Remove</a>
                  </div>
                  <div style={{ padding: '6px 0' }}>
                    💳 Amex Business Platinum ending in 0011 &middot; Expires 04/28{' '}
                    <a href="#" style={{ float: 'right' }} onClick={e => { e.preventDefault(); alert('Payment method removed.') }}>Remove</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment due info */}
          {invoice && (
            <div style={{ marginTop: 8, fontSize: 11, color: '#666' }}>
              Invoice {invoice.id} &middot; Due {fmtDate(invoice.due)} &middot; Policy {invoice.policyId}
            </div>
          )}
        </>
      )}
    </Chrome>
  )
}
