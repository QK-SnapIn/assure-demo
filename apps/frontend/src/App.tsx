import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewBusiness from './pages/NewBusiness'
import QuoteInquiry from './pages/QuoteInquiry'
import PolicySearch from './pages/PolicySearch'
import PolicyDetail from './pages/PolicyDetail'
import Endorsement from './pages/Endorsement'
import Renewals from './pages/Renewals'
import Cancellations from './pages/Cancellations'
import ReferralQueue from './pages/ReferralQueue'
import UWNotes from './pages/UWNotes'
import FNOL from './pages/FNOL'
import FileClaim from './pages/FileClaim'
import ClaimWorkflow from './pages/ClaimWorkflow'
import ClaimSearch from './pages/ClaimSearch'
import MyDiary from './pages/MyDiary'
import Invoices from './pages/Invoices'
import MakePayment from './pages/MakePayment'
import MyPolicy from './pages/MyPolicy'
import AgencyAdmin from './pages/AgencyAdmin'

function Protected({ element }: { element: React.ReactNode }) {
  return <RequireAuth>{element}</RequireAuth>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<Protected element={<Dashboard />} />} />
        <Route path="/new-business" element={<Protected element={<NewBusiness />} />} />
        <Route path="/quote-inquiry" element={<Protected element={<QuoteInquiry />} />} />
        <Route path="/policy-search" element={<Protected element={<PolicySearch />} />} />
        <Route path="/policy/:id" element={<Protected element={<PolicyDetail />} />} />
        <Route path="/endorsement" element={<Protected element={<Endorsement />} />} />
        <Route path="/renewals" element={<Protected element={<Renewals />} />} />
        <Route path="/cancellations" element={<Protected element={<Cancellations />} />} />
        <Route path="/referral-queue" element={<Protected element={<ReferralQueue />} />} />
        <Route path="/uw-notes" element={<Protected element={<UWNotes />} />} />
        <Route path="/fnol" element={<Protected element={<FNOL />} />} />
        <Route path="/file-claim" element={<Protected element={<FileClaim />} />} />
        <Route path="/claim-workflow" element={<Protected element={<ClaimWorkflow />} />} />
        <Route path="/claim/:id" element={<Protected element={<ClaimWorkflow />} />} />
        <Route path="/claim-search" element={<Protected element={<ClaimSearch />} />} />
        <Route path="/my-diary" element={<Protected element={<MyDiary />} />} />
        <Route path="/invoices" element={<Protected element={<Invoices />} />} />
        <Route path="/make-payment" element={<Protected element={<MakePayment />} />} />
        <Route path="/payment/:id" element={<Protected element={<MakePayment />} />} />
        <Route path="/my-policy" element={<Protected element={<MyPolicy />} />} />
        <Route path="/agency-admin" element={<Protected element={<AgencyAdmin />} />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
