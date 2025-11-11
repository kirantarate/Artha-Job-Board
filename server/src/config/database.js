const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ Missing MongoDB connection string. Set MONGODB_URI or MONGO_URI in your environment.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    // Print the original error for visibility
    console.error('❌ MongoDB Connection Error:', error.message || error);

    // Helpful hint for a common Atlas connectivity issue (IP whitelist)
    try {
      const msg = (error && error.message) ? error.message : '';
      const name = (error && error.name) ? error.name : '';
      if (msg.includes('Could not connect to any servers') || name === 'MongoNetworkError' || msg.includes('failed to connect')) {
        console.error('\n🔎 Troubleshooting hint: This commonly means MongoDB Atlas is blocking the connection (IP not whitelisted) or network/DNS issues.');
        console.error(' - Add your current public IP to the Atlas Project -> Network Access -> IP Access List.');
        console.error(' - Or (for quick local debugging) temporarily allow 0.0.0.0/0 (NOT recommended for production).');
        console.error(' - See: https://www.mongodb.com/docs/atlas/security-whitelist/');
        console.error(" - To discover your public IP (PowerShell): (Invoke-RestMethod -Uri 'https://api.ipify.org').Content");
        console.error(' - After changing the whitelist, restart this app.');
      }
    } catch (e) {
      // ignore any error while printing hint
    }

    process.exit(1);
  }
};

module.exports = connectDB;