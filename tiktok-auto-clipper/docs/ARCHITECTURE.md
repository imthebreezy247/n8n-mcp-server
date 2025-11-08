# Architecture Documentation

Technical architecture of the TikTok Auto Clipper system.

---

## System Overview

The TikTok Auto Clipper is a distributed automation system built on N8N that orchestrates content discovery, video processing, and social media posting.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        N8N Workflow Engine                   │
│                     (Orchestration Layer)                    │
└───────────┬─────────────────────────────────┬───────────────┘
            │                                 │
            │                                 │
    ┌───────▼────────┐              ┌────────▼─────────┐
    │  Content       │              │  Video           │
    │  Discovery     │              │  Processing      │
    │  (TMDB API)    │              │  Service         │
    └───────┬────────┘              └────────┬─────────┘
            │                                 │
            │                                 │
    ┌───────▼────────┐              ┌────────▼─────────┐
    │  Content       │              │  Storage         │
    │  Selection     │              │  Layer           │
    │  Engine        │              │  (S3/Local)      │
    └───────┬────────┘              └────────┬─────────┘
            │                                 │
            └────────────┬───────────────────┘
                         │
                ┌────────▼─────────┐
                │  TikTok API      │
                │  (Publishing)    │
                └──────────────────┘
```

---

## Components

### 1. N8N Workflow Engine

**Purpose**: Orchestrates all components and manages workflow execution.

**Technology**: N8N (Node-based workflow automation)

**Responsibilities**:
- Schedule management (cron-based triggers)
- Data flow between services
- Error handling and retry logic
- Execution logging
- Credential management

**Configuration**:
```javascript
{
  "executionOrder": "v1",
  "saveManualExecutions": true,
  "callerPolicy": "workflowsFromSameOwner"
}
```

---

### 2. Content Discovery Layer

**Purpose**: Identify trending, high-quality movies for clip creation.

**Components**:

#### 2.1 TMDB Integration
- **API**: The Movie Database API v3
- **Endpoint**: `/movie/popular`
- **Rate Limit**: 40 requests per 10 seconds
- **Data Retrieved**:
  - Movie metadata (title, description, ratings)
  - Popularity scores
  - Genre information
  - Cast and crew details
  - Release dates

#### 2.2 Content Filter
- **Logic**: JavaScript in N8N Code node
- **Criteria**:
  - Minimum rating: 7.5/10
  - Minimum popularity: 100
  - Sufficient description length
  - Genre-based filtering
- **Output**: Single selected movie per execution

```javascript
// Filter algorithm
const filteredMovies = movies.filter(movie =>
  movie.vote_average >= 7.5 &&
  movie.popularity >= 100 &&
  movie.overview.length > 50
);

// Random selection
const selected = filteredMovies[
  Math.floor(Math.random() * filteredMovies.length)
];
```

---

### 3. Video Processing Service

**Purpose**: Extract and format video clips for TikTok.

**Technology Stack**:
- **Language**: Node.js + Express
- **Video Engine**: FFmpeg
- **Format**: Microservice with REST API

**Endpoints**:

```
POST /api/v1/clip
- Creates video clip from source
- Parameters: source_url, start_time, duration, format
- Returns: processed video URL

POST /api/v1/detect-scenes
- Analyzes video for scene changes
- Returns: array of timestamps

GET /health
- Health check endpoint
```

**Processing Pipeline**:

```
Input Video
    │
    ▼
Extract Segment (FFmpeg -ss -t)
    │
    ▼
Crop to 9:16 Aspect Ratio
    │
    ▼
Scale to 1080x1920
    │
    ▼
Encode H.264 (Quality: CRF 18)
    │
    ▼
Audio Processing (AAC 192k)
    │
    ▼
Output MP4 (TikTok compatible)
```

**FFmpeg Command Template**:
```bash
ffmpeg -i SOURCE \
  -ss START_TIME \
  -t DURATION \
  -vf "crop=ih*9/16:ih,scale=1080:1920" \
  -c:v libx264 \
  -preset slow \
  -crf 18 \
  -b:v 6000k \
  -c:a aac \
  -b:a 192k \
  -movflags +faststart \
  OUTPUT.mp4
```

---

### 4. Storage Layer

**Purpose**: Store and retrieve source videos and processed clips.

**Options**:

#### Option A: AWS S3
```
Bucket Structure:
s3://movie-storage/
├── sources/
│   ├── action/
│   ├── drama/
│   └── comedy/
└── processed/
    └── clips/
        └── [date]/
```

#### Option B: Local Storage
```
/var/movie-storage/
├── sources/
│   └── movies/
└── processed/
    └── clips/
```

**Access Pattern**:
- Read: Source videos retrieved by movie ID
- Write: Processed clips uploaded after encoding
- Lifecycle: Processed clips retained for 30 days

---

### 5. Content Generation Engine

**Purpose**: Create engaging captions and select hashtags.

**Implementation**: JavaScript Code node in N8N

**Algorithm**:

```javascript
function generateCaption(movieData) {
  // Base caption
  let caption = `${movieData.title} (${movieData.year})`;

  // Add tagline if available
  if (movieData.tagline) {
    caption += `\n\n"${movieData.tagline}"`;
  }

  // Call to action
  caption += '\n\nWhich scene is your favorite? Comment below!';

  return caption;
}

function selectHashtags(movieData) {
  const baseHashtags = [
    '#movieclips', '#cinema', '#fyp',
    '#viral', '#movies', '#film'
  ];

  // Add genre-based tags
  const genreTags = movieData.genres.map(
    g => `#${g.toLowerCase().replace(/\s/g, '')}`
  );

  // Add movie-specific tag
  const movieTag = `#${movieData.title.replace(/[^a-z0-9]/gi, '').toLowerCase()}`;

  // Combine and limit to 10
  return [...baseHashtags, ...genreTags, movieTag]
    .slice(0, 10);
}
```

---

### 6. Publishing Layer

**Purpose**: Upload processed videos to TikTok.

**Integration**: TikTok Content Posting API

**Authentication**: OAuth 2.0
- Grant Type: Authorization Code
- Scopes: `user.info.basic`, `video.upload`
- Token Refresh: Every 24 hours

**API Endpoint**:
```
POST https://open-api.tiktok.com/share/video/upload/

Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json

Body:
{
  "video": {
    "video_url": "https://cdn.example.com/clip.mp4",
    "caption": "Movie clip caption #hashtags",
    "privacy_level": "PUBLIC_TO_EVERYONE",
    "disable_comment": false,
    "disable_duet": false,
    "disable_stitch": false
  }
}
```

**Rate Limits**:
- 100 uploads per day (typical limit)
- 5 uploads per hour
- Monitored via API response headers

---

## Data Flow

### End-to-End Execution Flow

```
1. Schedule Trigger (Cron)
   │
   ▼
2. Fetch Popular Movies (TMDB API)
   │ Returns: Array of 20 movies
   ▼
3. Filter by Quality Criteria
   │ Filters: Rating >= 7.5, Popularity >= 100
   ▼
4. Select Random Movie
   │ Selects: 1 movie from filtered list
   ▼
5. Fetch Full Movie Details (TMDB API)
   │ Returns: Extended metadata, cast, keywords
   ▼
6. Generate Clip Parameters
   │ Determines: Start time, duration, format
   ▼
7. Process Video Clip (FFmpeg Service)
   │ Input: Source video URL, clip params
   │ Output: TikTok-formatted MP4
   ▼
8. Generate Caption & Hashtags
   │ Creates: Engaging description with tags
   ▼
9. Check Dry Run Mode
   │
   ├─ Yes → Log Only (Skip Upload)
   │
   └─ No → Continue to Upload
       ▼
10. Upload to TikTok (TikTok API)
    │ Posts: Video with caption
    ▼
11. Log Execution Result
    │ Stores: Metadata, success/failure
    ▼
12. Send Notification (Slack)
    │ Alerts: Team of success or errors
```

### Data Schema

**Movie Selection Data**:
```json
{
  "movie_id": 12345,
  "title": "The Matrix",
  "overview": "A computer hacker learns...",
  "rating": 8.7,
  "popularity": 250.5,
  "release_date": "1999-03-31",
  "genres": ["action", "sci-fi"],
  "selected_at": "2024-11-08T10:00:00Z"
}
```

**Clip Parameters Data**:
```json
{
  "movie_id": 12345,
  "title": "The Matrix",
  "clip_start_time": 1800,
  "clip_duration": 120,
  "video_source_url": "s3://bucket/matrix.mp4",
  "output_format": {
    "resolution": "1080x1920",
    "codec": "h264",
    "bitrate": "6000k"
  }
}
```

**Processed Video Data**:
```json
{
  "clip_id": "12345_1800",
  "video_url": "https://cdn.example.com/clips/matrix_clip.mp4",
  "thumbnail_url": "https://cdn.example.com/thumbs/matrix_thumb.jpg",
  "file_size": 15728640,
  "duration": 120,
  "format": "mp4",
  "processed_at": "2024-11-08T10:05:00Z"
}
```

**TikTok Post Data**:
```json
{
  "tiktok_caption": "The Matrix (1999)\n\n\"Free your mind\"\n\n#movieclips #action #scifi",
  "hashtags": ["#movieclips", "#action", "#scifi", "#fyp"],
  "video_url": "https://cdn.example.com/clips/matrix_clip.mp4",
  "privacy_level": "PUBLIC_TO_EVERYONE"
}
```

---

## Scheduling

### Cron Configuration

**Schedule**: 5 times daily
```
0 8,12,16,20,22 * * *
```

**Breakdown**:
- 08:00 (8 AM) - Morning commute
- 12:00 (12 PM) - Lunch break
- 16:00 (4 PM) - Afternoon break
- 20:00 (8 PM) - Evening (peak engagement)
- 22:00 (10 PM) - Night (peak engagement)

**Rationale**:
- Times chosen for maximum TikTok engagement
- Spread throughout day for consistent presence
- Avoids posting during low-activity hours

---

## Error Handling

### Error Types and Strategies

**1. API Failures (TMDB)**
- **Error**: Network timeout, rate limit
- **Strategy**: Retry with exponential backoff
- **Max Retries**: 3
- **Notification**: Log warning, continue

**2. Video Processing Failures**
- **Error**: FFmpeg error, source not found
- **Strategy**: Skip this execution, try different movie
- **Notification**: Slack alert with error details

**3. TikTok Upload Failures**
- **Error**: Auth expired, video rejected
- **Strategy**:
  - Token expired: Refresh and retry
  - Video rejected: Log details, skip
- **Notification**: Critical alert to admin

**4. Workflow Crashes**
- **Error**: Uncaught exception
- **Strategy**: Error Trigger node catches all
- **Notification**: Immediate Slack notification

### Error Trigger Implementation

```javascript
// Error Trigger Node
{
  "type": "n8n-nodes-base.errorTrigger",
  "name": "On Workflow Error",
  "position": [1250, 500]
}

// Error Handler
{
  "type": "n8n-nodes-base.httpRequest",
  "name": "Error Notification",
  "parameters": {
    "url": "{{ $env.SLACK_WEBHOOK_URL }}",
    "method": "POST",
    "body": {
      "text": "Error: {{ $json.error.message }}",
      "node": "{{ $json.error.node }}"
    }
  }
}
```

---

## Security

### Credential Management

**N8N Credentials**:
- Stored encrypted in N8N database
- Encryption key: `N8N_ENCRYPTION_KEY` environment variable
- Never exposed in workflow JSON

**Environment Variables**:
```bash
# Sensitive data
TMDB_API_KEY=***
TIKTOK_ACCESS_TOKEN=***
TIKTOK_CLIENT_SECRET=***

# Non-sensitive configuration
DRY_RUN_MODE=true
VIDEO_PROCESSING_SERVICE_URL=http://localhost:3000
```

### API Security

**TMDB**:
- API key in query parameter (required by TMDB)
- HTTPS only
- Rate limiting enforced

**TikTok**:
- OAuth 2.0 Bearer token
- Token refresh every 24 hours
- HTTPS only

**Video Processor**:
- Optional API key authentication
- Internal network only (not exposed publicly)
- Input validation on all parameters

### Data Privacy

**No PII Collection**:
- Only public movie metadata
- No user tracking
- No personal information stored

**Video Storage**:
- Temporary processing only
- Cleanup after 24 hours
- No long-term retention of processed videos

---

## Scalability

### Current Limitations

- **Single execution**: One clip at a time
- **Sequential processing**: No parallel video encoding
- **Local processing**: Video processor on same machine as N8N

### Scaling Strategies

**Horizontal Scaling**:
```
N8N Instance 1 (08:00, 16:00, 22:00)
N8N Instance 2 (12:00, 20:00)
    │
    ▼
Load Balancer
    │
    ▼
Video Processing Cluster
├── Processor 1
├── Processor 2
└── Processor 3
```

**Queue-Based Architecture**:
```
N8N → Redis Queue → Multiple Workers → Cloud Storage → TikTok
```

**Cloud Migration**:
- **N8N**: N8N Cloud or self-hosted on Kubernetes
- **Video Processing**: AWS MediaConvert or Cloudinary
- **Storage**: AWS S3 or Cloudinary
- **Database**: PostgreSQL for execution history

---

## Monitoring

### Metrics to Track

**Workflow Metrics**:
- Execution success rate
- Execution duration
- Node-level performance

**Business Metrics**:
- Videos posted per day
- TikTok engagement (views, likes, comments)
- Copyright strikes (critical)

**System Metrics**:
- CPU usage during video processing
- Memory usage
- Disk space (video storage)
- API rate limit usage

### Monitoring Implementation

**N8N Built-in**:
- Execution history
- Error logs
- Execution time graphs

**External Monitoring**:
```javascript
// Add monitoring node after each critical step
{
  "type": "n8n-nodes-base.httpRequest",
  "name": "Log to Monitoring Service",
  "parameters": {
    "url": "https://monitoring.example.com/api/metrics",
    "method": "POST",
    "body": {
      "metric": "workflow.execution",
      "value": 1,
      "tags": {
        "status": "success",
        "node": "{{ $node.name }}"
      }
    }
  }
}
```

---

## Performance Optimization

### Current Performance

- **Content Discovery**: ~2-3 seconds (TMDB API calls)
- **Video Processing**: ~60-120 seconds (depends on source quality)
- **Upload to TikTok**: ~10-20 seconds
- **Total Execution**: ~2-3 minutes

### Optimization Opportunities

**1. Content Discovery Caching**
- Cache popular movies list for 24 hours
- Reduce TMDB API calls from 2 to 1 per execution
- **Savings**: ~1-2 seconds per execution

**2. Parallel Processing**
- Process multiple clips simultaneously
- Use queue system
- **Improvement**: 5x throughput

**3. FFmpeg Optimization**
```bash
# Current (slow, high quality)
-preset slow -crf 18

# Optimized (faster, good quality)
-preset fast -crf 20

# With GPU acceleration
-hwaccel cuda -preset fast -crf 20
```
**Savings**: 30-50% reduction in processing time

**4. Cloud Video Processing**
- Use Cloudinary or AWS MediaConvert
- Offload from local server
- **Improvement**: Consistent, fast processing

---

## Testing Architecture

### Test Environments

**1. Development**
- Local N8N instance
- Mock APIs
- Sample video files
- Dry run mode always on

**2. Staging**
- Cloud N8N instance
- Real APIs with test credentials
- Limited posting (1-2 per day)
- Monitoring enabled

**3. Production**
- Full deployment
- Real credentials
- 5 posts per day
- Full monitoring and alerts

### Test Workflow

```
Code Change
    │
    ▼
Local Testing (Manual execution)
    │
    ▼
Staging Deployment
    │
    ▼
Automated Tests
    │
    ▼
Production Deployment
```

---

## Deployment

### Deployment Methods

**Option 1: Local Deployment**
```bash
# Start video processor
cd scripts && node video-processor.js

# Start N8N
export $(cat config/.env | xargs) && n8n
```

**Option 2: Docker Deployment**
```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=password
    volumes:
      - n8n_data:/home/node/.n8n

  video-processor:
    build: ./scripts
    ports:
      - "3000:3000"
    volumes:
      - video_storage:/var/videos
```

**Option 3: Cloud Deployment**
- N8N Cloud: https://n8n.io/cloud/
- Video Processing: Cloudinary or AWS
- Storage: S3
- Monitoring: Datadog or New Relic

---

## Future Enhancements

### Planned Features

1. **AI-Powered Scene Selection**
   - Use ML to identify most engaging scenes
   - Sentiment analysis for emotional peaks
   - Automatic highlight detection

2. **Multi-Platform Support**
   - Instagram Reels
   - YouTube Shorts
   - Twitter/X videos

3. **Content Calendar**
   - Plan posts in advance
   - Theme-based posting (e.g., "Action Friday")
   - Seasonal content optimization

4. **Analytics Integration**
   - Track video performance
   - A/B test different styles
   - Optimize based on engagement

5. **User-Curated Content**
   - Allow manual clip selection
   - Review queue before posting
   - Approval workflow

---

## References

- **N8N Documentation**: https://docs.n8n.io/
- **TMDB API**: https://developers.themoviedb.org/
- **TikTok API**: https://developers.tiktok.com/
- **FFmpeg**: https://ffmpeg.org/documentation.html

---

**Last Updated**: November 2024
