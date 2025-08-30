import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Device from 'expo-device';
import { Ionicons } from '@expo/vector-icons';

import { CameraOverlay } from '../components/CameraOverlay';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { RecordingControls } from '../components/RecordingControls';
import { MetricsDisplay } from '../components/MetricsDisplay';
import { SocketService } from '../services/SocketService';
import { CameraService } from '../services/CameraService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const CameraScreen: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [cameraId, setCameraId] = useState('camera_a');
  const [metrics, setMetrics] = useState({
    fps: 0,
    latency: 0,
    battery: 100,
    duration: '00:00:00'
  });

  const cameraRef = useRef<CameraView>(null);
  const socketService = useRef<SocketService | null>(null);
  const cameraService = useRef<CameraService | null>(null);
  const recordingStartTime = useRef<number | null>(null);

  useEffect(() => {
    initializeApp();
    return () => {
      cleanup();
    };
  }, []);

  const initializeApp = async () => {
    await requestPermissions();
    await setupOrientation();
    setupServices();
  };

  const requestPermissions = async () => {
    const { status } = await CameraView.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'This app needs camera access to function properly.',
        [{ text: 'OK' }]
      );
    }
  };

  const setupOrientation = async () => {
    // Lock orientation based on device type
    if (Device.deviceType === Device.DeviceType.PHONE) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    } else {
      await ScreenOrientation.unlockAsync();
    }
  };

  const setupServices = () => {
    // Initialize socket service
    socketService.current = new SocketService();
    socketService.current.on('connect', () => {
      setIsConnected(true);
      socketService.current?.registerCamera(cameraId, getCameraCapabilities());
    });

    socketService.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketService.current.on('recording-command', (command: 'start' | 'stop') => {
      if (command === 'start') {
        startRecording();
      } else {
        stopRecording();
      }
    });

    socketService.current.on('sync-signal', (data: { latency: number }) => {
      setMetrics(prev => ({ ...prev, latency: data.latency }));
    });

    // Initialize camera service
    cameraService.current = new CameraService();
    cameraService.current.on('frame', (frameData: ArrayBuffer) => {
      if (isRecording && socketService.current) {
        socketService.current.sendVideoChunk(cameraId, frameData);
      }
    });

    // Start services
    socketService.current.connect();
  };

  const cleanup = () => {
    if (socketService.current) {
      socketService.current.disconnect();
    }
    if (cameraService.current) {
      cameraService.current.cleanup();
    }
  };

  const getCameraCapabilities = () => {
    return {
      width: screenWidth,
      height: screenHeight,
      frameRate: 30,
      aspectRatio: screenWidth / screenHeight,
    };
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      setIsRecording(true);
      recordingStartTime.current = Date.now();
      
      // Start camera recording
      await cameraService.current?.startRecording(cameraRef.current);
      
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    try {
      setIsRecording(false);
      recordingStartTime.current = null;
      
      // Stop camera recording
      await cameraService.current?.stopRecording();
      
      setMetrics(prev => ({ ...prev, duration: '00:00:00' }));
      console.log('Recording stopped');
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const toggleGrid = () => {
    setShowGrid(!showGrid);
  };

  const switchCamera = () => {
    const newCameraId = cameraId === 'camera_a' ? 'camera_b' : 'camera_a';
    setCameraId(newCameraId);
    
    if (socketService.current) {
      socketService.current.registerCamera(newCameraId, getCameraCapabilities());
    }
  };

  // Update recording duration
  useEffect(() => {
    if (!isRecording || !recordingStartTime.current) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - recordingStartTime.current!;
      const duration = formatDuration(elapsed);
      setMetrics(prev => ({ ...prev, duration }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording]);

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting camera permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-off" size={64} color="#666" />
        <Text style={styles.permissionText}>Camera access denied</Text>
        <Text style={styles.permissionSubtext}>
          Please enable camera permissions in your device settings
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        />
        
        <CameraOverlay showGrid={showGrid} />
        
        <ConnectionStatus
          cameraId={cameraId}
          isConnected={isConnected}
          onSwitchCamera={switchCamera}
        />
        
        <RecordingControls
          isRecording={isRecording}
          onToggleRecording={toggleRecording}
          onToggleGrid={toggleGrid}
          showGrid={showGrid}
        />
        
        <MetricsDisplay
          metrics={metrics}
          isRecording={isRecording}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  permissionText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  permissionSubtext: {
    color: '#cccccc',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});