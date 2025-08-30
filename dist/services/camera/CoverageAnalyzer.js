"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoverageAnalyzer = void 0;
class CoverageAnalyzer {
    /**
     * Analyze court coverage for a two-camera setup
     */
    analyzeCoverage(cameraA, cameraB) {
        const visibleA = cameraA.calculateVisibleArea();
        const visibleB = cameraB.calculateVisibleArea();
        const blindA = cameraA.calculateBlindArea();
        const blindB = cameraB.calculateBlindArea();
        const overlapZones = this.calculateOverlapZones(visibleA, visibleB);
        const blindSpots = this.calculateBlindSpots(visibleA, visibleB);
        const totalCoveragePercent = this.calculateCoveragePercentage(visibleA, visibleB, blindSpots);
        const qualityScore = this.calculateQualityScore(totalCoveragePercent, blindSpots, overlapZones, cameraA, cameraB);
        return {
            totalCoveragePercent,
            blindSpots,
            overlapZones,
            recommendedCameraForPoint: this.createCameraSelector(cameraA, cameraB),
            qualityScore
        };
    }
    /**
     * Calculate overlapping areas between two camera views
     */
    calculateOverlapZones(visibleA, visibleB) {
        const overlap = this.rectangleIntersection(visibleA, visibleB);
        return overlap ? [overlap] : [];
    }
    /**
     * Calculate remaining blind spots after combining both cameras
     */
    calculateBlindSpots(visibleA, visibleB) {
        const { width, length } = CoverageAnalyzer.COURT_DIMENSIONS;
        const fullCourt = {
            topLeft: { x: 0, y: 0 },
            topRight: { x: width, y: 0 },
            bottomLeft: { x: 0, y: length },
            bottomRight: { x: width, y: length }
        };
        // Areas not covered by either camera
        const blindSpots = [];
        // Sample grid points to find uncovered areas
        const gridResolution = 0.5; // 50cm resolution
        const uncoveredRegions = [];
        for (let x = 0; x <= width; x += gridResolution) {
            for (let y = 0; y <= length; y += gridResolution) {
                const inA = this.pointInRectangle({ x, y }, visibleA);
                const inB = this.pointInRectangle({ x, y }, visibleB);
                if (!inA && !inB) {
                    uncoveredRegions.push({ x, y });
                }
            }
        }
        // Group adjacent uncovered points into rectangular regions
        if (uncoveredRegions.length > 0) {
            // Simplified - return one rectangle representing largest blind spot
            // In production, use proper region clustering
            const xs = uncoveredRegions.map(p => p.x);
            const ys = uncoveredRegions.map(p => p.y);
            blindSpots.push({
                topLeft: { x: Math.min(...xs), y: Math.min(...ys) },
                topRight: { x: Math.max(...xs), y: Math.min(...ys) },
                bottomLeft: { x: Math.min(...xs), y: Math.max(...ys) },
                bottomRight: { x: Math.max(...xs), y: Math.max(...ys) }
            });
        }
        return blindSpots;
    }
    /**
     * Calculate total court coverage percentage
     */
    calculateCoveragePercentage(visibleA, visibleB, blindSpots) {
        const { width, length } = CoverageAnalyzer.COURT_DIMENSIONS;
        const totalCourtArea = width * length;
        const areaA = this.calculateRectangleArea(visibleA);
        const areaB = this.calculateRectangleArea(visibleB);
        const overlap = this.rectangleIntersection(visibleA, visibleB);
        const overlapArea = overlap ? this.calculateRectangleArea(overlap) : 0;
        const coveredArea = areaA + areaB - overlapArea;
        const coveragePercent = (coveredArea / totalCourtArea) * 100;
        return Math.min(100, Math.max(0, coveragePercent));
    }
    /**
     * Calculate quality score based on coverage completeness and setup optimality
     */
    calculateQualityScore(coveragePercent, blindSpots, overlapZones, cameraA, cameraB) {
        let score = 0;
        // Coverage completeness (60% of score)
        score += coveragePercent * 0.6;
        // Penalty for blind spots (20% of score)
        const blindSpotPenalty = blindSpots.length * 5; // -5 points per blind spot
        score -= Math.min(blindSpotPenalty, 20);
        // Overlap optimization (10% of score)
        const totalOverlapArea = overlapZones.reduce((sum, zone) => sum + this.calculateRectangleArea(zone), 0);
        const optimalOverlap = (CoverageAnalyzer.COURT_DIMENSIONS.width * CoverageAnalyzer.COURT_DIMENSIONS.length) * 0.1;
        const overlapScore = Math.max(0, 10 - Math.abs(totalOverlapArea - optimalOverlap));
        score += overlapScore;
        // Camera calibration quality (10% of score)
        const calibrationScore = this.getCalibrationScore(cameraA, cameraB);
        score += calibrationScore;
        return Math.min(100, Math.max(0, score));
    }
    /**
     * Get calibration quality score
     */
    getCalibrationScore(cameraA, cameraB) {
        let score = 0;
        if (cameraA.calibration) {
            score += cameraA.calibration.accuracy <= 5 ? 5 : Math.max(0, 5 - cameraA.calibration.accuracy / 2);
        }
        if (cameraB.calibration) {
            score += cameraB.calibration.accuracy <= 5 ? 5 : Math.max(0, 5 - cameraB.calibration.accuracy / 2);
        }
        return score;
    }
    /**
     * Create camera selection function based on court position
     */
    createCameraSelector(cameraA, cameraB) {
        return (x, y) => {
            const netY = CoverageAnalyzer.COURT_DIMENSIONS.length / 2;
            const inA = cameraA.canSeePoint(x, y);
            const inB = cameraB.canSeePoint(x, y);
            if (inA && inB) {
                // Both can see - use optimal camera based on position
                if (y > netY) {
                    // Beyond net line - Camera B is optimal (far half from its perspective)
                    return 'camera_b';
                }
                else {
                    // Before net line - Camera A is optimal (far half from its perspective)  
                    return 'camera_a';
                }
            }
            else if (inA) {
                return 'camera_a';
            }
            else if (inB) {
                return 'camera_b';
            }
            else {
                // Neither can see (should not happen with proper setup)
                return y > netY ? 'camera_b' : 'camera_a';
            }
        };
    }
    /**
     * Generate coverage report
     */
    generateCoverageReport(cameraA, cameraB) {
        const analysis = this.analyzeCoverage(cameraA, cameraB);
        let report = `# Court Coverage Analysis\n\n`;
        report += `**Total Coverage:** ${analysis.totalCoveragePercent.toFixed(1)}%\n`;
        report += `**Quality Score:** ${analysis.qualityScore.toFixed(1)}/100\n\n`;
        if (analysis.blindSpots.length > 0) {
            report += `## Blind Spots (${analysis.blindSpots.length})\n`;
            analysis.blindSpots.forEach((spot, index) => {
                report += `- Blind Spot ${index + 1}: `;
                report += `(${spot.topLeft.x.toFixed(1)}, ${spot.topLeft.y.toFixed(1)}) to `;
                report += `(${spot.bottomRight.x.toFixed(1)}, ${spot.bottomRight.y.toFixed(1)})\n`;
            });
            report += `\n`;
        }
        else {
            report += `## ✅ Complete Coverage - No Blind Spots\n\n`;
        }
        report += `## Camera Zones\n`;
        report += `**Camera A Optimal Zone:** Beyond net line (y > 10m)\n`;
        report += `**Camera B Optimal Zone:** Before net line (y < 10m)\n\n`;
        if (analysis.overlapZones.length > 0) {
            report += `## Overlap Zones (${analysis.overlapZones.length})\n`;
            analysis.overlapZones.forEach((zone, index) => {
                const area = this.calculateRectangleArea(zone);
                report += `- Overlap ${index + 1}: ${area.toFixed(1)} m² - Both cameras available\n`;
            });
        }
        return report;
    }
    /**
     * Helper: Calculate rectangle area
     */
    calculateRectangleArea(rect) {
        const width = Math.abs(rect.topRight.x - rect.topLeft.x);
        const height = Math.abs(rect.bottomLeft.y - rect.topLeft.y);
        return width * height;
    }
    /**
     * Helper: Check if point is inside rectangle
     */
    pointInRectangle(point, rect) {
        const minX = Math.min(rect.topLeft.x, rect.topRight.x, rect.bottomLeft.x, rect.bottomRight.x);
        const maxX = Math.max(rect.topLeft.x, rect.topRight.x, rect.bottomLeft.x, rect.bottomRight.x);
        const minY = Math.min(rect.topLeft.y, rect.topRight.y, rect.bottomLeft.y, rect.bottomRight.y);
        const maxY = Math.max(rect.topLeft.y, rect.topRight.y, rect.bottomLeft.y, rect.bottomRight.y);
        return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
    }
    /**
     * Helper: Calculate intersection of two rectangles
     */
    rectangleIntersection(rectA, rectB) {
        const minXA = Math.min(rectA.topLeft.x, rectA.topRight.x, rectA.bottomLeft.x, rectA.bottomRight.x);
        const maxXA = Math.max(rectA.topLeft.x, rectA.topRight.x, rectA.bottomLeft.x, rectA.bottomRight.x);
        const minYA = Math.min(rectA.topLeft.y, rectA.topRight.y, rectA.bottomLeft.y, rectA.bottomRight.y);
        const maxYA = Math.max(rectA.topLeft.y, rectA.topRight.y, rectA.bottomLeft.y, rectA.bottomRight.y);
        const minXB = Math.min(rectB.topLeft.x, rectB.topRight.x, rectB.bottomLeft.x, rectB.bottomRight.x);
        const maxXB = Math.max(rectB.topLeft.x, rectB.topRight.x, rectB.bottomLeft.x, rectB.bottomRight.x);
        const minYB = Math.min(rectB.topLeft.y, rectB.topRight.y, rectB.bottomLeft.y, rectB.bottomRight.y);
        const maxYB = Math.max(rectB.topLeft.y, rectB.topRight.y, rectB.bottomLeft.y, rectB.bottomRight.y);
        const intersectionMinX = Math.max(minXA, minXB);
        const intersectionMaxX = Math.min(maxXA, maxXB);
        const intersectionMinY = Math.max(minYA, minYB);
        const intersectionMaxY = Math.min(maxYA, maxYB);
        if (intersectionMinX < intersectionMaxX && intersectionMinY < intersectionMaxY) {
            return {
                topLeft: { x: intersectionMinX, y: intersectionMinY },
                topRight: { x: intersectionMaxX, y: intersectionMinY },
                bottomLeft: { x: intersectionMinX, y: intersectionMaxY },
                bottomRight: { x: intersectionMaxX, y: intersectionMaxY }
            };
        }
        return null;
    }
}
exports.CoverageAnalyzer = CoverageAnalyzer;
CoverageAnalyzer.COURT_DIMENSIONS = {
    width: 10,
    length: 20,
    netHeight: 0.88,
    serviceLineDistance: 6.95
};
//# sourceMappingURL=CoverageAnalyzer.js.map