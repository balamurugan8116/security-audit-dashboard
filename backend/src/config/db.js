const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI from environment variables.
 * Fails fast (process.exit) if the connection cannot be established,
 * since the API is useless without a database.
 */
async function connectDB() {
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error('[db] MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
