# Artha Job Board - Scalable Job Importer

A scalable job import system that pulls data from multiple external APIs, queues jobs using Redis, imports them into MongoDB using worker processes, and provides comprehensive import history tracking.

## Features

- Automated job fetching from 9 external RSS/XML sources
- Queue-based background processing with Bull + Redis
- Batch processing (100 jobs per batch) for optimal performance
- Duplicate detection and automatic job updates
- Comprehensive import history tracking
- Real-time dashboard with auto-refresh (5s interval)
- Error handling with retry logic (3 attempts, exponential backoff)
- Automated cron-based imports (configurable, default: hourly)

## Tech Stack

### Frontend
- **Framework**: Next.js 16.0.1 (React 19.2.0)
- **Styling**: Tailwind CSS 4
- **HTTP Client**: Fetch API
- **Date Handling**: date-fns 4.1.0

### Backend
- **Runtime**: Node.js
- **Framework**: Express 5.1.0
- **Database ORM**: Mongoose 8.19.3
- **Queue**: Bull 4.16.5
- **Cache/Queue Store**: Redis (ioredis 5.3.2)
- **Scheduler**: node-cron 4.2.1
- **HTTP Client**: Axios 1.13.2
- **XML Parser**: xml2js 0.6.2

### Infrastructure
- **Database**: MongoDB Atlas
- **Cache**: Redis Cloud
- **Containerization**: Docker Compose (optional)

## Project Structure

```
artha-job-board/
├── client/                    # Next.js frontend
│   ├── app/
│   │   ├── components/
│   │   │   └── ImportHistory.js    # Main dashboard component
│   │   ├── services/
│   │   │   └── api.js              # API client
│   │   └── page.js                 # Home page
│   └── package.json
│
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js         # MongoDB connection
│   │   │   └── redis.js            # Redis configuration
│   │   ├── controllers/
│   │   │   └── importController.js # API route handlers
│   │   ├── cron/
│   │   │   └── jobFetcher.js       # Cron scheduler
│   │   ├── models/
│   │   │   ├── Job.js              # Job schema
│   │   │   └── ImportLog.js        # Import log schema
│   │   ├── routes/
│   │   │   └── importRoutes.js     # API routes
│   │   ├── services/
│   │   │   ├── apiService.js       # External API fetching
│   │   │   ├── jobService.js       # Business logic
│   │   │   └── queueService.js     # Queue management
│   │   ├── utils/
│   │   │   ├── logger.js           # Custom logger
│   │   │   └── xmlParser.js        # XML/RSS parser
│   │   ├── workers/
│   │   │   └── jobWorker.js        # Bull worker
│   │   └── server.js               # Main entry point
│   ├── test-conn.js                # MongoDB connection test
│   └── package.json
│
├── docs/
│   └── architecture.md             # Detailed system documentation
│
├── docker-compose.yml              # Docker setup
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas account)
- Redis (local or Redis Cloud account)

### Quick Start (Local Development)

1. **Clone repository**
```bash
git clone <your-repo-url>
cd artha-job-board
```

2. **Install dependencies**
```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

3. **Setup environment variables**

**Server** (`server/.env`):
```bash
# Copy example file
cp .env.

# Edit with your credentials:
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
REDIS_URL=rediss://<username>:<password>@<host>:<port>
CRON_SCHEDULE=0 * * * *
```

**Client** (`client/.env`):
```bash
# Copy example file
cp .env

# Edit with API URL:
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. **Start services**

**Option A: Manual start** (4 terminals)
```bash
# Terminal 1: Start MongoDB (if local)
mongod

# Terminal 2: Start Redis (if local)
redis-server

# Terminal 3: Start Backend
cd server
npm run dev

# Terminal 4: Start Frontend
cd client
npm run dev
```

5. **Access application**
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## API Endpoints

### POST /api/import/trigger
Manually trigger job import process

**Response**:
```json
{
  "message": "Import started",
  "importIds": ["64a1b2c3...", "64a1b2c4..."]
}
```

### GET /api/import/history
Get import history (last 50 records)

**Response**:
```json
[
  {
    "_id": "64a1b2c3...",
    "fileName": "https://jobicy.com/?feed=job_feed",
    "timestamp": "2025-01-15T10:00:00Z",
    "totalFetched": 250,
    "totalImported": 248,
    "newJobs": 45,
    "updatedJobs": 203,
    "failedJobs": 2,
    "status": "completed",
    "duration": 15234
  }
]
```

### GET /api/import/queue/stats
Get Bull queue statistics

**Response**:
```json
{
  "waiting": 5,
  "active": 3,
  "completed": 142,
  "failed": 2
}
```

### GET /health
Health check endpoint

**Response**:
```json
{
  "status": "OK",
  "timestamp": "2025-01-15T10:00:00Z"
}
```

## Usage

### Manual Import
1. Open the dashboard at http://localhost:3000
2. Click the "Trigger Import" button
3. Watch the queue stats update in real-time
4. View import results in the history table

### Automated Import
- Cron job runs automatically every hour (0 * * * *)
- Configure schedule via `CRON_SCHEDULE` environment variable
- Examples:
  - Every 30 minutes: `*/30 * * * *`
  - Every day at 2am: `0 2 * * *`
  - Every 6 hours: `0 */6 * * *`

### Monitoring
- **Queue Stats**: Real-time metrics on dashboard
- **Import History**: Detailed logs of each import run
- **Server Logs**: Console output with colored logger
- **Database**: Query `jobs` and `importlogs` collections

## Testing

### Manual Testing

1. **Trigger Import via API**:
   ```bash
   curl -X POST http://localhost:5000/api/import/trigger
   ```

2. **Check Queue Stats**:
   ```bash
   curl http://localhost:5000/api/import/queue/stats
   ```

3. **View Import History**:
   ```bash
   curl http://localhost:5000/api/import/history
   ```

### Database Queries
```bash
# Connect to MongoDB
mongosh "mongodb+srv://..."

# Switch to database
use job-board

# View jobs
db.jobs.find().limit(5)

# View import logs
db.importlogs.find().sort({timestamp: -1}).limit(5)

# Count total jobs
db.jobs.countDocuments()

# Count jobs by source
db.jobs.aggregate([
  { $group: { _id: "$sourceUrl", count: { $sum: 1 } } }
])
```

## Deployment

### Production Deployment

**Backend (Render/Railway)**:
1. Connect GitHub repository
2. Set environment variables (see `.env`)
3. Build command: `npm install`
4. Start command: `npm start`

**Frontend (Vercel)**:
1. Import GitHub repository
2. Framework: Next.js
3. Root directory: `client`
4. Environment variable: `NEXT_PUBLIC_API_URL`

**Database (MongoDB Atlas)**:
1. Create cluster
2. Add IP whitelist (0.0.0.0/0 for development)
3. Create database user
4. Copy connection string

**Redis (Redis Cloud)**:
1. Create database
2. Copy connection URL (rediss://)
3. Add to `REDIS_URL` environment variable

### Environment Variables Checklist

**Server**:
- [ ] `PORT`
- [ ] `MONGODB_URI`
- [ ] `REDIS_URL`
- [ ] `NODE_ENV`
- [ ] `CRON_SCHEDULE`

**Client**:
- [ ] `NEXT_PUBLIC_API_URL`

## Troubleshooting

### MongoDB Connection Issues
```
Error: Could not connect to any servers
```
**Solution**:
- Check IP whitelist in MongoDB Atlas
- Verify connection string format
- Test with `node test-conn.js`
- Get public IP: `(Invoke-RestMethod -Uri 'https://api.ipify.org').Content` (PowerShell)

### Redis Connection Issues
```
Error: connect ECONNREFUSED
```
**Solution**:
- Verify REDIS_URL format (rediss:// for SSL, redis:// for local)
- Check firewall/security group rules
- For Redis Cloud, ensure SSL is enabled

### Queue Not Processing
**Symptoms**: Jobs stuck in "waiting" state

**Solution**:
- Ensure worker is running (loaded in server.js)
- Check Redis connection
- View server logs for errors
- Check queue stats: `GET /api/import/queue/stats`

### Cron Not Triggering
**Symptoms**: No automatic imports

**Solution**:
- Check `CRON_SCHEDULE` format (5 fields: minute hour day month weekday)
- View server logs for cron startup message
- Verify server timezone settings
- Test manual trigger first

### Build Errors
**Issue**: TypeScript/Next.js build failures

**Solution**:
- Clear `.next` cache: `rm -rf client/.next`
- Reinstall dependencies: `npm install`
- Check Node version: `node -v` (should be 18+)

## Architecture

For detailed architecture documentation, see [docs/architecture.md](docs/architecture.md).

**Key Design Decisions**:
- **Queue-based processing**: Ensures reliability and scalability
- **Batch processing**: Optimizes database operations (100 jobs/batch)
- **Duplicate detection**: Uses `externalId` with unique index
- **Modular architecture**: Separation of concerns (MVC-like)
- **Error resilience**: Retry logic with exponential backoff

## Assumptions

1. External APIs return valid RSS/XML format
2. Each source provides unique identifiers (GUID)
3. Job data is public information (no privacy concerns)
4. Single-region deployment (no geo-distribution)
5. Managed services for MongoDB and Redis
6. Current batch size (100) is sufficient for data volume

## Future Enhancements

### High Priority
- [ ] Authentication & Authorization (JWT)
- [ ] Job search API (GET /api/jobs with filters)
- [ ] Real-time updates (Socket.io)
- [ ] Unit & integration tests

### Medium Priority
- [ ] Advanced queue features (prioritization, webhooks)
- [ ] Monitoring & observability (Winston, Sentry)
- [ ] Admin dashboard for source management
- [ ] Job expiration/archival logic

### Low Priority
- [ ] API rate limiting
- [ ] Performance optimizations (bulk operations)
- [ ] Multi-tenancy support

**Code Style**:
- ESLint configured
- Prettier for formatting
- Follow existing patterns

## Support

For issues or questions:
- Create a GitHub issue
- Check [docs/architecture.md](docs/architecture.md) for detailed documentation

----