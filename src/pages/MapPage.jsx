import React, { useState, useEffect, useRef, useMemo } from 'react';

function ProviderCard({ provider, onBook, onViewProfile, isSelected }) {
  const name     = provider?.profiles?.name || 'Provider';
  const url      = provider?.profiles?.avatar_url;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  return (
    <div style={{ padding: 14, borderRadius: 14, border: `2px solid ${isSelected ? 'var(--navy)' : 'var(--gray-200)'}`, background: isSelected ? '#f0f4ff' : 'white', cursor: 'pointer', transition: 'all .2s' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {url ? <img src={url} alt={name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 16 }}>{initials}</div>}
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: '50%', background: provider.available ? 'var(--green)' : 'var(--gray-400)', border: '2px solid white' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--navy)' }}>{name}</div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{provider.headline}</div>
          {provider.rating > 0 && <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 2 }}>★ {provider.rating} ({provider.review_count})</div>}
        </div>
        {provider.hourly_rate && <div style={{ textAlign: 'right', flexShrink: 0 }}><div style={{ fontWeight: 700, color: 'var(--navy)' }}>${provider.hourly_rate}</div><div style={{ fontSize: 10, color: 'var(--gray-400)' }}>/hr</div></div>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, margin: '10px 0' }}>
        {(provider.skills || []).slice(0,3).map(s => <span key={s} style={{ background: 'var(--gray-100)', color: 'var(--gray-600)', padding: '3px 10px', borderRadius: 100, fontSize: 11 }}>{s}</span>)}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onViewProfile(provider.id)} style={{ flex: 1, padding: '7px', borderRadius: 8, border: '1.5px solid var(--gray-200)', background: 'white', cursor: 'pointer', fontSize: 12, color: 'var(--gray-600)' }}>View</button>
        <button onClick={() => onBook(provider.id)} className="btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Book</button>
      </div>
    </div>
  );
}

const DEFAULT_LAT = 35.1035;
const DEFAULT_LNG = -80.9420;

export default function MapPage({ providers, onBook, onViewProfile }) {
  const mapRef      = useRef(null);
  const mapInstance = useRef(null);
  const markersRef  = useRef({});
  const userMarker  = useRef(null);

  const [selected,   setSelected]   = useState(null);
  const [search,     setSearch]     = useState('');
  const [userLat,    setUserLat]    = useState(DEFAULT_LAT);
  const [userLng,    setUserLng]    = useState(DEFAULT_LNG);
  const [locating,   setLocating]   = useState(false);
  const [mapLoaded,  setMapLoaded]  = useState(!!window.L);
  const [mobileView, setMobileView] = useState('map');
  const [isMobile,   setIsMobile]   = useState(window.innerWidth < 768);
  const [vh,         setVh]         = useState(window.innerHeight);

  useEffect(() => {
    const update = () => {
      setIsMobile(window.innerWidth < 768);
      setVh(window.innerHeight);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const online   = providers.filter(p => p.available !== false);
  const filtered = useMemo(() => search
    ? online.filter(p =>
        (p.profiles?.name||'').toLowerCase().includes(search.toLowerCase()) ||
        (p.skills||[]).some(s => s.toLowerCase().includes(search.toLowerCase()))
      )
    : online,
  [online, search]);
  const mappable = filtered.filter(p => p.lat && p.lng);
  const unmapped = filtered.filter(p => !p.lat || !p.lng);

  // navbar=64, bottom tabs=60, toggle=42
  const contentH  = isMobile ? vh - 64 - 60 : vh - 64;
  const mapPanelH = isMobile ? contentH - 42 : contentH;

  // Load Leaflet
  useEffect(() => {
    if (window.L) { setMapLoaded(true); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => setMapLoaded(true);
    document.head.appendChild(s);
  }, []);

  // Get GPS once
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); },
      () => {}
    );
  }, []);

  // Init map — uses explicit pixel height, destroy on unmount
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstance.current) return;
    const L = window.L;
    // Set explicit pixel height on the div BEFORE Leaflet measures it
    mapRef.current.style.height = `${mapPanelH}px`;
    const map = L.map(mapRef.current).setView([userLat, userLng], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19
    }).addTo(map);
    mapInstance.current = map;
    setTimeout(() => map.invalidateSize(), 300);

    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
      markersRef.current = {};
      userMarker.current = null;
    };
  }, [mapLoaded]);

  // Update map div height and invalidate whenever vh or tab changes
  useEffect(() => {
    if (!mapInstance.current) return;
    if (mapRef.current) mapRef.current.style.height = `${mapPanelH}px`;
    if (mobileView === 'map') {
      setTimeout(() => mapInstance.current.invalidateSize(), 200);
    }
  }, [mobileView, mapPanelH]);

  // User dot marker
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return;
    const L = window.L;
    if (userMarker.current) userMarker.current.remove();
    const icon = L.divIcon({
      html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,.6)"></div>`,
      className: '', iconSize: [16,16], iconAnchor: [8,8]
    });
    userMarker.current = L.marker([userLat, userLng], { icon })
      .addTo(mapInstance.current)
      .bindPopup('You are here');
  }, [mapLoaded, userLat, userLng]);

  // Provider markers
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return;
    const L = window.L;
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};
    mappable.forEach(p => {
      const name     = p.profiles?.name || 'P';
      const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
      const bg       = selected?.id === p.id ? '#22c55e' : '#0f1e3d';
      const icon = L.divIcon({
        html: `<div style="width:40px;height:40px;background:${bg};border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px;box-shadow:0 3px 10px rgba(0,0,0,.3);font-family:Sora,sans-serif">${initials}</div>`,
        className: '', iconSize: [40,40], iconAnchor: [20,20]
      });
      markersRef.current[p.id] = L.marker([p.lat, p.lng], { icon })
        .addTo(mapInstance.current)
        .bindPopup(`<div style="font-family:DM Sans,sans-serif;min-width:150px"><b style="color:#0f1e3d">${name}</b><br/><span style="font-size:12px;color:#64748b">${p.headline||''}</span>${p.hourly_rate ? `<br/><b style="color:#22c55e">$${p.hourly_rate}/hr</b>` : ''}</div>`)
        .on('click', () => { setSelected(p); if (isMobile) setMobileView('list'); });
    });
    if (mappable.length > 0 && !selected) {
      const bounds = L.latLngBounds(mappable.map(p => [p.lat, p.lng]));
      bounds.extend([userLat, userLng]);
      mapInstance.current.fitBounds(bounds, { padding: [40,40], maxZoom: 13 });
    }
  }, [mapLoaded, mappable, selected, isMobile]);

  const locateUser = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(pos => {
      setUserLat(pos.coords.latitude);
      setUserLng(pos.coords.longitude);
      mapInstance.current?.setView([pos.coords.latitude, pos.coords.longitude], 12);
      setLocating(false);
    }, () => setLocating(false));
  };

  const flyTo = (p) => {
    setSelected(p);
    if (isMobile) {
      setMobileView('map');
      setTimeout(() => {
        mapInstance.current?.flyTo([p.lat, p.lng], 14, { duration: 0.8 });
        markersRef.current[p.id]?.openPopup();
      }, 250);
    } else {
      mapInstance.current?.flyTo([p.lat, p.lng], 14, { duration: 0.8 });
      markersRef.current[p.id]?.openPopup();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: `${contentH}px`, overflow: 'hidden' }}>

      {/* Mobile Map / Providers Near You toggle */}
      {isMobile && (
        <div style={{ display: 'flex', background: 'var(--navy)', height: 42, flexShrink: 0 }}>
          {[['map', 'Map'], ['list', 'Providers Near You']].map(([k, l]) => (
            <button key={k} onClick={() => setMobileView(k)} style={{
              flex: 1, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: mobileView === k ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: mobileView === k ? 'white' : 'rgba(255,255,255,0.6)',
              borderBottom: mobileView === k ? '3px solid var(--green)' : '3px solid transparent'
            }}>{l}</button>
          ))}
        </div>
      )}

      {/* List panel */}
      {(!isMobile || mobileView === 'list') && (
        <div style={{ width: isMobile ? '100%' : 360, height: `${mapPanelH}px`, display: 'flex', flexDirection: 'column', background: 'white', borderRight: isMobile ? 'none' : '1px solid var(--gray-200)', overflow: 'hidden', flexShrink: 0 }}>
          {!isMobile && (
            <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid var(--gray-200)', flexShrink: 0 }}>
              <h2 style={{ fontSize: 18, color: 'var(--navy)', fontFamily: 'Sora' }}>Providers Near You</h2>
            </div>
          )}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-200)', flexShrink: 0 }}>
            <div className="search-bar">
              <span className="search-icon" style={{ fontSize: 15 }}>🔍</span>
              <input type="text" placeholder="Search providers..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, height: 40, fontSize: 13 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{mappable.length} on map</span>
              <button onClick={locateUser} disabled={locating} style={{ background: 'none', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: 'var(--gray-600)' }}>
                {locating ? 'Locating...' : '📍 My Location'}
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.length === 0
              ? <div className="empty-state" style={{ padding: 32 }}><p>No providers found.</p></div>
              : (
                <>
                  {mappable.map(p => (
                    <div key={p.id} onClick={() => flyTo(p)}>
                      <ProviderCard provider={p} onBook={onBook} onViewProfile={onViewProfile} isSelected={selected?.id === p.id} />
                    </div>
                  ))}
                  {unmapped.length > 0 && (
                    <>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)', padding: '8px 0', borderTop: '1px solid var(--gray-100)' }}>No location set</div>
                      {unmapped.map(p => (
                        <div key={p.id}>
                          <ProviderCard provider={p} onBook={onBook} onViewProfile={onViewProfile} isSelected={false} />
                        </div>
                      ))}
                    </>
                  )}
                </>
              )
            }
          </div>
        </div>
      )}

      {/* Map panel */}
      {(!isMobile || mobileView === 'map') && (
        <div style={{ flex: 1, position: 'relative', height: `${mapPanelH}px` }}>
          {/* Explicit pixel height set here AND imperatively in useEffect */}
          <div ref={mapRef} style={{ width: '100%', height: `${mapPanelH}px` }} />
          {!mapLoaded && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', flexDirection: 'column', gap: 12 }}>
              <p style={{ color: 'var(--gray-500)' }}>Loading map...</p>
            </div>
          )}
          {isMobile && selected && (
            <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
              <button onClick={() => setMobileView('list')} style={{ background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 100, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,.2)' }}>
                View {selected.profiles?.name?.split(' ')[0]} →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
