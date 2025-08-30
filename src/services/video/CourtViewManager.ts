import { Point2D } from '../../types/camera';
import { BallDetection, BallTrack } from '../../types/detection';
import { 
  VideoOutputMode, 
  CameraSwitchEvent, 
  TransitionInfo,
  OutputConfiguration 
} from '../../types/video';
import { CourtCoverageService } from '../camera/CourtCoverageService';

export interface CameraSelectionResult {
  selectedCamera: string;
  confidence: number;
  reason: string;
  shouldSwitch: boolean;
  transitionInfo?: TransitionInfo;
}

export class CourtViewManager {
  private courtCoverageService: CourtCoverageService;
  private currentActiveCamera: string;
  private lastSwitchTime: number = 0;
  private switchHistory: CameraSwitchEvent[] = [];
  private outputConfig: OutputConfiguration;

  // Default switching parameters
  private readonly MIN_SWITCH_INTERVAL = 1000;    // 1 second minimum between switches
  private readonly CONFIDENCE_THRESHOLD = 0.7;    // Minimum confidence for switching
  private readonly POSITION_HYSTERESIS = 1.0;     // 1 meter hysteresis zone

  constructor(
    courtCoverageService: CourtCoverageService,
    initialCamera: string = 'camera_a',
    outputConfig: OutputConfiguration
  ) {
    this.courtCoverageService = courtCoverageService;
    this.currentActiveCamera = initialCamera;
    this.outputConfig = outputConfig;
    
    console.log(`CourtViewManager initialized with camera: ${initialCamera}`);
    console.log(`Output mode: ${outputConfig.mode}`);
  }

  /**
   * Determine optimal camera selection based on ball position and current context
   */
  public selectOptimalCamera(
    ballPosition: Point2D,
    ballDetections: BallDetection[],
    activeTracks: BallTrack[]
  ): CameraSelectionResult {
    const currentTime = Date.now();
    
    // Get recommended camera from court coverage service
    const recommendedCamera = this.courtCoverageService.getOptimalCamera(
      ballPosition.x, 
      ballPosition.y
    );
    
    if (!recommendedCamera) {
      return {
        selectedCamera: this.currentActiveCamera,
        confidence: 0.5,
        reason: 'No coverage recommendation available',
        shouldSwitch: false
      };
    }

    // Check if we should switch cameras
    const shouldSwitch = this.shouldSwitchCamera(
      recommendedCamera,
      ballPosition,
      ballDetections,
      currentTime
    );

    const confidence = this.calculateSwitchConfidence(
      ballPosition,
      ballDetections,
      recommendedCamera
    );

    let transitionInfo: TransitionInfo | undefined;
    if (shouldSwitch && recommendedCamera !== this.currentActiveCamera) {
      transitionInfo = {
        fromCameraId: this.currentActiveCamera,
        toCameraId: recommendedCamera,
        transitionType: this.outputConfig.transitionConfig.transitionType,
        duration: this.outputConfig.transitionConfig.transitionDuration,
        progress: 0,
        reason: this.determineSwitchReason(ballPosition, ballDetections)
      };
    }

    return {
      selectedCamera: shouldSwitch ? recommendedCamera : this.currentActiveCamera,
      confidence,
      reason: this.buildSelectionReason(ballPosition, recommendedCamera, shouldSwitch),
      shouldSwitch,
      transitionInfo
    };
  }

  /**
   * Execute camera switch with proper transition handling
   */
  public executeCameraSwitch(
    newCameraId: string,
    ballPosition: Point2D,
    reason: TransitionInfo['reason']
  ): CameraSwitchEvent {
    const switchEvent: CameraSwitchEvent = {
      switchId: this.generateSwitchId(),
      timestamp: Date.now(),
      fromCamera: this.currentActiveCamera,
      toCamera: newCameraId,
      reason,
      ballPosition: { ...ballPosition },
      transitionDuration: this.outputConfig.transitionConfig.transitionDuration,
      quality: 'smooth' // Will be updated based on actual transition
    };

    // Update current active camera
    this.currentActiveCamera = newCameraId;
    this.lastSwitchTime = Date.now();

    // Add to switch history
    this.switchHistory.push(switchEvent);

    console.log(`Camera switched: ${switchEvent.fromCamera} → ${switchEvent.toCamera} (${reason})`);
    
    return switchEvent;
  }

  /**
   * Get current active camera
   */
  public getCurrentActiveCamera(): string {
    return this.currentActiveCamera;
  }

  /**
   * Get switch history for analysis
   */
  public getSwitchHistory(): CameraSwitchEvent[] {
    return [...this.switchHistory];
  }

  /**
   * Analyze switching performance
   */
  public analyzeSwitchingPerformance(): {
    totalSwitches: number;
    averageSwitchInterval: number;
    smoothTransitions: number;
    jarringTransitions: number;
    cameraUsageBalance: number; // 0-1, where 1 is perfectly balanced
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    
    if (this.switchHistory.length === 0) {
      return {
        totalSwitches: 0,
        averageSwitchInterval: 0,
        smoothTransitions: 0,
        jarringTransitions: 0,
        cameraUsageBalance: 1,
        recommendations: ['No camera switches recorded']
      };
    }

    // Calculate switch intervals
    const intervals: number[] = [];
    for (let i = 1; i < this.switchHistory.length; i++) {
      const interval = this.switchHistory[i].timestamp - this.switchHistory[i - 1].timestamp;
      intervals.push(interval);
    }

    const averageInterval = intervals.length > 0 ? 
      intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length : 0;

    // Count transition qualities
    const smoothTransitions = this.switchHistory.filter(s => s.quality === 'smooth').length;
    const jarringTransitions = this.switchHistory.filter(s => s.quality === 'jarring').length;

    // Calculate camera usage balance
    const cameraUsage = this.calculateCameraUsage();
    const usageValues = Object.values(cameraUsage);
    const usageVariance = usageValues.length > 1 ? 
      usageValues.reduce((sum, usage) => sum + Math.pow(usage - 50, 2), 0) / usageValues.length : 0;
    const cameraUsageBalance = Math.max(0, 1 - (usageVariance / 2500)); // Normalized to 0-1

    // Generate recommendations
    if (averageInterval < 500) {
      recommendations.push('Too frequent camera switching - consider increasing minimum switch interval');
    }
    
    if (jarringTransitions / this.switchHistory.length > 0.3) {
      recommendations.push('High rate of jarring transitions - optimize switching logic');
    }
    
    if (cameraUsageBalance < 0.7) {
      recommendations.push('Unbalanced camera usage - review coverage zones');
    }

    return {
      totalSwitches: this.switchHistory.length,
      averageSwitchInterval: averageInterval / 1000, // Convert to seconds
      smoothTransitions,
      jarringTransitions,
      cameraUsageBalance,
      recommendations
    };
  }

  /**
   * Update output configuration
   */
  public updateConfiguration(newConfig: Partial<OutputConfiguration>): void {
    this.outputConfig = { ...this.outputConfig, ...newConfig };
    console.log('CourtViewManager configuration updated:', newConfig);
  }

  /**
   * Reset switching state (useful for new recording sessions)
   */
  public resetSwitchingState(): void {
    this.switchHistory = [];
    this.lastSwitchTime = 0;
    console.log('CourtViewManager switching state reset');
  }

  /**
   * Get camera coverage zones for visualization
   */
  public getCameraZones(): {
    [cameraId: string]: {
      optimalZone: { x: number; y: number; width: number; height: number };
      visibleZone: { x: number; y: number; width: number; height: number };
      priority: number;
    };
  } {
    const cameras = this.courtCoverageService.getAllCameras();
    const zones: any = {};

    cameras.forEach(camera => {
      const optimalZone = camera.getOptimalZone();
      const visibleArea = camera.calculateVisibleArea();
      
      zones[camera.id] = {
        optimalZone: {
          x: optimalZone.topLeft.x,
          y: optimalZone.topLeft.y,
          width: optimalZone.topRight.x - optimalZone.topLeft.x,
          height: optimalZone.bottomLeft.y - optimalZone.topLeft.y
        },
        visibleZone: {
          x: visibleArea.topLeft.x,
          y: visibleArea.topLeft.y,
          width: visibleArea.topRight.x - visibleArea.topLeft.x,
          height: visibleArea.bottomLeft.y - visibleArea.topLeft.y
        },
        priority: camera.id === 'camera_a' ? 1 : 2
      };
    });

    return zones;
  }

  /**
   * Determine if camera should be switched based on various factors
   */
  private shouldSwitchCamera(
    recommendedCamera: string,
    ballPosition: Point2D,
    detections: BallDetection[],
    currentTime: number
  ): boolean {
    // Don't switch if we just switched recently
    if (currentTime - this.lastSwitchTime < this.MIN_SWITCH_INTERVAL) {
      return false;
    }

    // Don't switch if already using recommended camera
    if (recommendedCamera === this.currentActiveCamera) {
      return false;
    }

    // Check if the switch provides significant improvement
    const confidence = this.calculateSwitchConfidence(ballPosition, detections, recommendedCamera);
    
    if (confidence < this.CONFIDENCE_THRESHOLD) {
      return false;
    }

    // Apply hysteresis to prevent oscillation around zone boundaries
    const distanceFromBoundary = this.calculateDistanceFromZoneBoundary(ballPosition);
    if (distanceFromBoundary < this.POSITION_HYSTERESIS) {
      return false;
    }

    return true;
  }

  /**
   * Calculate confidence for camera switch
   */
  private calculateSwitchConfidence(
    ballPosition: Point2D,
    detections: BallDetection[],
    targetCamera: string
  ): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence if target camera has better detection
    const targetDetection = detections.find(d => d.cameraId === targetCamera);
    const currentDetection = detections.find(d => d.cameraId === this.currentActiveCamera);

    if (targetDetection && currentDetection) {
      const confidenceDiff = targetDetection.confidence - currentDetection.confidence;
      confidence += confidenceDiff * 0.5; // Weight detection quality
    } else if (targetDetection && !currentDetection) {
      confidence += 0.4; // Significant boost for detection vs no detection
    }

    // Boost confidence if ball is in optimal zone for target camera
    const cameras = this.courtCoverageService.getAllCameras();
    const targetCameraView = cameras.find(c => c.id === targetCamera);
    
    if (targetCameraView) {
      const optimalZone = targetCameraView.getOptimalZone();
      if (this.isPointInZone(ballPosition, optimalZone)) {
        confidence += 0.3;
      }
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Determine the reason for camera switch
   */
  private determineSwitchReason(
    ballPosition: Point2D,
    detections: BallDetection[]
  ): TransitionInfo['reason'] {
    // Check if ball moved to different zone
    const netY = 10; // Net position
    const currentCameraOptimalForNearCourt = this.currentActiveCamera === 'camera_b';
    const ballInNearCourt = ballPosition.y < netY;

    if (currentCameraOptimalForNearCourt !== ballInNearCourt) {
      return 'zone_change';
    }

    // Check if it's for better detection quality
    const currentDetection = detections.find(d => d.cameraId === this.currentActiveCamera);
    const otherDetections = detections.filter(d => d.cameraId !== this.currentActiveCamera);
    
    if (otherDetections.length > 0 && currentDetection) {
      const bestOtherDetection = otherDetections.sort((a, b) => b.confidence - a.confidence)[0];
      if (bestOtherDetection.confidence > currentDetection.confidence + 0.2) {
        return 'quality_improvement';
      }
    }

    return 'ball_movement';
  }

  /**
   * Build human-readable reason for camera selection
   */
  private buildSelectionReason(
    ballPosition: Point2D,
    recommendedCamera: string,
    shouldSwitch: boolean
  ): string {
    const netY = 10;
    const courtHalf = ballPosition.y < netY ? 'near court' : 'far court';
    
    if (!shouldSwitch) {
      return `Staying with ${this.currentActiveCamera} (${courtHalf}, stable)`;
    }

    return `Switching to ${recommendedCamera} for optimal ${courtHalf} coverage`;
  }

  /**
   * Calculate distance from zone boundary for hysteresis
   */
  private calculateDistanceFromZoneBoundary(ballPosition: Point2D): number {
    const netY = 10; // Net position (zone boundary)
    return Math.abs(ballPosition.y - netY);
  }

  /**
   * Check if point is within a zone
   */
  private isPointInZone(point: Point2D, zone: any): boolean {
    const minX = Math.min(zone.topLeft.x, zone.topRight.x, zone.bottomLeft.x, zone.bottomRight.x);
    const maxX = Math.max(zone.topLeft.x, zone.topRight.x, zone.bottomLeft.x, zone.bottomRight.x);
    const minY = Math.min(zone.topLeft.y, zone.topRight.y, zone.bottomLeft.y, zone.bottomRight.y);
    const maxY = Math.max(zone.topLeft.y, zone.topRight.y, zone.bottomLeft.y, zone.bottomRight.y);
    
    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
  }

  /**
   * Calculate camera usage statistics
   */
  private calculateCameraUsage(): { [cameraId: string]: number } {
    if (this.switchHistory.length === 0) {
      return { [this.currentActiveCamera]: 100 };
    }

    const usage: { [cameraId: string]: number } = {};
    let totalTime = 0;

    // Calculate time spent with each camera
    let currentCamera = this.switchHistory[0].fromCamera;
    let lastTime = this.switchHistory[0].timestamp;

    this.switchHistory.forEach(switchEvent => {
      const duration = switchEvent.timestamp - lastTime;
      usage[currentCamera] = (usage[currentCamera] || 0) + duration;
      totalTime += duration;
      
      currentCamera = switchEvent.toCamera;
      lastTime = switchEvent.timestamp;
    });

    // Convert to percentages
    Object.keys(usage).forEach(cameraId => {
      usage[cameraId] = totalTime > 0 ? (usage[cameraId] / totalTime) * 100 : 0;
    });

    return usage;
  }

  /**
   * Generate unique switch ID
   */
  private generateSwitchId(): string {
    return `switch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}