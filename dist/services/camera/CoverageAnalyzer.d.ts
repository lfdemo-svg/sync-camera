import { CameraView } from './CameraView';
import { Rectangle } from '../../types/camera';
export interface CoverageAnalysis {
    totalCoveragePercent: number;
    blindSpots: Rectangle[];
    overlapZones: Rectangle[];
    recommendedCameraForPoint: (x: number, y: number) => 'camera_a' | 'camera_b' | 'either';
    qualityScore: number;
}
export declare class CoverageAnalyzer {
    private static readonly COURT_DIMENSIONS;
    /**
     * Analyze court coverage for a two-camera setup
     */
    analyzeCoverage(cameraA: CameraView, cameraB: CameraView): CoverageAnalysis;
    /**
     * Calculate overlapping areas between two camera views
     */
    private calculateOverlapZones;
    /**
     * Calculate remaining blind spots after combining both cameras
     */
    private calculateBlindSpots;
    /**
     * Calculate total court coverage percentage
     */
    private calculateCoveragePercentage;
    /**
     * Calculate quality score based on coverage completeness and setup optimality
     */
    private calculateQualityScore;
    /**
     * Get calibration quality score
     */
    private getCalibrationScore;
    /**
     * Create camera selection function based on court position
     */
    private createCameraSelector;
    /**
     * Generate coverage report
     */
    generateCoverageReport(cameraA: CameraView, cameraB: CameraView): string;
    /**
     * Helper: Calculate rectangle area
     */
    private calculateRectangleArea;
    /**
     * Helper: Check if point is inside rectangle
     */
    private pointInRectangle;
    /**
     * Helper: Calculate intersection of two rectangles
     */
    private rectangleIntersection;
}
//# sourceMappingURL=CoverageAnalyzer.d.ts.map