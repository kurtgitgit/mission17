import React from 'react';
import Layout from '../../components/Layout';
import { Clock, CheckCircle, Users, Target } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import '../../styles/Analytics.css'; 

const Analytics = () => {
  // Data for Bar Chart (Proof Submissions)
  const barData = [
    { day: 'Mon', proofs: 4 },
    { day: 'Tue', proofs: 7 },
    { day: 'Wed', proofs: 5 },
    { day: 'Thu', proofs: 11 },
    { day: 'Fri', proofs: 9 },
    { day: 'Sat', proofs: 15 }, // Peak on Saturday like image
    { day: 'Sun', proofs: 12 },
  ];

  // Data for Donut Chart (Verification Status)
  const pieData = [
    { name: 'Approved', value: 65, color: '#22c55e' }, // Green
    { name: 'Pending', value: 25, color: '#f59e0b' },  // Yellow
    { name: 'Rejected', value: 10, color: '#ef4444' },  // Red
  ];

  return (
    <Layout>
      <div className="analytics-container">
        
        {/* Header */}
        <div className="analytics-header">
          <h1 className="page-title">Mission Analytics</h1>
          <p className="page-subtitle">Real-time surveillance of user activity and mission status.</p>
        </div>

        {/* Top Row: 4 Stat Cards */}
        <div className="stats-grid">
          {/* Card 1: Pending */}
          <div className="stat-card">
            <div className="icon-wrapper yellow-icon">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Pending Proofs</span>
              <h2 className="stat-value">12</h2>
              <span className="stat-trend trend-up">+3 today</span>
            </div>
          </div>

          {/* Card 2: Completed */}
          <div className="stat-card">
            <div className="icon-wrapper green-icon">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Missions Completed</span>
              <h2 className="stat-value">1,240</h2>
              <span className="stat-trend trend-up">+12% this week</span>
            </div>
          </div>

          {/* Card 3: Active Agents */}
          <div className="stat-card">
            <div className="icon-wrapper blue-icon">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Active Agents</span>
              <h2 className="stat-value">342</h2>
              <span className="stat-trend">Steady</span>
            </div>
          </div>

          {/* Card 4: Verification Rate */}
          <div className="stat-card">
            <div className="icon-wrapper purple-icon">
              <Target size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Verification Rate</span>
              <h2 className="stat-value">94%</h2>
              <span className="stat-trend trend-purple">Top Tier</span>
            </div>
          </div>
        </div>

        {/* Bottom Row: Charts Section */}
        <div className="charts-section">
          
          {/* Left: Bar Chart */}
          <div className="chart-card">
            <h3>Proof Submissions (Last 7 Days)</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barSize={30}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                    dy={10}
                  />
                  <YAxis 
                    hide 
                  />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="proofs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: Donut Chart */}
          <div className="chart-card">
            <h3>Verification Status</h3>
            <div className="chart-wrapper relative-wrapper">
              {/* Center Text Overlay */}
              <div className="donut-center-text">
                <span className="center-number">62</span>
              </div>
              
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span style={{color: '#475569', fontSize: '12px', fontWeight: 500}}>{value}</span>}
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <p className="chart-footer">Total proofs processed this week</p>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Analytics;