# Expo Setup Guide for Sync-Camera Mobile App

## 🚀 Quick Start with Expo

### Prerequisites
- **Node.js 18+** installed on development machine
- **Expo CLI** installed globally
- **Expo Go app** installed on both phones
- **WiFi network** connecting all devices

### Complete Setup Process

#### 1. Install Dependencies
```bash
# Install all dependencies (backend + mobile)
npm run setup:all

# Or manually:
npm install
npm run mobile:install
npm run build
```

#### 2. Start Development Environment
```bash
# Terminal 1: Start backend server
npm run dev

# Terminal 2: Start Expo development server
npm run mobile:start
```

#### 3. Connect Mobile Devices

**Option A: QR Code (Recommended)**
1. Expo CLI will display a QR code in terminal
2. Open Expo Go app on Phone A
3. Scan QR code to load app
4. Repeat for Phone B

**Option B: Development URL**
1. Note the development URL (e.g., `exp://192.168.1.100:19000`)
2. Enter URL manually in Expo Go app
3. App will load and connect to server

## 📱 Mobile App Development

### Project Structure
```
mobile-app/
├── App.tsx                 # Main app entry point
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── CameraOverlay.tsx
│   │   ├── ConnectionStatus.tsx
│   │   ├── RecordingControls.tsx
│   │   └── MetricsDisplay.tsx
│   ├── screens/           # Screen components
│   │   └── CameraScreen.tsx
│   ├── services/          # Business logic
│   │   ├── SocketService.ts
│   │   └── CameraService.ts
│   └── utils/             # Constants and helpers
│       └── constants.ts
├── assets/                # Images and icons
└── babel.config.js        # Babel configuration
```

### Key Features Implemented

#### Camera Integration
- **expo-camera**: High-quality video capture
- **expo-av**: Audio/video processing
- **expo-media-library**: Local storage management

#### Real-time Communication  
- **socket.io-client**: WebSocket connection to server
- **Automatic reconnection** with exponential backoff
- **Heartbeat monitoring** for connection health

#### Device Integration
- **expo-battery**: Battery level monitoring
- **expo-network**: Network status detection  
- **expo-keep-awake**: Prevent screen sleep
- **expo-screen-orientation**: Lock orientation

#### Professional UI/UX
- **React Native components** with custom styling
- **Safe area handling** for different screen sizes
- **Dark theme** optimized for court environments
- **Gesture controls** with accessibility support

## 🔧 Configuration

### Server Connection
Update server URL in mobile app:

**Method 1: Environment Variable**
```bash
# In mobile-app/.env
SERVER_URL=http://192.168.1.100:3000
```

**Method 2: Constants File**
```typescript
// src/utils/constants.ts
export const APP_CONFIG = {
  SERVER_URL: 'http://YOUR_SERVER_IP:3000',
};
```

### Camera Settings
```typescript
// src/utils/constants.ts
export const CAMERA_CONFIG = {
  VIDEO_QUALITY: '1080p',
  FRAME_RATE: 30,
  STREAMING_FPS: 10,
  MAX_RECORDING_DURATION: 3600, // 1 hour
};
```

## 🏗️ Building for Production

### Development Build (Expo Go)
```bash
# Start development server
npm run mobile:start

# Options for different platforms
npm run mobile:ios      # iOS simulator
npm run mobile:android  # Android emulator  
npm run mobile:web      # Web browser
```

### Production Build (Standalone App)

#### Setup EAS Build
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure build
cd mobile-app
eas build:configure
```

#### Build for Android
```bash
npm run mobile:build:android

# Or with specific profile
cd mobile-app
eas build --platform android --profile production
```

#### Build for iOS (Requires Apple Developer Account)
```bash
npm run mobile:build:ios

# Or with specific profile  
cd mobile-app
eas build --platform ios --profile production
```

### Distribution Options

#### Internal Testing
```bash
# Build and share internally
eas build --platform all --profile preview

# Submit to internal testing
eas submit --platform android
eas submit --platform ios
```

#### App Store Deployment
```bash
# Production builds
eas build --platform all --profile production

# Submit to stores
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

## 🧪 Testing and Debugging

### Development Testing
```bash
# Run on connected devices
npm run mobile:android  # Physical Android device
npm run mobile:ios      # Physical iOS device

# Debug with Chrome DevTools
# Enable "Remote JS Debugging" in app
```

### Performance Testing
- **Network latency**: Monitor WebSocket connection
- **Frame rate**: Check camera FPS counter  
- **Battery usage**: Monitor power consumption
- **Memory usage**: Use React Native performance tools

### Common Issues

#### Connection Problems
```bash
# Check server is running
curl http://localhost:3000/api/health

# Verify network connectivity
ping YOUR_SERVER_IP

# Check firewall settings
sudo ufw status
```

#### Camera Permission Issues
- Ensure camera permissions granted in phone settings
- Check `app.json` for correct permission configuration
- Restart app after permission changes

#### Build Errors
```bash
# Clear Expo cache
expo start --clear

# Reset Metro bundler
npx react-native start --reset-cache

# Reinstall dependencies
rm -rf node_modules && npm install
```

## 📊 Monitoring and Analytics

### Built-in Metrics
- **Connection status**: Real-time server connectivity
- **Camera performance**: FPS, resolution, latency
- **Device status**: Battery, storage, network type
- **Recording metrics**: Duration, file size, quality

### Debug Information
```typescript
// Enable verbose logging
console.log('Camera Service:', cameraService.getState());
console.log('Socket Status:', socketService.getConnectionState());
```

### Performance Monitoring
```typescript
// Monitor WebSocket latency
socketService.on('sync-signal', (data) => {
  const latency = Date.now() - data.timestamp;
  console.log('WebSocket latency:', latency, 'ms');
});
```

## 🔐 Security Considerations

### Network Security
- **HTTPS/WSS**: Use secure connections in production
- **IP whitelisting**: Restrict server access to known devices
- **Authentication**: Implement device registration tokens

### Data Privacy
- **Local storage**: Video stored locally on devices
- **No cloud uploads**: All processing on local network
- **Permission management**: Camera/microphone access controlled

### Production Hardening
```json
// app.json - Production configuration
{
  "expo": {
    "privacy": "hidden",
    "updates": {
      "enabled": false
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "requireFullScreen": true,
      "supportsTablet": false
    },
    "android": {
      "permissions": [
        "CAMERA",
        "RECORD_AUDIO", 
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ]
    }
  }
}
```

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Server running and accessible on network
- [ ] Mobile apps built and tested
- [ ] Camera permissions granted on both phones
- [ ] Network connectivity verified
- [ ] Court positioning marked and calibrated

### Day-of-Match
- [ ] All devices charged (>80% battery)
- [ ] WiFi network stable and exclusive
- [ ] Backup recording method available
- [ ] Emergency contact for technical support
- [ ] Storage space available (>10GB per phone)

### Post-Match
- [ ] Recordings saved and backed up
- [ ] Battery levels checked
- [ ] Equipment safely dismounted
- [ ] Network logs reviewed for issues
- [ ] Performance metrics documented

---

This Expo setup provides a professional mobile app solution that integrates seamlessly with the sync-camera backend for complete Padel court coverage! 🎾