"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CameraView = void 0;
class CameraView {
    constructor(id, name, mountPosition, isActive = true) {
        this.id = id;
        this.name = name;
        this.mountPosition = mountPosition;
        this.isActive = isActive;
    }
    /**
     * Calculate the visible area of the court based on camera mount position
     * Camera mounted 16'6" from sides (center) and 4'5" from floor
     */
    calculateVisibleArea() {
        const { width, length } = CameraView.COURT_DIMENSIONS;
        const { wall, height } = this.mountPosition;
        // Camera is centered horizontally (5m from each side)
        // Height is 4'5" = 1.35m from floor
        const cameraHeight = 1.35; // meters (4'5")
        // Calculate viewing angles and blind spots based on mount position
        if (wall === 'back_a') {
            // Camera A mounted on back wall at y=0
            // Can see most of the court except near service area due to angle
            const nearVisibleY = this.calculateNearVisibleDistance(cameraHeight);
            return {
                topLeft: { x: 0, y: nearVisibleY },
                topRight: { x: width, y: nearVisibleY },
                bottomLeft: { x: 0, y: length },
                bottomRight: { x: width, y: length }
            };
        }
        else {
            // Camera B mounted on back wall at y=20
            // Can see most of the court except near service area from its perspective
            const nearVisibleY = length - this.calculateNearVisibleDistance(cameraHeight);
            return {
                topLeft: { x: 0, y: 0 },
                topRight: { x: width, y: 0 },
                bottomLeft: { x: 0, y: nearVisibleY },
                bottomRight: { x: width, y: nearVisibleY }
            };
        }
    }
    /**
     * Calculate the blind zone that this camera cannot see
     */
    calculateBlindArea() {
        const { width, length } = CameraView.COURT_DIMENSIONS;
        const { wall } = this.mountPosition;
        const cameraHeight = 1.35; // meters
        if (wall === 'back_a') {
            // Camera A blind spot: near service area (0 to nearVisibleY)
            const nearVisibleY = this.calculateNearVisibleDistance(cameraHeight);
            return {
                topLeft: { x: 0, y: 0 },
                topRight: { x: width, y: 0 },
                bottomLeft: { x: 0, y: nearVisibleY },
                bottomRight: { x: width, y: nearVisibleY }
            };
        }
        else {
            // Camera B blind spot: near service area from its perspective
            const nearVisibleY = length - this.calculateNearVisibleDistance(cameraHeight);
            return {
                topLeft: { x: 0, y: nearVisibleY },
                topRight: { x: width, y: nearVisibleY },
                bottomLeft: { x: 0, y: length },
                bottomRight: { x: width, y: length }
            };
        }
    }
    /**
     * Calculate minimum visible distance based on camera height and angle
     * This ensures the top line of the net doesn't obstruct the view
     */
    calculateNearVisibleDistance(cameraHeight) {
        const netHeight = CameraView.COURT_DIMENSIONS.netHeight;
        const netPosition = CameraView.COURT_DIMENSIONS.length / 2; // 10m from each end
        // Calculate angle to see over the net
        // Using basic trigonometry: tan(angle) = height_difference / distance
        const heightDifference = cameraHeight - netHeight;
        const distanceToNet = netPosition;
        // Minimum viewing distance to clear the net
        // Add small buffer to ensure clear view of far service line
        const minVisibleDistance = Math.max(3.0, // Minimum 3 meters from camera
        distanceToNet - (heightDifference * distanceToNet / netHeight));
        return minVisibleDistance;
    }
    /**
     * Check if a court point is visible by this camera
     */
    canSeePoint(courtX, courtY) {
        const visibleArea = this.calculateVisibleArea();
        return (courtX >= visibleArea.topLeft.x &&
            courtX <= visibleArea.topRight.x &&
            courtY >= Math.min(visibleArea.topLeft.y, visibleArea.bottomLeft.y) &&
            courtY <= Math.max(visibleArea.topLeft.y, visibleArea.bottomLeft.y));
    }
    /**
     * Get the optimal viewing zone for this camera
     */
    getOptimalZone() {
        // Each camera is most accurate in the far half from its perspective
        const { width, length } = CameraView.COURT_DIMENSIONS;
        const netY = length / 2;
        if (this.mountPosition.wall === 'back_a') {
            // Camera A optimal zone: far half (beyond net line)
            return {
                topLeft: { x: 0, y: netY },
                topRight: { x: width, y: netY },
                bottomLeft: { x: 0, y: length },
                bottomRight: { x: width, y: length }
            };
        }
        else {
            // Camera B optimal zone: far half from its perspective
            return {
                topLeft: { x: 0, y: 0 },
                topRight: { x: width, y: 0 },
                bottomLeft: { x: 0, y: netY },
                bottomRight: { x: width, y: netY }
            };
        }
    }
    /**
     * Transform pixel coordinates to court coordinates using homography matrix
     */
    pixelToCourtCoordinates(pixelX, pixelY) {
        if (!this.calibration?.homographyMatrix) {
            return null;
        }
        const H = this.calibration.homographyMatrix;
        // Apply homography transformation: [x', y', w'] = H * [x, y, 1]
        const x = pixelX;
        const y = pixelY;
        const denominator = H[2][0] * x + H[2][1] * y + H[2][2];
        if (Math.abs(denominator) < 1e-8) {
            return null; // Avoid division by zero
        }
        const courtX = (H[0][0] * x + H[0][1] * y + H[0][2]) / denominator;
        const courtY = (H[1][0] * x + H[1][1] * y + H[1][2]) / denominator;
        return { x: courtX, y: courtY };
    }
    /**
     * Transform court coordinates to pixel coordinates using inverse homography
     */
    courtToPixelCoordinates(courtX, courtY) {
        if (!this.calibration?.homographyMatrix) {
            return null;
        }
        // For inverse transformation, we would need the inverse matrix
        // This is a simplified version - in practice, store both forward and inverse matrices
        const H = this.calibration.homographyMatrix;
        // Calculate inverse matrix (3x3)
        const det = this.calculateMatrixDeterminant(H);
        if (Math.abs(det) < 1e-8) {
            return null;
        }
        const invH = this.calculateMatrixInverse(H, det);
        const x = courtX;
        const y = courtY;
        const denominator = invH[2][0] * x + invH[2][1] * y + invH[2][2];
        if (Math.abs(denominator) < 1e-8) {
            return null;
        }
        const pixelX = (invH[0][0] * x + invH[0][1] * y + invH[0][2]) / denominator;
        const pixelY = (invH[1][0] * x + invH[1][1] * y + invH[1][2]) / denominator;
        return { x: pixelX, y: pixelY };
    }
    /**
     * Calculate 3x3 matrix determinant
     */
    calculateMatrixDeterminant(matrix) {
        const [[a, b, c], [d, e, f], [g, h, i]] = matrix;
        return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
    }
    /**
     * Calculate 3x3 matrix inverse
     */
    calculateMatrixInverse(matrix, det) {
        const [[a, b, c], [d, e, f], [g, h, i]] = matrix;
        return [
            [(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det],
            [(f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det],
            [(d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det]
        ];
    }
}
exports.CameraView = CameraView;
// Standard Padel court dimensions
CameraView.COURT_DIMENSIONS = {
    width: 10, // meters
    length: 20, // meters
    netHeight: 0.88, // meters
    serviceLineDistance: 6.95 // meters from net
};
//# sourceMappingURL=CameraView.js.map