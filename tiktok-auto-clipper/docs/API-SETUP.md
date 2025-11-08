# API Setup Guide

Detailed instructions for setting up all required APIs for the TikTok Auto Clipper.

## Table of Contents

1. [TMDB API Setup](#1-tmdb-api-setup)
2. [TikTok API Setup](#2-tiktok-api-setup)
3. [Video Processing Setup](#3-video-processing-setup)
4. [Video Storage Setup](#4-video-storage-setup)
5. [Notification Setup](#5-notification-setup)

---

## 1. TMDB API Setup

The Movie Database (TMDB) provides movie metadata, ratings, and trending information.

### Steps:

1. **Create TMDB Account**
   - Go to https://www.themoviedb.org/signup
   - Complete registration and verify email

2. **Request API Key**
   - Log in to your account
   - Go to Settings → API
   - Click "Request an API Key"
   - Choose "Developer" option
   - Accept terms and conditions
   - Fill out the application form:
     - Application URL: Can use localhost or personal site
     - Application Summary: "TikTok content automation (educational)"

3. **Get API Key**
   - Once approved (usually instant), copy your API key
   - You'll see both "API Key (v3 auth)" and "API Read Access Token"
   - Use the **API Key (v3 auth)** for this project

4. **Configure in N8N**
   - Add to `.env` file:
     ```
     TMDB_API_KEY=your_api_key_here
     ```
   - Or set as N8N environment variable

5. **Test API Key**
   ```bash
   curl "https://api.themoviedb.org/3/movie/popular?api_key=YOUR_API_KEY"
   ```

### API Documentation
- Docs: https://developers.themoviedb.org/3/
- Rate Limits: 40 requests per 10 seconds
- Cost: Free

---

## 2. TikTok API Setup

**IMPORTANT**: TikTok API access requires approval and is primarily for business use.

### Prerequisites:

- TikTok account (business account recommended)
- Registered business or developer profile
- Valid use case for API access

### Steps:

#### Step 1: Apply for Developer Access

1. **Create TikTok Developer Account**
   - Go to https://developers.tiktok.com/
   - Click "Register"
   - Log in with your TikTok account
   - Complete developer registration

2. **Create an App**
   - Go to "Manage Apps"
   - Click "Create App"
   - Fill in app details:
     - App Name: "Movie Clips Automation"
     - Category: Content Publishing
     - Description: Your use case
     - Use Case: Content creation automation

3. **Request API Access**
   - Select required permissions:
     - `video.upload`
     - `user.info.basic`
   - Submit for review
   - **Note**: Approval can take several days to weeks

#### Step 2: OAuth Setup

Once approved:

1. **Get Client Credentials**
   - Client Key
   - Client Secret
   - Copy these to your `.env` file

2. **Set Redirect URI**
   - In app settings, add redirect URI
   - Example: `http://localhost:5678/oauth/callback`

3. **Get Access Token**

   Use this OAuth flow:

   ```bash
   # 1. Generate authorization URL
   https://www.tiktok.com/auth/authorize/?client_key=YOUR_CLIENT_KEY&scope=user.info.basic,video.upload&response_type=code&redirect_uri=YOUR_REDIRECT_URI

   # 2. User authorizes (will redirect with code)

   # 3. Exchange code for token
   curl -X POST "https://open-api.tiktok.com/oauth/access_token/" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "client_key=YOUR_CLIENT_KEY" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "code=AUTHORIZATION_CODE" \
     -d "grant_type=authorization_code"
   ```

4. **Save Tokens**
   ```
   TIKTOK_CLIENT_KEY=your_client_key
   TIKTOK_CLIENT_SECRET=your_client_secret
   TIKTOK_ACCESS_TOKEN=your_access_token
   TIKTOK_REFRESH_TOKEN=your_refresh_token
   ```

#### Step 3: Token Refresh

Access tokens expire. Set up automatic refresh:

- Tokens typically expire in 24 hours
- Use refresh token to get new access token
- The N8N workflow should include token refresh logic

### Alternative: TikTok Upload API

If full API access is not approved, consider:

1. **TikTok for Business**
   - https://business.tiktok.com/
   - Different approval process
   - More focused on advertising

2. **Manual Upload**
   - Use Selenium/Puppeteer for automated browser posting
   - Less reliable, against TOS
   - Not recommended

### API Documentation
- Docs: https://developers.tiktok.com/doc/
- Rate Limits: Varies by endpoint (typically 100-500 req/day)
- Cost: Free (requires approval)

---

## 3. Video Processing Setup

You need a service to clip and format videos. Choose one option:

### Option A: Self-Hosted FFmpeg (Recommended for learning)

**Included in this project**: `scripts/video-processor.js`

1. **Install FFmpeg**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install ffmpeg

   # macOS
   brew install ffmpeg

   # Verify
   ffmpeg -version
   ```

2. **Install Node Dependencies**
   ```bash
   cd scripts
   npm install express
   ```

3. **Start Service**
   ```bash
   node video-processor.js
   # Runs on http://localhost:3000
   ```

4. **Configure**
   ```
   VIDEO_PROCESSING_SERVICE_URL=http://localhost:3000
   ```

5. **Test Endpoint**
   ```bash
   curl http://localhost:3000/health
   ```

### Option B: Cloudinary (Cloud-based)

1. **Create Account**
   - Go to https://cloudinary.com/
   - Sign up for free account
   - Free tier: 25 credits/month

2. **Get Credentials**
   - Dashboard shows:
     - Cloud Name
     - API Key
     - API Secret

3. **Configure**
   ```
   VIDEO_SERVICE_CLOUD_NAME=your_cloud_name
   VIDEO_SERVICE_API_KEY=your_api_key
   VIDEO_SERVICE_SECRET=your_api_secret
   ```

4. **Update Workflow**
   - Modify "Process Video Clip" node
   - Use Cloudinary's video transformation API
   - Documentation: https://cloudinary.com/documentation/video_manipulation_and_delivery

### Option C: AWS MediaConvert

1. **AWS Account Required**
2. **Set up MediaConvert**
   - Create MediaConvert job template
   - Configure IAM permissions
3. **Configure**
   ```
   AWS_MEDIACONVERT_ENDPOINT=your_endpoint
   AWS_ACCESS_KEY=your_key
   AWS_SECRET_KEY=your_secret
   ```

---

## 4. Video Storage Setup

You need access to movie/TV show video files.

### Option A: AWS S3

1. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://your-movie-bucket
   ```

2. **Upload Videos**
   ```bash
   aws s3 cp movie.mp4 s3://your-movie-bucket/movies/
   ```

3. **Set Permissions**
   - Make bucket accessible to your processing service
   - Use IAM roles for security

4. **Configure**
   ```
   VIDEO_SOURCE_TYPE=s3
   AWS_S3_BUCKET=your-movie-bucket
   AWS_ACCESS_KEY=your_key
   AWS_SECRET_KEY=your_secret
   ```

### Option B: Local Storage

1. **Create Directory**
   ```bash
   mkdir -p /var/movie-storage
   ```

2. **Add Videos**
   - Copy video files to directory
   - Organize by genre/title

3. **Configure**
   ```
   VIDEO_SOURCE_TYPE=local
   VIDEO_STORAGE_PATH=/var/movie-storage
   ```

### Option C: Streaming URLs

**WARNING**: This requires proper licensing!

- Videos must be publicly accessible
- Or use authenticated URLs
- Update workflow to fetch from URLs

---

## 5. Notification Setup

Optional but recommended for monitoring.

### Option A: Slack

1. **Create Slack Workspace** (if needed)
   - https://slack.com/create

2. **Create Incoming Webhook**
   - Go to https://api.slack.com/apps
   - Click "Create New App"
   - Choose "From scratch"
   - App Name: "TikTok Auto Clipper Notifications"
   - Select workspace

3. **Enable Incoming Webhooks**
   - In app settings, go to "Incoming Webhooks"
   - Toggle "Activate Incoming Webhooks" to On
   - Click "Add New Webhook to Workspace"
   - Select channel (e.g., #tiktok-automation)
   - Copy webhook URL

4. **Configure**
   ```
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

5. **Test**
   ```bash
   curl -X POST YOUR_WEBHOOK_URL \
     -H 'Content-Type: application/json' \
     -d '{"text":"Test notification from TikTok Auto Clipper!"}'
   ```

### Option B: Email (SendGrid)

1. **Create SendGrid Account**
   - https://sendgrid.com/

2. **Get API Key**
   - Settings → API Keys → Create API Key

3. **Configure in N8N**
   - Add SendGrid node to workflow
   - Configure with API key

4. **Update Notification Nodes**
   - Replace Slack nodes with email nodes

---

## N8N Credential Configuration

After setting up APIs, configure credentials in N8N:

### 1. Open N8N Settings
- Click gear icon → Credentials

### 2. Add Each Credential Type

#### TMDB Credential
- Type: HTTP Header Auth
- Name: `Authorization`
- Value: Leave empty (we use query param instead)
- Or use environment variable

#### TikTok OAuth2
- Type: OAuth2
- Grant Type: Authorization Code
- Authorization URL: `https://www.tiktok.com/auth/authorize/`
- Access Token URL: `https://open-api.tiktok.com/oauth/access_token/`
- Client ID: Your TikTok Client Key
- Client Secret: Your TikTok Client Secret
- Scope: `user.info.basic,video.upload`

#### Slack Webhook
- Type: HTTP Request
- Method: POST
- URL: Your Slack webhook URL

### 3. Test Credentials
- Use "Test" button in credential setup
- Verify each API responds correctly

---

## Environment Variables in N8N

Set environment variables in N8N:

### Method 1: .env File
Create `.env` in N8N data directory:
```bash
# Usually at ~/.n8n/.env
nano ~/.n8n/.env
```

### Method 2: System Environment
```bash
export TMDB_API_KEY=your_key
export TIKTOK_ACCESS_TOKEN=your_token
n8n
```

### Method 3: Docker (if using)
```yaml
environment:
  - TMDB_API_KEY=your_key
  - TIKTOK_ACCESS_TOKEN=your_token
```

---

## Security Best Practices

1. **Never commit credentials to git**
   - Use `.gitignore` for `.env` files
   - Rotate API keys regularly

2. **Use environment variables**
   - Don't hardcode in workflow
   - Use N8N's `{{ $env.VAR_NAME }}` syntax

3. **Limit API permissions**
   - Request only needed scopes
   - Use IAM roles for AWS

4. **Secure webhook URLs**
   - Use HTTPS only
   - Validate webhook signatures

5. **Monitor API usage**
   - Track rate limits
   - Set up alerts for quota usage

---

## Testing Your Setup

Run this checklist to verify everything is configured:

```bash
# 1. Test TMDB API
curl "https://api.themoviedb.org/3/movie/popular?api_key=$TMDB_API_KEY"

# 2. Test video processor (if self-hosted)
curl http://localhost:3000/health

# 3. Test Slack webhook
curl -X POST $SLACK_WEBHOOK_URL -H 'Content-Type: application/json' \
  -d '{"text":"Test message"}'

# 4. Test N8N workflow (dry run mode)
# Execute workflow manually in N8N interface
```

---

## Troubleshooting API Issues

### TMDB API Not Working
- Verify API key is correct
- Check rate limits (40 req/10 seconds)
- Ensure proper URL encoding

### TikTok API Rejected
- Verify access token hasn't expired
- Check required scopes are approved
- Ensure video meets TikTok requirements:
  - Format: MP4, WebM, or MOV
  - Max duration: 10 minutes (but use 2 minutes)
  - Max size: 287MB
  - Aspect ratio: 9:16 recommended

### Video Processing Fails
- Check FFmpeg installation
- Verify source video is accessible
- Check disk space
- Review FFmpeg logs

### Notifications Not Received
- Test webhook URL directly
- Check Slack app permissions
- Verify channel settings

---

## Next Steps

Once all APIs are configured:

1. Update workflow with your credentials
2. Run in dry-run mode first
3. Monitor initial executions
4. Adjust parameters as needed
5. Activate for production (with proper licensing!)

---

For additional help, see main README.md or TROUBLESHOOTING.md
