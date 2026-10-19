import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FileText, ShieldAlert, MessageSquare, Users, RefreshCw, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import Layout from '../components/Layout';
import { endpoints } from '../config/api';
import '../styles/Analytics.css';
import '../styles/AnalyticsGroups.css';

const COLORS = ['#0038a8', '#16856b', '#b76e12', '#7955bb', '#ce4661', '#087e9a'];
const shiftDay = (day, offset) => new Date(Date.parse(`${day}T12:00:00Z`) + offset * 86400000).toISOString().slice(0, 10);
const presetDates = (days) => {
  const endDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Manila' }).format(new Date());
  return { startDate: shiftDay(endDate, 1 - days), endDate };
};

const trendRows = (data, range) => {
  const byDate = new Map();
  for (const key of ['documents', 'blotters', 'feedback']) {
    for (const row of data[key].daily || []) {
      byDate.set(row.date, { ...byDate.get(row.date), [key]: row.count });
    }
  }
  const rows = [];
  for (let day = range.startDate; day <= range.endDate; day = shiftDay(day, 1)) {
    rows.push({ date: day, documents: 0, blotters: 0, feedback: 0, ...byDate.get(day) });
  }
  return rows;
};

function Breakdown({ title, rows, total, note }) {
  return (
    <section className="analytics-panel">
      <h2>{title}</h2>
      {note && <p className="analytics-note">{note}</p>}
      {total === 0 ? <p className="analytics-empty">No records in this period.</p> : (
        <table className="analytics-breakdown">
          <caption className="analytics-sr-only">{title}: counts and share of {total} records</caption>
          <thead className="analytics-sr-only"><tr><th scope="col">Category</th><th scope="col">Count</th><th scope="col">Share</th></tr></thead>
          <tbody>{rows.map((row, index) => (
            <tr key={row.name}>
              <th scope="row"><span>{row.name}</span><span className="analytics-track" aria-hidden="true"><span style={{ width: `${row.count / total * 100}%`, background: COLORS[index % COLORS.length] }} /></span></th>
              <td>{row.count.toLocaleString()}</td>
              <td>{Math.round(row.count / total * 100)}%</td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </section>
  );
}

export default function Analytics() {
  const [range, setRange] = useState(() => presetDates(30));
  const [draft, setDraft] = useState(range);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateError, setDateError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError('');
      setData(null);
      try {
        const response = await axios.get(endpoints.analytics, {
          params: { ...range, trend: true }, headers: { 'auth-token': localStorage.getItem('token') },
          timeout: 25000, signal: controller.signal,
        });
        if (!controller.signal.aborted) setData(response.data);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Failed to load operations analytics:', err);
          setError(err.response?.data?.message || 'Analytics could not be loaded. Check your connection and try again.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [range, refresh]);

  const selectPreset = (days) => {
    const next = presetDates(days);
    setDraft(next);
    setRange(next);
    setDateError('');
  };

  const applyDates = (event) => {
    event.preventDefault();
    const days = (Date.parse(draft.endDate) - Date.parse(draft.startDate)) / 86400000 + 1;
    if (!Number.isFinite(days) || days < 1 || days > 366) {
      setDateError('Choose a valid date range of 1–366 days.');
      return;
    }
    setDateError('');
    setRange({ ...draft });
  };

  const cards = data ? [
    { label: 'Document requests', count: data.documents.total, Icon: FileText, to: '/document-requests' },
    { label: 'Blotter reports', count: data.blotters.total, Icon: ShieldAlert, to: '/blotter-reports' },
    { label: 'Citizen feedback', count: data.feedback.total, Icon: MessageSquare, to: '/suggestions' },
    { label: 'Residents registered', count: data.residents, Icon: Users, to: '/users' },
  ] : [];

  return (
    <Layout className="analytics-layout">
      <div className="analytics-page">
        <header className="analytics-heading">
          <div><p className="analytics-eyebrow">BARANGAY OPERATIONS</p><h1>Analytics</h1><p>Understand service demand and monitor the records that need attention.</p></div>
          <Link className="analytics-button" to="/report-generation">Printable reports <ArrowUpRight size={16} /></Link>
        </header>

        <form className="analytics-filters" onSubmit={applyDates}>
          <div className="analytics-presets">
            {[7, 30, 90].map(days => <button type="button" key={days} className="analytics-button" aria-pressed={JSON.stringify(range) === JSON.stringify(presetDates(days))} onClick={() => selectPreset(days)}>Last {days} days</button>)}
          </div>
          <label>From<input type="date" required value={draft.startDate} onChange={event => setDraft({ ...draft, startDate: event.target.value })} /></label>
          <label>To<input type="date" required value={draft.endDate} onChange={event => setDraft({ ...draft, endDate: event.target.value })} /></label>
          <button className="analytics-button analytics-primary" type="submit">Apply dates</button>
          <button className="analytics-button" type="button" onClick={() => setRefresh(value => value + 1)} disabled={loading}><RefreshCw size={16} />Refresh</button>
          {dateError && <p role="alert" className="analytics-error">{dateError}</p>}
        </form>
        <p className="analytics-period">{range.startDate} — {range.endDate} · Philippine time (UTC+8). Counts use submission dates; breakdowns show each record’s current status.</p>

        {loading && <div role="status" className="analytics-panel analytics-empty">Loading barangay analytics…</div>}
        {error && <div role="alert" className="analytics-panel analytics-error"><p>{error}</p><button className="analytics-button" onClick={() => setRefresh(value => value + 1)}>Try again</button></div>}
        {data && !loading && <>
          <div className="analytics-cards">{cards.map((card, index) => (
            <Link to={card.to} className="analytics-stat" key={card.label}><span className="analytics-stat-icon" style={{ color: COLORS[index] }}><card.Icon size={23} /></span><span>{card.label}<strong>{card.count.toLocaleString()}</strong><small>Within selected period</small></span><ArrowUpRight size={16} /></Link>
          ))}</div>
          <section className="analytics-panel analytics-trends">
            <h2>Daily submissions</h2><p className="analytics-note">Document requests, incident reports, and feedback received each day.</p>
            {data.documents.total + data.blotters.total + data.feedback.total === 0 ? <p className="analytics-empty">No submissions in this period. Try a different date range.</p> : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendRows(data, range)} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={day => day.slice(5)} minTickGap={35} />
                  <YAxis allowDecimals={false} width={35} />
                  <Tooltip /><Legend />
                  <Line dataKey="documents" name="Documents" stroke={COLORS[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line dataKey="blotters" name="Blotters" stroke={COLORS[1]} strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line dataKey="feedback" name="Feedback" stroke={COLORS[2]} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
            <details><summary>View daily counts as a table</summary><div className="analytics-table-scroll"><table className="analytics-daily"><caption className="analytics-sr-only">Daily submission counts</caption><thead><tr><th scope="col">Date</th><th scope="col">Documents</th><th scope="col">Blotters</th><th scope="col">Feedback</th></tr></thead><tbody>{trendRows(data, range).map(row => <tr key={row.date}><th scope="row">{row.date}</th><td>{row.documents}</td><td>{row.blotters}</td><td>{row.feedback}</td></tr>)}</tbody></table></div></details>
          </section>
          <p className="analytics-period">Historical counts include archived records.</p>
          <div className="analytics-service-groups">
            <section className="analytics-service-group"><header><h2>Documents</h2><p>{data.documents.total} submissions in this period</p></header>
              <Breakdown title="Status breakdown" rows={data.documents.status} total={data.documents.total}/>
              <Breakdown title="Document types" rows={data.documents.documentType} total={data.documents.total}/>
            </section>
            <section className="analytics-service-group"><header><h2>Blotters</h2><p>{data.blotters.total} submissions in this period</p></header>
              <Breakdown title="Status breakdown" rows={data.blotters.status} total={data.blotters.total}/>
              <Breakdown title="Incident types" rows={data.blotters.incidentType} total={data.blotters.total}/>
            </section>
            <section className="analytics-service-group"><header><h2>Feedback</h2><p>{data.feedback.total} submissions in this period</p></header>
              <Breakdown title="Status breakdown" rows={data.feedback.status} total={data.feedback.total}/>
              <Breakdown title="Categories" rows={data.feedback.category} total={data.feedback.total}/>
              <Breakdown title="Sentiment" rows={data.feedback.sentiment} total={data.feedback.total} note="Automated labels support staff review; they do not determine a concern’s validity."/>
            </section>
          </div>
        </>}
      </div>
    </Layout>
  );
}
