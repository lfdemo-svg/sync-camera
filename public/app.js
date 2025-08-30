// Sync-Camera Dashboard JavaScript
class SyncCameraApp {
    constructor() {
        this.socket = null;
        this.isRecording = false;
        this.latencyChart = null;
        this.calibrationSession = null;
        
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupWebSocket();
        this.setupCharts();
        this.loadInitialData();
    }

    setupNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn');
        const sections = document.querySelectorAll('.section');

        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const sectionId = btn.dataset.section;
                
                // Update active nav button
                navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Show corresponding section
                sections.forEach(section => {
                    section.classList.remove('active');
                });
                document.getElementById(sectionId).classList.add('active');
            });
        });
    }

    setupWebSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to sync-camera server');
            this.updateStatus('online');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.updateStatus('offline');
        });

        this.socket.on('camera-status-update', (data) => {
            this.updateCameraStatus(data);
        });

        this.socket.on('sync-metrics', (data) => {
            this.updateSyncMetrics(data);
        });
    }

    setupCharts() {
        const ctx = document.getElementById('latencyChart');
        if (ctx) {
            this.latencyChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Camera A Latency',
                            data: [],
                            borderColor: '#1976D2',
                            backgroundColor: 'rgba(25, 118, 210, 0.1)',
                            tension: 0.1
                        },
                        {
                            label: 'Camera B Latency',
                            data: [],
                            borderColor: '#26A69A',
                            backgroundColor: 'rgba(38, 166, 154, 0.1)',
                            tension: 0.1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Latency (ms)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Time'
                            }
                        }
                    }
                }
            });

            // Simulate real-time data updates
            setInterval(() => {
                this.updateLatencyChart();
            }, 1000);
        }
    }

    updateLatencyChart() {
        if (!this.latencyChart) return;

        const now = new Date();
        const timeLabel = now.toLocaleTimeString();
        
        // Simulate latency data (5-30ms range)
        const cameraALatency = Math.random() * 25 + 5;
        const cameraBLatency = Math.random() * 25 + 5;

        this.latencyChart.data.labels.push(timeLabel);
        this.latencyChart.data.datasets[0].data.push(cameraALatency);
        this.latencyChart.data.datasets[1].data.push(cameraBLatency);

        // Keep only last 20 data points
        if (this.latencyChart.data.labels.length > 20) {
            this.latencyChart.data.labels.shift();
            this.latencyChart.data.datasets[0].data.shift();
            this.latencyChart.data.datasets[1].data.shift();
        }

        this.latencyChart.update('none');
    }

    async loadInitialData() {
        try {
            // Load camera status
            const response = await fetch('/api/cameras');
            const data = await response.json();
            
            this.updateCoverageDisplay(data.coverage);
            
            // Load coverage analysis
            this.analyzeCoverage();
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showNotification('Failed to load camera data', 'error');
        }
    }

    updateStatus(status) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (status === 'online') {
            statusDot.classList.add('online');
            statusText.textContent = 'Online';
        } else {
            statusDot.classList.remove('online');
            statusText.textContent = 'Offline';
        }
    }

    updateCameraStatus(data) {
        const cameraStatus = document.getElementById(`${data.cameraId}-status`);
        if (cameraStatus) {
            cameraStatus.textContent = data.command === 'start' ? 'Recording' : 'Ready';
        }
    }

    updateSyncMetrics(data) {
        document.getElementById('sync-latency').textContent = `${data.latency}ms`;
        document.getElementById('sync-accuracy').textContent = `${data.accuracy}ms`;
        document.getElementById('frame-drops').textContent = data.frameDrops;
        document.getElementById('buffer-health').textContent = `${data.bufferHealth}%`;
    }

    updateCoverageDisplay(coverage) {
        if (coverage && coverage.totalCoveragePercent) {
            document.getElementById('coverage-percent').textContent = `${coverage.totalCoveragePercent.toFixed(1)}%`;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '1000',
            maxWidth: '400px'
        });

        // Set background color based on type
        const colors = {
            info: '#1976D2',
            success: '#4CAF50',
            warning: '#FF9800',
            error: '#D32F2F'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Add to page
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }
}

// Global functions for UI interactions
async function startCalibration() {
    try {
        const response = await fetch('/api/cameras/camera_a/calibration/start', {
            method: 'POST'
        });
        
        if (response.ok) {
            const data = await response.json();
            app.calibrationSession = data.sessionId;
            app.showNotification('Calibration started for Camera A', 'success');
            
            // Switch to cameras section to show calibration UI
            document.querySelector('[data-section="cameras"]').click();
        } else {
            app.showNotification('Failed to start calibration', 'error');
        }
    } catch (error) {
        console.error('Calibration error:', error);
        app.showNotification('Calibration error occurred', 'error');
    }
}

async function startSession() {
    const sessionForm = document.getElementById('session-form');
    if (sessionForm.style.display === 'none') {
        // Switch to sessions section and show form
        document.querySelector('[data-section="sessions"]').click();
        sessionForm.style.display = 'block';
    } else {
        await startRecording();
    }
}

async function analyzeCoverage() {
    try {
        const response = await fetch('/api/coverage/analysis');
        const data = await response.json();
        
        app.updateCoverageDisplay(data.analysis);
        app.showNotification(`Coverage: ${data.analysis.totalCoveragePercent.toFixed(1)}%`, 'info');
        
        console.log('Coverage Report:', data.report);
    } catch (error) {
        console.error('Coverage analysis error:', error);
        app.showNotification('Failed to analyze coverage', 'error');
    }
}

function addCamera() {
    app.showNotification('Add Camera feature - Connect your phone to the network and navigate to the camera section', 'info');
}

async function calibrateCamera(cameraId) {
    try {
        const response = await fetch(`/api/cameras/${cameraId}/calibration/start`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const data = await response.json();
            app.calibrationSession = data.sessionId;
            app.showNotification(`Started calibration for ${cameraId}`, 'success');
        } else {
            app.showNotification('Failed to start calibration', 'error');
        }
    } catch (error) {
        console.error('Calibration error:', error);
        app.showNotification('Calibration error occurred', 'error');
    }
}

async function testCamera(cameraId) {
    app.showNotification(`Testing ${cameraId}...`, 'info');
    
    // Simulate test
    setTimeout(() => {
        app.showNotification(`${cameraId} test completed successfully`, 'success');
    }, 2000);
}

function createSession() {
    const sessionForm = document.getElementById('session-form');
    sessionForm.style.display = 'block';
}

function cancelSession() {
    const sessionForm = document.getElementById('session-form');
    sessionForm.style.display = 'none';
}

async function startRecording() {
    const sessionName = document.getElementById('session-name').value || 'Untitled Session';
    const duration = document.getElementById('session-duration').value || 60;
    
    try {
        const response = await fetch('/api/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: sessionName,
                cameras: ['camera_a', 'camera_b'],
                duration: parseInt(duration),
                outputFormat: 'mp4'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            app.isRecording = true;
            
            // Update UI
            document.getElementById('recording-btn').textContent = '⏹️ Stop Recording';
            document.getElementById('recording-btn').classList.remove('btn-success');
            document.getElementById('recording-btn').classList.add('btn-error');
            
            // Hide form
            cancelSession();
            
            // Switch to monitoring
            document.querySelector('[data-section="monitoring"]').click();
            
            app.showNotification(`Recording started: ${sessionName}`, 'success');
            
            // Emit to websocket
            app.socket.emit('camera-control', {
                command: 'start',
                cameraId: 'all',
                params: { sessionId: data.sessionId }
            });
        } else {
            app.showNotification('Failed to start recording', 'error');
        }
    } catch (error) {
        console.error('Recording error:', error);
        app.showNotification('Recording error occurred', 'error');
    }
}

function toggleRecording() {
    if (app.isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

function stopRecording() {
    app.isRecording = false;
    
    // Update UI
    document.getElementById('recording-btn').textContent = '▶️ Start Recording';
    document.getElementById('recording-btn').classList.remove('btn-error');
    document.getElementById('recording-btn').classList.add('btn-success');
    
    app.showNotification('Recording stopped', 'info');
    
    // Emit to websocket
    app.socket.emit('camera-control', {
        command: 'stop',
        cameraId: 'all'
    });
}

// Initialize app when page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SyncCameraApp();
});