import { BallDetection, BallTrack, MotionModel } from '../../types/detection';
import { Point2D } from '../../types/camera';
export declare class BallTracker {
    private activeTracks;
    private motionModel;
    private nextTrackId;
    private readonly MAX_DISTANCE_THRESHOLD;
    private readonly MAX_TIME_GAP;
    private readonly MIN_TRACK_LENGTH;
    private static readonly DEFAULT_MOTION_MODEL;
    constructor(motionModel?: Partial<MotionModel>);
    /**
     * Update tracks with new detections
     */
    updateTracks(detections: BallDetection[]): BallTrack[];
    /**
     * Get the best current ball track
     */
    getBestTrack(): BallTrack | null;
    /**
     * Get current ball position (latest from best track)
     */
    getCurrentBallPosition(): Point2D | null;
    /**
     * Predict ball position at future timestamp
     */
    predictBallPosition(timestamp: number): Point2D | null;
    /**
     * Get all active tracks
     */
    getActiveTracks(): BallTrack[];
    /**
     * Clear all tracks
     */
    clearTracks(): void;
    /**
     * Get tracking statistics
     */
    getTrackingStats(): {
        totalTracks: number;
        activeTracks: number;
        avgTrackLength: number;
        bestTrackQuality: string;
        trackingAccuracy: number;
    };
    /**
     * Associate detections with existing tracks
     */
    private associateDetections;
    /**
     * Find best matching track for a detection
     */
    private findBestTrackMatch;
    /**
     * Create new track from detection
     */
    private createNewTrack;
    /**
     * Update existing track with new detection
     */
    private updateTrack;
    /**
     * Update track motion parameters
     */
    private updateTrackMotion;
    /**
     * Assess track quality based on consistency and length
     */
    private assessTrackQuality;
    /**
     * Calculate motion consistency for track quality assessment
     */
    private calculateMotionConsistency;
    /**
     * Predict track positions for current timestamp
     */
    private predictTrackPositions;
    /**
     * Predict position using physics-based motion model
     */
    private predictPositionWithPhysics;
    /**
     * Clean up expired tracks
     */
    private cleanupExpiredTracks;
    /**
     * Calculate distance between two points
     */
    private calculateDistance;
    /**
     * Calculate overall tracking accuracy
     */
    private calculateTrackingAccuracy;
}
//# sourceMappingURL=BallTracker.d.ts.map