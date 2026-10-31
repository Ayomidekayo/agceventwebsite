import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/public/HomePage';
import RegistrationPage from './pages/public/RegistrationPage';
import VolunteerPage from './pages/public/VolunteerPage';
import SponsorshipPage from './pages/public/SponsorshipPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import AcceptInvitationPage from './pages/auth/AcceptInvitationPage';
import DashboardPage from './pages/admin/DashboardPage';
import RegistrationsPage from './pages/admin/RegistrationsPage';
import SponsorshipManagementPage from './pages/admin/SponsorshipManagementPage';
import VolunteersPage from './pages/admin/VolunteersPage';
import TeamAccessPage from './pages/admin/TeamAccessPage';
import LegalInfoPage from './pages/legal/LegalInfoPage';
import NotFoundPage from './pages/NotFoundPage';

/** Route table only. Each screen lives in its own page module. */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route path="/volunteer" element={<VolunteerPage />} />
      <Route path="/sponsorship" element={<SponsorshipPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/accept-invitation" element={<AcceptInvitationPage />} />
      <Route path="/privacy" element={<LegalInfoPage kind="privacy" />} />
      <Route path="/terms" element={<LegalInfoPage kind="terms" />} />
      <Route path="/admin" element={<DashboardPage />} />
      <Route path="/admin/registrations" element={<RegistrationsPage />} />
      <Route path="/admin/sponsorship" element={<SponsorshipManagementPage />} />
      <Route path="/admin/volunteers" element={<VolunteersPage />} />
      <Route path="/admin/team" element={<TeamAccessPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
