import mongoose from 'mongoose';

const BlotterReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
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
  referenceNumber: { type: String, unique: true }
}, { timestamps: true });

// Auto-generate reference number
BlotterReportSchema.pre('save', function(next) {
  if (!this.referenceNumber) {
    const rand = Math.floor(10000 + Math.random() * 90000);
    this.referenceNumber = `BLOTTER-${new Date().getFullYear()}-${rand}`;
  }
  next();
});

export default mongoose.model('BlotterReport', BlotterReportSchema);
