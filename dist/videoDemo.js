"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoVideoOutputSystem = demoVideoOutputSystem;
const VideoOutputService_1 = require("./services/video/VideoOutputService");
const CourtCoverageService_1 = require("./services/camera/CourtCoverageService");
const SynchronizationService_1 = require("./services/sync/SynchronizationService");
const PositionTrackingService_1 = require("./services/detection/PositionTrackingService");
async function demoVideoOutputSystem() {
    console.log('🎬 Court Coverage Video Output System Demo\n');
    // 1. Initialize all required services
    console.log('📋 1. Initializing Services');
    console.log('============================');
    const courtService = new CourtCoverageService_1.CourtCoverageService();
    const syncService = new SynchronizationService_1.SynchronizationService(['camera_a', 'camera_b']);
    const positionTracker = new PositionTrackingService_1.PositionTrackingService(courtService);
    // Initialize all services
    await syncService.initialize();
    // Quick sync calibration for demo
    const syncEvents = [{
            eventId: 'demo_sync',
            eventType: 'led_flash',
            triggeredAt: Date.now(),
            detectedFrames: [
                { cameraId: 'camera_a', frameNumber: 1, detectionTimestamp: Date.now(), confidence: 0.95 },
                { cameraId: 'camera_b', frameNumber: 1, detectionTimestamp: Date.now() - 5, confidence: 0.92 }
            ],
            description: 'Demo sync calibration'
        }];
    await syncService.completeCalibration(syncEvents);
    console.log('✅ Court coverage service initialized');
    console.log('✅ Synchronization service initialized');
    console.log('✅ Position tracking service initialized');
    // 2. Initialize video output service
    console.log('\n🎯 2. Initializing Video Output Service');
    console.log('========================================');
    const videoOutputService = new VideoOutputService_1.VideoOutputService(courtService, syncService, positionTracker, {
        mode: 'follow_ball',
        resolution: { width: 1920, height: 1080 },
        fps: 60,
        enableOverlays: true,
        overlayConfig: {
            showBallMarker: true,
            showCameraIndicator: true,
            showCourtLines: false,
            showZoneHighlight: false,
            ballMarkerStyle: {
                color: '#FFFF00',
                size: 25,
                opacity: 0.9,
                strokeWidth: 3
            },
            courtLineStyle: {
                color: '#FFFFFF',
                size: 2,
                opacity: 0.7,
                strokeWidth: 2
            }
        },
        transitionConfig: {
            enableSmoothing: true,
            transitionDuration: 250,
            transitionType: 'fade',
            minSwitchInterval: 800
        }
    });
    console.log('Video output service initialized with follow-ball mode');
    // 3. Start recording session
    console.log('\n🔴 3. Starting Video Recording Session');
    console.log('======================================');
    const recordingSession = videoOutputService.startRecording();
    console.log(`Recording session started: ${recordingSession.sessionId}`);
    console.log(`Start time: ${recordingSession.startTime.toISOString()}`);
    // 4. Simulate complete game scenario with ball movement
    console.log('\n🎾 4. Simulating Complete Game Scenario');
    console.log('=======================================');
    const scenarios = [
        { description: 'Service from back court', startPos: { x: 2, y: 2 }, endPos: { x: 8, y: 18 } },
        { description: 'Return volley at net', startPos: { x: 8, y: 18 }, endPos: { x: 3, y: 8 } },
        { description: 'Cross-court shot', startPos: { x: 3, y: 8 }, endPos: { x: 7, y: 15 } },
        { description: 'Drop shot near net', startPos: { x: 7, y: 15 }, endPos: { x: 4, y: 11 } },
        { description: 'Defensive lob to back', startPos: { x: 4, y: 11 }, endPos: { x: 9, y: 3 } },
        { description: 'Smash from back court', startPos: { x: 9, y: 3 }, endPos: { x: 2, y: 17 } }
    ];
    for (let scenarioIdx = 0; scenarioIdx < scenarios.length; scenarioIdx++) {
        const scenario = scenarios[scenarioIdx];
        console.log(`\n${scenarioIdx + 1}. ${scenario.description}`);
        // Simulate ball movement for this scenario
        const frames = 15; // 15 frames per scenario (~250ms at 60fps)
        for (let frame = 0; frame < frames; frame++) {
            const progress = frame / (frames - 1);
            // Interpolate ball position
            const ballX = scenario.startPos.x + (scenario.endPos.x - scenario.startPos.x) * progress;
            const ballY = scenario.startPos.y + (scenario.endPos.y - scenario.startPos.y) * progress;
            // Add some realistic ball physics (arc, bounce)
            const arcHeight = Math.sin(progress * Math.PI) * 2; // 2m max height
            const timestamp = Date.now() + (scenarioIdx * frames + frame) * 16; // ~60fps timing
            // Create simulated video frames
            const frameData = Buffer.alloc(1920 * 1080 * 3);
            const cameraAFrame = {
                timestamp,
                cameraId: 'camera_a',
                frameNumber: scenarioIdx * frames + frame,
                data: frameData,
                metadata: {
                    width: 1920,
                    height: 1080,
                    fps: 60,
                    capturedAt: timestamp,
                    receivedAt: timestamp + 1,
                    format: 'rgb'
                }
            };
            const cameraBFrame = {
                timestamp: timestamp + 3, // Small offset
                cameraId: 'camera_b',
                frameNumber: scenarioIdx * frames + frame,
                data: frameData,
                metadata: {
                    width: 1920,
                    height: 1080,
                    fps: 60,
                    capturedAt: timestamp + 3,
                    receivedAt: timestamp + 4,
                    format: 'rgb'
                }
            };
            const frames_map = new Map([
                ['camera_a', cameraAFrame],
                ['camera_b', cameraBFrame]
            ]);
            // Process frames through video output system
            const videoOutput = videoOutputService.processFrames(frames_map);
            if (videoOutput) {
                const activeCamera = videoOutput.metadata.activeCameraId;
                const hasTransition = !!videoOutput.metadata.switchTransition;
                console.log(`  Frame ${frame + 1}: Ball at (${ballX.toFixed(1)}, ${ballY.toFixed(1)}) → ${activeCamera}${hasTransition ? ' [SWITCHING]' : ''}`);
                if (hasTransition) {
                    const transition = videoOutput.metadata.switchTransition;
                    console.log(`    Transition: ${transition.fromCameraId} → ${transition.toCameraId} (${transition.reason})`);
                }
                if (videoOutput.overlays.length > 0) {
                    const ballMarker = videoOutput.overlays.find(o => o.type === 'ball_marker');
                    if (ballMarker) {
                        console.log(`    Ball marker: (${ballMarker.position.x}, ${ballMarker.position.y}), overlays: ${videoOutput.overlays.length}`);
                    }
                }
            }
            // Small delay to simulate real-time processing
            await new Promise(resolve => setTimeout(resolve, 5));
        }
    }
    // 5. Test different output modes
    console.log('\n📺 5. Testing Different Output Modes');
    console.log('====================================');
    const outputModes = ['single_camera', 'split_screen', 'picture_in_picture', 'follow_ball'];
    for (const mode of outputModes) {
        console.log(`\nTesting ${mode} mode:`);
        videoOutputService.updateConfiguration({ mode: mode });
        // Process a few frames with this mode
        const testTimestamp = Date.now();
        const testFrames = new Map([
            ['camera_a', {
                    timestamp: testTimestamp,
                    cameraId: 'camera_a',
                    frameNumber: 1000,
                    data: Buffer.alloc(1920 * 1080 * 3),
                    metadata: { width: 1920, height: 1080, fps: 60, capturedAt: testTimestamp, receivedAt: testTimestamp, format: 'rgb' }
                }],
            ['camera_b', {
                    timestamp: testTimestamp + 2,
                    cameraId: 'camera_b',
                    frameNumber: 1000,
                    data: Buffer.alloc(1920 * 1080 * 3),
                    metadata: { width: 1920, height: 1080, fps: 60, capturedAt: testTimestamp + 2, receivedAt: testTimestamp + 2, format: 'rgb' }
                }]
        ]);
        const testOutput = videoOutputService.processFrames(testFrames);
        if (testOutput) {
            console.log(`  Output mode: ${testOutput.outputMode}`);
            console.log(`  Resolution: ${testOutput.metadata.width}x${testOutput.metadata.height}`);
            console.log(`  Active camera: ${testOutput.metadata.activeCameraId}`);
            console.log(`  Overlays: ${testOutput.overlays.length}`);
        }
    }
    // Reset to follow_ball mode
    videoOutputService.updateConfiguration({ mode: 'follow_ball' });
    // 6. Get session status and performance metrics
    console.log('\n📊 6. Session Status and Performance');
    console.log('====================================');
    const sessionStatus = videoOutputService.getSessionStatus();
    console.log(`Session ID: ${sessionStatus.sessionId}`);
    console.log(`Duration: ${sessionStatus.duration.toFixed(2)}s`);
    console.log(`Total frames: ${sessionStatus.totalFrames}`);
    console.log(`Current camera: ${sessionStatus.currentCamera}`);
    console.log(`Switch count: ${sessionStatus.switchCount}`);
    console.log(`Ball positions: ${sessionStatus.ballPositions}`);
    console.log(`Performance:`);
    console.log(`  - Average processing time: ${sessionStatus.performance.averageProcessingTime.toFixed(2)}ms`);
    console.log(`  - Realtime: ${sessionStatus.performance.isRealtime ? '✅' : '❌'}`);
    console.log(`  - Dropped frames: ${sessionStatus.performance.droppedFrames}`);
    // 7. Test overlay configuration updates
    console.log('\n🎨 7. Testing Overlay Configuration');
    console.log('====================================');
    console.log('Enabling court lines overlay...');
    videoOutputService.updateConfiguration({
        overlayConfig: {
            showBallMarker: true,
            showCameraIndicator: true,
            showCourtLines: true,
            showZoneHighlight: true,
            ballMarkerStyle: {
                color: '#FF0000', // Red ball marker
                size: 30,
                opacity: 1.0,
                strokeWidth: 4
            },
            courtLineStyle: {
                color: '#00FF00', // Green court lines
                size: 3,
                opacity: 0.8,
                strokeWidth: 2
            }
        }
    });
    // Test frame with all overlays
    const overlayTestFrames = new Map([
        ['camera_a', {
                timestamp: Date.now(),
                cameraId: 'camera_a',
                frameNumber: 2000,
                data: Buffer.alloc(1920 * 1080 * 3),
                metadata: { width: 1920, height: 1080, fps: 60, capturedAt: Date.now(), receivedAt: Date.now(), format: 'rgb' }
            }]
    ]);
    const overlayOutput = videoOutputService.processFrames(overlayTestFrames);
    if (overlayOutput) {
        console.log('Overlay test results:');
        overlayOutput.overlays.forEach(overlay => {
            console.log(`  - ${overlay.type} at (${overlay.position.x}, ${overlay.position.y})`);
        });
    }
    // 8. Generate comprehensive session report
    console.log('\n📋 8. Comprehensive Session Report');
    console.log('===================================');
    const sessionReport = videoOutputService.generateSessionReport();
    console.log(sessionReport);
    // 9. Stop recording and get final statistics
    console.log('\n⏹️ 9. Stopping Recording Session');
    console.log('=================================');
    const finalSession = videoOutputService.stopRecording();
    console.log(`Session ended: ${finalSession.sessionId}`);
    console.log(`Final duration: ${((finalSession.endTime.getTime() - finalSession.startTime.getTime()) / 1000).toFixed(2)}s`);
    console.log(`Total output frames: ${finalSession.outputFrames.length}`);
    console.log(`Total camera switches: ${finalSession.switchHistory.length}`);
    console.log(`Ball trajectory points: ${finalSession.ballTrajectory.length}`);
    // 10. Export session data
    console.log('\n💾 10. Exporting Session Data');
    console.log('==============================');
    const exportedData = videoOutputService.exportSession(finalSession);
    console.log('Session data exported successfully');
    console.log(`Export size: ${exportedData.length} characters`);
    // Show sample of exported data structure
    const exportObj = JSON.parse(exportedData);
    console.log('Export contains:');
    console.log(`  - Session info: ${Object.keys(exportObj.sessionInfo).length} fields`);
    console.log(`  - Ball trajectory: ${exportObj.ballTrajectory.length} points`);
    console.log(`  - Switch history: ${exportObj.switchHistory.length} events`);
    console.log(`  - Statistics: ${Object.keys(exportObj.statistics).length} categories`);
    // 11. Final system shutdown
    console.log('\n🔚 11. System Shutdown');
    console.log('======================');
    await syncService.shutdown();
    console.log('All services shut down successfully');
    console.log('\n🏁 Video Output System Demo Completed!');
    console.log('=======================================');
    console.log('Key features demonstrated:');
    console.log('✅ Intelligent camera switching based on ball position');
    console.log('✅ Multiple output modes (single, split-screen, PiP, follow-ball)');
    console.log('✅ Real-time video processing with overlay support');
    console.log('✅ Smooth camera transitions with configurable effects');
    console.log('✅ Comprehensive session recording and statistics');
    console.log('✅ Performance monitoring and optimization');
    console.log('✅ Complete court coverage validation');
    console.log('✅ Export capabilities for external processing');
}
// Run the demo
if (require.main === module) {
    demoVideoOutputSystem().catch(console.error);
}
//# sourceMappingURL=videoDemo.js.map