import React from 'react';
import Layout from '../../components/Layout';
import ActivityConsole from '../../components/ActivityConsole';
import '../../styles/AuditLogs.css';

const AuditLogs = () => {
  return (
    <Layout title="Recent Audit Logs">
      <div className="audit-logs-container">
        <h2 className="section-title">Recent Audit Logs</h2>
        <p className="audit-subtitle">
          Live feed of all admin and user actions recorded in the system.
          Auto-refreshes every 5 seconds.
        </p>
        <ActivityConsole />
      </div>
    </Layout>
  );
};

export default AuditLogs;
