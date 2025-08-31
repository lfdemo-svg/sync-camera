export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Rectangle {
  topLeft: Point2D;
  topRight: Point2D;
  bottomLeft: Point2D;
  bottomRight: Point2D;
}

export interface CameraMountPosition {
  x: number; // Distance from left side of court (meters)
  y: number; // Distance from front of court (meters) 
  height: number; // Height from floor (meters)
  wall: 'back_a' | 'back_b'; // Which back wall the camera is mounted on
}

export interface CourtDimensions {
  width: number; // 10 meters for standard Padel court
  length: number; // 20 meters for standard Padel court
  netHeight: number; // 0.88 meters at center
  serviceLineDistance: number; // 6.95 meters from net
}

export interface CameraCalibration {
  cameraId: string;
  homographyMatrix: number[][]; // 3x3 transformation matrix
  visibleZone: Rectangle; // Court coordinates that camera can see
  blindZone: Rectangle; // Court coordinates that camera cannot see
  mountPosition: CameraMountPosition;
  calibrationPoints: {
    imagePoints: Point2D[]; // Corner points in camera image
    courtPoints: Point2D[]; // Corresponding court coordinates
  };
  calibratedAt: Date;
  accuracy: number; // RMS error in centimeters
}

export interface CameraView {
  id: string;
  name: string;
  mountPosition: CameraMountPosition;
  calibration?: CameraCalibration;
  isActive: boolean;
}

export interface CourtCoverageMap {
  cameraA: CameraView;
  cameraB: CameraView;
  totalCoverage: Rectangle; // Combined visible area
  overlapZone: Rectangle; // Area visible by both cameras
  courtDimensions: CourtDimensions;
}