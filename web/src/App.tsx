import { Route, Routes } from 'react-router-dom';

import HomePage from './pages/public/HomePage';
import RegistrationPage from './pages/public/RegistrationPage';
import VolunteerPage from './pages/public/VolunteerPage';
import SponsorshipPage from './pages/public/SponsorshipPage';
import SponsorshipPaymentPage from './pages/public/SponsorshipPaymentPage';
import PaymentCallbackPage from './pages/public/PaymentCallbackPage';

import AdminLoginPage from './pages/auth/AdminLoginPage';
import AcceptInvitationPage from './pages/auth/AcceptInvitationPage';

import DashboardPage from './pages/admin/DashboardPage';
import RegistrationsPage from './pages/admin/RegistrationsPage';
import SponsorshipManagementPage from './pages/admin/SponsorshipManagementPage';
import VolunteersPage from './pages/admin/VolunteersPage';
import TeamAccessPage from './pages/admin/TeamAccessPage';
import AdminSponsorshipPaymentsPage from './pages/admin/AdminSponsorshipPaymentPage';

import LegalInfoPage from './pages/legal/LegalInfoPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route path="/volunteer" element={<VolunteerPage />} />
      <Route path="/sponsorship" element={<SponsorshipPage />} />

      {/* Sponsorship payments */}
      <Route
        path="/sponsorship/pay"
        element={<SponsorshipPaymentPage />}
      />

      <Route
        path="/payment/verify"
        element={<PaymentCallbackPage />}
      />

      {/* Authentication */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/accept-invitation"
        element={<AcceptInvitationPage />}
      />

      {/* Admin */}
      <Route path="/admin" element={<DashboardPage />} />

      <Route
        path="/admin/registrations"
        element={<RegistrationsPage />}
      />

      <Route
        path="/admin/sponsorship"
        element={<SponsorshipManagementPage />}
      />

      <Route
        path="/admin/sponsorship/payments"
        element={<AdminSponsorshipPaymentsPage />}
      />

      <Route path="/admin/volunteers" element={<VolunteersPage />} />
      <Route path="/admin/team" element={<TeamAccessPage />} />

      {/* Legal */}
      <Route
        path="/privacy"
        element={<LegalInfoPage kind="privacy" />}
      />

      <Route
        path="/terms"
        element={<LegalInfoPage kind="terms" />}
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}