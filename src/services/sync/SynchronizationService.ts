import { FrameSynchronizer } from './FrameSynchronizer';
import { SyncCalibrator, CalibrationMethod } from './SyncCalibrator';
import { TimestampManager } from './TimestampManager';
import { VideoFrame, SyncEvent, SyncMetrics, BufferConfiguration } from '../../types/sync';

export interface SyncSession {
  sessionId: string;
  cameraIds: string[];
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  metrics: SyncMetrics;
}

export class SynchronizationService {
  private frameSynchronizer: FrameSynchronizer;
  private timestampManager: TimestampManager;
  private currentSession?: SyncSession;
  private isInitialized: boolean = false;

  constructor(cameraIds: string[], bufferConfig?: Partial<BufferConfiguration>) {
    this.frameSynchronizer = new FrameSynchronizer(cameraIds, bufferConfig);
    this.timestampManager = new TimestampManager();
    
    console.log(`SynchronizationService initialized for cameras: ${cameraIds.join(', ')}`);
  }

  /**
   * Initialize synchronization system
   */
  public async initialize(): Promise<boolean> {
    try {
      console.log('Initializing synchronization system...');
      
      // Start timestamp synchronization
      const timestampSyncSuccess = await this.timestampManager.startTimestampSync();
      if (!timestampSyncSuccess) {
        throw new Error('Failed to start timestamp synchronization');
      }

      // Register all cameras with timestamp manager
      const cameras = this.frameSynchronizer.getAllCameras ? this.frameSynchronizer.getAllCameras() : [];
      for (const cameraId of cameras) {
        await this.timestampManager.registerCamera(cameraId);
        await this.timestampManager.syncCameraTimestamp(cameraId);
      }

      this.isInitialized = true;
      console.log('✅ Synchronization system initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize synchronization system:', error);
      return false;
    }
  }

  /**
   * Get available calibration methods
   */
  public getCalibrationMethods(): CalibrationMethod[] {
    return SyncCalibrator.getCalibrationMethods();
  }

  /**
   * Get recommended calibration method
   */
  public getRecommendedCalibrationMethod(
    hasAudio: boolean = false,
    hasMobileDevice: boolean = true,
    accuracyRequired: number = 5
  ): CalibrationMethod {
    return SyncCalibrator.getRecommendedMethod(hasAudio, hasMobileDevice, accuracyRequired);
  }

  /**
   * Start calibration with specific method
   */
  public async startCalibration(methodId: string): Promise<{
    sessionId: string;
    instructions: string[];
    syncEvent: SyncEvent;
  }> {
    if (!this.isInitialized) {
      throw new Error('Synchronization service not initialized');
    }

    console.log(`Starting calibration with method: ${methodId}`);
    
    const sessionId = await this.frameSynchronizer.startSyncCalibration();
    const instructions = SyncCalibrator.generateInstructions(methodId);
    
    // Create appropriate sync event based on method
    let syncEvent: SyncEvent;
    switch (methodId) {
      case 'led_flash':
        syncEvent = SyncCalibrator.createLEDFlashEvent();
        break;
      case 'audio_beep':
        syncEvent = SyncCalibrator.createAudioBeepEvent();
        break;
      case 'qr_code':
        syncEvent = SyncCalibrator.createQRCodeEvent();
        break;
      case 'manual_trigger':
        syncEvent = this.frameSynchronizer.recordSyncEvent('manual_trigger', 'Manual calibration event');
        break;
      default:
        throw new Error(`Unknown calibration method: ${methodId}`);
    }

    return {
      sessionId,
      instructions,
      syncEvent
    };
  }

  /**
   * Complete calibration process
   */
  public async completeCalibration(syncEvents: SyncEvent[]): Promise<{
    success: boolean;
    calibration?: any;
    report: string;
  }> {
    try {
      console.log('Completing synchronization calibration...');
      
      const calibration = this.frameSynchronizer.completeSyncCalibration(syncEvents);
      const report = SyncCalibrator.generateCalibrationReport(calibration);
      
      if (calibration.isValid) {
        console.log('✅ Calibration successful');
        return {
          success: true,
          calibration,
          report
        };
      } else {
        console.log('⚠️ Calibration completed but quality is poor');
        return {
          success: false,
          calibration,
          report
        };
      }
    } catch (error) {
      console.error('❌ Calibration failed:', error);
      return {
        success: false,
        report: `Calibration failed: ${error}`
      };
    }
  }

  /**
   * Start synchronized recording session
   */
  public startRecordingSession(): SyncSession {
    if (!this.isInitialized) {
      throw new Error('Synchronization service not initialized');
    }

    if (this.currentSession?.isActive) {
      throw new Error('Recording session already active');
    }

    const sessionId = this.generateSessionId();
    
    this.currentSession = {
      sessionId,
      cameraIds: [], // Would be populated from frame synchronizer
      startTime: new Date(),
      isActive: true,
      metrics: {
        sessionId,
        startTime: new Date(),
        totalFramesProcessed: new Map(),
        syncAccuracy: 0,
        driftDetected: false,
        bufferStates: new Map(),
        recommendations: []
      }
    };

    // Start recording in frame synchronizer
    this.frameSynchronizer.startRecording();

    console.log(`✅ Recording session started: ${sessionId}`);
    return this.currentSession;
  }

  /**
   * Stop recording session
   */
  public stopRecordingSession(): SyncSession | null {
    if (!this.currentSession?.isActive) {
      console.warn('No active recording session to stop');
      return null;
    }

    // Stop recording in frame synchronizer
    const finalMetrics = this.frameSynchronizer.stopRecording();

    this.currentSession.endTime = new Date();
    this.currentSession.isActive = false;
    this.currentSession.metrics = finalMetrics;

    const session = this.currentSession;
    this.currentSession = undefined;

    console.log(`✅ Recording session stopped: ${session.sessionId}`);
    return session;
  }

  /**
   * Add frame to synchronized buffer
   */
  public addFrame(cameraId: string, frameData: Buffer, metadata: any): boolean {
    if (!this.isInitialized) {
      console.error('Synchronization service not initialized');
      return false;
    }

    // Create video frame with synchronized timestamp
    const synchronizedTimestamp = this.timestampManager.getCameraTimestamp(cameraId);
    
    const frame: VideoFrame = {
      timestamp: synchronizedTimestamp,
      cameraId,
      frameNumber: metadata.frameNumber || 0,
      data: frameData,
      metadata: {
        width: metadata.width || 1920,
        height: metadata.height || 1080,
        fps: metadata.fps || 60,
        capturedAt: metadata.capturedAt || synchronizedTimestamp,
        receivedAt: Date.now(),
        format: metadata.format || 'rgb'
      }
    };

    return this.frameSynchronizer.addFrame(frame);
  }

  /**
   * Get synchronized frames for a timestamp
   */
  public getSynchronizedFrames(timestamp: number, toleranceMs: number = 8): Map<string, VideoFrame> {
    return this.frameSynchronizer.getSynchronizedFrames(timestamp, toleranceMs);
  }

  /**
   * Get best synchronized frame pair
   */
  public getBestSyncFramePair(): { timestamp: number; frames: Map<string, VideoFrame> } | null {
    return this.frameSynchronizer.getBestSyncFramePair();
  }

  /**
   * Get current synchronization status
   */
  public getSyncStatus(): {
    isInitialized: boolean;
    isCalibrated: boolean;
    isRecording: boolean;
    timestampAccuracy: any;
    frameSync: any;
    recommendations: string[];
  } {
    const timestampValidation = this.timestampManager.validateTimestampAccuracy();
    const frameSyncStatus = this.frameSynchronizer.getSyncStatus();
    
    const recommendations = [
      ...timestampValidation.recommendations,
      ...frameSyncStatus.recommendations
    ];

    return {
      isInitialized: this.isInitialized,
      isCalibrated: frameSyncStatus.isCalibrated,
      isRecording: !!this.currentSession?.isActive,
      timestampAccuracy: timestampValidation,
      frameSync: frameSyncStatus,
      recommendations
    };
  }

  /**
   * Generate comprehensive synchronization report
   */
  public generateSyncReport(): string {
    let report = `# Complete Synchronization Report\n\n`;
    
    // System status
    const status = this.getSyncStatus();
    report += `## System Status\n`;
    report += `- **Initialized:** ${status.isInitialized ? '✅' : '❌'}\n`;
    report += `- **Calibrated:** ${status.isCalibrated ? '✅' : '❌'}\n`;
    report += `- **Recording:** ${status.isRecording ? '🔴 Active' : '⭕ Stopped'}\n\n`;

    // Add timestamp sync report
    report += this.timestampManager.generateSyncReport();

    // Add frame sync metrics if available
    if (this.currentSession) {
      report += `\n## Current Session\n`;
      report += `- **Session ID:** ${this.currentSession.sessionId}\n`;
      report += `- **Started:** ${this.currentSession.startTime.toISOString()}\n`;
      report += `- **Duration:** ${this.calculateSessionDuration()} seconds\n`;
      report += `- **Cameras:** ${this.currentSession.cameraIds.length}\n\n`;
    }

    // Add recommendations
    if (status.recommendations.length > 0) {
      report += `\n## Recommendations\n`;
      status.recommendations.forEach(rec => {
        report += `- ${rec}\n`;
      });
    }

    return report;
  }

  /**
   * Force complete resynchronization
   */
  public async forceResync(): Promise<boolean> {
    console.log('🔄 Forcing complete resynchronization...');
    
    try {
      // Stop current session if active
      if (this.currentSession?.isActive) {
        this.stopRecordingSession();
      }

      // Force timestamp resync
      await this.timestampManager.forceResyncAll();

      // Force frame synchronizer resync
      await this.frameSynchronizer.forceResync();

      console.log('✅ Complete resynchronization successful');
      return true;
    } catch (error) {
      console.error('❌ Resynchronization failed:', error);
      return false;
    }
  }

  /**
   * Shutdown synchronization service
   */
  public async shutdown(): Promise<void> {
    console.log('Shutting down synchronization service...');
    
    // Stop any active recording
    if (this.currentSession?.isActive) {
      this.stopRecordingSession();
    }

    // Stop timestamp synchronization
    this.timestampManager.stopTimestampSync();

    this.isInitialized = false;
    console.log('✅ Synchronization service shutdown complete');
  }

  /**
   * Calculate current session duration in seconds
   */
  private calculateSessionDuration(): number {
    if (!this.currentSession) return 0;
    
    const endTime = this.currentSession.endTime || new Date();
    return Math.round((endTime.getTime() - this.currentSession.startTime.getTime()) / 1000);
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}