"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionTrackingService = void 0;
const BallDetector_1 = require("./BallDetector");
const BallTracker_1 = require("./BallTracker");
class PositionTrackingService {
    constructor(courtCoverageService, config) {
        this.isTracking = false;
        this.positionHistory = [];
        this.courtCoverageService = courtCoverageService;
        this.ballDetector = new BallDetector_1.BallDetector(config?.detectionParams);
        this.ballTracker = new BallTracker_1.BallTracker();
        this.cameraSelector = {
            ...PositionTrackingService.DEFAULT_CAMERA_SELECTOR,
            ...config?.cameraSelector
        };
        console.log('PositionTrackingService initialized');
        console.log('Camera selector strategy:', this.cameraSelector.selectionStrategy);
    }
    /**
     * Start position tracking
     */
    startTracking() {
        if (this.isTracking) {
            console.warn('Position tracking already active');
            return false;
        }
        // Validate court coverage setup
        const validation = this.courtCoverageService.validateCoverage();
        if (!validation.isComplete) {
            console.error('Cannot start tracking: incomplete court coverage');
            console.error('Issues:', validation.recommendations);
            return false;
        }
        this.isTracking = true;
        this.ballTracker.clearTracks();
        this.positionHistory = [];
        console.log('✅ Position tracking started');
        return true;
    }
    /**
     * Stop position tracking
     */
    stopTracking() {
        if (!this.isTracking) {
            console.warn('Position tracking not active');
            return {
                duration: 0,
                totalPositions: 0,
                trackingAccuracy: 0,
                finalStats: {}
            };
        }
        this.isTracking = false;
        const finalStats = this.ballTracker.getTrackingStats();
        const duration = this.positionHistory.length > 0 ?
            (this.positionHistory[this.positionHistory.length - 1].timestamp - this.positionHistory[0].timestamp) / 1000 : 0;
        console.log('⏹️ Position tracking stopped');
        console.log(`Duration: ${duration.toFixed(2)}s, Positions tracked: ${this.positionHistory.length}`);
        return {
            duration,
            totalPositions: this.positionHistory.length,
            trackingAccuracy: finalStats.trackingAccuracy,
            finalStats
        };
    }
    /**
     * Process synchronized frames to track ball position
     */
    processFrames(frames) {
        if (!this.isTracking) {
            throw new Error('Position tracking not started');
        }
        const startTime = Date.now();
        try {
            // Detect ball in all available camera frames
            const detectionResult = this.ballDetector.detectBallMultiCamera(frames);
            // Transform detections to court coordinates
            const courtDetections = this.transformToCourtCoordinates(detectionResult.detections);
            // Select optimal camera and detection
            const selectedDetection = this.selectOptimalDetection(courtDetections);
            // Update ball tracking
            const activeTracks = this.ballTracker.updateTracks(courtDetections);
            // Update position history
            if (selectedDetection) {
                this.updatePositionHistory(selectedDetection);
            }
            const processingTime = Date.now() - startTime;
            return {
                ...detectionResult,
                detections: courtDetections,
                primaryDetection: selectedDetection,
                activeTracks,
                processingTime
            };
        }
        catch (error) {
            console.error('Frame processing failed:', error);
            return {
                detections: [],
                activeTracks: [],
                processingTime: Date.now() - startTime,
                frameAnalysis: []
            };
        }
    }
    /**
     * Get current ball position
     */
    getCurrentBallPosition() {
        if (!this.isTracking) {
            return null;
        }
        // Try to get position from active track first
        const currentPosition = this.ballTracker.getCurrentBallPosition();
        if (currentPosition) {
            this.lastBallPosition = currentPosition;
            return currentPosition;
        }
        // Fallback to last known position
        return this.lastBallPosition || null;
    }
    /**
     * Predict ball position at future timestamp
     */
    predictBallPosition(futureTimestamp) {
        return this.ballTracker.predictBallPosition(futureTimestamp);
    }
    /**
     * Get optimal camera for current ball position
     */
    getOptimalCameraForPosition(position) {
        return this.courtCoverageService.getOptimalCamera(position.x, position.y);
    }
    /**
     * Get position tracking statistics
     */
    getTrackingStats() {
        return {
            isTracking: this.isTracking,
            currentPosition: this.getCurrentBallPosition(),
            positionHistory: [...this.positionHistory],
            trackingStats: this.ballTracker.getTrackingStats(),
            coverageValidation: this.courtCoverageService.validateCoverage()
        };
    }
    /**
     * Update detection parameters
     */
    updateDetectionParameters(params) {
        this.ballDetector.updateParameters(params);
        console.log('Detection parameters updated:', params);
    }
    /**
     * Update camera selector configuration
     */
    updateCameraSelector(selector) {
        this.cameraSelector = { ...this.cameraSelector, ...selector };
        console.log('Camera selector updated:', this.cameraSelector);
    }
    /**
     * Generate position tracking report
     */
    generateTrackingReport() {
        const stats = this.getTrackingStats();
        const trackingStats = stats.trackingStats;
        let report = `# Ball Position Tracking Report\n\n`;
        report += `## Tracking Status\n`;
        report += `- **Active:** ${stats.isTracking ? '🔴 Tracking' : '⭕ Stopped'}\n`;
        report += `- **Current Position:** ${stats.currentPosition ?
            `(${stats.currentPosition.x.toFixed(2)}, ${stats.currentPosition.y.toFixed(2)})` :
            'No position'}\n`;
        report += `- **Position History:** ${stats.positionHistory.length} positions\n\n`;
        report += `## Tracking Performance\n`;
        report += `- **Total Tracks:** ${trackingStats.totalTracks}\n`;
        report += `- **Active Tracks:** ${trackingStats.activeTracks}\n`;
        report += `- **Average Track Length:** ${trackingStats.avgTrackLength.toFixed(1)} detections\n`;
        report += `- **Best Track Quality:** ${trackingStats.bestTrackQuality}\n`;
        report += `- **Tracking Accuracy:** ${(trackingStats.trackingAccuracy * 100).toFixed(1)}%\n\n`;
        if (stats.positionHistory.length > 0) {
            const recentPositions = stats.positionHistory.slice(-10);
            report += `## Recent Positions (Last 10)\n`;
            recentPositions.forEach((pos, index) => {
                const timeAgo = Date.now() - pos.timestamp;
                report += `${index + 1}. (${pos.position.x.toFixed(2)}, ${pos.position.y.toFixed(2)}) - ${pos.cameraId} - ${timeAgo}ms ago\n`;
            });
            report += `\n`;
        }
        // Camera usage statistics
        const cameraUsage = this.calculateCameraUsage();
        report += `## Camera Usage\n`;
        Object.entries(cameraUsage).forEach(([cameraId, usage]) => {
            report += `- **${cameraId}:** ${usage.count} detections (${usage.percentage.toFixed(1)}%)\n`;
        });
        return report;
    }
    /**
     * Transform pixel detections to court coordinates
     */
    transformToCourtCoordinates(detections) {
        return detections.map(detection => {
            const courtPos = this.courtCoverageService.pixelToCourtCoordinates(detection.cameraId, detection.imagePosition.x, detection.imagePosition.y);
            return {
                ...detection,
                courtPosition: courtPos || { x: 0, y: 0 }
            };
        });
    }
    /**
     * Select optimal detection using camera selection strategy
     */
    selectOptimalDetection(detections) {
        if (detections.length === 0) {
            return undefined;
        }
        if (detections.length === 1) {
            return detections[0];
        }
        switch (this.cameraSelector.selectionStrategy) {
            case 'confidence_based':
                return this.selectByConfidence(detections);
            case 'position_based':
                return this.selectByPosition(detections);
            case 'hybrid':
            default:
                return this.selectByHybridStrategy(detections);
        }
    }
    /**
     * Select detection by confidence
     */
    selectByConfidence(detections) {
        return detections.sort((a, b) => b.confidence - a.confidence)[0];
    }
    /**
     * Select detection by optimal camera position
     */
    selectByPosition(detections) {
        for (const detection of detections) {
            const optimalCamera = this.getOptimalCameraForPosition(detection.courtPosition);
            if (optimalCamera === detection.cameraId) {
                return detection;
            }
        }
        // Fallback to highest confidence if no optimal camera match
        return this.selectByConfidence(detections);
    }
    /**
     * Select detection using hybrid strategy (confidence + position)
     */
    selectByHybridStrategy(detections) {
        let bestDetection = detections[0];
        let bestScore = 0;
        detections.forEach(detection => {
            let score = detection.confidence; // Base score from confidence
            // Bonus for optimal camera position
            const optimalCamera = this.getOptimalCameraForPosition(detection.courtPosition);
            if (optimalCamera === detection.cameraId) {
                score += 0.3; // 30% bonus for optimal camera
            }
            // Bonus for motion consistency (if we have tracking history)
            const currentTrack = this.ballTracker.getBestTrack();
            if (currentTrack && currentTrack.ballDetections.length > 0) {
                const lastPosition = currentTrack.ballDetections[currentTrack.ballDetections.length - 1].courtPosition;
                const distance = this.calculateDistance(lastPosition, detection.courtPosition);
                // Bonus for reasonable motion (not too far from last position)
                if (distance <= 5.0) { // Within 5 meters is reasonable
                    score += 0.2 * (1 - distance / 5.0);
                }
            }
            if (score > bestScore) {
                bestScore = score;
                bestDetection = detection;
            }
        });
        return bestDetection;
    }
    /**
     * Update position history
     */
    updatePositionHistory(detection) {
        this.positionHistory.push({
            position: detection.courtPosition,
            timestamp: detection.timestamp,
            cameraId: detection.cameraId
        });
        // Keep only recent history (last 1000 positions)
        if (this.positionHistory.length > 1000) {
            this.positionHistory = this.positionHistory.slice(-1000);
        }
        this.lastBallPosition = detection.courtPosition;
    }
    /**
     * Calculate camera usage statistics
     */
    calculateCameraUsage() {
        const usage = {};
        this.positionHistory.forEach(pos => {
            if (!usage[pos.cameraId]) {
                usage[pos.cameraId] = { count: 0, percentage: 0 };
            }
            usage[pos.cameraId].count++;
        });
        const total = this.positionHistory.length;
        Object.values(usage).forEach(cameraUsage => {
            cameraUsage.percentage = total > 0 ? (cameraUsage.count / total) * 100 : 0;
        });
        return usage;
    }
    /**
     * Calculate distance between two points
     */
    calculateDistance(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
exports.PositionTrackingService = PositionTrackingService;
// Default camera selector configuration
PositionTrackingService.DEFAULT_CAMERA_SELECTOR = {
    cameraA: 'camera_a',
    cameraB: 'camera_b',
    selectionStrategy: 'hybrid',
    switchingThreshold: 0.2 // 20% confidence difference needed to switch
};
//# sourceMappingURL=PositionTrackingService.js.map