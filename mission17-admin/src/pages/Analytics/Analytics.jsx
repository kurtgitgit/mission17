import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Clock, CheckCircle, Users, Target, AlertTriangle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import '../../styles/Analytics.css'; 
import { endpoints } from '../../config/api';

const Analytics = () => {
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    activeAgents: 0,
    rate: 0,
    totalSubmissions: 0
  });
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to get token
  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const headers = { 'auth-token': getToken() };

        // Fetch user count and all submissions stats
        const [statsRes, userRes] = await Promise.all([
          fetch(endpoints.submissions.stats, { headers }),
          fetch(endpoints.users.getAll,      { headers })
        ]);

        if (!statsRes.ok || !userRes.ok)
          throw new Error("Failed to fetch analytics data");

        const submissions = await statsRes.json();
        const allUsers    = await userRes.json();

        let p = 0; let a = 0; let r = 0;
        
        // Initialize day counts for the last 7 days (or Mon-Sun)
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

        submissions.forEach(sub => {
          // Status counts
          if (sub.status.includes('Pending')) p++;
          else if (sub.status === 'Approved') a++;
          else if (sub.status === 'Rejected') r++;

          // Day of week counts (using createdAt date)
          if (sub.createdAt) {
            const date = new Date(sub.createdAt);
            const dayName = daysOfWeek[date.getDay()];
            weeklyCounts[dayName]++;
          }
        });

        const total = p + a + r;
        const successRate = total > 0 ? Math.round((a / total) * 100) : 0;

        setStats({
          pending:          p,
          approved:         a,
          rejected:         r,
          activeAgents:     allUsers.length,
          rate:             successRate,
          totalSubmissions: total
        });

        setPieData([
          { name: 'Approved',  value: a, color: '#22c55e' },
          { name: 'Pending',   value: p, color: '#f59e0b' },
          { name: 'Rejected',  value: r, color: '#ef4444' },
        ]);

        // Build array from weeklyCounts in Mon-Sun order
        const formattedBarData = [
          { day: 'Mon', proofs: weeklyCounts.Mon },
          { day: 'Tue', proofs: weeklyCounts.Tue },
          { day: 'Wed', proofs: weeklyCounts.Wed },
          { day: 'Thu', proofs: weeklyCounts.Thu },
          { day: 'Fri', proofs: weeklyCounts.Fri },
          { day: 'Sat', proofs: weeklyCounts.Sat },
          { day: 'Sun', proofs: weeklyCounts.Sun },
        ];
        
        setBarData(formattedBarData);

      } catch (error) {
        console.error("Analytics fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

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
              <span className="stat-label">Missions Approved</span>
              <h2 className="stat-value">{stats.approved}</h2>
              <span className="stat-trend trend-up">Verified & Points Awarded</span>
            </div>
          </div>

          {/* Live Rejected Card */}
          <div className="stat-card">
            <div className="icon-wrapper" style={{background:'#fee2e2'}}><AlertTriangle size={24} color="#ef4444" /></div>
            <div className="stat-content">
              <span className="stat-label">Missions Rejected</span>
              <h2 className="stat-value">{stats.rejected}</h2>
              <span className="stat-trend" style={{color:'#ef4444'}}>Flagged Invalid</span>
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