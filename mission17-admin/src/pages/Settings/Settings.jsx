import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { User, Bell, Shield, Lock, Eye, EyeOff, Save, ClipboardList, Activity } from 'lucide-react';
import { endpoints } from '../../config/api'; // Ensure this points to your web API config
import '../../styles/Settings.css'; 

const Settings = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Load Admin MFA status and Logs on mount
  useEffect(() => {
    fetchAuditLogs();
    // In a real app, fetch initial MFA status here
  }, []);

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${endpoints.auth.baseUrl}/audit-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setAuditLogs(data.slice(0, 5)); // Show latest 5
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleToggleMFA = async (e) => {
    const enabled = e.target.checked;
    // Call your /toggle-mfa endpoint here
    setMfaEnabled(enabled);
    alert(`MFA is now ${enabled ? 'Enabled' : 'Disabled'} for Admin.`);
  };

  return (
    <Layout>
      <div className="settings-container">
        <div className="settings-header">
          <h1 className="page-title">System Configuration</h1>
          <p className="page-subtitle">Manage account security, audit trails, and preferences.</p>
        </div>

        <div className="settings-grid">
          
          {/* Card 1: Admin Profile */}
          <div className="settings-card">
            <div className="card-header blue-header">
              <User size={20} className="header-icon" />
              <h3>Admin Profile</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>Display Name</label>
                <input type="text" defaultValue="Admin Commander" />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" defaultValue="admin@gmail.com" />
              </div>
            </div>
          </div>

          {/* Card 2: System Preferences */}
          <div className="settings-card">
            <div className="card-header orange-header">
              <Bell size={20} className="header-icon" />
              <h3>System Preferences</h3>
            </div>
            <div className="card-body">
              <div className="preference-item">
                <div className="pref-text">
                  <h4>Email Notifications</h4>
                  <p>Updates for agent submissions.</p>
                </div>
                <input type="checkbox" defaultChecked className="toggle-checkbox" />
              </div>
              
              <div className="preference-item">
                <div className="pref-text">
                  <h4>2FA Login (MFA)</h4>
                  <p>Require OTP code for Admin login.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={mfaEnabled} 
                  onChange={handleToggleMFA}
                  className="toggle-checkbox" 
                />
              </div>
            </div>
          </div>

          {/* Card 3: Security */}
          <div className="settings-card">
            <div className="card-header purple-header">
              <Shield size={20} className="header-icon" />
              <h3>Security</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>New Password</label>
                <div className="input-with-icon">
                  <Lock size={16} className="field-icon" />
                  <input type={showPassword ? "text" : "password"} placeholder="••••••••" />
                  <button className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>
              <button className="save-btn">
                <Save size={16} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>

          {/* Card 4: 🆕 Audit Logs (Checklist: Audit logging enabled) */}
          <div className="settings-card audit-card">
            <div className="card-header dark-header">
              <ClipboardList size={20} className="header-icon" />
              <h3>Recent Audit Logs</h3>
            </div>
            <div className="card-body">
              {loadingLogs ? (
                <p>Loading security events...</p>
              ) : (
                <div className="audit-list">
                  {auditLogs.map((log) => (
                    <div key={log._id} className="audit-item">
                      <div className="audit-meta">
                        <Activity size={12} color="#3b82f6" />
                        <span className="audit-action">{log.action}</span>
                        <span className="audit-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="audit-desc">{log.details}</p>
                    </div>
                  ))}
                </div>
              )}
              <button className="view-all-btn" onClick={fetchAuditLogs}>Refresh Logs</button>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Settings;