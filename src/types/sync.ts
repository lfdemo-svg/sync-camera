export interface VideoFrame {
  timestamp: number; // Milliseconds since epoch
  cameraId: string;
  frameNumber: number;
  data: Buffer | ArrayBuffer; // Frame image data
  metadata: FrameMetadata;
}

export interface FrameMetadata {
  width: number;
  height: number;
  fps: number;
  capturedAt: number; // Hardware capture timestamp
  receivedAt: number; // System received timestamp
  format: 'rgb' | 'bgr' | 'yuv420' | 'h264';
}

export interface SyncEvent {
  eventId: string;
  eventType: 'led_flash' | 'audio_beep' | 'manual_trigger' | 'qr_code';
  triggeredAt: number; // Master timestamp
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
  cameraOffsets: Map<string, number>; // Camera ID -> offset in ms
  calibratedAt: Date;
  accuracy: number; // Average sync accuracy in ms
  driftRate: number; // ms per hour
  isValid: boolean;
}

export interface BufferConfiguration {
  maxBufferSize: number; // Maximum frames to buffer
  targetLatency: number; // Target buffering latency in ms
  maxJitter: number; // Maximum acceptable jitter in ms
  dropThreshold: number; // Drop frames after this delay in ms
  resyncThreshold: number; // Trigger resync after this drift in ms
}

export interface FrameBuffer {
  cameraId: string;
  frames: Map<number, VideoFrame>; // Timestamp -> Frame
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
  syncAccuracy: number; // Current accuracy in ms
  driftDetected: boolean;
  lastResyncAt?: Date;
  bufferStates: Map<string, BufferHealth>;
  recommendations: string[];
}