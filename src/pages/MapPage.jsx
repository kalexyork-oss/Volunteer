import React, { useState, useEffect, useRef, useMemo } from 'react';

function ProviderCard({ provider, onBook, onViewProfile, isSelected }) {
  const name     = provider?.profiles?.name || 'Provider';
  const url      = provider?.profiles?.avatar_url;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

  return (
    <div style={{
      padding: 16, borderRadius: 14,
      border: `2px solid ${isSelected ? 'var(--navy)' : 'var(--gray-200)'}`,
      background: isSelected ? '#f0f4ff' : 'white',
      cursor: 'pointer', transition: 'all .2s',
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

      {/* Skills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10, marginBottom: 10 }}>
        {(provider.skills || []).slice(0,3).map(s => (
          <span key={s} style={{ background: 'var(--gray-100)', color: 'var(--gray-600)', padding: '3px 10px', borderRadius: 100, fontSize: 11 }}>{s}</span>
        ))}
      </div>

      {/* Location */}
      {provider.profiles?.zip && (
        <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 10 }}>
          📍 {provider.profiles.zip}
          {provider.service_radius && ` · ${provider.service_radius}mi radius`}
        </div>
      )}

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

const DEFAULT_LAT = 35.1035; // Fort Mill, SC
const DEFAULT_LNG = -80.9420;

export default function MapPage({ providers, onBook, onViewProfile }) {
  const mapRef      = useRef(null);
  const mapInstance = useRef(null);
  const markersRef  = useRef({});
  const userMarker  = useRef(null);

  const [selected,  setSelected]  = useState(null);
  const [search,    setSearch]    = useState('');
  const [userLat,   setUserLat]   = useState(DEFAULT_LAT);
  const [userLng,   setUserLng]   = useState(DEFAULT_LNG);
  const [locating,  setLocating]  = useState(false);
  const [mapLoaded, setMapLoaded] = useState(!!window.L);

  const online = providers.filter(p => p.available !== false);

  const filtered = useMemo(() => search
    ? online.filter(p =>
        (p.profiles?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.skills || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
      )
    : online,
  [online, search]);

  // Providers that have real coordinates
  const mappable = filtered.filter(p => p.lat && p.lng);
  // Providers without coordinates (no zip geocoded yet)
  const unmapped = filtered.filter(p => !p.lat || !p.lng);

  // Load Leaflet
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

  // Auto-locate user on load
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      },
      () => {} // silently fail, use default
    );
  }, []);

  // Init map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstance.current) return;
    const L = window.L;
    mapInstance.current = L.map(mapRef.current, { zoomControl: true }).setView([userLat, userLng], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapInstance.current);
  }, [mapLoaded]);

  // Update user marker when location changes
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return;
    const L = window.L;
    if (userMarker.current) userMarker.current.remove();
    const icon = L.divIcon({
      html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,.6)"></div>`,
      className: '', iconSize: [16,16], iconAnchor: [8,8],
    });
    userMarker.current = L.marker([userLat, userLng], { icon }).addTo(mapInstance.current).bindPopup('📍 You are here');
  }, [mapLoaded, userLat, userLng]);

  // Add/update provider markers
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return;
    const L = window.L;

    // Remove old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    mappable.forEach(p => {
      const name     = p.profiles?.name || 'Provider';
      const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
      const isSelected = selected?.id === p.id;

      const icon = L.divIcon({
        html: `<div style="
          width:42px;height:42px;
          background:${isSelected ? '#22c55e' : '#0f1e3d'};
          border:3px solid white;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          color:white;font-weight:700;font-size:13px;
          box-shadow:0 3px 12px rgba(0,0,0,.3);cursor:pointer;
          font-family:Sora,sans-serif;
          ${isSelected ? 'transform:scale(1.15);' : ''}
          transition:all .2s;
        ">${initials}</div>`,
        className: '', iconSize: [42,42], iconAnchor: [21,21],
      });

      const marker = L.marker([p.lat, p.lng], { icon })
        .addTo(mapInstance.current)
        .bindPopup(`
          <div style="font-family:DM Sans,sans-serif;min-width:180px;padding:4px">
            <div style="font-weight:700;color:#0f1e3d;font-size:15px">${name}</div>
            <div style="font-size:12px;color:#64748b;margin:2px 0">${p.headline || ''}</div>
            ${p.rating > 0 ? `<div style="color:#f59e0b;font-size:13px">★ ${p.rating} (${p.review_count} reviews)</div>` : ''}
            ${p.hourly_rate ? `<div style="font-size:13px;color:#22c55e;font-weight:600;margin-top:4px">$${p.hourly_rate}/hr</div>` : ''}
            <div style="font-size:11px;color:#94a3b8;margin-top:4px">📍 ${p.profiles?.zip || ''}</div>
          </div>
        `)
        .on('click', () => setSelected(p));

      markersRef.current[p.id] = marker;
    });

    // Fit bounds if we have markers
    if (mappable.length > 0 && !selected) {
      const bounds = L.latLngBounds(mappable.map(p => [p.lat, p.lng]));
      bounds.extend([userLat, userLng]);
      mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [mapLoaded, mappable, selected]);

  const locateUser = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLat(latitude);
        setUserLng(longitude);
        mapInstance.current?.setView([latitude, longitude], 12);
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const flyToProvider = (provider) => {
    setSelected(provider);
    if (!mapInstance.current || !provider.lat || !provider.lng) return;
    mapInstance.current.flyTo([provider.lat, provider.lng], 14, { duration: 0.8 });
    markersRef.current[provider.id]?.openPopup();
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--gray-200)', background: 'white', overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--gray-200)' }}>
          <h2 style={{ fontSize: 18, color: 'var(--navy)', marginBottom: 10, fontFamily: 'Sora' }}>
            Providers Near You
          </h2>
          <div className="search-bar">
            <span className="search-icon" style={{ fontSize: 15 }}>🔍</span>
            <input type="text" placeholder="Search providers or skills..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, height: 40, fontSize: 13 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              {mappable.length} on map
              {unmapped.length > 0 && <span style={{ color: 'var(--gray-400)' }}> · {unmapped.length} no location</span>}
            </span>
            <button onClick={locateUser} disabled={locating} style={{ background: 'none', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer', color: 'var(--gray-600)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {locating ? '⏳' : '📍'} {locating ? 'Locating...' : 'My Location'}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
              <p>No providers found.</p>
            </div>
          ) : (
            <>
              {mappable.map(p => (
                <div key={p.id} onClick={() => flyToProvider(p)}>
                  <ProviderCard provider={p} onBook={onBook} onViewProfile={onViewProfile} isSelected={selected?.id === p.id} />
                </div>
              ))}

              {/* Providers without location */}
              {unmapped.length > 0 && (
                <>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', padding: '8px 4px', borderTop: '1px solid var(--gray-100)', marginTop: 4 }}>
                    📍 No location set yet
                  </div>
                  {unmapped.map(p => (
                    <div key={p.id}>
                      <ProviderCard provider={p} onBook={onBook} onViewProfile={onViewProfile} isSelected={selected?.id === p.id} />
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        {!mapLoaded && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 40 }}>🗺️</div>
            <p style={{ color: 'var(--gray-500)' }}>Loading map...</p>
          </div>
        )}

        {/* No providers on map message */}
        {mapLoaded && mappable.length === 0 && (
          <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', background: 'white', borderRadius: 12, padding: '12px 20px', boxShadow: '0 4px 16px rgba(0,0,0,.1)', fontSize: 13, color: 'var(--gray-600)', zIndex: 1000, whiteSpace: 'nowrap' }}>
            📍 No providers have set their location yet
          </div>
        )}
      </div>
    </div>
  );
}
