import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import {
  User, Bell, Shield, Lock, Eye, EyeOff, Save,
  ClipboardList, Activity, CheckCircle, AlertTriangle,
  UserCog, Mail, Globe, Trash2, LogOut, RefreshCw
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { endpoints } from '../../config/api';
import '../../styles/Settings.css';

const Settings = () => {
  const { showNotification } = useNotification();

  // --- Admin Profile State ---
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminRole, setAdminRole] = useState('');
  const [adminId, setAdminId] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // --- Security / Password State ---
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // --- Preferences State ---
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // --- Audit Logs State ---
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // ==========================================
  // Load data from localStorage on mount
  // ==========================================
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setAdminUsername(user.username || '');
        setAdminEmail(user.email || '');
        setAdminRole(user.role || 'admin');
        setAdminId(user._id || user.id || '');
        setMfaEnabled(!!user.mfaEnabled);
      } catch (e) {
        console.error('Could not parse user from localStorage:', e);
      }
    }
    // Load saved preferences
    const savedEmailNotif = localStorage.getItem('pref_email_notifications');
    if (savedEmailNotif !== null) setEmailNotifications(savedEmailNotif === 'true');

    fetchAuditLogs();
  }, []);

  // ==========================================
  // Fetch Audit Logs
  // ==========================================
  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${endpoints.auth.baseUrl}/audit-logs`, {
        headers: { 'auth-token': token }
      });
      const data = await response.json();
      if (response.ok) setAuditLogs(data.slice(0, 8));
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  // ==========================================
  // Update Admin Profile
  // ==========================================
  const handleUpdateProfile = async () => {
    if (!adminUsername.trim() || !adminEmail.trim()) {
      showNotification('Display name and email cannot be empty.', 'error');
      return;
    }
    setIsSavingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(endpoints.users.update(adminId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': token
        },
        body: JSON.stringify({ username: adminUsername, email: adminEmail })
      });

      if (response.ok) {
        // Update localStorage so changes reflect immediately across the app
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        savedUser.username = adminUsername;
        savedUser.email = adminEmail;
        localStorage.setItem('user', JSON.stringify(savedUser));

        showNotification('Profile updated successfully!', 'success');
      } else {
        const data = await response.json();
        showNotification(data.message || 'Failed to update profile.', 'error');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showNotification('Server connection failed.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ==========================================
  // Toggle MFA
  // ==========================================
  const handleToggleMFA = async (e) => {
    const enabled = e.target.checked;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${endpoints.auth.baseUrl}/toggle-mfa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': token
        },
        body: JSON.stringify({ userId: adminId, enable: enabled })
      });

      if (response.ok) {
        setMfaEnabled(enabled);
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        savedUser.mfaEnabled = enabled;
        localStorage.setItem('user', JSON.stringify(savedUser));
        showNotification(`Two-Factor Authentication ${enabled ? 'Enabled' : 'Disabled'}.`, 'success');
      } else {
        const data = await response.json();
        showNotification('Failed to toggle MFA: ' + (data.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('MFA toggle error:', error);
      showNotification('Failed to communicate with server.', 'error');
    }
  };

  // ==========================================
  // Toggle Email Notifications (localStorage)
  // ==========================================
  const handleToggleEmailNotifications = (e) => {
    const enabled = e.target.checked;
    setEmailNotifications(enabled);
    localStorage.setItem('pref_email_notifications', String(enabled));
    showNotification(`Email notifications ${enabled ? 'enabled' : 'disabled'}.`, 'success');
  };

  // ==========================================
  // Change Password
  // ==========================================
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showNotification('Please fill in all password fields.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showNotification('New password must be at least 8 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification('New password and confirm password do not match.', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${endpoints.auth.baseUrl}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': token
        },
        body: JSON.stringify({ userId: adminId, oldPassword, newPassword })
      });

      const data = await response.json();
      if (response.ok) {
        showNotification(data.message || 'Password changed successfully!', 'success');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showNotification(data.message || 'Failed to change password.', 'error');
      }
    } catch (error) {
      console.error('Change password error:', error);
      showNotification('Server connection failed.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ==========================================
  // Get action badge color
  // ==========================================
  const getActionColor = (action) => {
    if (!action) return '#64748b';
    if (action.includes('LOGIN_SUCCESS') || action.includes('APPROVED') || action.includes('VERIFIED')) return '#16a34a';
    if (action.includes('FAILED') || action.includes('DENIED') || action.includes('REJECTED')) return '#dc2626';
    if (action.includes('DELETE')) return '#ef4444';
    if (action.includes('MFA')) return '#9333ea';
    return '#3b82f6';
  };

  return (
    <Layout>
      <div className="settings-container">

        {/* ---- Page Header ---- */}
        <div className="settings-header">
          <h1 className="page-title">Admin Settings</h1>
          <p className="page-subtitle">
            Manage your profile, security preferences, and system configuration.
          </p>
        </div>

        {/* ---- Admin Profile Banner ---- */}
        <div style={cardStyles.profileBanner}>
          <div style={cardStyles.profileAvatar}>
            {adminUsername ? adminUsername.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
              {adminUsername || 'Administrator'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>{adminEmail}</p>
            <span style={cardStyles.roleBadge}>
              <UserCog size={11} style={{ marginRight: '4px' }} />
              {adminRole?.toUpperCase() || 'ADMIN'}
            </span>
          </div>
        </div>

        {/* ---- Main Settings Grid ---- */}
        <div className="settings-grid">

          {/* Card 1: Admin Profile */}
          <div className="settings-card">
            <div className="card-header blue-header">
              <User size={18} className="header-icon" />
              <h3>Profile Information</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>Display Name</label>
                <div style={cardStyles.inputWrapper}>
                  <User size={14} style={cardStyles.inputIcon} />
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="e.g. Juan dela Cruz"
                    style={cardStyles.paddedInput}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <div style={cardStyles.inputWrapper}>
                  <Mail size={14} style={cardStyles.inputIcon} />
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                    style={cardStyles.paddedInput}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Account Role</label>
                <div style={{ ...cardStyles.paddedInput, backgroundColor: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', fontWeight: 600 }}>
                  <Shield size={14} color="#9333ea" />
                  {adminRole?.charAt(0).toUpperCase() + adminRole?.slice(1) || 'Admin'} — Read Only
                </div>
              </div>
              <button
                className="save-btn"
                onClick={handleUpdateProfile}
                disabled={isSavingProfile}
                style={{ background: '#2563eb', marginTop: 0 }}
              >
                <Save size={15} />
                <span>{isSavingProfile ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </div>

          {/* Card 2: System Preferences */}
          <div className="settings-card">
            <div className="card-header orange-header">
              <Bell size={18} className="header-icon" />
              <h3>System Preferences</h3>
            </div>
            <div className="card-body">
              <div className="preference-item">
                <div className="pref-text">
                  <h4>Email Notifications</h4>
                  <p>Receive alerts for new submissions and reports.</p>
                </div>
                <label style={cardStyles.switchLabel}>
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={handleToggleEmailNotifications}
                    style={{ display: 'none' }}
                  />
                  <span style={{
                    ...cardStyles.switch,
                    background: emailNotifications ? '#2563eb' : '#cbd5e1'
                  }}>
                    <span style={{
                      ...cardStyles.switchKnob,
                      transform: emailNotifications ? 'translateX(20px)' : 'translateX(0)'
                    }} />
                  </span>
                </label>
              </div>

              <div className="preference-item">
                <div className="pref-text">
                  <h4>Two-Factor Authentication (2FA)</h4>
                  <p>Require OTP email code on every admin login.</p>
                </div>
                <label style={cardStyles.switchLabel}>
                  <input
                    type="checkbox"
                    checked={mfaEnabled}
                    onChange={handleToggleMFA}
                    style={{ display: 'none' }}
                  />
                  <span style={{
                    ...cardStyles.switch,
                    background: mfaEnabled ? '#16a34a' : '#cbd5e1'
                  }}>
                    <span style={{
                      ...cardStyles.switchKnob,
                      transform: mfaEnabled ? 'translateX(20px)' : 'translateX(0)'
                    }} />
                  </span>
                </label>
              </div>

              {mfaEnabled && (
                <div style={cardStyles.mfaNotice}>
                  <CheckCircle size={14} color="#16a34a" />
                  <span style={{ fontSize: '12px', color: '#15803d' }}>
                    2FA is active. You will receive an OTP code on your next login.
                  </span>
                </div>
              )}

              <div className="preference-item" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <div className="pref-text">
                  <h4>Session Timeout</h4>
                  <p>JWT tokens expire after 24 hours automatically.</p>
                </div>
                <span style={cardStyles.infoBadge}>
                  <Globe size={11} /> 24h
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Security / Change Password */}
          <div className="settings-card">
            <div className="card-header purple-header">
              <Shield size={18} className="header-icon" />
              <h3>Change Password</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>Current Password</label>
                <div className="input-with-icon">
                  <Lock size={14} className="field-icon" />
                  <input
                    type={showOldPw ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                  <button className="eye-btn" type="button" onClick={() => setShowOldPw(!showOldPw)}>
                    {showOldPw ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>New Password</label>
                <div className="input-with-icon">
                  <Lock size={14} className="field-icon" />
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button className="eye-btn" type="button" onClick={() => setShowNewPw(!showNewPw)}>
                    {showNewPw ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <div className="input-with-icon">
                  <Lock size={14} className="field-icon" />
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button className="eye-btn" type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}>
                    {showConfirmPw ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
              </div>

              {/* Password strength hint */}
              {newPassword && (
                <div style={{
                  fontSize: '11px', padding: '8px 12px', borderRadius: '6px',
                  backgroundColor: newPassword.length >= 8 ? '#f0fdf4' : '#fff7ed',
                  color: newPassword.length >= 8 ? '#15803d' : '#c2410c',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  {newPassword.length >= 8
                    ? <><CheckCircle size={12} /> Password meets minimum length</>
                    : <><AlertTriangle size={12} /> Password must be at least 8 characters</>
                  }
                </div>
              )}

              <button
                className="save-btn"
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                style={{ marginTop: 0 }}
              >
                <Lock size={15} />
                <span>{isChangingPassword ? 'Updating...' : 'Update Password'}</span>
              </button>
            </div>
          </div>

          {/* Card 4: Audit Logs — spans all 3 columns */}
          <div className="settings-card audit-card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header dark-header" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ClipboardList size={18} />
                <h3 style={{ color: 'white' }}>Recent Audit Trail</h3>
              </div>
              <button
                onClick={fetchAuditLogs}
                disabled={loadingLogs}
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              >
                <RefreshCw size={13} style={{ animation: loadingLogs ? 'spin 1s linear infinite' : 'none' }} />
                {loadingLogs ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            <div className="card-body" style={{ padding: '0' }}>
              {loadingLogs ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '10px' }} />
                  <p style={{ margin: 0 }}>Loading security events...</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  <ClipboardList size={32} style={{ marginBottom: '10px', opacity: 0.4 }} />
                  <p style={{ margin: 0 }}>No audit logs found.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      {['Action', 'User', 'Details', 'IP Address', 'Timestamp'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log, idx) => (
                      <tr key={log._id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                            backgroundColor: getActionColor(log.action) + '18',
                            color: getActionColor(log.action)
                          }}>
                            <Activity size={10} />
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                          {log.username || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: '#475569', maxWidth: '300px' }}>
                          {log.details || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
                          {log.ipAddress || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Layout>
  );
};

// ---- Inline styles for new elements ----
const cardStyles = {
  profileBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '24px 28px',
    marginBottom: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.04)'
  },
  profileAvatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #2563eb, #9333ea)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '26px',
    fontWeight: 900,
    color: 'white',
    flexShrink: 0
  },
  roleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    marginTop: '6px',
    padding: '3px 10px',
    backgroundColor: '#fef3c7',
    color: '#d97706',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputIcon: {
    position: 'absolute',
    left: '10px',
    color: '#94a3b8',
    pointerEvents: 'none'
  },
  paddedInput: {
    paddingLeft: '32px',
    width: '100%'
  },
  switchLabel: {
    cursor: 'pointer',
    flexShrink: 0
  },
  switch: {
    display: 'block',
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    position: 'relative',
    transition: 'background 0.2s ease',
    cursor: 'pointer'
  },
  switchKnob: {
    display: 'block',
    position: 'absolute',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: 'white',
    top: '3px',
    left: '3px',
    transition: 'transform 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
  },
  mfaNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px'
  },
  infoBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 600,
    flexShrink: 0
  }
};

export default Settings;
