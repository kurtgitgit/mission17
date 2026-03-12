import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, RefreshCw } from 'lucide-react';
import { endpoints } from '../config/api';
import '../styles/ActivityConsole.css';

const ActivityConsole = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(new Date());
  const scrollRef = useRef(null);

  const fetchLogs = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(endpoints.auth.auditLogs, {
        headers: { 'auth-token': token },
      });
      if (res.ok) {
        const data = await res.json();
        // Only update if there are new logs to prevent unnecessary re-renders
        setLogs(data);
        setLastSync(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTimestamp = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getActionColor = (action) => {
    if (action.includes('REJECT')) return '#f87171'; // Red
    if (action.includes('APPROVE') || action.includes('SUCCESS')) return '#4ade80'; // Green
    if (action.includes('SIGNUP') || action.includes('ADD')) return '#60a5fa'; // Blue
    if (action.includes('DELETE')) return '#fb923c'; // Orange
    return '#9ca3af'; // Gray
  };

  return (
    <div className="activity-console">
      <div className="console-header">
        <div className="header-left">
          <Terminal size={16} />
          <span>Live System Activity</span>
          <span className="live-indicator">LIVE</span>
        </div>
        <div className="header-right">
          <span className="sync-text">Last Sync: {lastSync.toLocaleTimeString()}</span>
          <button onClick={fetchLogs} className="sync-btn" title="Refresh Now">
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>
      
      <div className="console-body" ref={scrollRef}>
        {logs.length === 0 ? (
          <div className="console-empty">
            <Shield size={24} opacity={0.3} />
            <p>Waiting for system events...</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log._id} className="console-line">
              <span className="line-time">[{formatTimestamp(log.timestamp)}]</span>
              <span className="line-user">@{log.username || 'System'}:</span>
              <span className="line-action" style={{ color: getActionColor(log.action) }}>
                {log.action}
              </span>
              <span className="line-details">{log.details}</span>
            </div>
          ))
        )}
      </div>
      
      <div className="console-footer">
        <div className="footer-stat">Connected: {window.location.hostname}</div>
        <div className="footer-stat">Logs: {logs.length}</div>
      </div>
    </div>
  );
};

export default ActivityConsole;
