import { Point2D } from './camera';
export interface BallDetection {
    ballId: string;
    cameraId: string;
    timestamp: number;
    imagePosition: Point2D;
    courtPosition: Point2D;
    confidence: number;
    properties: BallProperties;
}
export interface BallProperties {
    radius: number;
    area: number;
    circularity: number;
    colorMatch: number;
    edgeStrength: number;
    motionConsistency: number;
}
export interface BallTrack {
    trackId: string;
    ballDetections: BallDetection[];
    startTime: number;
    endTime?: number;
    isActive: boolean;
    velocity: Point2D;
    acceleration: Point2D;
    predictedNextPosition?: Point2D;
    trackQuality: 'excellent' | 'good' | 'fair' | 'poor';
}
export interface DetectionParameters {
    hsvLower: [number, number, number];
    hsvUpper: [number, number, number];
    minBallRadius: number;
    maxBallRadius: number;
    minCircularity: number;
    maxAspectRatio: number;
    minConfidence: number;
    motionThreshold: number;
    maxFrameGap: number;
    interpolationFrames: number;
}
export interface CameraSelector {
    cameraA: string;
    cameraB: string;
    selectionStrategy: 'position_based' | 'confidence_based' | 'hybrid';
    switchingThreshold: number;
}
export interface MotionModel {
    type: 'linear' | 'ballistic' | 'kalman';
    gravity: number;
    airResistance: number;
    bounceCoefficient: number;
    maxVelocity: number;
}
export interface DetectionRegion {
    region: 'service_box' | 'net_area' | 'back_court' | 'full_court';
    bounds: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    };
    priority: number;
}
export interface DetectionResult {
    detections: BallDetection[];
    primaryDetection?: BallDetection;
    activeTracks: BallTrack[];
    processingTime: number;
    frameAnalysis: {
        cameraId: string;
        processedRegions: DetectionRegion[];
        falsePositives: number;
        detectionCount: number;
    }[];
}
//# sourceMappingURL=detection.d.ts.map