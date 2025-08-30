// React Native polyfills for Node.js modules
import 'react-native-get-random-values';

// Polyfill for EventEmitter
import { EventEmitter } from 'events';

// Make EventEmitter available globally if needed
if (typeof global !== 'undefined') {
  global.EventEmitter = EventEmitter;
}