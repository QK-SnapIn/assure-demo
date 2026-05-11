import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Chrome from '../components/Chrome'
import { api } from '../lib/api'
import type { User, Commission, Permission } from '../lib/types'

type Tab = 'users' | 'perms' | 'agency' | 'audit'

// ── Appointed lines (static) ─────────────────────────────────────────────────

const APPOINTED_LINES: [string, string, string, string][] = [
  ['Pharmacist Professional Liability',          '50 states + DC',                 '1/1/2018', 'Active'],
  ['Pharmacy Owner — VISTA Package',             '50 states + DC',                 '1/1/2018', 'Active'],
  ['Pharmacy Technician Professional Liability', '50 states + DC',                 '1/1/2018', 'Active'],
  ['Dentist / Dental Practice PL',               'IA, MN, WI, IL, MO, NE, KS, SD', '1/1/2020', 'Active'],
  ['Dental Hygienist PL',                        'IA, MN, WI, IL, MO',             '6/1/2020', 'Active'],
  ['Veterinary Practice / Vet Individual PL',    'IA, MN, WI, IL, MO, NE, KS, SD', '1/1/2020', 'Active'],
  ['Home Health Care & Hospice',                 'IA, IL, MN, MO, TX, FL',         '3/1/2021', 'Active'],
  ['Home Medical Equipment',                     'IA, IL, MN, MO',                 '3/1/2021', 'Active'],
  ['Senior Living / SNF',                        'IA, MN, WI, IL, MO, FL, TX, OH', '1/1/2022', 'Active'],
  ["Workers' Compensation",                      'IA, MN, NE',                     '4/1/2023', 'Pending Expansion'],
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function AgencyAdmin() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<User[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [states, setStates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api<User[]>('/api/users'),
      api<Commission[]>('/api/lookups/commissions'),
      api<Permission[]>('/api/lookups/permissions'),
      api<string[]>('/api/lookups/states'),
    ])
      .then(([u, c, p, st]) => { setUsers(u); setCommissions(c); setPermissions(p); setStates(st) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const TABS: { key: Tab; label: string }[] = [
    { key: 'users', label: 'Users' },
    { key: 'perms', label: 'Permissions Matrix' },
    { key: 'agency', label: 'Agency Profile' },
    { key: 'audit', label: 'Audit Log' },
  ]

  // ── Users Tab ───────────────────────────────────────────────────────────────

  function UsersTab() {
    return (
      <>
        <div className="toolbar">
          <input type="text" placeholder="Search users by name, email, NPN..." style={{ width: 280 }} />
          <select>
            <option>All Roles</option>
            <option>Agency Admin</option>
            <option>Producer</option>
            <option>CSR</option>
            <option>Underwriter</option>
            <option>Claims Adjuster</option>
            <option>Read-Only</option>
          </select>
          <select>
            <option>All Statuses</option>
            <option>Active</option>
            <option>Locked</option>
            <option>Inactive</option>
          </select>
          <button className="btn">🔍 Search</button>
          <span className="spacer" />
          <button className="btn primary" onClick={() => alert('Add user modal (demo)')}>+ Add User</button>
        </div>
        <table className="gridview">
          <thead>
            <tr>
              <th style={{ width: 30 }}><input type="checkbox" /></th>
              <th>User ID</th><th>Name</th><th>Email</th><th>NPN</th><th>Role</th><th>Agency</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><input type="checkbox" /></td>
                <td>{u.id}</td>
                <td><strong>{u.name}</strong></td>
                <td>{u.email}</td>
                <td>{u.npn ?? '—'}</td>
                <td>{u.role.replace(/_/g, ' ')}</td>
                <td>{u.agency}</td>
                <td>
                  {u.status === 'Active' ? <span className="pill green">Active</span>
                    : u.status === 'Locked' ? <span className="pill red">Locked</span>
                    : <span className="pill gray">Inactive</span>}
                </td>
                <td>
                  <button className="btn small" onClick={() => alert(`Edit user ${u.name} (demo)`)}>Edit</button>
                  {u.status === 'Locked' && <button className="btn small" onClick={() => alert(`${u.name} has been unlocked.`)} style={{ marginLeft: 4 }}>Unlock</button>}
                  {u.status === 'Active' && <button className="btn small" onClick={() => { if (confirm(`Deactivate ${u.name}?`)) alert('User deactivated.') }} style={{ marginLeft: 4 }}>Deactivate</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="meta" style={{ marginTop: 8 }}>NPN = National Producer Number (NIPR). Required for producers writing business in any U.S. state.</div>
      </>
    )
  }

  // ── Permissions Tab ─────────────────────────────────────────────────────────

  function PermsTab() {
    return (
      <>
        <div className="msg info"><div className="title">Role-Based Access Control</div>Changes take effect on next session login. Audit log entries are written for every change.</div>
        <table className="gridview permissions-grid">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Feature / Permission</th>
              <th>Agency Admin</th><th>Producer</th><th>CSR</th><th>Underwriter</th><th>Adjuster</th><th>Read-Only</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map(p => (
              <tr key={p.id}>
                <td className="label">{p.feature}</td>
                <td className="center"><input type="checkbox" defaultChecked={p.agencyAdmin} /></td>
                <td className="center"><input type="checkbox" defaultChecked={p.producer} /></td>
                <td className="center"><input type="checkbox" defaultChecked={p.csr} /></td>
                <td className="center"><input type="checkbox" defaultChecked={p.uw} /></td>
                <td className="center"><input type="checkbox" defaultChecked={p.adjuster} /></td>
                <td className="center"><input type="checkbox" defaultChecked={p.readonly} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 10 }}>
          <button className="btn primary" onClick={() => alert('Permissions saved. RBAC matrix updated. Audit entry written.')}>Save Permissions</button>
          <button className="btn" onClick={() => alert('Permissions reverted to last saved state.')} style={{ marginLeft: 8 }}>Revert</button>
        </div>
      </>
    )
  }

  // ── Agency Profile Tab ──────────────────────────────────────────────────────

  function AgencyTab() {
    return (
      <>
        <div className="section-bar">Agency Profile</div>
        <div className="panel-body">
          <table className="formgrid">
            <tbody>
              <tr>
                <td className="label">Agency Name:</td><td className="field"><input type="text" defaultValue="Walters Risk Advisors" style={{ width: 280 }} /></td>
                <td className="label">Agency Code:</td><td className="field"><input type="text" defaultValue="WRA-00188" readOnly style={{ background: '#f0f0f0' }} /></td>
              </tr>
              <tr>
                <td className="label">Federal EIN:</td><td className="field"><input type="text" defaultValue="42-2018834" /></td>
                <td className="label">Agency NPN:</td><td className="field"><input type="text" defaultValue="17823901" /></td>
              </tr>
              <tr>
                <td className="label">Primary Contact:</td><td className="field"><input type="text" defaultValue="Megan Walters" /></td>
                <td className="label">Phone:</td><td className="field"><input type="text" defaultValue="(515) 295-2461" /></td>
              </tr>
              <tr>
                <td className="label">Address:</td>
                <td className="field" colSpan={3}><input type="text" defaultValue="220 East State Street, Suite 400" style={{ width: 560 }} /></td>
              </tr>
              <tr>
                <td className="label">City / State / ZIP:</td>
                <td className="field" colSpan={3}>
                  <input type="text" defaultValue="Algona" />{' '}
                  <select defaultValue="IA">
                    {states.map(s => <option key={s}>{s}</option>)}
                  </select>{' '}
                  <input type="text" defaultValue="50511" style={{ width: 80 }} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="section-bar">Appointed Lines &amp; States — Pharmacists Mutual</div>
        <div className="panel-body">
          <table className="gridview">
            <thead><tr><th>Line of Business</th><th>Appointed States</th><th>Effective</th><th>Status</th></tr></thead>
            <tbody>
              {APPOINTED_LINES.map(([line, apptStates, eff, st]) => (
                <tr key={line}>
                  <td>{line}</td><td>{apptStates}</td><td>{eff}</td>
                  <td><span className={`pill ${st === 'Active' ? 'green' : 'amber'}`}>{st}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="section-bar">Commission Schedule</div>
        <div className="panel-body">
          <table className="gridview" style={{ maxWidth: 560 }}>
            <thead><tr><th>Line Group</th><th className="num">New Business</th><th className="num">Renewal</th></tr></thead>
            <tbody>
              {commissions.map(c => (
                <tr key={c.id}>
                  <td>{c.lineGroup}</td>
                  <td className="num">{Number(c.newBizPct).toFixed(1)}%</td>
                  <td className="num">{Number(c.renewalPct).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="meta" style={{ marginTop: 6 }}>Default commission tiers per Pharmacists Mutual carrier agreement. Higher-volume agencies may qualify for production-based bonuses (PB-1/PB-2).</div>
        </div>

        <div style={{ marginTop: 10 }}>
          <button className="btn primary" onClick={() => alert('Agency profile updated.')}>Save Profile</button>
        </div>
      </>
    )
  }

  // ── Audit Log Tab ────────────────────────────────────────────────────────────

  function AuditTab() {
    return (
      <>
        <div className="toolbar">
          <input type="date" defaultValue="2026-05-01" />
          <span>to</span>
          <input type="date" defaultValue="2026-05-11" />
          <select>
            <option>All Activities</option>
            <option>Login</option>
            <option>Permission Change</option>
            <option>User Created</option>
            <option>Policy Bound</option>
            <option>Claim Filed</option>
          </select>
          <button className="btn">🔍 Search</button>
          <span className="spacer" />
          <button className="btn">Export CSV</button>
        </div>
        <table className="gridview">
          <thead><tr><th>Timestamp</th><th>User</th><th>IP Address</th><th>Activity</th><th>Object</th><th>Result</th></tr></thead>
          <tbody>
            <tr><td>5/11/2026 09:14:12</td><td>Megan Walters</td><td>72.184.122.41</td><td>Login</td><td>—</td><td><span className="pill green">Success</span></td></tr>
            <tr><td>5/10/2026 16:42:03</td><td>David Chen</td><td>10.41.22.118</td><td>Referral Approved</td><td>REF-30441</td><td><span className="pill green">Success</span></td></tr>
            <tr><td>5/10/2026 14:22:55</td><td>Megan Walters</td><td>72.184.122.41</td><td>Endorsement Issued</td><td>E-PMP-PH-210441-002</td><td><span className="pill green">Success</span></td></tr>
            <tr><td>5/9/2026 11:30:18</td><td>Linda Park</td><td>10.41.22.119</td><td>Reserve Updated</td><td>CLM-77981</td><td><span className="pill green">Success</span></td></tr>
            <tr><td>5/8/2026 08:14:01</td><td>Brian Holt</td><td>72.184.122.41</td><td>Login</td><td>—</td><td><span className="pill red">Failed (5x — account locked)</span></td></tr>
            <tr><td>5/7/2026 13:55:44</td><td>Megan Walters</td><td>72.184.122.41</td><td>Permission Change</td><td>RBAC: Producer</td><td><span className="pill green">Success</span></td></tr>
            <tr><td>5/4/2026 09:01:22</td><td>Megan Walters</td><td>72.184.122.41</td><td>User Created</td><td>U007 — Karen Lopez</td><td><span className="pill green">Success</span></td></tr>
          </tbody>
        </table>
      </>
    )
  }

  return (
    <Chrome>
      <div className="crumbs">
        <span className="link" onClick={() => navigate('/dashboard')}>Home</span>
        <span className="sep">&rsaquo;</span> Administration
        <span className="sep">&rsaquo;</span> Agency Admin
      </div>

      <div className="pagetitle">
        Agency Administration
        <span className="id">Walters Risk Advisors &middot; NPN: 17823901 &middot; Pharmacists Mutual Appointed Agency</span>
      </div>

      {error && <div className="msg error" style={{ marginTop: 10 }}><div className="title">Error loading data</div>{error}</div>}

      {loading ? (
        <div className="msg info" style={{ marginTop: 10 }}>Loading…</div>
      ) : (
        <>
          <div className="tabstrip">
            {TABS.map(t => (
              <a key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)} style={{ cursor: 'pointer' }}>{t.label}</a>
            ))}
          </div>

          <div className="panel" style={{ borderTop: 'none' }}>
            {tab === 'users' && <UsersTab />}
            {tab === 'perms' && <PermsTab />}
            {tab === 'agency' && <AgencyTab />}
            {tab === 'audit' && <AuditTab />}
          </div>
        </>
      )}
    </Chrome>
  )
}
