import { CameraView as ICameraView, CameraCalibration, CameraMountPosition, Point2D, Rectangle } from '../../types/camera';
export declare class CameraView implements ICameraView {
    id: string;
    name: string;
    mountPosition: CameraMountPosition;
    calibration?: CameraCalibration;
    isActive: boolean;
    private static readonly COURT_DIMENSIONS;
    constructor(id: string, name: string, mountPosition: CameraMountPosition, isActive?: boolean);
    /**
     * Calculate the visible area of the court based on camera mount position
     * Camera mounted 16'6" from sides (center) and 4'5" from floor
     */
    calculateVisibleArea(): Rectangle;
    /**
     * Calculate the blind zone that this camera cannot see
     */
    calculateBlindArea(): Rectangle;
    /**
     * Calculate minimum visible distance based on camera height and angle
     * This ensures the top line of the net doesn't obstruct the view
     */
    private calculateNearVisibleDistance;
    /**
     * Check if a court point is visible by this camera
     */
    canSeePoint(courtX: number, courtY: number): boolean;
    /**
     * Get the optimal viewing zone for this camera
     */
    getOptimalZone(): Rectangle;
    /**
     * Transform pixel coordinates to court coordinates using homography matrix
     */
    pixelToCourtCoordinates(pixelX: number, pixelY: number): Point2D | null;
    /**
     * Transform court coordinates to pixel coordinates using inverse homography
     */
    courtToPixelCoordinates(courtX: number, courtY: number): Point2D | null;
    /**
     * Calculate 3x3 matrix determinant
     */
    private calculateMatrixDeterminant;
    /**
     * Calculate 3x3 matrix inverse
     */
    private calculateMatrixInverse;
}
//# sourceMappingURL=CameraView.d.ts.map