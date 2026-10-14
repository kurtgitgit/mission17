import mongoose from 'mongoose';

const HearingHistoryEntrySchema = new mongoose.Schema({
  hearingStage: {
    type: String,
    enum: ['Mediation (1st Hearing)', 'Conciliation (2nd Hearing)', 'Arbitration (3rd Hearing)'],
    required: true
  },
  hearingDate: { type: Date, required: true },
  presidingOfficer: { type: String, trim: true, maxlength: 160, default: '' },
  eventType: {
    type: String,
    enum: ['scheduled', 'stage-advanced', 'rescheduled', 'presiding-officer-updated', 'previously-recorded'],
    required: true
  },
  staffNotes: { type: String, trim: true, maxlength: 2000, default: '' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  recordedByName: { type: String, trim: true, maxlength: 120, default: '' },
  recordedAt: { type: Date, default: Date.now }
}, { _id: true });

const BlotterReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  fullName: { type: String, trim: true, minlength: 3, maxlength: 120 },
  contactNumber: { type: String, match: [/^09\d{9}$/, 'Enter a valid 11-digit Philippine mobile number.'] },
  incidentType: {
    type: String,
    enum: ['Theft', 'Vandalism', 'Disturbance', 'Accident', 'Other'],
    required: true
  },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
  location: { type: String, required: true, trim: true, minlength: 3, maxlength: 250 },
  dateOfIncident: { type: Date, required: true },
  evidenceUrl: { type: String }, // photo/proof
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Dismissed'],
    default: 'Pending'
  },
  adminRemarks: { type: String, trim: true, maxlength: 2000 },
  reportedRespondentName: { type: String, trim: true, maxlength: 120, default: '' },
  respondentName: { type: String, trim: true, maxlength: 120, default: '' },
  triageOutcome: {
    type: String,
    enum: ['Pending Review', 'Follow-up Needed', 'Potential Lupon Referral', 'Referred Outside Lupon'],
    default: 'Pending Review'
  },
  // Hearing progress, case outcome, and CFA basis are stored independently.
  // Legacy terminal values remain in hearingStage temporarily so old records
  // can be read and normalized by the application without a destructive migration.
  caseOutcome: {
    type: String,
    enum: ['Open', 'Amicable Settlement', 'Issued Certificate to File Action (CFA)'],
    default: 'Open'
  },
  cfaFormBasis: {
    type: String,
    enum: ['repudiated-settlement', 'pangkat-failed-conciliation', 'respondent-failed-to-appear', null],
    default: null
  },
  hearingDate: { type: Date, default: null },
  // Append-only schedule history. Legacy cases may have no entries; their last
  // known schedule is preserved as a snapshot when the first new event is saved.
  hearingHistory: { type: [HearingHistoryEntrySchema], default: [] },
  hearingStage: {
    type: String,
    enum: ['None', 'Mediation (1st Hearing)', 'Conciliation (2nd Hearing)', 'Arbitration (3rd Hearing)', 'Amicable Settlement', 'Issued Certificate to File Action (CFA)'],
    default: 'None'
  },
  luponOfficerInCharge: { type: String, trim: true, maxlength: 160, default: 'Punong Barangay / Lupon Tagapamayapa' },
  referenceNumber: { type: String, unique: true },
  // A privacy-safe integrity digest is anchored only after an official resolution.
  // No narrative, resident identity, contact information, location, or evidence is written on-chain.
  blockchainTxHash: { type: String, default: null },
  blockchainRecordHash: { type: String, default: null },
  blockchainRecordedAt: { type: Date, default: null },
  blockchainRecordStatus: {
    type: String,
    enum: ['Not Configured', 'Recorded', 'Failed'],
    default: 'Not Configured'
  },
}, { timestamps: true });


// ⚡ PERFORMANCE INDEXES
// Optimize dashboard queries for pending/resolved reports and recent activity
BlotterReportSchema.index({ status: 1, createdAt: -1 });
BlotterReportSchema.index({ createdAt: -1 });

// Auto-generate reference number
BlotterReportSchema.pre('save', function(next) {
  if (!this.referenceNumber) {
    const rand = Math.floor(10000 + Math.random() * 90000);
    this.referenceNumber = `BLOTTER-${new Date().getFullYear()}-${rand}`;
  }
  next();
});

export default mongoose.model('BlotterReport', BlotterReportSchema);
