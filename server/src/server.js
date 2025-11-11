require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const importRoutes = require('./routes/importRoutes');
const startCronJob = require('./cron/jobFetcher');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/import', importRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  // Start worker after DB connection is established
  require('./workers/jobWorker');

  startCronJob();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();