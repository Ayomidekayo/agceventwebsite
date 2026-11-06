import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Mail, Menu, X } from 'lucide-react';
import Brand from '../components/Brand';

type PublicLayoutProps = {
  children: ReactNode;
};

function SiteHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu whenever the route or hash changes.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  // Close the mobile menu when Escape is pressed.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const links = [
    { label: 'The conference', to: '/#conference' },
    { label: 'Programme', to: '/#experience' },
    { label: 'Sponsorship', to: '/sponsorship' },
    { label: 'Volunteer', to: '/volunteer' },
  ];

  const closeMenu = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="header-inner container">
        <Brand />

        {/* Main navigation */}
        <nav
          className={`primary-nav ${open ? 'primary-nav-open' : ''}`}
          id="agn-public-navigation"
          aria-label="Main navigation"
          aria-hidden={!open && window.innerWidth <= 900}
          inert={!open && window.innerWidth <= 900}
        >
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={closeMenu}
              tabIndex={open || window.innerWidth > 900 ? 0 : -1}
            >
              {link.label}
            </Link>
          ))}

          {/* Team login for mobile and tablet */}
          <Link
            className="nav-mobile-team"
            to="/admin/login"
            onClick={closeMenu}
            tabIndex={open || window.innerWidth > 900 ? 0 : -1}
          >
            Team login
            <ArrowUpRight size={16} />
          </Link>

          {/* Register for mobile and tablet */}
          <Link
            className="nav-mobile-register"
            to="/register"
            onClick={closeMenu}
            tabIndex={open || window.innerWidth > 900 ? 0 : -1}
          >
            Register
            <ArrowRight size={16} />
          </Link>
        </nav>

        {/* Desktop header actions */}
        <div className="header-actions">
          <Link to="/admin/login" className="staff-link">
            Team login
          </Link>

          <Link to="/register" className="button button-dark button-small">
            Register
            <ArrowUpRight size={16} />
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="menu-toggle"
          type="button"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls="agn-public-navigation"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand-column">
          <Brand inverse />

          <p>
            Activating potential. Connecting people. Creating pathways from
            block to breakthrough.
          </p>

          <a
            className="footer-email"
            href="mailto:activationglobalnetworkagn@gmail.com"
          >
            <Mail size={16} />
            activationglobalnetworkagn@gmail.com
          </a>
        </div>

        <div className="footer-col">
          <span className="footer-heading">Explore</span>
          <Link to="/#conference">The conference</Link>
          <Link to="/#experience">The experience</Link>
          <Link to="/register">Register</Link>
        </div>

        <div className="footer-col">
          <span className="footer-heading">Get involved</span>
          <Link to="/sponsorship">Sponsor AGN</Link>
          <Link to="/volunteer">Volunteer with us</Link>
          <Link to="/admin/login">Team login</Link>
        </div>

        <div className="footer-note">
          <span className="eyebrow eyebrow-light">THE NEXT GENERATION</span>

          <h3>Big change starts with a shift in perspective.</h3>

          <Link to="/register" className="footer-cta">
            Take your next step
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} Activation Global Network.
        </span>

        <div>
          <Link to="/privacy">Privacy</Link>
          <span className="footer-dot" />
          <Link to="/terms">Terms</Link>
        </div>

        <span className="footer-theme">FROM BLOCK TO BREAKTHROUGH</span>
      </div>
    </footer>
  );
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const location = useLocation();

  return (
    <div className="agn-public-shell">
      <SiteHeader />

      <div
        key={`${location.pathname}${location.hash}`}
        className="agn-public-page-enter"
      >
        {children}
      </div>

      <SiteFooter />
    </div>
  );
}