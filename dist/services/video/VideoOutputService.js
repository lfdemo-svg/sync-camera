"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoOutputService = void 0;
const CourtViewManager_1 = require("./CourtViewManager");
const VideoProcessor_1 = require("./VideoProcessor");
class VideoOutputService {
    constructor(courtCoverageService, syncService, positionTracker, config) {
        this.isRecording = false;
        this.outputBuffer = [];
        const outputConfig = { ...VideoOutputService.DEFAULT_CONFIG, ...config };
        this.courtCoverageService = courtCoverageService;
        this.syncService = syncService;
        this.positionTracker = positionTracker;
        this.courtViewManager = new CourtViewManager_1.CourtViewManager(courtCoverageService, 'camera_a', outputConfig);
        this.videoProcessor = new VideoProcessor_1.VideoProcessor(outputConfig);
        console.log('VideoOutputService initialized');
        console.log('Output configuration:', outputConfig);
    }
    /**
     * Start video recording session
     */
    startRecording() {
        if (this.isRecording) {
            throw new Error('Recording session already active');
        }
        // Validate prerequisites
        this.validateSystemReadiness();
        const sessionId = this.generateSessionId();
        this.currentSession = {
            sessionId,
            startTime: new Date(),
            outputConfig: this.videoProcessor.getPerformanceStats(), // Simplified
            totalFrames: 0,
            outputFrames: [],
            switchHistory: [],
            ballTrajectory: [],
            statistics: this.initializeStatistics()
        };
        // Reset states
        this.courtViewManager.resetSwitchingState();
        this.videoProcessor.clearPerformanceStats();
        this.outputBuffer = [];
        // Start underlying services
        this.syncService.startRecordingSession();
        this.positionTracker.startTracking();
        this.isRecording = true;
        console.log(`✅ Video recording started: ${sessionId}`);
        return this.currentSession;
    }
    /**
     * Stop video recording session
     */
    stopRecording() {
        if (!this.isRecording || !this.currentSession) {
            throw new Error('No active recording session');
        }
        // Stop underlying services
        this.syncService.stopRecordingSession();
        const trackingStats = this.positionTracker.stopTracking();
        // Finalize session
        this.currentSession.endTime = new Date();
        this.currentSession.outputFrames = [...this.outputBuffer];
        this.currentSession.switchHistory = this.courtViewManager.getSwitchHistory();
        this.currentSession.statistics = this.calculateFinalStatistics(trackingStats);
        const finalSession = this.currentSession;
        this.currentSession = undefined;
        this.isRecording = false;
        console.log(`⏹️ Video recording stopped: ${finalSession.sessionId}`);
        console.log(`Duration: ${this.getSessionDuration(finalSession).toFixed(2)}s`);
        console.log(`Total frames: ${finalSession.totalFrames}`);
        return finalSession;
    }
    /**
     * Process synchronized frames and generate output
     */
    processFrames(frames) {
        if (!this.isRecording || !this.currentSession) {
            return null;
        }
        try {
            // Process frames for ball detection
            const detectionResult = this.positionTracker.processFrames(frames);
            const ballDetection = detectionResult.primaryDetection;
            // Update ball trajectory
            if (ballDetection) {
                this.currentSession.ballTrajectory.push({
                    timestamp: ballDetection.timestamp,
                    position: ballDetection.courtPosition,
                    cameraId: ballDetection.cameraId
                });
            }
            // Determine optimal camera selection
            const cameraSelection = this.courtViewManager.selectOptimalCamera(ballDetection?.courtPosition || { x: 5, y: 10 }, detectionResult.detections, detectionResult.activeTracks);
            // Execute camera switch if needed
            let switchEvent;
            if (cameraSelection.shouldSwitch && cameraSelection.transitionInfo) {
                switchEvent = this.courtViewManager.executeCameraSwitch(cameraSelection.selectedCamera, ballDetection?.courtPosition || { x: 5, y: 10 }, cameraSelection.transitionInfo.reason);
                this.currentSession.switchHistory.push(switchEvent);
            }
            // Generate video output
            const videoOutput = this.videoProcessor.processFrames(frames, cameraSelection.selectedCamera, ballDetection, cameraSelection.transitionInfo);
            // Add to output buffer
            this.outputBuffer.push(videoOutput);
            this.currentSession.totalFrames++;
            // Keep buffer manageable (last 1000 frames)
            if (this.outputBuffer.length > 1000) {
                this.outputBuffer = this.outputBuffer.slice(-1000);
            }
            return videoOutput;
        }
        catch (error) {
            console.error('Frame processing failed:', error);
            return null;
        }
    }
    /**
     * Update output configuration
     */
    updateConfiguration(newConfig) {
        this.courtViewManager.updateConfiguration(newConfig);
        this.videoProcessor.updateConfiguration(newConfig);
        if (this.currentSession) {
            this.currentSession.outputConfig = { ...this.currentSession.outputConfig, ...newConfig };
        }
        console.log('VideoOutputService configuration updated:', newConfig);
    }
    /**
     * Get current session status
     */
    getSessionStatus() {
        const duration = this.currentSession ? this.getSessionDuration(this.currentSession) : 0;
        return {
            isRecording: this.isRecording,
            sessionId: this.currentSession?.sessionId,
            duration,
            totalFrames: this.currentSession?.totalFrames || 0,
            currentCamera: this.courtViewManager.getCurrentActiveCamera(),
            switchCount: this.courtViewManager.getSwitchHistory().length,
            ballPositions: this.currentSession?.ballTrajectory.length || 0,
            performance: this.videoProcessor.getPerformanceStats()
        };
    }
    /**
     * Generate comprehensive session report
     */
    generateSessionReport(session) {
        const targetSession = session || this.currentSession;
        if (!targetSession) {
            return 'No session data available';
        }
        const duration = this.getSessionDuration(targetSession);
        const stats = targetSession.statistics;
        let report = `# Video Output Session Report\n\n`;
        report += `## Session Overview\n`;
        report += `- **Session ID:** ${targetSession.sessionId}\n`;
        report += `- **Duration:** ${duration.toFixed(2)} seconds\n`;
        report += `- **Total Frames:** ${targetSession.totalFrames}\n`;
        report += `- **Average FPS:** ${stats.averageFPS.toFixed(1)}\n`;
        report += `- **Output Mode:** ${targetSession.outputConfig.mode}\n\n`;
        report += `## Camera Usage\n`;
        Object.entries(stats.cameraUsage).forEach(([cameraId, usage]) => {
            report += `- **${cameraId}:** ${usage.totalTime.toFixed(1)}s (${usage.percentage.toFixed(1)}%), ${usage.switchCount} switches\n`;
        });
        report += `\n## Switching Performance\n`;
        report += `- **Total Switches:** ${stats.switchStatistics.totalSwitches}\n`;
        report += `- **Average Switch Interval:** ${stats.switchStatistics.averageSwitchInterval.toFixed(2)}s\n`;
        report += `- **Smooth Transitions:** ${stats.switchStatistics.smoothTransitions} (${((stats.switchStatistics.smoothTransitions / stats.switchStatistics.totalSwitches) * 100).toFixed(1)}%)\n`;
        report += `- **Jarring Transitions:** ${stats.switchStatistics.jarringTransitions}\n`;
        report += `\n## Ball Tracking\n`;
        report += `- **Total Ball Positions:** ${stats.ballTracking.totalBallPositions}\n`;
        report += `- **Tracking Accuracy:** ${(stats.ballTracking.trackingAccuracy * 100).toFixed(1)}%\n`;
        report += `- **Court Coverage:** ${stats.ballTracking.courtCoverage.toFixed(1)}%\n`;
        report += `\n## Performance\n`;
        report += `- **Average Processing Time:** ${stats.performance.averageProcessingTime.toFixed(2)}ms per frame\n`;
        report += `- **Dropped Frames:** ${stats.performance.droppedFrames}\n`;
        report += `- **Memory Usage:** ${stats.performance.memoryUsage.toFixed(1)}MB\n`;
        // Add switching analysis
        const switchingAnalysis = this.courtViewManager.analyzeSwitchingPerformance();
        report += `\n## Switching Analysis\n`;
        report += `- **Camera Usage Balance:** ${(switchingAnalysis.cameraUsageBalance * 100).toFixed(1)}%\n`;
        if (switchingAnalysis.recommendations.length > 0) {
            report += `\n## Recommendations\n`;
            switchingAnalysis.recommendations.forEach(rec => {
                report += `- ${rec}\n`;
            });
        }
        return report;
    }
    /**
     * Export session data for external processing
     */
    exportSession(session) {
        const targetSession = session || this.currentSession;
        if (!targetSession) {
            throw new Error('No session to export');
        }
        const exportData = {
            sessionInfo: {
                sessionId: targetSession.sessionId,
                startTime: targetSession.startTime.toISOString(),
                endTime: targetSession.endTime?.toISOString(),
                duration: this.getSessionDuration(targetSession)
            },
            outputConfiguration: targetSession.outputConfig,
            ballTrajectory: targetSession.ballTrajectory,
            switchHistory: targetSession.switchHistory,
            statistics: targetSession.statistics,
            exportedAt: new Date().toISOString()
        };
        return JSON.stringify(exportData, null, 2);
    }
    /**
     * Validate system readiness for recording
     */
    validateSystemReadiness() {
        // Check court coverage
        const coverage = this.courtCoverageService.validateCoverage();
        if (!coverage.isComplete) {
            throw new Error('Incomplete court coverage - cannot start recording');
        }
        // Check sync status
        const syncStatus = this.syncService.getSyncStatus();
        if (!syncStatus.isCalibrated) {
            throw new Error('Camera synchronization not calibrated - cannot start recording');
        }
        // Check position tracking
        const trackingStats = this.positionTracker.getTrackingStats();
        if (!trackingStats.coverageValidation.isComplete) {
            console.warn('Position tracking coverage is incomplete');
        }
    }
    /**
     * Initialize session statistics
     */
    initializeStatistics() {
        return {
            totalDuration: 0,
            frameCount: 0,
            averageFPS: 0,
            cameraUsage: {},
            switchStatistics: {
                totalSwitches: 0,
                averageSwitchInterval: 0,
                smoothTransitions: 0,
                jarringTransitions: 0
            },
            ballTracking: {
                totalBallPositions: 0,
                trackingAccuracy: 0,
                courtCoverage: 0
            },
            performance: {
                averageProcessingTime: 0,
                droppedFrames: 0,
                memoryUsage: 0
            }
        };
    }
    /**
     * Calculate final session statistics
     */
    calculateFinalStatistics(trackingStats) {
        if (!this.currentSession) {
            return this.initializeStatistics();
        }
        const duration = this.getSessionDuration(this.currentSession);
        const performanceStats = this.videoProcessor.getPerformanceStats();
        const switchingAnalysis = this.courtViewManager.analyzeSwitchingPerformance();
        // Calculate camera usage
        const cameraUsage = {};
        this.currentSession.switchHistory.forEach(switchEvent => {
            if (!cameraUsage[switchEvent.fromCamera]) {
                cameraUsage[switchEvent.fromCamera] = {
                    totalTime: 0,
                    percentage: 0,
                    switchCount: 0
                };
            }
            cameraUsage[switchEvent.fromCamera].switchCount++;
        });
        // Distribute time based on switch events
        const totalSwitches = this.currentSession.switchHistory.length;
        Object.keys(cameraUsage).forEach(cameraId => {
            cameraUsage[cameraId].totalTime = duration / Object.keys(cameraUsage).length;
            cameraUsage[cameraId].percentage = 100 / Object.keys(cameraUsage).length;
        });
        return {
            totalDuration: duration,
            frameCount: this.currentSession.totalFrames,
            averageFPS: duration > 0 ? this.currentSession.totalFrames / duration : 0,
            cameraUsage,
            switchStatistics: {
                totalSwitches: switchingAnalysis.totalSwitches,
                averageSwitchInterval: switchingAnalysis.averageSwitchInterval,
                smoothTransitions: switchingAnalysis.smoothTransitions,
                jarringTransitions: switchingAnalysis.jarringTransitions
            },
            ballTracking: {
                totalBallPositions: this.currentSession.ballTrajectory.length,
                trackingAccuracy: trackingStats.trackingAccuracy || 0,
                courtCoverage: trackingStats.coverageValidation?.coveragePercent || 0
            },
            performance: {
                averageProcessingTime: performanceStats.averageProcessingTime,
                droppedFrames: performanceStats.droppedFrames,
                memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
            }
        };
    }
    /**
     * Calculate session duration in seconds
     */
    getSessionDuration(session) {
        const endTime = session.endTime || new Date();
        return (endTime.getTime() - session.startTime.getTime()) / 1000;
    }
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `video_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.VideoOutputService = VideoOutputService;
// Default configuration optimized for Padel court recording
VideoOutputService.DEFAULT_CONFIG = {
    mode: 'follow_ball',
    resolution: { width: 1920, height: 1080 },
    fps: 60,
    bitrate: 8000000, // 8 Mbps
    enableOverlays: true,
    overlayConfig: {
        showBallMarker: true,
        showCourtLines: false,
        showCameraIndicator: true,
        showZoneHighlight: false,
        ballMarkerStyle: {
            color: '#FFFF00', // Yellow
            size: 20,
            opacity: 0.8,
            strokeWidth: 3,
            fillColor: '#FFFF0080'
        },
        courtLineStyle: {
            color: '#FFFFFF',
            size: 2,
            opacity: 0.6,
            strokeWidth: 2
        }
    },
    transitionConfig: {
        enableSmoothing: true,
        transitionDuration: 300, // 300ms
        transitionType: 'fade',
        minSwitchInterval: 1000 // 1 second
    }
};
//# sourceMappingURL=VideoOutputService.js.map