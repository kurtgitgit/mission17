import mongoose from 'mongoose';

const BlotterReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  fullName: { type: String },
  contactNumber: { type: String },
  incidentType: {
    type: String,
    enum: ['Theft', 'Vandalism', 'Disturbance', 'Accident', 'Other'],
    required: true
  },
  description: { type: String, required: true },
  location: { type: String, required: true },
  dateOfIncident: { type: Date, required: true },
  evidenceUrl: { type: String }, // photo/proof
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Dismissed'],
    default: 'Pending'
  },
  adminRemarks: { type: String },
  respondentName: { type: String, default: '' },
  hearingDate: { type: Date, default: null },
  hearingStage: {
    type: String,
    enum: ['None', 'Mediation (1st Hearing)', 'Conciliation (2nd Hearing)', 'Arbitration (3rd Hearing)', 'Amicable Settlement', 'Issued Certificate to File Action (CFA)'],
    default: 'None'
  },
  luponOfficerInCharge: { type: String, default: 'Punong Barangay / Lupon Tagapamayapa' },
  referenceNumber: { type: String, unique: true },
  blockchainTxHash: { type: String, default: null }, // Set when status → Resolved
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
