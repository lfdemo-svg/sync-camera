Here’s a concise onboarding guide to the sync-camera repo: what’s here, how it fits together, and how to get productive quickly.

**Overview**

*   Backend: TypeScript Node server with services for camera coverage, synchronization, detection, and video output.
    
*   Dashboard: Static web UI served by Express for monitoring and simple actions.
    
*   Mobile App: Expo/React Native client to capture and stream from phones.
    
*   Demos: Scripted end-to-end flows to exercise each major subsystem.
    

**Repo Layout**

*   Backend app
    
    *   src/server.ts:1: Express + Socket.IO API and static dashboard
        
    *   src/services/camera/\*: Mounts, calibration, visibility, coverage analysis
        
    *   src/services/sync/\*: Timestamp sync, frame buffering, calibration, metrics
        
    *   src/services/detection/\*: Ball detection (simulated), tracking, position pipeline
        
    *   src/services/video/\*: Camera selection, transitions, overlays, output framing
        
    *   src/types/\*: Shared types for each domain
        
    *   Demos: src/demo.ts:1, src/syncDemo.ts:1, src/detectionDemo.ts:1, src/videoDemo.ts:1, src/completeDemo.ts:1
        
*   Dashboard
    
    *   public/index.html:1, public/app.js:1, public/styles.css:1, public/camera.html:1
        
*   Mobile app (Expo)
    
    *   mobile-app/App.tsx:1, mobile-app/src/screens/CameraScreen.tsx:1
        
    *   Services: mobile-app/src/services/SocketService.ts:1, mobile-app/src/services/CameraService.ts:1
        
    *   UI: mobile-app/src/components/\*
        
*   Docs
    
    *   README.md:1, EXPO\_SETUP\_GUIDE.md:1, MOBILE\_DEPLOYMENT\_GUIDE.md:1, documentation/\*.md
        
*   Config
    
    *   package.json:1 (scripts), tsconfig.json:1
        

**How It Works**

*   Camera coverage
    
    *   Mount positions + court geometry → visible/blind zones and optimal camera per court point.
        
    *   Key files: src/services/camera/CameraView.ts:1, src/services/camera/CoverageAnalyzer.ts:1, src/services/camera/CourtCoverageService.ts:1
        
*   Calibration
    
    *   Starts a session, collects image↔court correspondences, computes homography (placeholder).
        
    *   Key file: src/services/camera/CalibrationService.ts:1 (note solveDLT is a stub returning identity)
        
*   Synchronization
    
    *   Timestamp manager simulates NTP; FrameSynchronizer buffers frames per camera and aligns timestamps; calibration computes offsets.
        
    *   Key files: src/services/sync/TimestampManager.ts:1, src/services/sync/FrameSynchronizer.ts:1, src/services/sync/SynchronizationService.ts:1
        
*   Detection + tracking
    
    *   Detection pipeline is simulated; produces candidates and confidence; BallTracker maintains tracks and physics-based predictions.
        
    *   Key files: src/services/detection/BallDetector.ts:1, src/services/detection/BallTracker.ts:1, src/services/detection/PositionTrackingService.ts:1
        
*   Video output
    
    *   Chooses active camera, applies transitions, and overlays; multiple output modes supported.
        
    *   Key files: src/services/video/CourtViewManager.ts:1, src/services/video/VideoProcessor.ts:1, src/services/video/VideoOutputService.ts:1
        

**Run & Develop**

*   Prereqs: Node 18+, TypeScript 5. For mobile: Expo CLI + device/emulator. OpenCV is declared but not used in code paths yet.
    
*   Install/build
    
    *   Backend: npm install && npm run build
        
    *   Mobile: npm run mobile:install
        
*   Start
    
    *   Backend (dev): npm run dev (serves dashboard at [http://localhost:3000](http://localhost:3000/))
        
    *   Mobile (Expo): npm run mobile:start (scan QR with Expo Go)
        
*   Scripts
    
    *   Demos: npm run demo, npm run demo:sync, npm run demo:detection, npm run demo:video, npm run demo:complete
        
    *   Quality: npm run lint, npm run typecheck, npm test (no tests provided)
        
*   Dashboard quick actions call backend REST and mock WebSocket flows; metrics are simulated.
    

**API Surface**

*   Health: GET /api/health
    
*   Cameras + coverage: GET /api/cameras, GET /api/coverage/analysis
    
*   Calibration (per camera): POST /api/cameras/:cameraId/calibration/start, POST /api/cameras/:cameraId/calibration/:sessionId/points, POST /api/cameras/:cameraId/calibration/:sessionId/complete
    
*   Transforms: POST /api/transform/pixel-to-court, POST /api/transform/court-to-pixel
    
*   Camera selection: POST /api/camera-selection
    
*   Sessions: GET /api/sessions, POST /api/sessions
    
*   Socket events: server handles join-session and relays camera-control; video chunk handling is not implemented.
    

**Mobile App**

*   Screen: mobile-app/src/screens/CameraScreen.tsx:1 (permissioning, preview, controls, metrics)
    
*   Streaming: CameraService records via Expo Camera and emits “frames” by snapshotting stills at 10 FPS; SocketService sends video-chunk events (server does not consume yet).
    

**Demos (recommended start)**

*   Coverage: npm run demo → initializes cameras, simulates calibration, prints coverage and transforms.
    
*   Sync: npm run demo:sync → initializes timestamp sync, simulates events, computes offsets, records mock frames.
    
*   Detection: npm run demo:detection → simulates movement, detection, tracking, and reporting.
    
*   Video: npm run demo:video → integrates sync + tracking + switching + overlays across modes.
    

**Conventions**

*   Type-first design with src/types/\*.
    
*   Keep logic in services; server.ts wires routes and the dashboard.
    
*   Use scripts for local runs; avoid mixing side effects in services.
    
*   Lint/typecheck before pushing.
    

**Gaps and Next Steps**

*   Homography solver: replace solveDLT in src/services/camera/CalibrationService.ts:159 with OpenCV findHomography (RANSAC).
    
*   Socket streaming: add server handlers for camera-register, video-chunk, camera-metrics to ingest mobile frames and metrics.
    
*   Real detection: wire OpenCV-based pipeline in BallDetector and convert image→court using calibration.
    
*   Persistence: store calibrations and session data (SQLite is declared in dependencies).
    

Want me to:

*   Sketch the Socket.IO handlers and storage layer?
    
*   Replace the homography stub with an OpenCV-backed implementation?
    
*   Add a short sequence diagram for the end-to-end flow?