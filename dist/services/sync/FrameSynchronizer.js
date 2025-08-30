"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameSynchronizer = void 0;
class FrameSynchronizer {
    constructor(cameraIds, config) {
        this.frameBuffers = new Map();
        this.isRecording = false;
        this.config = { ...FrameSynchronizer.DEFAULT_CONFIG, ...config };
        // Initialize frame buffers for each camera
        cameraIds.forEach(cameraId => {
            this.frameBuffers.set(cameraId, this.createFrameBuffer(cameraId));
        });
        // Initialize metrics
        this.metrics = {
            sessionId: this.generateSessionId(),
            startTime: new Date(),
            totalFramesProcessed: new Map(cameraIds.map(id => [id, 0])),
            syncAccuracy: 0,
            driftDetected: false,
            bufferStates: new Map(),
            recommendations: []
        };
        console.log(`FrameSynchronizer initialized for cameras: ${cameraIds.join(', ')}`);
    }
    /**
     * Start synchronization calibration process
     */
    async startSyncCalibration() {
        const sessionId = this.generateSessionId();
        console.log(`Starting sync calibration session: ${sessionId}`);
        console.log('Waiting for sync events (LED flash, audio beep, etc.)...');
        return sessionId;
    }
    /**
     * Record a sync event for calibration
     */
    recordSyncEvent(eventType, description = '') {
        const syncEvent = {
            eventId: this.generateEventId(),
            eventType,
            triggeredAt: Date.now(),
            detectedFrames: [],
            description: description || `${eventType} sync event`
        };
        console.log(`Sync event recorded: ${syncEvent.eventId} (${eventType})`);
        return syncEvent;
    }
    /**
     * Add detected sync event in a camera frame
     */
    addSyncDetection(eventId, cameraId, frameNumber, detectionTimestamp, confidence = 1.0) {
        // In a real implementation, this would update the sync event
        // For now, just log the detection
        console.log(`Sync detected in ${cameraId} frame ${frameNumber} at ${detectionTimestamp} (confidence: ${confidence})`);
        return true;
    }
    /**
     * Complete sync calibration and calculate camera offsets
     */
    completeSyncCalibration(syncEvents) {
        const cameraOffsets = new Map();
        let totalAccuracy = 0;
        let validEvents = 0;
        // Calculate offsets based on sync events
        syncEvents.forEach(event => {
            if (event.detectedFrames.length >= 2) {
                // Use first camera as reference
                const referenceFrame = event.detectedFrames[0];
                event.detectedFrames.slice(1).forEach(frame => {
                    const offset = referenceFrame.detectionTimestamp - frame.detectionTimestamp;
                    cameraOffsets.set(frame.cameraId, offset);
                    // Calculate accuracy (simplified)
                    totalAccuracy += Math.abs(offset);
                    validEvents++;
                });
            }
        });
        const avgAccuracy = validEvents > 0 ? totalAccuracy / validEvents : 0;
        const calibration = {
            sessionId: this.generateSessionId(),
            syncEvents,
            cameraOffsets,
            calibratedAt: new Date(),
            accuracy: avgAccuracy,
            driftRate: 0, // Would be calculated from multiple calibrations over time
            isValid: avgAccuracy <= this.config.maxJitter
        };
        this.syncCalibration = calibration;
        console.log(`Sync calibration completed:`);
        console.log(`- Accuracy: ${avgAccuracy.toFixed(2)} ms`);
        console.log(`- Camera offsets:`, Object.fromEntries(cameraOffsets));
        console.log(`- Valid: ${calibration.isValid ? '✅' : '❌'}`);
        return calibration;
    }
    /**
     * Add frame to buffer with timestamp-based indexing
     */
    addFrame(frame) {
        const buffer = this.frameBuffers.get(frame.cameraId);
        if (!buffer) {
            console.error(`Buffer not found for camera: ${frame.cameraId}`);
            return false;
        }
        // Apply sync offset if calibrated
        let adjustedTimestamp = frame.timestamp;
        if (this.syncCalibration?.cameraOffsets.has(frame.cameraId)) {
            const offset = this.syncCalibration.cameraOffsets.get(frame.cameraId);
            adjustedTimestamp = frame.timestamp + offset;
        }
        // Check if frame is too old (should be dropped)
        const now = Date.now();
        if (now - adjustedTimestamp > this.config.dropThreshold) {
            buffer.droppedFrames++;
            console.warn(`Dropping old frame from ${frame.cameraId}: ${now - adjustedTimestamp}ms old`);
            return false;
        }
        // Store frame with adjusted timestamp
        const adjustedFrame = { ...frame, timestamp: adjustedTimestamp };
        buffer.frames.set(adjustedTimestamp, adjustedFrame);
        // Update buffer bounds
        if (buffer.frames.size === 1) {
            buffer.oldestTimestamp = adjustedTimestamp;
            buffer.newestTimestamp = adjustedTimestamp;
        }
        else {
            buffer.oldestTimestamp = Math.min(buffer.oldestTimestamp, adjustedTimestamp);
            buffer.newestTimestamp = Math.max(buffer.newestTimestamp, adjustedTimestamp);
        }
        // Enforce buffer size limit
        this.enforceBufferLimit(buffer);
        // Update metrics
        const currentCount = this.metrics.totalFramesProcessed.get(frame.cameraId) || 0;
        this.metrics.totalFramesProcessed.set(frame.cameraId, currentCount + 1);
        return true;
    }
    /**
     * Get synchronized frames for a specific timestamp
     */
    getSynchronizedFrames(targetTimestamp, toleranceMs = 8) {
        const synchronizedFrames = new Map();
        this.frameBuffers.forEach((buffer, cameraId) => {
            const frame = this.findClosestFrame(buffer, targetTimestamp, toleranceMs);
            if (frame) {
                synchronizedFrames.set(cameraId, frame);
            }
        });
        return synchronizedFrames;
    }
    /**
     * Get the best synchronized frame pair from both cameras
     */
    getBestSyncFramePair() {
        if (this.frameBuffers.size < 2) {
            return null;
        }
        // Find common timestamp range
        let maxOldest = 0;
        let minNewest = Number.MAX_SAFE_INTEGER;
        this.frameBuffers.forEach(buffer => {
            if (buffer.frames.size > 0) {
                maxOldest = Math.max(maxOldest, buffer.oldestTimestamp);
                minNewest = Math.min(minNewest, buffer.newestTimestamp);
            }
        });
        if (maxOldest >= minNewest) {
            return null; // No overlap
        }
        // Find best timestamp with frames from all cameras
        const targetTimestamp = maxOldest + this.config.targetLatency;
        const frames = this.getSynchronizedFrames(targetTimestamp);
        if (frames.size === this.frameBuffers.size) {
            return { timestamp: targetTimestamp, frames };
        }
        return null;
    }
    /**
     * Start recording session with continuous sync monitoring
     */
    startRecording() {
        if (this.isRecording) {
            console.warn('Recording already in progress');
            return;
        }
        this.isRecording = true;
        this.metrics.startTime = new Date();
        // Start periodic sync health monitoring
        this.syncCheckInterval = setInterval(() => {
            this.performSyncHealthCheck();
        }, 1000); // Check every second
        console.log('Recording started with sync monitoring');
    }
    /**
     * Stop recording session
     */
    stopRecording() {
        this.isRecording = false;
        if (this.syncCheckInterval) {
            clearInterval(this.syncCheckInterval);
            this.syncCheckInterval = undefined;
        }
        // Perform final metrics calculation
        this.updateMetrics();
        console.log('Recording stopped');
        console.log('Final sync metrics:', this.metrics);
        return { ...this.metrics };
    }
    /**
     * Get current synchronization status
     */
    getSyncStatus() {
        const bufferHealth = new Map();
        this.frameBuffers.forEach((buffer, cameraId) => {
            bufferHealth.set(cameraId, this.calculateBufferHealth(buffer));
        });
        return {
            isCalibrated: !!this.syncCalibration?.isValid,
            accuracy: this.syncCalibration?.accuracy || 0,
            bufferHealth,
            recommendations: this.generateRecommendations()
        };
    }
    /**
     * Force resynchronization if drift is detected
     */
    async forceResync() {
        console.log('Forcing resynchronization...');
        // Clear existing calibration
        this.syncCalibration = undefined;
        // In real implementation, would trigger new calibration sequence
        console.log('Resync completed - new calibration required');
        this.metrics.lastResyncAt = new Date();
        return true;
    }
    /**
     * Create frame buffer for a camera
     */
    createFrameBuffer(cameraId) {
        return {
            cameraId,
            frames: new Map(),
            maxSize: this.config.maxBufferSize,
            oldestTimestamp: 0,
            newestTimestamp: 0,
            droppedFrames: 0,
            bufferHealth: {
                currentSize: 0,
                utilizationPercent: 0,
                averageLatency: 0,
                jitter: 0,
                droppedFrameRate: 0,
                lastHealthCheck: new Date()
            }
        };
    }
    /**
     * Find closest frame to target timestamp within tolerance
     */
    findClosestFrame(buffer, targetTimestamp, toleranceMs) {
        let closestFrame = null;
        let closestDistance = Number.MAX_SAFE_INTEGER;
        buffer.frames.forEach((frame, timestamp) => {
            const distance = Math.abs(timestamp - targetTimestamp);
            if (distance <= toleranceMs && distance < closestDistance) {
                closestDistance = distance;
                closestFrame = frame;
            }
        });
        return closestFrame;
    }
    /**
     * Enforce buffer size limits by removing old frames
     */
    enforceBufferLimit(buffer) {
        if (buffer.frames.size <= buffer.maxSize) {
            return;
        }
        // Remove oldest frames first
        const timestamps = Array.from(buffer.frames.keys()).sort((a, b) => a - b);
        const framesToRemove = timestamps.slice(0, buffer.frames.size - buffer.maxSize);
        framesToRemove.forEach(timestamp => {
            buffer.frames.delete(timestamp);
        });
        // Update buffer bounds
        if (buffer.frames.size > 0) {
            const remainingTimestamps = Array.from(buffer.frames.keys());
            buffer.oldestTimestamp = Math.min(...remainingTimestamps);
            buffer.newestTimestamp = Math.max(...remainingTimestamps);
        }
    }
    /**
     * Calculate buffer health metrics
     */
    calculateBufferHealth(buffer) {
        const currentSize = buffer.frames.size;
        const utilizationPercent = (currentSize / buffer.maxSize) * 100;
        // Calculate average latency and jitter
        const now = Date.now();
        const latencies = [];
        buffer.frames.forEach(frame => {
            latencies.push(now - frame.timestamp);
        });
        const averageLatency = latencies.length > 0 ?
            latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length : 0;
        const jitter = latencies.length > 1 ?
            Math.sqrt(latencies.reduce((sum, lat) => sum + Math.pow(lat - averageLatency, 2), 0) / latencies.length) : 0;
        return {
            currentSize,
            utilizationPercent,
            averageLatency,
            jitter,
            droppedFrameRate: buffer.droppedFrames / Math.max(1, currentSize + buffer.droppedFrames),
            lastHealthCheck: new Date()
        };
    }
    /**
     * Perform periodic sync health check
     */
    performSyncHealthCheck() {
        if (!this.isRecording)
            return;
        // Update buffer health metrics
        this.frameBuffers.forEach((buffer, cameraId) => {
            buffer.bufferHealth = this.calculateBufferHealth(buffer);
        });
        // Check for sync drift
        this.checkSyncDrift();
        // Update overall metrics
        this.updateMetrics();
    }
    /**
     * Check for synchronization drift
     */
    checkSyncDrift() {
        // Simplified drift detection - in reality would analyze frame timestamp patterns
        const bufferHealthValues = Array.from(this.frameBuffers.values()).map(b => b.bufferHealth);
        if (bufferHealthValues.length >= 2) {
            const latencies = bufferHealthValues.map(h => h.averageLatency);
            const maxLatencyDiff = Math.max(...latencies) - Math.min(...latencies);
            if (maxLatencyDiff > this.config.resyncThreshold) {
                this.metrics.driftDetected = true;
                console.warn(`Sync drift detected: ${maxLatencyDiff.toFixed(2)}ms difference between cameras`);
            }
        }
    }
    /**
     * Update overall sync metrics
     */
    updateMetrics() {
        const bufferStates = new Map();
        let totalAccuracy = 0;
        let validBuffers = 0;
        this.frameBuffers.forEach((buffer, cameraId) => {
            const health = this.calculateBufferHealth(buffer);
            bufferStates.set(cameraId, health);
            if (health.currentSize > 0) {
                totalAccuracy += health.jitter;
                validBuffers++;
            }
        });
        this.metrics.bufferStates = bufferStates;
        this.metrics.syncAccuracy = validBuffers > 0 ? totalAccuracy / validBuffers : 0;
        this.metrics.recommendations = this.generateRecommendations();
    }
    /**
     * Generate sync optimization recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        if (!this.syncCalibration) {
            recommendations.push('Perform sync calibration before recording');
        }
        else if (!this.syncCalibration.isValid) {
            recommendations.push(`Sync accuracy poor (${this.syncCalibration.accuracy.toFixed(2)}ms) - recalibrate`);
        }
        if (this.metrics.driftDetected) {
            recommendations.push('Sync drift detected - consider forced resynchronization');
        }
        this.frameBuffers.forEach((buffer, cameraId) => {
            const health = buffer.bufferHealth;
            if (health.utilizationPercent > 90) {
                recommendations.push(`${cameraId} buffer nearly full (${health.utilizationPercent.toFixed(1)}%)`);
            }
            if (health.droppedFrameRate > 0.05) {
                recommendations.push(`${cameraId} dropping frames (${(health.droppedFrameRate * 100).toFixed(1)}%)`);
            }
            if (health.jitter > this.config.maxJitter) {
                recommendations.push(`${cameraId} high jitter (${health.jitter.toFixed(2)}ms)`);
            }
        });
        return recommendations;
    }
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Get all camera IDs
     */
    getAllCameras() {
        return Array.from(this.frameBuffers.keys());
    }
    /**
     * Generate unique event ID
     */
    generateEventId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.FrameSynchronizer = FrameSynchronizer;
// Default configuration optimized for Padel court recording
FrameSynchronizer.DEFAULT_CONFIG = {
    maxBufferSize: 300, // ~5 seconds at 60fps
    targetLatency: 50, // 50ms target latency
    maxJitter: 16, // 1 frame at 60fps
    dropThreshold: 200, // Drop frames older than 200ms
    resyncThreshold: 100 // Resync if drift exceeds 100ms
};
//# sourceMappingURL=FrameSynchronizer.js.map