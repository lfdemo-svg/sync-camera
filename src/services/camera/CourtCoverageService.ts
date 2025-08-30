import { CameraView } from './CameraView';
import { CalibrationService } from './CalibrationService';
import { CoverageAnalyzer, CoverageAnalysis } from './CoverageAnalyzer';
import { 
  CameraMountPosition, 
  CourtCoverageMap, 
  CameraCalibration,
  Point2D 
} from '../../types/camera';
import { CalibrationSession } from '../../types/calibration';

export class CourtCoverageService {
  private calibrationService: CalibrationService;
  private coverageAnalyzer: CoverageAnalyzer;
  private cameras: Map<string, CameraView> = new Map();

  constructor() {
    this.calibrationService = new CalibrationService();
    this.coverageAnalyzer = new CoverageAnalyzer();
    
    // Initialize default camera setup for Padel court
    this.initializeDefaultCameras();
  }

  /**
   * Initialize default two-camera setup for Padel court
   */
  private initializeDefaultCameras(): void {
    // Camera A: Mounted on back wall A (y=0)
    const cameraA = new CameraView(
      'camera_a',
      'Camera A (Back Wall)',
      {
        x: 5.0,      // Center of court (16'6" from sides = 5m)
        y: 0.0,      // Back wall
        height: 1.35, // 4'5" from floor = 1.35m
        wall: 'back_a'
      }
    );

    // Camera B: Mounted on back wall B (y=20)
    const cameraB = new CameraView(
      'camera_b', 
      'Camera B (Back Wall)',
      {
        x: 5.0,      // Center of court
        y: 20.0,     // Opposite back wall
        height: 1.35, // Same height as Camera A
        wall: 'back_b'
      }
    );

    this.cameras.set('camera_a', cameraA);
    this.cameras.set('camera_b', cameraB);

    console.log('Initialized default two-camera setup:');
    console.log('- Camera A: Back wall (y=0), height=1.35m');
    console.log('- Camera B: Back wall (y=20), height=1.35m');
  }

  /**
   * Start calibration for a specific camera
   */
  public startCameraCalibration(cameraId: string): CalibrationSession | null {
    const camera = this.cameras.get(cameraId);
    if (!camera) {
      console.error(`Camera ${cameraId} not found`);
      return null;
    }

    return this.calibrationService.startCalibrationSession(cameraId, camera.mountPosition);
  }

  /**
   * Add detected calibration point
   */
  public addCalibrationPoint(
    sessionId: string,
    targetId: string,
    imagePoint: Point2D,
    confidence: number = 1.0
  ): boolean {
    return this.calibrationService.addDetectedPoint(sessionId, targetId, imagePoint, confidence);
  }

  /**
   * Complete camera calibration
   */
  public async completeCalibration(sessionId: string): Promise<boolean> {
    const calibration = await this.calibrationService.completeCalibration(sessionId);
    
    if (!calibration) {
      return false;
    }

    // Apply calibration to camera
    const camera = this.cameras.get(calibration.cameraId);
    if (camera) {
      camera.calibration = calibration;
      console.log(`Calibration completed for ${calibration.cameraId}:`);
      console.log(`- Accuracy: ${calibration.accuracy.toFixed(2)} cm`);
      console.log(`- Calibrated at: ${calibration.calibratedAt}`);
      return true;
    }

    return false;
  }

  /**
   * Get current court coverage analysis
   */
  public analyzeCoverage(): CoverageAnalysis | null {
    const cameraA = this.cameras.get('camera_a');
    const cameraB = this.cameras.get('camera_b');

    if (!cameraA || !cameraB) {
      console.error('Both cameras must be set up for coverage analysis');
      return null;
    }

    return this.coverageAnalyzer.analyzeCoverage(cameraA, cameraB);
  }

  /**
   * Generate comprehensive coverage report
   */
  public generateCoverageReport(): string {
    const cameraA = this.cameras.get('camera_a');
    const cameraB = this.cameras.get('camera_b');

    if (!cameraA || !cameraB) {
      return 'Error: Both cameras must be configured';
    }

    let report = this.coverageAnalyzer.generateCoverageReport(cameraA, cameraB);
    
    // Add calibration status
    report += `\n## Calibration Status\n`;
    report += this.generateCalibrationStatus(cameraA);
    report += this.generateCalibrationStatus(cameraB);

    return report;
  }

  /**
   * Get recommended camera for specific court position
   */
  public getOptimalCamera(courtX: number, courtY: number): 'camera_a' | 'camera_b' | null {
    const analysis = this.analyzeCoverage();
    if (!analysis) {
      return null;
    }

    const recommendation = analysis.recommendedCameraForPoint(courtX, courtY);
    return recommendation === 'either' ? 'camera_a' : recommendation;
  }

  /**
   * Validate complete court coverage
   */
  public validateCoverage(): {
    isComplete: boolean;
    coveragePercent: number;
    blindSpots: number;
    qualityScore: number;
    recommendations: string[];
  } {
    const analysis = this.analyzeCoverage();
    
    if (!analysis) {
      return {
        isComplete: false,
        coveragePercent: 0,
        blindSpots: 0,
        qualityScore: 0,
        recommendations: ['Complete camera setup and calibration first']
      };
    }

    const recommendations: string[] = [];
    
    if (analysis.totalCoveragePercent < 95) {
      recommendations.push('Coverage below 95% - check camera positioning');
    }
    
    if (analysis.blindSpots.length > 0) {
      recommendations.push(`${analysis.blindSpots.length} blind spots detected - adjust camera angles`);
    }
    
    if (analysis.qualityScore < 80) {
      recommendations.push('Quality score below 80 - recalibrate cameras for better accuracy');
    }

    const cameraA = this.cameras.get('camera_a');
    const cameraB = this.cameras.get('camera_b');
    
    if (cameraA && !cameraA.calibration) {
      recommendations.push('Camera A requires calibration');
    }
    
    if (cameraB && !cameraB.calibration) {
      recommendations.push('Camera B requires calibration');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Court coverage setup is optimal');
    }

    return {
      isComplete: analysis.totalCoveragePercent >= 99 && analysis.blindSpots.length === 0,
      coveragePercent: analysis.totalCoveragePercent,
      blindSpots: analysis.blindSpots.length,
      qualityScore: analysis.qualityScore,
      recommendations
    };
  }

  /**
   * Transform pixel coordinates to court coordinates
   */
  public pixelToCourtCoordinates(cameraId: string, pixelX: number, pixelY: number): Point2D | null {
    const camera = this.cameras.get(cameraId);
    if (!camera) {
      return null;
    }
    
    return camera.pixelToCourtCoordinates(pixelX, pixelY);
  }

  /**
   * Transform court coordinates to pixel coordinates
   */
  public courtToPixelCoordinates(cameraId: string, courtX: number, courtY: number): Point2D | null {
    const camera = this.cameras.get(cameraId);
    if (!camera) {
      return null;
    }
    
    return camera.courtToPixelCoordinates(courtX, courtY);
  }

  /**
   * Get camera information
   */
  public getCameraInfo(cameraId: string): CameraView | null {
    return this.cameras.get(cameraId) || null;
  }

  /**
   * Get all cameras
   */
  public getAllCameras(): CameraView[] {
    return Array.from(this.cameras.values());
  }

  /**
   * Update camera mount position (requires recalibration)
   */
  public updateCameraMountPosition(cameraId: string, mountPosition: CameraMountPosition): boolean {
    const camera = this.cameras.get(cameraId);
    if (!camera) {
      return false;
    }

    camera.mountPosition = mountPosition;
    // Clear calibration since position changed
    camera.calibration = undefined;
    
    console.log(`Updated mount position for ${cameraId} - recalibration required`);
    return true;
  }

  /**
   * Generate calibration status for a camera
   */
  private generateCalibrationStatus(camera: CameraView): string {
    let status = `**${camera.name}:**\n`;
    
    if (camera.calibration) {
      const isAccurate = camera.calibration.accuracy <= 5;
      status += `- ✅ Calibrated (${camera.calibration.calibratedAt.toISOString().split('T')[0]})\n`;
      status += `- Accuracy: ${camera.calibration.accuracy.toFixed(2)} cm ${isAccurate ? '✅' : '⚠️'}\n`;
    } else {
      status += `- ❌ Not calibrated\n`;
    }
    
    const visibleArea = camera.calculateVisibleArea();
    const areaSize = Math.abs((visibleArea.topRight.x - visibleArea.topLeft.x) * 
                             (visibleArea.bottomLeft.y - visibleArea.topLeft.y));
    status += `- Visible area: ${areaSize.toFixed(1)} m²\n`;
    
    return status + `\n`;
  }

  /**
   * Export configuration for backup/restore
   */
  public exportConfiguration(): string {
    const config = {
      cameras: Array.from(this.cameras.values()).map(camera => ({
        id: camera.id,
        name: camera.name,
        mountPosition: camera.mountPosition,
        calibration: camera.calibration,
        isActive: camera.isActive
      })),
      exportedAt: new Date().toISOString()
    };
    
    return JSON.stringify(config, null, 2);
  }
}