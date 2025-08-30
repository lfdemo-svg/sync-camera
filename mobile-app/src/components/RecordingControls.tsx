import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: screenHeight } = Dimensions.get('window');

interface RecordingControlsProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  onToggleGrid: () => void;
  showGrid: boolean;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  onToggleRecording,
  onToggleGrid,
  showGrid,
}) => {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.controls}>
        <View style={styles.recordingIndicator}>
          <Text style={[styles.recordingStatus, isRecording && styles.recordingStatusActive]}>
            {isRecording ? 'Recording' : 'Ready to Record'}
          </Text>
          {isRecording && (
            <View style={styles.recordingPulse}>
              <View style={styles.pulseRing} />
            </View>
          )}
        </View>
        
        <View style={styles.controlButtons}>
          {/* Grid Toggle */}
          <TouchableOpacity
            style={[styles.controlButton, showGrid && styles.controlButtonActive]}
            onPress={onToggleGrid}
          >
            <Ionicons name="grid" size={24} color="#fff" />
          </TouchableOpacity>
          
          {/* Record Button */}
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={onToggleRecording}
          >
            <Ionicons 
              name={isRecording ? 'stop' : 'radio-button-on'} 
              size={32} 
              color="#fff" 
            />
          </TouchableOpacity>
          
          {/* Settings Button */}
          <TouchableOpacity style={styles.controlButton} onPress={() => {}}>
            <Ionicons name="settings" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  controls: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
  },
  recordingIndicator: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  recordingStatus: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  recordingStatusActive: {
    color: '#ff4444',
  },
  recordingPulse: {
    position: 'absolute',
    top: -30,
    left: '50%',
    marginLeft: -10,
  },
  pulseRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff4444',
    opacity: 0.8,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  controlButtonActive: {
    backgroundColor: '#44ff44',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  recordButtonActive: {
    backgroundColor: '#ff4444',
    borderColor: '#ff6666',
  },
});