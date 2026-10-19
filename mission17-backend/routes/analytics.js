import express from 'express';
import DocumentRequest from '../models/DocumentRequest.js';
import BlotterReport from '../models/BlotterReport.js';
import Suggestion from '../models/Suggestion.js';
import User from '../models/User.js';
import Announcement from '../models/Announcement.js';
import { buildVisibleAnnouncementFilter } from '../utils/announcementVisibility.js';
import { verifyAdmin } from '../utils/authMiddleware.js';

const router = express.Router();
const TIMEZONE = 'Asia/Manila';

// True workload totals are independent of list pagination and historical records.
router.get('/operations', verifyAdmin, async (req,res) => {
  try {
    const visible=buildVisibleAnnouncementFilter();
    const [documents,blotters,feedback,posts,alerts]=await Promise.all([
      DocumentRequest.countDocuments({isArchived:{$ne:true},status:{$in:['Pending','Processing']}}),
      BlotterReport.countDocuments({isArchived:{$ne:true},status:{$in:['Pending','In Progress']}}),
      Suggestion.countDocuments({isArchived:{$ne:true},status:{$in:['New','Pending']}}),
      Announcement.countDocuments(visible),Announcement.countDocuments({...visible,isUrgent:true}),
    ]);
    res.set('Cache-Control','private, no-store');res.json({documents,blotters,feedback,posts,alerts});
  } catch(error){console.error('Operations totals unavailable:',error.message);res.status(500).json({message:'Operations totals are unavailable. Please refresh.'});}
});

const parseDay = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Use YYYY-MM-DD for dates.');
  const date = new Date(`${value}T00:00:00+08:00`);
  if (!Number.isFinite(date.getTime()) || new Date(date.getTime() + 8 * 3600000).toISOString().slice(0, 10) !== value) {
    throw new Error('Enter a valid calendar date.');
  }
  return date;
};

export const analyticsDateMatch = ({ startDate, endDate }) => {
  const createdAt = {};
  if (startDate !== undefined) createdAt.$gte = parseDay(startDate);
  // Exclusive next midnight includes the entire final day in Philippine time.
  if (endDate !== undefined) createdAt.$lt = new Date(parseDay(endDate).getTime() + 86400000);
  if (createdAt.$gte && createdAt.$lt && createdAt.$gte >= createdAt.$lt) throw new Error('Start date must be on or before end date.');
  return Object.keys(createdAt).length ? { createdAt } : {};
};

const groupBy = (field) => [
  { $group: { _id: { $ifNull: [`$${field}`, 'Unspecified'] }, count: { $sum: 1 } } },
  { $sort: { count: -1, _id: 1 } },
  { $project: { _id: 0, name: '$_id', count: 1 } },
];

const summarize = async (Model, match, dimensions, includeTrend) => {
  const facets = { total: [{ $count: 'count' }] };
  for (const field of dimensions) facets[field] = groupBy(field);
  if (includeTrend) facets.daily = [
    { $group: { _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d', timezone: TIMEZONE } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', count: 1 } },
  ];
  const [result] = await Model.aggregate([{ $match: match }, { $facet: facets }]).option({ maxTimeMS: 15000 });
  return { ...result, total: result?.total?.[0]?.count || 0 };
};

router.get('/', verifyAdmin, async (req, res) => {
  let match;
  try {
    match = analyticsDateMatch(req.query);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
  // Trends are requested only by the dated dashboard, not the all-time printable summary.
  const includeTrend = req.query.trend === 'true';
  if (includeTrend && (!req.query.startDate || !req.query.endDate)) {
    return res.status(400).json({ message: 'Daily trends require both a start date and an end date.' });
  }
  if (includeTrend && match.createdAt.$lt - match.createdAt.$gte > 366 * 86400000) {
    return res.status(400).json({ message: 'Choose a date range of 366 days or fewer.' });
  }
  try {
    const [documents, blotters, feedback, residents] = await Promise.all([
      summarize(DocumentRequest, match, ['status', 'documentType'], includeTrend),
      summarize(BlotterReport, match, ['status', 'incidentType'], includeTrend),
      summarize(Suggestion, match, ['status', 'sentiment', 'category'], includeTrend),
      User.countDocuments({ ...match, role: 'resident' }).maxTimeMS(15000),
    ]);
    res.set('Cache-Control', 'no-store');
    return res.json({
      range: { startDate: req.query.startDate || null, endDate: req.query.endDate || null, timezone: TIMEZONE },
      residents, documents, blotters, feedback,
    });
  } catch (error) {
    console.error('Failed to load barangay analytics:', error.message);
    return res.status(500).json({ message: 'Analytics could not be loaded. Please try again.' });
  }
});

export default router;
