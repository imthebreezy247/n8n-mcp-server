# TikTok Auto Clipper

An automated N8N workflow system that creates and posts 2-minute video clips from popular movies and TV shows to TikTok.

## WARNING - LEGAL DISCLAIMER

**THIS PROJECT IS FOR EDUCATIONAL PURPOSES ONLY**

Using copyrighted content (movies, TV shows) without proper authorization is **ILLEGAL** and violates:
- Copyright laws (DMCA in the US, similar laws worldwide)
- TikTok's Terms of Service
- Content distribution agreements

**Before using this system, you MUST:**
1. Obtain proper licensing rights for all content
2. Ensure compliance with fair use provisions (if applicable)
3. Get written permission from copyright holders
4. Comply with all platform terms of service
5. Consult with a legal professional

**The creators and contributors of this project:**
- Do NOT endorse copyright infringement
- Are NOT responsible for any legal issues from misuse
- Provide this code for educational/demonstration purposes only

See [docs/LEGAL.md](docs/LEGAL.md) for detailed legal information.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Setup](#api-setup)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)

## Features

- **Automated Content Selection**: Pulls trending movies from TMDB based on ratings and popularity
- **Intelligent Clip Generation**: Creates 2-minute vertical video clips optimized for TikTok
- **Smart Scheduling**: Posts 5 times daily at optimal engagement times
- **Caption Generation**: Automatically creates engaging captions with relevant hashtags
- **Error Handling**: Comprehensive error handling with notifications
- **Dry Run Mode**: Test the workflow without actually posting
- **Monitoring**: Slack notifications and execution logging

## Architecture

### Workflow Overview

```
┌─────────────────┐
│ Schedule Trigger│ (5x daily)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Get Popular     │ (TMDB API)
│ Movies          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Filter & Select │ (Rating > 7.5)
│ Random Movie    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Get Full Movie  │ (Metadata, cast, etc)
│ Details         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate Clip   │ (Timestamps, params)
│ Parameters      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Process Video   │ (FFmpeg/Cloud service)
│ Clip            │ (Crop to 9:16, etc)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate        │ (Hashtags, description)
│ Caption         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check Dry Run   │
│ Mode            │
└────┬───────┬────┘
     │       │
  No │       │ Yes
     │       │
     ▼       ▼
┌──────┐  ┌──────┐
│Post  │  │Log   │
│TikTok│  │Only  │
└──────┘  └──────┘
```

### Components

1. **N8N Workflow**: Main automation orchestrator
2. **TMDB Integration**: Movie database for content discovery
3. **Video Processing Service**: FFmpeg-based clip creation
4. **TikTok API Integration**: Automated posting
5. **Notification System**: Slack/Email alerts

## Requirements

### Software Requirements

- **N8N**: v1.0.0 or higher
- **Node.js**: v16.x or higher
- **FFmpeg**: 4.x or higher (for video processing)
- **Storage**: Sufficient space for video processing (recommend 50GB+)

### API Requirements

1. **TMDB API Key** (Free)
   - Sign up: https://www.themoviedb.org/
   - Get API key: https://www.themoviedb.org/settings/api

2. **TikTok Developer Account** (Approval required)
   - Apply: https://developers.tiktok.com/
   - Requires business/developer verification

3. **Video Processing Service** (Choose one):
   - Cloudinary (Free tier available)
   - AWS MediaConvert (Pay per use)
   - Self-hosted FFmpeg service (included)

4. **Video Source Storage** (Required):
   - AWS S3 bucket with movie files
   - Or local storage with video files
   - Or streaming URLs (requires licensing)

5. **Notification Service** (Optional):
   - Slack webhook
   - Or email service

## Installation

### 1. Clone/Copy Project

```bash
cd /home/user/n8n-mcp-server/tiktok-auto-clipper
```

### 2. Run Setup Script

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 3. Configure Environment Variables

Copy the example environment file and edit with your credentials:

```bash
cp config/.env.example config/.env
nano config/.env
```

### 4. Install Video Processor Dependencies (if using self-hosted)

```bash
cd scripts
npm init -y
npm install express
```

### 5. Import Workflow to N8N

1. Start N8N:
   ```bash
   n8n
   ```

2. Open N8N interface (usually http://localhost:5678)

3. Navigate to **Workflows** → **Import Workflow**

4. Upload file: `workflows/tiktok-auto-clipper-workflow.json`

5. Configure credentials (see [API Setup Guide](docs/API-SETUP.md))

## Configuration

### Environment Variables

Edit `config/.env` with your credentials:

```bash
# TMDB API
TMDB_API_KEY=your_api_key_here

# TikTok API
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
TIKTOK_ACCESS_TOKEN=your_access_token

# Video Processing
VIDEO_PROCESSING_SERVICE_URL=http://localhost:3000
VIDEO_SERVICE_API_KEY=your_api_key

# Video Storage
VIDEO_SOURCE_TYPE=s3
AWS_S3_BUCKET=your-movie-bucket
AWS_ACCESS_KEY=your_aws_key
AWS_SECRET_KEY=your_aws_secret

# Notifications
SLACK_WEBHOOK_URL=your_slack_webhook

# Safety
DRY_RUN_MODE=true  # Set to false for production
```

### Workflow Settings

Edit `config/config.example.json` to customize:

- Posting schedule times
- Content selection criteria (genres, ratings)
- Video format settings
- Hashtag preferences

## Usage

### Test Mode (Recommended First)

1. Ensure `DRY_RUN_MODE=true` in `.env`
2. In N8N, manually execute the workflow
3. Check logs to verify everything works
4. Review generated captions and clip parameters

### Production Mode

1. Set `DRY_RUN_MODE=false` in `.env`
2. Activate the workflow in N8N
3. Monitor executions in N8N dashboard
4. Check Slack for notifications

### Manual Execution

You can manually trigger the workflow:

1. Open workflow in N8N
2. Click "Execute Workflow"
3. Monitor execution in real-time
4. Review results in execution log

### Monitoring

- **N8N Dashboard**: View all executions
- **Slack Notifications**: Success/failure alerts
- **Logs Directory**: `logs/` contains execution logs
- **TikTok Analytics**: Monitor post performance

## API Setup

See detailed API setup instructions in [docs/API-SETUP.md](docs/API-SETUP.md)

### Quick Links

- **TMDB API**: https://www.themoviedb.org/settings/api
- **TikTok Developers**: https://developers.tiktok.com/
- **Cloudinary**: https://cloudinary.com/
- **Slack Webhooks**: https://api.slack.com/messaging/webhooks

## Troubleshooting

### Common Issues

**Workflow fails at "Get Popular Movies"**
- Check TMDB API key is valid
- Verify internet connection
- Check API rate limits

**Video processing fails**
- Ensure FFmpeg is installed: `ffmpeg -version`
- Check video source URLs are accessible
- Verify sufficient disk space

**TikTok posting fails**
- Verify TikTok access token is valid (they expire)
- Check TikTok API rate limits
- Ensure video meets TikTok requirements (max 3 min, max 287MB)

**No movies selected**
- Lower the `min_rating` threshold in config
- Check TMDB API is returning results
- Verify filter criteria isn't too strict

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for detailed solutions.

## Project Structure

```
tiktok-auto-clipper/
├── config/
│   ├── config.example.json      # Configuration template
│   ├── .env.example             # Environment variables template
│   └── .env                     # Your actual credentials (git-ignored)
├── workflows/
│   └── tiktok-auto-clipper-workflow.json  # Main N8N workflow
├── scripts/
│   ├── video-processor.js       # FFmpeg video processing service
│   └── setup.sh                 # Installation script
├── docs/
│   ├── API-SETUP.md            # API configuration guide
│   ├── LEGAL.md                # Legal information
│   └── TROUBLESHOOTING.md      # Common issues and solutions
├── logs/                        # Execution logs
└── README.md                    # This file
```

## Advanced Features

### Custom Scene Selection

The workflow includes basic random timestamp selection. For production use, consider:

- AI-based scene detection (using ML models)
- Manual curation of interesting scenes
- Integration with subtitle files to find dialogue peaks
- Sentiment analysis to find emotional moments

### Content Optimization

- A/B test different posting times
- Analyze which movie genres perform best
- Optimize hashtag combinations
- Track engagement metrics

### Scaling

- Process multiple clips in parallel
- Build a queue system for clip generation
- Implement content calendar planning
- Add multiple TikTok accounts support

## Contributing

This is an educational project. Contributions should focus on:
- Improved documentation
- Better error handling
- Legal compliance features
- Code quality improvements

## License

This project is provided as-is for educational purposes. See LICENSE file for details.

## Support

For issues or questions:
1. Check [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
2. Review N8N documentation: https://docs.n8n.io/
3. Check API provider documentation

## Acknowledgments

- N8N for the powerful automation platform
- TMDB for movie database API
- FFmpeg for video processing capabilities

---

**Remember**: Always respect copyright laws and obtain proper licensing before using any copyrighted content!
