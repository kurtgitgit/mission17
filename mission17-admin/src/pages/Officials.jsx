import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Plus, Trash2, Edit3, X, UserCheck, Archive, RotateCcw, ShieldAlert, Calendar, CheckCircle2 } from 'lucide-react';
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

// ─── Archive Modal ───────────────────────────────────────────────────────────
const ArchiveModal = ({ official, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('Term Completed');
  const PRESETS = [
    'Term Completed',
    'End of Tenure (2020–2023)',
    'Resigned / Transitioned',
    'Replaced by Election',
    'Retired from Public Service'
  ];

  return (
    <div style={overlay}>
      <div style={modalBox}>
        <div style={modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ ...iconWrap, backgroundColor: '#fef3c7' }}>
              <Archive size={20} color="#b45309" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Archive Official Profile</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b', marginTop: 2 }}>{official.name} ({official.position})</p>
            </div>
          </div>
          <button onClick={onCancel} style={closeBtn}><X size={20} color="#94a3b8" /></button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 13.5, color: '#475569', marginTop: 0, marginBottom: 14 }}>
            Archiving preserves this official's complete public records and history. You can easily <strong>restore</strong> this profile anytime if they get re-elected.
          </p>

          <label style={labelStyle}>Select Archive Reason:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {PRESETS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setReason(p)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: reason === p ? '1.5px solid #b45309' : '1px solid #e2e8f0',
                  backgroundColor: reason === p ? '#fef3c7' : '#f8fafc',
                  color: reason === p ? '#92400e' : '#475569',
                  fontSize: 12,
                  fontWeight: reason === p ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <label style={labelStyle}>Custom Reason / Notes:</label>
          <input
            style={inputStyle}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. End of 2020-2023 Barangay Council Term"
          />
        </div>

        <div style={modalFooter}>
          <button style={cancelBtnStyle} onClick={onCancel}>Cancel</button>
          <button
            style={{ ...actionBtnStyle, backgroundColor: '#b45309' }}
            onClick={() => onConfirm(reason)}
          >
            Confirm & Archive
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Officials = () => {
  const { showNotification } = useNotification();
  const [tab, setTab]            = useState('active'); // 'active' | 'archived'
  const [officials, setOfficials] = useState([]);
  const [loading, setLoading]    = useState(true);
  const [showForm, setShowForm]  = useState(false);
  const [editItem, setEditItem]  = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', position: 'Barangay Kagawad', contact: '', email: '', term: '', committee: '', order: 99 });

  const token   = localStorage.getItem('token');
  const baseUrl = endpoints.auth.backendBaseUrl;

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = `${baseUrl}/api/officials?status=${tab === 'archived' ? 'archived' : 'active'}`;
      const res = await fetch(url, { headers: { 'auth-token': token } });
      if (res.ok) setOfficials(await res.json());
    } catch { showNotification('Failed to load officials.', 'error'); }
    finally   { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [tab]);

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

  const handleArchiveConfirm = async (reason) => {
    if (!archiveTarget) return;
    const id = archiveTarget._id;
    setArchiveTarget(null);
    try {
      const res = await fetch(`${baseUrl}/api/officials/${id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'auth-token': token },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showNotification(data.message || 'Official archived successfully. History preserved.', 'success');
        fetchData();
      } else {
        showNotification(data.message || `Failed to archive official (${res.status}).`, 'error');
      }
    } catch {
      showNotification('Network error while archiving.', 'error');
    }
  };

  const handleRestore = async (official) => {
    try {
      const res = await fetch(`${baseUrl}/api/officials/${official._id}/restore`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'auth-token': token },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showNotification(data.message || `Official "${official.name}" restored to Active Council Directory!`, 'success');
        fetchData();
      } else {
        showNotification(data.message || `Failed to restore official (${res.status}).`, 'error');
      }
    } catch {
      showNotification('Network error while restoring.', 'error');
    }
  };


  const handleDeletePermanent = async (id) => {
    if (!window.confirm('PERMANENT DELETION: Are you sure you want to permanently delete this official record from the database?')) return;
    const res = await fetch(`${baseUrl}/api/officials/${id}`, { method: 'DELETE', headers: { 'auth-token': token } });
    if (res.ok) { showNotification('Official permanently deleted.', 'success'); fetchData(); }
  };

  const startEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, position: item.position, contact: item.contact || '', email: item.email || '', term: item.term || '', committee: item.committee || '', order: item.order || 99 });
    setShowForm(true);
  };

  return (
    <Layout title="Barangay Officials">
      {/* Archive Modal */}
      {archiveTarget && (
        <ArchiveModal
          official={archiveTarget}
          onConfirm={handleArchiveConfirm}
          onCancel={() => setArchiveTarget(null)}
        />
      )}

      <div className="pa-page">

        {/* ── HEADER ── */}
        <div className="pa-header">
          <div className="pa-header-left">
            <h1>👥 Barangay Officials & Council</h1>
            <p>Manage active officials and archive historical profiles for future restore.</p>
          </div>
          <button className="pa-btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus size={16} /> Add Official
          </button>
        </div>

        {/* ── TAB SELECTOR ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
          <button
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: tab === 'active' ? '#0038A8' : '#f1f5f9',
              color: tab === 'active' ? '#ffffff' : '#475569',
              fontWeight: 700,
              fontSize: 13.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            onClick={() => setTab('active')}
          >
            <UserCheck size={16} /> Active Officials Council
          </button>

          <button
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: tab === 'archived' ? '#b45309' : '#f1f5f9',
              color: tab === 'archived' ? '#ffffff' : '#475569',
              fontWeight: 700,
              fontSize: 13.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            onClick={() => setTab('archived')}
          >
            <Archive size={16} /> Archived Past Officials
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
                  <label className="pa-label">Sort Order (1 = Punong Brgy first)</label>
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

        <p className="pa-count">{officials.length} {tab === 'archived' ? 'archived' : 'active'} official{officials.length !== 1 ? 's' : ''} listed</p>

        {/* ── GRID ── */}
        {loading ? (
          <div className="pa-grid-cards">
            {[1,2,3,4].map(i => <div key={i} className="pa-skeleton-row" style={{ height: 140 }} />)}
          </div>
        ) : officials.length === 0 ? (
          <div className="pa-empty">
            <div className="pa-empty-icon">
              {tab === 'archived' ? <Archive size={52} /> : <UserCheck size={52} />}
            </div>
            <h3>{tab === 'archived' ? 'No archived officials.' : 'No active officials listed yet.'}</h3>
            <p>{tab === 'archived' ? 'Officials archived in the past will appear here with one-click restore.' : 'Add officials to populate the council directory.'}</p>
          </div>
        ) : (
          <div className="pa-grid-cards">
            {officials.map(off => {
              const ps = POS_STYLE[off.position] || POS_STYLE['Other'];
              return (
                <div key={off._id} className="pa-card" style={off.isArchived ? { backgroundColor: '#fdfbf7', border: '1px dashed #d97706' } : {}}>
                  <div className="pa-card-row">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span className="pa-badge" style={{ backgroundColor: ps.bg, color: ps.text }}>
                          {off.position}
                        </span>
                        {off.isArchived && (
                          <span style={{ fontSize: 11, backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>
                            ARCHIVED
                          </span>
                        )}
                      </div>
                      <p className="pa-card-title">{off.name}</p>
                      {off.committee && <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0' }}>Committee on {off.committee}</p>}
                      {off.term      && <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0' }}>Term: {off.term}</p>}
                      
                      {off.isArchived && (
                        <div style={{ marginTop: 6, padding: '6px 10px', backgroundColor: '#fffbeb', borderRadius: 6, fontSize: 12, color: '#92400e' }}>
                          📦 <strong>Reason:</strong> {off.archiveReason || 'Term Completed'}
                          {off.archivedAt && <div style={{ fontSize: 11, color: '#b45309', marginTop: 2 }}>Archived: {new Date(off.archivedAt).toLocaleDateString('en-PH')}</div>}
                        </div>
                      )}

                      {!off.isArchived && (
                        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {off.contact && <span style={{ fontSize: 13, color: '#0038A8', fontWeight: 700 }}>📞 {off.contact}</span>}
                          {off.email   && <span style={{ fontSize: 12, color: '#64748b' }}>✉️ {off.email}</span>}
                        </div>
                      )}
                    </div>

                    <div className="pa-card-actions" style={{ flexDirection: 'column' }}>
                      {!off.isArchived ? (
                        <>
                          <button className="pa-btn-icon blue" title="Edit Official" onClick={() => startEdit(off)}><Edit3 size={15} /></button>
                          <button
                            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #fde68a', backgroundColor: '#fef3c7', color: '#b45309', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700 }}
                            title="Archive Official (Preserve History)"
                            onClick={() => setArchiveTarget(off)}
                          >
                            <Archive size={14} /> Archive
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            style={{ padding: '7px 12px', borderRadius: 8, border: 'none', backgroundColor: '#16a34a', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}
                            title="Restore Official Profile"
                            onClick={() => handleRestore(off)}
                          >
                            <RotateCcw size={14} /> Restore
                          </button>
                          <button
                            className="pa-btn-icon red"
                            title="Permanently Delete"
                            onClick={() => handleDeletePermanent(off._id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
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

// ─── Inline styles for modal ─────────────────────────────────────────────────
const overlay = {
  position: 'fixed', inset: 0, zIndex: 9999,
  backgroundColor: 'rgba(0,0,0,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(3px)',
};
const modalBox = {
  background: 'white', borderRadius: 16, width: '100%', maxWidth: 480,
  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  animation: 'fadeIn 0.15s ease',
};
const modalHeader = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
};
const modalFooter = {
  display: 'flex', justifyContent: 'flex-end', gap: 10,
  padding: '16px 24px', borderTop: '1px solid #f1f5f9',
  backgroundColor: '#f8fafc', borderRadius: '0 0 16px 16px',
};
const iconWrap = {
  width: 40, height: 40, borderRadius: 10,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const closeBtn = {
  background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const labelStyle = {
  display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6,
};
const inputStyle = {
  width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10,
  padding: '9px 12px', fontSize: 14, color: '#0f172a',
  backgroundColor: '#f8fafc', outline: 'none', boxSizing: 'border-box',
};
const cancelBtnStyle = {
  padding: '9px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0',
  background: 'white', color: '#475569', fontWeight: 600, fontSize: 14, cursor: 'pointer',
};
const actionBtnStyle = {
  padding: '9px 20px', borderRadius: 10, border: 'none',
  color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer',
};

export default Officials;

