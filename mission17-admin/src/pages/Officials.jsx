import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Plus, Trash2, Edit3, X, UserCheck } from 'lucide-react';
import { endpoints } from '../config/api';
import { useNotification } from '../context/NotificationContext';
import '../styles/PortalAdmin.css';

const POSITIONS = [
  'Punong Barangay', 'Barangay Kagawad', 'SK Chairperson',
  'Barangay Secretary', 'Barangay Treasurer', 'Other',
];

const POS_STYLE = {
  'Punong Barangay':   { bg: '#dcfce7', text: '#15803d' },
  'Barangay Kagawad':  { bg: '#e0f2fe', text: '#0891b2' },
  'SK Chairperson':    { bg: '#ede9fe', text: '#7c3aed' },
  'Barangay Secretary':{ bg: '#fef3c7', text: '#b45309' },
  'Barangay Treasurer':{ bg: '#fee2e2', text: '#dc2626' },
  'Other':             { bg: '#f1f5f9', text: '#64748b' },
};

const Officials = () => {
  const { showNotification } = useNotification();
  const [officials, setOfficials] = useState([]);
  const [loading, setLoading]    = useState(true);
  const [showForm, setShowForm]  = useState(false);
  const [editItem, setEditItem]  = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', position: 'Barangay Kagawad', contact: '', email: '', term: '', committee: '', order: 99 });

  const token   = localStorage.getItem('token');
  const baseUrl = endpoints.auth.backendBaseUrl;

  const fetchData = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/officials`);
      if (res.ok) setOfficials(await res.json());
    } catch { showNotification('Failed to load officials.', 'error'); }
    finally   { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ name: '', position: 'Barangay Kagawad', contact: '', email: '', term: '', committee: '', order: 99 });
    setEditItem(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return showNotification('Name is required.', 'error');
    setSubmitting(true);
    try {
      const url    = editItem ? `${baseUrl}/api/officials/${editItem._id}` : `${baseUrl}/api/officials`;
      const method = editItem ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'auth-token': token },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showNotification(editItem ? 'Official updated.' : 'Official added!', 'success');
        fetchData();
        resetForm();
      } else {
        const d = await res.json();
        showNotification(d.message || 'Failed.', 'error');
      }
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this official?')) return;
    const res = await fetch(`${baseUrl}/api/officials/${id}`, { method: 'DELETE', headers: { 'auth-token': token } });
    if (res.ok) { showNotification('Official removed.', 'success'); fetchData(); }
  };

  const startEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, position: item.position, contact: item.contact || '', email: item.email || '', term: item.term || '', committee: item.committee || '', order: item.order || 99 });
    setShowForm(true);
  };

  return (
    <Layout title="Barangay Officials">
      <div className="pa-page">

        {/* ── HEADER ── */}
        <div className="pa-header">
          <div className="pa-header-left">
            <h1>👥 Barangay Officials</h1>
            <p>Manage the resident-facing directory of Barangay Pantal officials.</p>
          </div>
          <button className="pa-btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus size={16} /> Add Official
          </button>
        </div>

        {/* ── FORM ── */}
        {showForm && (
          <div className="pa-form-card">
            <div className="pa-form-header">
              <h3 className="pa-form-title">{editItem ? '✏️ Edit Official' : '➕ Add Official'}</h3>
              <button className="pa-btn-icon" onClick={resetForm}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="pa-form-grid">
                <div className="pa-form-group">
                  <label className="pa-label">Full Name *</label>
                  <input className="pa-input" placeholder="Hon. Juan dela Cruz" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="pa-form-group">
                  <label className="pa-label">Position *</label>
                  <select className="pa-input" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}>
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="pa-form-group">
                  <label className="pa-label">Contact Number</label>
                  <input className="pa-input" placeholder="09XX XXX XXXX" value={form.contact}
                    onChange={e => setForm({ ...form, contact: e.target.value })} />
                </div>
                <div className="pa-form-group">
                  <label className="pa-label">Email</label>
                  <input className="pa-input" placeholder="official@brgy.gov.ph" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} type="email" />
                </div>
                <div className="pa-form-group">
                  <label className="pa-label">Term</label>
                  <input className="pa-input" placeholder="2023 – 2026" value={form.term}
                    onChange={e => setForm({ ...form, term: e.target.value })} />
                </div>
                <div className="pa-form-group">
                  <label className="pa-label">Committee</label>
                  <input className="pa-input" placeholder="Health, Peace & Order, etc." value={form.committee}
                    onChange={e => setForm({ ...form, committee: e.target.value })} />
                </div>
                <div className="pa-form-group">
                  <label className="pa-label">Sort Order (1 = first)</label>
                  <input className="pa-input" type="number" min="1" max="99" value={form.order}
                    onChange={e => setForm({ ...form, order: +e.target.value })} />
                </div>
              </div>
              <div className="pa-form-actions">
                <button type="submit" className="pa-btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : (editItem ? 'Update' : 'Add Official')}
                </button>
                <button type="button" className="pa-btn-secondary" onClick={resetForm}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <p className="pa-count">{officials.length} official{officials.length !== 1 ? 's' : ''} listed</p>

        {/* ── GRID ── */}
        {loading ? (
          <div className="pa-grid-cards">
            {[1,2,3,4].map(i => <div key={i} className="pa-skeleton-row" style={{ height: 140 }} />)}
          </div>
        ) : officials.length === 0 ? (
          <div className="pa-empty">
            <div className="pa-empty-icon"><UserCheck size={52} /></div>
            <h3>No officials listed yet.</h3>
            <p>Add officials to populate the resident-facing directory.</p>
          </div>
        ) : (
          <div className="pa-grid-cards">
            {officials.map(off => {
              const ps = POS_STYLE[off.position] || POS_STYLE['Other'];
              return (
                <div key={off._id} className="pa-card">
                  <div className="pa-card-row">
                    <div style={{ flex: 1 }}>
                      <span className="pa-badge" style={{ backgroundColor: ps.bg, color: ps.text, marginBottom: 8, display: 'inline-flex' }}>
                        {off.position}
                      </span>
                      <p className="pa-card-title" style={{ marginTop: 8 }}>{off.name}</p>
                      {off.committee && <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0' }}>Committee on {off.committee}</p>}
                      {off.term      && <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0' }}>Term: {off.term}</p>}
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {off.contact && <span style={{ fontSize: 13, color: '#0038A8', fontWeight: 700 }}>📞 {off.contact}</span>}
                        {off.email   && <span style={{ fontSize: 12, color: '#64748b' }}>✉️ {off.email}</span>}
                      </div>
                    </div>
                    <div className="pa-card-actions" style={{ flexDirection: 'column' }}>
                      <button className="pa-btn-icon blue" onClick={() => startEdit(off)}><Edit3 size={15} /></button>
                      <button className="pa-btn-icon red"  onClick={() => handleDelete(off._id)}><Trash2 size={15} /></button>
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

export default Officials;
