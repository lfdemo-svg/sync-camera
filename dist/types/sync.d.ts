export interface VideoFrame {
    timestamp: number;
    cameraId: string;
    frameNumber: number;
    data: Buffer | ArrayBuffer;
    metadata: FrameMetadata;
}
export interface FrameMetadata {
    width: number;
    height: number;
    fps: number;
    capturedAt: number;
    receivedAt: number;
    format: 'rgb' | 'bgr' | 'yuv420' | 'h264';
}
export interface SyncEvent {
    eventId: string;
    eventType: 'led_flash' | 'audio_beep' | 'manual_trigger' | 'qr_code';
    triggeredAt: number;
    detectedFrames: {
        cameraId: string;
        frameNumber: number;
        detectionTimestamp: number;
        confidence: number;
    }[];
    description: string;
}
export interface SyncCalibration {
    sessionId: string;
    syncEvents: SyncEvent[];
    cameraOffsets: Map<string, number>;
    calibratedAt: Date;
    accuracy: number;
    driftRate: number;
    isValid: boolean;
}
export interface BufferConfiguration {
    maxBufferSize: number;
    targetLatency: number;
    maxJitter: number;
    dropThreshold: number;
    resyncThreshold: number;
}
export interface FrameBuffer {
    cameraId: string;
    frames: Map<number, VideoFrame>;
    maxSize: number;
    oldestTimestamp: number;
    newestTimestamp: number;
    droppedFrames: number;
    bufferHealth: BufferHealth;
}
export interface BufferHealth {
    currentSize: number;
    utilizationPercent: number;
    averageLatency: number;
    jitter: number;
    droppedFrameRate: number;
    lastHealthCheck: Date;
}
export interface SyncMetrics {
    sessionId: string;
    startTime: Date;
    totalFramesProcessed: Map<string, number>;
    syncAccuracy: number;
    driftDetected: boolean;
    lastResyncAt?: Date;
    bufferStates: Map<string, BufferHealth>;
    recommendations: string[];
}
//# sourceMappingURL=sync.d.ts.map