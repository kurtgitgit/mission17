import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Clock, CheckCircle, Activity, XCircle, MapPin, User, FileText, ChevronRight, ExternalLink } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { blotterApi } from '../services/api.service';
import { useNotification } from '../context/NotificationContext';
import '../styles/DashboardHome.css';

const BlotterManagement = () => {
  const { showNotification } = useNotification();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedReport, setSelectedReport] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await blotterApi.getAll();
      setReports(res.data);
    } catch (err) {
      console.error('Error fetching blotter reports', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReport = (report) => {
    setSelectedReport(report);
    setNewStatus(report.status);
    setAdminRemarks(report.adminRemarks || '');
  };

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      await blotterApi.updateStatus(selectedReport._id, { status: newStatus, adminRemarks });
      
      // Update local state to reflect change instantly
      setReports(reports.map(r => r._id === selectedReport._id ? { ...r, status: newStatus, adminRemarks } : r));
      setSelectedReport({ ...selectedReport, status: newStatus, adminRemarks });
      showNotification('Case updated successfully.', 'success');
    } catch (err) {
      console.error('Failed to update status', err);
      showNotification('Failed to update report status.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const filteredReports = reports.filter(r => 
    r.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.incidentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pending': return <span className="status-badge pending" style={{ padding: '4px 8px', fontSize: '11px' }}><Clock size={12}/> Pending</span>;
      case 'In Progress': return <span className="status-badge in-progress" style={{ padding: '4px 8px', fontSize: '11px' }}><Activity size={12}/> In Progress</span>;
      case 'Resolved': return <span className="status-badge approved" style={{ padding: '4px 8px', fontSize: '11px' }}><CheckCircle size={12}/> Resolved</span>;
      case 'Dismissed': return <span className="status-badge rejected" style={{ padding: '4px 8px', fontSize: '11px' }}><XCircle size={12}/> Dismissed</span>;
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
            <h1 className="greeting">Blotter Management System</h1>
            <p className="subtitle">eGov Case Review and Resolution Portal</p>
          </div>
        </header>

        {/* MASTER-DETAIL LAYOUT */}
        <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden', paddingBottom: '20px' }}>
          
          {/* LEFT: CASE LIST (MASTER) */}
          <div style={{ flex: '0 0 380px', display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div className="search-box" style={{ margin: 0, width: '100%' }}>
                <Search size={18} color="#64748b" />
                <input 
                  type="text" 
                  placeholder="Search reference or user..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {loading ? (
                <div className="loading-state" style={{ marginTop: '50px' }}>Loading cases...</div>
              ) : filteredReports.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
                  <ShieldAlert size={40} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
                  <p>No cases found.</p>
                </div>
              ) : (
                filteredReports.map(report => (
                  <div 
                    key={report._id}
                    onClick={() => handleSelectReport(report)}
                    style={{ 
                      padding: '16px', 
                      borderRadius: '10px', 
                      marginBottom: '8px',
                      cursor: 'pointer',
                      border: `1px solid ${selectedReport?._id === report._id ? '#0038A8' : '#e2e8f0'}`,
                      background: selectedReport?._id === report._id ? '#eff6ff' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '14px' }}>{report.referenceNumber}</span>
                      {getStatusBadge(report.status)}
                    </div>
                    <div style={{ fontSize: '13px', color: '#475569', fontWeight: '600', marginBottom: '4px' }}>
                      {report.incidentType}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {new Date(report.dateOfIncident || report.createdAt).toLocaleDateString()}
                      </span>
                      <ChevronRight size={16} color={selectedReport?._id === report._id ? '#0038A8' : '#cbd5e1'} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: CASE DETAILS (DETAIL) */}
          <div style={{ flex: 1, background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!selectedReport ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <FileText size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <h3>Select a case to view details</h3>
                <p>Click on any blotter report from the list to begin review.</p>
              </div>
            ) : (
              <>
                {/* CASE HEADER */}
                <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#0f172a' }}>Case: {selectedReport.referenceNumber}</h2>
                    <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>{selectedReport.incidentType}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {getStatusBadge(selectedReport.status)}
                    {selectedReport.blockchainTxHash && selectedReport.blockchainTxHash.startsWith('0x') && (
                      <button 
                        onClick={() => window.open(`https://sepolia.etherscan.io/tx/${selectedReport.blockchainTxHash}`, '_blank')}
                        style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 'bold' }}
                        title="View on Sepolia Etherscan"
                      >
                        <ExternalLink size={14} />
                        Ledger
                      </button>
                    )}
                  </div>
                </div>

                {/* CASE BODY (SCROLLABLE) */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                  <div style={{ display: 'flex', gap: '40px', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px' }}>
                        <User size={20} color="#0038A8" />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Complainant</div>
                        <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 'bold' }}>{selectedReport.username}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px' }}>
                        <Clock size={20} color="#0038A8" />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Date & Time</div>
                        <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 'bold' }}>
                          {new Date(selectedReport.dateOfIncident || selectedReport.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px' }}>
                        <MapPin size={20} color="#0038A8" />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Location</div>
                        <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 'bold' }}>{selectedReport.location}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '14px', color: '#475569', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Incident Description</h3>
                    <p style={{ fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: 0 }}>
                      {selectedReport.description}
                    </p>
                  </div>

                  {/* ACTION FORM */}
                  <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '30px' }}>
                    <h3 style={{ fontSize: '16px', color: '#0f172a', marginBottom: '20px' }}>Case Resolution & Updates</h3>
                    
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label style={{ fontWeight: 'bold', color: '#475569' }}>Change Status</label>
                      <select 
                        className="form-input" 
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        style={{ maxWidth: '300px' }}
                      >
                        <option value="Pending">Pending Review</option>
                        <option value="In Progress">Active / In Progress</option>
                        <option value="Resolved">Resolved / Closed</option>
                        <option value="Dismissed">Dismissed</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label style={{ fontWeight: 'bold', color: '#475569' }}>Official Admin Remarks (Visible to Resident)</label>
                      <textarea 
                        className="form-input"
                        rows="4"
                        placeholder="Provide investigation details, resolution notes, or next steps for the resident..."
                        value={adminRemarks}
                        onChange={(e) => setAdminRemarks(e.target.value)}
                      />
                    </div>

                    <button 
                      className="btn primary" 
                      onClick={handleUpdateStatus} 
                      disabled={updating || (newStatus === selectedReport.status && adminRemarks === (selectedReport.adminRemarks || ''))}
                      style={{ padding: '12px 24px', fontSize: '15px', width: 'auto' }}
                    >
                      {updating ? 'Saving Update...' : 'Save Case Update'}
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

export default BlotterManagement;
