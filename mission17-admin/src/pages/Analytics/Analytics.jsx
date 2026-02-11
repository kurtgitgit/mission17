import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Clock, CheckCircle, Users, Target, AlertTriangle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import '../../styles/Analytics.css'; 

const Analytics = () => {
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    activeAgents: 0,
    rate: 0,
    totalSubmissions: 0
  });
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to get token
  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const headers = { 'auth-token': getToken() };

        // 1. Fetch Data with Security Headers
        const [subRes, userRes] = await Promise.all([
          fetch("http://localhost:5001/api/auth/pending-submissions", { headers }),
          fetch("http://localhost:5001/api/auth/users", { headers })
        ]);

        if (!subRes.ok || !userRes.ok) throw new Error("Failed to fetch data");

        const pendingSubmissions = await subRes.json();
        const allUsers = await userRes.json();

        // 2. Calculate Logic (Fixed)
        // Note: The pending-submissions endpoint ONLY gives us pending items.
        // We calculate 'Completed' by summing up the completed missions from all users.
        const p = pendingSubmissions.length; 
        const a = allUsers.reduce((acc, user) => acc + (user.completedMissions?.length || 0), 0);
        const r = 0; // We would need a specific endpoint to track rejected history reliably
        
        const totalProcessed = p + a;
        const successRate = totalProcessed > 0 ? Math.round((a / totalProcessed) * 100) : 0;

        setStats({
          pending: p,
          completed: a,
          activeAgents: allUsers.length,
          rate: successRate,
          totalSubmissions: totalProcessed
        });

        setPieData([
          { name: 'Completed', value: a, color: '#22c55e' },
          { name: 'Pending', value: p, color: '#f59e0b' },
          // { name: 'Rejected', value: r, color: '#ef4444' }, // Hidden until backend supports history
        ]);

      } catch (error) {
        console.error("Analytics fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Mock Bar Data (Can be replaced with real history data later)
  const barData = [
    { day: 'Mon', proofs: 4 }, { day: 'Tue', proofs: 7 }, { day: 'Wed', proofs: 5 },
    { day: 'Thu', proofs: 11 }, { day: 'Fri', proofs: 9 }, { day: 'Sat', proofs: 15 },
    { day: 'Sun', proofs: 12 },
  ];

  if (loading) return (
    <Layout>
        <div className="analytics-container" style={{display:'flex', justifyContent:'center', alignItems:'center', height:'80vh'}}>
            <p style={{color:'#64748b'}}>Loading Surveillance Data...</p>
        </div>
    </Layout>
  );

  return (
    <Layout title="Analytics Hub">
      <div className="analytics-container">
        
        <div className="analytics-header">
          <h1 className="page-title">Mission Analytics</h1>
          <p className="page-subtitle">Real-time surveillance of user activity and mission status.</p>
        </div>

        <div className="stats-grid">
          {/* Live Pending Card */}
          <div className="stat-card">
            <div className="icon-wrapper yellow-icon"><Clock size={24} /></div>
            <div className="stat-content">
              <span className="stat-label">Pending Proofs</span>
              <h2 className="stat-value">{stats.pending}</h2>
              <span className="stat-trend trend-up">Awaiting Review</span>
            </div>
          </div>

          {/* Live Completed Card */}
          <div className="stat-card">
            <div className="icon-wrapper green-icon"><CheckCircle size={24} /></div>
            <div className="stat-content">
              <span className="stat-label">Missions Completed</span>
              <h2 className="stat-value">{stats.completed}</h2>
              <span className="stat-trend trend-up">Verified & Points Awarded</span>
            </div>
          </div>

          {/* Live Active Agents Card */}
          <div className="stat-card">
            <div className="icon-wrapper blue-icon"><Users size={24} /></div>
            <div className="stat-content">
              <span className="stat-label">Active Agents</span>
              <h2 className="stat-value">{stats.activeAgents}</h2>
              <span className="stat-trend">In System</span>
            </div>
          </div>

          {/* Live Verification Rate Card */}
          <div className="stat-card">
            <div className="icon-wrapper purple-icon"><Target size={24} /></div>
            <div className="stat-content">
              <span className="stat-label">Completion Rate</span>
              <h2 className="stat-value">{stats.rate}%</h2>
              <span className="stat-trend trend-purple">Global Success</span>
            </div>
          </div>
        </div>

        <div className="charts-section">
          <div className="chart-card">
            <h3>Proof Submissions (Weekly)</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barSize={30}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis hide />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="proofs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <h3>Current Status Distribution</h3>
            <div className="chart-wrapper relative-wrapper">
              <div className="donut-center-text">
                <span className="center-number">{stats.totalSubmissions}</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span style={{color: '#475569', fontSize: '12px', fontWeight: 500}}>{value}</span>} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <p className="chart-footer">Total active & completed tasks</p>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Analytics;