import React from 'react';
import { LogoIcon } from './UI';

const NAV_ITEMS = [
  ['home',     'Home'],
  ['customer', 'My Bookings'],
  ['provider', 'Providers'],
  ['admin',    'Admin'],
];

export default function Navbar({ page, setPage, onBook }) {
  return (
    <nav className="nav">
      <div className="nav-logo" onClick={() => setPage('home')}>
        <LogoIcon />
        Volun<span>teer</span>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {NAV_ITEMS.map(([key, label]) => (
          <button
            key={key}
            className={`nav-tab ${page === key ? 'active' : ''}`}
            onClick={() => setPage(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <button className="btn-primary btn-sm" onClick={onBook}>
        Book Now
      </button>
    </nav>
  );
}
