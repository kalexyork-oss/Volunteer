import React, { useState, useRef } from 'react';
import { TAGS } from '../data';
import { upsertProvider, uploadAvatar, updateProfile } from '../lib/db';
import { supabase } from '../lib/supabase';

const DAYS = ['mon','tue','wed','thu','fri','sat','sun'];
const DAY_LABELS = { mon:'Mon', tue:'Tue', wed:'Wed', thu:'Thu', fri:'Fri', sat:'Sat', sun:'Sun' };
const RESPONSE_OPTIONS = ['Within an hour', 'Within a few hours', 'Within a day', 'Within a few days'];
const CERT_SUGGESTIONS = ['Licensed & Insured','Background Checked','10+ Years Experience','Free Estimates','Same-Day Available','Veteran Owned','Bilingual (Spanish)','EPA Certified'];

export default function PostServiceModal({ onClose, onSuccess, userId, existing }) {
  const [form, setForm] = useState({
    headline:       existing?.headline || '',
    bio:            existing?.bio || '',
    zip:            existing?.zip || existing?.profiles?.zip || '',
    hourly_rate:    existing?.hourly_rate || '',
    service_radius: existing?.service_radius || 25,
    response_time:  existing?.response_time || 'Within a few hours',
    custom_slug:    existing?.custom_slug || '',
  });
  const [selectedTags,    setTags]    = useState(existing?.skills || []);
  const [availability,    setAvail]   = useState(existing?.availability || { mon:true, tue:true, wed:true, thu:true, fri:true, sat:false, sun:false });
  const [certifications,  setCerts]   = useState(existing?.certifications || []);
  const [certInput,       setCertInput] = useState('');
  const [avatarFile,      setAvatarFile] = useState(null);
  const [avatarPreview,   setAvatarPreview] = useState(existing?.profiles?.avatar_url || null);
  const [portfolioFiles,  setPortfolioFiles] = useState([]);
  const [portfolioPreviews, setPortfolioPreviews] = useState(existing?.portfolio_urls || []);
  const [saving,          setSaving]  = useState(false);
  const [error,           setError]   = useState('');
  const [tab,             setTab]     = useState('basics');
  const avatarRef    = useRef();
  const portfolioRef = useRef();

  const u = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleTag  = t  => setTags(tt => tt.includes(t) ? tt.filter(x => x !== t) : [...tt, t]);
  const toggleDay  = d  => setAvail(a => ({ ...a, [d]: !a[d] }));
  const addCert    = c  => { if (c && !certifications.includes(c)) { setCerts(cc => [...cc, c]); setCertInput(''); } };
  const removeCert = c  => setCerts(cc => cc.filter(x => x !== c));

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handlePortfolioChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 6 - portfolioPreviews.length);
    const previews = files.map(f => URL.createObjectURL(f));
    setPortfolioFiles(pf => [...pf, ...files]);
    setPortfolioPreviews(pp => [...pp, ...previews]);
  };

  const removePortfolio = (i) => {
    setPortfolioPreviews(pp => pp.filter((_, idx) => idx !== i));
    setPortfolioFiles(pf => pf.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!form.headline || selectedTags.length === 0 || !form.zip) {
      setError('Headline, at least one skill, and zip code are required.');
      return;
    }
    setSaving(true);
    setError('');

    // Upload avatar
    let avatarUrl = existing?.profiles?.avatar_url || null;
    if (avatarFile) {
      const { url, error: uploadErr } = await uploadAvatar(userId, avatarFile);
      if (uploadErr) { setError('Avatar upload failed: ' + uploadErr.message); setSaving(false); return; }
      avatarUrl = url;
      await updateProfile(userId, { avatar_url: avatarUrl });
    }

    // Upload portfolio images
    let portfolioUrls = portfolioPreviews.filter(p => p.startsWith('http'));
    for (const file of portfolioFiles) {
      const path = `${userId}/portfolio_${Date.now()}_${file.name}`;
      const { error: pErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (!pErr) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        portfolioUrls.push(data.publicUrl);
      }
    }

    const { data, error: err } = await upsertProvider({
      id:             userId,
      headline:       form.headline,
      bio:            form.bio,
      skills:         selectedTags,
      hourly_rate:    form.hourly_rate ? parseFloat(form.hourly_rate) : null,
      zip:            form.zip,
      service_radius: parseInt(form.service_radius),
      response_time:  form.response_time,
      custom_slug:    form.custom_slug || null,
      availability,
      certifications,
      portfolio_urls: portfolioUrls,
      available:      true,
    });

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSuccess(data);
    onClose();
  };

  const TABS = [['basics','Basics'],['skills','Skills'],['availability','Availability'],['portfolio','Portfolio'],['advanced','Advanced']];

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 580 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, color: 'var(--navy)' }}>{existing ? 'Edit Profile' : 'Create Provider Profile'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
          {TABS.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
              background: tab === k ? 'var(--navy)' : 'var(--gray-100)',
              color: tab === k ? 'white' : 'var(--gray-600)',
              border: 'none', transition: 'all .2s',
            }}>{l}</button>
          ))}
        </div>

        {/* ---- BASICS ---- */}
        {tab === 'basics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 24 }}>
                    👤
                  </div>
                )}
                <button onClick={() => avatarRef.current.click()} style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: 'var(--green)', border: '2px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✏️</button>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--navy)' }}>Profile Photo</div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>JPG or PNG, square looks best</div>
                <button onClick={() => avatarRef.current.click()} style={{ marginTop: 6, background: 'none', border: '1.5px solid var(--gray-200)', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer', color: 'var(--gray-600)' }}>
                  Upload Photo
                </button>
              </div>
              <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </div>

            <div><label>Headline *</label><input type="text" placeholder="e.g. Reliable Handyman & Home Repair" value={form.headline} onChange={e => u('headline', e.target.value)} /></div>
            <div><label>About You</label><textarea rows={4} style={{ resize: 'none' }} placeholder="Describe your experience, what you offer, and why customers should choose you..." value={form.bio} onChange={e => u('bio', e.target.value)} /></div>
            <div className="grid-2">
              <div><label>Zip Code *</label><input type="text" value={form.zip} onChange={e => u('zip', e.target.value)} maxLength={5} placeholder="Service area" /></div>
              <div><label>Hourly Rate ($)</label><input type="text" value={form.hourly_rate} onChange={e => u('hourly_rate', e.target.value)} placeholder="e.g. 45" /></div>
            </div>
          </div>
        )}

        {/* ---- SKILLS ---- */}
        {tab === 'skills' && (
          <div>
            <label>Select all services you offer *</label>
            <div className="tag-cloud">
              {TAGS.map(t => (
                <span key={t} className={`tag ${selectedTags.includes(t) ? 'active' : ''}`} onClick={() => toggleTag(t)}>{t}</span>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <div style={{ marginTop: 12, padding: 12, background: 'var(--gray-50)', borderRadius: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--green-dark)', fontWeight: 600, marginBottom: 8 }}>✓ {selectedTags.length} selected</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedTags.map(t => <span key={t} className="badge badge-green" style={{ cursor: 'pointer' }} onClick={() => toggleTag(t)}>{t} ×</span>)}
                </div>
              </div>
            )}

            {/* Certifications */}
            <div style={{ marginTop: 20 }}>
              <label>Certifications & Badges</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input type="text" placeholder="Add a certification..." value={certInput} onChange={e => setCertInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCert(certInput)} />
                <button className="btn-primary btn-sm" onClick={() => addCert(certInput)} style={{ flexShrink: 0 }}>Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {CERT_SUGGESTIONS.map(c => (
                  <span key={c} onClick={() => addCert(c)} style={{ fontSize: 12, padding: '4px 10px', background: 'var(--gray-100)', borderRadius: 100, cursor: 'pointer', color: 'var(--gray-600)' }}>{c}</span>
                ))}
              </div>
              {certifications.map(c => (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 14 }}>✅</span>
                  <span style={{ flex: 1, fontSize: 13, color: '#15803d' }}>{c}</span>
                  <button onClick={() => removeCert(c)} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- AVAILABILITY ---- */}
        {tab === 'availability' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label>Which days are you available?</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {DAYS.map(d => (
                  <div key={d} onClick={() => toggleDay(d)} style={{
                    width: 52, height: 52, borderRadius: 12, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    background: availability[d] ? 'var(--navy)' : 'var(--gray-100)',
                    color: availability[d] ? 'white' : 'var(--gray-400)',
                    transition: 'all .2s', border: '2px solid transparent',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{DAY_LABELS[d]}</span>
                    <span style={{ fontSize: 14 }}>{availability[d] ? '✓' : ''}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label>Response Time</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                {RESPONSE_OPTIONS.map(opt => (
                  <div key={opt} onClick={() => u('response_time', opt)} style={{
                    padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${form.response_time === opt ? 'var(--navy)' : 'var(--gray-200)'}`,
                    background: form.response_time === opt ? 'var(--navy)' : 'white',
                    color: form.response_time === opt ? 'white' : 'var(--gray-700)',
                    fontSize: 14, transition: 'all .2s',
                  }}>
                    ⚡ {opt}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label>Service Radius (miles)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                <input type="range" min="5" max="100" step="5" value={form.service_radius} onChange={e => u('service_radius', e.target.value)} style={{ flex: 1 }} />
                <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--navy)', minWidth: 60 }}>{form.service_radius} mi</span>
              </div>
            </div>
          </div>
        )}

        {/* ---- PORTFOLIO ---- */}
        {tab === 'portfolio' && (
          <div>
            <label>Portfolio Photos (up to 6)</label>
            <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 12 }}>Show your past work. Before & after photos work great!</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {portfolioPreviews.map((url, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 12, overflow: 'hidden' }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => removePortfolio(i)} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,.6)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ))}
              {portfolioPreviews.length < 6 && (
                <div onClick={() => portfolioRef.current.click()} style={{ aspectRatio: '1', borderRadius: 12, border: '2px dashed var(--gray-200)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--gray-50)', transition: 'all .2s' }}
                  onMouseOver={e => e.currentTarget.style.borderColor='var(--navy)'}
                  onMouseOut={e => e.currentTarget.style.borderColor='var(--gray-200)'}
                >
                  <span style={{ fontSize: 28, marginBottom: 4 }}>📷</span>
                  <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Add photo</span>
                </div>
              )}
            </div>
            <input ref={portfolioRef} type="file" accept="image/*" multiple onChange={handlePortfolioChange} style={{ display: 'none' }} />
          </div>
        )}

        {/* ---- ADVANCED ---- */}
        {tab === 'advanced' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label>Custom Profile URL</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <span style={{ padding: '10px 12px', background: 'var(--gray-100)', border: '1.5px solid var(--gray-200)', borderRight: 'none', borderRadius: '10px 0 0 10px', fontSize: 13, color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>
                  /profile/
                </span>
                <input type="text" placeholder="your-name" value={form.custom_slug} onChange={e => u('custom_slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} style={{ borderRadius: '0 10px 10px 0' }} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>Only letters, numbers, and hyphens. E.g. "marcus-rivera"</p>
            </div>
          </div>
        )}

        {error && <div style={{ marginTop: 16, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#991b1b' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button className="btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : existing ? 'Save Changes' : 'Publish Profile →'}
          </button>
        </div>
      </div>
    </div>
  );
}
