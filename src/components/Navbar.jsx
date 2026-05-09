import React, { useState, useEffect, useRef } from 'react';
import NotificationBell from './NotificationBell';

const NAV_ITEMS = [
  { key: 'home',     label: 'Home',     icon: '🏠' },
  { key: 'map',      label: 'Map',      icon: '🗺️' },
  { key: 'customer', label: 'Bookings', icon: '📋' },
  { key: 'messages', label: 'Messages', icon: '💬' },
  { key: 'provider', label: 'Provider', icon: '🔧' },
  { key: 'admin',    label: 'Admin',    icon: '⚙️' },
];

export default function Navbar({ page, setPage, user, profile, onSignIn, onSignOut, onBook }) {
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close menu on page change
  useEffect(() => { setMenuOpen(false); }, [page]);

  // Shadow on scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navigate = (key) => { setPage(key); setMenuOpen(false); };

  return (
    <>
      <nav style={{
        background: 'var(--navy)',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,.25)' : 'none',
        transition: 'box-shadow .2s',
      }}>
        {/* Logo */}
        <div
          onClick={() => navigate('home')}
          style={{ fontFamily: 'Sora', fontSize: 20, fontWeight: 800, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
        >
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="14" fill="rgba(34,197,94,0.2)" />
            <path d="M8 14.5l4 4 8-8" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Volun<span style={{ color: 'var(--green)' }}>teer</span>
        </div>

        {/* Desktop nav links — hidden on mobile */}
        <div className="desktop-nav" style={{ display: 'flex', gap: 2 }}>
          {NAV_ITEMS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => navigate(key)}
              style={{
                padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500, transition: 'all .2s',
                background: page === key ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: page === key ? 'white' : 'rgba(255,255,255,0.7)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {user ? (
            <>
              {/* Notification bell — always visible */}
              <NotificationBell userId={user.id} onNavigate={setPage} />

              {/* Settings — desktop only */}
              <button
                className="desktop-only"
                onClick={() => navigate('settings')}
                style={{ background: page === 'settings' ? 'rgba(255,255,255,0.15)' : 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 18, padding: '6px 8px', borderRadius: 8 }}
              >
                ⚙️
              </button>

              {/* User name — desktop only */}
              <span className="desktop-only" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                Hi, {profile?.name?.split(' ')[0] || 'there'}
              </span>

              {/* Sign out — desktop only */}
              <button
                className="desktop-only btn-outline btn-sm"
                style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', padding: '7px 14px' }}
                onClick={onSignOut}
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              className="desktop-only btn-outline btn-sm"
              style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', padding: '7px 14px' }}
              onClick={onSignIn}
            >
              Sign In
            </button>
          )}

          {/* Book Now — always visible */}
          <button className="btn-primary btn-sm" onClick={onBook}>
            Book Now
          </button>

          {/* Hamburger — mobile only */}
          <button
            className="mobile-only"
            onClick={() => setMenuOpen(o => !o)}
            style={{
              background: menuOpen ? 'rgba(255,255,255,0.15)' : 'none',
              border: 'none', cursor: 'pointer', padding: '8px', borderRadius: 8,
              display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40,
            }}
          >
            <span style={{ width: 20, height: 2, background: 'white', borderRadius: 2, display: 'block', transition: 'all .25s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ width: 20, height: 2, background: 'white', borderRadius: 2, display: 'block', transition: 'all .25s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ width: 20, height: 2, background: 'white', borderRadius: 2, display: 'block', transition: 'all .25s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: 64,
            left: 0,
            right: 0,
            background: 'var(--navy-dark)',
            zIndex: 99,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            animation: 'slideDown .2s ease',
            paddingBottom: 8,
          }}
        >
          {/* User info at top of mobile menu */}
          {user && (
            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--navy-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora', fontWeight: 700, color: 'white', fontSize: 14 }}>
                {(profile?.name || 'U').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{profile?.name || 'User'}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{user.email}</div>
              </div>
            </div>
          )}

          {/* Nav links */}
          {NAV_ITEMS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => navigate(key)}
              style={{
                width: '100%', padding: '14px 20px', textAlign: 'left',
                background: page === key ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: 'none', cursor: 'pointer', color: page === key ? 'white' : 'rgba(255,255,255,0.75)',
                fontSize: 15, fontWeight: page === key ? 600 : 400,
                display: 'flex', alignItems: 'center', gap: 12,
                borderLeft: page === key ? '3px solid var(--green)' : '3px solid transparent',
                transition: 'all .15s',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{icon}</span>
              {label}
              {page === key && <span style={{ marginLeft: 'auto', color: 'var(--green)', fontSize: 12 }}>●</span>}
            </button>
          ))}

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />

          {/* Settings & auth */}
          <button
            onClick={() => navigate('settings')}
            style={{ width: '100%', padding: '14px 20px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 15, display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'DM Sans, sans-serif' }}
          >
            <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>⚙️</span>
            Settings
          </button>

          {user ? (
            <button
              onClick={() => { onSignOut(); setMenuOpen(false); }}
              style={{ width: '100%', padding: '14px 20px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 15, display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'DM Sans, sans-serif' }}
            >
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>🚪</span>
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => { onSignIn(); setMenuOpen(false); }}
              style={{ width: '100%', padding: '14px 20px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--green)', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'DM Sans, sans-serif' }}
            >
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>👤</span>
              Sign In
            </button>
          )}
        </div>
      )}

      {/* Mobile bottom tab bar */}
      <div className="mobile-only" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--navy)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        zIndex: 98,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {[
          { key: 'home',     label: 'Home',    icon: '🏠' },
          { key: 'map',      label: 'Map',     icon: '🗺️' },
          { key: 'customer', label: 'Bookings',icon: '📋' },
          { key: 'messages', label: 'Messages',icon: '💬' },
          { key: 'provider', label: 'Provider',icon: '🔧' },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => navigate(key)}
            style={{
              flex: 1, padding: '10px 4px 8px', border: 'none', cursor: 'pointer',
              background: 'transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              borderTop: page === key ? '2px solid var(--green)' : '2px solid transparent',
              transition: 'all .15s',
            }}
          >
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span style={{ fontSize: 10, color: page === key ? 'var(--green)' : 'rgba(255,255,255,0.5)', fontWeight: page === key ? 600 : 400, fontFamily: 'DM Sans, sans-serif' }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .desktop-nav { display: flex !important; }
        .desktop-only { display: flex !important; }
        .mobile-only  { display: none !important; }

        @media (max-width: 768px) {
          .desktop-nav  { display: none !important; }
          .desktop-only { display: none !important; }
          .mobile-only  { display: flex !important; }

          /* Add bottom padding so content isn't hidden behind bottom tab bar */
          body { padding-bottom: 70px; }
        }
      `}</style>
    </>
  );
}
