import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { 
  CheckCircle, XCircle, Clock, FileImage, User, 
  Sparkles, X, AlertTriangle, ExternalLink, ShieldCheck 
} from 'lucide-react'; 
import '../../styles/Verify.css';

// 🔗 YOUR SMART CONTRACT ADDRESS (POINTS LEDGER)
// ✅ UPDATED: Your confirmed Proxy Address
const CONTRACT_URL = "https://sepolia.etherscan.io/address/0x79f116E8e42788C07B384615872A1aD1c24b2e40";

const Verify = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Image Modal State
  const [viewImage, setViewImage] = useState(null);

  // AI State
  const [analyzingId, setAnalyzingId] = useState(null);
  const [analysisResults, setAnalysisResults] = useState({});

  const API_BASE = "http://localhost:5001/api/auth";

  // Helper to get token
  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`${API_BASE}/pending-submissions`, {
        headers: { 'auth-token': getToken() }
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) { 
      console.error("Error fetching submissions:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleAnalyze = async (submission) => {
    if (!submission.imageUri) {
        alert("No image data found for this submission.");
        return;
    }

    setAnalyzingId(submission._id);

    try {
      // 🔒 SECURE: Call Backend Proxy instead of Python AI directly
      // 🛡️ SECURE CODE: Secure Proxy Call.
      // The frontend never talks to the AI directly, preventing Model Inversion attacks.
      const backendResponse = await fetch(`${API_BASE}/analyze-proof`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'auth-token': getToken()
          },
          body: JSON.stringify({ submissionId: submission._id })
      });

      const data = await backendResponse.json();

      if (!backendResponse.ok) throw new Error(data.message || "Analysis failed");

      let reasons = [];
      // Backend now returns sanitized data matching app.py's new logic
      let status = data.verdict; 
      let isPositive = data.isVerified;

      reasons.push(`🏷️ Detected: ${data.prediction}`);
      
      if (data.sdg && data.sdg !== "N/A") {
        reasons.push(`🌍 ${data.sdg} Verified`);
      }
      
      // Note: Confidence score is HIDDEN from frontend for security
      reasons.push(`📝 ${data.message}`);

      setAnalysisResults(prev => ({
          ...prev,
          [submission._id]: { 
            status, 
            reasons, 
            isPositive, 
            isPlanting: data.sdg && data.sdg.includes("13") // Simple check for UI styling
          }
      }));

    } catch (error) {
      console.error("AI Analysis Error:", error);
      alert(`AI Analysis Failed: ${error.message}`);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve mission?")) return;
    try {
      const res = await fetch(`${API_BASE}/approve-mission`, { 
        method: 'POST', 
        headers: {
            'Content-Type':'application/json',
            'auth-token': getToken()
        }, 
        body: JSON.stringify({submissionId: id}) 
      });
      if (res.ok) setSubmissions(submissions.filter(s => s._id !== id));
    } catch (e) { console.error(e); }
  };

  const handleReject = async (id) => {
    const reason = prompt("Reason for rejection:");
    if (!reason) return;
    try {
      const res = await fetch(`${API_BASE}/reject-mission`, { 
        method: 'POST', 
        headers: {
            'Content-Type':'application/json',
            'auth-token': getToken()
        }, 
        body: JSON.stringify({submissionId: id, reason}) 
      });
      if (res.ok) setSubmissions(submissions.filter(s => s._id !== id));
    } catch (e) { console.error(e); }
  };

  const openBlockchain = () => {
    window.open(CONTRACT_URL, '_blank');
  };

  return (
    <Layout title="Verify Proofs">
      <div className="verify-container">
        <div className="verify-header">
          <h1 className="page-title">Verify Proofs</h1>
          <p className="page-subtitle">AI-Powered Verification Panel (Python Engine)</p>
        </div>

        {/* IMAGE POPUP MODAL */}
        {viewImage && (
          <div className="modal-overlay" onClick={() => setViewImage(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-modal" onClick={() => setViewImage(null)}>
                <X size={24} color="#fff" />
              </button>
              <img src={viewImage} alt="Evidence" className="modal-image" />
            </div>
          </div>
        )}

        {loading ? <p>Loading...</p> : submissions.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={48} color="#16a34a" />
            <h3>All caught up!</h3>
            <p>No pending submissions to review.</p>
          </div>
        ) : (
          <div className="submissions-list">
            {submissions.map((sub) => {
              const aiResult = analysisResults[sub._id];
              const hasImage = sub.imageUri && sub.imageUri.length > 5; 
              const isFlagged = sub.status === 'Pending Admin Review';

              return (
                <div key={sub._id} className="verify-card">
                  
                  <div className="info-section">
                    <div className="user-avatar"><User size={20} /></div>
                    <div className="text-details">
                      <h3 className="user-name">{sub.username}</h3>
                      <p className="mission-name">Mission: <strong>{sub.missionTitle}</strong></p>
                      
                      {isFlagged && (
                        <div style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: '4px', 
                          backgroundColor: '#fff7ed', color: '#c2410c', 
                          padding: '2px 8px', borderRadius: '4px', 
                          fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid #fdba74',
                          marginBottom: '6px'
                        }}>
                          <AlertTriangle size={12} />
                          <span>Security Spot Check</span>
                        </div>
                      )}
                      
                      <div className="blockchain-tag">
                        <ShieldCheck size={12} color="#10b981" /> 
                        <span style={{color: '#10b981', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: 4}}>Blockchain Verified</span>
                      </div>
                      <span className="date-badge"><Clock size={12} /> {new Date(sub.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="proof-section">
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <button 
                          className={`view-proof-btn ${!hasImage ? 'disabled' : ''}`}
                          onClick={() => hasImage && setViewImage(sub.imageUri)}
                          disabled={!hasImage}
                        >
                          {hasImage ? <FileImage size={16} /> : <AlertTriangle size={16} />} 
                          {hasImage ? 'View Proof' : 'No Image'}
                        </button>

                        <button 
                            className="view-proof-btn" 
                            onClick={openBlockchain}
                            style={{ backgroundColor: '#fff', color: '#334155', border: '1px solid #cbd5e1' }}
                            title="View Public Ledger"
                        >
                            <ExternalLink size={16} color="#3b82f6" />
                            <span style={{marginLeft: 6}}>Ledger</span>
                        </button>
                    </div>

                    {aiResult ? (
                        <div className="ai-result-box" style={{ 
                            borderLeft: `4px solid ${aiResult.isPlanting ? '#065f46' : aiResult.isPositive ? '#16a34a' : '#ef4444'}`,
                            backgroundColor: aiResult.isPlanting ? '#ecfdf5' : aiResult.isPositive ? '#f0fdf4' : '#fef2f2'
                        }}>
                            <div className="ai-badge" style={{ 
                                color: aiResult.isPlanting ? '#065f46' : aiResult.isPositive ? '#16a34a' : '#ef4444',
                                fontWeight: 'bold'
                            }}>
                               <Sparkles size={14} /> <span>{aiResult.status}</span>
                            </div>
                            <ul className="ai-reasons">
                                {aiResult.reasons.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                        </div>
                    ) : (
                        <button 
                            className="ai-scan-btn" 
                            onClick={() => handleAnalyze(sub)} 
                            disabled={analyzingId === sub._id || !hasImage}
                        >
                            {analyzingId === sub._id ? 'Analyzing...' : <><Sparkles size={14} /> Run AI Scan</>}
                        </button>
                    )}
                  </div>

                  <div className="action-section">
                    <button onClick={() => handleApprove(sub._id)} className="btn-approve"><CheckCircle size={18} /> Approve</button>
                    <button onClick={() => handleReject(sub._id)} className="btn-reject"><XCircle size={18} /> Reject</button>
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

export default Verify;