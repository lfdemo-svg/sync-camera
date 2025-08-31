import { SynchronizationService } from './services/sync/SynchronizationService';
import { SyncCalibrator } from './services/sync/SyncCalibrator';

async function demoSynchronizationSystem() {
  console.log('🎬 Frame Synchronization System Demo\n');
  
  // 1. Initialize synchronization service
  console.log('📋 1. Initializing Synchronization Service');
  console.log('==========================================');
  
  const cameraIds = ['camera_a', 'camera_b'];
  const syncService = new SynchronizationService(cameraIds, {
    maxBufferSize: 300,
    targetLatency: 50,
    maxJitter: 16
  });
  
  const initSuccess = await syncService.initialize();
  console.log(`Initialization: ${initSuccess ? '✅ Success' : '❌ Failed'}`);
  
  if (!initSuccess) {
    console.log('❌ Cannot continue without proper initialization');
    return;
  }
  
  // 2. Show available calibration methods
  console.log('\n🔧 2. Available Calibration Methods');
  console.log('===================================');
  
  const methods = syncService.getCalibrationMethods();
  methods.forEach(method => {
    console.log(`${method.name}:`);
    console.log(`  - Accuracy: ±${method.accuracy}ms`);
    console.log(`  - Description: ${method.description}`);
  });
  
  // 3. Get recommended method
  console.log('\n💡 3. Recommended Calibration Method');
  console.log('====================================');
  
  const recommended = syncService.getRecommendedCalibrationMethod(false, true, 5);
  console.log(`Recommended: ${recommended.name}`);
  console.log(`Expected accuracy: ±${recommended.accuracy}ms`);
  
  // 4. Start calibration process
  console.log('\n🎯 4. Starting Calibration Process');
  console.log('==================================');
  
  const calibration = await syncService.startCalibration(recommended.id);
  console.log(`Calibration session: ${calibration.sessionId}`);
  console.log('Instructions:');
  calibration.instructions.forEach((instruction, index) => {
    console.log(`  ${instruction}`);
  });
  
  // 5. Simulate sync event detection
  console.log('\n⚡ 5. Simulating Sync Event Detection');
  console.log('=====================================');
  
  // Simulate detected sync events
  const simulatedSyncEvents = [
    {
      ...calibration.syncEvent,
      detectedFrames: [
        {
          cameraId: 'camera_a',
          frameNumber: 150,
          detectionTimestamp: Date.now(),
          confidence: 0.95
        },
        {
          cameraId: 'camera_b', 
          frameNumber: 148,
          detectionTimestamp: Date.now() - 8, // 8ms offset
          confidence: 0.92
        }
      ]
    }
  ];
  
  simulatedSyncEvents.forEach(event => {
    console.log(`Sync event detected: ${event.eventType}`);
    event.detectedFrames.forEach(detection => {
      console.log(`  - ${detection.cameraId}: frame ${detection.frameNumber}, confidence ${detection.confidence}`);
    });
  });
  
  // 6. Complete calibration
  console.log('\n✅ 6. Completing Calibration');
  console.log('=============================');
  
  const calibrationResult = await syncService.completeCalibration(simulatedSyncEvents);
  console.log(`Calibration success: ${calibrationResult.success ? '✅' : '❌'}`);
  console.log('\nCalibration Report:');
  console.log(calibrationResult.report);
  
  // 7. Start recording session
  console.log('\n🔴 7. Starting Recording Session');
  console.log('=================================');
  
  const session = syncService.startRecordingSession();
  console.log(`Session started: ${session.sessionId}`);
  console.log(`Start time: ${session.startTime.toISOString()}`);
  
  // 8. Simulate adding frames
  console.log('\n📹 8. Simulating Frame Processing');
  console.log('==================================');
  
  const frameCount = 10;
  let frameNumber = 0;
  
  for (let i = 0; i < frameCount; i++) {
    // Simulate frames from both cameras
    const timestamp = Date.now();
    
    // Camera A frame
    const frameDataA = Buffer.alloc(1920 * 1080 * 3); // Simulated RGB data
    const addedA = syncService.addFrame('camera_a', frameDataA, {
      frameNumber: frameNumber++,
      width: 1920,
      height: 1080,
      fps: 60,
      capturedAt: timestamp,
      format: 'rgb'
    });
    
    // Camera B frame (slightly offset)
    const frameDataB = Buffer.alloc(1920 * 1080 * 3);
    const addedB = syncService.addFrame('camera_b', frameDataB, {
      frameNumber: frameNumber++,
      width: 1920,
      height: 1080,
      fps: 60,
      capturedAt: timestamp + 3, // 3ms offset
      format: 'rgb'
    });
    
    console.log(`Frame ${Math.floor(i/2) + 1}: A=${addedA ? '✅' : '❌'} B=${addedB ? '✅' : '❌'}`);
    
    // Small delay to simulate real frame rate
    await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
  }
  
  // 9. Get synchronized frame pairs
  console.log('\n🔗 9. Testing Frame Synchronization');
  console.log('====================================');
  
  const syncFramePair = syncService.getBestSyncFramePair();
  if (syncFramePair) {
    console.log(`Found synchronized frames at timestamp: ${syncFramePair.timestamp}`);
    console.log(`Cameras in sync: ${Array.from(syncFramePair.frames.keys()).join(', ')}`);
    
    syncFramePair.frames.forEach((frame, cameraId) => {
      console.log(`  - ${cameraId}: frame ${frame.frameNumber}, timestamp ${frame.timestamp}`);
    });
  } else {
    console.log('❌ No synchronized frame pair available');
  }
  
  // 10. Check synchronization status
  console.log('\n📊 10. Synchronization Status Check');
  console.log('====================================');
  
  const status = syncService.getSyncStatus();
  console.log(`Initialized: ${status.isInitialized ? '✅' : '❌'}`);
  console.log(`Calibrated: ${status.isCalibrated ? '✅' : '❌'}`);
  console.log(`Recording: ${status.isRecording ? '🔴' : '⭕'}`);
  console.log(`Timestamp Accuracy: ${status.timestampAccuracy.isAccurate ? '✅' : '❌'}`);
  console.log(`Max Drift: ${status.timestampAccuracy.maxDrift.toFixed(2)}ms`);
  
  if (status.recommendations.length > 0) {
    console.log('\nRecommendations:');
    status.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });
  }
  
  // 11. Generate comprehensive sync report
  console.log('\n📋 11. Comprehensive Synchronization Report');
  console.log('============================================');
  
  const syncReport = syncService.generateSyncReport();
  console.log(syncReport);
  
  // 12. Stop recording session
  console.log('\n⏹️  12. Stopping Recording Session');
  console.log('==================================');
  
  const finalSession = syncService.stopRecordingSession();
  if (finalSession) {
    console.log(`Session stopped: ${finalSession.sessionId}`);
    console.log(`Duration: ${((finalSession.endTime!.getTime() - finalSession.startTime.getTime()) / 1000).toFixed(1)}s`);
    console.log(`Final sync accuracy: ${finalSession.metrics.syncAccuracy.toFixed(2)}ms`);
  }
  
  // 13. Test force resync capability
  console.log('\n🔄 13. Testing Force Resynchronization');
  console.log('======================================');
  
  const resyncSuccess = await syncService.forceResync();
  console.log(`Force resync: ${resyncSuccess ? '✅ Success' : '❌ Failed'}`);
  
  // 14. Shutdown service
  console.log('\n🔚 14. Shutting Down Service');
  console.log('=============================');
  
  await syncService.shutdown();
  console.log('Service shutdown complete');
  
  // 15. Demo additional calibration utilities
  console.log('\n🛠️  15. Additional Calibration Utilities');
  console.log('========================================');
  
  // Generate QR code data for timestamp sync
  const qrData = SyncCalibrator.generateQRCodeData();
  console.log('QR Code sync data:');
  console.log(qrData);
  
  // Test sync event validation
  const testEvent = SyncCalibrator.createLEDFlashEvent('Test LED flash');
  testEvent.detectedFrames = [
    { cameraId: 'camera_a', frameNumber: 100, detectionTimestamp: Date.now(), confidence: 0.95 },
    { cameraId: 'camera_b', frameNumber: 101, detectionTimestamp: Date.now() + 5, confidence: 0.88 }
  ];
  
  const validation = SyncCalibrator.validateSyncEvent(testEvent);
  console.log('\nSync event validation:');
  console.log(`  Quality: ${validation.quality}`);
  console.log(`  Valid: ${validation.isValid ? '✅' : '❌'}`);
  if (validation.issues.length > 0) {
    console.log('  Issues:', validation.issues.join(', '));
  }
  if (validation.recommendations.length > 0) {
    console.log('  Recommendations:', validation.recommendations.join(', '));
  }
  
  console.log('\n🏁 Frame Synchronization Demo Completed!');
  console.log('==========================================');
  console.log('Key features demonstrated:');
  console.log('✅ Multi-camera frame buffering and synchronization');
  console.log('✅ Timestamp management with NTP sync');
  console.log('✅ Calibration system with multiple sync methods');
  console.log('✅ Drift detection and resynchronization');
  console.log('✅ Real-time sync monitoring and health checks');
  console.log('✅ Comprehensive reporting and diagnostics');
  console.log('✅ Robust error handling and recovery');
}

// Run the demo
if (require.main === module) {
  demoSynchronizationSystem().catch(console.error);
}

export { demoSynchronizationSystem };