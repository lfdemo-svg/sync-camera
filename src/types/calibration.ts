import { Point2D, CameraMountPosition } from './camera';

export interface CalibrationTarget {
  id: string;
  courtPosition: Point2D; // Real-world court coordinates
  description: string; // "front-left corner", "service line intersection", etc.
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
  accuracy?: number; // RMS error in centimeters
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

export const STANDARD_PADEL_COURT: CourtReference = {
  corners: {
    frontLeft: { x: 0, y: 0 },
    frontRight: { x: 10, y: 0 },
    backLeft: { x: 0, y: 20 },
    backRight: { x: 10, y: 20 }
  },
  serviceLines: {
    nearLeft: { x: 0, y: 6.95 },
    nearRight: { x: 10, y: 6.95 },
    farLeft: { x: 0, y: 13.05 },
    farRight: { x: 10, y: 13.05 }
  },
  netLine: {
    left: { x: 0, y: 10 },
    right: { x: 10, y: 10 }
  }
};