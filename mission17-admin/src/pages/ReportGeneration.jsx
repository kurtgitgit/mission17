import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Printer, FileText, Calendar, Filter, FileBarChart, Users, Target, AlertTriangle, TrendingUp, Download, Briefcase, FileSignature, ChevronDown } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import '../styles/DashboardHome.css';
import '../styles/Print.css';
import { endpoints } from '../config/api';
import logoImg from '../assets/logo.png';

const ReportGeneration = () => {
  const [reportType, setReportType] = useState('blotter'); // blotter, documents, users, analytics
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filterByDate = (arr) => {
    if (!startDate && !endDate) return arr;
    if (!Array.isArray(arr)) return arr;
    return arr.filter(item => {
      const d = new Date(item.createdAt || item.date || item.timestamp);
      if (isNaN(d.getTime())) return true; // If no valid date, keep it just in case
      if (startDate && d < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      return true;
    });
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (reportType === 'analytics') {
        const headers = { Authorization: `Bearer ${token}`, 'auth-token': token };
        const [submRes, userRes, docRes, blotterRes] = await Promise.all([
          axios.get(endpoints.submissions.stats, { headers }),
          axios.get(endpoints.users.getAll, { headers }),
          axios.get(`${endpoints.auth.backendBaseUrl}/api/document-requests`, { headers }),
          axios.get(`${endpoints.auth.backendBaseUrl}/api/blotter-reports`, { headers })
        ]);
        
        const rawSubs = Array.isArray(submRes.data) ? submRes.data : (submRes.data.submissions || []);
        const subs = filterByDate(rawSubs);
        const approvedSubs = subs.filter(s => s.status === 'Approved').length;
        
        let usersArr = userRes.data.data || userRes.data;
        if (!Array.isArray(usersArr)) usersArr = [];
        const filteredUsers = filterByDate(usersArr);

        const docs = filterByDate(docRes.data || []);
        const blotters = filterByDate(blotterRes.data || []);

        setData({
          users: filteredUsers.length || 0,
          documents: docs.length || 0,
          blotters: blotters.length || 0,
          submissions: subs.length || 0,
          approvedSubmissions: approvedSubs || 0
        });
      } else {
        let url = '';
        if (reportType === 'blotter') url = `${endpoints.auth.backendBaseUrl}/api/blotter-reports`;
        else if (reportType === 'documents') url = `${endpoints.auth.backendBaseUrl}/api/document-requests`;
        else if (reportType === 'users') url = endpoints.users.getAll;
        else if (reportType === 'missions') url = endpoints.missions.getAll;

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}`, 'auth-token': token }
        });
        
        // Handle paginated endpoints (like users) or standard arrays
        let rawArr = res.data.data || res.data.users || res.data.missions || res.data;
        if (!Array.isArray(rawArr)) rawArr = [];
        
        setData(filterByDate(rawArr));
      }
    } catch (err) {
      console.error('Error fetching report data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [reportType, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const getReportTitle = () => {
    switch(reportType) {
      case 'blotter': return 'OFFICIAL BLOTTER INCIDENT REPORT';
      case 'documents': return 'BARANGAY DOCUMENT ISSUANCE LOG';
      case 'users': return 'REGISTERED RESIDENTS DIRECTORY';
      case 'missions': return 'CIVIC TASKS AND SDG CONTRIBUTIONS';
      case 'analytics': return 'BARANGAY ANALYTICS SUMMARY';
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
      case 'analytics': return (
        <tr>
          <th>Metric Name</th>
          <th>Total Count</th>
          <th>Status / Description</th>
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

  const renderAnalyticsRows = () => {
    return (
      <>
        <tr>
          <td style={{ fontWeight: 'bold' }}>Registered Residents</td>
          <td style={{ fontSize: '18px', fontWeight: 'bold' }}>{data.users}</td>
          <td>Total accounts in the system</td>
        </tr>
        <tr>
          <td style={{ fontWeight: 'bold' }}>Civic Task Submissions</td>
          <td style={{ fontSize: '18px', fontWeight: 'bold' }}>{data.submissions}</td>
          <td>Total tasks submitted by residents</td>
        </tr>
        <tr>
          <td style={{ fontWeight: 'bold' }}>Approved Civic Tasks</td>
          <td style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a' }}>{data.approvedSubmissions}</td>
          <td>Verified and recorded on blockchain</td>
        </tr>
        <tr>
          <td style={{ fontWeight: 'bold' }}>Document Requests</td>
          <td style={{ fontSize: '18px', fontWeight: 'bold' }}>{data.documents}</td>
          <td>Total certificates/clearances requested</td>
        </tr>
        <tr>
          <td style={{ fontWeight: 'bold' }}>Blotter Reports</td>
          <td style={{ fontSize: '18px', fontWeight: 'bold' }}>{data.blotters}</td>
          <td>Total incidents reported to barangay</td>
        </tr>
      </>
    );
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
                <button className={`report-type-btn ${reportType === 'analytics' ? 'active' : ''}`} onClick={() => setReportType('analytics')}>
                  <TrendingUp size={16} /> Analytics Summary
                </button>
              </div>

              <div style={{ marginTop: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px', color: '#475569' }}>DATE RANGE (Optional)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="date" className="form-input" style={{ padding: '8px' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
                  <input type="date" className="form-input" style={{ padding: '8px' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
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
                  <div className="report-letterhead" style={{ display: 'flex', justifyContent: 'center' }}>
                    <div className="letterhead-text" style={{ textAlign: 'center' }}>
                      <p className="lh-republic">Republic of the Philippines</p>
                      <p className="lh-province">Province of Pangasinan</p>
                      <p className="lh-city">Municipality of San Jacinto</p>
                      <h2 className="lh-brgy">BARANGAY BAGONG PAG-ASA</h2>
                    </div>
                  </div>
                  
                  <div className="report-divider"></div>

                  <div className="report-header-info">
                    <h3 className="report-title">{getReportTitle()}</h3>
                    <p className="report-date">
                      Generated on: <strong>{new Date().toLocaleString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                    </p>
                  </div>

                  {(!data || (Array.isArray(data) && data.length === 0)) ? (
                    <div className="empty-state" style={{ marginTop: '50px' }}>
                      <FileBarChart size={48} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
                      <h3 style={{ color: '#64748b' }}>No data available for this report.</h3>
                    </div>
                  ) : (
                    <table className="report-table">
                      <thead>{renderTableHeaders()}</thead>
                      <tbody>{reportType === 'analytics' ? renderAnalyticsRows() : renderTableRows()}</tbody>
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
