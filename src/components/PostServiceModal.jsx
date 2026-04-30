import React, { useState } from 'react';
import { TAGS } from '../data';
import { upsertProvider } from '../lib/db';

export default function PostServiceModal({ onClose, onSuccess, userId }) {
  const [form, setForm]         = useState({ headline: '', bio: '', zip: '', hourly_rate: '' });
  const [selectedTags, setTags] = useState([]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const u = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleTag = t => setTags(tt => tt.includes(t) ? tt.filter(x => x !== t) : [...tt, t]);

  const handleSubmit = async () => {
    if (!form.headline || selectedTags.length === 0 || !form.zip) {
      setError('Please fill in a headline, at least one skill, and your zip code.');
      return;
    }
    setSaving(true);
    setError('');
    const { data, error: err } = await upsertProvider({
      id:          userId,
      headline:    form.headline,
      bio:         form.bio,
      skills:      selectedTags,
      hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
      zip:         form.zip,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSuccess(data);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, color: 'var(--navy)' }}>Post Your Services</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label>Headline *</label>
            <input type="text" placeholder="e.g. Reliable Handyman & Home Repair" value={form.headline} onChange={e => u('headline', e.target.value)} autoFocus />
          </div>

          <div>
            <label>Skills * (pick all that apply)</label>
            <div className="tag-cloud">
              {TAGS.map(t => (
                <span key={t} className={`tag ${selectedTags.includes(t) ? 'active' : ''}`} onClick={() => toggleTag(t)}>{t}</span>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--green-dark)', marginTop: 4 }}>
                ✓ {selectedTags.length} selected
              </div>
            )}
          </div>

          <div>
            <label>About You</label>
            <textarea rows={4} style={{ resize: 'none' }}
              placeholder="Describe your experience and what you offer..."
              value={form.bio} onChange={e => u('bio', e.target.value)} />
          </div>

          <div className="grid-2">
            <div>
              <label>Zip Code *</label>
              <input type="text" value={form.zip} onChange={e => u('zip', e.target.value)} maxLength={5} placeholder="Service area" />
            </div>
            <div>
              <label>Hourly Rate ($)</label>
              <input type="text" value={form.hourly_rate} onChange={e => u('hourly_rate', e.target.value)} placeholder="e.g. 45" />
            </div>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#991b1b' }}>
              {error}
            </div>
          )}

          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSubmit} disabled={saving}>
            {saving ? 'Publishing...' : 'Publish My Profile →'}
          </button>
        </div>
      </div>
    </div>
  );
}
