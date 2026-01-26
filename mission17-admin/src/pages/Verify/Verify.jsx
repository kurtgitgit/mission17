import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { CheckCircle, XCircle, Clock, FileImage, User } from 'lucide-react';
import '../../styles/Verify.css';

const Verify = () => {
  // 1. Initialize with an empty array to be filled by the backend
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = "http://localhost:5001/api/auth";

  // 2. Fetch pending missions on load
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
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Updated Approve Action (Sends to Backend)
  const handleApprove = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/approve-mission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: id })
      });

      if (response.ok) {
        alert(`Mission Approved and points awarded!`);
        // Remove from the local list so it disappears instantly
        setSubmissions(submissions.filter(sub => sub._id !== id));
      } else {
        alert("Failed to approve mission.");
      }
    } catch (error) {
      console.error("Approval error:", error);
    }
  };

  // Handle Reject Action (UI only for now)
  // Handle Reject Action
  const handleReject = async (id) => {
    const reason = prompt("Enter reason for rejection:");
    
    if (reason) {
      try {
        const response = await fetch(`${API_BASE}/reject-mission`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            submissionId: id,
            reason: reason 
          })
        });

        if (response.ok) {
          alert(`Mission Rejected. Reason: ${reason}`);
          // Remove from local list
          setSubmissions(submissions.filter(sub => sub._id !== id));
        } else {
          alert("Failed to send rejection to server.");
        }
      } catch (error) {
        console.error("Rejection error:", error);
      }
    }
  };

  return (
    <Layout>
      <div className="verify-container">
        <div className="verify-header">
          <h1 className="page-title">Verify Proofs</h1>
          <p className="page-subtitle">Review and approve agent mission submissions.</p>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', marginTop: '40px' }}>Loading submissions...</p>
        ) : submissions.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={48} color="#16a34a" />
            <h3>All caught up!</h3>
            <p>No pending submissions to verify.</p>
          </div>
        ) : (
          <div className="submissions-list">
            {submissions.map((sub) => (
              <div key={sub._id} className="verify-card">
                
                {/* Left: User Info */}
                <div className="info-section">
                  <div className="user-avatar">
                    <User size={20} />
                  </div>
                  <div className="text-details">
                    <h3 className="user-name">{sub.username}</h3>
                    <p className="mission-name">Completed: <strong>{sub.missionTitle}</strong></p>
                    <span className="date-badge">
                      <Clock size={12} /> {new Date(sub.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Middle: Proof Button */}
                <div className="proof-section">
                  <button 
                    className="view-proof-btn" 
                    onClick={() => sub.imageUri && window.open(sub.imageUri, '_blank')}
                  >
                    <FileImage size={16} />
                    View Proof
                  </button>
                </div>

                {/* Right: Actions */}
                <div className="action-section">
                  <button onClick={() => handleApprove(sub._id)} className="btn-approve">
                    <CheckCircle size={18} /> Approve
                  </button>
                  <button onClick={() => handleReject(sub._id)} className="btn-reject">
                    <XCircle size={18} /> Reject
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Verify;