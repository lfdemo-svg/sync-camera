"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BallTracker = void 0;
class BallTracker {
    constructor(motionModel) {
        this.activeTracks = new Map();
        this.nextTrackId = 1;
        // Tracking parameters
        this.MAX_DISTANCE_THRESHOLD = 2.0; // 2 meters max distance between detections
        this.MAX_TIME_GAP = 500; // 500ms max gap between detections
        this.MIN_TRACK_LENGTH = 3; // Minimum detections for valid track
        this.motionModel = { ...BallTracker.DEFAULT_MOTION_MODEL, ...motionModel };
        console.log('BallTracker initialized with motion model:', this.motionModel);
    }
    /**
     * Update tracks with new detections
     */
    updateTracks(detections) {
        const timestamp = detections.length > 0 ? detections[0].timestamp : Date.now();
        // Remove expired tracks
        this.cleanupExpiredTracks(timestamp);
        // Associate detections with existing tracks
        const { associated, unassociated } = this.associateDetections(detections);
        // Update existing tracks
        associated.forEach(({ track, detection }) => {
            this.updateTrack(track, detection);
        });
        // Create new tracks for unassociated detections
        unassociated.forEach(detection => {
            if (detection.confidence > 0.7) { // Only create tracks for high-confidence detections
                this.createNewTrack(detection);
            }
        });
        // Predict positions for active tracks
        this.predictTrackPositions(timestamp);
        return Array.from(this.activeTracks.values());
    }
    /**
     * Get the best current ball track
     */
    getBestTrack() {
        const activeTracks = Array.from(this.activeTracks.values())
            .filter(track => track.isActive);
        if (activeTracks.length === 0) {
            return null;
        }
        // Sort by quality and recency
        return activeTracks.sort((a, b) => {
            const qualityScore = { excellent: 4, good: 3, fair: 2, poor: 1 };
            const aScore = qualityScore[a.trackQuality] + (a.ballDetections.length / 10);
            const bScore = qualityScore[b.trackQuality] + (b.ballDetections.length / 10);
            return bScore - aScore;
        })[0];
    }
    /**
     * Get current ball position (latest from best track)
     */
    getCurrentBallPosition() {
        const bestTrack = this.getBestTrack();
        if (!bestTrack || bestTrack.ballDetections.length === 0) {
            return null;
        }
        const latestDetection = bestTrack.ballDetections[bestTrack.ballDetections.length - 1];
        return latestDetection.courtPosition;
    }
    /**
     * Predict ball position at future timestamp
     */
    predictBallPosition(timestamp) {
        const bestTrack = this.getBestTrack();
        if (!bestTrack || bestTrack.ballDetections.length < 2) {
            return null;
        }
        return this.predictPositionWithPhysics(bestTrack, timestamp);
    }
    /**
     * Get all active tracks
     */
    getActiveTracks() {
        return Array.from(this.activeTracks.values()).filter(track => track.isActive);
    }
    /**
     * Clear all tracks
     */
    clearTracks() {
        this.activeTracks.clear();
        this.nextTrackId = 1;
        console.log('All ball tracks cleared');
    }
    /**
     * Get tracking statistics
     */
    getTrackingStats() {
        const allTracks = Array.from(this.activeTracks.values());
        const activeTracks = allTracks.filter(track => track.isActive);
        const avgTrackLength = allTracks.length > 0 ?
            allTracks.reduce((sum, track) => sum + track.ballDetections.length, 0) / allTracks.length : 0;
        const bestTrack = this.getBestTrack();
        const bestTrackQuality = bestTrack?.trackQuality || 'none';
        // Calculate tracking accuracy based on detection consistency
        const trackingAccuracy = this.calculateTrackingAccuracy();
        return {
            totalTracks: allTracks.length,
            activeTracks: activeTracks.length,
            avgTrackLength,
            bestTrackQuality,
            trackingAccuracy
        };
    }
    /**
     * Associate detections with existing tracks
     */
    associateDetections(detections) {
        const associated = [];
        const unassociated = [];
        const usedTracks = new Set();
        // Sort detections by confidence (highest first)
        const sortedDetections = [...detections].sort((a, b) => b.confidence - a.confidence);
        sortedDetections.forEach(detection => {
            const bestMatch = this.findBestTrackMatch(detection, usedTracks);
            if (bestMatch) {
                associated.push({ track: bestMatch, detection });
                usedTracks.add(bestMatch.trackId);
            }
            else {
                unassociated.push(detection);
            }
        });
        return { associated, unassociated };
    }
    /**
     * Find best matching track for a detection
     */
    findBestTrackMatch(detection, usedTracks) {
        let bestTrack = null;
        let bestDistance = Number.MAX_VALUE;
        this.activeTracks.forEach(track => {
            if (!track.isActive || usedTracks.has(track.trackId)) {
                return;
            }
            const lastDetection = track.ballDetections[track.ballDetections.length - 1];
            if (detection.timestamp - lastDetection.timestamp > this.MAX_TIME_GAP) {
                return;
            }
            // Calculate predicted position at detection time
            const predicted = track.predictedNextPosition || lastDetection.courtPosition;
            const distance = this.calculateDistance(predicted, detection.courtPosition);
            if (distance <= this.MAX_DISTANCE_THRESHOLD && distance < bestDistance) {
                bestDistance = distance;
                bestTrack = track;
            }
        });
        return bestTrack;
    }
    /**
     * Create new track from detection
     */
    createNewTrack(detection) {
        const trackId = `track_${this.nextTrackId++}`;
        const track = {
            trackId,
            ballDetections: [detection],
            startTime: detection.timestamp,
            isActive: true,
            velocity: { x: 0, y: 0 },
            acceleration: { x: 0, y: 0 },
            trackQuality: 'fair' // Start with fair quality
        };
        this.activeTracks.set(trackId, track);
        console.log(`Created new ball track: ${trackId}`);
        return track;
    }
    /**
     * Update existing track with new detection
     */
    updateTrack(track, detection) {
        track.ballDetections.push(detection);
        track.endTime = detection.timestamp;
        // Update velocity and acceleration
        this.updateTrackMotion(track);
        // Update track quality
        track.trackQuality = this.assessTrackQuality(track);
        console.log(`Updated track ${track.trackId}: ${track.ballDetections.length} detections, quality: ${track.trackQuality}`);
    }
    /**
     * Update track motion parameters
     */
    updateTrackMotion(track) {
        const detections = track.ballDetections;
        if (detections.length < 2) {
            return;
        }
        const latest = detections[detections.length - 1];
        const previous = detections[detections.length - 2];
        // Calculate time delta in seconds
        const dt = (latest.timestamp - previous.timestamp) / 1000;
        if (dt <= 0)
            return;
        // Calculate velocity
        const dx = latest.courtPosition.x - previous.courtPosition.x;
        const dy = latest.courtPosition.y - previous.courtPosition.y;
        const newVelocity = {
            x: dx / dt,
            y: dy / dt
        };
        // Calculate acceleration if we have previous velocity
        if (detections.length >= 3) {
            const prevPrevious = detections[detections.length - 3];
            const prevDt = (previous.timestamp - prevPrevious.timestamp) / 1000;
            if (prevDt > 0) {
                const prevDx = previous.courtPosition.x - prevPrevious.courtPosition.x;
                const prevDy = previous.courtPosition.y - prevPrevious.courtPosition.y;
                const prevVelocity = { x: prevDx / prevDt, y: prevDy / prevDt };
                track.acceleration = {
                    x: (newVelocity.x - prevVelocity.x) / dt,
                    y: (newVelocity.y - prevVelocity.y) / dt
                };
            }
        }
        track.velocity = newVelocity;
    }
    /**
     * Assess track quality based on consistency and length
     */
    assessTrackQuality(track) {
        const detectionCount = track.ballDetections.length;
        const duration = track.endTime ? track.endTime - track.startTime : 0;
        // Calculate average confidence
        const avgConfidence = track.ballDetections.reduce((sum, det) => sum + det.confidence, 0) / detectionCount;
        // Calculate motion consistency
        const motionConsistency = this.calculateMotionConsistency(track);
        // Determine quality based on multiple factors
        if (detectionCount >= 10 && avgConfidence >= 0.8 && motionConsistency >= 0.8) {
            return 'excellent';
        }
        else if (detectionCount >= 6 && avgConfidence >= 0.7 && motionConsistency >= 0.6) {
            return 'good';
        }
        else if (detectionCount >= 3 && avgConfidence >= 0.6 && motionConsistency >= 0.4) {
            return 'fair';
        }
        else {
            return 'poor';
        }
    }
    /**
     * Calculate motion consistency for track quality assessment
     */
    calculateMotionConsistency(track) {
        if (track.ballDetections.length < 3) {
            return 1.0;
        }
        let totalDeviation = 0;
        let comparisons = 0;
        // Check velocity consistency between consecutive segments
        for (let i = 2; i < track.ballDetections.length; i++) {
            const current = track.ballDetections[i];
            const previous = track.ballDetections[i - 1];
            const prevPrev = track.ballDetections[i - 2];
            const dt1 = (previous.timestamp - prevPrev.timestamp) / 1000;
            const dt2 = (current.timestamp - previous.timestamp) / 1000;
            if (dt1 > 0 && dt2 > 0) {
                const vel1 = {
                    x: (previous.courtPosition.x - prevPrev.courtPosition.x) / dt1,
                    y: (previous.courtPosition.y - prevPrev.courtPosition.y) / dt1
                };
                const vel2 = {
                    x: (current.courtPosition.x - previous.courtPosition.x) / dt2,
                    y: (current.courtPosition.y - previous.courtPosition.y) / dt2
                };
                const velocityDiff = Math.sqrt(Math.pow(vel2.x - vel1.x, 2) + Math.pow(vel2.y - vel1.y, 2));
                totalDeviation += velocityDiff / this.motionModel.maxVelocity;
                comparisons++;
            }
        }
        const avgDeviation = comparisons > 0 ? totalDeviation / comparisons : 0;
        return Math.max(0, 1 - avgDeviation);
    }
    /**
     * Predict track positions for current timestamp
     */
    predictTrackPositions(currentTime) {
        this.activeTracks.forEach(track => {
            if (track.isActive && track.ballDetections.length > 0) {
                track.predictedNextPosition = this.predictPositionWithPhysics(track, currentTime + 33); // Predict 33ms ahead (~2 frames at 60fps)
            }
        });
    }
    /**
     * Predict position using physics-based motion model
     */
    predictPositionWithPhysics(track, futureTime) {
        const latestDetection = track.ballDetections[track.ballDetections.length - 1];
        const dt = (futureTime - latestDetection.timestamp) / 1000; // Convert to seconds
        if (dt <= 0) {
            return latestDetection.courtPosition;
        }
        const { x: x0, y: y0 } = latestDetection.courtPosition;
        const { x: vx, y: vy } = track.velocity;
        const { x: ax, y: ay } = track.acceleration;
        // Apply physics equations of motion
        let predictedX = x0 + vx * dt + 0.5 * ax * dt * dt;
        let predictedY = y0 + vy * dt + 0.5 * (ay - this.motionModel.gravity) * dt * dt;
        // Apply air resistance (simplified)
        const airResistanceFactor = Math.exp(-this.motionModel.airResistance * dt);
        predictedX *= airResistanceFactor;
        predictedY *= airResistanceFactor;
        return { x: predictedX, y: predictedY };
    }
    /**
     * Clean up expired tracks
     */
    cleanupExpiredTracks(currentTime) {
        const expiredTracks = [];
        this.activeTracks.forEach((track, trackId) => {
            const lastDetection = track.ballDetections[track.ballDetections.length - 1];
            const timeSinceLastDetection = currentTime - lastDetection.timestamp;
            if (timeSinceLastDetection > this.MAX_TIME_GAP * 3) { // 3x the normal gap
                track.isActive = false;
                track.endTime = lastDetection.timestamp;
                // Remove poor quality tracks, keep good ones for analysis
                if (track.trackQuality === 'poor' || track.ballDetections.length < this.MIN_TRACK_LENGTH) {
                    expiredTracks.push(trackId);
                }
            }
        });
        expiredTracks.forEach(trackId => {
            this.activeTracks.delete(trackId);
            console.log(`Removed expired track: ${trackId}`);
        });
    }
    /**
     * Calculate distance between two points
     */
    calculateDistance(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    /**
     * Calculate overall tracking accuracy
     */
    calculateTrackingAccuracy() {
        const activeTracks = Array.from(this.activeTracks.values()).filter(track => track.isActive);
        if (activeTracks.length === 0) {
            return 0;
        }
        let totalAccuracy = 0;
        activeTracks.forEach(track => {
            const avgConfidence = track.ballDetections.reduce((sum, det) => sum + det.confidence, 0) / track.ballDetections.length;
            const motionConsistency = this.calculateMotionConsistency(track);
            const trackAccuracy = (avgConfidence * 0.6) + (motionConsistency * 0.4);
            totalAccuracy += trackAccuracy;
        });
        return totalAccuracy / activeTracks.length;
    }
}
exports.BallTracker = BallTracker;
// Default motion model for Padel ball physics
BallTracker.DEFAULT_MOTION_MODEL = {
    type: 'ballistic',
    gravity: 9.81, // m/s²
    airResistance: 0.05, // Air resistance coefficient
    bounceCoefficient: 0.8, // Energy retention on bounce
    maxVelocity: 50 // 50 m/s maximum realistic velocity
};
//# sourceMappingURL=BallTracker.js.map