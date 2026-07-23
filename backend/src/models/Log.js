const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Audit log schema.
 *
 * Indexing decisions (documented in README as well):
 *  - Single-field indexes on every field we filter by (role, severity, status,
 *    region, action) so equality filters can use an index scan instead of a
 *    collection scan.
 *  - A descending index on `timestamp` since it's the default sort field and
 *    most investigations look at recent activity first.
 *  - A compound index on the fields most commonly combined in the dashboard
 *    (severity + status + region + timestamp) to serve the common "narrow
 *    down, then sort by time" query pattern with a single index.
 *
 * Search: the free-text search box matches partial substrings anywhere in
 * actor / action / resource / ipAddress (e.g. typing part of an IP or a
 * user id). Mongo's $text index only tokenizes whole words, so it can't do
 * that kind of substring match; we use a case-insensitive $regex $or across
 * those fields instead. At the ~10k record scale in this exercise a regex
 * scan comfortably stays fast. At real production scale (millions of logs)
 * this would move to a dedicated search layer (Atlas Search / Elasticsearch).
 */
const logSchema = new Schema(
  {
    actor: { type: String, required: true, trim: true, index: true },
    role: { type: String, required: true, trim: true, index: true },
    action: { type: String, required: true, trim: true, index: true },
    resource: { type: String, required: true, trim: true },
    resourceType: { type: String, required: true, trim: true },
    ipAddress: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true, index: true },
    severity: {
      type: String,
      required: true,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['Resolved', 'Unresolved'],
      index: true,
    },
    timestamp: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

logSchema.index({ severity: 1, status: 1, region: 1, timestamp: -1 });

module.exports = mongoose.model('Log', logSchema);
