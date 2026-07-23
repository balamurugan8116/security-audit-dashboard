/**
 * Generates realistic sample audit log data.
 *
 * Usage:
 *   node src/utils/seedGenerator.js              -> writes sample-logs.json (10,000 records)
 *   node src/utils/seedGenerator.js --count 5000  -> custom record count
 *   node src/utils/seedGenerator.js --insert      -> also inserts directly into MongoDB
 *
 * This exists purely so a reviewer can generate a realistic 10k-record
 * payload to test the bulk upload endpoint / UI without needing their own
 * data source.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const USERS = [
  ['priya.nair', 'admin'],
  ['arjun.dev', 'user'],
  ['john.doe', 'admin'],
  ['sarah.j', 'user'],
  ['mike.chen', 'user'],
  ['aisha.khan', 'admin'],
  ['carlos.m', 'user'],
  ['emma.wilson', 'admin'],
  ['raj.patel', 'user'],
  ['linda.k', 'user'],
];
const DOMAIN = 'company.com';
const ACTIONS = ['LOGIN', 'LOGOUT', 'DELETE_USER', 'UPDATE_PROFILE', 'CREATE_USER', 'ACCESS_DENIED', 'DELETE_ROLE', 'RESET_PASSWORD', 'EXPORT_DATA', 'GRANT_PERMISSION'];
const RESOURCE_TYPES = ['USER', 'ROLE', 'AUTH', 'FILE', 'PERMISSION'];
const REGIONS = ['ap-south-1', 'us-east-1', 'us-west-1', 'eu-west-1', 'eu-north-1', 'ap-northeast-1'];
const SEVERITIES = ['HIGH', 'MEDIUM', 'LOW'];
const STATUSES = ['Resolved', 'Unresolved'];

function randOf(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomIp() {
  return `${randInt(10, 223)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`;
}
function randomTimestamp(daysBack = 30) {
  const now = Date.now();
  const past = now - randInt(0, daysBack * 24 * 60 * 60 * 1000);
  return new Date(past).toISOString();
}
function weightedSeverity() {
  const r = Math.random();
  if (r < 0.13) return 'HIGH';
  if (r < 0.38) return 'MEDIUM';
  return 'LOW';
}

function buildLog(id) {
  const [name, role] = randOf(USERS);
  const action = randOf(ACTIONS);
  const resourceType = randOf(RESOURCE_TYPES);
  return {
    actor: `${name}@${DOMAIN}`,
    role,
    action,
    resource: `/api/${resourceType.toLowerCase()}s/${id}`,
    resourceType,
    ipAddress: randomIp(),
    region: randOf(REGIONS),
    severity: weightedSeverity(),
    status: randOf(STATUSES),
    timestamp: randomTimestamp(),
  };
}

function generate(count) {
  const logs = [];
  for (let i = 1; i <= count; i++) logs.push(buildLog(i));
  return logs;
}

async function main() {
  const args = process.argv.slice(2);
  const countIdx = args.indexOf('--count');
  const count = countIdx !== -1 ? parseInt(args[countIdx + 1], 10) : 10000;
  const shouldInsert = args.includes('--insert');

  const logs = generate(count);
  const outPath = path.join(__dirname, '..', '..', 'sample-logs.json');
  fs.writeFileSync(outPath, JSON.stringify({ logs }, null, 2));
  console.log(`[seed] wrote ${count} sample logs to ${outPath}`);

  if (shouldInsert) {
    const mongoose = require('mongoose');
    const Log = require('../models/Log');
    await mongoose.connect(process.env.MONGO_URI);
    const result = await Log.insertMany(logs, { ordered: false });
    console.log(`[seed] inserted ${result.length} logs into MongoDB`);
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
