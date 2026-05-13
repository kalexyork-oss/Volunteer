import React, { useState } from 'react';
import { TAGS } from '../data';
import { createBooking } from '../lib/db';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

export default function BookingModal({ onClose, onSuccess, providers, userId }) {
  const [step,      setStep]      = useState(1);
  const [form,      setForm]      = useState({ service: '', date: '', time: '', zip: '', notes: '' });
  const [suggested, setSuggested] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [aiTip,     setAiTip]     = useState('');
  const [confirmed, setConfirmed] = useState(null); // holds the completed booking + provider

  const u = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const today = new Date().toISOString().split('T')[0];

  const matchProviders = () => {
    const term = form.service.toLowerCase();
    const matched = providers.filter(p =>
      p.available && p.skills && p.skills.some(s =>
        s.toLowerCase().includes(term.split(' ')[0]) ||
        term.includes(s.toLowerCase().split(' ')[0])
      )
    );
    return matched.length ? matched : providers.filter(p => p.available).slice(0, 3);
  };

  const findProviders = async () => {
    if (!form.date || !form.time) { alert('Please select a date and time.'); return; }
    setLoading(true);
    setSuggested(matchProviders());
    try {
      const res = await fetch(ANTHROPIC_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 100,
          messages: [{ role: 'user', content: `One short practical tip (max 20 words) for hiring someone for: "${form.service}"` }],
        }),
      });
      const data = await res.json();
      setAiTip(data.content?.[0]?.text || '');
    } catch (_) {}
    setLoading(false);
    setStep(3);
  };

  const book = async (provider) => {
    setSaving(true);
    const price = Math.floor(50 + Math.random() * 60);
    const { data, error } = await createBooking({
      customerId: userId,
      providerId: provider ? provider.id : null,
      service:    form.service,
      date:       form.date,
      time:       form.time,
      zip:        form.zip,
      notes:      form.notes,
      price,
    });
    setSaving(false);
    if (error) { alert('Error creating booking: ' + error.message); return; }
    // Show confirmation screen instead of closing immediately
    setConfirmed({ booking: data, provider });
    setStep(4);
    onSuccess(data);
  };

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && step !== 4) onClose(); }}>
      <div className="modal">

        {/* Header — hide on confirmation */}
        {step !== 4 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, color: 'var(--navy)' }}>Book a Service</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
          </div>
        )}

        {/* Progress bar — hide on confirmation */}
        {step !== 4 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            {['Details', 'Date & Time', 'Confirm'].map((label, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: 4, borderRadius: 4, marginBottom: 6, background: step > i+1 ? 'var(--green)' : step === i+1 ? 'var(--navy)' : 'var(--gray-200)' }} />
                <span style={{ fontSize: 11, color: step === i+1 ? 'var(--navy)' : 'var(--gray-400)', fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* STEP 1 — Details */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label>What do you need help with?</label>
              <input type="text" placeholder="e.g. Fix leaky faucet, dog walking, move furniture..." value={form.service} onChange={e => u('service', e.target.value)} autoFocus />
              <div className="tag-cloud" style={{ marginTop: 8 }}>
                {TAGS.slice(0, 12).map(t => (
                  <span key={t} className={`tag ${form.service === t ? 'active' : ''}`} onClick={() => u('service', t)}>{t}</span>
                ))}
              </div>
            </div>
            <div>
              <label>Your Zip Code</label>
              <input type="text" placeholder="Enter zip code" value={form.zip} onChange={e => u('zip', e.target.value)} maxLength={5} />
            </div>
            <div>
              <label>Additional Notes</label>
              <textarea rows={3} style={{ resize: 'none' }} placeholder="Any details that would help the provider..." value={form.notes} onChange={e => u('notes', e.target.value)} />
            </div>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => form.service && form.zip ? setStep(2) : alert('Please fill in service and zip code.')}>
              Continue →
            </button>
          </div>
        )}

        {/* STEP 2 — Date & Time */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 16, background: 'var(--gray-50)' }}>
              <div style={{ fontSize: 14, color: 'var(--gray-500)' }}>Service</div>
              <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{form.service}</div>
              <div style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>📍 {form.zip}</div>
            </div>
            <div><label>Preferred Date</label><input type="date" value={form.date} min={today} onChange={e => u('date', e.target.value)} /></div>
            <div><label>Preferred Time</label><input type="time" value={form.time} onChange={e => u('time', e.target.value)} /></div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-outline" onClick={() => setStep(1)} style={{ flex: 1 }}>← Back</button>
              <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={findProviders} disabled={loading}>
                {loading ? 'Finding providers...' : 'Find Providers →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Provider selection */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {aiTip && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 14, fontSize: 13, color: '#166534' }}>
                💡 {aiTip}
              </div>
            )}
            <h3 style={{ fontSize: 15, color: 'var(--gray-600)' }}>Available Providers Near {form.zip}</h3>
            {suggested.length === 0 && (
              <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>No providers found yet — post as an open request and someone will claim it!</p>
            )}
            {suggested.map(p => (
              <div key={p.id} className="card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                  {(p.profiles?.name || 'P').split(' ').map(w => w[0]).join('').slice(0,2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{p.profiles?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{(p.skills || []).slice(0, 3).join(' · ')}</div>
                  {p.hourly_rate && <div style={{ fontSize: 12, color: 'var(--green-dark)', marginTop: 2 }}>${p.hourly_rate}/hr</div>}
                </div>
                <button className="btn-primary btn-sm" onClick={() => book(p)} disabled={saving}>
                  {saving ? '...' : 'Book'}
                </button>
              </div>
            ))}
            <button className="btn-outline" style={{ width: '100%' }} onClick={() => book(null)} disabled={saving}>
              {saving ? 'Posting...' : 'Post as Open Request (no provider yet)'}
            </button>
            <button style={{ background: 'none', border: 'none', color: 'var(--gray-500)', cursor: 'pointer', fontSize: 14 }} onClick={() => setStep(2)}>← Back</button>
          </div>
        )}

        {/* STEP 4 — Confirmation screen */}
        {step === 4 && confirmed && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '8px 0 16px' }}>

            {/* Big green checkmark */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, marginBottom: 20,
              boxShadow: '0 8px 32px rgba(34,197,94,0.35)'
            }}>✓</div>

            <h2 style={{ fontSize: 22, color: 'var(--navy)', marginBottom: 8, fontFamily: 'Sora, sans-serif' }}>
              {confirmed.provider ? "You're booked!" : "Request posted!"}
            </h2>
            <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 28, maxWidth: 300, lineHeight: 1.6 }}>
              {confirmed.provider
                ? `Your booking with ${confirmed.provider.profiles?.name} has been confirmed.`
                : 'Your open request is live. Providers in your area will see it and can accept it.'}
            </p>

            {/* Booking summary card */}
            <div style={{
              width: '100%', background: 'var(--gray-50)', borderRadius: 16,
              border: '1px solid var(--gray-200)', padding: 20, marginBottom: 24, textAlign: 'left'
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', letterSpacing: '0.08em', marginBottom: 14, textTransform: 'uppercase' }}>
                Booking Summary
              </div>

              {[
                ['Service',  form.service],
                ['Date',     formatDate(form.date)],
                ['Time',     formatTime(form.time)],
                ['Location', `📍 ${form.zip}`],
                ...(confirmed.provider ? [['Provider', confirmed.provider.profiles?.name]] : []),
                ...(form.notes ? [['Notes', form.notes]] : []),
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--gray-400)', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 13, color: 'var(--navy)', fontWeight: 500, textAlign: 'right' }}>{value}</span>
                </div>
              ))}

              <div style={{ borderTop: '1px solid var(--gray-200)', marginTop: 4, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>Status</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: confirmed.provider ? '#f59e0b' : '#3b82f6' }}>
                  {confirmed.provider ? '⏳ Pending Acceptance' : '🔍 Open Request'}
                </span>
              </div>
            </div>

            {/* What happens next */}
            <div style={{ width: '100%', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#166534', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>What happens next</div>
              {(confirmed.provider
                ? ['The provider will review and accept your booking', 'You\'ll get notified when they confirm', 'Chat with them in Messages with any questions']
                : ['Providers near you will see your request', 'One will accept and you\'ll be notified', 'Check My Bookings to track the status']
              ).map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: i < 2 ? 8 : 0 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <span style={{ fontSize: 13, color: '#166534', lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>

            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '13px' }} onClick={onClose}>
              View My Bookings
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
