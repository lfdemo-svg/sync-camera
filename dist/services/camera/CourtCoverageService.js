"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourtCoverageService = void 0;
const CameraView_1 = require("./CameraView");
const CalibrationService_1 = require("./CalibrationService");
const CoverageAnalyzer_1 = require("./CoverageAnalyzer");
class CourtCoverageService {
    constructor() {
        this.cameras = new Map();
        this.calibrationService = new CalibrationService_1.CalibrationService();
        this.coverageAnalyzer = new CoverageAnalyzer_1.CoverageAnalyzer();
        // Initialize default camera setup for Padel court
        this.initializeDefaultCameras();
    }
    /**
     * Initialize default two-camera setup for Padel court
     */
    initializeDefaultCameras() {
        // Camera A: Mounted on back wall A (y=0)
        const cameraA = new CameraView_1.CameraView('camera_a', 'Camera A (Back Wall)', {
            x: 5.0, // Center of court (16'6" from sides = 5m)
            y: 0.0, // Back wall
            height: 1.35, // 4'5" from floor = 1.35m
            wall: 'back_a'
        });
        // Camera B: Mounted on back wall B (y=20)
        const cameraB = new CameraView_1.CameraView('camera_b', 'Camera B (Back Wall)', {
            x: 5.0, // Center of court
            y: 20.0, // Opposite back wall
            height: 1.35, // Same height as Camera A
            wall: 'back_b'
        });
        this.cameras.set('camera_a', cameraA);
        this.cameras.set('camera_b', cameraB);
        console.log('Initialized default two-camera setup:');
        console.log('- Camera A: Back wall (y=0), height=1.35m');
        console.log('- Camera B: Back wall (y=20), height=1.35m');
    }
    /**
     * Start calibration for a specific camera
     */
    startCameraCalibration(cameraId) {
        const camera = this.cameras.get(cameraId);
        if (!camera) {
            console.error(`Camera ${cameraId} not found`);
            return null;
        }
        return this.calibrationService.startCalibrationSession(cameraId, camera.mountPosition);
    }
    /**
     * Add detected calibration point
     */
    addCalibrationPoint(sessionId, targetId, imagePoint, confidence = 1.0) {
        return this.calibrationService.addDetectedPoint(sessionId, targetId, imagePoint, confidence);
    }
    /**
     * Complete camera calibration
     */
    async completeCalibration(sessionId) {
        const calibration = await this.calibrationService.completeCalibration(sessionId);
        if (!calibration) {
            return false;
        }
        // Apply calibration to camera
        const camera = this.cameras.get(calibration.cameraId);
        if (camera) {
            camera.calibration = calibration;
            console.log(`Calibration completed for ${calibration.cameraId}:`);
            console.log(`- Accuracy: ${calibration.accuracy.toFixed(2)} cm`);
            console.log(`- Calibrated at: ${calibration.calibratedAt}`);
            return true;
        }
        return false;
    }
    /**
     * Get current court coverage analysis
     */
    analyzeCoverage() {
        const cameraA = this.cameras.get('camera_a');
        const cameraB = this.cameras.get('camera_b');
        if (!cameraA || !cameraB) {
            console.error('Both cameras must be set up for coverage analysis');
            return null;
        }
        return this.coverageAnalyzer.analyzeCoverage(cameraA, cameraB);
    }
    /**
     * Generate comprehensive coverage report
     */
    generateCoverageReport() {
        const cameraA = this.cameras.get('camera_a');
        const cameraB = this.cameras.get('camera_b');
        if (!cameraA || !cameraB) {
            return 'Error: Both cameras must be configured';
        }
        let report = this.coverageAnalyzer.generateCoverageReport(cameraA, cameraB);
        // Add calibration status
        report += `\n## Calibration Status\n`;
        report += this.generateCalibrationStatus(cameraA);
        report += this.generateCalibrationStatus(cameraB);
        return report;
    }
    /**
     * Get recommended camera for specific court position
     */
    getOptimalCamera(courtX, courtY) {
        const analysis = this.analyzeCoverage();
        if (!analysis) {
            return null;
        }
        const recommendation = analysis.recommendedCameraForPoint(courtX, courtY);
        return recommendation === 'either' ? 'camera_a' : recommendation;
    }
    /**
     * Validate complete court coverage
     */
    validateCoverage() {
        const analysis = this.analyzeCoverage();
        if (!analysis) {
            return {
                isComplete: false,
                coveragePercent: 0,
                blindSpots: 0,
                qualityScore: 0,
                recommendations: ['Complete camera setup and calibration first']
            };
        }
        const recommendations = [];
        if (analysis.totalCoveragePercent < 95) {
            recommendations.push('Coverage below 95% - check camera positioning');
        }
        if (analysis.blindSpots.length > 0) {
            recommendations.push(`${analysis.blindSpots.length} blind spots detected - adjust camera angles`);
        }
        if (analysis.qualityScore < 80) {
            recommendations.push('Quality score below 80 - recalibrate cameras for better accuracy');
        }
        const cameraA = this.cameras.get('camera_a');
        const cameraB = this.cameras.get('camera_b');
        if (cameraA && !cameraA.calibration) {
            recommendations.push('Camera A requires calibration');
        }
        if (cameraB && !cameraB.calibration) {
            recommendations.push('Camera B requires calibration');
        }
        if (recommendations.length === 0) {
            recommendations.push('✅ Court coverage setup is optimal');
        }
        return {
            isComplete: analysis.totalCoveragePercent >= 99 && analysis.blindSpots.length === 0,
            coveragePercent: analysis.totalCoveragePercent,
            blindSpots: analysis.blindSpots.length,
            qualityScore: analysis.qualityScore,
            recommendations
        };
    }
    /**
     * Transform pixel coordinates to court coordinates
     */
    pixelToCourtCoordinates(cameraId, pixelX, pixelY) {
        const camera = this.cameras.get(cameraId);
        if (!camera) {
            return null;
        }
        return camera.pixelToCourtCoordinates(pixelX, pixelY);
    }
    /**
     * Transform court coordinates to pixel coordinates
     */
    courtToPixelCoordinates(cameraId, courtX, courtY) {
        const camera = this.cameras.get(cameraId);
        if (!camera) {
            return null;
        }
        return camera.courtToPixelCoordinates(courtX, courtY);
    }
    /**
     * Get camera information
     */
    getCameraInfo(cameraId) {
        return this.cameras.get(cameraId) || null;
    }
    /**
     * Get all cameras
     */
    getAllCameras() {
        return Array.from(this.cameras.values());
    }
    /**
     * Update camera mount position (requires recalibration)
     */
    updateCameraMountPosition(cameraId, mountPosition) {
        const camera = this.cameras.get(cameraId);
        if (!camera) {
            return false;
        }
        camera.mountPosition = mountPosition;
        // Clear calibration since position changed
        camera.calibration = undefined;
        console.log(`Updated mount position for ${cameraId} - recalibration required`);
        return true;
    }
    /**
     * Generate calibration status for a camera
     */
    generateCalibrationStatus(camera) {
        let status = `**${camera.name}:**\n`;
        if (camera.calibration) {
            const isAccurate = camera.calibration.accuracy <= 5;
            status += `- ✅ Calibrated (${camera.calibration.calibratedAt.toISOString().split('T')[0]})\n`;
            status += `- Accuracy: ${camera.calibration.accuracy.toFixed(2)} cm ${isAccurate ? '✅' : '⚠️'}\n`;
        }
        else {
            status += `- ❌ Not calibrated\n`;
        }
        const visibleArea = camera.calculateVisibleArea();
        const areaSize = Math.abs((visibleArea.topRight.x - visibleArea.topLeft.x) *
            (visibleArea.bottomLeft.y - visibleArea.topLeft.y));
        status += `- Visible area: ${areaSize.toFixed(1)} m²\n`;
        return status + `\n`;
    }
    /**
     * Export configuration for backup/restore
     */
    exportConfiguration() {
        const config = {
            cameras: Array.from(this.cameras.values()).map(camera => ({
                id: camera.id,
                name: camera.name,
                mountPosition: camera.mountPosition,
                calibration: camera.calibration,
                isActive: camera.isActive
            })),
            exportedAt: new Date().toISOString()
        };
        return JSON.stringify(config, null, 2);
    }
}
exports.CourtCoverageService = CourtCoverageService;
//# sourceMappingURL=CourtCoverageService.js.map