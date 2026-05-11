import { Link, NavLink, useNavigate } from 'react-router-dom'
import { getUser, logout } from '../lib/auth'

interface Props {
  children: React.ReactNode
}

const NAV_GROUPS = [
  {
    label: 'New Business',
    links: [
      { to: '/new-business', label: 'New Business' },
      { to: '/quote-inquiry', label: 'Quote Inquiry' },
      { to: '/referral-queue', label: 'Referral Queue' },
    ],
  },
  {
    label: 'Policy',
    links: [
      { to: '/policy-search', label: 'Policy Search' },
      { to: '/endorsement', label: 'Endorsement' },
      { to: '/renewals', label: 'Renewals' },
      { to: '/cancellations', label: 'Cancellations' },
    ],
  },
  {
    label: 'Claims',
    links: [
      { to: '/fnol', label: 'FNOL' },
      { to: '/file-claim', label: 'File a Claim' },
      { to: '/claim-workflow', label: 'Claim Workflow' },
      { to: '/claim-search', label: 'Claim Search' },
      { to: '/my-diary', label: 'My Diary' },
    ],
  },
  {
    label: 'Billing',
    links: [
      { to: '/invoices', label: 'Invoices' },
      { to: '/make-payment', label: 'Make Payment' },
    ],
  },
  {
    label: 'Policyholder',
    links: [{ to: '/my-policy', label: 'My Policy' }],
  },
  {
    label: 'Administration',
    links: [
      { to: '/uw-notes', label: 'UW Notes' },
      { to: '/agency-admin', label: 'Agency Admin' },
    ],
  },
]

export default function Chrome({ children }: Props) {
  const user = getUser()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div className="topbar">
        <div className="brand">
          ASSURE
          <span className="product">Healthcare Professional Liability</span>
        </div>
        <div className="right">
          <span className="user">{user?.name ?? user?.username}</span>
          <span className="role-tag">{user?.role?.replace(/_/g, ' ')}</span>
          <Link to="/dashboard">Home</Link>
          <a href="#" onClick={handleLogout}>Logout</a>
        </div>
      </div>

      {/* Module bar */}
      <div className="modulebar">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink>
        <NavLink to="/policy-search" className={({ isActive }) => isActive ? 'active' : ''}>Policies</NavLink>
        <NavLink to="/claim-search" className={({ isActive }) => isActive ? 'active' : ''}>Claims</NavLink>
        <NavLink to="/invoices" className={({ isActive }) => isActive ? 'active' : ''}>Billing</NavLink>
        <NavLink to="/new-business" className={({ isActive }) => isActive ? 'active' : ''}>New Business</NavLink>
        <NavLink to="/agency-admin" className={({ isActive }) => isActive ? 'active' : ''}>Admin</NavLink>
      </div>

      {/* Shell */}
      <div className="shell" style={{ flex: 1 }}>
        {/* Side nav */}
        <nav className="sidenav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="group">{group.label}</div>
              {group.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => isActive ? 'active' : ''}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Main content */}
        <main className="main">{children}</main>
      </div>

      {/* Status bar */}
      <div className="statusbar">
        <span className="indicator" />
        PMUW Assure Demo
        <span className="spacer" />
        &copy; {new Date().getFullYear()} Pharmacists Mutual
      </div>
    </div>
  )
}
