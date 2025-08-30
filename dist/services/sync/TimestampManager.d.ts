export interface TimeSync {
    systemTime: number;
    ntpTime: number;
    offset: number;
    accuracy: number;
    lastSyncAt: Date;
}
export interface CameraTimeSync {
    cameraId: string;
    localOffset: number;
    networkDelay: number;
    clockDrift: number;
    lastSyncAt: Date;
    reliability: 'high' | 'medium' | 'low';
}
export declare class TimestampManager {
    private masterTimeSync?;
    private cameraTimeSyncs;
    private syncInterval?;
    private driftCheckInterval?;
    private readonly SYNC_INTERVAL_MS;
    private readonly DRIFT_CHECK_INTERVAL_MS;
    private readonly MAX_ACCEPTABLE_DRIFT;
    constructor();
    /**
     * Start timestamp synchronization service
     */
    startTimestampSync(): Promise<boolean>;
    /**
     * Stop timestamp synchronization service
     */
    stopTimestampSync(): void;
    /**
     * Get current synchronized timestamp
     */
    getSynchronizedTimestamp(): number;
    /**
     * Register camera for time synchronization
     */
    registerCamera(cameraId: string): Promise<boolean>;
    /**
     * Synchronize camera timestamp
     */
    syncCameraTimestamp(cameraId: string): Promise<boolean>;
    /**
     * Get camera-adjusted timestamp
     */
    getCameraTimestamp(cameraId: string, systemTimestamp?: number): number;
    /**
     * Validate timestamp accuracy across cameras
     */
    validateTimestampAccuracy(): {
        isAccurate: boolean;
        maxDrift: number;
        cameraStatus: Map<string, {
            drift: number;
            reliability: string;
        }>;
        recommendations: string[];
    };
    /**
     * Generate timestamp synchronization report
     */
    generateSyncReport(): string;
    /**
     * Force resync of all timestamps
     */
    forceResyncAll(): Promise<boolean>;
    /**
     * Perform NTP synchronization (simplified implementation)
     */
    private performNTPSync;
    /**
     * Measure network delay to camera (ping equivalent)
     */
    private measureNetworkDelay;
    /**
     * Calculate camera time offset
     */
    private calculateCameraOffset;
    /**
     * Check for clock drift across cameras
     */
    private checkClockDrift;
}
//# sourceMappingURL=TimestampManager.d.ts.map