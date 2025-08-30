import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Battery from 'expo-battery';
import * as Network from 'expo-network';

interface MetricsDisplayProps {
  metrics: {
    fps: number;
    latency: number;
    battery: number;
    duration: string;
  };
  isRecording: boolean;
}

export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ metrics, isRecording }) => {
  const [batteryLevel, setBatteryLevel] = useState(0);
  const [networkType, setNetworkType] = useState('');

  useEffect(() => {
    updateBatteryLevel();
    updateNetworkInfo();
    
    const interval = setInterval(() => {
      updateBatteryLevel();
      updateNetworkInfo();
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const updateBatteryLevel = async () => {
    try {
      const level = await Battery.getBatteryLevelAsync();
      setBatteryLevel(Math.round(level * 100));
    } catch (error) {
      console.log('Battery level not available');
    }
  };

  const updateNetworkInfo = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      setNetworkType(networkState.type || '');
    } catch (error) {
      console.log('Network info not available');
    }
  };

  return (
    <View style={styles.container}>
      {isRecording && (
        <View style={styles.recordingDuration}>
          <Text style={styles.durationText}>{metrics.duration}</Text>
        </View>
      )}
      
      <View style={styles.metricsGrid}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{metrics.fps}</Text>
          <Text style={styles.metricLabel}>FPS</Text>
        </View>
        
        <View style={styles.metric}>
          <Text style={[
            styles.metricValue,
            { color: metrics.latency > 100 ? '#ff4444' : '#44ff44' }
          ]}>
            {metrics.latency}ms
          </Text>
          <Text style={styles.metricLabel}>Latency</Text>
        </View>
        
        <View style={styles.metric}>
          <Text style={[
            styles.metricValue,
            { color: batteryLevel < 20 ? '#ff4444' : batteryLevel < 50 ? '#ffaa00' : '#44ff44' }
          ]}>
            {batteryLevel}%
          </Text>
          <Text style={styles.metricLabel}>Battery</Text>
        </View>
        
        <View style={styles.metric}>
          <Text style={styles.metricValue}>
            {networkType === 'WIFI' ? 'WiFi' : networkType || '--'}
          </Text>
          <Text style={styles.metricLabel}>Network</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 20,
    zIndex: 3,
  },
  recordingDuration: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  durationText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  metricsGrid: {
    flexDirection: 'column',
    gap: 8,
  },
  metric: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 70,
  },
  metricValue: {
    color: '#44ff44',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  metricLabel: {
    color: '#cccccc',
    fontSize: 10,
    marginTop: 2,
  },
});
