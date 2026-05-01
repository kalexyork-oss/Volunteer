import React from 'react';

export default function SettingsPage({ darkMode, setDarkMode, user, profile }) {
  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('volunteer_dark_mode', next ? 'true' : 'false');
    if (next) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  return (
    <div className="section" style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, color: 'var(--gray-800)' }}>Settings</h2>
        <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>Manage your account and preferences</p>
      </div>

      {/* ---- APPEARANCE ---- */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, background: 'var(--navy)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            🎨
          </div>
          <div>
            <h3 style={{ fontSize: 16, color: 'var(--gray-800)' }}>Appearance</h3>
            <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>Customize how Volunteer looks</p>
          </div>
        </div>

        {/* Dark mode toggle */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderRadius: 12,
          background: darkMode ? '#0f0f1a' : 'var(--gray-50)',
          border: `1.5px solid ${darkMode ? '#2a2a40' : 'var(--gray-200)'}`,
          transition: 'all .3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 28 }}>{darkMode ? '🌙' : '☀️'}</div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: 15 }}>
                {darkMode ? 'Dark Mode' : 'Light Mode'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>
                {darkMode
                  ? 'Dark theme is on — easier on the eyes at night'
                  : 'Light theme is on — switch to dark for night use'}
              </div>
            </div>
          </div>

          {/* Toggle switch */}
          <div
            onClick={toggleDark}
            style={{
              width: 52, height: 28, borderRadius: 100,
              background: darkMode ? 'var(--green)' : 'var(--gray-200)',
              cursor: 'pointer', position: 'relative',
              transition: 'background .3s', flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute',
              top: 4, left: darkMode ? 28 : 4,
              width: 20, height: 20, borderRadius: '50%',
              background: 'white',
              transition: 'left .25s',
              boxShadow: '0 1px 4px rgba(0,0,0,.25)',
            }} />
          </div>
        </div>

        {/* Theme preview */}
        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
          {/* Light preview */}
          <div
            onClick={() => { if (darkMode) toggleDark(); }}
            style={{
              flex: 1, borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
              border: `2px solid ${!darkMode ? 'var(--green)' : 'var(--gray-200)'}`,
              transition: 'border .2s',
            }}
          >
            <div style={{ background: '#0f1e3d', height: 20, display: 'flex', alignItems: 'center', padding: '0 8px', gap: 4 }}>
              {[1,2,3].map(i => <div key={i} style={{ height: 4, width: 20, background: 'rgba(255,255,255,.3)', borderRadius: 2 }} />)}
            </div>
            <div style={{ background: '#f8fafc', padding: 8 }}>
              <div style={{ height: 6, width: '60%', background: '#1e293b', borderRadius: 2, marginBottom: 4 }} />
              <div style={{ height: 4, width: '80%', background: '#94a3b8', borderRadius: 2, marginBottom: 8 }} />
              <div style={{ height: 24, background: '#22c55e', borderRadius: 6 }} />
            </div>
            <div style={{ textAlign: 'center', padding: '6px 0', fontSize: 12, fontWeight: 500, color: !darkMode ? 'var(--green-dark)' : 'var(--gray-500)', background: !darkMode ? '#f0fdf4' : 'var(--gray-50)' }}>
              {!darkMode ? '✓ Light' : 'Light'}
            </div>
          </div>

          {/* Dark preview */}
          <div
            onClick={() => { if (!darkMode) toggleDark(); }}
            style={{
              flex: 1, borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
              border: `2px solid ${darkMode ? 'var(--green)' : 'var(--gray-200)'}`,
              transition: 'border .2s',
            }}
          >
            <div style={{ background: '#0a0a1a', height: 20, display: 'flex', alignItems: 'center', padding: '0 8px', gap: 4 }}>
              {[1,2,3].map(i => <div key={i} style={{ height: 4, width: 20, background: 'rgba(255,255,255,.2)', borderRadius: 2 }} />)}
            </div>
            <div style={{ background: '#0f0f1a', padding: 8 }}>
              <div style={{ height: 6, width: '60%', background: '#f3f4f6', borderRadius: 2, marginBottom: 4 }} />
              <div style={{ height: 4, width: '80%', background: '#6b7280', borderRadius: 2, marginBottom: 8 }} />
              <div style={{ height: 24, background: '#22c55e', borderRadius: 6 }} />
            </div>
            <div style={{ textAlign: 'center', padding: '6px 0', fontSize: 12, fontWeight: 500, color: darkMode ? '#22c55e' : 'var(--gray-500)', background: darkMode ? '#0f1a0f' : '#f8fafc' }}>
              {darkMode ? '✓ Dark' : 'Dark'}
            </div>
          </div>
        </div>
      </div>

      {/* ---- ACCOUNT ---- */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, background: 'var(--navy)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            👤
          </div>
          <div>
            <h3 style={{ fontSize: 16, color: 'var(--gray-800)' }}>Account</h3>
            <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>Your account information</p>
          </div>
        </div>

        {user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Name', profile?.name || '—'],
              ['Email', user.email],
              ['Role', profile?.role || '—'],
              ['Zip Code', profile?.zip || '—'],
              ['Member Since', new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
            ].map(([label, value]) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', background: 'var(--gray-50)', borderRadius: 10,
              }}>
                <span style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 14, color: 'var(--gray-800)', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Sign in to see your account info.</p>
        )}
      </div>

      {/* ---- ABOUT ---- */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, background: 'var(--navy)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            ℹ️
          </div>
          <div>
            <h3 style={{ fontSize: 16, color: 'var(--gray-800)' }}>About Volunteer</h3>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.7 }}>
          Volunteer is a local on-demand service marketplace connecting customers with skilled neighbors.
          Built with ❤️ in Fort Mill, SC.
        </p>
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--gray-400)' }}>Version 1.0.0</div>
      </div>
    </div>
  );
}
