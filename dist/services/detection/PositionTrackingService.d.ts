import { CourtCoverageService } from '../camera/CourtCoverageService';
import { DetectionParameters, CameraSelector, DetectionResult } from '../../types/detection';
import { Point2D } from '../../types/camera';
import { VideoFrame } from '../../types/sync';
export interface PositionTrackingConfig {
    detectionParams?: Partial<DetectionParameters>;
    cameraSelector?: Partial<CameraSelector>;
    enableInterpolation?: boolean;
    trackingTimeout?: number;
}
export declare class PositionTrackingService {
    private ballDetector;
    private ballTracker;
    private courtCoverageService;
    private cameraSelector;
    private isTracking;
    private lastBallPosition?;
    private positionHistory;
    private static readonly DEFAULT_CAMERA_SELECTOR;
    constructor(courtCoverageService: CourtCoverageService, config?: PositionTrackingConfig);
    /**
     * Start position tracking
     */
    startTracking(): boolean;
    /**
     * Stop position tracking
     */
    stopTracking(): {
        duration: number;
        totalPositions: number;
        trackingAccuracy: number;
        finalStats: any;
    };
    /**
     * Process synchronized frames to track ball position
     */
    processFrames(frames: Map<string, VideoFrame>): DetectionResult;
    /**
     * Get current ball position
     */
    getCurrentBallPosition(): Point2D | null;
    /**
     * Predict ball position at future timestamp
     */
    predictBallPosition(futureTimestamp: number): Point2D | null;
    /**
     * Get optimal camera for current ball position
     */
    getOptimalCameraForPosition(position: Point2D): string | null;
    /**
     * Get position tracking statistics
     */
    getTrackingStats(): {
        isTracking: boolean;
        currentPosition: Point2D | null;
        positionHistory: Array<{
            position: Point2D;
            timestamp: number;
            cameraId: string;
        }>;
        trackingStats: any;
        coverageValidation: any;
    };
    /**
     * Update detection parameters
     */
    updateDetectionParameters(params: Partial<DetectionParameters>): void;
    /**
     * Update camera selector configuration
     */
    updateCameraSelector(selector: Partial<CameraSelector>): void;
    /**
     * Generate position tracking report
     */
    generateTrackingReport(): string;
    /**
     * Transform pixel detections to court coordinates
     */
    private transformToCourtCoordinates;
    /**
     * Select optimal detection using camera selection strategy
     */
    private selectOptimalDetection;
    /**
     * Select detection by confidence
     */
    private selectByConfidence;
    /**
     * Select detection by optimal camera position
     */
    private selectByPosition;
    /**
     * Select detection using hybrid strategy (confidence + position)
     */
    private selectByHybridStrategy;
    /**
     * Update position history
     */
    private updatePositionHistory;
    /**
     * Calculate camera usage statistics
     */
    private calculateCameraUsage;
    /**
     * Calculate distance between two points
     */
    private calculateDistance;
}
//# sourceMappingURL=PositionTrackingService.d.ts.map