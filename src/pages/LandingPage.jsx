import React, { useState } from 'react';
import { TAGS } from '../data';

const REVIEWS = [
  { name: 'Rachel M.', text: 'Fixed my fence in under 2 hours. On time, professional, and cleaned up after!', service: 'Fence Repair', before: '🌿', after: '✨' },
  { name: 'Tyler B.', text: 'Tutored my son for SAT. He went from 1100 to 1320 in 6 weeks. Incredible!', service: 'SAT Tutoring', before: '📚', after: '🎓' },
  { name: 'Linda K.', text: 'Deep cleaned my house before listing. Got $15k over asking price!', service: 'Deep Cleaning', before: '🏠', after: '💎' },
];

export default function LandingPage({ providers, bookings, onBook, setPage }) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? providers.filter(p =>
        (p.skills || []).some(s => s.toLowerCase().includes(search.toLowerCase())) ||
        (p.profiles?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.headline || '').toLowerCase().includes(search.toLowerCase())
      )
    : providers;

  const totalCompleted = (bookings || []).filter(b => b.status === 'Completed').length;

  return (
    <div>
      {/* HERO */}
      <div className="hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 100, padding: '6px 16px', marginBottom: 20 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 500 }}>
              {providers.length} provider{providers.length !== 1 ? 's' : ''} available now
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(30px,5vw,54px)', fontWeight: 800, color: 'white', lineHeight: 1.1, maxWidth: 700, margin: '0 auto 16px' }}>
            Get anything done.<br /><span style={{ color: 'var(--green)' }}>Locally. Instantly.</span>
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.6 }}>
            Connect with skilled neighbors who can help with anything.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ fontSize: 16, padding: '14px 28px' }} onClick={onBook}>Book a Service</button>
            <button className="btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', fontSize: 16, padding: '14px 28px' }} onClick={() => setPage('provider')}>Offer Your Skills</button>
          </div>
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 40 }}>
            {[['500+','Tasks Posted'], [totalCompleted + '','Jobs Completed'], ['4.9 ★','Avg Rating']].map(([v, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'white', fontFamily: 'Sora' }}>{v}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="section">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, color: 'var(--navy)', marginBottom: 8 }}>Find a Provider</h2>
          <p style={{ color: 'var(--gray-500)' }}>Search by skill, service, or name</p>
        </div>
        <div className="search-bar" style={{ maxWidth: 600, margin: '0 auto 24px' }}>
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search lawn care, tech help, tutoring..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 44 }} />
        </div>
        {!search && (
          <div className="tag-cloud" style={{ justifyContent: 'center', marginBottom: 32 }}>
            {TAGS.slice(0, 14).map(t => <span key={t} className="tag" onClick={() => setSearch(t)}>{t}</span>)}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 8 }}>🔍</div>
            <h3 style={{ marginBottom: 4 }}>{search ? `No providers found for "${search}"` : 'No providers yet'}</h3>
            <p style={{ marginBottom: 16 }}>Be the first! Post an open request and local helpers will respond.</p>
            <button className="btn-primary" onClick={onBook}>Post a Request</button>
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map(p => (
              <div key={p.id} className="provider-card">
                <div style={{ padding: '20px 20px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                      {(p.profiles?.name || 'P').split(' ').map(w => w[0]).join('').slice(0,2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: 15 }}>{p.profiles?.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{p.headline}</div>
                      {p.rating && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= Math.round(p.rating) ? '#f59e0b' : '#e2e8f0', fontSize: 13 }}>★</span>)}
                          <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{p.review_count} reviews</span>
                        </div>
                      )}
                    </div>
                    <span className="badge badge-green" style={{ fontSize: 11, flexShrink: 0 }}>● Open</span>
                  </div>
                  {p.bio && <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6, marginBottom: 12 }}>{p.bio}</p>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {(p.skills || []).map(s => <span key={s} className="badge badge-gray" style={{ fontSize: 11 }}>{s}</span>)}
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--gray-200)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                    📍 {p.zip}
                    {p.hourly_rate ? ` · $${p.hourly_rate}/hr` : ''}
                  </span>
                  <button className="btn-primary btn-sm" onClick={onBook}>Book Now</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TRUST */}
      <div style={{ background: 'var(--navy)', padding: '60px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, color: 'white', marginBottom: 8 }}>Trusted by your neighbors</h2>
          </div>
          <div className="grid-3">
            {REVIEWS.map((r, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', marginBottom: 8 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: '#f59e0b', fontSize: 14 }}>★</span>)}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 1.7, margin: '12px 0' }}>{r.text}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>— {r.name} · {r.service}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 10px', fontSize: 18 }}>{r.before}</div>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>→</span>
                    <div style={{ background: 'rgba(34,197,94,0.15)', borderRadius: 8, padding: '4px 10px', fontSize: 18 }}>{r.after}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="section" style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, color: 'var(--navy)', marginBottom: 8 }}>How Volunteer works</h2>
        <p style={{ color: 'var(--gray-500)', marginBottom: 40 }}>Four simple steps</p>
        <div className="grid-4">
          {[['🔍','Search','Browse providers or describe what you need'],['📅','Book','Pick a date and time that works'],['✅','Done','Your provider shows up and handles it'],['⭐','Review','Rate your experience']].map(([icon,title,desc],i) => (
            <div key={i}>
              <div style={{ width: 56, height: 56, background: 'var(--navy)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 16px' }}>{icon}</div>
              <h3 style={{ fontSize: 16, color: 'var(--navy)', marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
