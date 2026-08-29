import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { Plus, Pin, Trash2, Edit3, X, Link as LinkIcon, Upload, Loader, AlertTriangle, Flame, BellRing, Tag, Leaf } from 'lucide-react';
import { endpoints } from '../config/api';

import { useNotification } from '../context/NotificationContext';
import '../styles/PortalAdmin.css';

const DEFAULT_CATEGORIES = ['general', 'health', 'safety', 'environment', 'events', 'services'];
const CAT_LABELS = {
  general: 'General', health: 'Health', safety: 'Safety & Security',
  environment: 'Environment', events: 'Events', services: 'Services',
  urgent: 'Emergency / Urgent'
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
  const [categories, setCategories]       = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading]             = useState(true);
  const [showForm, setShowForm]           = useState(false);
  const [editItem, setEditItem]           = useState(null);
  const [submitting, setSubmitting]       = useState(false);
  const [filterCat, setFilterCat]         = useState('all');
  const [isCustomCat, setIsCustomCat]     = useState(false);
  const [customCatInput, setCustomCatInput] = useState('');
  const [form, setForm] = useState({ title: '', body: '', category: 'general', isPinned: false, isUrgent: false, image: '' });
  const [imageMode, setImageMode] = useState('url'); // 'url' | 'upload'
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const token   = localStorage.getItem('token');
  const baseUrl = endpoints.auth.backendBaseUrl;

  const fetchData = async () => {
    try {
      const [annRes, catRes] = await Promise.all([
        fetch(`${baseUrl}/api/announcements`),
        fetch(`${baseUrl}/api/announcements/categories`).catch(() => null)
      ]);

      if (annRes.ok) {
        const data = await annRes.json();
        setAnnouncements(data);

        // Derive dynamic categories from data
        if (catRes && catRes.ok) {
          const cats = await catRes.json();
          setCategories(Array.from(new Set([...DEFAULT_CATEGORIES, ...cats])));
        } else {
          const derived = Array.from(new Set([...DEFAULT_CATEGORIES, ...data.map(d => d.category?.toLowerCase()).filter(Boolean)]));
          setCategories(derived);
        }
      }
    } catch { showNotification('Failed to load announcements.', 'error'); }
    finally   { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ title: '', body: '', category: 'general', isPinned: false, isUrgent: false, relatedSdg: null, image: '' });
    setEditItem(null);
    setShowForm(false);
    setIsCustomCat(false);
    setCustomCatInput('');
    setImageMode('url');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('image', file);
    setUploading(true);
    try {
      const res = await fetch(`${endpoints.auth.baseUrl}/upload`, {
        method: 'POST',
        headers: { 'auth-token': token },
        body: uploadData,
      });
      const data = await res.json();
      if (res.ok) {
        setForm(prev => ({ ...prev, image: data.url }));
        showNotification('Image uploaded successfully!', 'success');
      } else {
        showNotification(data.message || 'Upload failed.', 'error');
      }
    } catch {
      showNotification('Network error during upload.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return showNotification('Title and body are required.', 'error');
    
    const finalCategory = isCustomCat && customCatInput.trim() 
      ? customCatInput.trim().toLowerCase()
      : form.category;

    setSubmitting(true);
    try {
      const url    = editItem ? `${baseUrl}/api/announcements/${editItem._id}` : `${baseUrl}/api/announcements`;
      const method = editItem ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'auth-token': token },
        body: JSON.stringify({ ...form, category: finalCategory }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showNotification(data.message || (editItem ? 'Announcement updated.' : 'Announcement posted!'), 'success');
        fetchData();
        resetForm();
      } else {
        showNotification(data.message || 'Failed to save announcement.', 'error');
      }
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    const res = await fetch(`${baseUrl}/api/announcements/${id}`, { method: 'DELETE', headers: { 'auth-token': token } });
    if (res.ok) { showNotification('Announcement deleted.', 'success'); fetchData(); }
  };

  const handlePin = async (id) => {
    await fetch(`${baseUrl}/api/announcements/${id}/pin`, { method: 'PATCH', headers: { 'auth-token': token } });
    fetchData();
  };

  const startEdit = (item) => {
    setEditItem(item);
    const isCustom = !DEFAULT_CATEGORIES.includes(item.category?.toLowerCase());
    setIsCustomCat(isCustom);
    if (isCustom) setCustomCatInput(item.category);
    setForm({
      title: item.title,
      body: item.body,
      category: item.category,
      isPinned: item.isPinned,
      isUrgent: item.isUrgent || false,
      relatedSdg: item.relatedSdg || null,
      image: item.image || ''
    });
    setShowForm(true);
  };


  const filtered = filterCat === 'all'
    ? announcements
    : announcements.filter(a => a.category?.toLowerCase() === filterCat.toLowerCase());

  return (
    <Layout title="Announcements">
      <div className="pa-page">

        {/* ── HEADER ── */}
        <div className="pa-header">
          <div className="pa-header-left">
            <h1>📢 Announcements & Alerts</h1>
            <p>Publish bulletins, manage dynamic categories, and broadcast urgent emergency alerts to residents.</p>
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
                <div className="pa-form-group full">
                  <label className="pa-label">Title *</label>
                  <input className="pa-input" placeholder="e.g. Notice: Severe Weather & Flood Advisory / Libreng Bakuna" value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>

                <div className="pa-form-group">
                  <label className="pa-label">Category</label>
                  {!isCustomCat ? (
                    <select
                      className="pa-input"
                      value={form.category}
                      onChange={e => {
                        if (e.target.value === '__custom__') {
                          setIsCustomCat(true);
                        } else {
                          setForm({ ...form, category: e.target.value });
                        }
                      }}
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>
                          {CAT_LABELS[c] || c.charAt(0).toUpperCase() + c.slice(1)}
                        </option>
                      ))}
                      <option value="__custom__">➕ + Add New Custom Category...</option>
                    </select>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        className="pa-input"
                        autoFocus
                        placeholder="Type new category (e.g. Disaster & Weather, Scholarships)..."
                        value={customCatInput}
                        onChange={e => setCustomCatInput(e.target.value)}
                      />
                      <button
                        type="button"
                        style={{ padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: 8, background: '#f8fafc', fontSize: 12, cursor: 'pointer' }}
                        onClick={() => setIsCustomCat(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* ── URGENT EMERGENCY ALERT TOGGLE ── */}
                <div className="pa-form-group full" style={{
                  padding: '14px 16px',
                  backgroundColor: form.isUrgent ? '#fef2f2' : '#f8fafc',
                  borderRadius: 12,
                  border: form.isUrgent ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                  marginTop: 4
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        backgroundColor: form.isUrgent ? '#fee2e2' : '#e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <AlertTriangle size={18} color={form.isUrgent ? '#dc2626' : '#64748b'} />
                      </div>
                      <div>
                        <strong style={{ fontSize: 14, color: form.isUrgent ? '#991b1b' : '#334155' }}>
                          🚨 Urgent Emergency Broadcast Alert (Floods, Brownouts, Evacuation)
                        </strong>
                        <p style={{ margin: 0, fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          Sends a high-priority lock-screen notification to every resident's phone immediately upon posting.
                        </p>
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6 }}>
                      <input
                        type="checkbox"
                        style={{ width: 18, height: 18, accentColor: '#dc2626' }}
                        checked={form.isUrgent}
                        onChange={e => setForm({ ...form, isUrgent: e.target.checked })}
                      />
                      <span style={{ fontSize: 13, fontWeight: 700, color: form.isUrgent ? '#dc2626' : '#475569' }}>
                        {form.isUrgent ? 'URGENT ENABLED' : 'Enable Alert'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* ── SDG GOAL LINKAGE ── */}
                <div className="pa-form-group full" style={{
                  padding: '14px 16px',
                  backgroundColor: form.relatedSdg ? '#f0fdf4' : '#f8fafc',
                  borderRadius: 12,
                  border: form.relatedSdg ? '1.5px solid #22c55e' : '1px solid #e2e8f0',
                  marginTop: 4
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        backgroundColor: form.relatedSdg ? '#dcfce7' : '#e2e8f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Tag size={18} color={form.relatedSdg ? '#15803d' : '#64748b'} />
                      </div>
                      <div>
                        <strong style={{ fontSize: 14, color: form.relatedSdg ? '#166534' : '#334155' }}>
                          🌱 Link to Green Initiative / SDG Action Program
                        </strong>
                        <p style={{ margin: 0, fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          Connect this bulletin to an SDG so residents can tap to join and submit proof.
                        </p>
                      </div>
                    </div>
                    <select
                      className="pa-input"
                      style={{ width: 'auto', minWidth: 220, fontWeight: 700, borderColor: form.relatedSdg ? '#22c55e' : '#cbd5e1' }}
                      value={form.relatedSdg || ''}
                      onChange={e => setForm({ ...form, relatedSdg: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">No SDG Linked</option>
                      <option value="13">SDG 13: Climate Action (Clean-up, Tree Planting)</option>
                      <option value="15">SDG 15: Life on Land (Reforestation, Greenery)</option>
                      <option value="12">SDG 12: Responsible Consumption (Recycling, Waste)</option>
                      <option value="3">SDG 3: Good Health & Well-being (Medical, Blood Drive)</option>
                      <option value="6">SDG 6: Clean Water & Sanitation</option>
                      <option value="11">SDG 11: Sustainable Cities & Communities</option>
                      <option value="4">SDG 4: Quality Education (Youth & Tutorials)</option>
                    </select>
                  </div>
                </div>

                <div className="pa-form-group full">
                  <label className="pa-label">Body *</label>
                  <textarea className="pa-input pa-textarea" placeholder="Detailed announcement advisory or instructions for residents..."
                    value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required />
                </div>


                <div className="pa-form-group full">
                  <label className="pa-label">
                    Cover Image
                    <span style={{fontWeight:400,color:'#94a3b8',marginLeft:6}}>(optional)</span>
                  </label>

                  {/* ── IMAGE MODE TOGGLE ── */}
                  <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                    <button
                      type="button"
                      onClick={() => { setImageMode('url'); }}
                      style={{
                        display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
                        borderRadius:8, border:'1.5px solid', cursor:'pointer', fontSize:13, fontWeight:600,
                        backgroundColor: imageMode === 'url' ? '#0038A8' : '#f1f5f9',
                        color: imageMode === 'url' ? 'white' : '#64748b',
                        borderColor: imageMode === 'url' ? '#0038A8' : '#e2e8f0',
                      }}
                    >
                      <LinkIcon size={14} /> URL
                    </button>
                    <button
                      type="button"
                      onClick={() => { setImageMode('upload'); fileInputRef.current?.click(); }}
                      style={{
                        display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
                        borderRadius:8, border:'1.5px solid', cursor:'pointer', fontSize:13, fontWeight:600,
                        backgroundColor: imageMode === 'upload' ? '#0038A8' : '#f1f5f9',
                        color: imageMode === 'upload' ? 'white' : '#64748b',
                        borderColor: imageMode === 'upload' ? '#0038A8' : '#e2e8f0',
                      }}
                    >
                      {uploading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
                      {uploading ? 'Uploading...' : 'Upload File'}
                    </button>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />

                  {/* URL Input (shown when mode = url) */}
                  {imageMode === 'url' && (
                    <input
                      className="pa-input"
                      placeholder="https://images.unsplash.com/..."
                      value={form.image}
                      onChange={e => setForm({ ...form, image: e.target.value })}
                    />
                  )}

                  {/* Preview */}
                  {form.image && (
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:10 }}>
                      <img
                        src={form.image}
                        alt="preview"
                        style={{ height:80, borderRadius:10, objectFit:'cover', maxWidth:220, border:'2px solid #e2e8f0' }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, image: '' }))}
                        style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', fontSize:12, fontWeight:600, padding:'4px 8px' }}
                      >
                        ✕ Remove
                      </button>
                    </div>
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

        {/* ── DYNAMIC FILTER BAR ── */}
        <div className="pa-filter-bar">
          <div className="pa-filter-chips">
            <button className={`pa-chip ${filterCat === 'all' ? 'active' : ''}`} onClick={() => setFilterCat('all')}>All</button>
            {categories.map(c => (
              <button key={c} className={`pa-chip ${filterCat === c ? 'active' : ''}`} onClick={() => setFilterCat(c)}>
                {CAT_LABELS[c] || c.charAt(0).toUpperCase() + c.slice(1)}
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
              const catKey = ann.category?.toLowerCase() || 'general';
              const cat    = CAT_COLORS[catKey] || { bg: '#f1f5f9', text: '#475569' };
              const catLbl = CAT_LABELS[catKey] || ann.category?.charAt(0).toUpperCase() + ann.category?.slice(1);
              return (
                <div key={ann._id} className={`pa-card ${ann.isPinned ? 'pinned' : ''}`} style={ann.isUrgent ? { borderLeft: '4px solid #dc2626', backgroundColor: '#fffbfb' } : {}}>
                  <div className="pa-card-row">
                    {ann.image && (
                      <img src={ann.image} alt="cover"
                        style={{ width: 80, height: 64, objectFit: 'cover', borderRadius: 10, marginRight: 16, flexShrink: 0 }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                        {ann.isUrgent && (
                          <span style={{ fontSize: 11, fontWeight: 900, backgroundColor: '#fee2e2', color: '#dc2626', padding: '3px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            🚨 URGENT ALERT
                          </span>
                        )}
                        {ann.isPinned && (
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#b45309', backgroundColor: '#fef3c7', padding: '3px 8px', borderRadius: 6 }}>
                            📌 PINNED
                          </span>
                        )}
                        {ann.relatedSdg && (
                          <span style={{ fontSize: 11, fontWeight: 800, backgroundColor: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            🌱 SDG {ann.relatedSdg} Action
                          </span>
                        )}
                        <span className="pa-badge" style={{ backgroundColor: cat.bg, color: cat.text }}>{catLbl}</span>
                        <span className="pa-card-footer" style={{ marginTop: 0 }}>
                          {new Date(ann.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>


                      <p className="pa-card-title" style={ann.isUrgent ? { color: '#991b1b' } : {}}>{ann.title}</p>
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

