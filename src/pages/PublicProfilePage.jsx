import React, { useState, useEffect } from 'react';
import { getProviderById, getProviderReviews } from '../lib/db';

const DAYS = ['mon','tue','wed','thu','fri','sat','sun'];
const DAY_LABELS = { mon:'Mon', tue:'Tue', wed:'Wed', thu:'Thu', fri:'Fri', sat:'Sat', sun:'Sun' };

function Stars({ rating, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? '#f59e0b' : '#e2e8f0', fontSize: size }}>★</span>
      ))}
    </span>
  );
}

function AvatarOrPhoto({ provider, size = 80 }) {
  const name = provider?.profiles?.name || 'P';
  const url  = provider?.profiles?.avatar_url || provider?.avatar_url;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora', fontWeight: 700, fontSize: size * 0.3, color: 'white', flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function PublicProfilePage({ providerId, onBook, onBack }) {
  const [provider, setProvider] = useState(null);
  const [reviews,  setReviews]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [imgModal, setImgModal] = useState(null);

  useEffect(() => {
    if (!providerId) return;
    Promise.all([getProviderById(providerId), getProviderReviews(providerId)]).then(([{ data: p }, { data: r }]) => {
      setProvider(p);
      setReviews(r || []);
      setLoading(false);
    });
  }, [providerId]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <p style={{ color: 'var(--gray-500)' }}>Loading profile...</p>
    </div>
  );

  if (!provider) return (
    <div className="section empty-state">
      <p>Provider not found.</p>
      <button className="btn-outline" onClick={onBack}>← Go back</button>
    </div>
  );

  const avail = provider.availability || {};
  const memberSince = provider.profiles?.created_at ? new Date(provider.profiles.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : null;

  return (
    <div>
      {/* Back button */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--gray-200)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--gray-500)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back to search
        </button>
      </div>

      {/* Hero banner */}
      <div style={{ background: 'linear-gradient(135deg, var(--navy-dark) 0%, var(--navy) 100%)', padding: '40px 24px 80px' }} />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
        {/* Profile card - overlapping hero */}
        <div className="card" style={{ marginTop: -60, marginBottom: 24, display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <AvatarOrPhoto provider={provider} size={90} />
            <div style={{
              position: 'absolute', bottom: 4, right: 4,
              width: 16, height: 16, borderRadius: '50%',
              background: provider.available ? 'var(--green)' : 'var(--gray-400)',
              border: '2px solid white',
            }} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 26, color: 'var(--navy)', fontFamily: 'Sora', fontWeight: 700 }}>
                  {provider.profiles?.name}
                </h1>
                <p style={{ fontSize: 15, color: 'var(--gray-600)', marginTop: 2 }}>{provider.headline}</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <span className={`badge ${provider.available ? 'badge-green' : 'badge-gray'}`}>
                  {provider.available ? '● Online' : '○ Offline'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 12 }}>
              {provider.rating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Stars rating={provider.rating} />
                  <span style={{ fontSize: 14, color: 'var(--gray-600)', fontWeight: 500 }}>{provider.rating}</span>
                  <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>({provider.review_count} reviews)</span>
                </div>
              )}
              {provider.job_count > 0 && <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>✅ {provider.job_count} jobs done</span>}
              {provider.profiles?.zip && <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>📍 {provider.profiles.zip}</span>}
              {provider.hourly_rate && <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>💵 ${provider.hourly_rate}/hr</span>}
              {memberSince && <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>📅 Member since {memberSince}</span>}
            </div>

            {provider.response_time && (
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--gray-500)' }}>
                ⚡ Responds {provider.response_time.toLowerCase()}
              </div>
            )}
          </div>

          <button className="btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => onBook(provider.id)}>
            Book {provider.profiles?.name?.split(' ')[0]}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
          <div>
            {/* About */}
            {provider.bio && (
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, color: 'var(--navy)', marginBottom: 12 }}>About</h3>
                <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.8 }}>{provider.bio}</p>
              </div>
            )}

            {/* Skills */}
            {provider.skills?.length > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, color: 'var(--navy)', marginBottom: 12 }}>Services Offered</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {provider.skills.map(s => (
                    <span key={s} style={{ background: 'var(--navy)', color: 'white', padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 500 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio */}
            {provider.portfolio_urls?.length > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, color: 'var(--navy)', marginBottom: 12 }}>Portfolio</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {provider.portfolio_urls.map((url, i) => (
                    <div key={i} onClick={() => setImgModal(url)} style={{ cursor: 'pointer', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', background: 'var(--gray-100)' }}>
                      <img src={url} alt={`Portfolio ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .2s' }}
                        onMouseOver={e => e.target.style.transform='scale(1.05)'}
                        onMouseOut={e => e.target.style.transform='scale(1)'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {provider.certifications?.length > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, color: 'var(--navy)', marginBottom: 12 }}>Certifications & Badges</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {provider.certifications.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                      <span style={{ fontSize: 18 }}>✅</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#15803d' }}>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, color: 'var(--navy)' }}>Reviews ({reviews.length})</h3>
                {provider.rating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Stars rating={provider.rating} size={16} />
                    <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{provider.rating}</span>
                  </div>
                )}
              </div>
              {reviews.length === 0 ? (
                <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>No reviews yet — be the first to book and leave a review!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {reviews.map(r => (
                    <div key={r.id} style={{ borderBottom: '1px solid var(--gray-100)', paddingBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>
                            {(r.profiles?.name || 'A').split(' ').map(w=>w[0]).join('').slice(0,2)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--navy)' }}>{r.profiles?.name || 'Anonymous'}</div>
                            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                          </div>
                        </div>
                        <Stars rating={r.rating} />
                      </div>
                      {r.body && <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 }}>{r.body}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Availability */}
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, color: 'var(--navy)', marginBottom: 12 }}>Availability</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {DAYS.map(d => (
                  <div key={d} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--gray-400)', marginBottom: 4 }}>{DAY_LABELS[d]}</div>
                    <div style={{
                      width: '100%', paddingBottom: '100%', borderRadius: 8, position: 'relative',
                      background: avail[d] ? 'var(--green)' : 'var(--gray-100)',
                    }}>
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: avail[d] ? 'white' : 'var(--gray-300)' }}>
                        {avail[d] ? '✓' : '✕'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Service radius */}
            {provider.service_radius && (
              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, color: 'var(--navy)', marginBottom: 8 }}>Service Area</h3>
                <p style={{ fontSize: 14, color: 'var(--gray-600)' }}>
                  📍 Up to <strong>{provider.service_radius} miles</strong> from {provider.profiles?.zip}
                </p>
              </div>
            )}

            {/* Quick stats */}
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, color: 'var(--navy)', marginBottom: 12 }}>Quick Stats</h3>
              {[
                ['Jobs Completed', provider.job_count || 0],
                ['Reviews',        provider.review_count || 0],
                ['Rating',         provider.rating ? provider.rating + ' / 5.0' : 'No ratings yet'],
                ['Response Time',  provider.response_time || 'Within a few hours'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{value}</span>
                </div>
              ))}
            </div>

            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onBook(provider.id)}>
              Book Now
            </button>
          </div>
        </div>
      </div>

      {/* Image modal */}
      {imgModal && (
        <div onClick={() => setImgModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img src={imgModal} alt="Portfolio" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
}
