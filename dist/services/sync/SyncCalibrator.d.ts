import { SyncEvent, SyncCalibration } from '../../types/sync';
export interface CalibrationMethod {
    id: string;
    name: string;
    description: string;
    accuracy: number;
    setup: string[];
}
export declare class SyncCalibrator {
    private static readonly CALIBRATION_METHODS;
    /**
     * Get available calibration methods
     */
    static getCalibrationMethods(): CalibrationMethod[];
    /**
     * Get recommended calibration method based on setup
     */
    static getRecommendedMethod(hasAudio?: boolean, hasMobileDevice?: boolean, accuracyRequired?: number): CalibrationMethod;
    /**
     * Generate calibration instructions for a method
     */
    static generateInstructions(methodId: string): string[];
    /**
     * Create LED flash sync event
     */
    static createLEDFlashEvent(description?: string): SyncEvent;
    /**
     * Create audio beep sync event
     */
    static createAudioBeepEvent(description?: string): SyncEvent;
    /**
     * Create QR code sync event with timestamp
     */
    static createQRCodeEvent(timestamp?: number): SyncEvent;
    /**
     * Generate QR code data for timestamp sync
     */
    static generateQRCodeData(timestamp?: number): string;
    /**
     * Validate sync event quality
     */
    static validateSyncEvent(event: SyncEvent): {
        isValid: boolean;
        quality: 'excellent' | 'good' | 'fair' | 'poor';
        issues: string[];
        recommendations: string[];
    };
    /**
     * Calculate sync accuracy from calibration data
     */
    static calculateSyncAccuracy(calibration: SyncCalibration): {
        overallAccuracy: number;
        cameraAccuracies: Map<string, number>;
        recommendedAction: string;
    };
    /**
     * Generate calibration report
     */
    static generateCalibrationReport(calibration: SyncCalibration): string;
    /**
     * Generate sync event ID
     */
    private static generateEventId;
}
//# sourceMappingURL=SyncCalibrator.d.ts.map