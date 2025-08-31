import { Point2D } from './camera';
export interface VideoOutput {
    outputId: string;
    timestamp: number;
    outputMode: VideoOutputMode;
    frameData: Buffer | ArrayBuffer;
    metadata: VideoOutputMetadata;
    overlays: VideoOverlay[];
}
export interface VideoOutputMetadata {
    width: number;
    height: number;
    fps: number;
    format: 'rgb' | 'bgr' | 'h264' | 'mp4';
    bitrate?: number;
    duration?: number;
    activeCameraId: string;
    switchTransition?: TransitionInfo;
}
export interface VideoOverlay {
    type: 'ball_marker' | 'court_lines' | 'score_display' | 'camera_indicator' | 'zone_highlight';
    position: Point2D;
    data: any;
    style: OverlayStyle;
    visible: boolean;
    timestamp: number;
}
export interface OverlayStyle {
    color: string;
    size: number;
    opacity: number;
    strokeWidth?: number;
    fillColor?: string;
    fontSize?: number;
    fontFamily?: string;
}
export interface TransitionInfo {
    fromCameraId: string;
    toCameraId: string;
    transitionType: 'cut' | 'fade' | 'wipe' | 'zoom';
    duration: number;
    progress: number;
    reason: 'ball_movement' | 'quality_improvement' | 'manual' | 'zone_change';
}
export type VideoOutputMode = 'single_camera' | 'split_screen' | 'picture_in_picture' | 'auto_switch' | 'follow_ball';
export interface OutputConfiguration {
    mode: VideoOutputMode;
    resolution: {
        width: number;
        height: number;
    };
    fps: number;
    bitrate?: number;
    enableOverlays: boolean;
    overlayConfig: {
        showBallMarker: boolean;
        showCourtLines: boolean;
        showCameraIndicator: boolean;
        showZoneHighlight: boolean;
        ballMarkerStyle: OverlayStyle;
        courtLineStyle: OverlayStyle;
    };
    transitionConfig: {
        enableSmoothing: boolean;
        transitionDuration: number;
        transitionType: TransitionInfo['transitionType'];
        minSwitchInterval: number;
    };
}
export interface RecordingSession {
    sessionId: string;
    startTime: Date;
    endTime?: Date;
    outputConfig: OutputConfiguration;
    totalFrames: number;
    outputFrames: VideoOutput[];
    switchHistory: CameraSwitchEvent[];
    ballTrajectory: Array<{
        timestamp: number;
        position: Point2D;
        cameraId: string;
    }>;
    statistics: SessionStatistics;
}
export interface CameraSwitchEvent {
    switchId: string;
    timestamp: number;
    fromCamera: string;
    toCamera: string;
    reason: TransitionInfo['reason'];
    ballPosition?: Point2D;
    transitionDuration: number;
    quality: 'smooth' | 'noticeable' | 'jarring';
}
export interface SessionStatistics {
    totalDuration: number;
    frameCount: number;
    averageFPS: number;
    cameraUsage: {
        [cameraId: string]: {
            totalTime: number;
            percentage: number;
            switchCount: number;
        };
    };
    switchStatistics: {
        totalSwitches: number;
        averageSwitchInterval: number;
        smoothTransitions: number;
        jarringTransitions: number;
    };
    ballTracking: {
        totalBallPositions: number;
        trackingAccuracy: number;
        courtCoverage: number;
    };
    performance: {
        averageProcessingTime: number;
        droppedFrames: number;
        memoryUsage: number;
    };
}
//# sourceMappingURL=video.d.ts.map