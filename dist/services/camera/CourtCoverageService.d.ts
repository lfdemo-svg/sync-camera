import { CameraView } from './CameraView';
import { CoverageAnalysis } from './CoverageAnalyzer';
import { CameraMountPosition, Point2D } from '../../types/camera';
import { CalibrationSession } from '../../types/calibration';
export declare class CourtCoverageService {
    private calibrationService;
    private coverageAnalyzer;
    private cameras;
    constructor();
    /**
     * Initialize default two-camera setup for Padel court
     */
    private initializeDefaultCameras;
    /**
     * Start calibration for a specific camera
     */
    startCameraCalibration(cameraId: string): CalibrationSession | null;
    /**
     * Add detected calibration point
     */
    addCalibrationPoint(sessionId: string, targetId: string, imagePoint: Point2D, confidence?: number): boolean;
    /**
     * Complete camera calibration
     */
    completeCalibration(sessionId: string): Promise<boolean>;
    /**
     * Get current court coverage analysis
     */
    analyzeCoverage(): CoverageAnalysis | null;
    /**
     * Generate comprehensive coverage report
     */
    generateCoverageReport(): string;
    /**
     * Get recommended camera for specific court position
     */
    getOptimalCamera(courtX: number, courtY: number): 'camera_a' | 'camera_b' | null;
    /**
     * Validate complete court coverage
     */
    validateCoverage(): {
        isComplete: boolean;
        coveragePercent: number;
        blindSpots: number;
        qualityScore: number;
        recommendations: string[];
    };
    /**
     * Transform pixel coordinates to court coordinates
     */
    pixelToCourtCoordinates(cameraId: string, pixelX: number, pixelY: number): Point2D | null;
    /**
     * Transform court coordinates to pixel coordinates
     */
    courtToPixelCoordinates(cameraId: string, courtX: number, courtY: number): Point2D | null;
    /**
     * Get camera information
     */
    getCameraInfo(cameraId: string): CameraView | null;
    /**
     * Get all cameras
     */
    getAllCameras(): CameraView[];
    /**
     * Update camera mount position (requires recalibration)
     */
    updateCameraMountPosition(cameraId: string, mountPosition: CameraMountPosition): boolean;
    /**
     * Generate calibration status for a camera
     */
    private generateCalibrationStatus;
    /**
     * Export configuration for backup/restore
     */
    exportConfiguration(): string;
}
//# sourceMappingURL=CourtCoverageService.d.ts.map