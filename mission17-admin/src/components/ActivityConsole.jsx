import React, { useState, useEffect, useRef } from 'react';
import { Shield, RefreshCw, Search, Download, Pause, Play } from 'lucide-react';
import { endpoints } from '../config/api';
import '../styles/ActivityConsole.css';

const ActivityConsole = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(new Date());
  const scrollRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const fetchLogs = async () => {
    if (isPausedRef.current) return;

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

  const exportCSV = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Details', 'IP Address'];
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toISOString(),
      log.username || 'System',
      log.action,
      `"${(log.details || '').replace(/"/g, '""')}"`,
      log.ipAddress || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = (log.username || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (log.details || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'ALL' || log.action.includes(filterAction);
    return matchesSearch && matchesAction;
  });

  const uniqueUsers = new Set(logs.map(l => l.username).filter(Boolean)).size;
  const criticalEvents = logs.filter(l => l.action.includes('DELETE') || l.action.includes('REJECT')).length;

  const getActionColor = (action) => {
    if (action.includes('REJECT')) return '#f87171'; // Red
    if (action.includes('APPROVE') || action.includes('SUCCESS')) return '#4ade80'; // Green
    if (action.includes('SIGNUP') || action.includes('ADD')) return '#60a5fa'; // Blue
    if (action.includes('DELETE')) return '#fb923c'; // Orange
    return '#9ca3af'; // Gray
  };

  return (
    <div className="activity-console-wrapper">
      {/* METRICS ROW */}
      <div className="console-metrics">
        <div className="metric-box">
          <span className="metric-value">{logs.length}</span>
          <span className="metric-label">Total Logs Buffer</span>
        </div>
        <div className="metric-box critical">
          <span className="metric-value">{criticalEvents}</span>
          <span className="metric-label">Critical Events</span>
        </div>
        <div className="metric-box">
          <span className="metric-value">{uniqueUsers}</span>
          <span className="metric-label">Active Accounts</span>
        </div>
      </div>

      <div className="activity-console">
        {/* TOOLBAR */}
        <div className="console-toolbar">
          <div className="toolbar-left">
            <div className="search-box">
              <Search size={14} />
              <input type="text" placeholder="Search user or details..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <select className="filter-select" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
              <option value="ALL">All Actions</option>
              <option value="LOGIN">Logins</option>
              <option value="APPROVE">Approvals</option>
              <option value="REJECT">Rejections</option>
              <option value="DELETE">Deletions</option>
            </select>
          </div>
          <div className="toolbar-right">
            <button className={`tool-btn ${isPaused ? 'paused' : ''}`} onClick={() => setIsPaused(!isPaused)}>
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
              {isPaused ? 'Resume Feed' : 'Pause Feed'}
            </button>
            <button className="tool-btn" onClick={exportCSV}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        <div className="console-header">
        <div className="header-left">
          <Shield size={16} />
          <span>Recent Audit Logs</span>
          <span className={`live-indicator ${isPaused ? 'paused' : ''}`}>{isPaused ? 'PAUSED' : 'LIVE'}</span>
        </div>
        <div className="header-right">
          <span className="sync-text">Last Sync: {lastSync.toLocaleTimeString()}</span>
          <button onClick={fetchLogs} className="sync-btn" title="Refresh Now">
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>
      
      <div className="console-body" ref={scrollRef}>
        {filteredLogs.length === 0 ? (
          <div className="console-empty">
            <Shield size={24} opacity={0.3} />
            <p>Waiting for system events...</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
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
        <div className="footer-stat">Showing: {filteredLogs.length}</div>
      </div>
    </div>
    </div>
  );
};

export default ActivityConsole;
