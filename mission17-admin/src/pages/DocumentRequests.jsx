import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, RefreshCw, FileText } from 'lucide-react';
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

const DocumentRequests = () => {
  const { showNotification } = useNotification();
  const [requests, setRequests]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch]           = useState('');
  const [processing, setProcessing]   = useState(null);

  const token   = localStorage.getItem('token');
  const baseUrl = endpoints.auth.backendBaseUrl;

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = filterStatus !== 'All'
        ? `${baseUrl}/api/document-requests?status=${encodeURIComponent(filterStatus)}`
        : `${baseUrl}/api/document-requests`;
      const res = await fetch(url, { headers: { 'auth-token': token } });
      if (res.ok) setRequests(await res.json());
    } catch { showNotification('Failed to load requests.', 'error'); }
    finally   { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filterStatus]);

  const updateStatus = async (id, newStatus, rejectionReason = '') => {
    setProcessing(id);
    try {
      const res = await fetch(`${baseUrl}/api/document-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'auth-token': token },
        body: JSON.stringify({ status: newStatus, rejectionReason }),
      });
      if (res.ok) {
        showNotification(`Marked as "${newStatus}"`, 'success');
        fetchData();
      } else {
        const d = await res.json();
        showNotification(d.message || 'Failed.', 'error');
      }
    } finally { setProcessing(null); }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Reason for rejection (leave blank to skip):');
    if (reason === null) return; // cancelled
    await updateStatus(id, 'Rejected', reason || '');
  };

  const filtered = requests.filter(r =>
    r.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    r.referenceNumber?.toLowerCase().includes(search.toLowerCase()) ||
    r.documentType?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Document Requests">
      <div className="pa-page">

        {/* ── HEADER ── */}
        <div className="pa-header">
          <div className="pa-header-left">
            <h1>📄 Document Requests</h1>
            <p>Review and process document requests submitted by residents.</p>
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
                      </div>

                      {/* Document Type */}
                      <p className="pa-card-title">{req.documentType}</p>

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

                      {/* Footer */}
                      <p className="pa-card-footer">
                        Submitted {new Date(req.createdAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {req.processedBy && ` · Handled by: ${req.processedBy}`}
                      </p>
                      {req.rejectionReason && (
                        <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, marginTop: 4 }}>
                          ❌ Reason: {req.rejectionReason}
                        </p>
                      )}
                    </div>

                    {/* ACTIONS */}
                    {canAct && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, alignItems: 'flex-end' }}>
                        {nextStatus && (
                          <button
                            className="pa-workflow-btn"
                            onClick={() => updateStatus(req._id, nextStatus)}
                            disabled={processing === req._id}
                          >
                            {processing === req._id ? 'Updating…' : `→ ${nextStatus}`}
                          </button>
                        )}
                        <button
                          className="pa-btn-danger"
                          onClick={() => handleReject(req._id)}
                          disabled={processing === req._id}
                        >
                          Reject
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
