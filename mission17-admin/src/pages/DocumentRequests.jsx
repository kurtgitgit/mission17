import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { Search, RefreshCw, FileText, XCircle, AlertTriangle, CheckCircle2, Calendar, Smartphone, ShieldCheck, Eye, UserCheck } from 'lucide-react';
import { endpoints } from '../config/api';
import { useNotification } from '../context/NotificationContext';
import '../styles/PortalAdmin.css';

const STATUSES   = ['All', 'Pending', 'Processing', 'Ready for Pickup', 'Completed', 'Rejected'];
const NEXT_STATUS = {
  'Pending':    'Processing',
  'Processing': 'Ready for Pickup',
  'Ready for Pickup': 'Completed',
};
const STATUS_CLASS = {
  'Pending':          'pa-badge pa-status-Pending',
  'Processing':       'pa-badge pa-status-Processing',
  'Ready for Pickup': 'pa-badge pa-status-Ready',
  'Completed':        'pa-badge pa-status-Completed',
  'Rejected':         'pa-badge pa-status-Rejected',
};

// ─── Resident KYC & ID Inspection Modal ──────────────────────────────────────
const ResidentKYCModal = ({ resident, applicantName, onClose }) => {
  if (!resident) return null;
  const isVerified = resident.isVerified || resident.accountStatus === 'approved';

  return (
    <div style={overlay}>
      <div style={{ ...modalBox, maxWidth: 640 }}>
        {/* Header */}
        <div style={modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ ...iconWrap, backgroundColor: isVerified ? '#dcfce7' : '#fef3c7' }}>
              <ShieldCheck size={20} color={isVerified ? '#15803d' : '#b45309'} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                Resident Identity & KYC Verification
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b', marginTop: 2 }}>
                Applicant: <strong>{applicantName}</strong> · Government ID on file
              </p>
            </div>
          </div>
          <button onClick={onClose} style={closeBtn}><XCircle size={20} color="#94a3b8" /></button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isVerified ? '#f0fdf4' : '#fffbeb', padding: '12px 16px', borderRadius: 12, marginBottom: 16, border: `1px solid ${isVerified ? '#bbf7d0' : '#fde68a'}` }}>
            <div>
              <strong style={{ fontSize: 14, color: isVerified ? '#166534' : '#92400e', display: 'block' }}>
                {isVerified ? '✅ Official Verified Resident' : '⏳ Pending Account Verification'}
              </strong>
              <span style={{ fontSize: 12, color: '#64748b' }}>Account Status: {(resident.accountStatus || 'Pending').toUpperCase()}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: isVerified ? '#15803d' : '#b45309', backgroundColor: 'white', padding: '4px 10px', borderRadius: 20 }}>
              {resident.purok ? `Purok ${resident.purok}` : 'Barangay Bagong Pag-asa'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: 16 }}>
            <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Years of Residency</span>
              <strong style={{ fontSize: 13, color: '#0f172a' }}>{resident.yearsOfResidency ? `${resident.yearsOfResidency} Years` : 'Bona fide resident'}</strong>
            </div>
            <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Voter Status</span>
              <strong style={{ fontSize: 13, color: '#0f172a' }}>{resident.voterStatus || 'Registered Voter'}</strong>
            </div>
            <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
              <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Registered Address</span>
              <strong style={{ fontSize: 13, color: '#0f172a' }}>{resident.completeAddress || 'Barangay Bagong Pag-asa, San Jacinto'}</strong>
            </div>
          </div>

          <h4 style={{ margin: '0 0 10px 0', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
            Submitted Government ID Photos
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>ID Front Photo</span>
              {resident.validIdFrontUrl ? (
                <img src={resident.validIdFrontUrl} alt="Valid ID Front" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, border: '1.5px solid #cbd5e1' }} />
              ) : (
                <div style={{ height: 140, backgroundColor: '#f1f5f9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12 }}>No Front ID</div>
              )}
            </div>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>ID Back Photo</span>
              {resident.validIdBackUrl ? (
                <img src={resident.validIdBackUrl} alt="Valid ID Back" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, border: '1.5px solid #cbd5e1' }} />
              ) : (
                <div style={{ height: 140, backgroundColor: '#f1f5f9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12 }}>No Back ID</div>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
          <button onClick={onClose} style={cancelBtnStyle}>Close KYC</button>
        </div>
      </div>
    </div>
  );
};

// ─── Reject / Missing Requirements Modal ──────────────────────────────────────
const RejectModal = ({ onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  const PRESETS = [
    'Missing 1x1 / 2x2 ID Photo',
    'Proof of Residency required',
    'Valid Government ID copy missing/unclear',
    'Document purpose requires clarification',
    'Resident account not yet verified'
  ];

  return (
    <div style={overlay}>
      <div style={modalBox}>
        {/* Header */}
        <div style={modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={iconWrap}>
              <AlertTriangle size={20} color="#dc2626" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Missing Requirements / Reject</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b', marginTop: 2 }}>Sends a real-time push notification to resident's phone.</p>
            </div>
          </div>
          <button onClick={onCancel} style={closeBtn}>
            <XCircle size={20} color="#94a3b8" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          <label style={labelStyle}>Quick Reasons / Missing Documents:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {PRESETS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setReason(prev => prev ? `${prev}. ${p}` : p)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#334155',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                + {p}
              </button>
            ))}
          </div>

          <label style={labelStyle}>Custom Explanation for Resident *</label>
          <textarea
            style={textareaStyle}
            rows={3}
            placeholder="Explain why this request is incomplete or what specific documents they must bring..."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>

        {/* Footer */}
        <div style={modalFooter}>
          <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim()}
            style={{ ...rejectBtnStyle, opacity: reason.trim() ? 1 : 0.5 }}
          >
            Send Notice & Reject
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Ready for Pickup Modal ───────────────────────────────────────────────────
const ReadyModal = ({ onConfirm, onCancel }) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [pickupDate, setPickupDate] = useState(defaultDateStr);

  return (
    <div style={overlay}>
      <div style={modalBox}>
        {/* Header */}
        <div style={modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ ...iconWrap, backgroundColor: '#dcfce7' }}>
              <CheckCircle2 size={20} color="#16a34a" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Set Ready for Pickup</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b', marginTop: 2 }}>Resident will receive an instant lock screen notification.</p>
            </div>
          </div>
          <button onClick={onCancel} style={closeBtn}>
            <XCircle size={20} color="#94a3b8" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          <label style={labelStyle}>Estimated / Available Pickup Date:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Calendar size={18} color="#64748b" />
            <input
              type="date"
              style={{ ...textareaStyle, height: 42, padding: '8px 12px' }}
              value={pickupDate}
              onChange={e => setPickupDate(e.target.value)}
            />
          </div>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
            ℹ️ The resident will be instructed to bring their Reference Number and a valid ID to the Barangay Hall.
          </p>
        </div>

        {/* Footer */}
        <div style={modalFooter}>
          <button style={cancelBtnStyle} onClick={onCancel}>Cancel</button>
          <button
            style={{ ...rejectBtnStyle, backgroundColor: '#16a34a' }}
            onClick={() => onConfirm(pickupDate)}
          >
            Confirm & Send Phone Alert
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Inline styles for modals ────────────────────────────────────────────────
const overlay = {
  position: 'fixed', inset: 0, zIndex: 9999,
  backgroundColor: 'rgba(0,0,0,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(3px)',
};
const modalBox = {
  background: 'white', borderRadius: 16, width: '100%', maxWidth: 500,
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
  backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const closeBtn = {
  background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const labelStyle = {
  display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6,
};
const textareaStyle = {
  width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10,
  padding: '10px 14px', fontSize: 14, color: '#0f172a',
  backgroundColor: '#f8fafc', resize: 'vertical', outline: 'none',
  fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box',
};
const cancelBtnStyle = {
  padding: '9px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0',
  background: 'white', color: '#475569', fontWeight: 600, fontSize: 14, cursor: 'pointer',
};
const rejectBtnStyle = {
  padding: '9px 20px', borderRadius: 10, border: 'none',
  background: '#dc2626', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer',
};

const DocumentRequests = () => {
  const { showNotification } = useNotification();
  const [requests, setRequests]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch]           = useState('');
  const [processing, setProcessing]   = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null); // id of request being rejected
  const [readyTarget, setReadyTarget]   = useState(null);  // id of request being set to ready
  const [kycTarget, setKycTarget]       = useState(null);  // resident object being inspected

  const token   = localStorage.getItem('token');
  const baseUrl = endpoints.auth.backendBaseUrl;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterStatus !== 'All'
        ? `${baseUrl}/api/document-requests?status=${encodeURIComponent(filterStatus)}`
        : `${baseUrl}/api/document-requests`;
      const res = await fetch(url, { headers: { 'auth-token': token } });
      if (res.ok) setRequests(await res.json());
    } catch { showNotification('Failed to load requests.', 'error'); }
    finally   { setLoading(false); }
  }, [baseUrl, filterStatus, showNotification, token]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const updateStatus = async (id, newStatus, rejectionReason = '', pickupDate = null) => {
    setProcessing(id);
    try {
      const res = await fetch(`${baseUrl}/api/document-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'auth-token': token },
        body: JSON.stringify({ status: newStatus, rejectionReason, pickupDate }),
      });
      if (res.ok) {
        const data = await res.json();
        showNotification(data.message || `Marked as "${newStatus}"`, 'success');
        fetchData();
      } else {
        const d = await res.json();
        showNotification(d.message || 'Failed.', 'error');
      }
    } finally { setProcessing(null); }
  };

  const handleNextStatus = (req) => {
    const nextStatus = NEXT_STATUS[req.status];
    if (nextStatus === 'Ready for Pickup') {
      setReadyTarget(req._id);
    } else if (nextStatus) {
      updateStatus(req._id, nextStatus);
    }
  };

  const handleReadyConfirm = async (pickupDate) => {
    const id = readyTarget;
    setReadyTarget(null);
    await updateStatus(id, 'Ready for Pickup', '', pickupDate);
  };

  const handleRejectConfirm = async (reason) => {
    const id = rejectTarget;
    setRejectTarget(null);
    await updateStatus(id, 'Rejected', reason);
  };


  const filtered = requests.filter(r =>
    r.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    r.referenceNumber?.toLowerCase().includes(search.toLowerCase()) ||
    r.documentType?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Document Requests">
      {/* Resident KYC Modal */}
      {kycTarget && (
        <ResidentKYCModal
          resident={kycTarget.resident}
          applicantName={kycTarget.name}
          onClose={() => setKycTarget(null)}
        />
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <RejectModal
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {/* Ready for Pickup Modal */}
      {readyTarget && (
        <ReadyModal
          onConfirm={handleReadyConfirm}
          onCancel={() => setReadyTarget(null)}
        />
      )}


      <div className="pa-page">

        {/* ── HEADER ── */}
        <div className="pa-header">
          <div className="pa-header-left">
            <h1>📄 Document Requests</h1>
            <p>Review and process document requests submitted by residents. All status updates dispatch real-time push alerts to resident phones.</p>
          </div>
          <button className="pa-btn-secondary" onClick={fetchData}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {/* ── FILTER BAR ── */}
        <div className="pa-filter-bar">
          <div className="pa-search-wrapper">
            <Search size={15} />
            <input
              className="pa-search-input"
              placeholder="Search by name, reference no., or document type…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="pa-filter-chips">
            {STATUSES.map(s => (
              <button
                key={s}
                className={`pa-chip ${filterStatus === s ? 'active' : ''}`}
                onClick={() => setFilterStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <p className="pa-count">{filtered.length} request{filtered.length !== 1 ? 's' : ''} found</p>

        {/* ── LIST ── */}
        {loading ? (
          <div className="pa-list">
            {[1,2,3].map(i => <div key={i} className="pa-skeleton-row" style={{ height: 100 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="pa-empty">
            <div className="pa-empty-icon"><FileText size={52} /></div>
            <h3>No requests found.</h3>
            <p>{search ? 'Try a different search term.' : 'No document requests match this status.'}</p>
          </div>
        ) : (
          <div className="pa-list">
            {filtered.map(req => {
              const nextStatus = NEXT_STATUS[req.status];
              const badgeClass = STATUS_CLASS[req.status] || 'pa-badge pa-status-Pending';
              const canAct = req.status !== 'Completed' && req.status !== 'Rejected';
              return (
                <div key={req._id} className="pa-card">
                  <div className="pa-card-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Meta row */}
                      <div className="pa-card-meta">
                        <span className={badgeClass}>{req.status}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>{req.referenceNumber}</span>
                        {req.pickupDate && (
                          <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
                            <Calendar size={13} /> Pickup: {new Date(req.pickupDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>

                      {/* Document Type & Fee */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <p className="pa-card-title" style={{ margin: 0 }}>{req.documentType}</p>
                        <span style={{ fontSize: 11.5, fontWeight: 800, backgroundColor: '#f1f5f9', color: '#0f172a', padding: '2px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                          💵 Fee: {
                            req.documentType?.includes('Indigency') ? 'FREE' :
                            req.documentType?.includes('Business') ? '₱150.00' :
                            req.documentType?.includes('Residency') ? '₱30.00' :
                            req.documentType?.includes('ID') ? '₱100.00' : '₱50.00'
                          } · Cash on Pickup
                        </span>
                      </div>


                      {/* Resident Info */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: '#475569' }}>
                          <strong>Resident:</strong> {req.fullName}
                        </span>
                        <span style={{ fontSize: 13, color: '#475569' }}>
                          <strong>Contact:</strong> {req.contactNumber || '—'}
                        </span>
                        <span style={{ fontSize: 13, color: '#64748b', gridColumn: '1 / -1' }}>
                          <strong>Address:</strong> {req.address}
                        </span>
                        <span style={{ fontSize: 13, color: '#64748b' }}>
                          <strong>Purpose:</strong> {req.purpose}
                        </span>
                      </div>

                      {/* Resident KYC Verification Chip / Inspector */}
                      {req.userId ? (
                        <div style={{ marginBottom: 10 }}>
                          <button
                            type="button"
                            onClick={() => setKycTarget({ resident: req.userId, name: req.fullName })}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              backgroundColor: (req.userId.isVerified || req.userId.accountStatus === 'approved') ? '#f0fdf4' : '#fffbeb',
                              color: (req.userId.isVerified || req.userId.accountStatus === 'approved') ? '#166534' : '#92400e',
                              border: `1px solid ${(req.userId.isVerified || req.userId.accountStatus === 'approved') ? '#bbf7d0' : '#fde68a'}`,
                              padding: '5px 12px',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <ShieldCheck size={14} color={(req.userId.isVerified || req.userId.accountStatus === 'approved') ? '#16a34a' : '#d97706'} />
                            <span>
                              {(req.userId.isVerified || req.userId.accountStatus === 'approved') ? '✅ Verified Resident KYC' : '⏳ Pending Resident Account'} — View Valid ID Photo →
                            </span>
                          </button>
                        </div>
                      ) : null}


                      {/* Footer */}
                      <p className="pa-card-footer">
                        Submitted {new Date(req.createdAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {req.processedBy && ` · Handled by: ${req.processedBy}`}
                      </p>
                      {req.rejectionReason && (
                        <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, marginTop: 4 }}>
                          ❌ Notice / Missing Requirements: {req.rejectionReason}
                        </p>
                      )}
                    </div>

                    {/* ACTIONS */}
                    {canAct && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, alignItems: 'flex-end' }}>
                        {nextStatus && (
                          <button
                            className="pa-workflow-btn"
                            onClick={() => handleNextStatus(req)}
                            disabled={processing === req._id}
                          >
                            {processing === req._id ? 'Updating…' : `→ ${nextStatus}`}
                          </button>
                        )}
                        <button
                          className="pa-btn-danger"
                          onClick={() => setRejectTarget(req._id)}
                          disabled={processing === req._id}
                        >
                          Reject / Missing Req.
                        </button>
                      </div>
                    )}
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

export default DocumentRequests;
