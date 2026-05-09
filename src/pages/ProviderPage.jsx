import React, { useState, useEffect, useMemo } from 'react';
import { getPendingBookings, getProviderBookings, acceptBooking, updateBookingStatus } from '../lib/db';
import { supabase } from '../lib/supabase';

function StatusBadge({ status }) {
  const map = { Pending: 'badge-yellow', Accepted: 'badge-blue', Completed: 'badge-green', Cancelled: 'badge-red' };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

// ---- Mini bar chart ----
function BarChart({ data, label, color = 'var(--green)' }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 10, fontWeight: 500 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 10, color: 'var(--gray-500)', fontWeight: 600 }}>
              {d.value > 0 ? (label.includes('$') ? `$${d.value}` : d.value) : ''}
            </div>
            <div style={{
              width: '100%', borderRadius: '4px 4px 0 0',
              background: color, opacity: 0.85,
              height: `${Math.max((d.value / max) * 60, d.value > 0 ? 4 : 0)}px`,
              transition: 'height .4s ease', minHeight: d.value > 0 ? 4 : 0,
            }} />
            <div style={{ fontSize: 10, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Booking Calendar ----
function BookingCalendar({ bookings, vacationStart, vacationEnd }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const bookingsByDate = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      if (!b.date) return;
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    });
    return map;
  }, [bookings]);

  const isVacation = (day) => {
    if (!vacationStart || !vacationEnd) return false;
    const d = new Date(year, month, day);
    return d >= new Date(vacationStart) && d <= new Date(vacationEnd);
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const dateStr = (day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const STATUS_COLORS = { Accepted: '#3b82f6', Pending: '#f59e0b', Completed: '#22c55e', Cancelled: '#ef4444' };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} style={{ background: 'none', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 16 }}>‹</button>
        <span style={{ fontWeight: 600, color: 'var(--navy)', fontFamily: 'Sora' }}>{monthName}</span>
        <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} style={{ background: 'none', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 16 }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}

        {/* Days */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const ds       = dateStr(day);
          const dayBookings = bookingsByDate[ds] || [];
          const vacation = isVacation(day);
          const today    = isToday(day);

          return (
            <div key={day} style={{
              minHeight: 52, borderRadius: 8, padding: '4px 6px',
              background: vacation ? '#fef9c3' : today ? '#f0f4ff' : dayBookings.length > 0 ? '#f0fdf4' : 'var(--gray-50)',
              border: `1px solid ${today ? 'var(--navy)' : vacation ? '#fde047' : 'var(--gray-200)'}`,
              position: 'relative',
            }}>
              <div style={{ fontSize: 12, fontWeight: today ? 700 : 400, color: today ? 'var(--navy)' : 'var(--gray-700)' }}>{day}</div>
              {vacation && <div style={{ fontSize: 9, color: '#854d0e' }}>🏖️</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 2 }}>
                {dayBookings.slice(0, 2).map((b, i) => (
                  <div key={i} style={{
                    fontSize: 9, padding: '1px 4px', borderRadius: 3,
                    background: STATUS_COLORS[b.status] || '#94a3b8',
                    color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {b.service?.split(' ')[0]}
                  </div>
                ))}
                {dayBookings.length > 2 && <div style={{ fontSize: 9, color: 'var(--gray-400)' }}>+{dayBookings.length - 2}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
        {[['#3b82f6','Accepted'],['#f59e0b','Pending'],['#22c55e','Completed'],['#fde047','Vacation']].map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--gray-500)' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Main ProviderPage ----
export default function ProviderPage({ userId, profile, providerProfile, onPost, onRefresh }) {
  const [tab,       setTab]       = useState('available');
  const [available, setAvailable] = useState([]);
  const [myJobs,    setMyJobs]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [online,    setOnline]    = useState(providerProfile?.available ?? true);
  const [toggling,  setToggling]  = useState(false);
  const [acting,    setActing]    = useState(null);

  // Vacation settings
  const [vacStart,    setVacStart]    = useState(providerProfile?.vacation_start || '');
  const [vacEnd,      setVacEnd]      = useState(providerProfile?.vacation_end || '');
  const [savingVac,   setSavingVac]   = useState(false);
  const [vacSaved,    setVacSaved]    = useState(false);

  // Auto-reply
  const [autoReply,        setAutoReply]        = useState(providerProfile?.auto_reply || '');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(providerProfile?.auto_reply_enabled || false);
  const [savingReply,      setSavingReply]       = useState(false);
  const [replySaved,       setReplySaved]        = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: pending }, { data: mine }] = await Promise.all([
      getPendingBookings(),
      userId ? getProviderBookings(userId) : { data: [] },
    ]);
    setAvailable(pending || []);
    setMyJobs(mine || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);
  useEffect(() => { setOnline(providerProfile?.available ?? true); }, [providerProfile]);

  const toggleOnline = async () => {
    if (!userId) return;
    setToggling(true);
    const next = !online;
    await supabase.from('providers').update({ available: next }).eq('id', userId);
    setOnline(next);
    if (onRefresh) setTimeout(() => onRefresh(), 500);
    setToggling(false);
  };

  const handleAccept = async (bookingId) => {
    setActing(bookingId);
    await acceptBooking(bookingId, userId);
    setActing(null);
    load();
    if (onRefresh) onRefresh();
  };

  const handleDecline = async (bookingId) => {
    if (!window.confirm('Decline this job?')) return;
    setActing(bookingId);
    await supabase.from('bookings').update({ provider_id: null, status: 'Pending' }).eq('id', bookingId);
    setActing(null);
    load();
  };

  const handleComplete = async (bookingId) => {
    setActing(bookingId);
    await updateBookingStatus(bookingId, 'Completed');
    if (userId) await supabase.from('providers').update({ job_count: (providerProfile?.job_count || 0) + 1 }).eq('id', userId);
    setActing(null);
    load();
  };

  const saveVacation = async () => {
    if (!userId) return;
    setSavingVac(true);
    await supabase.from('providers').update({ vacation_start: vacStart || null, vacation_end: vacEnd || null }).eq('id', userId);
    setSavingVac(false);
    setVacSaved(true);
    setTimeout(() => setVacSaved(false), 2000);
  };

  const clearVacation = async () => {
    setVacStart(''); setVacEnd('');
    await supabase.from('providers').update({ vacation_start: null, vacation_end: null }).eq('id', userId);
  };

  const saveAutoReply = async () => {
    if (!userId) return;
    setSavingReply(true);
    await supabase.from('providers').update({ auto_reply: autoReply, auto_reply_enabled: autoReplyEnabled }).eq('id', userId);
    setSavingReply(false);
    setReplySaved(true);
    setTimeout(() => setReplySaved(false), 2000);
  };

  const activeJobs    = myJobs.filter(b => b.status === 'Accepted');
  const completedJobs = myJobs.filter(b => b.status === 'Completed');

  // ---- EARNINGS DATA ----
  const earningsData = useMemo(() => {
    const now    = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { label: d.toLocaleDateString('en-US', { month: 'short' }), month: d.getMonth(), year: d.getFullYear(), value: 0 };
    });
    completedJobs.forEach(b => {
      if (!b.created_at || !b.price) return;
      const d = new Date(b.created_at);
      const slot = months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
      if (slot) slot.value += b.price;
    });
    return months;
  }, [completedJobs]);

  const jobsData = useMemo(() => {
    const now    = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { label: d.toLocaleDateString('en-US', { month: 'short' }), month: d.getMonth(), year: d.getFullYear(), value: 0 };
    });
    completedJobs.forEach(b => {
      if (!b.created_at) return;
      const d = new Date(b.created_at);
      const slot = months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
      if (slot) slot.value += 1;
    });
    return months;
  }, [completedJobs]);

  const totalEarnings  = completedJobs.reduce((a, b) => a + (b.price || 0), 0);
  const avgJobValue    = completedJobs.length ? (totalEarnings / completedJobs.length).toFixed(0) : 0;
  const thisMonthJobs  = completedJobs.filter(b => b.created_at && new Date(b.created_at).getMonth() === new Date().getMonth()).length;

  const isOnVacation = vacStart && vacEnd && new Date() >= new Date(vacStart) && new Date() <= new Date(vacEnd);

  const TABS = [
    ['available', 'Available Jobs'],
    ['active',    'My Jobs'],
    ['calendar',  'Calendar'],
    ['earnings',  'Earnings'],
    ['tools',     'Tools'],
    ['profile',   'My Profile'],
  ];

  return (
    <div className="section">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, color: 'var(--gray-800)' }}>Provider Dashboard</h2>
          <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>Manage your jobs and earnings</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {providerProfile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: online ? '#f0fdf4' : 'var(--gray-50)', border: `1.5px solid ${online ? '#86efac' : 'var(--gray-200)'}`, borderRadius: 12, padding: '8px 16px', transition: 'all .3s' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: online ? 'var(--green)' : 'var(--gray-400)', boxShadow: online ? '0 0 0 3px rgba(34,197,94,0.2)' : 'none' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: online ? '#15803d' : 'var(--gray-500)' }}>{online ? 'Online' : 'Offline'}</span>
              <div onClick={!toggling ? toggleOnline : undefined} style={{ width: 40, height: 22, borderRadius: 100, background: online ? 'var(--green)' : 'var(--gray-300)', cursor: 'pointer', position: 'relative', transition: 'background .3s' }}>
                <div style={{ position: 'absolute', top: 3, left: online ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left .25s' }} />
              </div>
            </div>
          )}
          <button className="btn-primary" onClick={onPost}>{providerProfile ? '✏️ Edit Profile' : '+ Create Profile'}</button>
        </div>
      </div>

      {/* Vacation / offline banners */}
      {isOnVacation && (
        <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>🏖️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#854d0e' }}>You're on vacation until {new Date(vacEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            <div style={{ fontSize: 13, color: '#a16207' }}>You're hidden from search during this period.</div>
          </div>
          <button onClick={clearVacation} style={{ background: '#854d0e', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}>End Vacation</button>
        </div>
      )}

      {providerProfile && !online && !isOnVacation && (
        <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>😴</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#854d0e' }}>You're offline</div>
            <div style={{ fontSize: 13, color: '#a16207' }}>Toggle online to start receiving jobs.</div>
          </div>
          <button onClick={toggleOnline} style={{ background: '#854d0e', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}>Go Online</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          ['Open Jobs',   available.length,                '📋'],
          ['Active',      activeJobs.length,               '✅'],
          ['Completed',   completedJobs.length,            '🏆'],
          ['Earnings',    `$${totalEarnings.toFixed(0)}`,  '💰'],
        ].map(([label, value, icon]) => (
          <div key={label} style={{ background: 'var(--navy)', borderRadius: 14, padding: '18px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontFamily: 'Sora', fontSize: 20, fontWeight: 700, color: 'white' }}>{value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', whiteSpace: 'nowrap', border: 'none', transition: 'all .2s',
            background: tab === k ? 'var(--navy)' : 'var(--gray-100)',
            color: tab === k ? 'white' : 'var(--gray-600)',
          }}>{l}</button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-500)' }}>Loading...</div>}

      {/* ---- AVAILABLE ---- */}
      {!loading && tab === 'available' && (
        <div>
          {available.length === 0 ? (
            <div className="empty-state"><div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div><p>No open requests right now.</p></div>
          ) : available.map(b => (
            <div key={b.id} className="card" style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: 16 }}>{b.service}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>📅 {b.date} at {b.time} · 📍 {b.zip}</div>
                {b.notes && <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>"{b.notes}"</div>}
              </div>
              {b.price && <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, fontSize: 20, color: 'var(--green)' }}>${b.price}</div><div style={{ fontSize: 11, color: 'var(--gray-400)' }}>est.</div></div>}
              {userId && <button className="btn-primary btn-sm" onClick={() => handleAccept(b.id)} disabled={acting === b.id}>{acting === b.id ? '...' : 'Accept ✓'}</button>}
            </div>
          ))}
        </div>
      )}

      {/* ---- ACTIVE JOBS ---- */}
      {!loading && tab === 'active' && (
        <div>
          {activeJobs.length === 0 ? (
            <div className="empty-state"><p>No active jobs. Accept from Available Jobs.</p></div>
          ) : activeJobs.map(b => (
            <div key={b.id} className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: 16 }}>{b.service}</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>📅 {b.date} at {b.time} · 📍 {b.zip}</div>
                  {b.notes && <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>"{b.notes}"</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <StatusBadge status={b.status} />
                  {b.price && <span style={{ fontWeight: 700, color: 'var(--green)' }}>${b.price}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--gray-100)' }}>
                <button onClick={() => handleComplete(b.id)} disabled={acting === b.id} style={{ background: 'var(--green)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {acting === b.id ? '...' : '✅ Mark Completed'}
                </button>
                <button onClick={() => handleDecline(b.id)} disabled={acting === b.id} style={{ background: 'none', border: '1.5px solid #fca5a5', color: '#ef4444', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- CALENDAR ---- */}
      {!loading && tab === 'calendar' && (
        <div className="card">
          <BookingCalendar bookings={myJobs} vacationStart={vacStart} vacationEnd={vacEnd} />
        </div>
      )}

      {/* ---- EARNINGS ---- */}
      {!loading && tab === 'earnings' && (
        <div>
          {/* Summary cards */}
          <div className="grid-3" style={{ marginBottom: 20 }}>
            {[
              ['Total Earnings',   `$${totalEarnings.toFixed(0)}`, '#22c55e'],
              ['Jobs Completed',   completedJobs.length,           '#3b82f6'],
              ['Avg Job Value',    `$${avgJobValue}`,              '#f59e0b'],
            ].map(([label, value, color]) => (
              <div key={label} style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 14, padding: 20, borderTop: `4px solid ${color}` }}>
                <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--navy)', fontFamily: 'Sora' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid-2">
            <div className="card">
              <BarChart data={earningsData} label="Monthly Earnings ($)" color="#22c55e" />
            </div>
            <div className="card">
              <BarChart data={jobsData} label="Jobs Completed" color="#3b82f6" />
            </div>
          </div>

          {/* Recent completed jobs */}
          <div className="card" style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 16, color: 'var(--gray-800)', marginBottom: 16 }}>Recent Completed Jobs</h3>
            {completedJobs.length === 0 ? (
              <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>No completed jobs yet.</p>
            ) : completedJobs.slice(0, 10).map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--gray-800)' }}>{b.service}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{b.date}</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--green)' }}>{b.price ? `$${b.price}` : '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- TOOLS ---- */}
      {!loading && tab === 'tools' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Vacation Mode */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, background: '#fef9c3', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏖️</div>
              <div>
                <h3 style={{ fontSize: 16, color: 'var(--gray-800)' }}>Vacation Mode</h3>
                <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>Hide yourself from search during time off</p>
              </div>
            </div>
            <div className="grid-2" style={{ marginBottom: 14 }}>
              <div>
                <label>Start Date</label>
                <input type="date" value={vacStart} onChange={e => setVacStart(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label>End Date</label>
                <input type="date" value={vacEnd} onChange={e => setVacEnd(e.target.value)} min={vacStart || new Date().toISOString().split('T')[0]} />
              </div>
            </div>
            {vacStart && vacEnd && (
              <div style={{ fontSize: 13, color: '#854d0e', background: '#fef9c3', padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>
                🏖️ You'll be hidden from {new Date(vacStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(vacEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary btn-sm" onClick={saveVacation} disabled={savingVac || !vacStart || !vacEnd}>
                {savingVac ? 'Saving...' : vacSaved ? '✓ Saved!' : 'Save Dates'}
              </button>
              {(vacStart || vacEnd) && (
                <button onClick={clearVacation} style={{ background: 'none', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', color: 'var(--gray-600)' }}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Auto-Reply */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, background: '#f0fdf4', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💬</div>
              <div>
                <h3 style={{ fontSize: 16, color: 'var(--gray-800)' }}>Auto-Reply Message</h3>
                <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>Sent automatically when someone messages you while you're offline</p>
              </div>
            </div>

            {/* Enable toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, padding: '12px 16px', background: 'var(--gray-50)', borderRadius: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--gray-700)' }}>Enable auto-reply</span>
              <div onClick={() => setAutoReplyEnabled(e => !e)} style={{ width: 44, height: 24, borderRadius: 100, background: autoReplyEnabled ? 'var(--green)' : 'var(--gray-300)', cursor: 'pointer', position: 'relative', transition: 'background .3s' }}>
                <div style={{ position: 'absolute', top: 3, left: autoReplyEnabled ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left .25s' }} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label>Message</label>
              <textarea
                rows={3} style={{ resize: 'none' }}
                placeholder="e.g. Thanks for reaching out! I'm currently offline but will get back to you within a few hours."
                value={autoReply}
                onChange={e => setAutoReply(e.target.value)}
              />
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>Quick suggestions:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {[
                  "Thanks! I'll respond within a few hours.",
                  "Currently unavailable — back tomorrow!",
                  "On vacation, back on [date]. Will reply then!",
                ].map(s => (
                  <span key={s} onClick={() => setAutoReply(s)} style={{ fontSize: 12, padding: '4px 10px', background: 'var(--gray-100)', borderRadius: 100, cursor: 'pointer', color: 'var(--gray-600)' }}>{s}</span>
                ))}
              </div>
            </div>

            <button className="btn-primary btn-sm" onClick={saveAutoReply} disabled={savingReply}>
              {savingReply ? 'Saving...' : replySaved ? '✓ Saved!' : 'Save Auto-Reply'}
            </button>
          </div>

          {/* Service Area Map */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, background: '#eff6ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📍</div>
              <div>
                <h3 style={{ fontSize: 16, color: 'var(--gray-800)' }}>Service Area</h3>
                <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>Your current coverage</p>
              </div>
            </div>
            {providerProfile?.zip ? (
              <div>
                <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div style={{ padding: '12px 16px', background: 'var(--gray-50)', borderRadius: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Base Location</div>
                    <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: 16 }}>📍 {providerProfile.zip}</div>
                  </div>
                  <div style={{ padding: '12px 16px', background: 'var(--gray-50)', borderRadius: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Radius</div>
                    <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: 16 }}>{providerProfile.service_radius || 25} miles</div>
                  </div>
                  {providerProfile.lat && providerProfile.lng && (
                    <div style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: 10 }}>
                      <div style={{ fontSize: 12, color: '#15803d' }}>Map Status</div>
                      <div style={{ fontWeight: 600, color: '#15803d', fontSize: 14 }}>✓ Visible on map</div>
                    </div>
                  )}
                </div>
                <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                  To update your service area, edit your profile and change the zip code or radius slider.
                </p>
                <button className="btn-outline btn-sm" onClick={onPost} style={{ marginTop: 10 }}>Edit Service Area</button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 12 }}>Set your zip code in your profile to appear on the map.</p>
                <button className="btn-primary btn-sm" onClick={onPost}>Set Location</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- PROFILE ---- */}
      {tab === 'profile' && (
        <div className="card">
          {providerProfile ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <h3 style={{ fontSize: 20, color: 'var(--gray-800)' }}>{profile?.name}</h3>
                <span className={`badge ${online ? 'badge-green' : 'badge-gray'}`}>{online ? '● Online' : '○ Offline'}</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6, marginBottom: 12 }}>{providerProfile.bio || 'No bio yet.'}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {(providerProfile.skills || []).map(s => <span key={s} className="badge badge-green">{s}</span>)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                📍 {providerProfile.zip}{providerProfile.hourly_rate && ` · $${providerProfile.hourly_rate}/hr`}{providerProfile.service_radius && ` · ${providerProfile.service_radius}mi radius`}
              </div>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--gray-200)' }}>
                <button className="btn-outline btn-sm" onClick={onPost}>Edit Profile</button>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
              <h3 style={{ marginBottom: 8 }}>No provider profile yet</h3>
              <p style={{ marginBottom: 16, color: 'var(--gray-500)' }}>Create your profile to appear in search and accept jobs.</p>
              <button className="btn-primary" onClick={onPost}>Create Profile</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
