import { EventEmitter } from 'events';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

export class CameraService extends EventEmitter {
  private isRecording = false;
  private recordingPromise: Promise<any> | null = null;
  private frameInterval: NodeJS.Timeout | null = null;
  private frameCount = 0;
  
  constructor() {
    super();
  }

  async startRecording(cameraRef: Camera): Promise<void> {
    if (this.isRecording) {
      console.warn('Recording already in progress');
      return;
    }

    try {
      this.isRecording = true;
      
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Media library permission not granted');
      }

      // Start video recording
      this.recordingPromise = cameraRef.recordAsync({
        quality: Camera.Constants.VideoQuality['1080p'],
        maxDuration: 3600, // 1 hour max
        mute: false,
      });

      // Start frame capture for streaming
      this.startFrameCapture(cameraRef);
      
      console.log('Recording started');
      this.emit('recording-started');

    } catch (error) {
      this.isRecording = false;
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.isRecording) {
      console.warn('No recording in progress');
      return;
    }

    try {
      this.isRecording = false;
      
      // Stop frame capture
      if (this.frameInterval) {
        clearInterval(this.frameInterval);
        this.frameInterval = null;
      }

      // Stop video recording
      if (this.recordingPromise) {
        const recordingResult = await this.recordingPromise;
        this.recordingPromise = null;
        
        console.log('Recording stopped, saved to:', recordingResult.uri);
        this.emit('recording-stopped', recordingResult);
        
        return recordingResult;
      }

    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  }

  private startFrameCapture(cameraRef: Camera): void {
    // Capture frames for streaming at 10 FPS (every 100ms)
    this.frameInterval = setInterval(async () => {
      if (!this.isRecording) return;

      try {
        // Take a picture for frame streaming
        const photo = await cameraRef.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: true,
        });

        this.frameCount++;
        
        // Convert to ArrayBuffer for streaming (simplified)
        // In a real implementation, you'd want to process this properly
        const response = await fetch(photo.uri);
        const arrayBuffer = await response.arrayBuffer();
        
        this.emit('frame', arrayBuffer);

      } catch (error) {
        console.warn('Frame capture error:', error);
      }
    }, 100); // 10 FPS
  }

  pauseRecording(): void {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }
    this.emit('recording-paused');
  }

  resumeRecording(cameraRef: Camera): void {
    if (this.isRecording) {
      this.startFrameCapture(cameraRef);
      this.emit('recording-resumed');
    }
  }

  getRecordingState(): boolean {
    return this.isRecording;
  }

  getFrameCount(): number {
    return this.frameCount;
  }

  resetFrameCount(): void {
    this.frameCount = 0;
  }

  async takePicture(cameraRef: Camera): Promise<any> {
    try {
      const photo = await cameraRef.takePictureAsync({
        quality: 1,
        base64: false,
        exif: true,
      });

      console.log('Picture taken:', photo.uri);
      return photo;

    } catch (error) {
      console.error('Error taking picture:', error);
      throw error;
    }
  }

  cleanup(): void {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }
    
    this.isRecording = false;
    this.recordingPromise = null;
    this.frameCount = 0;
    
    console.log('CameraService cleaned up');
  }
}