import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { User, Bell, Shield, Lock, Eye, EyeOff, Save } from 'lucide-react';
import '../../styles/Settings.css'; 

const Settings = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Layout>
      <div className="settings-container">
        {/* Page Header */}
        <div className="settings-header">
          <h1 className="page-title">System Configuration</h1>
          <p className="page-subtitle">Manage your account settings and system preferences.</p>
        </div>

        {/* The Three Cards Grid */}
        <div className="settings-grid">
          
          {/* Card 1: Admin Profile (Blue) */}
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

          {/* Card 2: System Preferences (Orange) */}
          <div className="settings-card">
            <div className="card-header orange-header">
              <Bell size={20} className="header-icon" />
              <h3>System Preferences</h3>
            </div>
            <div className="card-body">
              <div className="preference-item">
                <div className="pref-text">
                  <h4>Email Notifications</h4>
                  <p>Receive updates when agents submit proofs.</p>
                </div>
                <input type="checkbox" defaultChecked className="toggle-checkbox" />
              </div>
              
              <div className="preference-item">
                <div className="pref-text">
                  <h4>Public Registration</h4>
                  <p>Allow new agents to sign up via the app.</p>
                </div>
                <input type="checkbox" className="toggle-checkbox" />
              </div>
            </div>
          </div>

          {/* Card 3: Security (Purple) */}
          <div className="settings-card">
            <div className="card-header purple-header">
              <Shield size={20} className="header-icon" />
              <h3>Security</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>Current Password</label>
                <div className="input-with-icon">
                  <Lock size={16} className="field-icon" />
                  <input type="password" placeholder="••••••••" />
                </div>
              </div>
              
              <div className="form-group">
                <label>New Password</label>
                <div className="input-with-icon">
                  <Lock size={16} className="field-icon" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                  />
                  <button 
                    className="eye-btn" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
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

        </div>
      </div>
    </Layout>
  );
};

export default Settings;