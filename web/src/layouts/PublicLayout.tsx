import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Mail, Menu, X } from 'lucide-react';
import Brand from '../components/Brand';

type PublicLayoutProps = {
  children: ReactNode;
};

const navLinks = [
  { label: 'The conference', to: '/#conference' },
  { label: 'Programme', to: '/#experience' },
  { label: 'Sponsorship', to: '/sponsorship' },
  { label: 'Volunteer', to: '/volunteer' },
];

function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    let previousY = window.scrollY;
    let ticking = false;

    const updateHeader = () => {
      const currentY = window.scrollY;
      const movingDown = currentY > previousY;

      if (open || currentY < 90) {
        setHeaderVisible(true);
      } else if (Math.abs(currentY - previousY) > 5) {
        setHeaderVisible(!movingDown);
      }

      previousY = currentY;
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateHeader);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <>
      <motion.header
        className={`site-header ${headerVisible || open ? 'header-visible' : 'header-hidden'} ${open ? 'header-menu-open' : ''}`}
        initial={reduceMotion ? false : { y: -18, opacity: 0 }}
        animate={{ y: headerVisible || open ? 0 : '-100%', opacity: headerVisible || open ? 1 : 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="header-inner container">
          <Brand />

          <nav
            className={`primary-nav ${open ? 'primary-nav-open' : ''}`}
            id="agn-public-navigation"
            aria-label="Main navigation"
            aria-hidden={!open && window.innerWidth <= 900}
            inert={!open && window.innerWidth <= 900}
          >
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={closeMenu}
                tabIndex={open || window.innerWidth > 900 ? 0 : -1}
              >
                {link.label}
              </Link>
            ))}

            <Link
              className="nav-mobile-team"
              to="/admin/login"
              onClick={closeMenu}
              tabIndex={open || window.innerWidth > 900 ? 0 : -1}
            >
              Team login <ArrowUpRight size={16} />
            </Link>

            <Link
              className="nav-mobile-register"
              to="/register"
              onClick={closeMenu}
              tabIndex={open || window.innerWidth > 900 ? 0 : -1}
            >
              Register <ArrowRight size={16} />
            </Link>
          </nav>

          <div className="header-actions">
            <Link to="/admin/login" className="staff-link">Team login</Link>
            <Link to="/register" className="button button-dark button-small agn-button-motion">
              Register <ArrowUpRight size={16} />
            </Link>
          </div>

          <button
            className="menu-toggle"
            type="button"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={open}
            aria-controls="agn-public-navigation"
            onClick={() => setOpen((current) => !current)}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? 'close' : 'open'}
                initial={reduceMotion ? false : { opacity: 0, rotate: -35, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, rotate: 35, scale: 0.8 }}
                transition={{ duration: 0.16 }}
              >
                {open ? <X size={22} /> : <Menu size={22} />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.button
              type="button"
              className="agn-mobile-backdrop"
              aria-label="Close navigation menu"
              onClick={closeMenu}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
            />
          )}
        </AnimatePresence>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.nav
            className="agn-mobile-menu"
            aria-label="Mobile navigation"
            initial={reduceMotion ? false : { opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {navLinks.map((link, index) => (
              <motion.div
                key={link.label}
                initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: reduceMotion ? 0 : index * 0.045 }}
              >
                <Link to={link.to} onClick={closeMenu}>{link.label}<ArrowUpRight size={16} /></Link>
              </motion.div>
            ))}
            <Link className="agn-mobile-team-link" to="/admin/login" onClick={closeMenu}>
              Team login <ArrowUpRight size={16} />
            </Link>
            <Link className="agn-mobile-register-link" to="/register" onClick={closeMenu}>
              Register <ArrowRight size={17} />
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}

function SiteFooter() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.footer
      className="site-footer"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: reduceMotion ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="container footer-main">
        <div className="footer-brand-column">
          <Brand inverse />
          <p>
            Activating potential. Connecting people. Creating pathways from
            block to breakthrough.
          </p>
          <a className="footer-email" href="mailto:activationglobalnetworkagn@gmail.com">
            <Mail size={16} /> activationglobalnetworkagn@gmail.com
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
            Take your next step <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Activation Global Network.</span>
        <div>
          <Link to="/privacy">Privacy</Link>
          <span className="footer-dot" />
          <Link to="/terms">Terms</Link>
        </div>
        <span className="footer-theme">FROM BLOCK TO BREAKTHROUGH</span>
      </div>
    </motion.footer>
  );
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal]'),
    );

    if (reduceMotion || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    // Assign a short, natural sequence to cards in the same grid.
    document.querySelectorAll<HTMLElement>('.agn-stagger').forEach((group) => {
      Array.from(group.querySelectorAll<HTMLElement>(':scope > [data-reveal]'))
        .forEach((element, index) => {
          element.style.setProperty('--agn-reveal-delay', `${Math.min(index * 110, 330)}ms`);
        });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target as HTMLElement;
          element.classList.add('is-visible');
          observer.unobserve(element);
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -7% 0px' },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [location.pathname, location.hash, reduceMotion]);

  return (
    <div className="agn-public-shell">
      <SiteHeader />
      <div key={`${location.pathname}${location.hash}`} className="agn-public-page-enter">
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}
