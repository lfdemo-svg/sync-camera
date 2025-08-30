export interface TimeSync {
  systemTime: number;  // Local system timestamp
  ntpTime: number;     // NTP synchronized time
  offset: number;      // Difference between system and NTP time
  accuracy: number;    // Estimated accuracy in ms
  lastSyncAt: Date;
}

export interface CameraTimeSync {
  cameraId: string;
  localOffset: number;    // Camera's local time offset from system
  networkDelay: number;   // Network delay to camera
  clockDrift: number;     // Drift rate in ms/hour
  lastSyncAt: Date;
  reliability: 'high' | 'medium' | 'low';
}

export class TimestampManager {
  private masterTimeSync?: TimeSync;
  private cameraTimeSyncs: Map<string, CameraTimeSync> = new Map();
  private syncInterval?: NodeJS.Timeout;
  private driftCheckInterval?: NodeJS.Timeout;

  // Configuration
  private readonly SYNC_INTERVAL_MS = 60000;      // Sync every minute
  private readonly DRIFT_CHECK_INTERVAL_MS = 300000; // Check drift every 5 minutes
  private readonly MAX_ACCEPTABLE_DRIFT = 10;      // Max drift in ms before resync

  constructor() {
    console.log('TimestampManager initialized');
  }

  /**
   * Start timestamp synchronization service
   */
  public async startTimestampSync(): Promise<boolean> {
    try {
      // Initial NTP sync
      await this.performNTPSync();
      
      // Start periodic sync
      this.syncInterval = setInterval(async () => {
        await this.performNTPSync();
      }, this.SYNC_INTERVAL_MS);

      // Start drift monitoring
      this.driftCheckInterval = setInterval(() => {
        this.checkClockDrift();
      }, this.DRIFT_CHECK_INTERVAL_MS);

      console.log('Timestamp synchronization started');
      return true;
    } catch (error) {
      console.error('Failed to start timestamp sync:', error);
      return false;
    }
  }

  /**
   * Stop timestamp synchronization service
   */
  public stopTimestampSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }

    if (this.driftCheckInterval) {
      clearInterval(this.driftCheckInterval);
      this.driftCheckInterval = undefined;
    }

    console.log('Timestamp synchronization stopped');
  }

  /**
   * Get current synchronized timestamp
   */
  public getSynchronizedTimestamp(): number {
    const now = Date.now();
    
    if (this.masterTimeSync) {
      // Apply NTP offset for more accurate timestamp
      return now + this.masterTimeSync.offset;
    }
    
    return now;
  }

  /**
   * Register camera for time synchronization
   */
  public async registerCamera(cameraId: string): Promise<boolean> {
    try {
      const cameraTimeSync: CameraTimeSync = {
        cameraId,
        localOffset: 0,
        networkDelay: await this.measureNetworkDelay(cameraId),
        clockDrift: 0,
        lastSyncAt: new Date(),
        reliability: 'high'
      };

      this.cameraTimeSyncs.set(cameraId, cameraTimeSync);
      console.log(`Camera ${cameraId} registered for time sync`);
      return true;
    } catch (error) {
      console.error(`Failed to register camera ${cameraId}:`, error);
      return false;
    }
  }

  /**
   * Synchronize camera timestamp
   */
  public async syncCameraTimestamp(cameraId: string): Promise<boolean> {
    const cameraSync = this.cameraTimeSyncs.get(cameraId);
    if (!cameraSync) {
      console.error(`Camera ${cameraId} not registered`);
      return false;
    }

    try {
      // Measure round-trip time to camera
      const startTime = this.getSynchronizedTimestamp();
      
      // In real implementation, this would ping the camera
      const networkDelay = await this.measureNetworkDelay(cameraId);
      
      // Calculate camera time offset
      const localOffset = await this.calculateCameraOffset(cameraId);
      
      cameraSync.localOffset = localOffset;
      cameraSync.networkDelay = networkDelay;
      cameraSync.lastSyncAt = new Date();

      console.log(`Camera ${cameraId} time sync completed: offset=${localOffset}ms, delay=${networkDelay}ms`);
      return true;
    } catch (error) {
      console.error(`Failed to sync camera ${cameraId}:`, error);
      cameraSync.reliability = 'low';
      return false;
    }
  }

  /**
   * Get camera-adjusted timestamp
   */
  public getCameraTimestamp(cameraId: string, systemTimestamp?: number): number {
    const baseTimestamp = systemTimestamp || this.getSynchronizedTimestamp();
    const cameraSync = this.cameraTimeSyncs.get(cameraId);
    
    if (cameraSync) {
      // Adjust for camera's local offset and network delay
      return baseTimestamp - cameraSync.localOffset - (cameraSync.networkDelay / 2);
    }
    
    return baseTimestamp;
  }

  /**
   * Validate timestamp accuracy across cameras
   */
  public validateTimestampAccuracy(): {
    isAccurate: boolean;
    maxDrift: number;
    cameraStatus: Map<string, { drift: number; reliability: string }>;
    recommendations: string[];
  } {
    const cameraStatus = new Map<string, { drift: number; reliability: string }>();
    const recommendations: string[] = [];
    
    let maxDrift = 0;
    let reliableCameras = 0;
    
    this.cameraTimeSyncs.forEach((cameraSync, cameraId) => {
      const drift = Math.abs(cameraSync.clockDrift);
      cameraStatus.set(cameraId, {
        drift,
        reliability: cameraSync.reliability
      });
      
      maxDrift = Math.max(maxDrift, drift);
      if (cameraSync.reliability === 'high') {
        reliableCameras++;
      }
    });

    // Check master time sync
    if (!this.masterTimeSync || this.masterTimeSync.accuracy > 10) {
      recommendations.push('NTP sync required or poor accuracy');
    }

    // Check camera reliability
    if (reliableCameras < this.cameraTimeSyncs.size) {
      recommendations.push(`${this.cameraTimeSyncs.size - reliableCameras} cameras have unreliable time sync`);
    }

    // Check drift
    if (maxDrift > this.MAX_ACCEPTABLE_DRIFT) {
      recommendations.push(`Clock drift detected (${maxDrift.toFixed(2)}ms) - resync required`);
    }

    // Check sync freshness
    const staleThreshold = Date.now() - (5 * 60 * 1000); // 5 minutes ago
    const staleCameras = Array.from(this.cameraTimeSyncs.values())
      .filter(sync => sync.lastSyncAt.getTime() < staleThreshold).length;
    
    if (staleCameras > 0) {
      recommendations.push(`${staleCameras} cameras need time sync refresh`);
    }

    return {
      isAccurate: maxDrift <= this.MAX_ACCEPTABLE_DRIFT && reliableCameras === this.cameraTimeSyncs.size,
      maxDrift,
      cameraStatus,
      recommendations
    };
  }

  /**
   * Generate timestamp synchronization report
   */
  public generateSyncReport(): string {
    const validation = this.validateTimestampAccuracy();
    
    let report = `# Timestamp Synchronization Report\n\n`;
    
    if (this.masterTimeSync) {
      report += `## Master Time Sync\n`;
      report += `- **NTP Accuracy:** ±${this.masterTimeSync.accuracy.toFixed(2)}ms\n`;
      report += `- **System Offset:** ${this.masterTimeSync.offset > 0 ? '+' : ''}${this.masterTimeSync.offset.toFixed(2)}ms\n`;
      report += `- **Last Sync:** ${this.masterTimeSync.lastSyncAt.toISOString().split('T')[1].split('.')[0]}\n\n`;
    }

    report += `## Camera Time Synchronization\n`;
    this.cameraTimeSyncs.forEach((cameraSync, cameraId) => {
      const status = validation.cameraStatus.get(cameraId);
      const reliabilityIcon = {
        high: '🟢',
        medium: '🟡',
        low: '🔴'
      }[cameraSync.reliability];
      
      report += `### ${cameraId} ${reliabilityIcon}\n`;
      report += `- **Local Offset:** ${cameraSync.localOffset > 0 ? '+' : ''}${cameraSync.localOffset.toFixed(2)}ms\n`;
      report += `- **Network Delay:** ${cameraSync.networkDelay.toFixed(2)}ms\n`;
      report += `- **Clock Drift:** ${cameraSync.clockDrift.toFixed(2)}ms/hour\n`;
      report += `- **Reliability:** ${cameraSync.reliability}\n`;
      report += `- **Last Sync:** ${cameraSync.lastSyncAt.toISOString().split('T')[1].split('.')[0]}\n\n`;
    });

    report += `## Overall Status\n`;
    report += `- **Accuracy:** ${validation.isAccurate ? '✅ Acceptable' : '❌ Poor'}\n`;
    report += `- **Max Drift:** ${validation.maxDrift.toFixed(2)}ms\n`;
    report += `- **Cameras Synced:** ${this.cameraTimeSyncs.size}\n\n`;

    if (validation.recommendations.length > 0) {
      report += `## Recommendations\n`;
      validation.recommendations.forEach(rec => {
        report += `- ${rec}\n`;
      });
    }

    return report;
  }

  /**
   * Force resync of all timestamps
   */
  public async forceResyncAll(): Promise<boolean> {
    console.log('Force resyncing all timestamps...');
    
    try {
      // Resync master time
      await this.performNTPSync();
      
      // Resync all cameras
      const syncPromises = Array.from(this.cameraTimeSyncs.keys())
        .map(cameraId => this.syncCameraTimestamp(cameraId));
      
      const results = await Promise.allSettled(syncPromises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      console.log(`Resync completed: ${successCount}/${this.cameraTimeSyncs.size} cameras successful`);
      return successCount === this.cameraTimeSyncs.size;
    } catch (error) {
      console.error('Force resync failed:', error);
      return false;
    }
  }

  /**
   * Perform NTP synchronization (simplified implementation)
   */
  private async performNTPSync(): Promise<void> {
    try {
      // In real implementation, this would use actual NTP protocol
      // For now, simulate NTP sync with reasonable accuracy
      const systemTime = Date.now();
      const simulatedNTPTime = systemTime + Math.random() * 20 - 10; // ±10ms variation
      const offset = simulatedNTPTime - systemTime;
      const accuracy = Math.abs(offset) + Math.random() * 5; // Simulated accuracy
      
      this.masterTimeSync = {
        systemTime,
        ntpTime: simulatedNTPTime,
        offset,
        accuracy,
        lastSyncAt: new Date()
      };

      console.log(`NTP sync completed: offset=${offset.toFixed(2)}ms, accuracy=±${accuracy.toFixed(2)}ms`);
    } catch (error) {
      console.error('NTP sync failed:', error);
      throw error;
    }
  }

  /**
   * Measure network delay to camera (ping equivalent)
   */
  private async measureNetworkDelay(cameraId: string): Promise<number> {
    // Simulate network ping measurement
    // In real implementation, would measure actual round-trip time
    const baseDelay = Math.random() * 10 + 2; // 2-12ms simulated delay
    
    console.log(`Network delay to ${cameraId}: ${baseDelay.toFixed(2)}ms`);
    return baseDelay;
  }

  /**
   * Calculate camera time offset
   */
  private async calculateCameraOffset(cameraId: string): Promise<number> {
    // Simulate camera time offset calculation
    // In real implementation, would compare camera's reported time with system time
    const offset = (Math.random() - 0.5) * 40; // ±20ms simulated offset
    
    console.log(`Camera ${cameraId} time offset: ${offset.toFixed(2)}ms`);
    return offset;
  }

  /**
   * Check for clock drift across cameras
   */
  private checkClockDrift(): void {
    console.log('Checking clock drift...');
    
    this.cameraTimeSyncs.forEach((cameraSync, cameraId) => {
      // Simulate drift detection
      // In real implementation, would analyze timestamp patterns over time
      const timeSinceLastSync = Date.now() - cameraSync.lastSyncAt.getTime();
      const expectedDrift = (cameraSync.clockDrift * timeSinceLastSync) / (3600 * 1000); // Convert from per-hour to current
      
      if (Math.abs(expectedDrift) > this.MAX_ACCEPTABLE_DRIFT) {
        console.warn(`Clock drift detected for ${cameraId}: ${expectedDrift.toFixed(2)}ms`);
        cameraSync.reliability = 'low';
      }
    });
  }
}