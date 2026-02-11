import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Users, Activity, AlertCircle, CheckSquare, Trophy, User as UserIcon } from 'lucide-react';
import '../../styles/DashboardHome.css';

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
      // 🛡️ GET TOKEN FROM STORAGE
      const token = localStorage.getItem('token');
      const headers = { 'auth-token': token };

      try {
        // 1. Fetch Users & Submissions (WITH HEADERS)
        const [userRes, subRes, missionRes] = await Promise.all([
          fetch("http://localhost:5001/api/auth/users", { headers }), // Protected
          fetch("http://localhost:5001/api/auth/pending-submissions", { headers }), // Protected
          fetch("http://localhost:5001/api/auth/all-missions") // Public
        ]);

        if (!userRes.ok || !subRes.ok || !missionRes.ok) {
           throw new Error("Failed to fetch dashboard data");
        }

        const users = await userRes.json();
        const subs = await subRes.json();
        const missions = await missionRes.json();

        // 2. Calculate Stats
        setStats({
          volunteers: users.length,
          activeMissions: missions.length,
          pending: subs.length, // Pending API returns only pending
          completed: users.reduce((acc, user) => acc + (user.completedMissions?.length || 0), 0) // Estimate completed
        });

        // 3. Set Leaderboard (Top 5)
        setLeaders([...users].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 5));

        // 4. Set Recent Activity (Last 5 submissions)
        // Since pending-submissions endpoint only returns pending, 
        // this list will show items waiting for review.
        setRecentActivity(subs.slice(0, 5));

      } catch (error) {
        console.error("Dashboard Load Error:", error);
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
              <span className="stat-value">{loading ? "-" : stats.volunteers}</span>
              <span className="stat-label">Total Volunteers</span>
            </div>
          </div>

          <div className="stat-card green-card">
            <div className="stat-icon-box"><Activity size={24} color="#16a34a" /></div>
            <div className="stat-info">
              <span className="stat-value">{loading ? "-" : stats.activeMissions}</span>
              <span className="stat-label">Active Missions</span>
            </div>
          </div>

          <div className="stat-card yellow-card">
            <div className="stat-icon-box"><AlertCircle size={24} color="#ca8a04" /></div>
            <div className="stat-info">
              <span className="stat-value">{loading ? "-" : stats.pending}</span>
              <span className="stat-label">Pending Verifications</span>
            </div>
          </div>

          <div className="stat-card purple-card">
            <div className="stat-icon-box"><CheckSquare size={24} color="#9333ea" /></div>
            <div className="stat-info">
              <span className="stat-value">{loading ? "-" : stats.completed}</span>
              <span className="stat-label">Missions Completed</span>
            </div>
          </div>
        </div>

        <div className="dashboard-lower-section">
          {/* Recent Activity List */}
          <div className="activity-section">
            <h2 className="section-title">Recent Pending Submissions</h2>
            <div className="activity-list">
              {recentActivity.length === 0 ? <p className="empty-msg">No pending submissions.</p> : 
                recentActivity.map((act) => (
                <div key={act._id} className="activity-item">
                  <p><strong>{act.username}</strong> submitted proof for <strong>{act.missionTitle}</strong></p>
                  <span className="activity-status pending">Pending Review</span>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard Widget */}
          <div className="leaderboard-section">
            <h2 className="section-title">Top Agents</h2>
            <div className="leaderboard-widget">
              {leaders.length === 0 ? <p className="empty-msg">No users yet.</p> :
               leaders.map((agent, index) => (
                <div key={agent._id} className="leader-row">
                  <span className={`rank-tag rank-${index + 1}`}>{index + 1}</span>
                  <div className="leader-avatar"><UserIcon size={14} /></div>
                  <span className="leader-name">{agent.username}</span>
                  <span className="leader-pts">{agent.points || 0} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default DashboardHome;