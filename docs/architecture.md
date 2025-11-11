# Artha Job Board - System Architecture

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Core Components](#core-components)
5. [Data Flow](#data-flow)
6. [Database Schema](#database-schema)
7. [Queue Processing](#queue-processing)
8. [API Endpoints](#api-endpoints)
9. [Deployment](#deployment)
10. [Design Decisions](#design-decisions)

---

## Overview

The Artha Job Board is a scalable job import system that fetches job listings from multiple external APIs, queues them using Redis, processes them with worker processes, and stores them in MongoDB. The system provides real-time import history tracking and dashboard functionality.

### Key Features
- Multi-source job aggregation (9 external APIs)
- Queue-based background processing with Bull/Redis
- Batch processing for performance optimization
- Duplicate detection and job updates
- Comprehensive import history tracking
- Real-time dashboard with auto-refresh
- Automated cron-based imports (hourly)
- Error handling and retry logic

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Next.js)                        │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  Import History  │  │   Trigger Import │                    │
│  │    Dashboard     │  │      Button      │                    │
│  └────────┬─────────┘  └────────┬─────────┘                    │
│           │                     │                               │
│           └─────────────┬───────┘                               │
│                         │ HTTP API Calls                        │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER (Node.js/Express)                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     API Layer                             │  │
│  │  POST /api/import/trigger                                │  │
│  │  GET  /api/import/history                                │  │
│  │  GET  /api/import/queue/stats                            │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                      │
│  ┌───────────────────────▼──────────────────────────────────┐  │
│  │                  Service Layer                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │  │
│  │  │ JobService   │  │QueueService  │  │  APIService    │ │  │
│  │  │              │  │              │  │                │ │  │
│  │  │ - triggerImp │  │ - addImport  │  │ - fetchAll     │ │  │
│  │  │ - processJob │  │ - processBat │  │   Sources      │ │  │
│  │  │   Batch      │  │ - getQueueSt │  │                │ │  │
│  │  └──────────────┘  └──────┬───────┘  └───────┬────────┘ │  │
│  └─────────────────────────┬─┴──────────────────┴──────────┘  │
│                            │                                    │
│  ┌─────────────────────────▼────────────────────────────────┐  │
│  │                 Cron Scheduler                            │  │
│  │  Triggers import every hour (0 * * * *)                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────┬──────────────────────┬──────────────────┘
                        │                      │
                        ▼                      ▼
         ┌──────────────────────┐  ┌──────────────────────┐
         │   Redis Queue (Bull) │  │  Worker Processes    │
         │                      │  │                      │
         │  - Job batching      │◄─┤  Concurrency: 5      │
         │  - Priority queue    │  │  Batch size: 100     │
         │  - Retry logic       │  │  Retry: 3 attempts   │
         └──────────────────────┘  └──────────┬───────────┘
                                              │
                                              ▼
                                   ┌─────────────────────┐
                                   │   MongoDB Atlas     │
                                   │                     │
                                   │  Collections:       │
                                   │  - jobs             │
                                   │  - importlogs       │
                                   └─────────────────────┘
```

---

## Technology Stack

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
- **Containerization**: Docker Compose (optional local dev)

---

## Core Components

### 1. Frontend Components

#### ImportHistory.js
- Main dashboard component
- Displays import history table
- Shows queue statistics (waiting, active, completed, failed)
- Auto-refreshes every 5 seconds
- Trigger import button

### 2. Backend Services

#### JobService
**Purpose**: Business logic for job import operations

**Methods**:
- `triggerImport()` - Orchestrates the full import process
  - Fetches from all API sources
  - Creates ImportLog records
  - Queues jobs for processing

- `processJobBatch(jobs, url, importId)` - Processes a batch of jobs
  - Checks for existing jobs by externalId
  - Creates new jobs or updates existing ones
  - Tracks success/failure statistics
  - Returns batch processing results

- `getImportHistory(limit)` - Retrieves import logs
- `getImportById(id)` - Gets specific import log

#### QueueService
**Purpose**: Manages Bull queue operations

**Methods**:
- `addImportJob(data)` - Adds jobs to queue in batches
  - Splits jobs into batches of 100
  - Assigns batch numbers for tracking
  - Sets job priority and retry options

- `processBatch(job)` - Processes a single batch
  - Updates ImportLog status
  - Calls JobService.processJobBatch()
  - Handles errors and updates final status

- `getQueueStats()` - Returns queue metrics
- `getQueue()` - Exposes Bull queue instance

#### APIService
**Purpose**: Fetches jobs from external sources

**Methods**:
- `fetchAllSources()` - Fetches from all 9 configured APIs
  - Parallel fetching
  - Error handling per source
  - Returns normalized results

**Configured Sources**:
1. Jobicy - All jobs
2. Jobicy - SMM (Full-time)
3. Jobicy - Seller (Full-time, France)
4. Jobicy - Design/Multimedia
5. Jobicy - Data Science
6. Jobicy - Copywriting
7. Jobicy - Business
8. Jobicy - Management
9. HigherEdJobs - RSS feed

### 3. Workers

#### jobWorker.js
- Listens to 'import-jobs' queue
- Processes 5 jobs concurrently
- Calls queueService.processBatch()
- Updates job progress
- Logs completion/failure

### 4. Utilities

#### xmlParser.js
- Converts XML/RSS feeds to JSON
- Normalizes job data structure
- Extracts: title, company, location, description, jobType, category, URL, postedDate

#### logger.js
- Custom colored console logger
- Methods: info, success, warn, error, debug

---

## Data Flow

### Import Trigger Flow

```
1. User clicks "Trigger Import" or Cron runs
   │
   ▼
2. JobService.triggerImport()
   │
   ├─► APIService.fetchAllSources()
   │   └─► Fetches from 9 external APIs in parallel
   │       └─► xmlParser.fetchAndParse() converts XML to JSON
   │
   ├─► Creates ImportLog for each source (status: pending)
   │
   └─► QueueService.addImportJob()
       └─► Splits jobs into batches of 100
           └─► Adds each batch to Bull queue
               │
               ▼
3. Worker picks up job from queue
   │
   ├─► QueueService.processBatch()
   │   └─► JobService.processJobBatch()
   │       │
   │       ├─► For each job:
   │       │   ├─► Check if exists (by externalId)
   │       │   ├─► If exists: Update job
   │       │   └─► If new: Create job
   │       │
   │       └─► Track: newJobs, updatedJobs, failedJobs
   │
   └─► Update ImportLog with results
       └─► Set status to 'completed' or 'failed'
           │
           ▼
4. Frontend polls /api/import/history
   └─► Displays updated statistics
```

---

## Database Schema

### Jobs Collection

```javascript
{
  _id: ObjectId,
  externalId: String (required, unique),  // External identifier
  title: String (required),
  company: String,
  location: String,
  description: String,
  jobType: String,                        // Full-time, Part-time, etc.
  category: String,                       // Design, Data Science, etc.
  url: String,                            // Job posting URL
  postedDate: Date,
  sourceUrl: String (required),           // Source API URL
  createdAt: Date,
  updatedAt: Date
}

// Indexes
{ externalId: 1, sourceUrl: 1 }
```

### ImportLogs Collection

```javascript
{
  _id: ObjectId,
  fileName: String (required),            // Source URL
  timestamp: Date,
  totalFetched: Number,                   // Total jobs from API
  totalImported: Number,                  // Successfully imported
  newJobs: Number,                        // New records created
  updatedJobs: Number,                    // Existing records updated
  failedJobs: Number,                     // Failed to process
  failures: [{                            // Detailed failure info
    job: Object,
    reason: String,
    error: String
  }],
  status: String,                         // pending, processing, completed, failed
  duration: Number                        // Processing time in ms
}
```

---

## Queue Processing

### Bull Queue Configuration

```javascript
Queue Name: 'job-import'
Redis: Redis Cloud (rediss://)

Settings:
- lockDuration: 30000ms (30s)
- stalledInterval: 30000ms
- maxStalledCount: 3

Job Options:
- attempts: 3
- backoff: exponential (5s initial delay)
- removeOnComplete: 100 (keep last 100)
- removeOnFail: 100
- timeout: 60000ms (60s)

Worker Concurrency: 5
Batch Size: 100 jobs per batch
```

### Job Processing Logic

1. **Batching**: Jobs split into batches of 100
2. **Deduplication**: Check externalId before insert
3. **Update Strategy**: If exists, update; else create
4. **Error Handling**: Individual job failures don't stop batch
5. **Progress Tracking**: Updates ImportLog incrementally
6. **Retry Logic**: 3 attempts with exponential backoff

---

## API Endpoints

### POST /api/import/trigger
Manually trigger job import process

**Response**:
```json
{
  "message": "Import started",
  "importIds": ["64a1b2c3d4e5f6...", ...]
}
```

### GET /api/import/history
Get import history (last 50 records)

**Query Parameters**:
- None (future: pagination)

**Response**:
```json
[
  {
    "_id": "64a1b2c3d4e5f6...",
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

---

## Deployment

### Environment Variables

#### Server (.env)
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
REDIS_URL=rediss://...
NODE_ENV=production
CRON_SCHEDULE=0 * * * *
QUEUE_CONCURRENCY=3
BATCH_SIZE=100
```

#### Client (.env.local)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```


### Production Deployment Options

1. **Server**: Render, Railway, Heroku
2. **Client**: Vercel, Netlify
3. **Database**: MongoDB Atlas
4. **Redis**: Redis Cloud, Upstash

---

## Design Decisions

### 1. Why Bull Queue + Redis?
- **Reliability**: Persistent job storage
- **Scalability**: Horizontal scaling with multiple workers
- **Retry Logic**: Built-in exponential backoff
- **Monitoring**: Queue statistics and job tracking
- **Performance**: In-memory processing with durability

### 2. Why Batch Processing?
- **Database Efficiency**: Reduces connection overhead
- **Memory Management**: Processes large datasets in chunks
- **Error Isolation**: Individual job failures don't stop entire import
- **Progress Tracking**: Granular status updates per batch

### 3. Why MongoDB?
- **Flexible Schema**: Job data varies by source
- **Scalability**: Horizontal scaling with sharding
- **Indexing**: Fast duplicate detection
- **JSON-like Documents**: Natural fit for RSS/XML data

### 4. Why Separate ImportLog Collection?
- **Audit Trail**: Complete history of all imports
- **Debugging**: Detailed failure tracking
- **Analytics**: Import performance metrics
- **User Visibility**: Real-time dashboard data

### 5. Deduplication Strategy
- Uses `externalId` (GUID from RSS feed)
- Composite index: `{ externalId: 1, sourceUrl: 1 }`
- Update existing records to keep data fresh
- Prevents duplicate job postings

### 6. Error Handling Approach
- **Graceful Degradation**: Failed sources don't stop others
- **Detailed Logging**: Capture full error stacks
- **Retry Logic**: Exponential backoff for transient failures
- **User Feedback**: Display errors in import history

### 7. Cron Schedule Design
- Hourly by default (0 * * * *)
- Configurable via environment variable
- Non-blocking (uses queue for actual work)
- Logged for audit trail

### 8. Frontend Real-time Updates
- Polling every 5 seconds (simple, reliable)
- Future: Socket.io for push notifications
- Displays queue stats for real-time feedback
- Auto-refresh ensures up-to-date data

### 9. Modular Architecture
- **Service Layer**: Business logic separation
- **Controller Layer**: HTTP handling
- **Model Layer**: Data access
- **Worker Layer**: Background processing
- **Benefits**: Testable, maintainable, scalable

### 10. No Authentication (Current State)
- **Reason**: Assignment scope focused on architecture
- **Production Requirement**: Add JWT/OAuth
- **Recommendation**: Use middleware for route protection

---

## Future Enhancements

### High Priority
1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control (RBAC)
   - API key authentication for programmatic access

2. **Job Search API**
   - GET /api/jobs (with pagination, filtering, search)
   - GET /api/jobs/:id (job details)
   - Query parameters: category, location, jobType, dateRange

3. **Real-time Updates**
   - Socket.io integration
   - Push notifications for import completion
   - Live progress updates during imports

4. **Testing**
   - Unit tests (Jest)
   - Integration tests (Supertest)
   - E2E tests (Playwright)

### Medium Priority
5. **Advanced Queue Features**
   - Job prioritization
   - Scheduled imports (per-source)
   - Webhook support for completion notifications

6. **Monitoring & Observability**
   - Winston logger with log levels
   - Sentry error tracking
   - Performance metrics (Prometheus)
   - Health checks (DB, Redis connectivity)

7. **Admin Dashboard Enhancements**
   - Manage API sources
   - Configure import schedules
   - View detailed failure logs
   - Manual job retry

### Low Priority
8. **Job Expiration**
   - Mark old jobs as inactive
   - Archive expired jobs
   - TTL-based cleanup

9. **Performance Optimizations**
   - Bulk insert operations
   - Connection pooling
   - Caching frequently accessed data

10. **API Rate Limiting**
    - Protect against abuse
    - Per-IP rate limits
    - API key quotas

---

## Assumptions Made

1. **Data Quality**: External APIs return valid RSS/XML
2. **Network Reliability**: Transient failures handled by retries
3. **externalId Uniqueness**: Each source provides unique identifiers
4. **Single Region**: No geo-distribution requirements (yet)
5. **Data Volume**: Current batch size (100) sufficient for now
6. **No Data Privacy Concerns**: Job data is public information
7. **MongoDB Atlas**: Assumes managed service for production
8. **Redis Cloud**: Assumes managed Redis for production
9. **No Multi-tenancy**: Single organization use case

---

## Running the Project

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or cloud)

### Installation

```bash
# Clone repository
git clone <repo-url>

# Install server dependencies
cd server
npm install
cp .env
# Edit .env with your credentials

# Install client dependencies
cd ../client
npm install
cp .env
# Edit .env with API URL


### Running Locally

```bash
# Terminal 1 - Start server
cd server
npm run dev

# Terminal 2 - Start client
cd client
npm run dev
```

## Troubleshooting

### MongoDB Connection Issues
- Check IP whitelist in Atlas
- Verify connection string format

### Redis Connection Issues
- Verify REDIS_URL format (rediss:// for SSL)
- Check firewall/security group rules
- Test connection in redis-cli

### Queue Not Processing
- Ensure worker is running
- Check Redis connection
- View queue stats: GET /api/import/queue/stats
- Check Bull dashboard (optional: bull-board)

### Cron Not Triggering
- Check CRON_SCHEDULE format
- View server logs for cron messages
- Verify server timezone settings

---
