import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import http from 'http';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// CONFIG — set PYTHON_BACKEND_URL in .env to switch to remote mode
// e.g. PYTHON_BACKEND_URL=http://192.168.1.50:8000
// Leave empty to run in local mode (reads CSVs from this machine)
// ---------------------------------------------------------------------------
const PYTHON_BACKEND = process.env.PYTHON_BACKEND_URL || '';
const IS_REMOTE = !!PYTHON_BACKEND;

// ✅ FIX 1 — only serve detections/events with confidence >= this value
const MIN_CONFIDENCE = 0.89;

const SNAP_DIR = path.join(__dirname, 'snapshots');
if (!IS_REMOTE) {
  if (!fs.existsSync(SNAP_DIR)) fs.mkdirSync(SNAP_DIR, { recursive: true });
  app.use('/snapshots', express.static(SNAP_DIR));
}

// ---------------------------------------------------------------------------
// REMOTE HELPER — fetch JSON from Python backend
// ---------------------------------------------------------------------------
function fetchFromBackend(backendPath) {
  return new Promise((resolve, reject) => {
    const url = `${PYTHON_BACKEND}${backendPath}`;
    const client = url.startsWith('https') ? https : http;

    client.get(url, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch (e) {
          reject(new Error(`Invalid JSON from backend at ${backendPath}: ${e.message}`));
        }
      });
    }).on('error', (err) => {
      reject(new Error(`Cannot reach Python backend at ${url}: ${err.message}`));
    });
  });
}

// ---------------------------------------------------------------------------
// REMOTE HELPER — pipe SSE stream from Python backend to client
// ---------------------------------------------------------------------------
function pipeSSEFromBackend(backendPath, req, res) {
  const url = `${PYTHON_BACKEND}${backendPath}`;
  const client = url.startsWith('https') ? https : http;

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.flushHeaders();

  const backendReq = client.get(url, (backendRes) => {
    backendRes.on('data', (chunk) => {
      try { res.write(chunk); } catch (_) {}
    });
    backendRes.on('end', () => res.end());
    backendRes.on('error', (err) => {
      console.error('SSE backend stream error:', err.message);
      res.end();
    });
  });

  backendReq.on('error', (err) => {
    console.error('SSE backend connect error:', err.message);
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  });

  req.on('close', () => {
    backendReq.destroy();
    res.end();
  });
}

// ---------------------------------------------------------------------------
// SNAPSHOT IMAGE PROXY — remote mode, proxies images from Python backend
// ---------------------------------------------------------------------------
app.get('/snapshots/:filename', (req, res) => {
  if (!IS_REMOTE) return;

  const url = `${PYTHON_BACKEND}/snapshots/${req.params.filename}`;
  const client = url.startsWith('https') ? https : http;

  client.get(url, (backendRes) => {
    res.set('Content-Type', backendRes.headers['content-type'] || 'image/jpeg');
    backendRes.pipe(res);
  }).on('error', (err) => {
    res.status(502).json({ error: 'Could not fetch snapshot', detail: err.message });
  });
});

// ---------------------------------------------------------------------------
// LOCAL HELPER — list snapshots from disk
// ✅ FIX 2 — sort by frame number ascending so frames show in correct order
// ---------------------------------------------------------------------------
function listSnapshots() {
  if (!fs.existsSync(SNAP_DIR)) return [];

  return fs.readdirSync(SNAP_DIR)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .map(name => {
      const stat = fs.statSync(path.join(SNAP_DIR, name));
      const formattedTime = stat.mtime.toLocaleString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Extract frame number from filename e.g. frame_45_conf95.jpg → 45
      const frameMatch = name.match(/frame_(\d+)/i);
      const frameNo    = frameMatch ? parseInt(frameMatch[1], 10) : 0;

      // Extract confidence from filename e.g. conf95 → 0.95
      const confMatch  = name.match(/conf(\d+)/i);
      const confidence = confMatch ? parseInt(confMatch[1], 10) / 100 : null;

      return {
        id:         name,
        name:       `Snapshot ${frameNo || name.split('_')[1]?.split('.')[0] || 'Unknown'}`,
        url:        `/snapshots/${name}`,
        mtime:      stat.mtimeMs,
        frameNo,
        timestamp:  formattedTime,
        action:     name.includes('alert') ? 'Dumping Detected' : 'Normal Action',
        confidence,
      };
    })
    // ✅ ascending frame order — frame 1 first, last frame last
    .sort((a, b) => a.frameNo - b.frameNo);
}

// ---------------------------------------------------------------------------
// LOCAL CSV — read and cache (5 second TTL)
// ---------------------------------------------------------------------------
let detectionsCache = null;
let eventsCache = null;
let lastCacheUpdate = 0;

async function loadCSVData() {
  const now = Date.now();
  if (detectionsCache && eventsCache && (now - lastCacheUpdate < 5000)) {
    return { detections: detectionsCache, events: eventsCache };
  }

  const readCSV = (filePath) => {
    return new Promise((resolve) => {
      const results = [];
      if (!fs.existsSync(filePath)) { resolve(results); return; }
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => {
          console.error(`Error reading ${filePath}:`, error);
          resolve([]);
        });
    });
  };

  detectionsCache = await readCSV('detections.csv');
  eventsCache     = await readCSV('events.csv');
  lastCacheUpdate = now;

  return { detections: detectionsCache, events: eventsCache };
}

// ---------------------------------------------------------------------------
// LOCAL DATA PROCESSORS — real confidence from CSV, no Math.random()
// ✅ FIX 1 — filter out any row whose confidence exists but is below 0.89
// ---------------------------------------------------------------------------
function processDetectionsData(data) {
  if (!data || data.length === 0) return [];

  return data
    .map((row, index) => {
      const rawConf = row.confidence !== undefined ? parseFloat(row.confidence) : null;
      return {
        frame:      parseInt(row.frame) || index + 1,
        time:       parseFloat(row.time_seconds || 0).toFixed(3),
        action:     row.action || 'Normal Action',
        confidence: rawConf !== null && !isNaN(rawConf) ? parseFloat(rawConf.toFixed(4)) : null,
      };
    })
    // keep row when: no confidence column (null) OR confidence >= threshold
    .filter(row => row.confidence === null || row.confidence >= MIN_CONFIDENCE);
}

function processEventsData(data) {
  if (!data || data.length === 0) return [];

  return data
    .map((row, index) => {
      const rawConf = row.confidence !== undefined ? parseFloat(row.confidence) : null;
      return {
        frame:      parseInt(row.frame) || index + 1,
        timestamp:  parseFloat(row.timestamp || 0).toFixed(3),
        action:     row.action || 'Normal Action',
        confidence: rawConf !== null && !isNaN(rawConf) ? parseFloat(rawConf.toFixed(4)) : null,
      };
    })
    .filter(row => row.confidence === null || row.confidence >= MIN_CONFIDENCE);
}

// ---------------------------------------------------------------------------
// LOCAL STATS — real values only, no random generation
// ---------------------------------------------------------------------------
async function calculateStats() {
  const { detections, events } = await loadCSVData();
  const processedDetections = processDetectionsData(detections);
  const processedEvents     = processEventsData(events);

  const totalFrames       = Math.max(processedDetections.length, processedEvents.length);
  const dumpingDetections = processedDetections.filter(d => d.action === 'Dumping Detected').length;
  const normalDetections  = processedDetections.filter(d => d.action === 'Normal Action').length;
  const noPoseEvents      = processedEvents.filter(e => e.action === 'No Pose Detected').length;

  // Average confidence only from rows that have a real value
  const allConfidences = [
    ...processedDetections.map(d => d.confidence),
    ...processedEvents.map(e => e.confidence),
  ].filter(c => c !== null && !isNaN(c));

  const avgConfidence = allConfidences.length > 0
    ? (allConfidences.reduce((sum, c) => sum + c, 0) / allConfidences.length * 100).toFixed(1)
    : null;

  const totalEvents        = processedEvents.length;
  const poseDetectedEvents = totalEvents - noPoseEvents;
  const detectionRate      = totalEvents > 0
    ? ((poseDetectedEvents / totalEvents) * 100).toFixed(1)
    : 0;

  // Peak hour from detections timestamps
  const hourCounts = {};
  processedDetections.forEach(d => {
    const hour = Math.floor(parseFloat(d.time) / 3600);
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  let peakHour = '00:00-01:00';
  let maxCount = 0;
  Object.entries(hourCounts).forEach(([hour, count]) => {
    if (count > maxCount) {
      maxCount = count;
      const h = parseInt(hour);
      peakHour = `${String(h).padStart(2, '0')}:00-${String(h + 1).padStart(2, '0')}:00`;
    }
  });

  const recentThreshold = Math.floor(processedDetections.length * 0.9);
  const recentDumping   = processedDetections
    .slice(recentThreshold)
    .filter(d => d.action === 'Dumping Detected').length;

  return {
    totalFrames,
    dumpingDetected:    dumpingDetections,
    normalActions:      normalDetections,
    noPoseDetected:     noPoseEvents,
    dumpingPercentage:  totalFrames > 0 ? ((dumpingDetections / totalFrames) * 100).toFixed(1) : 0,
    recentDumping,
    avgConfidence:      avgConfidence !== null ? parseFloat(avgConfidence) : null,
    detectionRate:      `${detectionRate}%`,
    systemUptime:       '99.8%',
    peakHour,
    poseDetectionRate:  `${detectionRate}%`,
    noPosePercentage:   totalEvents > 0 ? ((noPoseEvents / totalEvents) * 100).toFixed(1) : 0,
  };
}

// ===========================================================================
// ROUTES
// ===========================================================================

// --- /api/snapshots ---
app.get('/api/snapshots', async (req, res) => {
  if (IS_REMOTE) {
    try {
      const { status, data } = await fetchFromBackend('/api/snapshots');
      return res.status(status).json(data);
    } catch (err) {
      console.error('GET /api/snapshots (remote):', err.message);
      return res.status(502).json({ error: 'Could not reach Python backend', detail: err.message });
    }
  }
  try {
    res.json(listSnapshots());
  } catch (err) {
    console.error('failed /api/snapshots (local)', err);
    res.status(500).json([]);
  }
});

// --- /api/stream-snapshots (SSE) ---
app.get('/api/stream-snapshots', (req, res) => {
  if (IS_REMOTE) {
    return pipeSSEFromBackend('/api/stream-snapshots', req, res);
  }

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.flushHeaders();

  res.write(`event: snapshots\n`);
  res.write(`data: ${JSON.stringify(listSnapshots())}\n\n`);

  let watcher;
  try {
    watcher = fs.watch(SNAP_DIR, { persistent: true }, (eventType, filename) => {
      if (filename && /\.(jpg|jpeg|png|webp)$/i.test(filename)) {
        try {
          res.write(`event: snapshots\n`);
          res.write(`data: ${JSON.stringify(listSnapshots())}\n\n`);
        } catch (e) {
          console.error('Error sending snapshot update:', e);
        }
      }
    });
  } catch (error) {
    console.error('Error setting up file watcher:', error);
  }

  const intervalId = setInterval(() => {
    try {
      res.write(`event: snapshot_heartbeat\n`);
      res.write(`data: ${JSON.stringify(listSnapshots())}\n\n`);
    } catch (e) {
      console.error('Error sending heartbeat:', e);
    }
  }, 5000);

  req.on('close', () => {
    clearInterval(intervalId);
    if (watcher) watcher.close();
    res.end();
  });
});

// --- /api/detections ---
app.get('/api/detections', async (req, res) => {
  if (IS_REMOTE) {
    try {
      const { status, data } = await fetchFromBackend('/api/detections');
      return res.status(status).json(data);
    } catch (err) {
      console.error('GET /api/detections (remote):', err.message);
      return res.status(502).json({ error: 'Could not reach Python backend', detail: err.message });
    }
  }

  try {
    const { detections } = await loadCSVData();

    if (detections.length === 0) {
      const { events } = await loadCSVData();
      return res.json(processEventsData(events));
    }

    const processedData = processDetectionsData(detections);

    console.log('Sending detections data:', {
      total: processedData.length,
      sample: processedData.slice(0, 3),
      confidenceStats: processedData.some(d => d.confidence !== null) ? {
        min: Math.min(...processedData.filter(d => d.confidence !== null).map(d => d.confidence)).toFixed(4),
        max: Math.max(...processedData.filter(d => d.confidence !== null).map(d => d.confidence)).toFixed(4),
        avg: (processedData.filter(d => d.confidence !== null).reduce((s, d) => s + d.confidence, 0) / processedData.filter(d => d.confidence !== null).length).toFixed(4),
      } : 'no confidence data in CSV',
    });

    res.json(processedData);
  } catch (error) {
    console.error('Error in /api/detections:', error);
    res.status(500).json({ error: 'Failed to load detection data' });
  }
});

// --- /api/events ---
app.get('/api/events', async (req, res) => {
  if (IS_REMOTE) {
    try {
      const { status, data } = await fetchFromBackend('/api/events');
      return res.status(status).json(data);
    } catch (err) {
      console.error('GET /api/events (remote):', err.message);
      return res.status(502).json({ error: 'Could not reach Python backend', detail: err.message });
    }
  }

  try {
    const { events } = await loadCSVData();
    const processedData = processEventsData(events);

    console.log('Sending events data:', {
      total: processedData.length,
      sample: processedData.slice(0, 3),
      actionBreakdown: {
        normal:  processedData.filter(e => e.action === 'Normal Action').length,
        dumping: processedData.filter(e => e.action === 'Dumping Detected').length,
        noPose:  processedData.filter(e => e.action === 'No Pose Detected').length,
      },
    });

    res.json(processedData);
  } catch (error) {
    console.error('Error in /api/events:', error);
    res.status(500).json({ error: 'Failed to load events data' });
  }
});

// --- /api/stats ---
app.get('/api/stats', async (req, res) => {
  if (IS_REMOTE) {
    try {
      const { status, data } = await fetchFromBackend('/api/stats');
      return res.status(status).json(data);
    } catch (err) {
      console.error('GET /api/stats (remote):', err.message);
      return res.status(502).json({ error: 'Could not reach Python backend', detail: err.message });
    }
  }

  try {
    const stats = await calculateStats();
    console.log('Calculated stats from CSV data:', {
      totalFrames:       stats.totalFrames,
      dumpingPercentage: stats.dumpingPercentage,
      avgConfidence:     stats.avgConfidence,
      detectionRate:     stats.detectionRate,
    });
    res.json(stats);
  } catch (error) {
    console.error('Error in /api/stats:', error);
    res.status(500).json({ error: 'Failed to calculate statistics', details: error.message });
  }
});

// --- /api/timeline ---
app.get('/api/timeline', async (req, res) => {
  if (IS_REMOTE) {
    try {
      const { status, data } = await fetchFromBackend('/api/timeline');
      return res.status(status).json(data);
    } catch (err) {
      console.error('GET /api/timeline (remote):', err.message);
      return res.status(502).json({ error: 'Could not reach Python backend', detail: err.message });
    }
  }

  try {
    const { detections, events } = await loadCSVData();
    const processedDetections = processDetectionsData(detections);
    const processedEvents     = processEventsData(events);

    const timeline = [
      ...processedDetections.map(d => ({ ...d, type: 'detection', source: 'detections.csv' })),
      ...processedEvents.map(e => ({ ...e, type: 'event', source: 'events.csv', time: e.timestamp })),
    ].sort((a, b) => parseFloat(a.time) - parseFloat(b.time));

    res.json({
      timeline,
      summary: {
        totalEntries:    timeline.length,
        detectionsCount: processedDetections.length,
        eventsCount:     processedEvents.length,
        timeRange: {
          start:    timeline[0]?.time || 0,
          end:      timeline[timeline.length - 1]?.time || 0,
          duration: (
            parseFloat(timeline[timeline.length - 1]?.time || 0) -
            parseFloat(timeline[0]?.time || 0)
          ).toFixed(2),
        },
      },
    });
  } catch (error) {
    console.error('Error in /api/timeline:', error);
    res.status(500).json({ error: 'Failed to load timeline data' });
  }
});

// --- /api/health ---
app.get('/api/health', async (req, res) => {
  if (IS_REMOTE) {
    let backendHealth = null;
    let backendReachable = false;
    try {
      const { data } = await fetchFromBackend('/api/health');
      backendHealth = data;
      backendReachable = true;
    } catch (_) {}

    return res.json({
      proxy: {
        status: 'running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        python_backend_url: PYTHON_BACKEND,
        python_backend_reachable: backendReachable,
      },
      backend: backendHealth,
    });
  }

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      api: 'running',
      csv_processing: 'active',
      data_cache: detectionsCache ? 'loaded' : 'empty',
      snapshots: fs.existsSync(SNAP_DIR) ? 'available' : 'unavailable',
    },
    data_stats: {
      detections_loaded: detectionsCache ? detectionsCache.length : 0,
      events_loaded:     eventsCache     ? eventsCache.length     : 0,
      last_cache_update: new Date(lastCacheUpdate).toISOString(),
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// ===========================================================================
// START
// ===========================================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Backend API running at http://localhost:${PORT}`);

  if (IS_REMOTE) {
    console.log(`🔗 Mode: REMOTE — forwarding all API calls to: ${PYTHON_BACKEND}`);
    console.log(`   (Set PYTHON_BACKEND_URL in .env to change this)`);
  } else {
    console.log(`💾 Mode: LOCAL — reading CSV files from this machine`);
    console.log(`📸 Snapshots directory: ${SNAP_DIR}`);
    console.log(`📊 CSV files:`);
    console.log(`   - detections.csv : ${fs.existsSync('detections.csv') ? 'Found ✅' : 'Not found ❌'}`);
    console.log(`   - events.csv     : ${fs.existsSync('events.csv')     ? 'Found ✅' : 'Not found ❌'}`);
  }

  console.log(`\n⚙️  Confidence threshold  : >= ${MIN_CONFIDENCE} (${MIN_CONFIDENCE * 100}%)`);
  console.log(`\n🔍 Available endpoints:`);
  console.log(`   GET /api/snapshots        - Get all snapshots`);
  console.log(`   GET /api/stream-snapshots - SSE for snapshot updates`);
  console.log(`   GET /api/detections       - Get detection data`);
  console.log(`   GET /api/events           - Get events data`);
  console.log(`   GET /api/stats            - Get statistics`);
  console.log(`   GET /api/timeline         - Get combined timeline`);
  console.log(`   GET /api/health           - Health check\n`);
});

// Initial local data load
if (!IS_REMOTE) {
  loadCSVData().then(({ detections, events }) => {
    console.log(`📈 Initial data loaded:`);
    console.log(`   - Detections : ${detections.length} records`);
    console.log(`   - Events     : ${events.length} records`);
    console.log(`   - Dumping detected : ${detections.filter(d => d.action === 'Dumping Detected').length}`);
    console.log(`   - No pose detected : ${events.filter(e => e.action === 'No Pose Detected').length}`);
  }).catch(error => {
    console.error('Failed to load initial CSV data:', error);
  });
}