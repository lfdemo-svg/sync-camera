import { Point2D } from './camera';
import { VideoFrame } from './sync';
import { BallDetection } from './detection';

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
  data: any; // Overlay-specific data
  style: OverlayStyle;
  visible: boolean;
  timestamp: number;
}

export interface OverlayStyle {
  color: string;        // RGB hex color
  size: number;         // Size in pixels
  opacity: number;      // 0-1 opacity
  strokeWidth?: number; // For line/circle overlays
  fillColor?: string;   // Fill color for shapes
  fontSize?: number;    // For text overlays
  fontFamily?: string;  // For text overlays
}

export interface TransitionInfo {
  fromCameraId: string;
  toCameraId: string;
  transitionType: 'cut' | 'fade' | 'wipe' | 'zoom';
  duration: number; // Transition duration in ms
  progress: number; // 0-1 transition progress
  reason: 'ball_movement' | 'quality_improvement' | 'manual' | 'zone_change';
}

export type VideoOutputMode = 
  | 'single_camera'      // Show only active camera
  | 'split_screen'       // Show both cameras side by side
  | 'picture_in_picture' // Show main camera with small overlay of other
  | 'auto_switch'        // Automatically switch between cameras
  | 'follow_ball';       // Switch cameras to follow ball

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
    transitionDuration: number; // ms
    transitionType: TransitionInfo['transitionType'];
    minSwitchInterval: number; // Minimum time between switches (ms)
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
  ballTrajectory: Array<{ timestamp: number; position: Point2D; cameraId: string }>;
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
  totalDuration: number; // seconds
  frameCount: number;
  averageFPS: number;
  cameraUsage: {
    [cameraId: string]: {
      totalTime: number; // seconds
      percentage: number;
      switchCount: number;
    };
  };
  switchStatistics: {
    totalSwitches: number;
    averageSwitchInterval: number; // seconds
    smoothTransitions: number;
    jarringTransitions: number;
  };
  ballTracking: {
    totalBallPositions: number;
    trackingAccuracy: number;
    courtCoverage: number; // percentage of court covered
  };
  performance: {
    averageProcessingTime: number; // ms per frame
    droppedFrames: number;
    memoryUsage: number; // MB
  };
}