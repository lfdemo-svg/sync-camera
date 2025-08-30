import { VideoOutput, OutputConfiguration, TransitionInfo } from '../../types/video';
import { VideoFrame } from '../../types/sync';
import { BallDetection } from '../../types/detection';
export declare class VideoProcessor {
    private outputConfig;
    private frameBuffer;
    private overlayRenderer;
    private processingTimes;
    private droppedFrames;
    constructor(outputConfig: OutputConfiguration);
    /**
     * Process synchronized frames into output video frame
     */
    processFrames(frames: Map<string, VideoFrame>, activeCamera: string, ballDetection?: BallDetection, transitionInfo?: TransitionInfo): VideoOutput;
    /**
     * Update output configuration
     */
    updateConfiguration(newConfig: Partial<OutputConfiguration>): void;
    /**
     * Get processing performance statistics
     */
    getPerformanceStats(): {
        averageProcessingTime: number;
        maxProcessingTime: number;
        droppedFrames: number;
        totalFramesProcessed: number;
        targetFrameTime: number;
        isRealtime: boolean;
    };
    /**
     * Clear performance statistics
     */
    clearPerformanceStats(): void;
    /**
     * Render single camera view with optional transition effects
     */
    private renderSingleCamera;
    /**
     * Render split screen view
     */
    private renderSplitScreen;
    /**
     * Render picture-in-picture view
     */
    private renderPictureInPicture;
    /**
     * Generate overlays for the frame
     */
    private generateOverlays;
    /**
     * Apply transition effects to frame
     */
    private applyTransitionEffect;
    /**
     * Apply fade transition effect
     */
    private applyFadeEffect;
    /**
     * Apply wipe transition effect
     */
    private applyWipeEffect;
    /**
     * Apply zoom transition effect
     */
    private applyZoomEffect;
    /**
     * Copy frame data to specific region of output frame
     */
    private copyFrameToRegion;
    /**
     * Add active camera border for split screen
     */
    private addActiveCameraBorder;
    /**
     * Add border around picture-in-picture frame
     */
    private addPipBorder;
    /**
     * Generate court line coordinates for overlay
     */
    private generateCourtLineCoordinates;
    /**
     * Create empty output frame for error cases
     */
    private createEmptyOutput;
    /**
     * Generate unique output ID
     */
    private generateOutputId;
}
//# sourceMappingURL=VideoProcessor.d.ts.map