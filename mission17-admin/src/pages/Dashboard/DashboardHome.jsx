import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { 
  Users, Activity, AlertCircle, CheckSquare, FileText, Megaphone, 
  ShieldAlert, MessageSquare, ArrowRight, Clock, AlertTriangle, 
  CheckCircle, Plus, Send, RefreshCw, ChevronRight, Eye 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/DashboardHome.css';
import { endpoints } from '../../config/api';

const DashboardHome = () => {
  const [stats, setStats] = useState({
    pendingDocs: 0,
    activeBlotters: 0,
    newFeedback: 0,
    activeAlerts: 0,
    totalResidents: 0,
    pendingMissions: 0,
  });

  const [pendingDocsList, setPendingDocsList] = useState([]);
  const [activeBlottersList, setActiveBlottersList] = useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const baseUrl = endpoints.auth.backendBaseUrl;

    try {
      const [docRes, blotterRes, feedbackRes, annRes, userRes, sumRes, sdgRes] = await Promise.all([
        fetch(`${baseUrl}/api/document-requests`, { headers: { 'auth-token': token } }).catch(() => null),
        fetch(`${baseUrl}/api/blotter-reports`, { headers: { 'auth-token': token } }).catch(() => null),
        fetch(`${baseUrl}/api/suggestions/stats`, { headers: { 'auth-token': token } }).catch(() => null),
        fetch(`${baseUrl}/api/announcements`).catch(() => null),
        fetch(`${endpoints.auth.baseUrl}/users`, { headers: { 'auth-token': token } }).catch(() => null),
        fetch(endpoints.dashboard.summary, { headers: { 'auth-token': token } }).catch(() => null),
        fetch(`${endpoints.auth.baseUrl}/sdg-impact-counter`).catch(() => null)
      ]);

      const docs = docRes && docRes.ok ? await docRes.json() : [];
      const blotters = blotterRes && blotterRes.ok ? await blotterRes.json() : [];
      const feedbackStats = feedbackRes && feedbackRes.ok ? await feedbackRes.json() : {};
      const anns = annRes && annRes.ok ? await annRes.json() : [];
      const users = userRes && userRes.ok ? await userRes.json() : [];
      const summary = sumRes && sumRes.ok ? await sumRes.json() : {};
      const sdgData = sdgRes && sdgRes.ok ? await sdgRes.json() : null;

      const pendingDocs = docs.filter(d => d.status === 'Pending' || d.status === 'Processing');
      const activeBlotters = blotters.filter(b => b.status === 'Pending' || b.status === 'Under Investigation');
      const urgentAlerts = anns.filter(a => a.isUrgent);

      setStats({
        pendingDocs: pendingDocs.length,
        activeBlotters: activeBlotters.length,
        newFeedback: feedbackStats.pending || feedbackStats.total || 0,
        activeAlerts: urgentAlerts.length,
        totalResidents: Array.isArray(users) ? users.length : (summary.stats?.volunteers || 0),
        pendingMissions: summary.stats?.pending || 0
      });

      if (sdgData) {
        setSdgSummary(sdgData);
      }

      setPendingDocsList(pendingDocs.slice(0, 5));
      setActiveBlottersList(activeBlotters.slice(0, 5));
      setRecentAnnouncements(anns.slice(0, 3));

    } catch (err) {
      console.error('Error loading daily essentials dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const [sdgSummary, setSdgSummary] = useState({
    totalVerifiedActions: 0,
    activeParticipants: 0,
    treePlantingCount: 0,
    wasteRecyclingCount: 0,
    cleanUpCount: 0,
    topSdgBreakdown: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const todayFormatted = new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Layout title="Operations Hub">
      <div className="dashboard-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

        {/* ── DAILY ESSENTIALS HEADER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
              🏛️ Barangay Operations Command Center
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
              {todayFormatted} · Daily Essentials & Immediate Priority Queue
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={fetchDashboardData}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', border: '1.5px solid #e2e8f0', padding: '9px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#475569' }}
            >
              <RefreshCw size={14} /> Refresh Data
            </button>
            <Link
              to="/announcements"
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#dc2626', color: '#ffffff', border: 'none', padding: '9px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}
            >
              <AlertTriangle size={15} /> Post Alert
            </Link>
          </div>
        </div>

        {/* ── 4 PRIMARY DAILY ESSENTIALS METRICS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          
          {/* 1. PENDING DOCS */}
          <Link to="/document-requests" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Document Requests</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
                  {loading ? '...' : stats.pendingDocs}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Needs Processing <ArrowRight size={12} />
                </div>
              </div>
              <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={22} color="#b45309" />
              </div>
            </div>
          </Link>

          {/* 2. ACTIVE BLOTTERS */}
          <Link to="/blotter-reports" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Blotters</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
                  {loading ? '...' : stats.activeBlotters}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Incidents & Lupon <ArrowRight size={12} />
                </div>
              </div>
              <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={22} color="#dc2626" />
              </div>
            </div>
          </Link>

          {/* 3. CITIZEN FEEDBACK */}
          <Link to="/suggestions" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0038A8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Citizen Feedback</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
                  {loading ? '...' : stats.newFeedback}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Private Desk Inbox <ArrowRight size={12} />
                </div>
              </div>
              <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={22} color="#0038A8" />
              </div>
            </div>
          </Link>

          {/* 4. EMERGENCY ALERTS */}
          <Link to="/announcements" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: stats.activeAlerts > 0 ? '#dc2626' : '#16a34a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {stats.activeAlerts > 0 ? '🚨 Emergency Alerts' : '📢 Active Bulletins'}
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
                  {loading ? '...' : (stats.activeAlerts > 0 ? `${stats.activeAlerts} Active` : 'Normal')}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Broadcast Status <ArrowRight size={12} />
                </div>
              </div>
              <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: stats.activeAlerts > 0 ? '#fee2e2' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Megaphone size={22} color={stats.activeAlerts > 0 ? '#dc2626' : '#16a34a'} />
              </div>
            </div>
          </Link>

        </div>

        {/* ── 🌿 HIGH-LEVEL SDG COMMUNITY IMPACT COUNTER ── */}
        <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)', borderRadius: 16, padding: '20px 24px', color: '#ffffff', marginBottom: '24px', boxShadow: '0 4px 12px rgba(6, 78, 59, 0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🌿</span>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#ffffff' }}>
                  Community SDG & Sustainability Impact Counter
                </h3>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#a7f3d0' }}>
                Real-time tracking of resident-led green initiatives & United Nations Sustainable Development Goals.
              </p>
            </div>
            <Link to="/analytics" style={{ background: 'rgba(255, 255, 255, 0.18)', color: '#ffffff', textDecoration: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 800, border: '1px solid rgba(255,255,255,0.3)' }}>
              View SDG Analytics →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.12)', borderRadius: 12, padding: '12px 16px', backdropFilter: 'blur(4px)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verified Eco Actions</div>
              <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>{sdgSummary.totalVerifiedActions}</div>
              <div style={{ fontSize: 11.5, color: '#d1fae5', marginTop: 2 }}>Resident submissions</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.12)', borderRadius: 12, padding: '12px 16px', backdropFilter: 'blur(4px)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trees Planted / Greens</div>
              <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>{sdgSummary.treePlantingCount} 🌲</div>
              <div style={{ fontSize: 11.5, color: '#d1fae5', marginTop: 2 }}>SDG 15 Life on Land</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.12)', borderRadius: 12, padding: '12px 16px', backdropFilter: 'blur(4px)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Waste & Recycling</div>
              <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>{sdgSummary.wasteRecyclingCount} ♻️</div>
              <div style={{ fontSize: 11.5, color: '#d1fae5', marginTop: 2 }}>SDG 12 Responsible Consumption</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.12)', borderRadius: 12, padding: '12px 16px', backdropFilter: 'blur(4px)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Eco-Volunteers</div>
              <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>{sdgSummary.activeParticipants} 👥</div>
              <div style={{ fontSize: 11.5, color: '#d1fae5', marginTop: 2 }}>Registered resident champions</div>
            </div>
          </div>
        </div>


        {/* ── DAILY ACTION QUEUE (SPLIT VIEW) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '24px', marginBottom: '24px' }}>
          
          {/* LEFT: PENDING DOCUMENT REQUESTS QUEUE */}
          <div style={{ background: '#ffffff', borderRadius: 16, padding: '24px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color="#0038A8" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Priority Document Requests</h3>
              </div>
              <Link to="/document-requests" style={{ fontSize: '12.5px', fontWeight: 700, color: '#0038A8', textDecoration: 'none' }}>
                View All ({stats.pendingDocs}) →
              </Link>
            </div>

            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Loading requests...</div>
            ) : pendingDocsList.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: 12 }}>
                <CheckCircle size={32} color="#16a34a" style={{ margin: '0 auto 8px' }} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#334155' }}>All caught up!</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>No pending clearance or certificate requests right now.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingDocsList.map(req => (
                  <div key={req._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <div>
                      <strong style={{ fontSize: '13.5px', color: '#0f172a', display: 'block' }}>{req.fullName}</strong>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{req.documentType} · Ref: {req.referenceNumber}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: 6, backgroundColor: req.status === 'Processing' ? '#e0f2fe' : '#fef3c7', color: req.status === 'Processing' ? '#0369a1' : '#b45309' }}>
                        {req.status}
                      </span>
                      <Link to="/document-requests" style={{ color: '#0038A8' }}>
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: ACTIVE BLOTTERS & EMERGENCY BULLETINS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* ACTIVE BLOTTERS */}
            <div style={{ background: '#ffffff', borderRadius: 16, padding: '24px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldAlert size={18} color="#dc2626" />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Active Blotter Incidents</h3>
                </div>
                <Link to="/blotter-reports" style={{ fontSize: '12.5px', fontWeight: 700, color: '#dc2626', textDecoration: 'none' }}>
                  View All ({stats.activeBlotters}) →
                </Link>
              </div>

              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Loading blotters...</div>
              ) : activeBlottersList.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: 12 }}>
                  <CheckCircle size={28} color="#16a34a" style={{ margin: '0 auto 6px' }} />
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#334155' }}>Peace & Order Calm</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#64748b' }}>No pending or unassigned blotter cases.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeBlottersList.map(b => (
                    <div key={b._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, border: '1px solid #fee2e2', backgroundColor: '#fffafa' }}>
                      <div>
                        <strong style={{ fontSize: '13px', color: '#991b1b', display: 'block' }}>{b.incidentType}</strong>
                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>By {b.username || 'Resident'} · Ref: {b.referenceNumber}</span>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: 6, backgroundColor: '#fee2e2', color: '#dc2626' }}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* EMERGENCY BROADCAST & BULLETINS */}
            <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px 24px', border: '1.5px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Megaphone size={18} color="#0038A8" />
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>Latest Barangay Bulletins</h3>
                </div>
                <Link to="/announcements" style={{ fontSize: '12px', fontWeight: 700, color: '#0038A8', textDecoration: 'none' }}>
                  Manage →
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentAnnouncements.map(a => (
                  <div key={a._id} style={{ padding: '8px 12px', borderRadius: 8, backgroundColor: a.isUrgent ? '#fee2e2' : '#f8fafc', borderLeft: a.isUrgent ? '3px solid #dc2626' : '3px solid #0038A8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {a.isUrgent && <span style={{ fontSize: 10, fontWeight: 900, color: '#dc2626' }}>🚨 URGENT</span>}
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: a.isUrgent ? '#991b1b' : '#0f172a' }}>{a.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </Layout>
  );
};

export default DashboardHome;

