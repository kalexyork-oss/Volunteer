import React, { useEffect } from 'react';
import { AVATAR_COLORS } from '../data';

// ---- Avatar ----
export function Avatar({ name, idx = 0, size = 40 }) {
  const bg = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Sora', fontWeight: 700, fontSize: size * 0.35,
      color: 'white', flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ---- Star Rating ----
export function Stars({ rating }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? '#f59e0b' : '#e2e8f0', fontSize: 14 }}>★</span>
      ))}
      <span style={{ fontSize: 13, color: '#64748b', marginLeft: 4, fontWeight: 500 }}>{rating}</span>
    </span>
  );
}

// ---- Status Badge ----
export function StatusBadge({ status }) {
  const map = { Pending: 'badge-yellow', Accepted: 'badge-blue', Completed: 'badge-green', Cancelled: 'badge-red' };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

// ---- Toast Notification ----
export function Toast({ msg, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return <div className="toast">{msg}</div>;
}

// ---- Logo SVG ----
export function LogoIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="14" fill="rgba(34,197,94,0.2)" />
      <path d="M8 14.5l4 4 8-8" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
