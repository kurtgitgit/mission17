import React from 'react';
import Layout from '../../components/Layout';
import { Users, Activity, AlertCircle, CheckSquare } from 'lucide-react';
import '../../styles/DashboardHome.css'; // We will create this next

const DashboardHome = () => {
  return (
    <Layout>
      <div className="dashboard-container">
        
        {/* Section 1: Stats Overview */}
        <h2 className="section-title">Dashboard Overview</h2>
        
        <div className="stats-grid">
          {/* Blue Card */}
          <div className="stat-card blue-card">
            <div className="stat-icon-box">
              <Users size={24} color="#2563eb" />
            </div>
            <div className="stat-info">
              <span className="stat-value">124</span>
              <span className="stat-label">Total Volunteers</span>
            </div>
          </div>

          {/* Green Card */}
          <div className="stat-card green-card">
            <div className="stat-icon-box">
              <Activity size={24} color="#16a34a" />
            </div>
            <div className="stat-info">
              <span className="stat-value">12</span>
              <span className="stat-label">Active Missions</span>
            </div>
          </div>

          {/* Yellow Card */}
          <div className="stat-card yellow-card">
            <div className="stat-icon-box">
              <AlertCircle size={24} color="#ca8a04" />
            </div>
            <div className="stat-info">
              <span className="stat-value">8</span>
              <span className="stat-label">Pending Verifications</span>
            </div>
          </div>

          {/* Purple Card */}
          <div className="stat-card purple-card">
            <div className="stat-icon-box">
              <CheckSquare size={24} color="#9333ea" />
            </div>
            <div className="stat-info">
              <span className="stat-value">1,042</span>
              <span className="stat-label">Missions Completed</span>
            </div>
          </div>
        </div>

        {/* Section 2: Recent Activity */}
        <h2 className="section-title" style={{ marginTop: '40px' }}>Recent Activity</h2>
        
        <div className="activity-list">
          <div className="activity-item">
            <p><strong>Juan Dela Cruz</strong> joined <strong>Coastal Clean-up</strong></p>
          </div>
          <div className="activity-item">
            <p><strong>Maria Clara</strong> uploaded proof for <strong>Tree Planting</strong></p>
          </div>
          <div className="activity-item">
            <p>System verified <strong>Barangay Clean-up</strong></p>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default DashboardHome;