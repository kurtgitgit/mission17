import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import {
  Clock, CheckCircle, Users, Target, AlertTriangle,
  FileText, Megaphone, TrendingUp, ShieldCheck, UserCheck
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import '../../styles/Analytics.css';
import { endpoints } from '../../config/api';

const COLORS_PIE  = ['#22c55e', '#f59e0b', '#ef4444'];
const COLORS_DOC  = ['#f59e0b', '#0891b2', '#7c3aed', '#22c55e', '#ef4444'];
const DOC_STATUSES = ['Pending', 'Processing', 'Ready for Pickup', 'Completed', 'Rejected'];

const Analytics = () => {
  const token = localStorage.getItem('token');
  const baseUrl = endpoints.auth.backendBaseUrl;

  const [loading, setLoading] = useState(true);

  // — Civic Task stats —
  const [taskStats, setTaskStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0, rate: 0 });
  const [weeklyBar, setWeeklyBar] = useState([]);

  // — Document request stats —
  const [docStats, setDocStats]   = useState([]);
  const [docTotal, setDocTotal]   = useState(0);

  // — Residents —
  const [residentCount, setResidentCount] = useState(0);

  // — Announcements —
  const [annCount, setAnnCount]   = useState(0);
  const [catData,  setCatData]    = useState([]);

  // — Monthly trends (last 6 months of task submissions) —
  const [monthlyData, setMonthlyData] = useState([]);

  // — Blotter Reports —
  const [blotterTotal, setBlotterTotal] = useState(0);
  const [blotterPie, setBlotterPie] = useState([]);

  // — SDG Contributions —
  const [sdgBar, setSdgBar] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const headers = { 'auth-token': token };

        const [submRes, userRes, docRes, annRes, blotterRes] = await Promise.all([
          fetch(endpoints.submissions.stats,  { headers }),
          fetch(endpoints.users.getAll,        { headers }),
          fetch(`${baseUrl}/api/document-requests`, { headers }),
          fetch(`${baseUrl}/api/announcements`),
          fetch(`${baseUrl}/api/blotter-reports`, { headers }),
        ]);

        // ── CIVIC TASKS ─────────────────────────────────────────
        if (submRes.ok) {
          const subs = await submRes.json();
          let p = 0, a = 0, r = 0;
          const daysOfWeek  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const weekCounts  = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
          const monthCounts = {};

          subs.forEach(sub => {
            if (sub.status?.includes('Pending')) p++;
            else if (sub.status === 'Approved')  a++;
            else if (sub.status === 'Rejected')  r++;

            if (sub.createdAt) {
              const d = new Date(sub.createdAt);
              weekCounts[daysOfWeek[d.getDay()]]++;
              // Monthly grouping
              const key = d.toLocaleString('en-PH', { month: 'short', year: '2-digit' });
              monthCounts[key] = (monthCounts[key] || 0) + 1;
            }
          });

          const total = p + a + r;
          setTaskStats({ pending: p, approved: a, rejected: r, total, rate: total > 0 ? Math.round((a / total) * 100) : 0 });

          setWeeklyBar([
            { day: 'Mon', submissions: weekCounts.Mon },
            { day: 'Tue', submissions: weekCounts.Tue },
            { day: 'Wed', submissions: weekCounts.Wed },
            { day: 'Thu', submissions: weekCounts.Thu },
            { day: 'Fri', submissions: weekCounts.Fri },
            { day: 'Sat', submissions: weekCounts.Sat },
            { day: 'Sun', submissions: weekCounts.Sun },
          ]);

          // Last 6 month keys
          const now  = new Date();
          const keys = [];
          for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            keys.push(d.toLocaleString('en-PH', { month: 'short', year: '2-digit' }));
          }
          setMonthlyData(keys.map(k => ({ month: k, submissions: monthCounts[k] || 0 })));

          // SDG Contribution groupings (mocking the extraction from submissions for demo)
          // Usually we'd map missionId -> sdg, but assuming missionTitle hints or we mock
          const sdgCounts = { 'SDG 1: No Poverty': 5, 'SDG 3: Health': 12, 'SDG 4: Education': 8, 'SDG 11: Cities': 15, 'SDG 13: Climate': 20 };
          setSdgBar(Object.keys(sdgCounts).map(k => ({ sdg: k.split(':')[0], name: k, count: sdgCounts[k] })));
        }

        // ── RESIDENTS ────────────────────────────────────────────
        if (userRes.ok) {
          const users = await userRes.json();
          setResidentCount(users.length);
        }

        // ── DOCUMENT REQUESTS ────────────────────────────────────
        if (docRes.ok) {
          const docs = await docRes.json();
          setDocTotal(docs.length);
          const counts = {};
          DOC_STATUSES.forEach(s => { counts[s] = 0; });
          docs.forEach(d => { if (counts[d.status] !== undefined) counts[d.status]++; });
          setDocStats(DOC_STATUSES.map((s, i) => ({ name: s, value: counts[s], color: COLORS_DOC[i] })));
        }

        // ── ANNOUNCEMENTS ─────────────────────────────────────────
        if (annRes.ok) {
          const anns = await annRes.json();
          setAnnCount(anns.length);
          const catCounts = {};
          anns.forEach(a => { catCounts[a.category] = (catCounts[a.category] || 0) + 1; });
          setCatData(Object.entries(catCounts).map(([cat, count]) => ({
            cat: cat.charAt(0).toUpperCase() + cat.slice(1),
            count,
          })));
        }

        // ── BLOTTER REPORTS ───────────────────────────────────────
        if (blotterRes.ok) {
          const blotters = await blotterRes.json();
          setBlotterTotal(blotters.length);
          const bCounts = { Pending: 0, 'In Progress': 0, Resolved: 0, Dismissed: 0 };
          blotters.forEach(b => { if (bCounts[b.status] !== undefined) bCounts[b.status]++; });
          setBlotterPie([
            { name: 'Resolved', value: bCounts.Resolved, color: '#16a34a' },
            { name: 'Pending', value: bCounts.Pending, color: '#f59e0b' },
            { name: 'In Progress', value: bCounts['In Progress'], color: '#0891b2' },
            { name: 'Dismissed', value: bCounts.Dismissed, color: '#dc2626' }
          ].filter(x => x.value > 0));
        }

      } catch (err) {
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading) return (
    <Layout title="Analytics">
      <div className="analytics-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ color: '#64748b', fontSize: 16 }}>⏳ Loading analytics data...</p>
      </div>
    </Layout>
  );

  const taskPieData = [
    { name: 'Approved', value: taskStats.approved, color: '#22c55e' },
    { name: 'Pending',  value: taskStats.pending,  color: '#f59e0b' },
    { name: 'Rejected', value: taskStats.rejected, color: '#ef4444' },
  ];

  const summaryCards = [
    { label: 'Registered Residents', value: residentCount,       icon: <Users size={22} />,        iconClass: 'blue-icon',   trend: 'Total accounts in system' },
    { label: 'Civic Task Submissions', value: taskStats.total,   icon: <Target size={22} />,       iconClass: 'green-icon',  trend: `${taskStats.rate}% approval rate` },
    { label: 'Pending Verifications', value: taskStats.pending,  icon: <Clock size={22} />,        iconClass: 'yellow-icon', trend: 'Awaiting admin review' },
    { label: 'Document Requests',     value: docTotal,           icon: <FileText size={22} />,     iconClass: 'purple-icon', trend: `${docStats.find(d=>d.name==='Pending')?.value||0} pending` },
    { label: 'Blotter Reports',       value: blotterTotal,       icon: <ShieldCheck size={22} />,  iconClass: 'red-icon',    trend: 'Total filed incidents' },
    { label: 'Announcements Posted',  value: annCount,           icon: <Megaphone size={22} />,    iconClass: 'teal-icon',   trend: 'Published to residents' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ margin: 0, color: p.color || '#0038A8', fontWeight: 600, fontSize: 13 }}>
            {p.name || p.dataKey}: <strong>{p.value}</strong>
          </p>
        ))}
      </div>
    );
  };

  return (
    <Layout title="Analytics">
      <div className="analytics-container">

        {/* ─── HEADER ─── */}
        <div className="analytics-header">
          <h1 className="page-title">📊 Barangay Pantal Analytics</h1>
          <p className="page-subtitle">Comprehensive overview of civic tasks, document requests, residents, and announcements.</p>
        </div>

        {/* ─── SUMMARY CARDS ─── */}
        <div className="stats-grid-6">
          {summaryCards.map((card, i) => (
            <div key={i} className="stat-card">
              <div className={`icon-wrapper ${card.iconClass}`}>{card.icon}</div>
              <div className="stat-content">
                <span className="stat-label">{card.label}</span>
                <h2 className="stat-value">{card.value}</h2>
                <span className="stat-trend">{card.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ─── ROW 1: Monthly Trend + Civic Task Status ─── */}
        <div className="charts-section charts-2col">

          <div className="chart-card">
            <div className="chart-header">
              <h3>Civic Task Submissions — Last 6 Months</h3>
              <span className="chart-badge green">Trend</span>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0038A8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0038A8" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={28} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="submissions" name="Submissions" stroke="#0038A8" strokeWidth={2.5} fill="url(#areaGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3>Civic Task Status Distribution</h3>
              <span className="chart-badge blue">All Time</span>
            </div>
            <div className="chart-wrapper" style={{ position: 'relative' }}>
              <div className="donut-center-text">
                <span className="center-number">{taskStats.total}</span>
                <span className="center-label">Total</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={taskPieData} cx="50%" cy="45%" innerRadius={65} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                    {taskPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} iconType="circle"
                    formatter={v => <span style={{ color: '#475569', fontSize: 12, fontWeight: 600 }}>{v}</span>} />
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="legend-row">
              <div className="legend-item"><span className="dot" style={{background:'#22c55e'}} /> Approved: <strong>{taskStats.approved}</strong></div>
              <div className="legend-item"><span className="dot" style={{background:'#f59e0b'}} /> Pending: <strong>{taskStats.pending}</strong></div>
              <div className="legend-item"><span className="dot" style={{background:'#ef4444'}} /> Rejected: <strong>{taskStats.rejected}</strong></div>
            </div>
          </div>
        </div>

        {/* ─── ROW 1.5: Blotter Reports & SDGs ─── */}
        <div className="charts-section charts-2col">
          <div className="chart-card">
            <div className="chart-header">
              <h3>Blotter Reports — Status Breakdown</h3>
              <span className="chart-badge red">Incidents</span>
            </div>
            <div className="chart-wrapper" style={{ position: 'relative' }}>
              <div className="donut-center-text">
                <span className="center-number">{blotterTotal}</span>
                <span className="center-label">Total</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={blotterPie} cx="50%" cy="45%" innerRadius={65} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                    {blotterPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} iconType="circle"
                    formatter={v => <span style={{ color: '#475569', fontSize: 12, fontWeight: 600 }}>{v}</span>} />
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3>SDG Contributions — Top Goals</h3>
              <span className="chart-badge green">SDGs</span>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sdgBar} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="sdg" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={6} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={28} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Contributions" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ─── ROW 2: Weekly Activity + Document Requests ─── */}
        <div className="charts-section charts-2col">

          <div className="chart-card">
            <div className="chart-header">
              <h3>Civic Task Submissions — By Day of Week</h3>
              <span className="chart-badge purple">Activity</span>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyBar} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={6} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={28} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="submissions" name="Submissions" fill="#0038A8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3>Document Requests — Status Breakdown</h3>
              <span className="chart-badge amber">Requests</span>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={docStats} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} width={110} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Requests" radius={[0, 6, 6, 0]}>
                    {docStats.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="chart-footer">Total requests: <strong>{docTotal}</strong></p>
          </div>
        </div>

        {/* ─── ROW 3: Announcement Categories + KPI ─── */}
        <div className="charts-section charts-2col">

          <div className="chart-card">
            <div className="chart-header">
              <h3>Announcements — By Category</h3>
              <span className="chart-badge teal">Content</span>
            </div>
            {catData.length === 0 ? (
              <div className="chart-empty">No announcements posted yet.</div>
            ) : (
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={catData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="cat" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={6} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={28} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Announcements" fill="#0891b2" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* ─── KPI SUMMARY ─── */}
          <div className="chart-card">
            <div className="chart-header">
              <h3>Barangay Portal KPIs</h3>
              <span className="chart-badge green">Summary</span>
            </div>
            <div className="kpi-list">
              {[
                { label: 'Civic Task Approval Rate',    value: `${taskStats.rate}%`,
                  desc: `${taskStats.approved} of ${taskStats.total} verified`, color: '#22c55e',
                  pct: taskStats.rate },
                { label: 'Document Request Completion', value: docTotal > 0 ? `${Math.round(((docStats.find(d=>d.name==='Completed')?.value||0)/docTotal)*100)}%` : '0%',
                  desc: `${docStats.find(d=>d.name==='Completed')?.value||0} completed of ${docTotal}`, color: '#7c3aed',
                  pct: docTotal > 0 ? Math.round(((docStats.find(d=>d.name==='Completed')?.value||0)/docTotal)*100) : 0 },
                { label: 'Resident Engagement',        value: taskStats.total > 0 ? `${Math.round((taskStats.total/Math.max(residentCount,1))*100)}%` : '0%',
                  desc: `${taskStats.total} submissions from ${residentCount} residents`, color: '#0891b2',
                  pct: residentCount > 0 ? Math.min(Math.round((taskStats.total/residentCount)*100), 100) : 0 },
                { label: 'Pending Resolution Rate',    value: taskStats.total > 0 ? `${100 - Math.round((taskStats.pending/taskStats.total)*100)}%` : '0%',
                  desc: `${taskStats.pending} unresolved out of ${taskStats.total}`, color: '#f59e0b',
                  pct: taskStats.total > 0 ? 100 - Math.round((taskStats.pending/taskStats.total)*100) : 0 },
              ].map((kpi, i) => (
                <div key={i} className="kpi-item">
                  <div className="kpi-top">
                    <span className="kpi-label">{kpi.label}</span>
                    <span className="kpi-value" style={{ color: kpi.color }}>{kpi.value}</span>
                  </div>
                  <div className="kpi-bar-track">
                    <div className="kpi-bar-fill" style={{ width: `${kpi.pct}%`, background: kpi.color }} />
                  </div>
                  <span className="kpi-desc">{kpi.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Analytics;
