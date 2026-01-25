import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { CheckCircle, XCircle, Clock, FileImage, User } from 'lucide-react';
import '../../styles/Verify.css';

const Verify = () => {
  // Dummy Data: This simulates pending missions from users
  const [submissions, setSubmissions] = useState([
    { id: 1, user: 'Juan Dela Cruz', mission: 'Coastal Clean-up', date: 'Jan 25, 2026', status: 'Pending', proof: 'image_url_here' },
    { id: 2, user: 'Maria Clara', mission: 'Tree Planting', date: 'Jan 24, 2026', status: 'Pending', proof: 'image_url_here' },
    { id: 3, user: 'Jose Rizal', mission: 'Donation Drive', date: 'Jan 23, 2026', status: 'Pending', proof: 'image_url_here' },
  ]);

  // Handle Approve Action
  const handleApprove = (id) => {
    alert(`Mission #${id} Approved!`);
    // In real app, you would send this to backend. For now, we remove it from list.
    setSubmissions(submissions.filter(sub => sub.id !== id));
  };

  // Handle Reject Action
  const handleReject = (id) => {
    const reason = prompt("Enter reason for rejection:");
    if (reason) {
      alert(`Mission #${id} Rejected. Reason: ${reason}`);
      setSubmissions(submissions.filter(sub => sub.id !== id));
    }
  };

  return (
    <Layout>
      <div className="verify-container">
        <div className="verify-header">
          <h1 className="page-title">Verify Proofs</h1>
          <p className="page-subtitle">Review and approve agent mission submissions.</p>
        </div>

        {submissions.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={48} color="#16a34a" />
            <h3>All caught up!</h3>
            <p>No pending submissions to verify.</p>
          </div>
        ) : (
          <div className="submissions-list">
            {submissions.map((sub) => (
              <div key={sub.id} className="verify-card">
                
                {/* Left: User Info */}
                <div className="info-section">
                  <div className="user-avatar">
                    <User size={20} />
                  </div>
                  <div className="text-details">
                    <h3 className="user-name">{sub.user}</h3>
                    <p className="mission-name">Completed: <strong>{sub.mission}</strong></p>
                    <span className="date-badge"><Clock size={12} /> {sub.date}</span>
                  </div>
                </div>

                {/* Middle: Proof Button */}
                <div className="proof-section">
                  <button className="view-proof-btn">
                    <FileImage size={16} />
                    View Proof
                  </button>
                </div>

                {/* Right: Actions */}
                <div className="action-section">
                  <button onClick={() => handleApprove(sub.id)} className="btn-approve">
                    <CheckCircle size={18} /> Approve
                  </button>
                  <button onClick={() => handleReject(sub.id)} className="btn-reject">
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