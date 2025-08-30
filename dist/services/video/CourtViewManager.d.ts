import { Point2D } from '../../types/camera';
import { BallDetection, BallTrack } from '../../types/detection';
import { CameraSwitchEvent, TransitionInfo, OutputConfiguration } from '../../types/video';
import { CourtCoverageService } from '../camera/CourtCoverageService';
export interface CameraSelectionResult {
    selectedCamera: string;
    confidence: number;
    reason: string;
    shouldSwitch: boolean;
    transitionInfo?: TransitionInfo;
}
export declare class CourtViewManager {
    private courtCoverageService;
    private currentActiveCamera;
    private lastSwitchTime;
    private switchHistory;
    private outputConfig;
    private readonly MIN_SWITCH_INTERVAL;
    private readonly CONFIDENCE_THRESHOLD;
    private readonly POSITION_HYSTERESIS;
    constructor(courtCoverageService: CourtCoverageService, initialCamera: string | undefined, outputConfig: OutputConfiguration);
    /**
     * Determine optimal camera selection based on ball position and current context
     */
    selectOptimalCamera(ballPosition: Point2D, ballDetections: BallDetection[], activeTracks: BallTrack[]): CameraSelectionResult;
    /**
     * Execute camera switch with proper transition handling
     */
    executeCameraSwitch(newCameraId: string, ballPosition: Point2D, reason: TransitionInfo['reason']): CameraSwitchEvent;
    /**
     * Get current active camera
     */
    getCurrentActiveCamera(): string;
    /**
     * Get switch history for analysis
     */
    getSwitchHistory(): CameraSwitchEvent[];
    /**
     * Analyze switching performance
     */
    analyzeSwitchingPerformance(): {
        totalSwitches: number;
        averageSwitchInterval: number;
        smoothTransitions: number;
        jarringTransitions: number;
        cameraUsageBalance: number;
        recommendations: string[];
    };
    /**
     * Update output configuration
     */
    updateConfiguration(newConfig: Partial<OutputConfiguration>): void;
    /**
     * Reset switching state (useful for new recording sessions)
     */
    resetSwitchingState(): void;
    /**
     * Get camera coverage zones for visualization
     */
    getCameraZones(): {
        [cameraId: string]: {
            optimalZone: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
            visibleZone: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
            priority: number;
        };
    };
    /**
     * Determine if camera should be switched based on various factors
     */
    private shouldSwitchCamera;
    /**
     * Calculate confidence for camera switch
     */
    private calculateSwitchConfidence;
    /**
     * Determine the reason for camera switch
     */
    private determineSwitchReason;
    /**
     * Build human-readable reason for camera selection
     */
    private buildSelectionReason;
    /**
     * Calculate distance from zone boundary for hysteresis
     */
    private calculateDistanceFromZoneBoundary;
    /**
     * Check if point is within a zone
     */
    private isPointInZone;
    /**
     * Calculate camera usage statistics
     */
    private calculateCameraUsage;
    /**
     * Generate unique switch ID
     */
    private generateSwitchId;
}
//# sourceMappingURL=CourtViewManager.d.ts.map