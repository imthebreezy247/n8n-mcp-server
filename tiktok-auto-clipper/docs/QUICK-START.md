# Quick Start Guide

Get the TikTok Auto Clipper running in 15 minutes (for testing/educational purposes).

---

## Prerequisites

Before starting, ensure you have:

- [ ] N8N installed (`npm install -g n8n`)
- [ ] Node.js 16+ installed (`node --version`)
- [ ] FFmpeg installed (`ffmpeg -version`)
- [ ] A TMDB API key (free, takes 2 minutes)

---

## Step 1: Get TMDB API Key (2 minutes)

1. Go to https://www.themoviedb.org/signup
2. Create free account
3. Go to Settings → API
4. Click "Request an API Key" → Choose "Developer"
5. Fill simple form, get instant approval
6. Copy your API key

---

## Step 2: Configure Environment (3 minutes)

1. **Navigate to project**
   ```bash
   cd /home/user/n8n-mcp-server/tiktok-auto-clipper
   ```

2. **Create .env file**
   ```bash
   cp config/.env.example config/.env
   ```

3. **Edit .env file**
   ```bash
   nano config/.env
   ```

4. **Add your TMDB API key**
   ```bash
   TMDB_API_KEY=your_actual_api_key_here
   DRY_RUN_MODE=true
   ```

5. **Save and exit** (Ctrl+X, then Y, then Enter)

---

## Step 3: Set Up Video Processor (5 minutes)

1. **Install dependencies**
   ```bash
   cd scripts
   npm install
   ```

2. **Start video processor**
   ```bash
   node video-processor.js
   ```

   You should see: `Video processor service running on port 3000`

3. **Keep this terminal open**, open a new terminal for next steps

---

## Step 4: Import Workflow to N8N (3 minutes)

1. **Start N8N** (in new terminal)
   ```bash
   # Set environment variables for N8N
   export TMDB_API_KEY=your_api_key_here
   export DRY_RUN_MODE=true
   export VIDEO_PROCESSING_SERVICE_URL=http://localhost:3000

   # Start N8N
   n8n
   ```

2. **Open N8N in browser**
   - Navigate to: http://localhost:5678
   - Create account if first time

3. **Import workflow**
   - Click "Workflows" (left sidebar)
   - Click "Import Workflow" button
   - Upload file: `/home/user/n8n-mcp-server/tiktok-auto-clipper/workflows/tiktok-auto-clipper-workflow.json`

4. **Workflow should now appear in N8N**

---

## Step 5: Configure N8N Environment Variables (2 minutes)

1. **In N8N interface**
   - Click Settings (gear icon, bottom left)
   - Click "Environments" (or similar, depending on version)

2. **Add variables** (if not already set from command line)
   - `TMDB_API_KEY` = your API key
   - `DRY_RUN_MODE` = true
   - `VIDEO_PROCESSING_SERVICE_URL` = http://localhost:3000

3. **Save settings**

---

## Step 6: Test the Workflow (2 minutes)

1. **Open the imported workflow**

2. **Execute manually**
   - Click "Execute Workflow" button (top right)
   - Watch as each node executes

3. **Check results**
   - Click on each node to see output
   - Verify "Get Popular Movies" returns movies
   - Check "Filter & Select Movie" chose one
   - See "Dry Run Log" node shows what would be posted

4. **Success!** You should see:
   - A movie was selected
   - Metadata was fetched
   - Caption was generated
   - Dry run log shows the result

---

## What You Can Do Now

### Test Different Scenarios

1. **Lower rating threshold**
   - Edit "Filter & Select Movie" node
   - Change `vote_average >= 7.5` to `>= 6.0`
   - Get more movie options

2. **Change schedule**
   - Edit "Schedule (5x Daily)" node
   - Change cron expression
   - Example: `*/10 * * * *` = every 10 minutes

3. **Modify caption format**
   - Edit "Generate Caption & Hashtags" node
   - Customize caption text
   - Add/remove hashtags

---

## Limitations in Test Mode

Since you're in **DRY_RUN_MODE=true**:

- ✅ Workflow executes fully
- ✅ Movies are selected
- ✅ Captions are generated
- ❌ Videos are NOT actually processed (would need real video files)
- ❌ Nothing is posted to TikTok (no TikTok credentials)
- ✅ You can see what WOULD happen

---

## Next Steps

### To Actually Process Videos:

You need:
1. **Video source files**
   - Store movies in accessible location (S3, local, etc.)
   - Update workflow with actual video paths
   - Ensure legal rights to use content!

2. **Video storage configuration**
   ```bash
   # Add to .env
   VIDEO_SOURCE_TYPE=local
   VIDEO_STORAGE_PATH=/path/to/your/movies
   ```

### To Actually Post to TikTok:

You need:
1. **TikTok Developer Account** (requires approval)
   - See [API-SETUP.md](API-SETUP.md) for detailed steps
   - Apply at: https://developers.tiktok.com/

2. **TikTok OAuth credentials**
   - Client Key
   - Client Secret
   - Access Token

3. **Enable production mode**
   ```bash
   DRY_RUN_MODE=false
   ```

---

## Common Issues

### "TMDB API returns no movies"
- Check API key is correct
- Test API key with: `curl "https://api.themoviedb.org/3/movie/popular?api_key=YOUR_KEY"`

### "Video processor not reachable"
- Verify it's running: `curl http://localhost:3000/health`
- Should return: `{"status":"healthy"}`

### "Workflow fails on execution"
- Check N8N logs for errors
- Verify all environment variables are set
- Try executing nodes individually

### "No movies selected"
- Lower rating threshold in filter
- Check internet connection
- Verify TMDB API is responding

---

## Testing Checklist

Use this to verify everything works:

- [ ] TMDB API key configured
- [ ] Video processor running on port 3000
- [ ] N8N running on port 5678
- [ ] Workflow imported successfully
- [ ] Environment variables set
- [ ] Manual execution succeeds
- [ ] "Get Popular Movies" returns data
- [ ] A movie is selected
- [ ] Caption is generated
- [ ] Dry run log shows result

---

## Getting Help

If stuck:

1. **Check logs**
   ```bash
   # N8N logs
   tail -f ~/.n8n/n8n.log

   # Video processor logs
   # (check terminal where it's running)
   ```

2. **Review documentation**
   - [README.md](../README.md)
   - [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
   - [API-SETUP.md](API-SETUP.md)

3. **Test components individually**
   - Test TMDB API with curl
   - Test video processor endpoint
   - Test each N8N node separately

---

## Safety Reminders

⚠️ **This is for EDUCATIONAL purposes only**

- Don't use copyrighted content without permission
- See [LEGAL.md](LEGAL.md) for important legal information
- Keep DRY_RUN_MODE=true until you have:
  - Legal rights to content
  - TikTok API approval
  - Proper video sources

---

## What's Next?

Once comfortable with the test setup:

1. **Read legal documentation**: [LEGAL.md](LEGAL.md)
2. **Set up video storage**: [API-SETUP.md](API-SETUP.md#4-video-storage-setup)
3. **Apply for TikTok API**: [API-SETUP.md](API-SETUP.md#2-tiktok-api-setup)
4. **Configure notifications**: Add Slack webhook
5. **Optimize for production**: Review performance settings

---

**Congratulations!** You now have a working N8N automation workflow (in test mode).

Remember: Always respect copyright laws and platform terms of service!
