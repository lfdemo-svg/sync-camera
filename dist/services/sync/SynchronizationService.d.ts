import { CalibrationMethod } from './SyncCalibrator';
import { VideoFrame, SyncEvent, SyncMetrics, BufferConfiguration } from '../../types/sync';
export interface SyncSession {
    sessionId: string;
    cameraIds: string[];
    startTime: Date;
    endTime?: Date;
    isActive: boolean;
    metrics: SyncMetrics;
}
export declare class SynchronizationService {
    private frameSynchronizer;
    private timestampManager;
    private currentSession?;
    private isInitialized;
    constructor(cameraIds: string[], bufferConfig?: Partial<BufferConfiguration>);
    /**
     * Initialize synchronization system
     */
    initialize(): Promise<boolean>;
    /**
     * Get available calibration methods
     */
    getCalibrationMethods(): CalibrationMethod[];
    /**
     * Get recommended calibration method
     */
    getRecommendedCalibrationMethod(hasAudio?: boolean, hasMobileDevice?: boolean, accuracyRequired?: number): CalibrationMethod;
    /**
     * Start calibration with specific method
     */
    startCalibration(methodId: string): Promise<{
        sessionId: string;
        instructions: string[];
        syncEvent: SyncEvent;
    }>;
    /**
     * Complete calibration process
     */
    completeCalibration(syncEvents: SyncEvent[]): Promise<{
        success: boolean;
        calibration?: any;
        report: string;
    }>;
    /**
     * Start synchronized recording session
     */
    startRecordingSession(): SyncSession;
    /**
     * Stop recording session
     */
    stopRecordingSession(): SyncSession | null;
    /**
     * Add frame to synchronized buffer
     */
    addFrame(cameraId: string, frameData: Buffer, metadata: any): boolean;
    /**
     * Get synchronized frames for a timestamp
     */
    getSynchronizedFrames(timestamp: number, toleranceMs?: number): Map<string, VideoFrame>;
    /**
     * Get best synchronized frame pair
     */
    getBestSyncFramePair(): {
        timestamp: number;
        frames: Map<string, VideoFrame>;
    } | null;
    /**
     * Get current synchronization status
     */
    getSyncStatus(): {
        isInitialized: boolean;
        isCalibrated: boolean;
        isRecording: boolean;
        timestampAccuracy: any;
        frameSync: any;
        recommendations: string[];
    };
    /**
     * Generate comprehensive synchronization report
     */
    generateSyncReport(): string;
    /**
     * Force complete resynchronization
     */
    forceResync(): Promise<boolean>;
    /**
     * Shutdown synchronization service
     */
    shutdown(): Promise<void>;
    /**
     * Calculate current session duration in seconds
     */
    private calculateSessionDuration;
    /**
     * Generate unique session ID
     */
    private generateSessionId;
}
//# sourceMappingURL=SynchronizationService.d.ts.map