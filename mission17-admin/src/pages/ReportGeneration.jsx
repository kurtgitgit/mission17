import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Printer, FileText, Calendar, Filter, FileBarChart, Users, Target, AlertTriangle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import '../styles/DashboardHome.css';
import '../styles/Print.css';

const ReportGeneration = () => {
  const [reportType, setReportType] = useState('blotter'); // blotter, documents, users, missions
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      
      if (reportType === 'blotter') endpoint = '/api/blotter-reports';
      else if (reportType === 'documents') endpoint = '/api/document-requests';
      else if (reportType === 'users') endpoint = '/api/auth/admin/users';
      else if (reportType === 'missions') endpoint = '/api/auth/missions';

      const res = await axios.get(`http://localhost:5001${endpoint}`, {
        headers: { Authorization: `Bearer ${token}`, 'auth-token': token }
      });
      
      setData(res.data.users || res.data.missions || res.data);
    } catch (err) {
      console.error('Error fetching report data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [reportType]);

  const handlePrint = () => {
    window.print();
  };

  const getReportTitle = () => {
    switch(reportType) {
      case 'blotter': return 'OFFICIAL BLOTTER INCIDENT REPORT';
      case 'documents': return 'BARANGAY DOCUMENT ISSUANCE LOG';
      case 'users': return 'REGISTERED RESIDENTS DIRECTORY';
      case 'missions': return 'CIVIC TASKS AND SDG CONTRIBUTIONS';
      default: return 'OFFICIAL BARANGAY REPORT';
    }
  };

  const renderTableHeaders = () => {
    switch(reportType) {
      case 'blotter': return (
        <tr>
          <th>Reference #</th>
          <th>Date</th>
          <th>Incident Type</th>
          <th>Resident</th>
          <th>Status</th>
        </tr>
      );
      case 'documents': return (
        <tr>
          <th>Reference #</th>
          <th>Date</th>
          <th>Document</th>
          <th>Resident</th>
          <th>Status</th>
        </tr>
      );
      case 'users': return (
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Joined</th>
        </tr>
      );
      case 'missions': return (
        <tr>
          <th>Title</th>
          <th>SDG</th>
          <th>Points</th>
          <th>Status</th>
        </tr>
      );
      default: return null;
    }
  };

  const renderTableRows = () => {
    return data.map((item, index) => {
      switch(reportType) {
        case 'blotter': return (
          <tr key={index}>
            <td>{item.referenceNumber}</td>
            <td>{new Date(item.dateOfIncident || item.createdAt).toLocaleDateString()}</td>
            <td>{item.incidentType}</td>
            <td>{item.username || item.userId?.username || 'Resident'}</td>
            <td>{item.status}</td>
          </tr>
        );
        case 'documents': return (
          <tr key={index}>
            <td>{item.referenceNumber}</td>
            <td>{new Date(item.createdAt).toLocaleDateString()}</td>
            <td>{item.documentType}</td>
            <td>{item.fullName}</td>
            <td>{item.status}</td>
          </tr>
        );
        case 'users': return (
          <tr key={index}>
            <td>{item.username}</td>
            <td>{item.email}</td>
            <td>{item.isAdmin ? 'Admin' : 'Resident'}</td>
            <td>{new Date(item.createdAt).toLocaleDateString()}</td>
          </tr>
        );
        case 'missions': return (
          <tr key={index}>
            <td>{item.title}</td>
            <td>{item.sdgCategory}</td>
            <td>{item.points}</td>
            <td>{item.status || 'Active'}</td>
          </tr>
        );
        default: return null;
      }
    });
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content hide-on-print" style={{ paddingBottom: '50px' }}>
        <header className="top-header">
          <div>
            <h1 className="greeting">Report Generation</h1>
            <p className="subtitle">Configure and generate official barangay documents</p>
          </div>
          
          <div className="header-actions">
            <button className="btn primary" onClick={handlePrint} disabled={loading || data.length === 0} style={{ padding: '12px 24px', fontSize: '15px' }}>
              <Printer size={20} style={{ marginRight: '8px' }} /> Print / Export PDF
            </button>
          </div>
        </header>

        <div className="report-layout">
          {/* LEFT: CONTROLS */}
          <div className="report-controls">
            <div className="table-card">
              <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0038A8' }}>
                <Filter size={18} /> Report Settings
              </h3>
              
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px', color: '#475569' }}>DATA SOURCE</label>
              <div className="report-type-grid">
                <button className={`report-type-btn ${reportType === 'blotter' ? 'active' : ''}`} onClick={() => setReportType('blotter')}>
                  <AlertTriangle size={16} /> Blotter Logs
                </button>
                <button className={`report-type-btn ${reportType === 'documents' ? 'active' : ''}`} onClick={() => setReportType('documents')}>
                  <FileText size={16} /> Document Issuances
                </button>
                <button className={`report-type-btn ${reportType === 'users' ? 'active' : ''}`} onClick={() => setReportType('users')}>
                  <Users size={16} /> Registered Residents
                </button>
                <button className={`report-type-btn ${reportType === 'missions' ? 'active' : ''}`} onClick={() => setReportType('missions')}>
                  <Target size={16} /> Civic Tasks & SDGs
                </button>
              </div>

              <div style={{ marginTop: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px', color: '#475569' }}>DATE RANGE (Optional)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="date" className="form-input" style={{ padding: '8px' }} />
                  <input type="date" className="form-input" style={{ padding: '8px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: A4 PREVIEW */}
          <div className="report-preview-container">
            <div className="report-paper print-only-layout">
              {loading ? (
                <div className="loading-state" style={{ marginTop: '100px' }}>Gathering report data...</div>
              ) : (
                <>
                  {/* LETTERHEAD */}
                  <div className="report-letterhead">
                    <div className="letterhead-logo">🇵🇭</div>
                    <div className="letterhead-text">
                      <p className="lh-republic">Republic of the Philippines</p>
                      <p className="lh-province">Province of Pangasinan</p>
                      <p className="lh-city">City of Dagupan</p>
                      <h2 className="lh-brgy">BARANGAY PANTAL</h2>
                    </div>
                    <div className="letterhead-logo logo-yellow">🏛️</div>
                  </div>
                  
                  <div className="report-divider"></div>

                  <div className="report-header-info">
                    <h3 className="report-title">{getReportTitle()}</h3>
                    <p className="report-date">
                      Generated on: <strong>{new Date().toLocaleString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                    </p>
                  </div>

                  {data.length === 0 ? (
                    <div className="empty-state" style={{ marginTop: '50px' }}>
                      <FileBarChart size={48} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
                      <h3 style={{ color: '#64748b' }}>No data available for this report.</h3>
                    </div>
                  ) : (
                    <table className="report-table">
                      <thead>{renderTableHeaders()}</thead>
                      <tbody>{renderTableRows()}</tbody>
                    </table>
                  )}

                  <div className="report-signatures">
                    <div className="sig-block">
                      <div className="sig-line"></div>
                      <p className="sig-name">Prepared By</p>
                      <p className="sig-title">Barangay Secretary</p>
                    </div>
                    <div className="sig-block">
                      <div className="sig-line"></div>
                      <p className="sig-name">Certified Correct</p>
                      <p className="sig-title">Punong Barangay</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportGeneration;
