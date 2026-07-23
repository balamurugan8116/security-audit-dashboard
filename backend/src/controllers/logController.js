const mongoose = require('mongoose');
const Log = require('../models/Log');

const ALLOWED_SORT_FIELDS = [
  'timestamp',
  'actor',
  'role',
  'action',
  'severity',
  'status',
  'region',
  'resourceType',
];
const MAX_LIMIT = 500;
const BULK_BATCH_SIZE = 2000; // insertMany in chunks to keep memory/time bounded

/**
 * POST /api/logs/bulk-upload
 * Body: { logs: [ {...log}, ... ] }  (max 20,000 records per request)
 *
 * Uses insertMany with ordered:false so one bad record doesn't abort the
 * whole batch - valid records still get inserted and invalid ones are
 * reported back to the client. Runs in chunks of BULK_BATCH_SIZE so a
 * 10,000+ record payload doesn't hold one enormous write in memory at once.
 */
exports.bulkUpload = async (req, res, next) => {
  try {
    const { logs } = req.body;

    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ message: '"logs" must be a non-empty array' });
    }
    if (logs.length > 20000) {
      return res.status(400).json({ message: 'Maximum 20,000 records per upload' });
    }

    let successCount = 0;
    const errors = [];

    for (let i = 0; i < logs.length; i += BULK_BATCH_SIZE) {
      const chunk = logs.slice(i, i + BULK_BATCH_SIZE).map((log, idx) => ({
        ...log,
        timestamp: log.timestamp ? new Date(log.timestamp) : undefined,
        __originalIndex: i + idx,
      }));

      try {
        const inserted = await Log.insertMany(
          chunk.map(({ __originalIndex, ...rest }) => rest),
          { ordered: false, rawResult: false }
        );
        successCount += inserted.length;
      } catch (err) {
        // insertMany with ordered:false throws a BulkWriteError but still
        // performs every valid insert. err.insertedDocs / err.writeErrors
        // let us report a precise success/failure split back to the client.
        if (err.insertedDocs) successCount += err.insertedDocs.length;
        if (err.writeErrors) {
          err.writeErrors.forEach((we) => {
            errors.push({
              index: i + we.index,
              message: we.errmsg || we.err?.errmsg || 'Validation failed',
            });
          });
        } else if (!err.insertedDocs) {
          errors.push({ index: i, message: err.message });
        }
      }
    }

    res.status(201).json({
      totalReceived: logs.length,
      success: successCount,
      failed: logs.length - successCount,
      errors: errors.slice(0, 100), // cap payload size in the response
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/logs
 * Query: page, limit, search, role, severity, status, region, action,
 *        resourceType, startDate, endDate, sortBy, order
 *
 * All filtering, searching, sorting and pagination happens server-side via
 * a single Mongo query + count, so the client only ever receives the one
 * page of rows it needs to render.
 */
exports.getLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      severity,
      status,
      region,
      action,
      resourceType,
      startDate,
      endDate,
      sortBy = 'timestamp',
      order = 'desc',
    } = req.query;

    const filter = {};
    if (role && role !== 'All') filter.role = role;
    if (severity && severity !== 'All') filter.severity = severity;
    if (status && status !== 'All') filter.status = status;
    if (region && region !== 'All') filter.region = region;
    if (action && action !== 'All') filter.action = action;
    if (resourceType && resourceType !== 'All') filter.resourceType = resourceType;

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'i');
      filter.$or = [{ actor: re }, { action: re }, { resource: re }, { ipAddress: re }];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), MAX_LIMIT);
    const skip = (pageNum - 1) * limitNum;

    const sortField = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'timestamp';
    const sortOrder = order === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      Log.find(filter)
        .sort({ [sortField]: sortOrder, _id: sortOrder }) // _id tiebreak for stable pagination
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Log.countDocuments(filter),
    ]);

    res.json({
      data,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.max(Math.ceil(total / limitNum), 1),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/logs/stats
 * Powers the Dashboard and Analytics pages with a handful of aggregations,
 * computed in Mongo rather than pulling every row to the client.
 */
exports.getStats = async (req, res, next) => {
  try {
    const [total, severityAgg, statusAgg, regionAgg, actionAgg, dailyAgg] = await Promise.all([
      Log.countDocuments(),
      Log.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
      Log.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Log.aggregate([
        { $group: { _id: '$region', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      Log.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      Log.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 60 },
      ]),
    ]);

    const toMap = (agg) => agg.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {});

    res.json({
      total,
      severity: toMap(severityAgg),
      status: toMap(statusAgg),
      topRegions: regionAgg.map((r) => ({ region: r._id, count: r.count })),
      topActions: actionAgg.map((a) => ({ action: a._id, count: a.count })),
      dailyCounts: dailyAgg.map((d) => ({ date: d._id, count: d.count })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/logs/meta
 * Returns distinct values for filter dropdowns, so the UI doesn't hardcode
 * roles/regions/actions and stays correct as new log data comes in.
 */
exports.getMeta = async (req, res, next) => {
  try {
    const [roles, regions, actions, resourceTypes] = await Promise.all([
      Log.distinct('role'),
      Log.distinct('region'),
      Log.distinct('action'),
      Log.distinct('resourceType'),
    ]);
    res.json({ roles, regions, actions, resourceTypes, severities: ['HIGH', 'MEDIUM', 'LOW'], statuses: ['Resolved', 'Unresolved'] });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/logs/:id
 */
exports.getLogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid log id' });
    }
    const log = await Log.findById(id).lean();
    if (!log) return res.status(404).json({ message: 'Log not found' });
    res.json(log);
  } catch (err) {
    next(err);
  }
};
