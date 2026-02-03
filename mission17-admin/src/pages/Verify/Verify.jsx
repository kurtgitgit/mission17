import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { CheckCircle, XCircle, Clock, FileImage, User, Sparkles, X, AlertTriangle } from 'lucide-react';
import '../../styles/Verify.css';

const Verify = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Image Modal State
  const [viewImage, setViewImage] = useState(null);

  // AI State
  const [analyzingId, setAnalyzingId] = useState(null);
  const [analysisResults, setAnalysisResults] = useState({});

  const API_BASE = "http://localhost:5001/api/auth";
  const AI_URL = "http://127.0.0.1:8000/analyze-image"; // 👈 Connects to Python

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`${API_BASE}/pending-submissions`);
      const data = await response.json();
      if (response.ok) {
        setSubmissions(data);
      }
    } catch (error) { console.error("Error fetching submissions:", error); } 
    finally { setLoading(false); }
  };

  // 🧠 NEW: Connects to your Python "Mission 17 AI"
  const handleAnalyze = async (submission) => {
    // 1. Validation
    if (!submission.imageUri) {
        alert("No image data found for this submission.");
        return;
    }

    setAnalyzingId(submission._id);

    try {
      // 2. Prepare the Image File
      // We fetch the image from your backend to create a standard file object
      const res = await fetch(submission.imageUri);
      const blob = await res.blob();
      const file = new File([blob], "proof.jpg", { type: "image/jpeg" });

      // 3. Prepare Form Data for Python
      const formData = new FormData();
      formData.append('file', file);
      
      // Tell AI what the mission is (e.g., "planting trees")
      formData.append('labels', submission.missionTitle || "community service"); 

      // 4. Send to Python AI Server (Port 8000)
      console.log(`Sending to AI Brain at ${AI_URL}...`);
      const aiResponse = await fetch(AI_URL, {
          method: 'POST',
          body: formData
      });

      const data = await aiResponse.json();
      console.log("AI Verdict:", data);

      // 5. Interpret Results
      let score = 0;
      let reasons = [];
      let status = "Low";

      if (!data.valid) {
          // AI Rejected it (Deepfake or completely wrong topic)
          reasons.push(`❌ ${data.message}`);
          if (data.deepfake_confidence > 0.8) {
             reasons.push(`⚠️ HIGH RISK: ${Math.round(data.deepfake_confidence * 100)}% likely AI-generated.`);
          }
          status = "FAKE / INVALID";
      } else {
          // AI Approved it
          const aiConfidence = Math.round((data.sdg_score || 0) * 100);
          score = aiConfidence;
          
          reasons.push(`✅ Verified Activity: ${data.sdg_label}`);
          reasons.push(`Confidence: ${aiConfidence}%`);
          
          if (data.deepfake_confidence < 0.5) {
              reasons.push("✅ Authenticity Check Passed (Real Photo)");
          }

          status = aiConfidence > 75 ? "High Confidence" : "Medium Confidence";
      }

      setAnalysisResults(prev => ({
          ...prev,
          [submission._id]: { score, status, reasons }
      }));

    } catch (error) {
      console.error("AI Server Error:", error);
      alert("Could not connect to AI Server. Is the Python script running on Port 8000?");
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve mission?")) return;
    try {
      const res = await fetch(`${API_BASE}/approve-mission`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({submissionId: id}) });
      if (res.ok) {
        setSubmissions(submissions.filter(s => s._id !== id));
      }
    } catch (e) { console.error(e); }
  };

  const handleReject = async (id) => {
    const reason = prompt("Reason:");
    if (!reason) return;
    try {
      const res = await fetch(`${API_BASE}/reject-mission`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({submissionId: id, reason}) });
      if (res.ok) {
        setSubmissions(submissions.filter(s => s._id !== id));
      }
    } catch (e) { console.error(e); }
  };

  return (
    <Layout>
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
          <div className="empty-state"><CheckCircle size={48} color="#16a34a" /><h3>All caught up!</h3></div>
        ) : (
          <div className="submissions-list">
            {submissions.map((sub) => {
              const aiResult = analysisResults[sub._id];
              const hasImage = sub.imageUri && sub.imageUri.length > 5; 

              return (
                <div key={sub._id} className="verify-card">
                  
                  <div className="info-section">
                    <div className="user-avatar"><User size={20} /></div>
                    <div className="text-details">
                      <h3 className="user-name">{sub.username}</h3>
                      <p className="mission-name">Mission: <strong>{sub.missionTitle}</strong></p>
                      <span className="date-badge"><Clock size={12} /> {new Date(sub.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="proof-section">
                    {/* View Proof Button */}
                    <button 
                      className={`view-proof-btn ${!hasImage ? 'disabled' : ''}`}
                      onClick={() => hasImage && setViewImage(sub.imageUri)}
                      disabled={!hasImage}
                      style={{ opacity: hasImage ? 1 : 0.5, cursor: hasImage ? 'pointer' : 'not-allowed' }}
                    >
                      {hasImage ? <FileImage size={16} /> : <AlertTriangle size={16} />} 
                      {hasImage ? 'View Proof' : 'No Image'}
                    </button>

                    {/* AI Button or Result Badge */}
                    {aiResult ? (
                        <div className="ai-result-box">
                            <div className={`ai-badge ${aiResult.status.includes('High') ? 'high' : aiResult.status.includes('FAKE') ? 'low' : 'med'}`}>
                               <Sparkles size={12} /> <span>{aiResult.status}</span>
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
                            style={{ opacity: hasImage ? 1 : 0.5, cursor: hasImage ? 'pointer' : 'not-allowed' }}
                        >
                            {analyzingId === sub._id ? 'Scanning...' : <><Sparkles size={14} /> AI Scan</>}
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