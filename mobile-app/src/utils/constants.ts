// App constants and configuration
export const APP_CONFIG = {
  SERVER_URL: 'http://192.168.1.100:3000', // Default server URL - should be configured per deployment
  SOCKET_TIMEOUT: 5000,
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_INTERVAL: 3000,
  HEARTBEAT_INTERVAL: 30000,
};

export const CAMERA_CONFIG = {
  VIDEO_QUALITY: '1080p' as const,
  FRAME_RATE: 30,
  STREAMING_FPS: 10, // FPS for frame streaming
  MAX_RECORDING_DURATION: 3600, // 1 hour in seconds
  PICTURE_QUALITY: 0.8,
};

export const COURT_DIMENSIONS = {
  WIDTH: 10, // meters
  LENGTH: 20, // meters
  NET_HEIGHT: 0.88, // meters
  SERVICE_LINE_DISTANCE: 6.95, // meters from net
};

export const CAMERA_POSITIONS = {
  CAMERA_A: {
    x: 5.0, // Center of court width
    y: 0.0, // Back wall A
    height: 1.35, // 4'5" from floor
    wall: 'back_a' as const,
  },
  CAMERA_B: {
    x: 5.0, // Center of court width  
    y: 20.0, // Back wall B
    height: 1.35, // 4'5" from floor
    wall: 'back_b' as const,
  },
};

export const UI_CONSTANTS = {
  COLORS: {
    PRIMARY: '#1976D2',
    SECONDARY: '#26A69A',
    ACCENT: '#FFB300',
    SUCCESS: '#4CAF50',
    WARNING: '#FF9800',
    ERROR: '#D32F2F',
    BACKGROUND: '#000000',
    SURFACE: '#1E1E1E',
    TEXT_PRIMARY: '#FFFFFF',
    TEXT_SECONDARY: '#CCCCCC',
  },
  ANIMATIONS: {
    PULSE_DURATION: 2000,
    TRANSITION_DURATION: 200,
  },
};

export const METRICS_THRESHOLDS = {
  LATENCY: {
    GOOD: 50, // ms
    WARNING: 100, // ms
    ERROR: 200, // ms
  },
  BATTERY: {
    LOW: 20, // %
    MEDIUM: 50, // %
  },
  FPS: {
    TARGET: 30,
    MINIMUM: 15,
  },
};

export const ERROR_MESSAGES = {
  CAMERA_PERMISSION: 'Camera permission is required to use this app',
  CAMERA_ACCESS_FAILED: 'Failed to access camera',
  CONNECTION_FAILED: 'Failed to connect to sync server',
  RECORDING_FAILED: 'Failed to start recording',
  NETWORK_ERROR: 'Network connection error',
};