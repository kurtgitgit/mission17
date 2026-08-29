import React, { useState, useEffect } from 'react';
import { Lightbulb, MessageSquare, Search, CheckCircle, Clock, ChevronRight, User, Trash2, AlertTriangle, XCircle, Smile, Meh, Frown, Sparkles, Filter, RefreshCw, Send } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { suggestionsApi } from '../services/api.service';
import { useNotification } from '../context/NotificationContext';
import '../styles/DashboardHome.css';

const QUICK_REPLIES = [
  "Thank you for your feedback! The Barangay Captain and Council have noted this.",
  "Our engineering & maintenance team has scheduled an inspection for this location.",
  "This issue has been resolved by our Barangay staff. Thank you for your vigilance!",
  "We are coordinating with the local utility / authorities regarding this matter."
];

const Suggestions = () => {
  const { showNotification } = useNotification();
  const [suggestions, setSuggestions] = useState([]);
  const [stats, setStats]             = useState({ total: 0, positive: 0, neutral: 0, negative: 0, positivePercent: 0, neutralPercent: 0, negativePercent: 0 });
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('All'); // 'All' | 'Positive' | 'Neutral' | 'Negative'
  const [statusFilter, setStatusFilter]       = useState('All');
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [newStatus, setNewStatus]       = useState('');
  const [adminReply, setAdminReply]     = useState('');
  const [updating, setUpdating]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        suggestionsApi.getAll(),
        suggestionsApi.getStats().catch(() => null)
      ]);
      setSuggestions(listRes.data || []);
      if (statsRes?.data) setStats(statsRes.data);
    } catch (err) {
      console.error('Error fetching suggestions', err);
      showNotification('Failed to load feedback records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setNewStatus(item.status || 'New');
    setAdminReply(item.adminReply || '');
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    setUpdating(true);
    try {
      await suggestionsApi.updateStatus(selectedItem._id, { status: newStatus, adminReply });
      setSuggestions(prev => prev.map(s => s._id === selectedItem._id ? { ...s, status: newStatus, adminReply } : s));
      setSelectedItem(prev => ({ ...prev, status: newStatus, adminReply }));
      showNotification('Official response saved & notification sent to resident!', 'success');
      // Refresh stats
      const s = await suggestionsApi.getStats().catch(() => null);
      if (s?.data) setStats(s.data);
    } catch {
      showNotification('Failed to update feedback.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const item = deleteTarget;
    setDeleteTarget(null);
    try {
      await suggestionsApi.remove(item._id);
      setSuggestions(prev => prev.filter(s => s._id !== item._id));
      if (selectedItem?._id === item._id) setSelectedItem(null);
      showNotification('Feedback record deleted.', 'success');
      const s = await suggestionsApi.getStats().catch(() => null);
      if (s?.data) setStats(s.data);
    } catch {
      showNotification('Failed to delete feedback.', 'error');
    }
  };

  const filtered = suggestions.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.category && s.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSentiment = sentimentFilter === 'All' || s.sentiment === sentimentFilter;
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesSentiment && matchesStatus;
  });

  const getSentimentBadge = (sentiment) => {
    switch(sentiment) {
      case 'Positive':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, backgroundColor: '#dcfce7', color: '#15803d' }}>
            <Smile size={13} /> Positive
          </span>
        );
      case 'Negative':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, backgroundColor: '#fee2e2', color: '#dc2626' }}>
            <Frown size={13} /> Concern / Negative
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, backgroundColor: '#f1f5f9', color: '#475569' }}>
            <Meh size={13} /> Neutral
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'New': return <span className="status-badge pending" style={{ padding: '3px 8px', fontSize: '11px' }}><Lightbulb size={12}/> New</span>;
      case 'Under Review': return <span className="status-badge in-progress" style={{ padding: '3px 8px', fontSize: '11px' }}><Clock size={12}/> In Review</span>;
      case 'Resolved': return <span className="status-badge approved" style={{ padding: '3px 8px', fontSize: '11px' }}><CheckCircle size={12}/> Resolved</span>;
      case 'Dismissed': return <span className="status-badge rejected" style={{ padding: '3px 8px', fontSize: '11px' }}><XCircle size={12}/> Dismissed</span>;
      default: return <span className="status-badge">{status || 'New'}</span>;
    }
  };

  const getResidentName = (item) => {
    if (item.isAnonymous) return 'Anonymous Resident 🔒';
    if (item.userId && (item.userId.firstName || item.userId.lastName)) {
      return `${item.userId.firstName || ''} ${item.userId.lastName || ''}`.trim();
    }
    return item.username || 'Resident';
  };

  return (
    <div className="dashboard-container">
      <Sidebar />

      {/* DELETE CONFIRM MODAL */}
      {deleteTarget && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, backgroundColor:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)' }}>
          <div style={{ background:'white', borderRadius:16, width:'100%', maxWidth:440, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #f1f5f9' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:40, height:40, borderRadius:10, backgroundColor:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <AlertTriangle size={20} color="#dc2626" />
                </div>
                <div>
                  <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:'#0f172a' }}>Delete Feedback</h3>
                  <p style={{ margin:0, fontSize:13, color:'#64748b', marginTop:2 }}>This action cannot be undone.</p>
                </div>
              </div>
              <button onClick={() => setDeleteTarget(null)} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
                <XCircle size={20} color="#94a3b8" />
              </button>
            </div>
            <div style={{ padding:'20px 24px' }}>
              <p style={{ fontSize:14, color:'#475569', margin:0 }}>Are you sure you want to permanently delete <strong>&ldquo;{deleteTarget.title}&rdquo;</strong>?</p>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'16px 24px', borderTop:'1px solid #f1f5f9', background:'#f8fafc', borderRadius:'0 0 16px 16px' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding:'9px 20px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'white', color:'#475569', fontWeight:600, fontSize:14, cursor:'pointer' }}>Cancel</button>
              <button onClick={handleDeleteConfirm} style={{ padding:'9px 20px', borderRadius:10, border:'none', background:'#dc2626', color:'white', fontWeight:700, fontSize:14, cursor:'pointer' }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', paddingBottom: 0 }}>
        
        {/* HEADER & SENTIMENT KPI OVERVIEW */}
        <header className="top-header" style={{ flexShrink: 0, marginBottom: '14px' }}>
          <div>
            <h1 className="greeting">Citizen Feedback & Sentiment Analytics</h1>
            <p className="subtitle">Private citizen desk for Barangay Captain — automated sentiment tracking and direct responses</p>
          </div>
          <button 
            onClick={fetchData}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </header>

        {/* ── SENTIMENT GAUGE SUMMARY CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14, flexShrink: 0 }}>
          {/* TOTAL */}
          <div style={{ background: '#ffffff', borderRadius: 12, padding: '14px 18px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Messages</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{stats.total}</div>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={18} color="#0038A8" />
            </div>
          </div>

          {/* POSITIVE */}
          <div 
            onClick={() => setSentimentFilter(sentimentFilter === 'Positive' ? 'All' : 'Positive')}
            style={{ background: sentimentFilter === 'Positive' ? '#f0fdf4' : '#ffffff', borderRadius: 12, padding: '14px 18px', border: sentimentFilter === 'Positive' ? '2px solid #22c55e' : '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>Positive Sentiment</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#15803d', marginTop: 2 }}>
                {stats.positive} <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>({stats.positivePercent}%)</span>
              </div>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Smile size={20} color="#16a34a" />
            </div>
          </div>

          {/* NEUTRAL */}
          <div 
            onClick={() => setSentimentFilter(sentimentFilter === 'Neutral' ? 'All' : 'Neutral')}
            style={{ background: sentimentFilter === 'Neutral' ? '#f8fafc' : '#ffffff', borderRadius: 12, padding: '14px 18px', border: sentimentFilter === 'Neutral' ? '2px solid #64748b' : '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Inquiries / Neutral</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#334155', marginTop: 2 }}>
                {stats.neutral} <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>({stats.neutralPercent}%)</span>
              </div>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Meh size={20} color="#64748b" />
            </div>
          </div>

          {/* NEGATIVE */}
          <div 
            onClick={() => setSentimentFilter(sentimentFilter === 'Negative' ? 'All' : 'Negative')}
            style={{ background: sentimentFilter === 'Negative' ? '#fef2f2' : '#ffffff', borderRadius: 12, padding: '14px 18px', border: sentimentFilter === 'Negative' ? '2px solid #ef4444' : '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>Concerns / Negative</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#b91c1c', marginTop: 2 }}>
                {stats.negative} <span style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>({stats.negativePercent}%)</span>
              </div>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Frown size={20} color="#dc2626" />
            </div>
          </div>
        </div>

        {/* MASTER-DETAIL LAYOUT */}
        <div style={{ display: 'flex', gap: '16px', flex: 1, overflow: 'hidden', paddingBottom: '16px' }}>
          
          {/* LEFT: FEEDBACK LIST (MASTER) */}
          <div style={{ flex: '0 0 400px', display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            
            {/* SEARCH & FILTERS */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div className="search-box" style={{ margin: '0 0 10px 0', width: '100%' }}>
                <Search size={16} color="#64748b" />
                <input 
                  type="text" 
                  placeholder="Search resident feedback, category..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: '100%', fontSize: 13 }}
                />
              </div>

              {/* SENTIMENT FILTER PILLS */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['All', 'Positive', 'Neutral', 'Negative'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSentimentFilter(s)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 14,
                      border: '1px solid',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      borderColor: sentimentFilter === s ? '#0038A8' : '#e2e8f0',
                      backgroundColor: sentimentFilter === s ? '#0038A8' : '#ffffff',
                      color: sentimentFilter === s ? '#ffffff' : '#475569'
                    }}
                  >
                    {s === 'All' ? 'All Sentiments' : s}
                  </button>
                ))}
              </div>
            </div>
            
            {/* FEEDBACK ITEMS */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {loading ? (
                <div className="loading-state" style={{ marginTop: '40px' }}>Loading private feedback...</div>
              ) : filtered.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <MessageSquare size={36} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 14, color: '#64748b' }}>No feedback matches your filters.</p>
                </div>
              ) : (
                filtered.map(item => (
                  <div 
                    key={item._id}
                    onClick={() => handleSelectItem(item)}
                    style={{ 
                      padding: '14px', 
                      borderRadius: '10px', 
                      marginBottom: '8px',
                      cursor: 'pointer',
                      border: `1.5px solid ${selectedItem?._id === item._id ? '#0038A8' : '#e2e8f0'}`,
                      background: selectedItem?._id === item._id ? '#eff6ff' : 'white',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: 6 }}>
                      {getSentimentBadge(item.sentiment)}
                      {getStatusBadge(item.status)}
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '13.5px', marginBottom: 4, lineHeight: '18px' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: 6 }}>
                      Category: <strong>{item.category || 'General'}</strong> · From: <em>{getResidentName(item)}</em>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {new Date(item.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <ChevronRight size={15} color={selectedItem?._id === item._id ? '#0038A8' : '#cbd5e1'} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: FEEDBACK DETAILS & OFFICIAL RESPONSE (DETAIL) */}
          <div style={{ flex: 1, background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!selectedItem ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', padding: 30, textAlign: 'center' }}>
                <MessageSquare size={52} style={{ marginBottom: '14px', opacity: 0.4 }} />
                <h3 style={{ fontSize: 16, color: '#334155', margin: '0 0 6px 0' }}>Select citizen feedback to review</h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Click on any message from the left inbox to view details, sentiment breakdown, and send an official response.</p>
              </div>
            ) : (
              <>
                {/* ITEM HEADER */}
                <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {getSentimentBadge(selectedItem.sentiment)}
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>• {selectedItem.category || 'General'}</span>
                    </div>
                    <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 800 }}>{selectedItem.title}</h2>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    {getStatusBadge(selectedItem.status)}
                    <button
                      onClick={() => setDeleteTarget(selectedItem)}
                      title="Delete this feedback"
                      style={{ background:'#fee2e2', border:'none', borderRadius:8, padding:'7px 10px', cursor:'pointer', display:'flex', alignItems:'center', gap:5, color:'#dc2626', fontWeight:700, fontSize:12 }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>

                {/* ITEM BODY (SCROLLABLE) */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                  
                  {/* RESIDENT METADATA */}
                  <div style={{ display: 'flex', gap: '30px', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '14px 18px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px' }}>
                        <User size={18} color="#0038A8" />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Submitted By</div>
                        <div style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: '800' }}>{getResidentName(selectedItem)}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px' }}>
                        <Clock size={18} color="#0038A8" />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Date Received</div>
                        <div style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: '800' }}>
                          {new Date(selectedItem.createdAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CITIZEN MESSAGE DETAILS */}
                  <div style={{ background: '#ffffff', padding: '18px', borderRadius: '12px', border: '1.5px solid #e2e8f0', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800 }}>Resident Message Content</h3>
                    <p style={{ fontSize: '14.5px', color: '#1e293b', lineHeight: '1.6', margin: 0 }}>
                      {selectedItem.description}
                    </p>
                  </div>

                  {/* ACTION & RESPONSE DESK */}
                  <div style={{ borderTop: '1.5px dashed #e2e8f0', paddingTop: '20px' }}>
                    <h3 style={{ fontSize: '15px', color: '#0f172a', margin: '0 0 14px 0', fontWeight: 800 }}>🏛️ Official Barangay Action & Reply</h3>
                    
                    <div style={{ display: 'flex', gap: 14, marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Status</label>
                        <select 
                          className="form-input" 
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          style={{ width: '100%', fontSize: 13 }}
                        >
                          <option value="New">New (Unprocessed)</option>
                          <option value="Under Review">Under Review (Forwarded to Team)</option>
                          <option value="Resolved">Resolved (Action Completed)</option>
                          <option value="Dismissed">Dismissed (Noted / Closed)</option>
                        </select>
                      </div>
                    </div>

                    {/* QUICK REPLY PRESETS */}
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Quick Reply Presets:</label>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {QUICK_REPLIES.map((q, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setAdminReply(q)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#f8fafc',
                              fontSize: 11,
                              color: '#334155',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            + {q.slice(0, 45)}...
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                        Official Message to Resident (Delivered via Push & In-App Notification)
                      </label>
                      <textarea 
                        className="form-input"
                        rows="4"
                        placeholder="Write official response or action taken by Barangay Bagong Pag-asa..."
                        value={adminReply}
                        onChange={(e) => setAdminReply(e.target.value)}
                        style={{ fontSize: 13.5 }}
                      />
                    </div>

                    <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                      <button
                        className="btn primary"
                        onClick={handleUpdate}
                        disabled={updating}
                        style={{ padding:'10px 22px', fontSize:'14px', width:'auto', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Send size={15} /> {updating ? 'Saving...' : 'Send Official Response'}
                      </button>
                      <span style={{ fontSize:12, color: '#0891b2', display:'flex', alignItems:'center', gap:4 }}>
                        📲 Resident will receive instant lock-screen alert upon saving
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Suggestions;

