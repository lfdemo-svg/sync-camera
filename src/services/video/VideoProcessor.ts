import { 
  VideoOutput, 
  VideoOutputMode, 
  VideoOverlay, 
  OverlayStyle, 
  OutputConfiguration,
  TransitionInfo
} from '../../types/video';
import { VideoFrame } from '../../types/sync';
import { Point2D } from '../../types/camera';
import { BallDetection } from '../../types/detection';

export class VideoProcessor {
  private outputConfig: OutputConfiguration;
  private frameBuffer: Map<string, VideoFrame[]> = new Map();
  private overlayRenderer: OverlayRenderer;

  // Performance tracking
  private processingTimes: number[] = [];
  private droppedFrames: number = 0;

  constructor(outputConfig: OutputConfiguration) {
    this.outputConfig = outputConfig;
    this.overlayRenderer = new OverlayRenderer(outputConfig.overlayConfig);
    
    console.log('VideoProcessor initialized:', {
      mode: outputConfig.mode,
      resolution: outputConfig.resolution,
      fps: outputConfig.fps
    });
  }

  /**
   * Process synchronized frames into output video frame
   */
  public processFrames(
    frames: Map<string, VideoFrame>,
    activeCamera: string,
    ballDetection?: BallDetection,
    transitionInfo?: TransitionInfo
  ): VideoOutput {
    const startTime = Date.now();
    
    try {
      // Get primary frame
      const primaryFrame = frames.get(activeCamera);
      if (!primaryFrame) {
        throw new Error(`Primary camera frame not found: ${activeCamera}`);
      }

      // Generate output based on mode
      let outputFrame: Buffer;
      let overlays: VideoOverlay[] = [];

      switch (this.outputConfig.mode) {
        case 'single_camera':
          outputFrame = this.renderSingleCamera(primaryFrame, transitionInfo);
          break;
          
        case 'split_screen':
          outputFrame = this.renderSplitScreen(frames, activeCamera, transitionInfo);
          break;
          
        case 'picture_in_picture':
          outputFrame = this.renderPictureInPicture(frames, activeCamera);
          break;
          
        case 'auto_switch':
        case 'follow_ball':
        default:
          outputFrame = this.renderSingleCamera(primaryFrame, transitionInfo);
          break;
      }

      // Add overlays if enabled
      if (this.outputConfig.enableOverlays) {
        overlays = this.generateOverlays(ballDetection, activeCamera, frames);
        outputFrame = this.overlayRenderer.renderOverlays(outputFrame, overlays);
      }

      const processingTime = Date.now() - startTime;
      this.processingTimes.push(processingTime);

      // Keep only recent processing times (last 100)
      if (this.processingTimes.length > 100) {
        this.processingTimes = this.processingTimes.slice(-100);
      }

      const output: VideoOutput = {
        outputId: this.generateOutputId(),
        timestamp: primaryFrame.timestamp,
        outputMode: this.outputConfig.mode,
        frameData: outputFrame,
        metadata: {
          width: this.outputConfig.resolution.width,
          height: this.outputConfig.resolution.height,
          fps: this.outputConfig.fps,
          format: 'rgb',
          activeCameraId: activeCamera,
          switchTransition: transitionInfo
        },
        overlays
      };

      return output;

    } catch (error) {
      console.error('Frame processing failed:', error);
      this.droppedFrames++;
      
      // Return empty frame as fallback
      return this.createEmptyOutput(activeCamera, frames.values().next().value?.timestamp || Date.now());
    }
  }

  /**
   * Update output configuration
   */
  public updateConfiguration(newConfig: Partial<OutputConfiguration>): void {
    this.outputConfig = { ...this.outputConfig, ...newConfig };
    this.overlayRenderer.updateConfiguration(newConfig.overlayConfig || this.outputConfig.overlayConfig);
    
    console.log('VideoProcessor configuration updated:', newConfig);
  }

  /**
   * Get processing performance statistics
   */
  public getPerformanceStats(): {
    averageProcessingTime: number;
    maxProcessingTime: number;
    droppedFrames: number;
    totalFramesProcessed: number;
    targetFrameTime: number;
    isRealtime: boolean;
  } {
    const avgProcessingTime = this.processingTimes.length > 0 ?
      this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length : 0;
    
    const maxProcessingTime = this.processingTimes.length > 0 ?
      Math.max(...this.processingTimes) : 0;
    
    const targetFrameTime = 1000 / this.outputConfig.fps;
    const isRealtime = avgProcessingTime <= targetFrameTime;

    return {
      averageProcessingTime: avgProcessingTime,
      maxProcessingTime,
      droppedFrames: this.droppedFrames,
      totalFramesProcessed: this.processingTimes.length,
      targetFrameTime,
      isRealtime
    };
  }

  /**
   * Clear performance statistics
   */
  public clearPerformanceStats(): void {
    this.processingTimes = [];
    this.droppedFrames = 0;
  }

  /**
   * Render single camera view with optional transition effects
   */
  private renderSingleCamera(frame: VideoFrame, transitionInfo?: TransitionInfo): Buffer {
    // In real implementation, this would use proper video processing libraries
    // For now, simulate frame processing
    
    const { width, height } = this.outputConfig.resolution;
    const frameSize = width * height * 3; // RGB
    const outputFrame = Buffer.alloc(frameSize);
    
    // Simulate frame scaling/copying
    if (frame.data instanceof Buffer) {
      frame.data.copy(outputFrame, 0, 0, Math.min(frameSize, frame.data.length));
    }

    // Apply transition effects if provided
    if (transitionInfo && transitionInfo.progress > 0 && transitionInfo.progress < 1) {
      this.applyTransitionEffect(outputFrame, transitionInfo);
    }

    return outputFrame;
  }

  /**
   * Render split screen view
   */
  private renderSplitScreen(
    frames: Map<string, VideoFrame>, 
    activeCamera: string,
    transitionInfo?: TransitionInfo
  ): Buffer {
    const { width, height } = this.outputConfig.resolution;
    const outputFrame = Buffer.alloc(width * height * 3);
    
    // Get both camera frames
    const framesArray = Array.from(frames.values());
    const leftFrame = framesArray[0];
    const rightFrame = framesArray[1];
    
    const halfWidth = Math.floor(width / 2);
    
    // Simulate split screen rendering
    if (leftFrame?.data instanceof Buffer) {
      this.copyFrameToRegion(leftFrame.data, outputFrame, 0, 0, halfWidth, height, width);
    }
    
    if (rightFrame?.data instanceof Buffer) {
      this.copyFrameToRegion(rightFrame.data, outputFrame, halfWidth, 0, halfWidth, height, width);
    }
    
    // Highlight active camera with border
    this.addActiveCameraBorder(outputFrame, activeCamera === leftFrame?.cameraId ? 'left' : 'right', width, height);
    
    return outputFrame;
  }

  /**
   * Render picture-in-picture view
   */
  private renderPictureInPicture(frames: Map<string, VideoFrame>, activeCamera: string): Buffer {
    const { width, height } = this.outputConfig.resolution;
    const outputFrame = Buffer.alloc(width * height * 3);
    
    // Get main and pip frames
    const mainFrame = frames.get(activeCamera);
    const pipFrame = Array.from(frames.values()).find(f => f.cameraId !== activeCamera);
    
    // Render main frame fullscreen
    if (mainFrame?.data instanceof Buffer) {
      mainFrame.data.copy(outputFrame, 0, 0, Math.min(outputFrame.length, mainFrame.data.length));
    }
    
    // Render PiP frame in corner (20% of main frame size)
    if (pipFrame?.data instanceof Buffer) {
      const pipWidth = Math.floor(width * 0.2);
      const pipHeight = Math.floor(height * 0.2);
      const pipX = width - pipWidth - 20; // 20px margin
      const pipY = 20; // 20px from top
      
      this.copyFrameToRegion(pipFrame.data, outputFrame, pipX, pipY, pipWidth, pipHeight, width);
      
      // Add PiP border
      this.addPipBorder(outputFrame, pipX, pipY, pipWidth, pipHeight, width);
    }
    
    return outputFrame;
  }

  /**
   * Generate overlays for the frame
   */
  private generateOverlays(
    ballDetection?: BallDetection,
    activeCamera?: string,
    frames?: Map<string, VideoFrame>
  ): VideoOverlay[] {
    const overlays: VideoOverlay[] = [];
    
    // Ball marker overlay
    if (this.outputConfig.overlayConfig.showBallMarker && ballDetection) {
      const ballOverlay: VideoOverlay = {
        type: 'ball_marker',
        position: ballDetection.imagePosition,
        data: {
          courtPosition: ballDetection.courtPosition,
          confidence: ballDetection.confidence
        },
        style: this.outputConfig.overlayConfig.ballMarkerStyle,
        visible: true,
        timestamp: ballDetection.timestamp
      };
      overlays.push(ballOverlay);
    }
    
    // Camera indicator overlay
    if (this.outputConfig.overlayConfig.showCameraIndicator && activeCamera) {
      const indicatorOverlay: VideoOverlay = {
        type: 'camera_indicator',
        position: { x: 20, y: 20 }, // Top-left corner
        data: {
          cameraId: activeCamera,
          cameraName: `Camera ${activeCamera.slice(-1).toUpperCase()}`
        },
        style: {
          color: '#FFFFFF',
          size: 24,
          opacity: 0.8,
          fontSize: 16,
          fontFamily: 'Arial'
        },
        visible: true,
        timestamp: Date.now()
      };
      overlays.push(indicatorOverlay);
    }
    
    // Court lines overlay (if enabled)
    if (this.outputConfig.overlayConfig.showCourtLines) {
      const courtLinesOverlay: VideoOverlay = {
        type: 'court_lines',
        position: { x: 0, y: 0 },
        data: {
          lines: this.generateCourtLineCoordinates()
        },
        style: this.outputConfig.overlayConfig.courtLineStyle,
        visible: true,
        timestamp: Date.now()
      };
      overlays.push(courtLinesOverlay);
    }
    
    return overlays;
  }

  /**
   * Apply transition effects to frame
   */
  private applyTransitionEffect(outputFrame: Buffer, transitionInfo: TransitionInfo): void {
    // Simplified transition effects
    switch (transitionInfo.transitionType) {
      case 'fade':
        this.applyFadeEffect(outputFrame, transitionInfo.progress);
        break;
      case 'wipe':
        this.applyWipeEffect(outputFrame, transitionInfo.progress);
        break;
      case 'zoom':
        this.applyZoomEffect(outputFrame, transitionInfo.progress);
        break;
      case 'cut':
      default:
        // No effect for cut
        break;
    }
  }

  /**
   * Apply fade transition effect
   */
  private applyFadeEffect(frame: Buffer, progress: number): void {
    const fadeAmount = progress < 0.5 ? (1 - progress * 2) : (progress - 0.5) * 2;
    
    // Simulate fade by adjusting brightness
    for (let i = 0; i < frame.length; i++) {
      frame[i] = Math.floor(frame[i] * fadeAmount);
    }
  }

  /**
   * Apply wipe transition effect
   */
  private applyWipeEffect(frame: Buffer, progress: number): void {
    const { width, height } = this.outputConfig.resolution;
    const wipePosition = Math.floor(width * progress);
    
    // Simulate horizontal wipe by masking pixels
    for (let y = 0; y < height; y++) {
      for (let x = wipePosition; x < width; x++) {
        const pixelIndex = (y * width + x) * 3;
        if (pixelIndex < frame.length - 2) {
          frame[pixelIndex] = 0;     // R
          frame[pixelIndex + 1] = 0; // G
          frame[pixelIndex + 2] = 0; // B
        }
      }
    }
  }

  /**
   * Apply zoom transition effect
   */
  private applyZoomEffect(frame: Buffer, progress: number): void {
    // Simplified zoom effect - in reality would need proper scaling
    const zoomFactor = 1 + (progress * 0.5); // Up to 1.5x zoom
    // Implementation would require proper image scaling
    console.log(`Applying zoom effect with factor: ${zoomFactor}`);
  }

  /**
   * Copy frame data to specific region of output frame
   */
  private copyFrameToRegion(
    sourceFrame: Buffer,
    targetFrame: Buffer,
    x: number,
    y: number,
    width: number,
    height: number,
    targetWidth: number
  ): void {
    // Simplified frame copying - in reality would need proper scaling/cropping
    const bytesPerPixel = 3; // RGB
    const sourceStride = targetWidth * bytesPerPixel;
    
    for (let row = 0; row < height && y + row < this.outputConfig.resolution.height; row++) {
      const sourceOffset = ((y + row) * targetWidth + x) * bytesPerPixel;
      const targetOffset = sourceOffset;
      
      if (sourceOffset < sourceFrame.length && targetOffset < targetFrame.length) {
        const copyLength = Math.min(width * bytesPerPixel, sourceFrame.length - sourceOffset);
        sourceFrame.copy(targetFrame, targetOffset, sourceOffset, sourceOffset + copyLength);
      }
    }
  }

  /**
   * Add active camera border for split screen
   */
  private addActiveCameraBorder(
    frame: Buffer,
    side: 'left' | 'right',
    width: number,
    height: number
  ): void {
    // Simplified border rendering - would need proper graphics library
    console.log(`Adding active camera border on ${side} side`);
  }

  /**
   * Add border around picture-in-picture frame
   */
  private addPipBorder(
    frame: Buffer,
    x: number,
    y: number,
    pipWidth: number,
    pipHeight: number,
    frameWidth: number
  ): void {
    // Simplified border rendering
    console.log(`Adding PiP border at (${x}, ${y}) size ${pipWidth}x${pipHeight}`);
  }

  /**
   * Generate court line coordinates for overlay
   */
  private generateCourtLineCoordinates(): any[] {
    // Return simplified court line data
    return [
      { type: 'line', points: [{ x: 0, y: 0 }, { x: 10, y: 0 }] }, // Front line
      { type: 'line', points: [{ x: 0, y: 20 }, { x: 10, y: 20 }] }, // Back line
      { type: 'line', points: [{ x: 0, y: 10 }, { x: 10, y: 10 }] }, // Net line
      { type: 'line', points: [{ x: 0, y: 6.95 }, { x: 10, y: 6.95 }] }, // Service line 1
      { type: 'line', points: [{ x: 0, y: 13.05 }, { x: 10, y: 13.05 }] } // Service line 2
    ];
  }

  /**
   * Create empty output frame for error cases
   */
  private createEmptyOutput(activeCamera: string, timestamp: number): VideoOutput {
    const { width, height } = this.outputConfig.resolution;
    const emptyFrame = Buffer.alloc(width * height * 3);
    
    return {
      outputId: this.generateOutputId(),
      timestamp,
      outputMode: this.outputConfig.mode,
      frameData: emptyFrame,
      metadata: {
        width,
        height,
        fps: this.outputConfig.fps,
        format: 'rgb',
        activeCameraId: activeCamera
      },
      overlays: []
    };
  }

  /**
   * Generate unique output ID
   */
  private generateOutputId(): string {
    return `output_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Helper class for overlay rendering
class OverlayRenderer {
  private overlayConfig: OutputConfiguration['overlayConfig'];

  constructor(overlayConfig: OutputConfiguration['overlayConfig']) {
    this.overlayConfig = overlayConfig;
  }

  public updateConfiguration(newConfig: OutputConfiguration['overlayConfig']): void {
    this.overlayConfig = newConfig;
  }

  public renderOverlays(frame: Buffer, overlays: VideoOverlay[]): Buffer {
    // In real implementation, this would use a graphics library like Cairo or Canvas
    // For now, just simulate overlay rendering
    
    overlays.forEach(overlay => {
      if (!overlay.visible) return;
      
      switch (overlay.type) {
        case 'ball_marker':
          this.renderBallMarker(frame, overlay);
          break;
        case 'camera_indicator':
          this.renderCameraIndicator(frame, overlay);
          break;
        case 'court_lines':
          this.renderCourtLines(frame, overlay);
          break;
        default:
          console.log(`Rendering overlay: ${overlay.type} at (${overlay.position.x}, ${overlay.position.y})`);
      }
    });
    
    return frame;
  }

  private renderBallMarker(frame: Buffer, overlay: VideoOverlay): void {
    const { position, data, style } = overlay;
    console.log(`Rendering ball marker at (${position.x}, ${position.y}) with confidence ${data.confidence}`);
    
    // In real implementation, would draw a circle or marker at the position
  }

  private renderCameraIndicator(frame: Buffer, overlay: VideoOverlay): void {
    const { position, data, style } = overlay;
    console.log(`Rendering camera indicator: ${data.cameraName} at (${position.x}, ${position.y})`);
    
    // In real implementation, would draw text overlay
  }

  private renderCourtLines(frame: Buffer, overlay: VideoOverlay): void {
    const { data } = overlay;
    console.log(`Rendering ${data.lines.length} court lines`);
    
    // In real implementation, would draw court line overlays
  }
}