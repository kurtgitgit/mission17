import React, { useState, useEffect } from 'react';
import { Lightbulb, ThumbsUp, MessageSquare, Search, CheckCircle, Clock, ChevronRight, User, Hash } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { suggestionsApi } from '../services/api.service';
import '../styles/DashboardHome.css';

const Suggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminReply, setAdminReply] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const res = await suggestionsApi.getAll();
      setSuggestions(res.data);
    } catch (err) {
      console.error('Error fetching suggestions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setNewStatus(item.status);
    setAdminReply(item.adminReply || '');
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await suggestionsApi.updateStatus(selectedItem._id, { status: newStatus, adminReply });
      setSuggestions(suggestions.map(s => s._id === selectedItem._id ? { ...s, status: newStatus, adminReply } : s));
      setSelectedItem({ ...selectedItem, status: newStatus, adminReply });
      alert('Feedback updated successfully.');
    } catch (err) {
      alert('Failed to update suggestion.');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = suggestions.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch(status) {
      case 'New': return <span className="status-badge pending" style={{ padding: '4px 8px', fontSize: '11px' }}><Lightbulb size={12}/> New</span>;
      case 'Under Review': return <span className="status-badge in-progress" style={{ padding: '4px 8px', fontSize: '11px' }}><Clock size={12}/> Reviewing</span>;
      case 'Approved': return <span className="status-badge approved" style={{ padding: '4px 8px', fontSize: '11px' }}><CheckCircle size={12}/> Approved</span>;
      default: return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', paddingBottom: 0 }}>
        
        {/* HEADER */}
        <header className="top-header" style={{ flexShrink: 0, marginBottom: '20px' }}>
          <div>
            <h1 className="greeting">Community Feedback</h1>
            <p className="subtitle">Review and respond to resident suggestions</p>
          </div>
        </header>

        {/* MASTER-DETAIL LAYOUT */}
        <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden', paddingBottom: '20px' }}>
          
          {/* LEFT: FEEDBACK LIST (MASTER) */}
          <div style={{ flex: '0 0 380px', display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div className="search-box" style={{ margin: 0, width: '100%' }}>
                <Search size={18} color="#64748b" />
                <input 
                  type="text" 
                  placeholder="Search feedback..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {loading ? (
                <div className="loading-state" style={{ marginTop: '50px' }}>Loading suggestions...</div>
              ) : filtered.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
                  <MessageSquare size={40} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
                  <p>No feedback found.</p>
                </div>
              ) : (
                filtered.map(item => (
                  <div 
                    key={item._id}
                    onClick={() => handleSelectItem(item)}
                    style={{ 
                      padding: '16px', 
                      borderRadius: '10px', 
                      marginBottom: '8px',
                      cursor: 'pointer',
                      border: `1px solid ${selectedItem?._id === item._id ? '#0038A8' : '#e2e8f0'}`,
                      background: selectedItem?._id === item._id ? '#eff6ff' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '14px', flex: 1, marginRight: '10px' }} numberOfLines={1}>{item.title}</span>
                      {getStatusBadge(item.status)}
                    </div>
                    <div style={{ fontSize: '13px', color: '#475569', fontWeight: '600', marginBottom: '4px' }}>
                      {item.category}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      <ChevronRight size={16} color={selectedItem?._id === item._id ? '#0038A8' : '#cbd5e1'} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: FEEDBACK DETAILS (DETAIL) */}
          <div style={{ flex: 1, background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!selectedItem ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <Lightbulb size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <h3>Select feedback to review</h3>
                <p>Click on any suggestion from the list to read and reply.</p>
              </div>
            ) : (
              <>
                {/* ITEM HEADER */}
                <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#0f172a' }}>{selectedItem.title}</h2>
                    <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>{selectedItem.category}</span>
                  </div>
                  <div>
                    {getStatusBadge(selectedItem.status)}
                  </div>
                </div>

                {/* ITEM BODY (SCROLLABLE) */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                  <div style={{ display: 'flex', gap: '40px', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px' }}>
                        <User size={20} color="#0038A8" />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Submitted By</div>
                        <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 'bold' }}>{selectedItem.isAnonymous ? 'Anonymous' : selectedItem.username}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px' }}>
                        <Clock size={20} color="#0038A8" />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Date Submitted</div>
                        <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 'bold' }}>
                          {new Date(selectedItem.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px' }}>
                        <Hash size={20} color="#0038A8" />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Upvotes</div>
                        <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 'bold' }}>{selectedItem.upvotes?.length || 0} Votes</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '14px', color: '#475569', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Feedback Details</h3>
                    <p style={{ fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: 0 }}>
                      {selectedItem.description}
                    </p>
                  </div>

                  {/* ACTION FORM */}
                  <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '30px' }}>
                    <h3 style={{ fontSize: '16px', color: '#0f172a', marginBottom: '20px' }}>Review & Respond</h3>
                    
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label style={{ fontWeight: 'bold', color: '#475569' }}>Update Status</label>
                      <select 
                        className="form-input" 
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        style={{ maxWidth: '300px' }}
                      >
                        <option value="New">New</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Approved">Approved / Implemented</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label style={{ fontWeight: 'bold', color: '#475569' }}>Official Reply (Visible to Community)</label>
                      <textarea 
                        className="form-input"
                        rows="4"
                        placeholder="Thank the resident or explain the barangay's plan..."
                        value={adminReply}
                        onChange={(e) => setAdminReply(e.target.value)}
                      />
                    </div>

                    <button 
                      className="btn primary" 
                      onClick={handleUpdate} 
                      disabled={updating || (newStatus === selectedItem.status && adminReply === (selectedItem.adminReply || ''))}
                      style={{ padding: '12px 24px', fontSize: '15px', width: 'auto' }}
                    >
                      {updating ? 'Saving Reply...' : 'Save & Publish Reply'}
                    </button>
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
