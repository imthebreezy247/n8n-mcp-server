# Troubleshooting Guide

Common issues and solutions for TikTok Auto Clipper.

---

## Table of Contents

1. [Workflow Execution Issues](#workflow-execution-issues)
2. [API Connection Problems](#api-connection-problems)
3. [Video Processing Errors](#video-processing-errors)
4. [TikTok Upload Failures](#tiktok-upload-failures)
5. [N8N Configuration Issues](#n8n-configuration-issues)
6. [Performance Problems](#performance-problems)

---

## Workflow Execution Issues

### Issue: Workflow doesn't start automatically

**Symptoms:**
- Schedule trigger not firing
- Manual execution works, but automatic doesn't

**Solutions:**

1. **Check if workflow is activated**
   ```
   - Open workflow in N8N
   - Look for "Active" toggle in top right
   - Ensure it's switched ON (green)
   ```

2. **Verify schedule trigger settings**
   ```
   - Open Schedule Trigger node
   - Check cron expression: "0 8,12,16,20,22 * * *"
   - Test with simpler schedule: "*/5 * * * *" (every 5 min)
   ```

3. **Check N8N is running**
   ```bash
   # If using systemd
   sudo systemctl status n8n

   # If running directly
   ps aux | grep n8n
   ```

4. **Review N8N logs**
   ```bash
   # Check N8N logs for errors
   tail -f ~/.n8n/n8n.log

   # Or if using Docker
   docker logs n8n-container
   ```

---

### Issue: Workflow fails immediately

**Symptoms:**
- Execution starts but fails on first node
- Error: "Workflow could not be started"

**Solutions:**

1. **Check environment variables**
   ```bash
   # Verify .env file exists and is loaded
   cat ~/.n8n/.env

   # Test environment variable access
   echo $TMDB_API_KEY
   ```

2. **Verify N8N can access environment variables**
   - In N8N, create test workflow
   - Add Code node: `return [{ json: { test: $env.TMDB_API_KEY } }];`
   - Execute and verify value appears

3. **Check node configuration**
   - Ensure all required fields are filled
   - Look for red error indicators on nodes
   - Hover over nodes to see validation errors

---

### Issue: Workflow executes but no data flows

**Symptoms:**
- Execution completes successfully
- But no output or empty results

**Solutions:**

1. **Check data connections**
   - Verify arrows between nodes are connected
   - Click on connections to see data flow
   - Use "Execute Previous Nodes" to test up to specific node

2. **Inspect node outputs**
   - Click on each node after execution
   - Check "OUTPUT" tab
   - Verify data structure matches expectations

3. **Review filter conditions**
   - Check "Filter & Select Movie" node
   - Lower rating threshold: Change `7.5` to `6.0`
   - Reduce popularity threshold
   - Temporarily disable filters to test

---

## API Connection Problems

### Issue: TMDB API returns 401 Unauthorized

**Symptoms:**
- "Get Popular Movies" node fails
- Error: "Invalid API key"

**Solutions:**

1. **Verify API key is correct**
   ```bash
   # Test API key directly
   curl "https://api.themoviedb.org/3/movie/popular?api_key=YOUR_API_KEY"

   # Should return JSON with movie list
   ```

2. **Check API key format**
   - TMDB API keys are 32-character alphanumeric strings
   - No spaces or special characters
   - Example format: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

3. **Regenerate API key**
   - Log in to TMDB
   - Go to Settings → API
   - Click "Reset" to generate new key
   - Update in `.env` file

4. **Check rate limits**
   - TMDB allows 40 requests per 10 seconds
   - If testing repeatedly, wait a few minutes
   - Review TMDB dashboard for usage stats

---

### Issue: TikTok API authentication fails

**Symptoms:**
- "Post to TikTok" node fails
- Error: "Invalid access token" or "OAuth error"

**Solutions:**

1. **Check token expiration**
   - TikTok access tokens expire (typically 24 hours)
   - Refresh token using OAuth flow

   ```bash
   curl -X POST "https://open-api.tiktok.com/oauth/refresh_token/" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "client_key=YOUR_CLIENT_KEY" \
     -d "grant_type=refresh_token" \
     -d "refresh_token=YOUR_REFRESH_TOKEN"
   ```

2. **Verify TikTok app status**
   - Log in to TikTok Developer Portal
   - Check app is approved and active
   - Verify required scopes are granted

3. **Check API permissions**
   - Ensure app has `video.upload` scope
   - Verify user authorized the app
   - Re-authorize if needed

4. **Test with TikTok API Explorer**
   - Use TikTok's API testing tool
   - Verify credentials work outside N8N
   - Isolate whether issue is N8N or TikTok

---

### Issue: Video processing service unreachable

**Symptoms:**
- "Process Video Clip" node fails
- Error: "ECONNREFUSED" or "Connection timeout"

**Solutions:**

1. **Check service is running**
   ```bash
   # If using self-hosted processor
   curl http://localhost:3000/health

   # Should return: {"status":"healthy"}
   ```

2. **Start video processor**
   ```bash
   cd /home/user/n8n-mcp-server/tiktok-auto-clipper/scripts
   node video-processor.js

   # Should see: "Video processor service running on port 3000"
   ```

3. **Verify URL configuration**
   - Check `.env`: `VIDEO_PROCESSING_SERVICE_URL=http://localhost:3000`
   - If N8N is in Docker, use host network or service name
   - Test URL accessibility from N8N's context

4. **Check firewall rules**
   ```bash
   # Allow port 3000
   sudo ufw allow 3000

   # Or disable firewall temporarily for testing
   sudo ufw disable
   ```

---

## Video Processing Errors

### Issue: FFmpeg not found

**Symptoms:**
- Video processor fails
- Error: "ffmpeg: command not found"

**Solutions:**

1. **Install FFmpeg**
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install ffmpeg

   # macOS
   brew install ffmpeg

   # CentOS/RHEL
   sudo yum install ffmpeg
   ```

2. **Verify installation**
   ```bash
   ffmpeg -version

   # Should show version info
   ```

3. **Add FFmpeg to PATH**
   ```bash
   # Find FFmpeg location
   which ffmpeg

   # Add to PATH in .bashrc or .zshrc
   export PATH=$PATH:/path/to/ffmpeg
   ```

---

### Issue: Video processing takes too long

**Symptoms:**
- Processing times exceed 5 minutes
- Timeout errors

**Solutions:**

1. **Increase timeout in workflow**
   - Edit "Process Video Clip" node
   - Options → Timeout → Set to 300000 (5 minutes) or higher

2. **Optimize FFmpeg settings**
   - Use faster presets: `-preset veryfast`
   - Reduce quality temporarily: `-crf 28` (lower quality, faster)
   - Use GPU acceleration if available: `-hwaccel cuda`

3. **Check system resources**
   ```bash
   # Monitor CPU/memory during processing
   top

   # Or use htop for better visualization
   htop
   ```

4. **Pre-process videos**
   - Compress source videos beforehand
   - Use lower resolution source files
   - Optimize video codec (H.264)

---

### Issue: Video quality is poor

**Symptoms:**
- Output video is blurry or pixelated
- Colors look washed out

**Solutions:**

1. **Adjust bitrate**
   - In video processor or workflow
   - Increase bitrate: `-b:v 8000k` (higher quality)
   - TikTok recommends: 5000k - 8000k

2. **Check source quality**
   - Ensure source video is high quality
   - Don't upscale low-resolution videos
   - Use 1080p or higher sources

3. **Optimize encoding settings**
   ```bash
   # Better quality settings
   -c:v libx264 -preset slow -crf 18 -b:v 8000k
   ```

4. **Verify aspect ratio conversion**
   - Check crop settings don't cut important content
   - Test with `crop=ih*9/16:ih` vs other crop strategies

---

### Issue: Audio out of sync

**Symptoms:**
- Audio doesn't match video
- Lip sync issues

**Solutions:**

1. **Use copy audio codec when possible**
   ```bash
   -c:a copy  # Don't re-encode audio
   ```

2. **If re-encoding needed, use AAC**
   ```bash
   -c:a aac -b:a 192k -ar 48000
   ```

3. **Set accurate timestamp**
   ```bash
   -ss 300 -t 120  # Seek to 300s, duration 120s
   # Put -ss BEFORE -i for accurate seeking
   ```

4. **Use async filter**
   ```bash
   -af "aresample=async=1"
   ```

---

## TikTok Upload Failures

### Issue: Video rejected by TikTok

**Symptoms:**
- Upload fails
- Error: "Invalid video format" or "Video doesn't meet requirements"

**Solutions:**

1. **Verify video meets TikTok specs**
   - **Format**: MP4, MOV, or WebM
   - **Duration**: 3 seconds - 10 minutes (use 2 minutes)
   - **Size**: Max 287MB
   - **Resolution**: 720x1280 or 1080x1920 (9:16 aspect ratio)
   - **Bitrate**: 5000k - 8000k
   - **Frame rate**: 23.976 - 60 fps

2. **Check file with mediainfo**
   ```bash
   # Install mediainfo
   sudo apt-get install mediainfo

   # Check video specs
   mediainfo your_video.mp4
   ```

3. **Re-encode to exact specs**
   ```bash
   ffmpeg -i input.mp4 \
     -vf "scale=1080:1920" \
     -c:v libx264 \
     -preset slow \
     -crf 18 \
     -b:v 6000k \
     -maxrate 8000k \
     -bufsize 12000k \
     -c:a aac \
     -b:a 192k \
     -ar 48000 \
     -movflags +faststart \
     output.mp4
   ```

---

### Issue: Copyright claim on TikTok

**Symptoms:**
- Video uploads but immediately removed
- Copyright strike notification
- Content ID match

**Solutions:**

1. **THIS IS A LEGAL ISSUE**
   - See [LEGAL.md](LEGAL.md) for details
   - Only use content you have rights to
   - Consider public domain content only

2. **Check TikTok's Content ID**
   - Before posting, upload privately first
   - See if it gets flagged
   - Don't post if flagged

3. **Use copyright-free content**
   - Public domain movies (pre-1928)
   - Creative Commons licensed content
   - Original content only

4. **Stop the workflow**
   - Don't continue posting copyrighted content
   - Risk of account ban
   - Legal consequences

---

### Issue: TikTok posting succeeds but video not visible

**Symptoms:**
- Upload returns success
- But video doesn't appear on profile

**Solutions:**

1. **Check TikTok privacy settings**
   - Verify workflow sets `privacy_level: "PUBLIC_TO_EVERYONE"`
   - Check account isn't set to private

2. **Wait for processing**
   - TikTok processes videos after upload
   - Can take 1-5 minutes
   - Check again after waiting

3. **Check for shadowban**
   - TikTok may limit visibility for various reasons
   - Post manually to test account health
   - Review TikTok Community Guidelines

4. **Verify account status**
   - Log in to TikTok app
   - Check for warnings or restrictions
   - Ensure account is in good standing

---

## N8N Configuration Issues

### Issue: N8N won't start

**Symptoms:**
- `n8n` command fails
- Error messages on startup

**Solutions:**

1. **Check N8N installation**
   ```bash
   # Verify N8N is installed
   npm list -g n8n

   # Reinstall if needed
   npm install -g n8n
   ```

2. **Check port availability**
   ```bash
   # Check if port 5678 is in use
   lsof -i :5678

   # Use different port
   export N8N_PORT=5679
   n8n
   ```

3. **Clear N8N cache**
   ```bash
   # Remove cache and restart
   rm -rf ~/.n8n/cache
   n8n
   ```

4. **Check Node.js version**
   ```bash
   # N8N requires Node 16+
   node --version

   # Update if needed
   nvm install 18
   nvm use 18
   ```

---

### Issue: Workflow import fails

**Symptoms:**
- Can't import workflow JSON
- Error: "Invalid workflow file"

**Solutions:**

1. **Validate JSON**
   ```bash
   # Check JSON syntax
   cat tiktok-auto-clipper-workflow.json | jq .

   # If error, fix JSON syntax
   ```

2. **Check file encoding**
   - Ensure file is UTF-8
   - No BOM (Byte Order Mark)
   - Unix line endings (LF, not CRLF)

3. **Try manual import**
   - Copy entire JSON content
   - In N8N: Workflows → Add Workflow
   - Click "Import from URL" → Cancel
   - Click "Import from File" → paste JSON

4. **Check N8N version compatibility**
   - Workflow designed for N8N 1.0+
   - Update N8N if using older version

---

### Issue: Credentials not saving

**Symptoms:**
- Save credentials but they disappear
- "Credentials not found" errors

**Solutions:**

1. **Check N8N data directory permissions**
   ```bash
   # Verify permissions
   ls -la ~/.n8n

   # Fix if needed
   chmod -R 755 ~/.n8n
   ```

2. **Check encryption key**
   ```bash
   # N8N uses encryption for credentials
   # Ensure N8N_ENCRYPTION_KEY is consistent

   export N8N_ENCRYPTION_KEY="your-key-here"
   ```

3. **Use database instead of files**
   - Configure N8N to use PostgreSQL or MySQL
   - More reliable for production
   ```bash
   export DB_TYPE=postgresdb
   export DB_POSTGRESDB_HOST=localhost
   # ... other DB settings
   ```

---

## Performance Problems

### Issue: Workflow is slow

**Symptoms:**
- Execution takes >5 minutes
- N8N interface is sluggish

**Solutions:**

1. **Optimize video processing**
   - Use faster FFmpeg presets
   - Process videos asynchronously
   - Consider queue system

2. **Reduce TMDB API calls**
   - Cache popular movies list
   - Don't fetch full details every time
   - Use webhook to refresh cache daily

3. **Use N8N queue mode**
   ```bash
   # Run N8N in queue mode for better performance
   export EXECUTIONS_MODE=queue
   n8n
   ```

4. **Increase system resources**
   - Add more RAM
   - Use faster CPU
   - Use SSD for video processing

---

### Issue: High CPU/memory usage

**Symptoms:**
- System becomes unresponsive
- N8N crashes

**Solutions:**

1. **Limit concurrent executions**
   - In N8N settings
   - Set max concurrent executions: 1-2
   - Prevents resource overload

2. **Monitor resource usage**
   ```bash
   # Watch resources
   watch -n 1 'ps aux | grep -E "(n8n|ffmpeg)" | grep -v grep'
   ```

3. **Process videos on separate server**
   - Deploy video processor to different machine
   - Use cloud service (Cloudinary, AWS)
   - Reduce load on N8N server

4. **Clean up temp files**
   ```bash
   # Remove old processed videos
   find /tmp/video-output -type f -mtime +7 -delete
   ```

---

## Debugging Tips

### Enable Debug Logging

```bash
# Start N8N with debug logging
export N8N_LOG_LEVEL=debug
n8n
```

### Test Individual Nodes

1. Click on node
2. Click "Execute Node"
3. View output immediately
4. Check for errors in OUTPUT tab

### Use Code Nodes for Debugging

Add Code node after problematic node:
```javascript
// Log all data
console.log('Data:', JSON.stringify($input.all(), null, 2));

// Return unchanged
return $input.all();
```

### Check N8N Community

- Forum: https://community.n8n.io/
- Discord: https://discord.gg/n8n
- GitHub Issues: https://github.com/n8n-io/n8n/issues

---

## Getting Help

If you're still stuck:

1. **Check N8N Documentation**
   - https://docs.n8n.io/

2. **Review Error Messages Carefully**
   - Often contain specific solution
   - Google exact error message

3. **Test Components Individually**
   - Test API calls outside workflow
   - Verify each service independently

4. **Ask for Help**
   - N8N Community Forum
   - Include: N8N version, OS, error message, workflow JSON
   - Don't share credentials!

---

**Last Updated**: November 2024

For additional help, see [README.md](../README.md) or [API-SETUP.md](API-SETUP.md)
