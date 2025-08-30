import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ConnectionStatusProps {
  cameraId: string;
  isConnected: boolean;
  onSwitchCamera: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  cameraId,
  isConnected,
  onSwitchCamera,
}) => {
  const cameraName = cameraId === 'camera_a' ? 'Camera A (Back Wall)' : 'Camera B (Back Wall)';
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.cameraInfo}>
          <Text style={styles.cameraName}>{cameraName}</Text>
          <View style={styles.connectionStatus}>
            <View style={[styles.statusDot, isConnected && styles.statusDotConnected]} />
            <Text style={styles.statusText}>
              {isConnected ? 'Connected' : 'Connecting...'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.switchButton} onPress={onSwitchCamera}>
          <Ionicons name="camera-reverse" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
  },
  cameraInfo: {
    flex: 1,
  },
  cameraName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff4444',
    marginRight: 8,
  },
  statusDotConnected: {
    backgroundColor: '#44ff44',
  },
  statusText: {
    color: '#cccccc',
    fontSize: 14,
  },
  switchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
});