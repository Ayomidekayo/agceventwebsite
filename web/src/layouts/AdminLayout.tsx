import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Handshake, HeartHandshake, LayoutDashboard, LogOut, Menu, ShieldCheck,
  TicketCheck, UserRoundCheck, X,
} from 'lucide-react';
import Brand from '../components/Brand';
import { api, resetCsrfToken } from '../lib/api';

type AdminLayoutProps = { children: ReactNode };

const NAV_ITEMS = [
  { label: 'Overview', to: '/admin', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'EVENT_ADMIN', 'REGISTRATION_MANAGER', 'SPONSORSHIP_MANAGER', 'VOLUNTEER_MANAGER', 'CHECK_IN_OFFICER', 'REPORT_VIEWER', 'CONTENT_MANAGER'] },
  { label: 'Registrations', to: '/admin/registrations', icon: TicketCheck, roles: ['SUPER_ADMIN', 'EVENT_ADMIN', 'REGISTRATION_MANAGER', 'CHECK_IN_OFFICER'] },
  { label: 'Sponsorship', to: '/admin/sponsorship', icon: Handshake, roles: ['SUPER_ADMIN', 'EVENT_ADMIN', 'SPONSORSHIP_MANAGER'] },
  { label: 'Volunteers', to: '/admin/volunteers', icon: HeartHandshake, roles: ['SUPER_ADMIN', 'EVENT_ADMIN', 'VOLUNTEER_MANAGER'] },
  { label: 'Team access', to: '/admin/team', icon: UserRoundCheck, roles: ['SUPER_ADMIN'] },
] as const;

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [mobileNav, setMobileNav] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const staff = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => (await api.get('/auth/me')).data,
    retry: false,
  });

  useEffect(() => setMobileNav(false), [location.pathname]);

  useEffect(() => {
    if (!mobileNav) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNav(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileNav]);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // The server session may already have expired; still clear local CSRF state.
    } finally {
      resetCsrfToken();
      navigate('/admin/login', { replace: true });
    }
  };

  const currentRole = String(staff.data?.role ?? '');
  const items = NAV_ITEMS.filter((item) => !currentRole || (item.roles as readonly string[]).includes(currentRole));

  return (
    <div className="admin-shell">
      {mobileNav && <button className="admin-backdrop" type="button" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
      <aside className={`admin-sidebar ${mobileNav ? 'admin-sidebar-open' : ''}`} id="agn-admin-navigation" aria-label="Administration sidebar">
        <div className="admin-side-top">
          <Brand inverse />
          <button className="sidebar-close" type="button" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={19} /></button>
        </div>
        <span className="sidebar-caption">WORKSPACE</span>
        <nav className="admin-nav" aria-label="Administration navigation">
          {items.map((item) => (
            <NavLink
              end={item.to === '/admin'}
              key={item.to}
              to={item.to}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileNav(false)}
            >
              <item.icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
              {item.label === 'Registrations' && <span className="nav-live-dot" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-event-card">
          <span>ACTIVE EVENT</span><strong>AGN 2027</strong><small>From Block to Breakthrough</small>
          <div><span className="status-dot" /> Planning workspace</div>
        </div>
        <button className="admin-logout" type="button" onClick={() => void logout()}><LogOut size={17} /> Sign out</button>
        <div className="sidebar-foot">AGN · ACTIVATION GLOBAL NETWORK</div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu-toggle"
            type="button"
            onClick={() => setMobileNav(true)}
            aria-label="Open dashboard menu"
            aria-controls="agn-admin-navigation"
            aria-expanded={mobileNav}
          ><Menu /></button>
          <div className="breadcrumb"><span>AGN WORKSPACE</span><i>/</i><strong>Conference management</strong></div>
          <div className="topbar-right"><span className="topbar-secure"><ShieldCheck size={15} /> Secure workspace</span><span className="user-avatar" aria-label="AGN team account">AG</span></div>
        </header>
        <div key={location.pathname} className="admin-content agn-admin-page-enter">{children}</div>
        <footer className="admin-footer"><span>© {new Date().getFullYear()} Activation Global Network</span><span>AGN 2027 · Internal workspace</span></footer>
      </div>
    </div>
  );
}
