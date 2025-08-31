import { BallDetection, DetectionParameters, DetectionResult, DetectionRegion } from '../../types/detection';
import { VideoFrame } from '../../types/sync';
export declare class BallDetector {
    private detectionParams;
    private detectionRegions;
    private static readonly DEFAULT_PARAMS;
    constructor(params?: Partial<DetectionParameters>);
    /**
     * Detect ball in a video frame
     */
    detectBall(frame: VideoFrame): BallDetection[];
    /**
     * Detect ball in multiple frames simultaneously
     */
    detectBallMultiCamera(frames: Map<string, VideoFrame>): DetectionResult;
    /**
     * Update detection parameters
     */
    updateParameters(newParams: Partial<DetectionParameters>): void;
    /**
     * Add custom detection region
     */
    addDetectionRegion(region: DetectionRegion): void;
    /**
     * Get current detection parameters
     */
    getParameters(): DetectionParameters;
    /**
     * Convert image to HSV color space (simulated)
     */
    private convertToHSV;
    /**
     * Apply color threshold to create binary mask
     */
    private applyColorThreshold;
    /**
     * Find ball candidates using blob detection
     */
    private findBallCandidates;
    /**
     * Validate and score ball detections
     */
    private validateAndScoreDetections;
    /**
     * Calculate ball properties for scoring
     */
    private calculateBallProperties;
    /**
     * Calculate overall detection confidence
     */
    private calculateConfidence;
    /**
     * Select best detection from multiple cameras
     */
    private selectBestDetection;
    /**
     * Initialize detection regions for the court
     */
    private initializeDetectionRegions;
}
//# sourceMappingURL=BallDetector.d.ts.map