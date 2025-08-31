"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoCourtCoverageSystem = demoCourtCoverageSystem;
const CourtCoverageService_1 = require("./services/camera/CourtCoverageService");
async function demoCourtCoverageSystem() {
    console.log('🏓 Padel Court Coverage System Demo\n');
    // Initialize the court coverage service
    const courtService = new CourtCoverageService_1.CourtCoverageService();
    // 1. Show initial setup
    console.log('📋 1. Initial Camera Setup');
    console.log('===========================');
    const cameras = courtService.getAllCameras();
    cameras.forEach(camera => {
        console.log(`${camera.name}:`);
        console.log(`  - Position: (${camera.mountPosition.x}, ${camera.mountPosition.y}) at ${camera.mountPosition.height}m height`);
        console.log(`  - Wall: ${camera.mountPosition.wall}`);
        console.log(`  - Status: ${camera.isActive ? 'Active' : 'Inactive'}`);
    });
    // 2. Analyze coverage without calibration
    console.log('\n📊 2. Initial Coverage Analysis');
    console.log('=================================');
    const initialAnalysis = courtService.analyzeCoverage();
    if (initialAnalysis) {
        console.log(`Total Coverage: ${initialAnalysis.totalCoveragePercent.toFixed(1)}%`);
        console.log(`Quality Score: ${initialAnalysis.qualityScore.toFixed(1)}/100`);
        console.log(`Blind Spots: ${initialAnalysis.blindSpots.length}`);
        console.log(`Overlap Zones: ${initialAnalysis.overlapZones.length}`);
    }
    // 3. Test camera selection for different court positions
    console.log('\n🎯 3. Camera Selection for Key Court Positions');
    console.log('===============================================');
    const testPositions = [
        { x: 2.5, y: 3, description: 'Near service line (left)' },
        { x: 7.5, y: 3, description: 'Near service line (right)' },
        { x: 5, y: 10, description: 'Net center' },
        { x: 2.5, y: 17, description: 'Far service line (left)' },
        { x: 7.5, y: 17, description: 'Far service line (right)' },
        { x: 0, y: 0, description: 'Front left corner' },
        { x: 10, y: 20, description: 'Back right corner' }
    ];
    testPositions.forEach(pos => {
        const optimalCamera = courtService.getOptimalCamera(pos.x, pos.y);
        console.log(`${pos.description} (${pos.x}, ${pos.y}): ${optimalCamera}`);
    });
    // 4. Simulate calibration for Camera A
    console.log('\n🔧 4. Camera A Calibration Simulation');
    console.log('=====================================');
    const calibrationSession = courtService.startCameraCalibration('camera_a');
    if (calibrationSession) {
        console.log(`Started calibration session: ${calibrationSession.sessionId}`);
        console.log(`Targets to detect: ${calibrationSession.targets.length}`);
        // Simulate detecting some calibration points
        const simulatedDetections = [
            { targetId: 'front-left-corner', imagePoint: { x: 50, y: 450 } },
            { targetId: 'front-right-corner', imagePoint: { x: 1230, y: 450 } },
            { targetId: 'back-left-corner', imagePoint: { x: 200, y: 50 } },
            { targetId: 'back-right-corner', imagePoint: { x: 1080, y: 50 } }
        ];
        simulatedDetections.forEach(detection => {
            const success = courtService.addCalibrationPoint(calibrationSession.sessionId, detection.targetId, detection.imagePoint, 0.95);
            console.log(`Detected ${detection.targetId}: ${success ? '✅' : '❌'}`);
        });
        // Complete calibration
        const calibrationSuccess = await courtService.completeCalibration(calibrationSession.sessionId);
        console.log(`Calibration completed: ${calibrationSuccess ? '✅' : '❌'}`);
    }
    // 5. Generate comprehensive coverage report
    console.log('\n📈 5. Comprehensive Coverage Report');
    console.log('====================================');
    const report = courtService.generateCoverageReport();
    console.log(report);
    // 6. Validate coverage
    console.log('\n✅ 6. Coverage Validation');
    console.log('==========================');
    const validation = courtService.validateCoverage();
    console.log(`Complete Coverage: ${validation.isComplete ? '✅' : '❌'}`);
    console.log(`Coverage Percentage: ${validation.coveragePercent.toFixed(1)}%`);
    console.log(`Quality Score: ${validation.qualityScore.toFixed(1)}/100`);
    console.log(`Recommendations:`);
    validation.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
    });
    // 7. Test coordinate transformations (if calibrated)
    console.log('\n🗺️  7. Coordinate Transformation Test');
    console.log('=====================================');
    const cameraA = courtService.getCameraInfo('camera_a');
    if (cameraA?.calibration) {
        // Test transforming a known court point to pixel coordinates
        const courtPoint = { x: 5, y: 15 }; // Center of far court
        const pixelPoint = courtService.courtToPixelCoordinates('camera_a', courtPoint.x, courtPoint.y);
        if (pixelPoint) {
            console.log(`Court point (${courtPoint.x}, ${courtPoint.y}) → Pixel (${pixelPoint.x.toFixed(1)}, ${pixelPoint.y.toFixed(1)})`);
            // Transform back to verify
            const backToCourtPoint = courtService.pixelToCourtCoordinates('camera_a', pixelPoint.x, pixelPoint.y);
            if (backToCourtPoint) {
                const error = Math.sqrt(Math.pow(backToCourtPoint.x - courtPoint.x, 2) +
                    Math.pow(backToCourtPoint.y - courtPoint.y, 2));
                console.log(`Round-trip error: ${(error * 100).toFixed(2)} cm`);
            }
        }
    }
    else {
        console.log('Camera A not calibrated - cannot test coordinate transformations');
    }
    // 8. Export configuration
    console.log('\n💾 8. Configuration Export');
    console.log('===========================');
    const config = courtService.exportConfiguration();
    console.log('Configuration exported successfully');
    console.log(`Export size: ${config.length} characters`);
    console.log('\n🏁 Demo completed successfully!');
    console.log('=====================================');
    console.log('The court coverage mapping and calibration system is now ready.');
    console.log('Key features demonstrated:');
    console.log('✅ Camera mount position calculation');
    console.log('✅ Visible/blind zone mapping');
    console.log('✅ Coverage analysis and validation');
    console.log('✅ Calibration system with homography');
    console.log('✅ Coordinate transformations');
    console.log('✅ Camera selection optimization');
    console.log('✅ Comprehensive reporting');
}
// Run the demo
if (require.main === module) {
    demoCourtCoverageSystem().catch(console.error);
}
//# sourceMappingURL=demo.js.map