import React from 'react';
import Layout from '../../components/Layout';

const DashboardHome = () => {
  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Community Impact Overview</h1>
        <p style={{ color: '#64748b' }}>Welcome back, Admin.</p>
      </div>
      
      {/* Placeholder Cards for Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3>Total Volunteers</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>1,240</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3>Active Missions</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>15</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3>SDGs Impacted</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffa500' }}>17</p>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardHome;