import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ShieldCheck, MessageSquare, Megaphone, ArrowRight, RefreshCw, Plus, Info } from 'lucide-react';
import Layout from '../../components/Layout';
import { newestFirst } from '../../utils/serviceRecords';
import { endpoints } from '../../config/api';
import '../../styles/OperationsDashboard.css';

const formatDate = (date, options = {month:'short',day:'numeric'}) => date ? new Date(date).toLocaleString('en-PH',{timeZone:'Asia/Manila',...options}) : '—';
const badge = status => <span className={`ops-badge ops-${String(status).toLowerCase().replaceAll(' ','-')}`}>{status}</span>;

async function fetchDashboard() {
  const base = endpoints.auth.backendBaseUrl;
  const headers = {'auth-token':localStorage.getItem('token')};
  const sources=[['documents','/api/document-requests'],['blotters','/api/blotter-reports?open=true&limit=5'],['counts','/api/analytics/operations'],['posts','/api/announcements']];
  const results=await Promise.allSettled(sources.map(async ([,path])=>{
    const response=await fetch(base+path,{headers});
    if(!response.ok) throw new Error('Unavailable');
    return response.json();
  }));
  const errors=[];
  const data=Object.fromEntries(results.map((result,index)=>{
    const key=sources[index][0];
    if(result.status==='rejected'){errors.push(key);return [key,null];}
    return [key,result.value];
  }));
  return {data,errors};
}

export default function DashboardHome() {
  const [data,setData] = useState({documents:[],blotters:[],feedback:null,posts:[]});
  const [loading,setLoading] = useState(true);
  const [errors,setErrors] = useState([]);
  const load = useCallback(async () => {
    const result=await fetchDashboard();
    setData(result.data);setErrors(result.errors);setLoading(false);
  },[]);
  useEffect(()=>{
    let active=true;
    void fetchDashboard().then(result=>{if(active){setData(result.data);setErrors(result.errors);setLoading(false);}});
    return ()=>{active=false;};
  },[]);
  const documents=(data.documents||[]).filter(r=>!r.isArchived&&['Pending','Processing'].includes(r.status)).sort(newestFirst);
  const blotters=(data.blotters||[]).filter(r=>!r.isArchived&&['Pending','In Progress'].includes(r.status)).sort(newestFirst);
  const posts=data.posts||[];
  const metrics=[
    {label:'Document requests',value:data.counts?.documents,source:'counts',note:'Pending or processing',to:'/document-requests',Icon:FileText},
    {label:'Active blotters',value:data.counts?.blotters,source:'counts',note:'Pending or in progress',to:'/blotter-reports',Icon:ShieldCheck},
    {label:'New feedback',value:data.counts?.feedback,source:'counts',note:'Awaiting staff review',to:'/suggestions',Icon:MessageSquare},
    {label:'Active bulletins',value:data.counts?.posts,source:'counts',note:data.counts?`${data.counts.alerts} active alerts`:'Alert count unavailable',to:'/announcements',Icon:Megaphone},
  ];
  return <Layout className="ops-layout"><div className="ops-page">
    <header className="ops-heading"><div><h1>Operations dashboard</h1><p>{new Date().toLocaleDateString('en-PH',{timeZone:'Asia/Manila',weekday:'long',year:'numeric',month:'long',day:'numeric'})} · A clear view of today’s barangay services.</p></div><div className="ops-actions"><button className="ops-button" onClick={()=>{setLoading(true);void load();}} disabled={loading}><RefreshCw size={15}/>{loading?'Refreshing…':'Refresh'}</button><Link to="/announcements?urgent=1" className="ops-button ops-alert"><Plus size={16}/>Post alert</Link></div></header>
    {errors.length>0&&<div role="alert" className="ops-error">Some information could not be loaded: {errors.join(', ')}. Refresh to try again; unavailable counts are shown as a dash.</div>}
    <div className="ops-metrics">{metrics.map(({label,value,source,note,to,Icon})=><Link to={to} className="ops-metric" key={label}><div>{label}{React.createElement(Icon,{size:19})}</div><strong>{loading?'…':errors.includes(source)?'—':value}</strong><small>{note}</small></Link>)}</div>
    <div className="ops-grid"><div>
      <section className="ops-panel"><header><div><h2>Latest document requests</h2><p>New submissions first. Open a request to review its details.</p></div><Link to="/document-requests">View all <ArrowRight size={14}/></Link></header>
        <div className="ops-table-scroll"><table><thead><tr><th>Resident / document</th><th>Submitted</th><th>Status</th><th>Action</th></tr></thead><tbody>{documents.slice(0,5).map(r=><tr key={r._id}><td><strong>{r.fullName}</strong><small>{r.documentType==='Other'?r.customDocumentType:r.documentType}</small></td><td>{formatDate(r.createdAt)}<small>{formatDate(r.createdAt,{hour:'numeric',minute:'2-digit'})}</small></td><td>{badge(r.status)}</td><td><Link to="/document-requests">Review <ArrowRight size={14}/></Link></td></tr>)}</tbody></table></div>
        {!documents.length&&<p className="ops-empty">{loading?'Loading requests…':errors.includes('documents')?'Document requests are unavailable.':'No requests are waiting for processing.'}</p>}<footer>Showing up to 5 latest open requests<Link to="/document-requests">Open document desk</Link></footer>
      </section>
      <section className="ops-panel"><header><div><h2>Blotter reports</h2><p>Staff review and active case handling.</p></div><Link to="/blotter-reports">View all <ArrowRight size={14}/></Link></header><div className="ops-table-scroll"><table><thead><tr><th>Case</th><th>Filed by</th><th>Status</th><th>Next step</th></tr></thead><tbody>{blotters.slice(0,5).map(r=><tr key={r._id}><td><strong>{r.incidentType}</strong><small>{r.referenceNumber}</small></td><td>{r.fullName||r.username||'Resident'}<small>{formatDate(r.createdAt)}</small></td><td>{badge(r.status)}</td><td><Link to="/blotter-reports">{r.status==='Pending'?'Staff review':'Continue handling'} <ArrowRight size={14}/></Link></td></tr>)}</tbody></table></div>{!blotters.length&&<p className="ops-empty">{loading?'Loading reports…':errors.includes('blotters')?'Blotter reports are unavailable.':'No cases are awaiting staff handling.'}</p>}</section>
    </div><aside><section className="ops-panel"><header><h2>Latest bulletins</h2><Link to="/announcements">Manage</Link></header>{posts.slice(0,3).map(post=><Link className="ops-bulletin" to="/announcements" key={post._id}>{badge(post.isUrgent?'Urgent':'Published')}<h3>{post.title}</h3><small>{post.category} · {formatDate(post.createdAt)}</small></Link>)}{!posts.length&&<p className="ops-empty">{loading?'Loading bulletins…':errors.includes('posts')?'Bulletins are unavailable.':'No current announcements.'}</p>}<footer>Only current posts appear in mobile News</footer></section><p className="ops-note"><Info size={17}/>Archived service records remain available in their respective desks and in residents’ histories.</p></aside></div>
  </div></Layout>;
}
