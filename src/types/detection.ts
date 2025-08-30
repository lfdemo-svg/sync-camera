import { Point2D } from './camera';
import { VideoFrame } from './sync';

export interface BallDetection {
  ballId: string;
  cameraId: string;
  timestamp: number;
  imagePosition: Point2D; // Pixel coordinates in camera image
  courtPosition: Point2D; // Real-world court coordinates
  confidence: number;     // Detection confidence (0-1)
  properties: BallProperties;
}

export interface BallProperties {
  radius: number;         // Estimated ball radius in pixels
  area: number;          // Ball area in pixels
  circularity: number;   // How circular the detection is (0-1)
  colorMatch: number;    // How well it matches expected ball color (0-1)
  edgeStrength: number;  // Strength of ball edge detection (0-1)
  motionConsistency: number; // Consistency with previous motion (0-1)
}

export interface BallTrack {
  trackId: string;
  ballDetections: BallDetection[];
  startTime: number;
  endTime?: number;
  isActive: boolean;
  velocity: Point2D;     // Current velocity in m/s
  acceleration: Point2D; // Current acceleration in m/s²
  predictedNextPosition?: Point2D;
  trackQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface DetectionParameters {
  // HSV color thresholds for yellow Padel ball
  hsvLower: [number, number, number]; // [H, S, V] lower bounds
  hsvUpper: [number, number, number]; // [H, S, V] upper bounds
  
  // Size constraints
  minBallRadius: number;    // Minimum ball radius in pixels
  maxBallRadius: number;    // Maximum ball radius in pixels
  
  // Shape constraints  
  minCircularity: number;   // Minimum circularity (0-1)
  maxAspectRatio: number;   // Maximum width/height ratio
  
  // Confidence thresholds
  minConfidence: number;    // Minimum detection confidence
  motionThreshold: number;  // Maximum motion inconsistency
  
  // Tracking parameters
  maxFrameGap: number;      // Max frames without detection before ending track
  interpolationFrames: number; // Max frames to interpolate missing detections
}

export interface CameraSelector {
  cameraA: string;
  cameraB: string;
  selectionStrategy: 'position_based' | 'confidence_based' | 'hybrid';
  switchingThreshold: number; // Confidence difference needed to switch cameras
}

export interface MotionModel {
  type: 'linear' | 'ballistic' | 'kalman';
  gravity: number;          // Gravity acceleration (m/s²)
  airResistance: number;    // Air resistance coefficient
  bounceCoefficient: number; // Ball bounce energy retention
  maxVelocity: number;      // Maximum realistic ball velocity (m/s)
}

export interface DetectionRegion {
  region: 'service_box' | 'net_area' | 'back_court' | 'full_court';
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  priority: number; // Detection priority (higher = more important)
}

export interface DetectionResult {
  detections: BallDetection[];
  primaryDetection?: BallDetection; // Best detection from all cameras
  activeTracks: BallTrack[];
  processingTime: number;           // Time taken for detection (ms)
  frameAnalysis: {
    cameraId: string;
    processedRegions: DetectionRegion[];
    falsePositives: number;
    detectionCount: number;
  }[];
}