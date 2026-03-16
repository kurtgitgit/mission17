import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Users, Activity, AlertCircle, CheckSquare, User as UserIcon } from 'lucide-react';
import '../../styles/DashboardHome.css';
import { endpoints } from '../../config/api';

const DashboardHome = () => {
  const [stats, setStats] = useState({
    volunteers: 0,
    activeMissions: 0,
    pending: 0,
    completed: 0
  });
  const [leaders, setLeaders] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(endpoints.dashboard.summary, {
          headers: { 'auth-token': token },
        });

        if (!res.ok) throw new Error('Failed to fetch dashboard summary');

        const data = await res.json();

        setStats(data.stats);
        setLeaders(data.topAgents);
        setRecentActivity(data.recentPending);

      } catch (error) {
        console.error('Dashboard Load Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <Layout title="Dashboard">
      <div className="dashboard-container">

        <h2 className="section-title">Dashboard Overview</h2>

        <div className="stats-grid">
          <div className="stat-card blue-card">
            <div className="stat-icon-box"><Users size={24} color="#2563eb" /></div>
            <div className="stat-info">
              {loading ? <span className="stat-skeleton" /> : <span className="stat-value">{stats.volunteers}</span>}
              <span className="stat-label">Total Volunteers</span>
            </div>
          </div>

          <div className="stat-card green-card">
            <div className="stat-icon-box"><Activity size={24} color="#16a34a" /></div>
            <div className="stat-info">
              {loading ? <span className="stat-skeleton" /> : <span className="stat-value">{stats.activeMissions}</span>}
              <span className="stat-label">Active Missions</span>
            </div>
          </div>

          <div className="stat-card yellow-card">
            <div className="stat-icon-box"><AlertCircle size={24} color="#ca8a04" /></div>
            <div className="stat-info">
              {loading ? <span className="stat-skeleton" /> : <span className="stat-value">{stats.pending}</span>}
              <span className="stat-label">Pending Verifications</span>
            </div>
          </div>

          <div className="stat-card purple-card">
            <div className="stat-icon-box"><CheckSquare size={24} color="#9333ea" /></div>
            <div className="stat-info">
              {loading ? <span className="stat-skeleton" /> : <span className="stat-value">{stats.completed}</span>}
              <span className="stat-label">Missions Completed</span>
            </div>
          </div>
        </div>

        <div className="dashboard-lower-section">
          {/* Recent Activity List */}
          <div className="activity-section">
            <h2 className="section-title">Recent Pending Submissions</h2>
            <div className="activity-list">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="activity-item skeleton-row">
                    <span className="skeleton-line wide" />
                    <span className="skeleton-line narrow" />
                  </div>
                ))
                : recentActivity.length === 0
                  ? <p className="empty-msg">No pending submissions.</p>
                  : recentActivity.map((act) => (
                    <div key={act._id} className="activity-item">
                      <p><strong>{act.username}</strong> submitted proof for <strong>{act.missionTitle}</strong></p>
                      <span className="activity-status pending">Pending Review</span>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Leaderboard Widget */}
          <div className="leaderboard-section">
            <h2 className="section-title">Leaderboards</h2>
            <div className="leaderboard-widget">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="leader-row skeleton-row">
                    <span className="skeleton-circle" />
                    <span className="skeleton-line wide" />
                    <span className="skeleton-line narrow" style={{ marginLeft: 'auto' }} />
                  </div>
                ))
                : leaders.length === 0
                  ? <p className="empty-msg">No users yet.</p>
                  : leaders.map((agent, index) => (
                    <div key={agent._id} className="leader-row">
                      <span className={`rank-tag rank-${index + 1}`}>{index + 1}</span>
                      <div className="leader-avatar"><UserIcon size={14} /></div>
                      <span className="leader-name">{agent.username}</span>
                      <span className="leader-pts">{agent.points || 0} pts</span>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default DashboardHome;