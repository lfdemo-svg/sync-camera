import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';
import Constants from 'expo-constants';

interface CameraCapabilities {
  width: number;
  height: number;
  frameRate: number;
  aspectRatio: number;
}

export class SocketService extends EventEmitter {
  private socket: Socket | null = null;
  private serverUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;

  constructor() {
    super();
    
    // Get server URL from app config or use default
    this.serverUrl = Constants.expoConfig?.extra?.serverUrl || 'http://192.168.1.100:3000';
    
    console.log('SocketService initialized with server URL:', this.serverUrl);
  }

  connect(): void {
    if (this.socket?.connected) return;

    try {
      this.socket = io(this.serverUrl, {
        transports: ['websocket'],
        timeout: 5000,
        forceNew: true,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Socket connection error:', error);
      this.emit('error', error);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected to server');
      this.reconnectAttempts = 0;
      this.emit('connect');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.emit('disconnect', reason);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.handleReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.emit('error', error);
      this.handleReconnection();
    });

    this.socket.on('recording-command', (data) => {
      console.log('Received recording command:', data);
      this.emit('recording-command', data.command);
    });

    this.socket.on('sync-signal', (data) => {
      this.emit('sync-signal', data);
    });

    this.socket.on('camera-status-update', (data) => {
      this.emit('camera-status-update', data);
    });

    this.socket.on('server-message', (data) => {
      console.log('Server message:', data);
      this.emit('server-message', data);
    });
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      this.emit('max-reconnect-attempts');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  registerCamera(cameraId: string, capabilities: CameraCapabilities): void {
    if (!this.socket?.connected) {
      console.warn('Cannot register camera - socket not connected');
      return;
    }

    this.socket.emit('camera-register', {
      cameraId,
      capabilities,
      timestamp: Date.now(),
      deviceInfo: {
        platform: 'mobile',
        type: 'expo'
      }
    });

    console.log('Camera registered:', cameraId);
  }

  sendVideoChunk(cameraId: string, videoData: ArrayBuffer): void {
    if (!this.socket?.connected) {
      console.warn('Cannot send video chunk - socket not connected');
      return;
    }

    this.socket.emit('video-chunk', {
      cameraId,
      timestamp: Date.now(),
      data: videoData,
      size: videoData.byteLength
    });
  }

  sendCameraMetrics(cameraId: string, metrics: any): void {
    if (!this.socket?.connected) return;

    this.socket.emit('camera-metrics', {
      cameraId,
      timestamp: Date.now(),
      metrics
    });
  }

  sendHeartbeat(cameraId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('camera-heartbeat', {
      cameraId,
      timestamp: Date.now()
    });
  }

  joinSession(sessionId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('join-session', sessionId);
  }

  leaveSession(sessionId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('leave-session', sessionId);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionState(): string {
    if (!this.socket) return 'disconnected';
    return this.socket.connected ? 'connected' : 'connecting';
  }
}