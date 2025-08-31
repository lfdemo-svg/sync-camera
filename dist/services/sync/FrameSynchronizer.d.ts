import { VideoFrame, SyncEvent, SyncCalibration, BufferConfiguration, BufferHealth, SyncMetrics } from '../../types/sync';
export declare class FrameSynchronizer {
    private frameBuffers;
    private syncCalibration?;
    private config;
    private metrics;
    private isRecording;
    private syncCheckInterval?;
    private static readonly DEFAULT_CONFIG;
    constructor(cameraIds: string[], config?: Partial<BufferConfiguration>);
    /**
     * Start synchronization calibration process
     */
    startSyncCalibration(): Promise<string>;
    /**
     * Record a sync event for calibration
     */
    recordSyncEvent(eventType: SyncEvent['eventType'], description?: string): SyncEvent;
    /**
     * Add detected sync event in a camera frame
     */
    addSyncDetection(eventId: string, cameraId: string, frameNumber: number, detectionTimestamp: number, confidence?: number): boolean;
    /**
     * Complete sync calibration and calculate camera offsets
     */
    completeSyncCalibration(syncEvents: SyncEvent[]): SyncCalibration;
    /**
     * Add frame to buffer with timestamp-based indexing
     */
    addFrame(frame: VideoFrame): boolean;
    /**
     * Get synchronized frames for a specific timestamp
     */
    getSynchronizedFrames(targetTimestamp: number, toleranceMs?: number): Map<string, VideoFrame>;
    /**
     * Get the best synchronized frame pair from both cameras
     */
    getBestSyncFramePair(): {
        timestamp: number;
        frames: Map<string, VideoFrame>;
    } | null;
    /**
     * Start recording session with continuous sync monitoring
     */
    startRecording(): void;
    /**
     * Stop recording session
     */
    stopRecording(): SyncMetrics;
    /**
     * Get current synchronization status
     */
    getSyncStatus(): {
        isCalibrated: boolean;
        accuracy: number;
        bufferHealth: Map<string, BufferHealth>;
        recommendations: string[];
    };
    /**
     * Force resynchronization if drift is detected
     */
    forceResync(): Promise<boolean>;
    /**
     * Create frame buffer for a camera
     */
    private createFrameBuffer;
    /**
     * Find closest frame to target timestamp within tolerance
     */
    private findClosestFrame;
    /**
     * Enforce buffer size limits by removing old frames
     */
    private enforceBufferLimit;
    /**
     * Calculate buffer health metrics
     */
    private calculateBufferHealth;
    /**
     * Perform periodic sync health check
     */
    private performSyncHealthCheck;
    /**
     * Check for synchronization drift
     */
    private checkSyncDrift;
    /**
     * Update overall sync metrics
     */
    private updateMetrics;
    /**
     * Generate sync optimization recommendations
     */
    private generateRecommendations;
    /**
     * Generate unique session ID
     */
    private generateSessionId;
    /**
     * Get all camera IDs
     */
    getAllCameras(): string[];
    /**
     * Generate unique event ID
     */
    private generateEventId;
}
//# sourceMappingURL=FrameSynchronizer.d.ts.map