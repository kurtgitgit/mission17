import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Search, Clock, CheckCircle, Activity, XCircle, MapPin, User, FileText, ChevronRight, ExternalLink, Printer, Scale, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { blotterApi } from '../services/api.service';
import { useNotification } from '../context/NotificationContext';
import '../styles/AdminWorkspace.css';
import '../styles/DashboardHome.css';
import '../styles/ActivityConsole.css';
import '../styles/BlotterManagement.css';

const LUPON_STAGES = [
  'None',
  'Mediation (1st Hearing)',
  'Conciliation (2nd Hearing)',
  'Arbitration (3rd Hearing)'
];
const CASE_OUTCOMES = ['Open', 'Amicable Settlement', 'Issued Certificate to File Action (CFA)'];
const CFA_FORM_VARIANTS = [
  {
    value: 'repudiated-settlement',
    number: '20',
    title: 'Certification to File Action — repudiated settlement',
    signer: 'Lupon Secretary',
    attestor: 'Lupon Chairman',
    body: 'There was a personal confrontation between the parties before the Punong Barangay. A settlement was reached, but it was repudiated by {party} in a sworn statement before the Punong Barangay on {date}, on the ground of {ground}. The corresponding complaint for the dispute may now be filed in court or the appropriate government office.'
  },
  {
    value: 'pangkat-failed-conciliation',
    number: '21',
    title: 'Certification to File Action — conciliation unsuccessful',
    signer: 'Pangkat Secretary',
    attestor: 'Pangkat Chairman',
    body: 'There was a personal confrontation between the parties before the Punong Barangay, but mediation failed. The Pangkat ng Tagapagkasundo was constituted, but the confrontation before the Pangkat likewise did not result in a settlement. The corresponding complaint for the dispute may now be filed in court or the appropriate government office.'
  },
  {
    value: 'respondent-failed-to-appear',
    number: '22',
    title: 'Certification to File Action — respondent failed to appear',
    signer: 'Pangkat Secretary',
    attestor: 'Pangkat Chairman',
    body: 'Mediation before the Punong Barangay failed. A meeting was set to constitute the Pangkat ng Tagapagkasundo, but the respondent willfully failed or refused to appear, without justifiable reason, at the Pangkat conciliation proceedings. The corresponding complaint for the dispute may now be filed in court or the appropriate government office.'
  }
];

const CASE_STATUSES = [
  { value: 'Pending', label: 'Pending Review' },
  { value: 'In Progress', label: 'Active / In Progress' },
  { value: 'Resolved', label: 'Resolved / Closed' },
  { value: 'Dismissed', label: 'Dismissed' }
];
const TRIAGE_OUTCOMES = [
  { value: 'Pending Review', label: 'Pending Review' },
  { value: 'Follow-up Needed', label: 'Follow-up Needed' },
  { value: 'Potential Lupon Referral', label: 'Potential Lupon Referral' },
  { value: 'Referred Outside Lupon', label: 'Referred Outside Lupon' },
];

const TERMINAL_CASE_STATUSES = ['Resolved', 'Dismissed'];
const SCHEDULED_HEARING_STAGES = ['Mediation (1st Hearing)', 'Conciliation (2nd Hearing)', 'Arbitration (3rd Hearing)'];
const LEGACY_OUTCOMES_BY_HEARING_STAGE = {
  'Amicable Settlement': 'Amicable Settlement',
  'Issued Certificate to File Action (CFA)': 'Issued Certificate to File Action (CFA)',
};

const getNormalizedWorkflow = (report) => {
  const legacyOutcome = LEGACY_OUTCOMES_BY_HEARING_STAGE[report?.hearingStage];
  return {
    hearingStage: SCHEDULED_HEARING_STAGES.includes(report?.hearingStage) ? report.hearingStage : 'None',
    caseOutcome: report?.caseOutcome && report.caseOutcome !== 'Open'
      ? report.caseOutcome
      : (legacyOutcome || report?.caseOutcome || 'Open'),
  };
};

const toDateTimeLocalValue = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 16);
};

const getCaseFormValues = (report) => ({
  status: report?.status || 'Pending',
  triageOutcome: report?.triageOutcome || 'Pending Review',
  adminRemarks: report?.adminRemarks || '',
  respondentName: report?.respondentName || '',
  hearingDate: toDateTimeLocalValue(report?.hearingDate),
  ...getNormalizedWorkflow(report),
  cfaFormBasis: report?.cfaFormBasis || '',
  luponOfficerInCharge: report?.luponOfficerInCharge || 'Punong Barangay / Lupon Tagapamayapa'
});

const HEARING_EVENT_LABELS = {
  scheduled: 'Scheduled',
  'stage-advanced': 'Next stage scheduled',
  rescheduled: 'Rescheduled',
  'presiding-officer-updated': 'Presiding officer updated',
  'previously-recorded': 'Previously recorded schedule (earlier history unavailable)',
};

const getHearingHistoryForDisplay = (report) => {
  if (Array.isArray(report?.hearingHistory) && report.hearingHistory.length) return report.hearingHistory;

  const workflow = getNormalizedWorkflow(report);
  if (workflow.hearingStage === 'None' || !report?.hearingDate) return [];

  // Older reports have only the latest schedule fields, not a true timeline.
  return [{
    _id: 'legacy-schedule',
    hearingStage: workflow.hearingStage,
    hearingDate: report.hearingDate,
    presidingOfficer: report.luponOfficerInCharge || '',
    eventType: 'previously-recorded',
    staffNotes: '',
    recordedAt: report.updatedAt || report.createdAt,
  }];
};

const formatIncidentDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ─── KP FORM NO. 9 RESPONDENT SUMMONS DRAFT ────────────────────────────────
const KPForm9Modal = ({ report, complainantName, onClose }) => {
  useEffect(() => {
    if (!report) return undefined;

    document.body.classList.add('kp-form-printing');
    return () => document.body.classList.remove('kp-form-printing');
  }, [report]);

  if (!report) return null;

  const handlePrint = () => {
    window.print();
  };

  const hearingDateObj = new Date(report.hearingDate || report.createdAt);
  const hearingDay = hearingDateObj.getDate();
  const hearingMonth = hearingDateObj.toLocaleString('fil-PH', { month: 'long' });
  const hearingYear = hearingDateObj.getFullYear();
  const hearingTime = hearingDateObj.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.toLocaleString('fil-PH', { month: 'long' });
  const currentYear = today.getFullYear();

  return (
    <div className="kp-form-modal" role="dialog" aria-modal="true" aria-labelledby="kp-form-modal-title" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px', backdropFilter: 'blur(4px)' }}>
      <div className="kp-form-dialog" style={{ backgroundColor: 'white', width: '100%', maxWidth: '900px', maxHeight: '90vh', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div className="no-print kp9-modal-toolbar">
          <div className="kp9-modal-title">
            <Scale size={20} color="#0038A8" />
            <div>
              <strong id="kp-form-modal-title">KP Form No. 9 — Respondent Summons</strong>
              <span>Draft preview · confirm with your Lupon Secretary before official use</span>
            </div>
          </div>
          <div className="kp9-toolbar-actions">
            <button type="button" onClick={handlePrint} className="kp9-print-button"><Printer size={15} /> Print draft</button>
            <button type="button" onClick={onClose} className="kp9-close-button">Close</button>
          </div>
        </div>

        <div id="printable-kp-form" className="kp9-document">
          <div className="kp9-review-notice no-print">
            <strong>Review before issuance</strong>
            <span>This follows the DILG KP Form No. 9 summons structure. BrgyLink does not store the official barangay case number or proof/method of service. Attach the complaint copy and complete the Officer’s Return after service.</span>
          </div>

          <section className="kp9-page kp9-summons-page" aria-label="KP Form No. 9 summons">
            <div className="kp9-draft-mark">DRAFT — FOR LOCAL LUPON REVIEW</div>
            <header className="kp9-letterhead">
              <div>Republic of the Philippines</div>
              <div>Province of Pangasinan</div>
              <div>Municipality of San Jacinto</div>
              <strong>Barangay Bagong Pag-asa</strong>
              <strong>OFFICE OF THE LUPONG TAGAPAMAYAPA</strong>
            </header>

            <div className="kp9-case-meta">
              <div><span>Barangay Case No.</span><strong className="kp9-blank-line" /></div>
              <div><span>For</span><strong>{report.incidentType || '____________________________'}</strong></div>
              <div><span>BrgyLink Reference</span><strong>{report.referenceNumber || '—'}</strong></div>
            </div>

            <div className="kp9-parties">
              <div className="kp9-party"><strong>{complainantName || '____________________________'}</strong><span>Complainant/s</span></div>
              <div className="kp9-against">— against —</div>
              <div className="kp9-party"><strong>{report.respondentName || '____________________________'}</strong><span>Respondent/s</span></div>
            </div>

            <h1 className="kp9-form-title">SUMMONS</h1>
            <div className="kp9-to-line"><strong>TO:</strong><span>{report.respondentName || '_______________________________________________'}</span><small>Respondent/s</small></div>
            <div className="kp9-body-copy">
              <p>You are hereby summoned to appear before me in person, together with your witnesses, on the <strong>{hearingDay}</strong> day of <strong>{hearingMonth}</strong>, <strong>{hearingYear}</strong>, at <strong>{hearingTime}</strong>, then and there to answer to a complaint made before me, copy of which is attached hereto, for mediation/conciliation of your dispute with complainant/s.</p>
              <p>You are hereby warned that if you refuse or willfully fail to appear in obedience to this summons, you may be barred from filing any counterclaim arising from said complaint.</p>
              <p className="kp9-fail-not">FAIL NOT or else face punishment as for contempt of court.</p>
            </div>

            <p className="kp9-issued-date">This {currentDay} day of {currentMonth}, {currentYear}.</p>
            <div className="kp9-signature-block">
              <div className="kp9-signature-line"><strong>&nbsp;</strong><span>Punong Barangay / Lupon Chairman · Signature over printed name</span></div>
            </div>
            <p className="kp9-attachment-note"><strong>Enclosure:</strong> Copy of the complaint</p>
            <footer className="kp9-page-footer">KP Form No. 9 · Summons for the Respondent · Draft populated from BrgyLink case data</footer>
          </section>

          <section className="kp9-page kp9-return-page" aria-label="Officer’s Return of service">
            <div className="kp9-draft-mark">DRAFT — COMPLETE AFTER SERVICE</div>
            <header className="kp9-letterhead kp9-return-letterhead">
              <div>Republic of the Philippines</div>
              <div>Province of Pangasinan · Municipality of San Jacinto</div>
              <strong>Barangay Bagong Pag-asa</strong>
              <strong>OFFICE OF THE LUPONG TAGAPAMAYAPA</strong>
            </header>
            <div className="kp9-return-case-line"><strong>Barangay Case No.:</strong><span /> <strong>BrgyLink Reference:</strong><span>{report.referenceNumber || '—'}</span></div>
            <h2 className="kp9-form-title">OFFICER’S RETURN</h2>
            <p className="kp9-return-intro">I served this summons upon the respondent(s) named below on the date(s) written, by the method indicated:</p>
            <div className="kp9-service-respondent"><span>Respondent name</span><span>Date served</span></div>
            <div className="kp9-service-methods">
              <p>☐ 1. Personally handing the summons to the respondent.</p>
              <p>☐ 2. The respondent refused to receive the summons.</p>
              <p>☐ 3. Leaving the summons at the respondent’s dwelling with a person of suitable age and discretion residing there:</p>
              <div className="kp9-write-line"><span>Name of recipient</span></div>
              <p>☐ 4. Leaving the summons at the respondent’s office/place of business with a competent person in charge:</p>
              <div className="kp9-write-line"><span>Name of recipient</span></div>
            </div>
            <div className="kp9-return-signatures">
              <div className="kp9-signature-line"><strong>&nbsp;</strong><span>Officer serving summons · Signature over printed name</span></div>
              <div className="kp9-recipient-signatures">
                <div className="kp9-signature-line"><strong>&nbsp;</strong><span>Respondent / representative signature</span></div>
                <div className="kp9-signature-line"><strong>&nbsp;</strong><span>Date received</span></div>
              </div>
            </div>
            <footer className="kp9-page-footer">KP Form No. 9 · Officer’s Return · Complete manually after service</footer>
          </section>
        </div>
      </div>
    </div>
  );
};

const KPOutcomeFormModal = ({ type, report, complainantName, onClose }) => {
  const cfaVariant = report.cfaFormBasis || '';
  const cfaForm = CFA_FORM_VARIANTS.find((form) => form.value === cfaVariant);
  const today = new Date();

  useEffect(() => {
    if (!type) return undefined;
    document.body.classList.add('kp-form-printing');
    return () => document.body.classList.remove('kp-form-printing');
  }, [type]);

  if (!type || !report) return null;

  const definitions = {
    hearingNotice: { number: '12', title: 'Notice of Hearing (Conciliation Proceedings)' },
    settlement: { number: '16', title: 'Amicable Settlement' },
    cfa: cfaForm ? { number: cfaForm.number, title: cfaForm.title } : { number: '', title: 'Certification to File Action' }
  };
  const definition = definitions[type];
  const printEnabled = type !== 'cfa' || Boolean(cfaForm);
  const hearing = new Date(report.hearingDate || report.createdAt);
  const dateLine = `${today.getDate()} ${today.toLocaleString('fil-PH', { month: 'long' })} ${today.getFullYear()}`;

  return (
    <div className="kp-form-modal" role="dialog" aria-modal="true" aria-labelledby="kp-outcome-form-title" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px', backdropFilter: 'blur(4px)' }}>
      <div className="kp-form-dialog" style={{ backgroundColor: 'white', width: '100%', maxWidth: '900px', maxHeight: '90vh', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div className="no-print kp9-modal-toolbar">
          <div className="kp9-modal-title">
            <Scale size={20} color="#0038A8" aria-hidden="true" />
            <div>
              <strong id="kp-outcome-form-title">KP Form No. {definition.number || '—'} — {definition.title}</strong>
              <span>Draft only · verify the correct form and procedure with the Lupon Secretary</span>
            </div>
          </div>
          <div className="kp9-toolbar-actions">
            <button type="button" onClick={() => window.print()} className="kp9-print-button" disabled={!printEnabled}><Printer size={15} /> Print draft</button>
            <button type="button" onClick={onClose} className="kp9-close-button">Close</button>
          </div>
        </div>

        <div id="printable-kp-outcome-form" className="kp9-document">
          <div className="kp9-review-notice no-print">
            <strong>Official review required</strong>
            <span>This is a draft based on the DILG handbook structure. Confirm jurisdiction, procedural grounds, parties, case number, language, signatures, and attestation before any official use. BrgyLink does not issue or sign this document.</span>
          </div>

          {type === 'cfa' && (
            <div className="kp-outcome-form-selector no-print">
              <strong>Saved CFA basis from the case record</strong>
              <div className="kp-outcome-form-selection-preview" role="status" aria-live="polite">
                {cfaForm
                  ? <>Previewing saved basis: <strong>KP Form No. {cfaForm.number}</strong> — {cfaForm.title.replace('Certification to File Action — ', '')}. The certification text and required signatories below match this case record.</>
                  : 'No CFA basis is saved. Close this preview, choose the basis in the staff workflow, and save the case first.'}
              </div>
              <small>The Lupon Secretary must confirm that this saved basis matches the official case record. Change it in the staff workflow and save before printing.</small>
            </div>
          )}

          <section className="kp9-page kp-outcome-form-page" aria-label={`KP Form No. ${definition.number || 'CFA'} draft`}>
            <div className="kp9-draft-mark">DRAFT — FOR LOCAL LUPON REVIEW</div>
            <header className="kp9-letterhead">
              <div>Republic of the Philippines</div>
              <div>Province of Pangasinan</div>
              <div>Municipality of San Jacinto</div>
              <strong>Barangay Bagong Pag-asa</strong>
              <strong>OFFICE OF THE LUPONG TAGAPAMAYAPA</strong>
            </header>

            <div className="kp9-case-meta">
              <div><span>Barangay Case No.</span><strong className="kp9-blank-line" /></div>
              <div><span>For</span><strong>{report.incidentType || '____________________________'}</strong></div>
              <div><span>BrgyLink Reference</span><strong>{report.referenceNumber || '—'}</strong></div>
            </div>
            <div className="kp9-parties">
              <div className="kp9-party"><strong>{complainantName || '____________________________'}</strong><span>Complainant/s</span></div>
              <div className="kp9-against">— against —</div>
              <div className="kp9-party"><strong>{report.respondentName || '____________________________'}</strong><span>Respondent/s</span></div>
            </div>

            {type === 'hearingNotice' && (
              <>
                <h1 className="kp9-form-title">NOTICE OF HEARING<br />(CONCILIATION PROCEEDINGS)</h1>
                <p className="kp-outcome-form-copy">To the parties named above:</p>
                <p className="kp-outcome-form-copy">You are hereby required to appear before the Pangkat ng Tagapagkasundo on the <strong>{Number.isNaN(hearing.getTime()) ? '________' : hearing.getDate()}</strong> day of <strong>{Number.isNaN(hearing.getTime()) ? '________________' : hearing.toLocaleString('fil-PH', { month: 'long' })}</strong>, <strong>{Number.isNaN(hearing.getTime()) ? '________' : hearing.getFullYear()}</strong>, at <strong>{Number.isNaN(hearing.getTime()) ? '________' : hearing.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</strong> for conciliation proceedings in this case.</p>
                <p className="kp-outcome-form-copy">Issued this {dateLine}.</p>
                <div className="kp-outcome-form-signature"><strong>&nbsp;</strong><span>Pangkat Chairman · Signature over printed name</span></div>
                <div className="kp-outcome-form-notified"><strong>Notified this ______ day of __________________, ______.</strong><span>Complainant/s signature: ____________________________</span><span>Respondent/s signature: ____________________________</span></div>
              </>
            )}

            {type === 'settlement' && (
              <>
                <h1 className="kp9-form-title">AMICABLE SETTLEMENT</h1>
                <p className="kp-outcome-form-copy">We, the complainant/s and respondent/s in the above-captioned case, freely and voluntarily agree to settle our dispute as follows:</p>
                <div className="kp-outcome-form-writing-lines" aria-label="Space to write settlement terms"><span>Write the specific terms agreed by both parties.</span></div>
                <p className="kp-outcome-form-copy">We bind ourselves to comply honestly and faithfully with the terms of settlement stated above.</p>
                <p className="kp-outcome-form-copy">Entered into this ______ day of __________________, ______.</p>
                <div className="kp-outcome-form-party-signatures">
                  <div><strong>&nbsp;</strong><span>Complainant/s · Signature</span></div>
                  <div><strong>&nbsp;</strong><span>Respondent/s · Signature</span></div>
                </div>
                <div className="kp-outcome-form-attestation">
                  <p>I certify that this settlement was entered into freely and voluntarily, after I explained its nature and consequences to the parties.</p>
                  <div className="kp-outcome-form-signature"><strong>&nbsp;</strong><span>Punong Barangay / Pangkat Chairman · Attestation</span></div>
                </div>
              </>
            )}

            {type === 'cfa' && (
              <>
                <h1 className="kp9-form-title">CERTIFICATION TO FILE ACTION</h1>
                <p className="kp-outcome-form-copy">This is to certify that:</p>
                {cfaForm ? (
                  <p className="kp-outcome-form-copy">{cfaForm.body.split(/(\{party\}|\{date\}|\{ground\})/g).map((part, index) => {
                    if (part === '{party}') return <span key={index} className="kp-form-blank">________________________</span>;
                    if (part === '{date}') return <span key={index} className="kp-form-blank">________________</span>;
                    if (part === '{ground}') return <span key={index} className="kp-form-blank">________________</span>;
                    return part;
                  })}</p>
                ) : (
                  <p className="kp-outcome-form-copy kp-outcome-form-placeholder">Select the CFA basis above to preview the matching draft. No certification text will be generated until a basis is selected.</p>
                )}
                <p className="kp-outcome-form-copy">Issued this ______ day of __________________, ______.</p>
                {cfaForm && <div className="kp-outcome-form-signature"><strong>&nbsp;</strong><span>{cfaForm.signer} · Signature over printed name</span></div>}
                {cfaForm && <div className="kp-outcome-form-signature"><strong>&nbsp;</strong><span>{cfaForm.attestor} · Attestation</span></div>}
              </>
            )}

            <footer className="kp9-page-footer">KP Form No. {definition.number || '—'} · Draft populated from BrgyLink case data · Official review and completion required</footer>
          </section>
        </div>
      </div>
    </div>
  );
};

const BlotterManagement = () => {
  const { showNotification } = useNotification();
  const isSuperAdmin = (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null')?.role === 'super_admin'; }
    catch { return false; }
  })();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [caseFilter, setCaseFilter] = useState('All');
  
  const [selectedReport, setSelectedReport] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [triageOutcome, setTriageOutcome] = useState('Pending Review');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [respondentName, setRespondentName] = useState('');
  const [hearingDate, setHearingDate] = useState('');
  const [hearingStage, setHearingStage] = useState('None');
  const [caseOutcome, setCaseOutcome] = useState('Open');
  const [cfaFormBasis, setCfaFormBasis] = useState('');
  const [stageAdvanceReason, setStageAdvanceReason] = useState('');
  const [hearingNotes, setHearingNotes] = useState('');
  const [luponOfficerInCharge, setLuponOfficerInCharge] = useState('Punong Barangay / Lupon Tagapamayapa');
  const [savedCaseForm, setSavedCaseForm] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showKpModal, setShowKpModal] = useState(false);
  const [outcomeFormType, setOutcomeFormType] = useState(null);
  const [evidenceObjectUrl, setEvidenceObjectUrl] = useState(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState('');
  const updatingRef = useRef(false);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    let objectUrl;
    let active = true;
    const controller = new AbortController();
    const loadEvidence = async () => {
      if (!selectedReport?.evidenceUrl) {
        setEvidenceObjectUrl(null);
        setEvidenceError('');
        return;
      }
      setEvidenceLoading(true);
      setEvidenceError('');
      setEvidenceObjectUrl(null);
      try {
        const response = await blotterApi.getEvidence(selectedReport._id, controller.signal);
        if (!active) return;
        objectUrl = URL.createObjectURL(response.data);
        setEvidenceObjectUrl(objectUrl);
      } catch (error) {
        if (!active || error.code === 'ERR_CANCELED') return;
        console.error('Could not load protected evidence:', error);
        setEvidenceObjectUrl(null);
        setEvidenceError(error.response?.data?.message || 'The protected evidence is unavailable. It may not have been migrated to this server.');
      } finally {
        if (active) setEvidenceLoading(false);
      }
    };
    void loadEvidence();
    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedReport?._id, selectedReport?.evidenceUrl]);

  const fetchReports = async () => {
    try {
      const res = await blotterApi.getAll();
      setReports(res.data);
    } catch (err) {
      console.error('Error fetching blotter reports', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReport = (report) => {
    const values = getCaseFormValues(report);
    setSelectedReport(report);
    setNewStatus(values.status);
    setTriageOutcome(values.triageOutcome);
    setAdminRemarks(values.adminRemarks);
    setRespondentName(values.respondentName);
    setHearingDate(values.hearingDate);
    setHearingStage(values.hearingStage);
    setCaseOutcome(values.caseOutcome);
    setCfaFormBasis(values.cfaFormBasis);
    setStageAdvanceReason('');
    setHearingNotes('');
    setLuponOfficerInCharge(values.luponOfficerInCharge);
    setSavedCaseForm(values);
  };

  const hasCaseFormChanges = Boolean(savedCaseForm && (
    newStatus !== savedCaseForm.status ||
    triageOutcome !== savedCaseForm.triageOutcome ||
    adminRemarks !== savedCaseForm.adminRemarks ||
    respondentName !== savedCaseForm.respondentName ||
    hearingDate !== savedCaseForm.hearingDate ||
    hearingStage !== savedCaseForm.hearingStage ||
    caseOutcome !== savedCaseForm.caseOutcome ||
    cfaFormBasis !== savedCaseForm.cfaFormBasis ||
    luponOfficerInCharge !== savedCaseForm.luponOfficerInCharge
  ));

  const hasHearingScheduleChange = Boolean(savedCaseForm && (
    hearingStage !== savedCaseForm.hearingStage
    || hearingDate !== savedCaseForm.hearingDate
    || luponOfficerInCharge !== savedCaseForm.luponOfficerInCharge
  ));

  const requiresHearingSchedule = SCHEDULED_HEARING_STAGES.includes(hearingStage);
  const requiresNewHearingDate = Boolean(
    savedCaseForm
    && hearingStage !== savedCaseForm.hearingStage
    && savedCaseForm.hearingStage !== 'None'
  );
  const hasNewHearingDate = !requiresNewHearingDate || Boolean(hearingDate && hearingDate !== savedCaseForm.hearingDate);
  const hasCompleteHearingSchedule = !requiresHearingSchedule || Boolean(
    triageOutcome === 'Potential Lupon Referral' && respondentName.trim() && hearingDate && hasNewHearingDate && luponOfficerInCharge.trim()
  );
  const savedStageIndex = savedCaseForm ? LUPON_STAGES.indexOf(savedCaseForm.hearingStage) : 0;
  const selectedStageIndex = LUPON_STAGES.indexOf(hearingStage);
  const requiresPriorProcessNote = Boolean(savedCaseForm && selectedStageIndex > savedStageIndex + 1);
  const hasPriorProcessNote = !requiresPriorProcessNote || stageAdvanceReason.trim().length >= 10;
  const hasCompleteCaseOutcome = caseOutcome === 'Open'
    || (caseOutcome === 'Amicable Settlement' && Boolean(
      savedCaseForm?.caseOutcome === 'Amicable Settlement'
      || (requiresHearingSchedule && hasCompleteHearingSchedule && respondentName.trim())
    ))
    || (caseOutcome === 'Issued Certificate to File Action (CFA)' && Boolean(
      savedCaseForm?.caseOutcome === 'Issued Certificate to File Action (CFA)'
      || (cfaFormBasis && !(savedCaseForm?.caseOutcome === 'Open' && cfaFormBasis === 'repudiated-settlement') && (savedCaseForm?.caseOutcome !== 'Open' || (
        requiresHearingSchedule && hasCompleteHearingSchedule && respondentName.trim()
      )))
    ));
  const canPrintSummons = Boolean(
    !TERMINAL_CASE_STATUSES.includes(selectedReport?.status)
    && requiresHearingSchedule
    && triageOutcome === 'Potential Lupon Referral'
    && hearingStage === 'Mediation (1st Hearing)'
    && hearingDate
    && respondentName.trim()
    && luponOfficerInCharge.trim()
  );
  const savedWorkflow = getNormalizedWorkflow(selectedReport);
  const hearingHistory = getHearingHistoryForDisplay(selectedReport);
  const canPrintHearingNotice = savedWorkflow.hearingStage === 'Conciliation (2nd Hearing)' && Boolean(selectedReport?.hearingDate);
  const canPrintSettlementForm = savedWorkflow.caseOutcome === 'Amicable Settlement';
  const canPrintCfaForm = savedWorkflow.caseOutcome === 'Issued Certificate to File Action (CFA)' && Boolean(selectedReport?.cfaFormBasis);
  const isCaseFormSaveDisabled = updating || !hasCaseFormChanges || !hasCompleteHearingSchedule || !hasCompleteCaseOutcome || !hasPriorProcessNote;

  const isCaseStatusDisabled = (status) => {
    if (!savedCaseForm || status === savedCaseForm.status) return false;
    if (TERMINAL_CASE_STATUSES.includes(savedCaseForm.status)) return true;
    const savedRank = CASE_STATUSES.findIndex(item => item.value === savedCaseForm.status);
    const optionRank = CASE_STATUSES.findIndex(item => item.value === status);
    return optionRank <= savedRank;
  };

  const isHearingStageDisabled = (stage) => {
    if (!savedCaseForm || stage === savedCaseForm.hearingStage) return false;
    if (savedCaseForm.caseOutcome !== 'Open') return true;
    return LUPON_STAGES.indexOf(stage) <= LUPON_STAGES.indexOf(savedCaseForm.hearingStage);
  };

  const isCaseOutcomeDisabled = (outcome) => {
    if (!savedCaseForm || outcome === savedCaseForm.caseOutcome) return false;
    if (savedCaseForm.caseOutcome === 'Issued Certificate to File Action (CFA)') return true;
    if (savedCaseForm.caseOutcome === 'Amicable Settlement') {
      return outcome !== 'Issued Certificate to File Action (CFA)';
    }
    return false;
  };

  const isCfaBasisDisabled = (basis) => (
    (savedCaseForm?.caseOutcome === 'Amicable Settlement' && basis !== 'repudiated-settlement')
    || (savedCaseForm?.caseOutcome === 'Open' && basis === 'repudiated-settlement')
  );

  const handleUpdateStatus = async () => {
    if (!selectedReport || !hasCaseFormChanges || !hasCompleteHearingSchedule || !hasCompleteCaseOutcome || !hasPriorProcessNote || updatingRef.current) return;
    updatingRef.current = true;
    setUpdating(true);
    try {
      const res = await blotterApi.updateStatus(selectedReport._id, {
        status: newStatus,
        triageOutcome,
        adminRemarks,
        respondentName,
        hearingDate: hearingDate || null,
        hearingStage,
        caseOutcome,
        cfaFormBasis: cfaFormBasis || null,
        ...(requiresPriorProcessNote ? { stageAdvanceReason } : {}),
        ...(hasHearingScheduleChange ? { hearingNotes } : {}),
        luponOfficerInCharge
      });
      const updatedReport = res.data?.report || {
        ...selectedReport,
        status: newStatus,
        triageOutcome,
        adminRemarks,
        respondentName,
        hearingDate,
        hearingStage,
        caseOutcome,
        cfaFormBasis: cfaFormBasis || null,
        luponOfficerInCharge
      };
      
      // Update local state to reflect change instantly
      setReports(reports.map(r => r._id === selectedReport._id ? updatedReport : r));
      setSelectedReport(updatedReport);
      const savedValues = getCaseFormValues(updatedReport);
      setNewStatus(savedValues.status);
      setTriageOutcome(savedValues.triageOutcome);
      setAdminRemarks(savedValues.adminRemarks);
      setRespondentName(savedValues.respondentName);
      setHearingDate(savedValues.hearingDate);
      setHearingStage(savedValues.hearingStage);
      setCaseOutcome(savedValues.caseOutcome);
      setCfaFormBasis(savedValues.cfaFormBasis);
      setStageAdvanceReason('');
      setHearingNotes('');
      setLuponOfficerInCharge(savedValues.luponOfficerInCharge);
      setSavedCaseForm(savedValues);
      showNotification('Blotter record & Lupon schedule saved successfully.', 'success');
    } catch (err) {
      console.error('Failed to update status', err);
      showNotification(err.response?.data?.message || 'Failed to update report status.', 'error');
    } finally {
      updatingRef.current = false;
      setUpdating(false);
    }
  };


  const getComplainantName = (report) => {
    if (report.fullName) return report.fullName;
    
    if (report.userId && (report.userId.firstName || report.userId.lastName)) {
      return `${report.userId.firstName || ''} ${report.userId.middleName || ''} ${report.userId.lastName || ''}`.replace(/\s+/g, ' ').trim();
    }
    return report.username;
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.incidentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getComplainantName(r).toLowerCase().includes(searchTerm.toLowerCase());
    const hasHearing = getNormalizedWorkflow(r).hearingStage !== 'None';
    const matchesFilter = caseFilter === 'All' ||
      (caseFilter === 'Hearing Scheduled' ? hasHearing : r.status === caseFilter);
    return matchesSearch && matchesFilter;
  });

  const isTerminalCase = (status) => ['Resolved', 'Dismissed'].includes(status);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pending': return <span className="status-badge pending" style={{ padding: '4px 8px', fontSize: '11px' }}><Clock size={12}/> Pending</span>;
      case 'In Progress': return <span className="status-badge in-progress" style={{ padding: '4px 8px', fontSize: '11px' }}><Activity size={12}/> In Progress</span>;
      case 'Resolved': return <span className="status-badge approved" style={{ padding: '4px 8px', fontSize: '11px' }}><CheckCircle size={12}/> Resolved</span>;
      case 'Dismissed': return <span className="status-badge rejected" style={{ padding: '4px 8px', fontSize: '11px' }}><XCircle size={12}/> Dismissed</span>;
      default: return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div className="dashboard-container">
      {/* KP FORM NO. 9 MODAL */}
      {showKpModal && selectedReport && (
        <KPForm9Modal
          report={{ ...selectedReport, respondentName, hearingDate, hearingStage, luponOfficerInCharge }}
          complainantName={getComplainantName(selectedReport)}
          onClose={() => setShowKpModal(false)}
        />
      )}
      {outcomeFormType && selectedReport && (
        <KPOutcomeFormModal
          type={outcomeFormType}
          report={selectedReport}
          complainantName={getComplainantName(selectedReport)}
          onClose={() => setOutcomeFormType(null)}
        />
      )}

      <Sidebar />
      <main className="main-content admin-workspace-page blotter-admin-page">
        
        {/* HEADER */}
        <header className="top-header blotter-page-header">
          <div className="blotter-page-heading">
            <div>
              <p className="blotter-eyebrow">CASE MANAGEMENT</p>
              <h1 className="greeting">
                <Scale size={24} aria-hidden="true" /> Blotter & Lupon Desk
              </h1>
              <p className="subtitle">
                Review incident reports, record decisions, and manage Lupon hearings.
              </p>
            </div>

            <div className="blotter-access-note">
              <ShieldCheck size={16} color="#dc2626" />
              <span>
                Strict RBAC: Authorized Officials & Lupon Only
              </span>
            </div>
          </div>
        </header>

        {/* MASTER-DETAIL LAYOUT */}
        <div className="admin-workspace-split blotter-workspace">
          
          {/* LEFT: CASE LIST (MASTER) */}
          <div className="no-print admin-workspace-panel blotter-queue-panel">
            <div className="blotter-queue-toolbar">
              <div className="blotter-queue-title">
                <strong>Case queue</strong>
                <span>{filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'}</span>
              </div>
              <div className="search-box search-box--light blotter-search">
                <Search size={18} color="#64748b" />
                <input 
                  type="text" 
                  placeholder="Search ref no., resident, or type..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="blotter-filters" aria-label="Filter case queue">
                {['All', 'Pending', 'In Progress', 'Hearing Scheduled', 'Resolved', 'Dismissed'].map(filter => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setCaseFilter(filter)}
                    className={`blotter-filter${caseFilter === filter ? ' is-active' : ''}`}
                    aria-pressed={caseFilter === filter}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="admin-workspace-scroll blotter-queue-scroll">
              {loading ? (
                <div className="loading-state" style={{ marginTop: '50px' }}>Loading cases...</div>
              ) : filteredReports.length === 0 ? (
                <div className="empty-state blotter-queue-empty">
                  <ShieldAlert size={40} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
                  <p>No cases found.</p>
                </div>
              ) : (
                filteredReports.map(report => (
                  <button
                    type="button"
                    key={report._id}
                    onClick={() => handleSelectReport(report)}
                    className={`blotter-case-card${selectedReport?._id === report._id ? ' is-selected' : ''}`}
                    aria-pressed={selectedReport?._id === report._id}
                  >
                    <div className="blotter-case-card-top">
                      <span className="blotter-case-reference">{report.referenceNumber}</span>
                      {getStatusBadge(report.status)}
                    </div>
                    <div className="blotter-case-type">
                      {report.incidentType}
                    </div>
                    <div className="blotter-case-complainant">
                      <span>Filed by</span> {getComplainantName(report)}
                    </div>
                    {getNormalizedWorkflow(report).hearingStage !== 'None' && (
                      <div className="blotter-case-hearing">
                        <Scale size={13} aria-hidden="true" /> {getNormalizedWorkflow(report).hearingStage}
                      </div>
                    )}
                    {getNormalizedWorkflow(report).caseOutcome !== 'Open' && (
                      <div className="blotter-case-hearing">
                        <FileText size={13} aria-hidden="true" /> {getNormalizedWorkflow(report).caseOutcome}
                      </div>
                    )}
                    <div className="blotter-case-card-bottom">
                      <span>
                        {formatIncidentDateTime(report.dateOfIncident || report.createdAt)}
                      </span>
                      <ChevronRight size={15} color={selectedReport?._id === report._id ? '#0038A8' : '#cbd5e1'} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: CASE DETAILS (DETAIL) */}
          <div className="admin-workspace-panel blotter-detail-panel">
            {!selectedReport ? (
              <div className="blotter-detail-empty">
                <FileText size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <h3 style={{ margin: '0 0 6px 0', color: '#475569' }}>Select a blotter case to view details</h3>
                <p style={{ margin: 0, fontSize: 13 }}>Click on any incident report from the left queue to review and schedule Lupon conciliation.</p>
              </div>
            ) : (
              <>
                {/* CASE HEADER */}
                <div className="blotter-case-header">
                  <div>
                    <p className="blotter-eyebrow">SELECTED CASE</p>
                    <h2>
                      {selectedReport.referenceNumber}
                    </h2>
                    <span className="blotter-case-subtitle">
                      {selectedReport.incidentType} <span aria-hidden="true">·</span> Reported {formatIncidentDateTime(selectedReport.dateOfIncident || selectedReport.createdAt)}
                    </span>
                  </div>
                  <div className="blotter-case-header-actions">
                    <div className="blotter-status-stack">
                      <span className="blotter-status-caption">CASE STATUS</span>
                      {getStatusBadge(selectedReport.status)}
                    </div>
                    <div className={`blotter-triage-chip blotter-triage-${(triageOutcome || 'Pending Review').toLowerCase().replace(/[^a-z]+/g, '-')}`}>
                      <span className="blotter-status-caption">STAFF REVIEW</span>
                      <strong>{triageOutcome || 'Pending Review'}</strong>
                    </div>

                    {!isTerminalCase(selectedReport.status) && (
                    <button
                      onClick={() => setShowKpModal(true)}
                      disabled={!canPrintSummons}
                      className="no-print blotter-header-button blotter-header-button--primary"
                      title={canPrintSummons ? 'Print the respondent summons draft for the first mediation hearing' : 'For KP Form No. 9, select the first mediation hearing and provide the confirmed respondent, date/time, and presiding officer'}
                    >
                      <Scale size={14} />
                      KP Form No. 9 Draft
                    </button>
                    )}

                    {canPrintHearingNotice && (
                      <button type="button" onClick={() => setOutcomeFormType('hearingNotice')} className="no-print blotter-header-button" title="Preview and print a draft KP Form No. 12 hearing notice">
                        <Printer size={14} /> KP Form No. 12 Draft
                      </button>
                    )}
                    {canPrintSettlementForm && (
                      <button type="button" onClick={() => setOutcomeFormType('settlement')} className="no-print blotter-header-button" title="Preview and print a draft KP Form No. 16 settlement">
                        <Printer size={14} /> KP Form No. 16 Draft
                      </button>
                    )}
                    {canPrintCfaForm && (
                      <button type="button" onClick={() => setOutcomeFormType('cfa')} className="no-print blotter-header-button" title="Choose the applicable CFA basis, then preview its draft">
                        <Printer size={14} /> CFA Draft
                      </button>
                    )}

                    <button 
                      onClick={() => window.print()}
                      className="no-print blotter-header-button"
                      title="Print Blotter Extract"
                    >
                      <Printer size={14} />
                      Print
                    </button>
                  </div>
                </div>

                {/* CASE BODY (SCROLLABLE) */}
                <div className="admin-workspace-scroll blotter-detail-scroll">
                  <div className="blotter-next-step" role="status">
                    <div className="blotter-next-step-icon"><Clock size={18} aria-hidden="true" /></div>
                    <div>
                      <span>RECOMMENDED NEXT STEP</span>
                      <strong>
                        {triageOutcome === 'Pending Review' ? 'Review the report and record a staff assessment.' :
                          triageOutcome === 'Follow-up Needed' ? 'Contact or follow up using the official case notes.' :
                            triageOutcome === 'Potential Lupon Referral' ? 'Confirm the respondent, then complete the hearing details if ready.' :
                              'Record the appropriate external referral and resident-facing update.'}
                      </strong>
                    </div>
                  </div>
                  <div className="blotter-case-facts">
                    <div><span>FILED</span><strong>{new Date(selectedReport.createdAt).toLocaleDateString()}</strong></div>
                    <div><span>LUPON STAGE</span><strong>{savedWorkflow.hearingStage !== 'None' ? savedWorkflow.hearingStage : 'Not scheduled'}</strong></div>
                    <div><span>CASE OUTCOME</span><strong>{savedWorkflow.caseOutcome}</strong></div>
                    <div><span>RECORD ACCESS</span><strong className="is-confidential">Confidential</strong></div>
                  </div>

                  {hearingHistory.length > 0 && (
                    <section aria-labelledby="blotter-hearing-history-title" style={{ margin: '14px 0', padding: 16, border: '1px solid #cbd5e1', borderRadius: 12, background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
                        <h3 id="blotter-hearing-history-title" style={{ margin: 0, color: '#0f172a', fontSize: 15 }}>Hearing schedule history</h3>
                        <span style={{ color: '#64748b', fontSize: 11 }}>Staff-only case record</span>
                      </div>
                      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
                        {hearingHistory.map((event, index) => (
                          <li key={event._id || `${event.hearingStage}-${event.hearingDate}-${index}`} style={{ padding: '10px 12px', borderLeft: '3px solid #1d4ed8', borderRadius: '0 8px 8px 0', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 }}>
                              <strong style={{ color: '#1e3a8a', fontSize: 13 }}>{event.hearingStage} · {HEARING_EVENT_LABELS[event.eventType] || 'Schedule updated'}</strong>
                              {event.recordedAt && <span style={{ color: '#64748b', fontSize: 11 }}>Recorded {formatIncidentDateTime(event.recordedAt)}</span>}
                            </div>
                            <div style={{ color: '#334155', fontSize: 12, marginTop: 5 }}>Scheduled for {formatIncidentDateTime(event.hearingDate)}</div>
                            {event.presidingOfficer && <div style={{ color: '#475569', fontSize: 12, marginTop: 3 }}>Presiding officer: {event.presidingOfficer}</div>}
                            {event.recordedByName && <div style={{ color: '#64748b', fontSize: 11, marginTop: 3 }}>Recorded by: {event.recordedByName}</div>}
                            {event.staffNotes && (
                              <p style={{ color: '#475569', fontSize: 12, lineHeight: 1.45, margin: '7px 0 0', whiteSpace: 'pre-wrap' }}>
                                <strong>Staff-only note:</strong> {event.staffNotes}
                              </p>
                            )}
                          </li>
                        ))}
                      </ol>
                    </section>
                  )}
                  
                  {/* COMAPLAINANT VS RESPONDENT CARD */}
                  <div className="blotter-parties-grid">
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px' }}>
                        <User size={18} color="#0038A8" />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Complainant</div>
                        <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 'bold' }}>{getComplainantName(selectedReport)}</div>
                        {selectedReport.contactNumber && (
                          <div style={{ fontSize: '12px', color: '#475569', marginTop: '1px' }}>
                            📞 {selectedReport.contactNumber}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: '#fee2e2', padding: '10px', borderRadius: '8px' }}>
                        <AlertCircle size={18} color="#dc2626" />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: '800', textTransform: 'uppercase' }}>Respondent (Complained)</div>
                        <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 'bold' }}>
                          {selectedReport.respondentName || respondentName || 'To Be Identified'}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px' }}>
                        <Clock size={18} color="#0038A8" />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Incident date & time</div>
                        <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 'bold' }}>
                          {formatIncidentDateTime(selectedReport.dateOfIncident || selectedReport.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px' }}>
                        <MapPin size={18} color="#0038A8" />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Location</div>
                        <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 'bold' }}>{selectedReport.location}</div>
                      </div>
                    </div>
                  </div>

                  {/* INCIDENT DETAILS */}
                  <div className="blotter-content-card">
                    {selectedReport.reportedRespondentName && (
                      <div style={{ padding: '10px 12px', marginBottom: '12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
                        <strong style={{ color: '#92400e', fontSize: 12 }}>Person named by resident (unverified): </strong>
                        <span style={{ color: '#78350f', fontSize: 13 }}>{selectedReport.reportedRespondentName}</span>
                        <div style={{ color: '#92400e', fontSize: 11, marginTop: 3 }}>Review this report before entering a staff-confirmed respondent below.</div>
                      </div>
                    )}
                    <h3 style={{ fontSize: '13px', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800 }}>Incident Narrative</h3>
                    <p style={{ fontSize: '14.5px', color: '#334155', lineHeight: '1.6', margin: 0 }}>
                      {selectedReport.description}
                    </p>
                  </div>

                  {/* EVIDENCE */}
                  <div className="blotter-evidence-section">
                    <h3>Photo Proof / Attachment</h3>
                    <p style={{ margin: '0 0 8px', fontSize: 12, color: '#92400e' }}>Resident-uploaded evidence — review and validate before relying on it for a case decision.</p>
                    {selectedReport.evidenceUrl && evidenceLoading ? (
                      <div role="status" style={{ padding: '12px 16px', backgroundColor: '#eff6ff', borderRadius: '8px', color: '#1d4ed8', fontSize: '13px' }}>
                        Loading protected evidence...
                      </div>
                    ) : selectedReport.evidenceUrl && evidenceError ? (
                      <div role="alert" style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '13px' }}>
                        {evidenceError}
                      </div>
                    ) : selectedReport.evidenceUrl && evidenceObjectUrl ? (
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#f8fafc', display: 'inline-block', padding: '10px' }}>
                        <img 
                          src={evidenceObjectUrl || undefined}
                          alt="Incident Evidence" 
                          style={{ maxWidth: '100%', maxHeight: '320px', display: 'block', objectFit: 'contain', borderRadius: 8 }}
                        />
                      </div>
                    ) : (
                      <div style={{ padding: '12px 16px', backgroundColor: '#f1f5f9', borderRadius: '8px', color: '#64748b', fontSize: '13px', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} /> No photo evidence was attached to this report.
                      </div>
                    )}
                  </div>

                  {/* ⚖️ LUPON CONCILIATION & ACTION FORM */}
                  <div className="no-print blotter-workflow-section">
                    <div className="blotter-workflow-heading">
                      <div className="blotter-workflow-heading-icon"><Scale size={20} aria-hidden="true" /></div>
                      <div>
                        <p className="blotter-eyebrow">STAFF WORKFLOW</p>
                        <h3>Review & case actions</h3>
                        <p>Record the review outcome first. Lupon scheduling is only for cases being considered for conciliation.</p>
                      </div>
                    </div>

                    <div className="blotter-workflow-step-head"><span>1</span><div><strong>Staff review</strong><small>Choose the next handling path and record confirmed information.</small></div></div>
                    <div className="blotter-decision-grid">
                      <div className="form-group">
                        <label style={{ fontWeight: '700', fontSize: 13, color: '#475569', display: 'block', marginBottom: 6 }}>Staff Review Outcome</label>
                        <select
                          className="form-input"
                          value={triageOutcome}
                          onChange={(e) => setTriageOutcome(e.target.value)}
                        >
                          {TRIAGE_OUTCOMES.map(outcome => <option key={outcome.value} value={outcome.value}>{outcome.label}</option>)}
                        </select>
                        <small style={{ display: 'block', marginTop: 6, color: '#64748b' }}>
                          Review the report first. Choose Potential Lupon Referral only when mediation appears appropriate; otherwise use follow-up or referral.
                        </small>
                      </div>

                      <div className="form-group">
                        <label style={{ fontWeight: '700', fontSize: 13, color: '#475569', display: 'block', marginBottom: 6 }}>Case Status</label>
                        <select 
                          className="form-input" 
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          disabled={!isSuperAdmin}
                          title={isSuperAdmin ? 'Change case status' : 'Only the Barangay Captain can change case status'}
                        >
                          {CASE_STATUSES.map(status => (
                            <option
                              key={status.value}
                              value={status.value}
                              disabled={isCaseStatusDisabled(status.value)}
                            >
                              {status.label}
                            </option>
                          ))}
                        </select>
                        {!isSuperAdmin && (
                          <small style={{ display: 'block', marginTop: 6, color: '#64748b' }}>
                            Staff may update hearing details. Final status decisions require the Barangay Captain.
                          </small>
                        )}
                        {isSuperAdmin && (
                          <small style={{ display: 'block', marginTop: 6, color: '#64748b' }}>
                            Saved case statuses move forward only; completed stages cannot be selected again.
                          </small>
                        )}
                      </div>

                      <div className="form-group">
                        <label style={{ fontWeight: '700', fontSize: 13, color: '#475569', display: 'block', marginBottom: 6 }}>Respondent (Staff-Confirmed)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Pedro C. Santos"
                          value={respondentName}
                          onChange={(e) => setRespondentName(e.target.value)}
                          maxLength={120}
                        />
                        <small style={{ display: 'block', marginTop: 6, color: '#64748b' }}>Confirm the person's identity before entering it here; a resident-provided name is unverified.</small>
                      </div>
                    </div>

                    <div className="blotter-workflow-step-head"><span>2</span><div><strong>Lupon scheduling</strong><small>Complete these details only when a Lupon referral and hearing are appropriate.</small></div></div>
                    <div className="blotter-hearing-grid">
                      <div className="form-group">
                        <label style={{ fontWeight: '700', fontSize: 13, color: '#475569', display: 'block', marginBottom: 6 }}>Lupon Hearing Stage</label>
                        <select
                          className="form-input"
                          value={hearingStage}
                          onChange={(e) => setHearingStage(e.target.value)}
                        >
                          {LUPON_STAGES.map(stage => (
                            <option key={stage} value={stage} disabled={isHearingStageDisabled(stage) || (stage !== 'None' && triageOutcome !== 'Potential Lupon Referral')}>{stage}</option>
                          ))}
                        </select>
                        <small style={{ display: 'block', marginTop: 6, color: '#64748b' }}>
                          A hearing requires a Potential Lupon Referral outcome, a staff-confirmed respondent, its date and time, and presiding officer. Previous stages are locked after the next stage is saved.
                        </small>
                      </div>

                      <div className="form-group">
                        <label style={{ fontWeight: '700', fontSize: 13, color: '#475569', display: 'block', marginBottom: 6 }}>Scheduled Hearing Date & Time</label>
                        <input
                          type="datetime-local"
                        className="form-input"
                        value={hearingDate}
                        onChange={(e) => setHearingDate(e.target.value)}
                        required={requiresHearingSchedule}
                        />
                        {requiresNewHearingDate && !hasNewHearingDate && (
                          <small role="alert" style={{ display: 'block', marginTop: 6, color: '#b45309' }}>
                            Choose a new date and time for this next hearing; the earlier schedule will stay in the history.
                          </small>
                        )}
                      </div>

                      <div className="form-group blotter-officer-field">
                        <label style={{ fontWeight: '700', fontSize: 13, color: '#475569', display: 'block', marginBottom: 6 }}>Lupon Officer / Presiding Official</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Hon. Barangay Captain / Lupon Chair"
                        value={luponOfficerInCharge}
                        onChange={(e) => setLuponOfficerInCharge(e.target.value)}
                        maxLength={160}
                        required={requiresHearingSchedule}
                        />
                      </div>
                    </div>

                    {requiresHearingSchedule && (
                      <div className="form-group" style={{ marginTop: 10 }}>
                        <label htmlFor="blotter-hearing-notes" style={{ fontWeight: '700', fontSize: 13, color: '#475569', display: 'block', marginBottom: 6 }}>Staff-only note for this hearing schedule event</label>
                        <textarea
                          id="blotter-hearing-notes"
                          className="form-input"
                          rows="2"
                          value={hearingNotes}
                          onChange={(event) => setHearingNotes(event.target.value)}
                          maxLength={2000}
                          disabled={!hasHearingScheduleChange}
                          placeholder={hasHearingScheduleChange ? 'Optional: record scheduling context or a brief case note…' : 'Change the stage, date/time, or presiding officer to add a timeline entry.'}
                        />
                        <small style={{ display: 'block', marginTop: 6, color: '#64748b' }}>
                          This note is saved with the new or changed schedule and is not shown in the resident app.
                        </small>
                      </div>
                    )}

                    {requiresPriorProcessNote && (
                      <div className="form-group" style={{ marginTop: 12 }}>
                        <label style={{ fontWeight: '700', fontSize: 13, color: '#475569', display: 'block', marginBottom: 6 }}>
                          Why is this case already at a later hearing stage? <span aria-hidden="true">*</span>
                        </label>
                        <textarea
                          className="form-input"
                          rows="2"
                          value={stageAdvanceReason}
                          onChange={(event) => setStageAdvanceReason(event.target.value)}
                          maxLength={1000}
                          placeholder="Note which earlier steps were completed before BrgyLink was used. This note is staff-only and saved in the audit log."
                          aria-describedby="prior-process-note-help"
                        />
                        <small id="prior-process-note-help" style={{ display: 'block', marginTop: 6, color: hasPriorProcessNote ? '#64748b' : '#b45309' }}>
                          Explain the earlier process briefly (at least 10 characters). The note is not shown to residents.
                        </small>
                      </div>
                    )}

                    <div className="blotter-workflow-step-head"><span>3</span><div><strong>Case outcome & forms</strong><small>Record the outcome separately from hearing progress. Confirm the applicable CFA basis before saving.</small></div></div>
                    <div className="blotter-decision-grid">
                      <div className="form-group">
                        <label style={{ fontWeight: '700', fontSize: 13, color: '#475569', display: 'block', marginBottom: 6 }}>Case Outcome</label>
                        <select
                          className="form-input"
                          value={caseOutcome}
                          onChange={(event) => {
                            setCaseOutcome(event.target.value);
                            if (event.target.value !== 'Issued Certificate to File Action (CFA)') setCfaFormBasis('');
                          }}
                        >
                          {CASE_OUTCOMES.map((outcome) => (
                            <option key={outcome} value={outcome} disabled={isCaseOutcomeDisabled(outcome)}>{outcome}</option>
                          ))}
                        </select>
                        <small style={{ display: 'block', marginTop: 6, color: '#64748b' }}>
                          Keep the case Open while review or hearings continue. Settlement and CFA are recorded here, not as hearing stages.
                        </small>
                      </div>

                      {caseOutcome === 'Issued Certificate to File Action (CFA)' && (
                        <div className="form-group">
                          <label htmlFor="saved-cfa-basis" style={{ fontWeight: '700', fontSize: 13, color: '#475569', display: 'block', marginBottom: 6 }}>
                            CFA basis confirmed by Lupon Secretary
                          </label>
                          <select
                            id="saved-cfa-basis"
                            className="form-input"
                            value={cfaFormBasis}
                            onChange={(event) => setCfaFormBasis(event.target.value)}
                          >
                            <option value="">Select the basis from the official case record…</option>
                            {CFA_FORM_VARIANTS.map((form) => (
                              <option key={form.value} value={form.value} disabled={isCfaBasisDisabled(form.value)}>KP Form No. {form.number} — {form.title.replace('Certification to File Action — ', '')}</option>
                            ))}
                          </select>
                          <small style={{ display: 'block', marginTop: 6, color: '#64748b' }}>
                            {savedCaseForm?.caseOutcome === 'Amicable Settlement'
                              ? 'Because this case is recorded as settled, only the repudiated-settlement CFA basis is available.'
                              : savedCaseForm?.caseOutcome === 'Open'
                                ? 'A repudiated-settlement CFA requires the settlement to be recorded first. Save the settlement outcome, then return to record a repudiation.'
                                : 'The selected basis is saved with the case and controls which CFA draft is previewed. Do not choose based only on the hearing stage.'}
                          </small>
                        </div>
                      )}
                    </div>

                    <div className="form-group blotter-remarks-field">
                      <label style={{ fontWeight: '700', fontSize: 13, color: '#475569', display: 'block', marginBottom: 6 }}>Official Admin Remarks (Visible to Resident)</label>
                      <textarea 
                        className="form-input"
                        rows="3"
                        placeholder="Provide mediation notes, agreements, or hearing instructions for the resident..."
                        value={adminRemarks}
                        onChange={(e) => setAdminRemarks(e.target.value)}
                        maxLength={2000}
                      />
                    </div>

                    <div className="blotter-action-bar">
                      <button
                        type="button"
                        onClick={handleUpdateStatus} 
                        disabled={isCaseFormSaveDisabled}
                        aria-disabled={isCaseFormSaveDisabled}
                        title={!hasCaseFormChanges ? 'Change at least one case or review field before saving' : !hasCompleteHearingSchedule ? 'Select Potential Lupon Referral and provide the confirmed respondent, hearing date and time, and presiding officer' : !hasCompleteCaseOutcome ? 'Complete the hearing and respondent details required for this outcome, and select a saved CFA basis when applicable' : !hasPriorProcessNote ? 'Add the staff-only note explaining the earlier process before saving a skipped stage' : 'Save case review, hearing, and outcome changes'}
                        className="btn primary blotter-save-button"
                      >
                        {updating ? 'Saving changes…' : 'Save review and changes'}
                      </button>

                      {!isTerminalCase(selectedReport.status) && (
                      <button
                        type="button"
                        onClick={() => setShowKpModal(true)}
                        disabled={!canPrintSummons}
                        title={canPrintSummons ? 'Print the respondent summons draft for the first mediation hearing' : 'For KP Form No. 9, select the first mediation hearing and provide the confirmed respondent, date/time, and presiding officer'}
                        className="blotter-summons-button"
                      >
                        <Scale size={15} color="#0038A8" /> Print KP Form No. 9 Draft
                      </button>
                      )}
                      {canPrintHearingNotice && (
                        <button type="button" onClick={() => setOutcomeFormType('hearingNotice')} className="blotter-summons-button">
                          <Printer size={15} /> Print KP Form No. 12 Draft
                        </button>
                      )}
                      {canPrintSettlementForm && (
                        <button type="button" onClick={() => setOutcomeFormType('settlement')} className="blotter-summons-button">
                          <Printer size={15} /> Print KP Form No. 16 Draft
                        </button>
                      )}
                      {canPrintCfaForm && (
                        <button type="button" onClick={() => setOutcomeFormType('cfa')} className="blotter-summons-button">
                          <Printer size={15} /> Print CFA Draft
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BlotterManagement;
