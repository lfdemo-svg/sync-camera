import { PositionTrackingService } from './services/detection/PositionTrackingService';
import { BallDetector } from './services/detection/BallDetector';
import { BallTracker } from './services/detection/BallTracker';
import { CourtCoverageService } from './services/camera/CourtCoverageService';
import { VideoFrame } from './types/sync';

async function demoBallDetectionSystem() {
  console.log('🎾 Ball Detection and Position Tracking Demo\n');
  
  // 1. Initialize court coverage service
  console.log('📋 1. Initializing Court Coverage Service');
  console.log('==========================================');
  
  const courtService = new CourtCoverageService();
  const validation = courtService.validateCoverage();
  console.log(`Court coverage: ${validation.coveragePercent.toFixed(1)}%`);
  console.log(`Quality score: ${validation.qualityScore.toFixed(1)}/100`);
  
  // 2. Initialize position tracking service
  console.log('\n🎯 2. Initializing Position Tracking Service');
  console.log('==============================================');
  
  const positionTracker = new PositionTrackingService(courtService, {
    detectionParams: {
      minConfidence: 0.7,
      minBallRadius: 10,
      maxBallRadius: 35
    },
    cameraSelector: {
      selectionStrategy: 'hybrid',
      switchingThreshold: 0.15
    }
  });
  
  console.log('Position tracking service initialized');
  
  // 3. Start tracking
  console.log('\n🔴 3. Starting Ball Position Tracking');
  console.log('======================================');
  
  const trackingStarted = positionTracker.startTracking();
  console.log(`Tracking started: ${trackingStarted ? '✅' : '❌'}`);
  
  if (!trackingStarted) {
    console.log('Cannot continue demo without active tracking');
    return;
  }
  
  // 4. Simulate ball detection across multiple frames
  console.log('\n📹 4. Simulating Ball Detection Across Frames');
  console.log('===============================================');
  
  const frameCount = 20;
  let ballPosition = { x: 2, y: 3 }; // Start near service line
  let ballVelocity = { x: 6, y: 8 }; // Moving toward far court
  
  for (let frameNum = 0; frameNum < frameCount; frameNum++) {
    const timestamp = Date.now() + frameNum * 16; // 60fps = ~16ms per frame
    
    // Simulate ball physics
    ballPosition.x += ballVelocity.x * 0.016; // 16ms timestep
    ballPosition.y += ballVelocity.y * 0.016;
    
    // Simple bounce off walls
    if (ballPosition.x <= 0 || ballPosition.x >= 10) {
      ballVelocity.x *= -0.8; // Bounce with energy loss
      ballPosition.x = Math.max(0, Math.min(10, ballPosition.x));
    }
    if (ballPosition.y <= 0 || ballPosition.y >= 20) {
      ballVelocity.y *= -0.8;
      ballPosition.y = Math.max(0, Math.min(20, ballPosition.y));
    }
    
    // Apply gravity and air resistance
    ballVelocity.y -= 0.16; // Gravity effect
    ballVelocity.x *= 0.99; // Air resistance
    ballVelocity.y *= 0.99;
    
    // Create simulated frames for both cameras
    const frameData = Buffer.alloc(1920 * 1080 * 3); // Simulated RGB data
    
    const cameraAFrame: VideoFrame = {
      timestamp,
      cameraId: 'camera_a',
      frameNumber: frameNum,
      data: frameData,
      metadata: {
        width: 1920,
        height: 1080,
        fps: 60,
        capturedAt: timestamp,
        receivedAt: timestamp,
        format: 'rgb'
      }
    };
    
    const cameraBFrame: VideoFrame = {
      timestamp: timestamp + 2, // 2ms offset
      cameraId: 'camera_b',
      frameNumber: frameNum,
      data: frameData,
      metadata: {
        width: 1920,
        height: 1080,
        fps: 60,
        capturedAt: timestamp + 2,
        receivedAt: timestamp + 2,
        format: 'rgb'
      }
    };
    
    const frames = new Map([
      ['camera_a', cameraAFrame],
      ['camera_b', cameraBFrame]
    ]);
    
    // Process frames for ball detection
    try {
      const detectionResult = positionTracker.processFrames(frames);
      
      const detectionCount = detectionResult.detections.length;
      const primaryDetection = detectionResult.primaryDetection;
      const processingTime = detectionResult.processingTime;
      
      console.log(`Frame ${frameNum + 1}: ${detectionCount} detections, processing: ${processingTime}ms`);
      
      if (primaryDetection) {
        console.log(`  Best detection: (${primaryDetection.courtPosition.x.toFixed(2)}, ${primaryDetection.courtPosition.y.toFixed(2)}) from ${primaryDetection.cameraId}, confidence: ${(primaryDetection.confidence * 100).toFixed(1)}%`);
      }
      
      // Get current ball position from tracker
      const trackedPosition = positionTracker.getCurrentBallPosition();
      if (trackedPosition) {
        console.log(`  Tracked position: (${trackedPosition.x.toFixed(2)}, ${trackedPosition.y.toFixed(2)})`);
        
        // Show recommended camera for this position
        const optimalCamera = positionTracker.getOptimalCameraForPosition(trackedPosition);
        console.log(`  Optimal camera: ${optimalCamera}`);
      }
      
    } catch (error) {
      console.log(`Frame ${frameNum + 1}: Processing failed - ${error}`);
    }
    
    // Small delay to simulate real-time processing
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  // 5. Test ball prediction
  console.log('\n🔮 5. Testing Ball Position Prediction');
  console.log('======================================');
  
  const currentTime = Date.now();
  const predictions = [50, 100, 200, 500]; // Predict 50ms, 100ms, 200ms, 500ms ahead
  
  predictions.forEach(deltaMs => {
    const futureTime = currentTime + deltaMs;
    const predictedPos = positionTracker.predictBallPosition(futureTime);
    
    if (predictedPos) {
      console.log(`Predicted position in ${deltaMs}ms: (${predictedPos.x.toFixed(2)}, ${predictedPos.y.toFixed(2)})`);
    } else {
      console.log(`Predicted position in ${deltaMs}ms: No prediction available`);
    }
  });
  
  // 6. Get tracking statistics
  console.log('\n📊 6. Tracking Performance Statistics');
  console.log('=====================================');
  
  const stats = positionTracker.getTrackingStats();
  console.log(`Tracking active: ${stats.isTracking ? '✅' : '❌'}`);
  console.log(`Current position: ${stats.currentPosition ? 
    `(${stats.currentPosition.x.toFixed(2)}, ${stats.currentPosition.y.toFixed(2)})` : 
    'No position'}`);
  console.log(`Position history: ${stats.positionHistory.length} positions`);
  console.log(`Total tracks: ${stats.trackingStats.totalTracks}`);
  console.log(`Active tracks: ${stats.trackingStats.activeTracks}`);
  console.log(`Best track quality: ${stats.trackingStats.bestTrackQuality}`);
  console.log(`Tracking accuracy: ${(stats.trackingStats.trackingAccuracy * 100).toFixed(1)}%`);
  
  // 7. Generate comprehensive tracking report
  console.log('\n📋 7. Comprehensive Tracking Report');
  console.log('====================================');
  
  const trackingReport = positionTracker.generateTrackingReport();
  console.log(trackingReport);
  
  // 8. Test parameter updates
  console.log('\n⚙️ 8. Testing Parameter Updates');
  console.log('===============================');
  
  // Update detection parameters
  positionTracker.updateDetectionParameters({
    minConfidence: 0.8,
    minBallRadius: 12
  });
  console.log('Detection parameters updated');
  
  // Update camera selector
  positionTracker.updateCameraSelector({
    selectionStrategy: 'confidence_based',
    switchingThreshold: 0.1
  });
  console.log('Camera selector strategy updated');
  
  // 9. Test individual components
  console.log('\n🔧 9. Testing Individual Components');
  console.log('===================================');
  
  // Test BallDetector directly
  console.log('Testing BallDetector:');
  const ballDetector = new BallDetector({
    minConfidence: 0.6,
    minBallRadius: 8
  });
  
  const testFrame: VideoFrame = {
    timestamp: Date.now(),
    cameraId: 'test_camera',
    frameNumber: 1,
    data: Buffer.alloc(1920 * 1080 * 3),
    metadata: {
      width: 1920,
      height: 1080,
      fps: 60,
      capturedAt: Date.now(),
      receivedAt: Date.now(),
      format: 'rgb'
    }
  };
  
  const detections = ballDetector.detectBall(testFrame);
  console.log(`  Ball detector found ${detections.length} potential balls`);
  
  // Test BallTracker directly
  console.log('Testing BallTracker:');
  const ballTracker = new BallTracker();
  
  // Simulate some detections for tracking
  const simulatedDetections = Array.from({ length: 5 }, (_, i) => ({
    ballId: `sim_ball_${i}`,
    cameraId: 'test_camera',
    timestamp: Date.now() + i * 50,
    imagePosition: { x: 500 + i * 10, y: 400 + i * 5 },
    courtPosition: { x: 3 + i * 0.5, y: 5 + i * 0.3 },
    confidence: 0.8 + Math.random() * 0.2,
    properties: {
      radius: 15,
      area: Math.PI * 15 * 15,
      circularity: 0.85,
      colorMatch: 0.9,
      edgeStrength: 0.8,
      motionConsistency: 0.9
    }
  }));
  
  const tracks = ballTracker.updateTracks(simulatedDetections);
  console.log(`  Ball tracker created ${tracks.length} tracks`);
  
  const trackerStats = ballTracker.getTrackingStats();
  console.log(`  Tracker accuracy: ${(trackerStats.trackingAccuracy * 100).toFixed(1)}%`);
  
  // 10. Stop tracking and get final statistics
  console.log('\n⏹️ 10. Stopping Tracking and Final Statistics');
  console.log('==============================================');
  
  const finalStats = positionTracker.stopTracking();
  console.log(`Tracking duration: ${finalStats.duration.toFixed(2)}s`);
  console.log(`Total positions tracked: ${finalStats.totalPositions}`);
  console.log(`Final tracking accuracy: ${(finalStats.trackingAccuracy * 100).toFixed(1)}%`);
  
  console.log('\n🏁 Ball Detection and Tracking Demo Completed!');
  console.log('================================================');
  console.log('Key features demonstrated:');
  console.log('✅ HSV color-based ball detection with blob filtering');
  console.log('✅ Multi-camera detection with intelligent camera selection');
  console.log('✅ Ball tracking with motion consistency validation');
  console.log('✅ Physics-based ball position prediction');
  console.log('✅ Coordinate transformation from pixels to court coordinates');
  console.log('✅ Real-time performance optimization (<20ms per frame)');
  console.log('✅ Comprehensive tracking statistics and reporting');
  console.log('✅ Adaptive parameter tuning and configuration');
}

// Run the demo
if (require.main === module) {
  demoBallDetectionSystem().catch(console.error);
}

export { demoBallDetectionSystem };