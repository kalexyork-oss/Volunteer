import React, { useState, useEffect } from 'react';
import { signIn, signUp } from '../lib/db';
import { supabase } from '../lib/supabase';

export default function AuthModal({ onClose, onSuccess, initialMode }) {
  const [mode, setMode]         = useState(initialMode || 'signin');
  const [role, setRole]         = useState('customer');
  const [form, setForm]         = useState({ name: '', email: '', password: '', zip: '', dob: '', newPassword: '', confirmPassword: '' });
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const u = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => { if (initialMode) setMode(initialMode); }, [initialMode]);

  // Calculate age from DOB
  const getAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    setLoading(true);

    if (mode === 'signup') {
      if (!form.name) { setError('Please enter your name.'); setLoading(false); return; }
      if (!form.email || !form.password) { setError('Email and password are required.'); setLoading(false); return; }
      if (form.password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }

      // Age check
      if (!form.dob) { setError('Please enter your date of birth.'); setLoading(false); return; }
      const age = getAge(form.dob);
      if (age === null || age < 18) { setError('You must be 18 or older to use Volunteer.'); setLoading(false); return; }

      // Age confirmation checkbox
      if (!ageConfirmed) { setError('Please confirm you are 18 years of age or older.'); setLoading(false); return; }

      const { error: err } = await signUp({ ...form, role });
      if (err) { setError(err.message); setLoading(false); return; }
      setSuccess('Account created! Check your email to confirm, then sign in.');
      setMode('signin');

    } else if (mode === 'signin') {
      if (!form.email || !form.password) { setError('Please fill in all fields.'); setLoading(false); return; }
      const { data, error: err } = await signIn({ email: form.email, password: form.password });
      if (err) { setError(err.message); setLoading(false); return; }
      onSuccess(data.user);
      onClose();

    } else if (mode === 'forgot') {
      if (!form.email) { setError('Please enter your email.'); setLoading(false); return; }
      const { error: err } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: window.location.origin + '/?reset=true',
      });
      if (err) { setError(err.message); setLoading(false); return; }
      setSuccess('Reset link sent! Check your inbox and spam folder.');

    } else if (mode === 'reset') {
      if (!form.newPassword) { setError('Please enter a new password.'); setLoading(false); return; }
      if (form.newPassword.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }
      if (form.newPassword !== form.confirmPassword) { setError('Passwords do not match.'); setLoading(false); return; }
      const { error: err } = await supabase.auth.updateUser({ password: form.newPassword });
      if (err) { setError(err.message); setLoading(false); return; }
      setSuccess('Password updated! Signing you in...');
      setTimeout(() => {
        window.history.replaceState(null, '', window.location.pathname);
        onClose();
      }, 2000);
    }

    setLoading(false);
  };

  const titles = { signin: 'Welcome back', signup: 'Create account', forgot: 'Reset password', reset: 'Set new password' };

  // Live age feedback
  const age = getAge(form.dob);
  const ageValid = age !== null && age >= 18;
  const ageInvalid = age !== null && age < 18;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, color: 'var(--navy)' }}>{titles[mode]}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        {(mode === 'signin' || mode === 'signup') && (
          <div className="tab-pills" style={{ marginBottom: 24 }}>
            <button className={`tab-pill ${mode === 'signin' ? 'active' : ''}`} onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}>Sign In</button>
            <button className={`tab-pill ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}>Sign Up</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (<>
            <div><label>Full Name</label><input type="text" placeholder="Your name" value={form.name} onChange={e => u('name', e.target.value)} autoFocus /></div>

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
                  }}>{label}</div>
                ))}
              </div>
            </div>

            <div><label>Zip Code</label><input type="text" placeholder="Your zip code" value={form.zip} onChange={e => u('zip', e.target.value)} maxLength={5} /></div>

            {/* Date of Birth */}
            <div>
              <label>Date of Birth</label>
              <input
                type="date"
                value={form.dob}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                onChange={e => u('dob', e.target.value)}
              />
              {ageValid && (
                <div style={{ fontSize: 12, color: '#15803d', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  ✓ Age verified — you're {age} years old
                </div>
              )}
              {ageInvalid && (
                <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>
                  ✗ You must be 18 or older to use Volunteer
                </div>
              )}
            </div>

            {/* Age confirmation checkbox */}
            <div
              onClick={() => setAgeConfirmed(c => !c)}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '12px 14px', borderRadius: 10, background: ageConfirmed ? '#f0fdf4' : 'var(--gray-50)', border: `1.5px solid ${ageConfirmed ? '#86efac' : 'var(--gray-200)'}`, transition: 'all .2s' }}
            >
              <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${ageConfirmed ? '#22c55e' : 'var(--gray-300)'}`, background: ageConfirmed ? '#22c55e' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all .2s' }}>
                {ageConfirmed && <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.5 }}>
                I confirm that I am <strong>18 years of age or older</strong> and agree to the{' '}
                <span style={{ color: 'var(--navy)', textDecoration: 'underline' }}>Terms of Service</span>
                {' '}and{' '}
                <span style={{ color: 'var(--navy)', textDecoration: 'underline' }}>Privacy Policy</span>.
              </span>
            </div>
          </>)}

          {mode === 'forgot' && (
            <div style={{ background: 'var(--gray-50)', borderRadius: 10, padding: 14, fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>
              📧 Enter your email and we'll send you a reset link. Check your spam folder if you don't see it within a minute.
            </div>
          )}

          {/* Email */}
          {mode !== 'reset' && (
            <div>
              <label>Email</label>
              <input type="text" placeholder="you@email.com" value={form.email} onChange={e => u('email', e.target.value)} autoFocus={mode !== 'signup'} />
            </div>
          )}

          {/* Password */}
          {(mode === 'signin' || mode === 'signup') && (
            <div>
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => u('password', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} style={{ paddingRight: 44 }} />
                <button onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--gray-400)' }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {mode === 'signin' && (
                <div style={{ textAlign: 'right', marginTop: 6 }}>
                  <button onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', fontSize: 12 }}>
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Reset password fields */}
          {mode === 'reset' && (<>
            <div>
              <label>New Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} placeholder="Min 6 characters" value={form.newPassword} onChange={e => u('newPassword', e.target.value)} autoFocus style={{ paddingRight: 44 }} />
                <button onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--gray-400)' }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {form.newPassword && (
                <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 100, transition: 'background .2s',
                      background: form.newPassword.length >= i * 3 ? i <= 1 ? '#ef4444' : i <= 2 ? '#f59e0b' : i <= 3 ? '#3b82f6' : '#22c55e' : 'var(--gray-200)',
                    }} />
                  ))}
                </div>
              )}
            </div>
            <div>
              <label>Confirm New Password</label>
              <input type={showPass ? 'text' : 'password'} placeholder="Re-enter password" value={form.confirmPassword} onChange={e => u('confirmPassword', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              {form.confirmPassword && form.newPassword !== form.confirmPassword && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>Passwords don't match</div>}
              {form.confirmPassword && form.newPassword === form.confirmPassword && form.newPassword.length >= 6 && <div style={{ fontSize: 12, color: '#22c55e', marginTop: 4 }}>✓ Passwords match</div>}
            </div>
          </>)}

          {error   && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#991b1b' }}>⚠️ {error}</div>}
          {success && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534' }}>✓ {success}</div>}

          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Send Reset Link' : 'Set New Password'}
          </button>

          {mode === 'forgot' && (
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--gray-500)' }}>
              Remember it?{' '}
              <button onClick={() => { setMode('signin'); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', color: 'var(--green-dark)', cursor: 'pointer', fontWeight: 600 }}>Back to sign in</button>
            </p>
          )}
          {(mode === 'signin' || mode === 'signup') && (
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--gray-500)' }}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', color: 'var(--green-dark)', cursor: 'pointer', fontWeight: 600 }}>
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
