import { CalibrationSession } from '../../types/calibration';
import { Point2D, CameraCalibration, CameraMountPosition } from '../../types/camera';
export declare class CalibrationService {
    private activeSessions;
    /**
     * Start a new calibration session for a camera
     */
    startCalibrationSession(cameraId: string, mountPosition: CameraMountPosition): CalibrationSession;
    /**
     * Get standard calibration targets for Padel court
     */
    private getCalibrationTargets;
    /**
     * Add a detected point to the calibration session
     */
    addDetectedPoint(sessionId: string, targetId: string, imagePoint: Point2D, confidence?: number): boolean;
    /**
     * Complete calibration and calculate homography matrix
     */
    completeCalibration(sessionId: string): Promise<CameraCalibration | null>;
    /**
     * Prepare detected points for homography calculation
     */
    private preparePointsForHomography;
    /**
     * Calculate homography matrix using DLT (Direct Linear Transform)
     * This is a simplified implementation - in production, use OpenCV's findHomography
     */
    private calculateHomography;
    /**
     * Simplified DLT solver - in production, use proper numerical methods
     */
    private solveDLT;
    /**
     * Calculate calibration accuracy using RMS error
     */
    private calculateCalibrationAccuracy;
    /**
     * Save calibration to persistent storage
     */
    private saveCalibration;
    /**
     * Load saved calibration for a camera
     */
    loadCalibration(cameraId: string): Promise<CameraCalibration | null>;
    /**
     * Validate calibration accuracy
     */
    validateCalibration(calibration: CameraCalibration, toleranceCm?: number): boolean;
    /**
     * Generate unique session ID
     */
    private generateSessionId;
    /**
     * Get active calibration session
     */
    getSession(sessionId: string): CalibrationSession | null;
    /**
     * Cancel calibration session
     */
    cancelSession(sessionId: string): boolean;
}
//# sourceMappingURL=CalibrationService.d.ts.map