import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { 
  CheckCircle, XCircle, Clock, FileImage, User, 
  Sparkles, X, AlertTriangle, ExternalLink, ShieldCheck,
  HelpCircle, Leaf, Recycle, Droplets, Heart, BookOpen,
  Zap, Building2, ShoppingBag
} from 'lucide-react'; 
import '../../styles/Verify.css';
import { endpoints } from '../../config/api';

const CONTRACT_URL = "https://sepolia.etherscan.io/address/0x79f116E8e42788C07B384615872A1aD1c24b2e40";

// ==========================================
// VERDICT CONFIG - drives all styling
// ==========================================
const VERDICT_CONFIG = {
  VERIFIED:  { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: CheckCircle,  label: 'Verified' },
  REJECTED:  { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: XCircle,       label: 'Rejected' },
  UNCERTAIN: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: HelpCircle,    label: 'Uncertain' },
};

// SDG icon mapping - picks a relevant icon per SDG label
const sdgIcon = (sdg) => {
  if (!sdg || sdg === 'N/A') return null;
  if (sdg.includes('13') || sdg.includes('15')) return <Leaf    size={12} />;
  if (sdg.includes('12'))                        return <Recycle  size={12} />;
  if (sdg.includes('6')  || sdg.includes('14')) return <Droplets size={12} />;
  if (sdg.includes('3'))                         return <Heart    size={12} />;
  if (sdg.includes('4'))                         return <BookOpen size={12} />;
  if (sdg.includes('7'))                         return <Zap      size={12} />;
  if (sdg.includes('11'))                        return <Building2 size={12} />;
  if (sdg.includes('8'))                         return <ShoppingBag size={12} />;
  return null;
};

const shapeReport = (report) => ({
  status:     report.verdict,
  isPositive: report.isVerified,
  isPlanting: report.sdg && report.sdg.includes('13'),
  prediction: report.prediction,
  message:    report.message,
  sdg:        report.sdg,
  reasons: [
    `Detected: ${report.prediction}`,
    ...(report.sdg && report.sdg !== 'N/A' ? [`SDG: ${report.sdg}`] : []),
    `${report.message}`,
  ],
});

const Verify = () => {
  const [submissions, setSubmissions]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [viewImage, setViewImage]       = useState(null);
  const [analyzingId, setAnalyzingId]   = useState(null);
  const [analysisResults, setAnalysisResults] = useState({});

  const getToken = () => localStorage.getItem('token');

  useEffect(() => { fetchSubmissions(); }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(endpoints.submissions.pending, {
        headers: { 'auth-token': getToken() }
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
        const preloaded = {};
        data.forEach(sub => {
          if (sub.analysisReport) preloaded[sub._id] = shapeReport(sub.analysisReport);
        });
        setAnalysisResults(preloaded);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (submission) => {
    setAnalyzingId(submission._id);
    try {
      const backendResponse = await fetch(endpoints.submissions.analyzeProof, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'auth-token': getToken() },
        body: JSON.stringify({ submissionId: submission._id })
      });
      const data = await backendResponse.json();
      if (!backendResponse.ok) throw new Error(data.message || 'Analysis failed');
      setAnalysisResults(prev => ({
        ...prev,
        [submission._id]: {
          status:     data.verdict,
          isPositive: data.isVerified,
          isPlanting: data.sdg && data.sdg.includes('13'),
          prediction: data.prediction,
          message:    data.message,
          sdg:        data.sdg,
          reasons: [
            `Detected: ${data.prediction}`,
            ...(data.sdg && data.sdg !== 'N/A' ? [`SDG: ${data.sdg}`] : []),
            `${data.message}`,
          ],
        }
      }));
    } catch (error) {
      console.error('AI Analysis Error:', error);
      alert(`AI Analysis Failed: ${error.message}`);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleViewProof = async (sub) => {
    if (!sub.hasImage) return;
    try {
      const res = await fetch(`${endpoints.auth.baseUrl}/submission-image/${sub._id}`, {
        headers: { 'auth-token': getToken() }
      });
      const data = await res.json();
      if (data.imageUri) setViewImage(data.imageUri);
    } catch (e) { console.error('Failed to load proof image:', e); }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this mission?')) return;
    try {
      const res = await fetch(endpoints.submissions.approve, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'auth-token': getToken() },
        body: JSON.stringify({ submissionId: id })
      });
      if (res.ok) setSubmissions(submissions.filter(s => s._id !== id));
    } catch (e) { console.error(e); }
  };

  const handleReject = async (id) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    try {
      const res = await fetch(endpoints.submissions.reject, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'auth-token': getToken() },
        body: JSON.stringify({ submissionId: id, reason })
      });
      if (res.ok) setSubmissions(submissions.filter(s => s._id !== id));
    } catch (e) { console.error(e); }
  };

  const openBlockchain = () => window.open(CONTRACT_URL, '_blank');

  return (
    <Layout title="Verify Proofs">
      <div className="verify-container">

        {/* PAGE HEADER */}
        <div className="verify-header">
          <div>
            <h1 className="page-title">Verify Proofs</h1>
            <p className="page-subtitle">AI-Powered Verification Panel - Python Engine</p>
          </div>
          <div className="header-stat">
            <span className="header-stat-number">{submissions.length}</span>
            <span className="header-stat-label">Pending</span>
          </div>
        </div>

        {/* IMAGE MODAL */}
        {viewImage && (
          <div className="modal-overlay" onClick={() => setViewImage(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="close-modal" onClick={() => setViewImage(null)}>
                <X size={24} color="#fff" />
              </button>
              <img src={viewImage} alt="Evidence" className="modal-image" />
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={48} color="#16a34a" />
            <h3>All caught up!</h3>
            <p>No pending submissions to review.</p>
          </div>
        ) : (
          <div className="submissions-list">
            {submissions.map((sub) => {
              const aiResult  = analysisResults[sub._id];
              const hasImage  = sub.hasImage;
              const isFlagged = sub.status === 'Pending Admin Review';
              const vc        = aiResult ? (VERDICT_CONFIG[aiResult.status] || VERDICT_CONFIG.UNCERTAIN) : null;
              const VerdictIcon = vc?.icon;

              return (
                <div
                  key={sub._id}
                  className="verify-card"
                  style={vc ? { borderLeft: `4px solid ${vc.color}` } : {}}
                >
                  {/* LEFT: User info */}
                  <div className="info-section">
                    <div className="user-avatar"><User size={20} /></div>
                    <div className="text-details">
                      <h3 className="user-name">{sub.username}</h3>
                      <p className="mission-name">{sub.missionTitle}</p>

                      <div className="badge-row">
                        {isFlagged && (
                          <span className="badge badge-spot">
                            <AlertTriangle size={10} /> Spot Check
                          </span>
                        )}
                        <span className="badge badge-chain">
                          <ShieldCheck size={10} /> On-Chain
                        </span>
                        <span className="badge badge-date">
                          <Clock size={10} /> {new Date(sub.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CENTRE: AI Result */}
                  <div className="proof-section">
                    {aiResult ? (
                      <div
                        className="ai-result-card"
                        style={{ background: vc.bg, border: `1px solid ${vc.border}` }}
                      >
                        {/* Verdict header */}
                        <div className="ai-verdict-header" style={{ color: vc.color }}>
                          <VerdictIcon size={16} strokeWidth={2.5} />
                          <span className="ai-verdict-label">{vc.label}</span>
                          {aiResult.sdg && aiResult.sdg !== 'N/A' && (
                            <span className="sdg-chip" style={{ background: vc.color }}>
                              {sdgIcon(aiResult.sdg)}
                              {aiResult.sdg}
                            </span>
                          )}
                        </div>

                        {/* Prediction row */}
                        <div className="ai-prediction">
                          <span className="ai-label">Detected</span>
                          <code className="ai-class">{aiResult.prediction?.replace(/_/g, ' ')}</code>
                        </div>

                        {/* Message */}
                        <p className="ai-message">{aiResult.message?.replace(/^[\s\S]{2}\s/, '')}</p>

                        {/* Re-scan button */}
                        <button
                          className="rescan-btn"
                          onClick={() => handleAnalyze(sub)}
                          disabled={analyzingId === sub._id}
                        >
                          <Sparkles size={11} />
                          {analyzingId === sub._id ? 'Scanning...' : 'Re-scan'}
                        </button>
                      </div>
                    ) : (
                      <div className="ai-pending-box">
                        <p className="ai-pending-msg">No AI analysis yet</p>
                        <button
                          className="ai-scan-btn"
                          onClick={() => handleAnalyze(sub)}
                          disabled={analyzingId === sub._id || !hasImage}
                        >
                          {analyzingId === sub._id
                            ? <><span className="btn-spinner" /> Analyzing...</>
                            : <><Sparkles size={13} /> Run AI Scan</>}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* RIGHT: Actions */}
                  <div className="action-section">
                    <button
                      className="btn-view"
                      onClick={() => handleViewProof(sub)}
                      disabled={!hasImage}
                      title={hasImage ? 'View submitted proof image' : 'No image available'}
                    >
                      <FileImage size={15} />
                      Proof
                    </button>
                    <button
                      className="btn-ledger"
                      onClick={openBlockchain}
                      title="View on Sepolia Etherscan"
                    >
                      <ExternalLink size={15} />
                      Ledger
                    </button>
                    <div className="action-divider" />
                    <button onClick={() => handleApprove(sub._id)} className="btn-approve">
                      <CheckCircle size={15} /> Approve
                    </button>
                    <button onClick={() => handleReject(sub._id)} className="btn-reject">
                      <XCircle size={15} /> Reject
                    </button>
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
