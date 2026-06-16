import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Users, Activity, AlertCircle, CheckSquare, FileText, Megaphone } from 'lucide-react';
import '../../styles/DashboardHome.css';
import { endpoints } from '../../config/api';

const DashboardHome = () => {
  const [stats, setStats] = useState({
    volunteers: 0,
    activeMissions: 0,
    pending: 0,
    completed: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentDocRequests, setRecentDocRequests] = useState([]);
  const [recentBlotters, setRecentBlotters] = useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      try {
        // Fetch main dashboard summary
        const res = await fetch(endpoints.dashboard.summary, {
          headers: { 'auth-token': token },
        });

        if (!res.ok) throw new Error('Failed to fetch dashboard summary');
        const data = await res.json();

        setStats(data.stats);
        setRecentActivity(data.recentPending || []);

        // Fetch recent document requests
        try {
          const docRes = await fetch(`${endpoints.auth.backendBaseUrl}/api/document-requests?status=Pending`, {
            headers: { 'auth-token': token },
          });
          if (docRes.ok) {
            const docData = await docRes.json();
            setRecentDocRequests(docData.slice(0, 5));
          }
        } catch (e) { /* non-critical */ }

        // Fetch recent blotter reports
        try {
          const blotterRes = await fetch(`${endpoints.auth.backendBaseUrl}/api/blotter-reports?status=Pending`, {
            headers: { 'auth-token': token },
          });
          if (blotterRes.ok) {
            const blotterData = await blotterRes.json();
            setRecentBlotters(blotterData.slice(0, 5));
          }
        } catch (e) { /* non-critical */ }

        // Fetch recent announcements
        try {
          const annRes = await fetch(`${endpoints.auth.backendBaseUrl}/api/announcements`);
          if (annRes.ok) {
            const annData = await annRes.json();
            setRecentAnnouncements(annData.slice(0, 3));
          }
        } catch (e) { /* non-critical */ }

      } catch (error) {
        console.error('Dashboard Load Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const STATUS_COLORS = {
    'Pending': '#b45309',
    'Processing': '#0891b2',
    'Ready for Pickup': '#7c3aed',
    'Completed': '#16a34a',
    'Rejected': '#dc2626',
  };

  return (
    <Layout title="Dashboard">
      <div className="dashboard-container">

        <h2 className="section-title">Barangay Pantal — Dashboard Overview</h2>

        <div className="stats-grid">
          <div className="stat-card blue-card">
            <div className="stat-icon-box"><Users size={24} color="#2563eb" /></div>
            <div className="stat-info">
              {loading ? <span className="stat-skeleton" /> : <span className="stat-value">{stats.volunteers}</span>}
              <span className="stat-label">Registered Residents</span>
            </div>
          </div>

          <div className="stat-card green-card">
            <div className="stat-icon-box"><Activity size={24} color="#16a34a" /></div>
            <div className="stat-info">
              {loading ? <span className="stat-skeleton" /> : <span className="stat-value">{stats.activeMissions}</span>}
              <span className="stat-label">Active Civic Tasks</span>
            </div>
          </div>

          <div className="stat-card yellow-card">
            <div className="stat-icon-box"><AlertCircle size={24} color="#ca8a04" /></div>
            <div className="stat-info">
              {loading ? <span className="stat-skeleton" /> : <span className="stat-value">{stats.pending}</span>}
              <span className="stat-label">Pending Verifications</span>
            </div>
          </div>

          <div className="stat-card purple-card">
            <div className="stat-icon-box"><CheckSquare size={24} color="#9333ea" /></div>
            <div className="stat-info">
              {loading ? <span className="stat-skeleton" /> : <span className="stat-value">{stats.completed}</span>}
              <span className="stat-label">Tasks Completed</span>
            </div>
          </div>
        </div>

        <div className="dashboard-lower-section">
          {/* Recent Pending Task Submissions */}
          <div className="activity-section">
            <h2 className="section-title">Recent Pending Task Proofs</h2>
            <div className="activity-list">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="activity-item skeleton-row">
                    <span className="skeleton-line wide" />
                    <span className="skeleton-line narrow" />
                  </div>
                ))
                : recentActivity.length === 0
                  ? <p className="empty-msg">No pending submissions.</p>
                  : recentActivity.map((act) => (
                    <div key={act._id} className="activity-item">
                      <p><strong>{act.username}</strong> submitted proof for <strong>{act.missionTitle}</strong></p>
                      <span className="activity-status pending">Pending Review</span>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Document Requests Widget */}
          <div className="activity-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="section-title">Pending Document Requests</h2>
              <a href="/document-requests" className="view-all-link">View All →</a>
            </div>
            <div className="activity-list">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="activity-item skeleton-row">
                    <span className="skeleton-line wide" />
                    <span className="skeleton-line narrow" />
                  </div>
                ))
                : recentDocRequests.length === 0
                  ? <p className="empty-msg">No pending document requests.</p>
                  : recentDocRequests.map((req) => (
                    <div key={req._id} className="activity-item">
                      <div>
                        <p><strong>{req.fullName}</strong> — {req.documentType}</p>
                        <small style={{ color: '#64748b' }}>Ref: {req.referenceNumber}</small>
                      </div>
                      <span className="activity-status pending" style={{ color: STATUS_COLORS[req.status] || '#b45309' }}>
                        {req.status}
                      </span>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Blotter Reports Widget */}
          <div className="activity-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="section-title">Pending Blotter Reports</h2>
              <a href="/blotter-reports" className="view-all-link">View All →</a>
            </div>
            <div className="activity-list">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="activity-item skeleton-row">
                    <span className="skeleton-line wide" />
                    <span className="skeleton-line narrow" />
                  </div>
                ))
                : recentBlotters.length === 0
                  ? <p className="empty-msg">No pending blotter reports.</p>
                  : recentBlotters.map((req) => (
                    <div key={req._id} className="activity-item">
                      <div>
                        <p><strong>{req.incidentType}</strong> by {req.username}</p>
                        <small style={{ color: '#64748b' }}>Ref: {req.referenceNumber}</small>
                      </div>
                      <span className="activity-status pending" style={{ color: STATUS_COLORS[req.status] || '#b45309' }}>
                        {req.status}
                      </span>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="announcements-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Recent Announcements</h2>
            <a href="/announcements" className="view-all-link">Manage →</a>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {recentAnnouncements.length === 0
              ? <p className="empty-msg">No announcements posted yet.</p>
              : recentAnnouncements.map((ann) => (
                <div key={ann._id} className="announce-mini-card">
                  {ann.isPinned && <span className="pinned-tag">📌 Pinned</span>}
                  <p className="announce-mini-title">{ann.title}</p>
                  <p className="announce-mini-body">{ann.body?.substring(0, 100)}...</p>
                  <span className="announce-mini-date">
                    {new Date(ann.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              ))
            }
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default DashboardHome;
