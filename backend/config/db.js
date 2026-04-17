const mongoose = require('mongoose');

let connectionPromise = null;

function normalizeMongoUri(uri) {
  if (!uri) {
    return '';
  }

  const trimmed = String(uri).trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.includes('mongodb.net/') && !trimmed.match(/mongodb\.net\/[^/?]+/)
    ? trimmed
    : trimmed;
}

function hasDatabaseName(uri) {
  try {
    const parsed = new URL(uri);
    const pathname = parsed.pathname.replace(/^\/+/, '');
    return Boolean(pathname);
  } catch {
    return false;
  }
}

const connectDB = async () => {
  const mongoUri = normalizeMongoUri(process.env.MONGO_URI || process.env.MONGODB_URI);

  if (!mongoUri) {
    throw new Error('MongoDB connection URI is required. Set MONGO_URI or MONGODB_URI in the environment.');
  }

  if (!hasDatabaseName(mongoUri)) {
    throw new Error('MongoDB URI must include a database name, for example: mongodb+srv://user:pass@cluster.mongodb.net/steelestimate?retryWrites=true&w=majority');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    mongoose.set('strictQuery', true);

    connectionPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 20000,
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
      bufferCommands: false
    });

    const conn = await connectionPromise;
    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    connectionPromise = null;
    console.error('[db] MongoDB connection failed:', error.message);
    throw error;
  }
};

module.exports = {
  connectDB
};
