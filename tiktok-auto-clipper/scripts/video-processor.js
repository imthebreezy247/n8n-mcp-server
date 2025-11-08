/**
 * Video Processing Script for TikTok Auto Clipper
 *
 * This script provides video processing functionality using FFmpeg
 * Can be deployed as a microservice that the N8N workflow calls
 *
 * Requirements:
 * - FFmpeg installed
 * - Node.js 16+
 * - Express for API server
 */

const express = require('express');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TEMP_DIR = process.env.TEMP_DIR || '/tmp/video-processing';
const OUTPUT_DIR = process.env.OUTPUT_DIR || '/tmp/video-output';

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(TEMP_DIR, { recursive: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

/**
 * Process video clip - extract segment and convert to TikTok format
 */
async function processVideoClip(options) {
  const {
    source_url,
    start_time,
    duration,
    output_format = {
      resolution: '1080x1920',
      aspect_ratio: '9:16',
      codec: 'h264',
      format: 'mp4',
      bitrate: '5000k'
    },
    transformations = [],
    metadata = {}
  } = options;

  try {
    const clipId = `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const outputFile = path.join(OUTPUT_DIR, `${clipId}.${output_format.format}`);

    // Build FFmpeg command
    let ffmpegCmd = `ffmpeg -i "${source_url}" `;

    // Set start time and duration
    ffmpegCmd += `-ss ${start_time} -t ${duration} `;

    // Convert to vertical format (9:16 aspect ratio)
    // This crops the center and scales to TikTok format
    const [width, height] = output_format.resolution.split('x');
    ffmpegCmd += `-vf "crop=ih*9/16:ih,scale=${width}:${height}" `;

    // Set codec and bitrate
    ffmpegCmd += `-c:v ${output_format.codec} -b:v ${output_format.bitrate} `;

    // Audio settings
    ffmpegCmd += `-c:a aac -b:a 128k `;

    // Additional transformations
    if (transformations.includes('enhance_audio')) {
      // Audio normalization
      ffmpegCmd += `-af "loudnorm=I=-16:TP=-1.5:LRA=11" `;
    }

    // Output file
    ffmpegCmd += `-y "${outputFile}"`;

    console.log('FFmpeg command:', ffmpegCmd);

    // Execute FFmpeg
    const { stdout, stderr } = await execPromise(ffmpegCmd);

    // Check if file was created
    const stats = await fs.stat(outputFile);

    return {
      success: true,
      clip_id: clipId,
      output_file: outputFile,
      file_size: stats.size,
      duration: duration,
      format: output_format.format,
      processed_at: new Date().toISOString(),
      // In production, you'd upload this to CDN and return URL
      video_url: `https://your-cdn.com/clips/${clipId}.${output_format.format}`,
      thumbnail_url: `https://your-cdn.com/clips/${clipId}_thumb.jpg`,
      metadata: metadata
    };

  } catch (error) {
    console.error('Video processing error:', error);
    throw new Error(`Video processing failed: ${error.message}`);
  }
}

/**
 * API endpoint for video processing
 */
app.post('/api/v1/clip', async (req, res) => {
  try {
    const result = await processVideoClip(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'video-processor' });
});

/**
 * Extract interesting scenes using FFmpeg scene detection
 */
app.post('/api/v1/detect-scenes', async (req, res) => {
  try {
    const { video_url, threshold = 0.4 } = req.body;

    // Use FFmpeg scene detection
    const sceneCmd = `ffmpeg -i "${video_url}" -filter:v "select='gt(scene,${threshold})',showinfo" -f null - 2>&1 | grep showinfo`;

    const { stdout } = await execPromise(sceneCmd);

    // Parse scene timestamps from output
    const scenes = [];
    const lines = stdout.split('\n');
    lines.forEach(line => {
      const match = line.match(/pts_time:(\d+\.?\d*)/);
      if (match) {
        scenes.push(parseFloat(match[1]));
      }
    });

    res.json({
      success: true,
      scenes: scenes,
      total_scenes: scenes.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
async function start() {
  await ensureDirectories();
  app.listen(PORT, () => {
    console.log(`Video processor service running on port ${PORT}`);
    console.log(`Temp directory: ${TEMP_DIR}`);
    console.log(`Output directory: ${OUTPUT_DIR}`);
  });
}

start().catch(console.error);

module.exports = { processVideoClip };
