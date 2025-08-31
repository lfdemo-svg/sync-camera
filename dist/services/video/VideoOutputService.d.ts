import { CourtCoverageService } from '../camera/CourtCoverageService';
import { SynchronizationService } from '../sync/SynchronizationService';
import { PositionTrackingService } from '../detection/PositionTrackingService';
import { VideoOutput, OutputConfiguration, RecordingSession } from '../../types/video';
import { VideoFrame } from '../../types/sync';
export declare class VideoOutputService {
    private courtViewManager;
    private videoProcessor;
    private courtCoverageService;
    private syncService;
    private positionTracker;
    private currentSession?;
    private isRecording;
    private outputBuffer;
    private static readonly DEFAULT_CONFIG;
    constructor(courtCoverageService: CourtCoverageService, syncService: SynchronizationService, positionTracker: PositionTrackingService, config?: Partial<OutputConfiguration>);
    /**
     * Start video recording session
     */
    startRecording(): RecordingSession;
    /**
     * Stop video recording session
     */
    stopRecording(): RecordingSession;
    /**
     * Process synchronized frames and generate output
     */
    processFrames(frames: Map<string, VideoFrame>): VideoOutput | null;
    /**
     * Update output configuration
     */
    updateConfiguration(newConfig: Partial<OutputConfiguration>): void;
    /**
     * Get current session status
     */
    getSessionStatus(): {
        isRecording: boolean;
        sessionId?: string;
        duration: number;
        totalFrames: number;
        currentCamera: string;
        switchCount: number;
        ballPositions: number;
        performance: any;
    };
    /**
     * Generate comprehensive session report
     */
    generateSessionReport(session?: RecordingSession): string;
    /**
     * Export session data for external processing
     */
    exportSession(session?: RecordingSession): string;
    /**
     * Validate system readiness for recording
     */
    private validateSystemReadiness;
    /**
     * Initialize session statistics
     */
    private initializeStatistics;
    /**
     * Calculate final session statistics
     */
    private calculateFinalStatistics;
    /**
     * Calculate session duration in seconds
     */
    private getSessionDuration;
    /**
     * Generate unique session ID
     */
    private generateSessionId;
}
//# sourceMappingURL=VideoOutputService.d.ts.map