import React from 'react';
import Layout from '../../components/Layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import '../../styles/Analytics.css';

const Analytics = () => {
  // Data: Community Engagement per SDG Category
  const sdgData = [
    { name: 'Environment', missions: 40, participants: 240 },
    { name: 'Health', missions: 30, participants: 139 },
    { name: 'Education', missions: 20, participants: 580 },
    { name: 'Equality', missions: 27, participants: 190 },
    { name: 'Partnerships', missions: 18, participants: 85 },
  ];

  // Data: Monthly User Growth
  const growthData = [
    { month: 'Jan', users: 50 },
    { month: 'Feb', users: 120 },
    { month: 'Mar', users: 200 },
    { month: 'Apr', users: 350 },
    { month: 'May', users: 500 },
  ];

  return (
    <Layout>
      <div className="analytics-container">
        <h1 className="page-title">Community Impact Reports</h1>
        <p style={{ color: '#666' }}>Real-time data on SDG contributions and engagement.</p>

        <div className="charts-grid">
          {/* Chart 1: Engagement by SDG Category */}
          <div className="chart-card">
            <h3 className="chart-title">Engagement by SDG Category</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sdgData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="missions" fill="#8884d8" name="Missions Created" />
                  <Bar dataKey="participants" fill="#82ca9d" name="Participants" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: User Growth Trend */}
          <div className="chart-card">
            <h3 className="chart-title">User Growth Trend</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#ff7300" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;