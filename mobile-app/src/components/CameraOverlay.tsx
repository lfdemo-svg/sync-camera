import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CameraOverlayProps {
  showGrid: boolean;
}

export const CameraOverlay: React.FC<CameraOverlayProps> = ({ showGrid }) => {
  if (!showGrid) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* Rule of thirds grid lines */}
      <View style={[styles.gridLine, styles.verticalLine, { left: screenWidth / 3 }]} />
      <View style={[styles.gridLine, styles.verticalLine, { left: (screenWidth * 2) / 3 }]} />
      <View style={[styles.gridLine, styles.horizontalLine, { top: screenHeight / 3 }]} />
      <View style={[styles.gridLine, styles.horizontalLine, { top: (screenHeight * 2) / 3 }]} />
      
      {/* Court positioning guides */}
      <View style={styles.courtGuides}>
        {/* Center line indicator */}
        <View style={[styles.courtLine, styles.centerLine]} />
        
        {/* Corner markers */}
        <View style={[styles.cornerMarker, styles.topLeftCorner]} />
        <View style={[styles.cornerMarker, styles.topRightCorner]} />
        <View style={[styles.cornerMarker, styles.bottomLeftCorner]} />
        <View style={[styles.cornerMarker, styles.bottomRightCorner]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  verticalLine: {
    width: 1,
    height: '100%',
  },
  horizontalLine: {
    height: 1,
    width: '100%',
  },
  courtGuides: {
    flex: 1,
    position: 'relative',
  },
  courtLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 184, 0, 0.6)', // Amber color for court lines
  },
  centerLine: {
    top: '50%',
    left: '10%',
    right: '10%',
    height: 2,
    marginTop: -1,
  },
  cornerMarker: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: 'rgba(255, 184, 0, 0.8)',
    borderWidth: 2,
  },
  topLeftCorner: {
    top: '15%',
    left: '15%',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRightCorner: {
    top: '15%',
    right: '15%',
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeftCorner: {
    bottom: '15%',
    left: '15%',
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRightCorner: {
    bottom: '15%',
    right: '15%',
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
});