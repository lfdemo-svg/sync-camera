import { SyncEvent, SyncCalibration } from '../../types/sync';

export interface CalibrationMethod {
  id: string;
  name: string;
  description: string;
  accuracy: number; // Expected accuracy in ms
  setup: string[];   // Setup instructions
}

export class SyncCalibrator {
  private static readonly CALIBRATION_METHODS: CalibrationMethod[] = [
    {
      id: 'led_flash',
      name: 'LED Flash Sync',
      description: 'Use bright LED flash visible to both cameras',
      accuracy: 2,
      setup: [
        'Place bright LED or smartphone flashlight in center of court',
        'Ensure LED is visible in both camera views',
        'Trigger LED flash when cameras are recording',
        'Flash should be brief (1-2 frame duration)'
      ]
    },
    {
      id: 'audio_beep',
      name: 'Audio Beep Sync',
      description: 'Use audio spike detection for synchronization',
      accuracy: 5,
      setup: [
        'Use sharp audio signal (clap, beep, or click)',
        'Audio should be captured by both cameras if they record audio',
        'Generate brief, high-amplitude sound',
        'Ensure audio is synchronized with video frames'
      ]
    },
    {
      id: 'qr_code',
      name: 'QR Code Timestamp Sync',
      description: 'Display QR code with precise timestamp',
      accuracy: 1,
      setup: [
        'Generate QR code containing precise timestamp',
        'Display QR code on screen visible to both cameras',
        'QR code should contain millisecond-precision timestamp',
        'Ensure QR code is clearly readable in both views'
      ]
    },
    {
      id: 'manual_trigger',
      name: 'Manual Trigger Event',
      description: 'Manual event marking for basic synchronization',
      accuracy: 10,
      setup: [
        'Perform visible action at specific time (wave hand, drop ball)',
        'Mark the exact timestamp when action occurs',
        'Action should be clearly visible in both camera feeds',
        'Less accurate but always available method'
      ]
    }
  ];

  /**
   * Get available calibration methods
   */
  public static getCalibrationMethods(): CalibrationMethod[] {
    return [...SyncCalibrator.CALIBRATION_METHODS];
  }

  /**
   * Get recommended calibration method based on setup
   */
  public static getRecommendedMethod(
    hasAudio: boolean = false,
    hasMobileDevice: boolean = true,
    accuracyRequired: number = 5
  ): CalibrationMethod {
    const availableMethods = this.CALIBRATION_METHODS.filter(method => {
      // Filter based on requirements and availability
      if (method.id === 'audio_beep' && !hasAudio) return false;
      if (method.id === 'qr_code' && !hasMobileDevice) return false;
      return method.accuracy <= accuracyRequired;
    });

    // Return most accurate available method
    return availableMethods.sort((a, b) => a.accuracy - b.accuracy)[0] || this.CALIBRATION_METHODS[0];
  }

  /**
   * Generate calibration instructions for a method
   */
  public static generateInstructions(methodId: string): string[] {
    const method = this.CALIBRATION_METHODS.find(m => m.id === methodId);
    if (!method) {
      return ['Unknown calibration method'];
    }

    const instructions = [
      `📋 ${method.name} Calibration`,
      `Expected accuracy: ±${method.accuracy}ms`,
      '',
      '🔧 Setup Instructions:',
      ...method.setup.map((step, index) => `${index + 1}. ${step}`),
      '',
      '▶️ Execution:',
      '1. Start recording on both cameras',
      '2. Wait for stable recording (2-3 seconds)',
      '3. Execute the sync event',
      '4. Continue recording for 2-3 more seconds',
      '5. Stop recording and process the sync event'
    ];

    return instructions;
  }

  /**
   * Create LED flash sync event
   */
  public static createLEDFlashEvent(description: string = 'LED flash sync'): SyncEvent {
    return {
      eventId: this.generateEventId(),
      eventType: 'led_flash',
      triggeredAt: Date.now(),
      detectedFrames: [],
      description
    };
  }

  /**
   * Create audio beep sync event
   */
  public static createAudioBeepEvent(description: string = 'Audio beep sync'): SyncEvent {
    return {
      eventId: this.generateEventId(),
      eventType: 'audio_beep',
      triggeredAt: Date.now(),
      detectedFrames: [],
      description
    };
  }

  /**
   * Create QR code sync event with timestamp
   */
  public static createQRCodeEvent(timestamp?: number): SyncEvent {
    const syncTime = timestamp || Date.now();
    return {
      eventId: this.generateEventId(),
      eventType: 'qr_code',
      triggeredAt: syncTime,
      detectedFrames: [],
      description: `QR code sync - ${new Date(syncTime).toISOString()}`
    };
  }

  /**
   * Generate QR code data for timestamp sync
   */
  public static generateQRCodeData(timestamp?: number): string {
    const syncTime = timestamp || Date.now();
    return JSON.stringify({
      type: 'sync_timestamp',
      timestamp: syncTime,
      accuracy: 'millisecond',
      generated_at: new Date(syncTime).toISOString()
    });
  }

  /**
   * Validate sync event quality
   */
  public static validateSyncEvent(event: SyncEvent): {
    isValid: boolean;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check number of detected frames
    if (event.detectedFrames.length < 2) {
      issues.push('Insufficient camera detections (need at least 2)');
      recommendations.push('Ensure sync event is visible/audible to all cameras');
    }

    // Check detection confidence
    const lowConfidenceDetections = event.detectedFrames.filter(d => d.confidence < 0.7);
    if (lowConfidenceDetections.length > 0) {
      issues.push(`${lowConfidenceDetections.length} low confidence detections`);
      recommendations.push('Improve sync event visibility or use different method');
    }

    // Check timing consistency
    if (event.detectedFrames.length >= 2) {
      const timestamps = event.detectedFrames.map(d => d.detectionTimestamp);
      const maxDiff = Math.max(...timestamps) - Math.min(...timestamps);
      
      if (maxDiff > 50) {
        issues.push(`Large timestamp spread: ${maxDiff.toFixed(2)}ms`);
        recommendations.push('Check for sync drift or camera timing issues');
      }
    }

    // Determine quality based on issues
    let quality: 'excellent' | 'good' | 'fair' | 'poor';
    if (issues.length === 0) {
      quality = 'excellent';
    } else if (issues.length === 1) {
      quality = 'good';
    } else if (issues.length === 2) {
      quality = 'fair';
    } else {
      quality = 'poor';
    }

    return {
      isValid: issues.length === 0,
      quality,
      issues,
      recommendations
    };
  }

  /**
   * Calculate sync accuracy from calibration data
   */
  public static calculateSyncAccuracy(calibration: SyncCalibration): {
    overallAccuracy: number;
    cameraAccuracies: Map<string, number>;
    recommendedAction: string;
  } {
    const cameraAccuracies = new Map<string, number>();
    let totalError = 0;
    let validMeasurements = 0;

    // Calculate accuracy per camera
    calibration.cameraOffsets.forEach((offset, cameraId) => {
      const cameraAccuracy = Math.abs(offset);
      cameraAccuracies.set(cameraId, cameraAccuracy);
      totalError += cameraAccuracy;
      validMeasurements++;
    });

    const overallAccuracy = validMeasurements > 0 ? totalError / validMeasurements : 0;

    // Recommend action based on accuracy
    let recommendedAction: string;
    if (overallAccuracy <= 5) {
      recommendedAction = 'Excellent sync - ready for recording';
    } else if (overallAccuracy <= 15) {
      recommendedAction = 'Good sync - acceptable for most use cases';
    } else if (overallAccuracy <= 30) {
      recommendedAction = 'Fair sync - consider recalibrating for better accuracy';
    } else {
      recommendedAction = 'Poor sync - recalibration required before recording';
    }

    return {
      overallAccuracy,
      cameraAccuracies,
      recommendedAction
    };
  }

  /**
   * Generate calibration report
   */
  public static generateCalibrationReport(calibration: SyncCalibration): string {
    const accuracyAnalysis = this.calculateSyncAccuracy(calibration);
    
    let report = `# Synchronization Calibration Report\n\n`;
    report += `**Session ID:** ${calibration.sessionId}\n`;
    report += `**Calibrated:** ${calibration.calibratedAt.toISOString().split('T')[0]} ${calibration.calibratedAt.toTimeString().split(' ')[0]}\n`;
    report += `**Status:** ${calibration.isValid ? '✅ Valid' : '❌ Invalid'}\n`;
    report += `**Overall Accuracy:** ±${accuracyAnalysis.overallAccuracy.toFixed(2)}ms\n\n`;

    report += `## Camera Offsets\n`;
    calibration.cameraOffsets.forEach((offset, cameraId) => {
      const cameraAccuracy = accuracyAnalysis.cameraAccuracies.get(cameraId) || 0;
      const status = cameraAccuracy <= 10 ? '✅' : cameraAccuracy <= 25 ? '⚠️' : '❌';
      report += `- **${cameraId}:** ${offset > 0 ? '+' : ''}${offset.toFixed(2)}ms ${status}\n`;
    });

    report += `\n## Sync Events (${calibration.syncEvents.length})\n`;
    calibration.syncEvents.forEach((event, index) => {
      const validation = this.validateSyncEvent(event);
      const qualityIcon = {
        excellent: '🟢',
        good: '🔵', 
        fair: '🟡',
        poor: '🔴'
      }[validation.quality];
      
      report += `${index + 1}. **${event.eventType}** ${qualityIcon} ${validation.quality}\n`;
      report += `   - Detections: ${event.detectedFrames.length} cameras\n`;
      if (validation.issues.length > 0) {
        report += `   - Issues: ${validation.issues.join(', ')}\n`;
      }
    });

    report += `\n## Recommendation\n`;
    report += `${accuracyAnalysis.recommendedAction}\n`;

    if (calibration.driftRate > 0) {
      report += `\n⚠️ **Drift Rate:** ${calibration.driftRate.toFixed(2)}ms/hour - periodic recalibration recommended\n`;
    }

    return report;
  }

  /**
   * Generate sync event ID
   */
  private static generateEventId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}