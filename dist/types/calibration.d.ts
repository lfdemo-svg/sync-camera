import { Point2D, CameraMountPosition } from './camera';
export interface CalibrationTarget {
    id: string;
    courtPosition: Point2D;
    description: string;
}
export interface CalibrationSession {
    sessionId: string;
    cameraId: string;
    mountPosition: CameraMountPosition;
    targets: CalibrationTarget[];
    detectedPoints: {
        targetId: string;
        imagePoint: Point2D;
        confidence: number;
    }[];
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    startedAt: Date;
    completedAt?: Date;
    accuracy?: number;
}
export interface CourtReference {
    corners: {
        frontLeft: Point2D;
        frontRight: Point2D;
        backLeft: Point2D;
        backRight: Point2D;
    };
    serviceLines: {
        nearLeft: Point2D;
        nearRight: Point2D;
        farLeft: Point2D;
        farRight: Point2D;
    };
    netLine: {
        left: Point2D;
        right: Point2D;
    };
}
export declare const STANDARD_PADEL_COURT: CourtReference;
//# sourceMappingURL=calibration.d.ts.map