import React, { useState } from 'react';
import { signIn, signUp } from '../lib/db';

export default function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode]     = useState('signin'); // 'signin' | 'signup'
  const [role, setRole]     = useState('customer');
  const [form, setForm]     = useState({ name: '', email: '', password: '', zip: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const u = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!form.email || !form.password) { setError('Email and password are required.'); return; }
    if (mode === 'signup' && !form.name)  { setError('Please enter your name.'); return; }

    setLoading(true);
    if (mode === 'signup') {
      const { error: err } = await signUp({ ...form, role });
      if (err) { setError(err.message); setLoading(false); return; }
      setError('');
      alert('Check your email to confirm your account, then sign in!');
      setMode('signin');
    } else {
      const { data, error: err } = await signIn({ email: form.email, password: form.password });
      if (err) { setError(err.message); setLoading(false); return; }
      onSuccess(data.user);
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, color: 'var(--navy)' }}>
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        {/* Mode toggle */}
        <div className="tab-pills" style={{ marginBottom: 24 }}>
          <button className={`tab-pill ${mode === 'signin' ? 'active' : ''}`} onClick={() => setMode('signin')}>Sign In</button>
          <button className={`tab-pill ${mode === 'signup' ? 'active' : ''}`} onClick={() => setMode('signup')}>Sign Up</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <>
              <div>
                <label>Full Name</label>
                <input type="text" placeholder="Your name" value={form.name} onChange={e => u('name', e.target.value)} autoFocus />
              </div>

              {/* Role picker */}
              <div>
                <label>I want to...</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  {[['customer','🙋 Hire someone'],['provider','🔧 Offer my skills']].map(([r, label]) => (
                    <div
                      key={r}
                      onClick={() => setRole(r)}
                      style={{
                        flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                        border: `2px solid ${role === r ? 'var(--navy)' : 'var(--gray-200)'}`,
                        background: role === r ? 'var(--navy)' : 'white',
                        color: role === r ? 'white' : 'var(--gray-700)',
                        fontSize: 14, fontWeight: 500, transition: 'all .2s',
                      }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label>Zip Code</label>
                <input type="text" placeholder="Your zip code" value={form.zip} onChange={e => u('zip', e.target.value)} maxLength={5} />
              </div>
            </>
          )}

          <div>
            <label>Email</label>
            <input type="text" placeholder="you@email.com" value={form.email} onChange={e => u('email', e.target.value)} autoFocus={mode === 'signin'} />
          </div>

          <div>
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password} onChange={e => u('password', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>

          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#991b1b' }}>
              {error}
            </div>
          )}

          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--gray-500)' }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              style={{ background: 'none', border: 'none', color: 'var(--green-dark)', cursor: 'pointer', fontWeight: 600 }}>
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
