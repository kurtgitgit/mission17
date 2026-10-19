import React, { useRef, useState } from 'react';
import { Archive, RotateCcw } from 'lucide-react';
import { endpoints } from '../config/api';
import { useNotification } from '../context/NotificationContext';
import '../styles/ServiceRecords.css';
import { manilaDateTimeInput } from '../utils/serviceRecords';

export function ArchiveView({ value, onChange, posts = false }) {
  return <div className="record-view" role="group" aria-label="Record view">{(posts ? ['active','expired','archived'] : ['active','archived']).map(view => <button type="button" key={view} aria-pressed={value === view} onClick={() => {if(value!==view)onChange(view);}}>{view === 'active' ? 'Current records' : view === 'archived' ? 'Archived' : 'Expired'}</button>)}</div>;
}

export function ReadableText({ label = 'Description', text }) {
  const [expanded, setExpanded] = useState(false);
  const long = String(text || '').length > 280;
  return <section className="record-narrative"><h3>{label}</h3><p className={long && !expanded ? 'record-text-collapsed' : ''}>{text || 'No description provided.'}</p>{long && <button className="record-text-toggle" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : 'Read full description'}</button>}</section>;
}

export function ArchiveAction({ record, resource, onChanged }) {
  const ref = useRef(null);
  const { showNotification } = useNotification();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expiry, setExpiry] = useState('');
  const restoring = record.isArchived || record.isActive === false;
  const posts = resource === 'announcements';
  const eligible = posts || restoring || ({'document-requests':['Completed','Rejected'],'blotter-reports':['Resolved','Dismissed'],suggestions:['Resolved','Dismissed','Approved','Rejected']}[resource] || []).includes(record.status);
  if (!eligible) return null;
  const save = async event => {
    event.preventDefault();
    if (saving) return;
    const expiresAt = posts && restoring ? new Date(`${expiry}+08:00`) : null;
    if (expiresAt && (!Number.isFinite(expiresAt.getTime()) || expiresAt <= new Date())) { setError('Choose a future expiration date and time.'); return; }
    setSaving(true); setError('');
    try {
      const response = await fetch(`${endpoints.auth.backendBaseUrl}/api/${resource}/${record._id}/archive`, {
        method:'PATCH', headers:{'Content-Type':'application/json','auth-token':localStorage.getItem('token')},
        body:JSON.stringify({archived:!restoring,...(expiresAt ? {expiresAt:expiresAt.toISOString()} : {})}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'The record could not be updated.');
      ref.current.close(); showNotification(data.message,'success'); await onChanged();
    } catch (err) { setError(err.message || 'Unable to update the archive. Please try again.'); }
    finally { setSaving(false); }
  };
  return <><button type="button" className="record-archive-button" onClick={event => { event.stopPropagation(); setError(''); setExpiry(manilaDateTimeInput(new Date(Date.now() + (record.isUrgent ? 1 : 7)*86400000))); ref.current.showModal(); }}>{restoring ? <RotateCcw size={15}/> : <Archive size={15}/>} {restoring ? 'Restore' : 'Archive'}</button>
    <dialog ref={ref} className="record-dialog" onCancel={event => { if(saving) event.preventDefault(); }} onClick={event => event.stopPropagation()}>
      <form onSubmit={save}><h2>{restoring ? 'Restore this record?' : 'Archive this record?'}</h2><p>{posts ? (restoring ? 'Choose how long this post will return to residents’ feeds.' : 'This post will leave residents’ feeds and remain available in Archived.') : (restoring ? 'This record will return to the current records list.' : 'This closed record will move to Archived. Its status and resident history will be preserved.')}</p>
      {posts && restoring && <label className="record-expiry-label">Expiration (Philippine time)<input type="datetime-local" required value={expiry} min={manilaDateTimeInput(new Date())} onChange={e=>setExpiry(e.target.value)}/></label>}
      {error && <p role="alert" className="record-error">{error}</p>}<div className="record-dialog-actions"><button type="button" disabled={saving} onClick={()=>ref.current.close()}>Cancel</button><button type="submit" disabled={saving}>{saving ? 'Saving…' : restoring ? 'Restore record' : 'Archive record'}</button></div></form>
    </dialog></>;
}
