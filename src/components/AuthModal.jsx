import React, { useState } from 'react';
import { signIn, signUp } from '../lib/db';
import { supabase } from '../lib/supabase';

export default function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode]       = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [role, setRole]       = useState('customer');
  const [form, setForm]       = useState({ name: '', email: '', password: '', zip: '' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const u = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    if (!form.email || (mode !== 'forgot' && !form.password)) { setError('Please fill in all fields.'); return; }
    if (mode === 'signup' && !form.name) { setError('Please enter your name.'); return; }

    setLoading(true);

    if (mode === 'signup') {
      const { error: err } = await signUp({ ...form, role });
      if (err) { setError(err.message); setLoading(false); return; }
      setSuccess('Account created! Check your email to confirm, then sign in.');
      setMode('signin');

    } else if (mode === 'signin') {
      const { data, error: err } = await signIn({ email: form.email, password: form.password });
      if (err) { setError(err.message); setLoading(false); return; }
      onSuccess(data.user);
      onClose();

    } else if (mode === 'forgot') {
      const { error: err } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (err) { setError(err.message); setLoading(false); return; }
      setSuccess('Password reset email sent! Check your inbox and follow the link.');
    }

    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 420 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, color: 'var(--navy)' }}>
            {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        {/* Mode toggle (only for signin/signup) */}
        {mode !== 'forgot' && (
          <div className="tab-pills" style={{ marginBottom: 24 }}>
            <button className={`tab-pill ${mode === 'signin' ? 'active' : ''}`} onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}>Sign In</button>
            <button className={`tab-pill ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}>Sign Up</button>
          </div>
        )}

        {/* Forgot password back link */}
        {mode === 'forgot' && (
          <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 20 }}>
            Enter your email and we'll send you a link to reset your password.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Sign up only fields */}
          {mode === 'signup' && (
            <>
              <div>
                <label>Full Name</label>
                <input type="text" placeholder="Your name" value={form.name} onChange={e => u('name', e.target.value)} autoFocus />
              </div>
              <div>
                <label>I want to...</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  {[['customer','🙋 Hire someone'],['provider','🔧 Offer my skills']].map(([r, label]) => (
                    <div key={r} onClick={() => setRole(r)} style={{
                      flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                      border: `2px solid ${role === r ? 'var(--navy)' : 'var(--gray-200)'}`,
                      background: role === r ? 'var(--navy)' : 'white',
                      color: role === r ? 'white' : 'var(--gray-700)',
                      fontSize: 14, fontWeight: 500, transition: 'all .2s',
                    }}>
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

          {/* Email */}
          <div>
            <label>Email</label>
            <input type="text" placeholder="you@email.com" value={form.email} onChange={e => u('email', e.target.value)} autoFocus={mode === 'signin' || mode === 'forgot'} />
          </div>

          {/* Password (not shown on forgot screen) */}
          {mode !== 'forgot' && (
            <div>
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={e => u('password', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              {/* Forgot password link */}
              {mode === 'signin' && (
                <div style={{ textAlign: 'right', marginTop: 6 }}>
                  <button
                    onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', fontSize: 12 }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#991b1b' }}>
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534' }}>
              ✓ {success}
            </div>
          )}

          {/* Submit button */}
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
          </button>

          {/* Bottom links */}
          {mode === 'forgot' ? (
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--gray-500)' }}>
              Remember it?{' '}
              <button onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--green-dark)', cursor: 'pointer', fontWeight: 600 }}>
                Back to sign in
              </button>
            </p>
          ) : (
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--gray-500)' }}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--green-dark)', cursor: 'pointer', fontWeight: 600 }}>
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
