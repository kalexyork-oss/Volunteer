import React, { useState, useMemo } from 'react';
import { TAGS } from '../data';

const REVIEWS = [
  { name: 'Rachel M.', text: 'Fixed my fence in under 2 hours. On time, professional, and cleaned up after!', service: 'Fence Repair', before: '🌿', after: '✨' },
  { name: 'Tyler B.', text: 'Tutored my son for SAT. He went from 1100 to 1320 in 6 weeks. Incredible!', service: 'SAT Tutoring', before: '📚', after: '🎓' },
  { name: 'Linda K.', text: 'Deep cleaned my house before listing. Got $15k over asking price!', service: 'Deep Cleaning', before: '🏠', after: '💎' },
];

function ProviderAvatar({ provider, size = 48 }) {
  const name = provider?.profiles?.name || 'P';
  const url  = provider?.profiles?.avatar_url;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora', fontWeight: 700, fontSize: size * 0.35, color: 'white', flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function LandingPage({ providers, bookings, onBook, setPage, onViewProfile }) {
  const [search,      setSearch]      = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterZip,   setFilterZip]   = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterMinRating, setFilterMinRating] = useState(0);
  const [sortBy,      setSortBy]      = useState('rating'); // 'rating' | 'price_low' | 'price_high' | 'reviews'

  const onlineProviders = providers.filter(p => p.available !== false);

  const filtered = useMemo(() => {
    let list = onlineProviders;

    // Text search
    if (search) {
      list = list.filter(p =>
        (p.skills || []).some(s => s.toLowerCase().includes(search.toLowerCase())) ||
        (p.profiles?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.headline || '').toLowerCase().includes(search.toLowerCase())
      );
    }

    // Zip filter
    if (filterZip) {
      list = list.filter(p => (p.zip || p.profiles?.zip || '').startsWith(filterZip));
    }

    // Max price filter
    if (filterMaxPrice) {
      list = list.filter(p => !p.hourly_rate || p.hourly_rate <= parseFloat(filterMaxPrice));
    }

    // Min rating filter
    if (filterMinRating > 0) {
      list = list.filter(p => !p.rating || p.rating >= filterMinRating);
    }

    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === 'rating')     return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'price_low')  return (a.hourly_rate || 999) - (b.hourly_rate || 999);
      if (sortBy === 'price_high') return (b.hourly_rate || 0) - (a.hourly_rate || 0);
      if (sortBy === 'reviews')    return (b.review_count || 0) - (a.review_count || 0);
      return 0;
    });

    return list;
  }, [onlineProviders, search, filterZip, filterMaxPrice, filterMinRating, sortBy]);

  const totalCompleted = (bookings || []).filter(b => b.status === 'Completed').length;
  const activeFilters  = [filterZip, filterMaxPrice, filterMinRating > 0].filter(Boolean).length;

  const clearFilters = () => { setFilterZip(''); setFilterMaxPrice(''); setFilterMinRating(0); setSortBy('rating'); };

  return (
    <div>
      {/* HERO */}
      <div className="hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 100, padding: '6px 16px', marginBottom: 20 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 500 }}>
              {onlineProviders.length} provider{onlineProviders.length !== 1 ? 's' : ''} available now
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(30px,5vw,54px)', fontWeight: 800, color: 'white', lineHeight: 1.1, maxWidth: 700, margin: '0 auto 16px' }}>
            Get anything done.<br /><span style={{ color: 'var(--green)' }}>Locally. Instantly.</span>
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.6 }}>
            Connect with skilled neighbors who can help with anything.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ fontSize: 16, padding: '14px 28px' }} onClick={() => onBook()}>Book a Service</button>
            <button className="btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', fontSize: 16, padding: '14px 28px' }} onClick={() => setPage('provider')}>Offer Your Skills</button>
          </div>
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 40 }}>
            {[['500+','Tasks Posted'],[totalCompleted+'','Jobs Completed'],['4.9 ★','Avg Rating']].map(([v,l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'white', fontFamily: 'Sora' }}>{v}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SEARCH + FILTERS */}
      <div className="section">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, color: 'var(--gray-800)', marginBottom: 8 }}>Find a Provider</h2>
          <p style={{ color: 'var(--gray-500)' }}>Search and filter to find the perfect match</p>
        </div>

        {/* Search bar */}
        <div style={{ maxWidth: 700, margin: '0 auto 16px', display: 'flex', gap: 10 }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search lawn care, tech help, tutoring..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 44 }} />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            style={{
              padding: '0 18px', borderRadius: 12, border: `2px solid ${showFilters ? 'var(--navy)' : 'var(--gray-200)'}`,
              background: showFilters ? 'var(--navy)' : 'white', color: showFilters ? 'white' : 'var(--gray-600)',
              cursor: 'pointer', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            }}
          >
            🎛️ Filters {activeFilters > 0 && <span style={{ background: 'var(--green)', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{activeFilters}</span>}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="card" style={{ maxWidth: 700, margin: '0 auto 24px', padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              {/* Zip filter */}
              <div>
                <label>Zip Code</label>
                <input type="text" placeholder="e.g. 29707" value={filterZip} onChange={e => setFilterZip(e.target.value)} maxLength={5} />
              </div>

              {/* Max price */}
              <div>
                <label>Max Price ($/hr)</label>
                <input type="number" placeholder="e.g. 75" value={filterMaxPrice} onChange={e => setFilterMaxPrice(e.target.value)} min="0" />
              </div>

              {/* Min rating */}
              <div>
                <label>Minimum Rating</label>
                <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                  {[0,3,4,4.5].map(r => (
                    <button key={r} onClick={() => setFilterMinRating(r)} style={{
                      flex: 1, padding: '7px 4px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                      background: filterMinRating === r ? 'var(--navy)' : 'var(--gray-100)',
                      color: filterMinRating === r ? 'white' : 'var(--gray-600)',
                    }}>
                      {r === 0 ? 'Any' : `${r}★+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <label>Sort By</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="rating">Highest Rated</option>
                  <option value="reviews">Most Reviews</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {activeFilters > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  Clear all filters ×
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {!search && (
          <div className="tag-cloud" style={{ justifyContent: 'center', marginBottom: 24 }}>
            {TAGS.slice(0, 14).map(t => <span key={t} className="tag" onClick={() => setSearch(t)}>{t}</span>)}
          </div>
        )}

        {/* Results count */}
        {(search || activeFilters > 0) && (
          <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 14, color: 'var(--gray-500)' }}>
            {filtered.length} provider{filtered.length !== 1 ? 's' : ''} found
            {search && <span> for "<strong>{search}</strong>"</span>}
          </div>
        )}

        {/* Provider cards */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 8 }}>🔍</div>
            <h3 style={{ marginBottom: 4 }}>No providers found</h3>
            <p style={{ marginBottom: 16 }}>Try adjusting your filters or post an open request.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {activeFilters > 0 && <button className="btn-outline" onClick={clearFilters}>Clear Filters</button>}
              <button className="btn-primary" onClick={() => onBook()}>Post a Request</button>
            </div>
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map(p => (
              <div key={p.id} className="provider-card">
                <div style={{ padding: '20px 20px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <ProviderAvatar provider={p} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: 15 }}>{p.profiles?.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{p.headline}</div>
                      {p.rating > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= Math.round(p.rating) ? '#f59e0b' : '#e2e8f0', fontSize: 13 }}>★</span>)}
                          <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>({p.review_count})</span>
                        </div>
                      )}
                    </div>
                    <span className="badge badge-green" style={{ fontSize: 11, flexShrink: 0 }}>● Open</span>
                  </div>
                  {p.bio && <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.bio}</p>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                    {(p.skills || []).slice(0,4).map(s => <span key={s} className="badge badge-gray" style={{ fontSize: 11 }}>{s}</span>)}
                    {(p.skills || []).length > 4 && <span className="badge badge-gray" style={{ fontSize: 11 }}>+{p.skills.length - 4}</span>}
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--gray-200)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>📍 {p.profiles?.zip || p.zip}</span>
                    {p.hourly_rate && <span style={{ fontSize: 13, color: 'var(--gray-500)', marginLeft: 8 }}>· <strong style={{ color: 'var(--navy)' }}>${p.hourly_rate}/hr</strong></span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => onViewProfile && onViewProfile(p.id)} style={{ background: 'none', border: '1.5px solid var(--gray-200)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: 'var(--gray-600)', fontWeight: 500 }}>View</button>
                    <button className="btn-primary btn-sm" onClick={() => onBook(p.id)}>Book</button>
                  </div>
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
                <div style={{ display: 'flex', marginBottom: 8 }}>{[1,2,3,4,5].map(s => <span key={s} style={{ color: '#f59e0b', fontSize: 14 }}>★</span>)}</div>
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
        <h2 style={{ fontSize: 28, color: 'var(--gray-800)', marginBottom: 8 }}>How Volunteer works</h2>
        <p style={{ color: 'var(--gray-500)', marginBottom: 40 }}>Four simple steps</p>
        <div className="grid-4">
          {[['🔍','Search','Browse providers or describe what you need'],['📅','Book','Pick a date and time that works'],['✅','Done','Your provider shows up and handles it'],['⭐','Review','Rate your experience']].map(([icon,title,desc],i) => (
            <div key={i}>
              <div style={{ width: 56, height: 56, background: 'var(--navy)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 16px' }}>{icon}</div>
              <h3 style={{ fontSize: 16, color: 'var(--gray-800)', marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
