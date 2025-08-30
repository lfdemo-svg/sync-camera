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
    x: number;
    y: number;
    height: number;
    wall: 'back_a' | 'back_b';
}
export interface CourtDimensions {
    width: number;
    length: number;
    netHeight: number;
    serviceLineDistance: number;
}
export interface CameraCalibration {
    cameraId: string;
    homographyMatrix: number[][];
    visibleZone: Rectangle;
    blindZone: Rectangle;
    mountPosition: CameraMountPosition;
    calibrationPoints: {
        imagePoints: Point2D[];
        courtPoints: Point2D[];
    };
    calibratedAt: Date;
    accuracy: number;
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
    totalCoverage: Rectangle;
    overlapZone: Rectangle;
    courtDimensions: CourtDimensions;
}
//# sourceMappingURL=camera.d.ts.map