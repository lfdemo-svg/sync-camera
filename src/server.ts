import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import path from 'path';
import { CourtCoverageService } from './services/camera/CourtCoverageService';
import { CalibrationSession } from './types/calibration';

const app = express();
const server = createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Services
const courtService = new CourtCoverageService();
const activeSessions: Map<string, CalibrationSession> = new Map();

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Camera management
app.get('/api/cameras', (req, res) => {
  try {
    const analysis = courtService.analyzeCoverage();
    res.json({
      cameras: [
        {
          id: 'camera_a',
          name: 'Camera A (Back Wall)',
          status: 'active',
          position: { x: 5.0, y: 0.0, height: 1.35, wall: 'back_a' }
        },
        {
          id: 'camera_b', 
          name: 'Camera B (Back Wall)',
          status: 'active',
          position: { x: 5.0, y: 20.0, height: 1.35, wall: 'back_b' }
        }
      ],
      coverage: analysis
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get camera status' });
  }
});

app.post('/api/cameras/:cameraId/calibration/start', (req, res) => {
  try {
    const { cameraId } = req.params;
    const session = courtService.startCameraCalibration(cameraId);
    
    if (!session) {
      return res.status(404).json({ error: 'Camera not found' });
    }
    
    activeSessions.set(session.sessionId, session);
    
    res.json({
      sessionId: session.sessionId,
      cameraId,
      requiredPoints: session.targets,
      status: 'started'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start calibration' });
  }
});

app.post('/api/cameras/:cameraId/calibration/:sessionId/points', (req, res) => {
  try {
    const { cameraId, sessionId } = req.params;
    const { targetId, point, confidence } = req.body;
    
    const success = courtService.addCalibrationPoint(sessionId, targetId, point, confidence);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Failed to add calibration point' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to process calibration point' });
  }
});

app.post('/api/cameras/:cameraId/calibration/:sessionId/complete', async (req, res) => {
  try {
    const { cameraId, sessionId } = req.params;
    
    const success = await courtService.completeCalibration(sessionId);
    
    if (success) {
      activeSessions.delete(sessionId);
      const analysis = courtService.analyzeCoverage();
      
      res.json({
        success: true,
        coverage: analysis,
        calibrationComplete: true
      });
    } else {
      res.status(400).json({ error: 'Calibration failed - insufficient points or accuracy' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete calibration' });
  }
});

// Session management
app.get('/api/sessions', (req, res) => {
  res.json({
    sessions: [],
    activeSession: null
  });
});

app.post('/api/sessions', (req, res) => {
  const { name, cameras, duration, outputFormat } = req.body;
  
  // Simulate session creation
  const sessionId = `session_${Date.now()}`;
  
  res.json({
    sessionId,
    name,
    cameras,
    duration,
    outputFormat,
    status: 'created',
    startTime: new Date().toISOString()
  });
});

// Coverage analysis
app.get('/api/coverage/analysis', (req, res) => {
  try {
    const analysis = courtService.analyzeCoverage();
    const report = courtService.generateCoverageReport();
    
    res.json({
      analysis,
      report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze coverage' });
  }
});

// Coordinate transformation
app.post('/api/transform/pixel-to-court', (req, res) => {
  try {
    const { cameraId, x, y } = req.body;
    const courtCoords = courtService.pixelToCourtCoordinates(cameraId, x, y);
    
    res.json({
      courtCoordinates: courtCoords,
      cameraId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to transform coordinates' });
  }
});

app.post('/api/transform/court-to-pixel', (req, res) => {
  try {
    const { cameraId, x, y } = req.body;
    const pixelCoords = courtService.courtToPixelCoordinates(cameraId, x, y);
    
    res.json({
      pixelCoordinates: pixelCoords,
      cameraId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to transform coordinates' });
  }
});

// Camera selection
app.post('/api/camera-selection', (req, res) => {
  try {
    const { courtX, courtY } = req.body;
    const optimalCamera = courtService.getOptimalCamera(courtX, courtY);
    
    res.json({
      optimalCamera,
      position: { x: courtX, y: courtY },
      reason: courtY > 10 ? 'Far half - Camera B optimal' : 'Near half - Camera A optimal'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to determine optimal camera' });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-session', (sessionId) => {
    socket.join(sessionId);
    console.log(`Client ${socket.id} joined session ${sessionId}`);
  });

  socket.on('camera-control', (data) => {
    const { command, cameraId, params } = data;
    console.log(`Camera control: ${command} for ${cameraId}`, params);
    
    // Broadcast to all clients in the same session
    socket.broadcast.emit('camera-status-update', {
      cameraId,
      command,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Sync-Camera server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔧 API: http://localhost:${PORT}/api/health`);
});

export default server;