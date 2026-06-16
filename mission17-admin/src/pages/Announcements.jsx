import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Plus, Pin, Trash2, Edit3, X } from 'lucide-react';
import { endpoints } from '../config/api';
import { useNotification } from '../context/NotificationContext';
import '../styles/PortalAdmin.css';

const CATEGORIES = ['general', 'health', 'safety', 'environment', 'events', 'services'];
const CAT_LABELS = {
  general: 'General', health: 'Health', safety: 'Safety & Security',
  environment: 'Environment', events: 'Events', services: 'Services',
};
const CAT_COLORS = {
  general: { bg: '#dcfce7', text: '#16a34a' },
  health:  { bg: '#e0f2fe', text: '#0891b2' },
  safety:  { bg: '#fee2e2', text: '#dc2626' },
  environment: { bg: '#dcfce7', text: '#15803d' },
  events:  { bg: '#ede9fe', text: '#7c3aed' },
  services:{ bg: '#fef3c7', text: '#b45309' },
};

const Announcements = () => {
  const { showNotification } = useNotification();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [form, setForm] = useState({ title: '', body: '', category: 'general', isPinned: false, image: '' });

  const token   = localStorage.getItem('token');
  const baseUrl = endpoints.auth.backendBaseUrl;

  const fetchData = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/announcements`);
      if (res.ok) setAnnouncements(await res.json());
    } catch { showNotification('Failed to load announcements.', 'error'); }
    finally   { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ title: '', body: '', category: 'general', isPinned: false, image: '' });
    setEditItem(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return showNotification('Title and body are required.', 'error');
    setSubmitting(true);
    try {
      const url    = editItem ? `${baseUrl}/api/announcements/${editItem._id}` : `${baseUrl}/api/announcements`;
      const method = editItem ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'auth-token': token },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showNotification(editItem ? 'Announcement updated.' : 'Announcement posted!', 'success');
        fetchData();
        resetForm();
      } else {
        const d = await res.json();
        showNotification(d.message || 'Failed.', 'error');
      }
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    const res = await fetch(`${baseUrl}/api/announcements/${id}`, { method: 'DELETE', headers: { 'auth-token': token } });
    if (res.ok) { showNotification('Deleted.', 'success'); fetchData(); }
  };

  const handlePin = async (id) => {
    await fetch(`${baseUrl}/api/announcements/${id}/pin`, { method: 'PATCH', headers: { 'auth-token': token } });
    fetchData();
  };

  const startEdit = (item) => {
    setEditItem(item);
    setForm({ title: item.title, body: item.body, category: item.category, isPinned: item.isPinned, image: item.image || '' });
    setShowForm(true);
  };

  const filtered = filterCat === 'all'
    ? announcements
    : announcements.filter(a => a.category === filterCat);

  return (
    <Layout title="Announcements">
      <div className="pa-page">

        {/* ── HEADER ── */}
        <div className="pa-header">
          <div className="pa-header-left">
            <h1>📢 Announcements</h1>
            <p>Post and manage official Barangay Pantal announcements for residents.</p>
          </div>
          <button className="pa-btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus size={16} /> New Announcement
          </button>
        </div>

        {/* ── FORM ── */}
        {showForm && (
          <div className="pa-form-card">
            <div className="pa-form-header">
              <h3 className="pa-form-title">{editItem ? '✏️ Edit Announcement' : '✨ New Announcement'}</h3>
              <button className="pa-btn-icon" onClick={resetForm}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="pa-form-grid">
                <div className="pa-form-group">
                  <label className="pa-label">Title *</label>
                  <input className="pa-input" placeholder="Announcement title..." value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="pa-form-group">
                  <label className="pa-label">Category</label>
                  <select className="pa-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                  </select>
                </div>
                <div className="pa-form-group full">
                  <label className="pa-label">Body *</label>
                  <textarea className="pa-input pa-textarea" placeholder="Announcement content..."
                    value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required />
                </div>
                <div className="pa-form-group full">
                  <label className="pa-label">Cover Image URL <span style={{fontWeight:400,color:'#94a3b8'}}>(optional — leave blank for auto-category image)</span></label>
                  <input className="pa-input" placeholder="https://images.unsplash.com/..."
                    value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} />
                  {form.image && (
                    <img src={form.image} alt="preview"
                      style={{ marginTop: 8, height: 80, borderRadius: 10, objectFit: 'cover', maxWidth: 200, border: '2px solid #e2e8f0' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  )}
                </div>
              </div>
              <div className="pa-checkbox-row">
                <input type="checkbox" id="pin" checked={form.isPinned} onChange={e => setForm({ ...form, isPinned: e.target.checked })} />
                <label className="pa-checkbox-label" htmlFor="pin">📌 Pin to top (visible to all residents first)</label>
              </div>
              <div className="pa-form-actions">
                <button type="submit" className="pa-btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : (editItem ? 'Update' : 'Post Announcement')}
                </button>
                <button type="button" className="pa-btn-secondary" onClick={resetForm}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* ── FILTER ── */}
        <div className="pa-filter-bar">
          <div className="pa-filter-chips">
            <button className={`pa-chip ${filterCat === 'all' ? 'active' : ''}`} onClick={() => setFilterCat('all')}>All</button>
            {CATEGORIES.map(c => (
              <button key={c} className={`pa-chip ${filterCat === c ? 'active' : ''}`} onClick={() => setFilterCat(c)}>
                {CAT_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        <p className="pa-count">{filtered.length} announcement{filtered.length !== 1 ? 's' : ''}</p>

        {/* ── LIST ── */}
        {loading ? (
          <div className="pa-list">
            {[1,2,3].map(i => <div key={i} className="pa-skeleton-row" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="pa-empty">
            <div className="pa-empty-icon" style={{ fontSize: 52 }}>📢</div>
            <h3>No announcements {filterCat !== 'all' ? 'in this category' : 'yet'}.</h3>
            <p>Click "New Announcement" to post the first update for residents.</p>
          </div>
        ) : (
          <div className="pa-list">
            {filtered.map(ann => {
              const cat   = CAT_COLORS[ann.category] || CAT_COLORS.general;
              const catLbl = CAT_LABELS[ann.category] || ann.category;
              return (
                <div key={ann._id} className={`pa-card ${ann.isPinned ? 'pinned' : ''}`}>
                  <div className="pa-card-row">
                    {ann.image && (
                      <img src={ann.image} alt="cover"
                        style={{ width: 80, height: 64, objectFit: 'cover', borderRadius: 10, marginRight: 16, flexShrink: 0 }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      {ann.isPinned && <span style={{ fontSize: 11, fontWeight: 800, color: '#b45309', display: 'block', marginBottom: 6 }}>📌 PINNED</span>}
                      <div className="pa-card-meta">
                        <span className="pa-badge" style={{ backgroundColor: cat.bg, color: cat.text }}>{catLbl}</span>
                        <span className="pa-card-footer" style={{ marginTop: 0 }}>
                          {new Date(ann.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="pa-card-title">{ann.title}</p>
                      <p className="pa-card-body">{ann.body.length > 120 ? ann.body.slice(0,120) + '…' : ann.body}</p>
                      <p className="pa-card-footer">Posted by {ann.postedBy}</p>
                    </div>
                    <div className="pa-card-actions">
                      <button className={`pa-btn-icon ${ann.isPinned ? 'amber' : ''}`} title="Toggle pin" onClick={() => handlePin(ann._id)}>
                        <Pin size={16} />
                      </button>
                      <button className="pa-btn-icon blue" onClick={() => startEdit(ann)}><Edit3 size={16} /></button>
                      <button className="pa-btn-icon red" onClick={() => handleDelete(ann._id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Announcements;
