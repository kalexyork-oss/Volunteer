import React, { useState, useEffect, useRef } from 'react';

// Leaflet loaded via CDN in index.html - no API key needed!
const L = window.L;

function ProviderCard({ provider, onBook, onViewProfile, isSelected }) {
  const name = provider?.profiles?.name || 'Provider';
  const url  = provider?.profiles?.avatar_url;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

  return (
    <div style={{
      padding: 16, borderRadius: 14, border: `2px solid ${isSelected ? 'var(--navy)' : 'var(--gray-200)'}`,
      background: isSelected ? '#f0f4ff' : 'white', cursor: 'pointer', transition: 'all .2s',
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {url ? (
            <img src={url} alt={name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 16 }}>
              {initials}
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: '50%', background: provider.available ? 'var(--green)' : 'var(--gray-400)', border: '2px solid white' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--navy)' }}>{name}</div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 1 }}>{provider.headline}</div>
          {provider.rating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 3 }}>
              <span style={{ color: '#f59e0b', fontSize: 12 }}>★</span>
              <span style={{ fontSize: 12, color: 'var(--gray-600)', fontWeight: 500 }}>{provider.rating}</span>
              <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>({provider.review_count})</span>
            </div>
          )}
        </div>

        {provider.hourly_rate && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 15 }}>${provider.hourly_rate}</div>
            <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>/hr</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10, marginBottom: 10 }}>
        {(provider.skills || []).slice(0,3).map(s => (
          <span key={s} style={{ background: 'var(--gray-100)', color: 'var(--gray-600)', padding: '3px 10px', borderRadius: 100, fontSize: 11 }}>{s}</span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onViewProfile(provider.id)} style={{ flex: 1, padding: '7px', borderRadius: 8, border: '1.5px solid var(--gray-200)', background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: 'var(--gray-600)' }}>
          View Profile
        </button>
        <button onClick={() => onBook(provider.id)} className="btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
          Book
        </button>
      </div>
    </div>
  );
}

export default function MapPage({ providers, onBook, onViewProfile }) {
  const mapRef       = useRef(null);
  const mapInstance  = useRef(null);
  const markersRef   = useRef({});
  const [selected,   setSelected]   = useState(null);
  const [search,     setSearch]     = useState('');
  const [userLat,    setUserLat]    = useState(35.1035); // Default: Fort Mill, SC
  const [userLng,    setUserLng]    = useState(-80.9420);
  const [locating,   setLocating]   = useState(false);
  const [mapLoaded,  setMapLoaded]  = useState(false);

  const online = providers.filter(p => p.available !== false);

  const filtered = search
    ? online.filter(p =>
        (p.profiles?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.skills || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
      )
    : online;

  // Load Leaflet CSS + JS if not already loaded
  useEffect(() => {
    if (window.L) { setMapLoaded(true); return; }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstance.current) return;
    const L = window.L;

    mapInstance.current = L.map(mapRef.current, { zoomControl: true }).setView([userLat, userLng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance.current);

    // User location marker
    const userIcon = L.divIcon({
      html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
      className: '',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    L.marker([userLat, userLng], { icon: userIcon }).addTo(mapInstance.current).bindPopup('You are here');
  }, [mapLoaded, userLat, userLng]);

  // Add provider markers
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return;
    const L = window.L;

    // Remove old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    filtered.forEach(p => {
      // Use stored coords or generate from zip (rough approximation)
      const lat = p.lat || (userLat + (Math.random() - 0.5) * 0.1);
      const lng = p.lng || (userLng + (Math.random() - 0.5) * 0.1);
      const name = p.profiles?.name || 'Provider';
      const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

      const icon = L.divIcon({
        html: `<div style="
          width:40px;height:40px;
          background:${selected?.id === p.id ? 'var(--green,#22c55e)' : '#0f1e3d'};
          border:3px solid white;
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          color:white;font-weight:700;font-size:13px;
          box-shadow:0 3px 10px rgba(0,0,0,.3);
          cursor:pointer;
          font-family:Sora,sans-serif;
          transition:all .2s;
        ">${initials}</div>`,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([lat, lng], { icon })
        .addTo(mapInstance.current)
        .bindPopup(`
          <div style="font-family:DM Sans,sans-serif;min-width:160px">
            <div style="font-weight:700;color:#0f1e3d;font-size:14px">${name}</div>
            <div style="font-size:12px;color:#64748b;margin-top:2px">${p.headline || ''}</div>
            ${p.hourly_rate ? `<div style="font-size:13px;color:#22c55e;font-weight:600;margin-top:4px">$${p.hourly_rate}/hr</div>` : ''}
          </div>
        `)
        .on('click', () => {
          setSelected(p);
        });

      markersRef.current[p.id] = marker;
    });
  }, [mapLoaded, filtered, selected, userLat, userLng]);

  const locateUser = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLat(latitude);
        setUserLng(longitude);
        if (mapInstance.current) {
          mapInstance.current.setView([latitude, longitude], 13);
        }
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const flyToProvider = (provider) => {
    setSelected(provider);
    if (!mapInstance.current) return;
    const lat = provider.lat || (userLat + (Math.random() - 0.5) * 0.05);
    const lng = provider.lng || (userLng + (Math.random() - 0.5) * 0.05);
    mapInstance.current.flyTo([lat, lng], 14, { duration: 0.8 });
    markersRef.current[provider.id]?.openPopup();
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Left sidebar */}
      <div style={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--gray-200)', background: 'white', overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--gray-200)' }}>
          <h2 style={{ fontSize: 18, color: 'var(--navy)', marginBottom: 10, fontFamily: 'Sora' }}>Providers Near You</h2>
          <div className="search-bar">
            <span className="search-icon" style={{ fontSize: 15 }}>🔍</span>
            <input type="text" placeholder="Search providers..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, height: 40, fontSize: 13 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{filtered.length} available</span>
            <button onClick={locateUser} disabled={locating} style={{ background: 'none', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer', color: 'var(--gray-600)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {locating ? '⏳' : '📍'} {locating ? 'Locating...' : 'My Location'}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <p>No providers found.</p>
            </div>
          ) : filtered.map(p => (
            <div key={p.id} onClick={() => flyToProvider(p)}>
              <ProviderCard
                provider={p}
                onBook={onBook}
                onViewProfile={onViewProfile}
                isSelected={selected?.id === p.id}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        {!mapLoaded && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
              <p style={{ color: 'var(--gray-500)' }}>Loading map...</p>
            </div>
          </div>
        )}
        {/* Map attribution override */}
        <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'rgba(255,255,255,.8)', fontSize: 10, padding: '2px 6px', zIndex: 1000 }}>
          © OpenStreetMap
        </div>
      </div>
    </div>
  );
}
