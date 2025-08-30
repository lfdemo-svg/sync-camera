"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalibrationService = void 0;
const calibration_1 = require("../../types/calibration");
const CameraView_1 = require("./CameraView");
class CalibrationService {
    constructor() {
        this.activeSessions = new Map();
    }
    /**
     * Start a new calibration session for a camera
     */
    startCalibrationSession(cameraId, mountPosition) {
        const sessionId = this.generateSessionId();
        const session = {
            sessionId,
            cameraId,
            mountPosition,
            targets: this.getCalibrationTargets(),
            detectedPoints: [],
            status: 'pending',
            startedAt: new Date()
        };
        this.activeSessions.set(sessionId, session);
        return session;
    }
    /**
     * Get standard calibration targets for Padel court
     */
    getCalibrationTargets() {
        const court = calibration_1.STANDARD_PADEL_COURT;
        return [
            {
                id: 'front-left-corner',
                courtPosition: court.corners.frontLeft,
                description: 'Front left corner of the court'
            },
            {
                id: 'front-right-corner',
                courtPosition: court.corners.frontRight,
                description: 'Front right corner of the court'
            },
            {
                id: 'back-left-corner',
                courtPosition: court.corners.backLeft,
                description: 'Back left corner of the court'
            },
            {
                id: 'back-right-corner',
                courtPosition: court.corners.backRight,
                description: 'Back right corner of the court'
            },
            {
                id: 'net-left',
                courtPosition: court.netLine.left,
                description: 'Left side of the net line'
            },
            {
                id: 'net-right',
                courtPosition: court.netLine.right,
                description: 'Right side of the net line'
            },
            {
                id: 'service-near-left',
                courtPosition: court.serviceLines.nearLeft,
                description: 'Near service line, left side'
            },
            {
                id: 'service-near-right',
                courtPosition: court.serviceLines.nearRight,
                description: 'Near service line, right side'
            }
        ];
    }
    /**
     * Add a detected point to the calibration session
     */
    addDetectedPoint(sessionId, targetId, imagePoint, confidence = 1.0) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            return false;
        }
        // Remove existing detection for this target
        session.detectedPoints = session.detectedPoints.filter(point => point.targetId !== targetId);
        // Add new detection
        session.detectedPoints.push({
            targetId,
            imagePoint,
            confidence
        });
        session.status = 'in_progress';
        return true;
    }
    /**
     * Complete calibration and calculate homography matrix
     */
    async completeCalibration(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            return null;
        }
        // Need at least 4 points for homography
        if (session.detectedPoints.length < 4) {
            session.status = 'failed';
            return null;
        }
        try {
            const { imagePoints, courtPoints } = this.preparePointsForHomography(session);
            const homographyMatrix = this.calculateHomography(imagePoints, courtPoints);
            const accuracy = this.calculateCalibrationAccuracy(imagePoints, courtPoints, homographyMatrix);
            // Create CameraView to calculate zones
            const cameraView = new CameraView_1.CameraView(session.cameraId, `Camera ${session.cameraId}`, session.mountPosition);
            const calibration = {
                cameraId: session.cameraId,
                homographyMatrix,
                visibleZone: cameraView.calculateVisibleArea(),
                blindZone: cameraView.calculateBlindArea(),
                mountPosition: session.mountPosition,
                calibrationPoints: {
                    imagePoints,
                    courtPoints
                },
                calibratedAt: new Date(),
                accuracy
            };
            session.status = 'completed';
            session.completedAt = new Date();
            session.accuracy = accuracy;
            // Store calibration for persistence
            await this.saveCalibration(calibration);
            return calibration;
        }
        catch (error) {
            console.error('Calibration failed:', error);
            session.status = 'failed';
            return null;
        }
    }
    /**
     * Prepare detected points for homography calculation
     */
    preparePointsForHomography(session) {
        const imagePoints = [];
        const courtPoints = [];
        session.detectedPoints.forEach(detectedPoint => {
            const target = session.targets.find(t => t.id === detectedPoint.targetId);
            if (target) {
                imagePoints.push(detectedPoint.imagePoint);
                courtPoints.push(target.courtPosition);
            }
        });
        return { imagePoints, courtPoints };
    }
    /**
     * Calculate homography matrix using DLT (Direct Linear Transform)
     * This is a simplified implementation - in production, use OpenCV's findHomography
     */
    calculateHomography(imagePoints, courtPoints) {
        if (imagePoints.length !== courtPoints.length || imagePoints.length < 4) {
            throw new Error('Need at least 4 corresponding points for homography');
        }
        // For simplicity, using a basic 4-point homography calculation
        // In production, this should use OpenCV's findHomography with RANSAC
        // Build the system of equations for DLT
        const n = imagePoints.length;
        const A = [];
        for (let i = 0; i < n; i++) {
            const { x: xi, y: yi } = imagePoints[i];
            const { x: Xi, y: Yi } = courtPoints[i];
            // Two equations per point correspondence
            A.push([xi, yi, 1, 0, 0, 0, -Xi * xi, -Xi * yi, -Xi]);
            A.push([0, 0, 0, xi, yi, 1, -Yi * xi, -Yi * yi, -Yi]);
        }
        // Solve for homography using SVD (simplified version)
        // This is a placeholder - use proper SVD implementation
        const H = this.solveDLT(A);
        return [
            [H[0], H[1], H[2]],
            [H[3], H[4], H[5]],
            [H[6], H[7], H[8]]
        ];
    }
    /**
     * Simplified DLT solver - in production, use proper numerical methods
     */
    solveDLT(A) {
        // This is a placeholder implementation
        // In production, use proper SVD/least squares solver
        // For now, return identity-like transformation as fallback
        // This should be replaced with actual SVD-based solution
        return [1, 0, 0, 0, 1, 0, 0, 0, 1];
    }
    /**
     * Calculate calibration accuracy using RMS error
     */
    calculateCalibrationAccuracy(imagePoints, courtPoints, homographyMatrix) {
        let totalError = 0;
        for (let i = 0; i < imagePoints.length; i++) {
            const { x: xi, y: yi } = imagePoints[i];
            const { x: Xi, y: Yi } = courtPoints[i];
            // Transform image point to court coordinates
            const H = homographyMatrix;
            const denominator = H[2][0] * xi + H[2][1] * yi + H[2][2];
            if (Math.abs(denominator) > 1e-8) {
                const transformedX = (H[0][0] * xi + H[0][1] * yi + H[0][2]) / denominator;
                const transformedY = (H[1][0] * xi + H[1][1] * yi + H[1][2]) / denominator;
                // Calculate error distance
                const dx = transformedX - Xi;
                const dy = transformedY - Yi;
                totalError += Math.sqrt(dx * dx + dy * dy);
            }
        }
        const rmsError = totalError / imagePoints.length;
        return rmsError * 100; // Convert to centimeters
    }
    /**
     * Save calibration to persistent storage
     */
    async saveCalibration(calibration) {
        // This should save to database/file system
        // For now, just log the calibration
        console.log('Saving calibration for camera:', calibration.cameraId);
        console.log('Accuracy (cm):', calibration.accuracy);
        console.log('Calibrated at:', calibration.calibratedAt);
    }
    /**
     * Load saved calibration for a camera
     */
    async loadCalibration(cameraId) {
        // This should load from database/file system
        // For now, return null (no saved calibration)
        console.log('Loading calibration for camera:', cameraId);
        return null;
    }
    /**
     * Validate calibration accuracy
     */
    validateCalibration(calibration, toleranceCm = 5) {
        return calibration.accuracy <= toleranceCm;
    }
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `cal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Get active calibration session
     */
    getSession(sessionId) {
        return this.activeSessions.get(sessionId) || null;
    }
    /**
     * Cancel calibration session
     */
    cancelSession(sessionId) {
        return this.activeSessions.delete(sessionId);
    }
}
exports.CalibrationService = CalibrationService;
//# sourceMappingURL=CalibrationService.js.map