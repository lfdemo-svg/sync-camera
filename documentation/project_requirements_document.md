# Project Requirements Document (PRD)

## 1. Project Overview

**sync-camera** is a platform designed to capture and synchronize video streams from multiple cameras in real time. Its main goal is to ensure that all connected camera feeds are locked in time, enabling smooth downstream processing like stitching panoramic views, switching angles live, or generating 3D reconstructions. By handling capture triggers, timestamp alignment, and buffering internally, it takes the burden off users who would otherwise wrestle with varying hardware latencies and manual synchronization.

The system is being built to serve film makers, broadcast engineers, and research teams who need precise alignment of multi-angle video data. Key objectives for the first version include millisecond-level synchronization accuracy, a simple control dashboard, basic video fusion capabilities, and a plugin-friendly architecture. Success will be measured by achieving consistent frame alignment across at least four 1080p cameras at 30 fps, sub-50 ms jitter, and an intuitive user interface that requires minimal setup.

## 2. In-Scope vs. Out-of-Scope

### In-Scope (Version 1.0)
- Real-time synchronization engine that triggers captures and aligns timestamps across cameras
- Frame buffering and alignment module to hold frames until matching timestamps
- Basic web-based dashboard for:  
  • Adding/removing cameras  
  • Configuring exposure, frame rate, resolution  
  • Starting/stopping capture sessions
- Simple processing pipeline for:  
  • Panoramic stitching  
  • Angle switching
- Plugin manager skeleton allowing dynamic loading of custom sync strategies or processing modules
- Error detection with automatic recovery routines (e.g., dropped frames, network hiccups)
- Live monitoring charts showing per-camera latency, drift, and health metrics

### Out-of-Scope (Phase 2+)
- Advanced AI-driven processing (3D reconstruction, depth extraction)
- Mobile or desktop client applications (only web dashboard in v1)
- Cloud storage or streaming to external CDNs
- Marketplace for third-party plugins  
- Integration with every camera brand out of the box—only core protocol support to start
- Multi-location synchronization over the public Internet (LAN only)


## 3. User Flow

A typical user begins by installing the sync-camera system on a server or laptop connected to their local network. They open the web dashboard, register an account or log in, then navigate to the “Cameras” page. There, they click “Add Camera,” enter the camera’s IP address or USB identifier, and select desired settings like frame rate and resolution. Once all cameras are listed, they move to the “Session” tab, configure session parameters (duration, output format), and hit “Start.”

During the capture, the user watches real-time metrics on the dashboard: per-camera latency graphs, buffer occupancy, and frame alignment status. If an issue arises—like a dropped frame—they receive an alert and can trigger a recovery routine or pause the session. After stopping the session, the user goes to “Exports,” downloads synchronized video files or stitched outputs, and optionally installs plugins to process the data further.

## 4. Core Features

- **Camera Management**: Discover, add, configure, and remove cameras via IP/USB
- **Sync Engine**: Trigger synchronized captures and generate precise timestamps
- **Frame Buffering & Alignment**: Hold frames until all feeds reach the same timestamp
- **Control Interface**: Web-based UI to manage sessions, camera settings, and system health
- **Processing Pipeline**: Pluggable modules for stitching, angle switching, basic fusion
- **Plugin Architecture**: Load/unload custom sync or processing strategies without restarting
- **Error Handling & Recovery**: Detect frame drops, network faults, and auto-recover
- **Monitoring Dashboard**: Real-time charts for latency, drift, CPU/GPU usage
- **Configuration Management**: Persist camera profiles, session templates, global settings
- **Logging & Alerts**: Detailed logs and user notifications for any system abnormalities

## 5. Tech Stack & Tools

- **Frontend**: React (TypeScript) with Next.js for server-side rendering of the dashboard
- **Backend**: Node.js (TypeScript) using Express or Fastify for API endpoints
- **Real-Time Comms**: WebSockets (Socket.io) for live metrics and control commands
- **Video Processing**: Python modules (OpenCV) wrapped via a microservice pattern
- **Data Storage**: SQLite or low-overhead DB for configs; in-memory buffers for frames
- **Containerization**: Docker for isolating services
- **Plugin Loader**: Node’s `require()`/ESM dynamic imports
- **Dev Tools**: VS Code with ESLint, Prettier; GitHub Actions for CI
- **Optional AI**: Future integration with PyTorch/TensorFlow for advanced 3D or depth plugins

## 6. Non-Functional Requirements

- **Performance**: Maintain <50 ms jitter for 4 × 1080p @ 30 fps; dashboard actions respond in <200 ms
- **Scalability**: Architected to add up to 8 cameras with minimal code changes
- **Security**: HTTPS for dashboard; JWT-based auth; input validation on all APIs
- **Reliability**: Automatic failover and retry on dropped frames; 99% uptime target on LAN
- **Usability**: Self-explanatory UI labels; in-app tooltips; minimal clicks to start a session
- **Compliance**: GDPR-ready if personal data is collected; logs purged on schedule

## 7. Constraints & Assumptions

- All cameras are on the same local network or USB bus with stable connectivity.
- Cameras support network control APIs or standard UVC (USB Video Class) protocols.
- The host machine has enough CPU/GPU resources for basic video processing.
- Users run modern browsers (Chrome, Firefox, Edge) for the dashboard.
- Time on all networked devices is synced via NTP to reduce clock skew.

## 8. Known Issues & Potential Pitfalls

- **Camera Protocol Diversity**: Different brands expose APIs differently. Mitigation: start with UVC and one IP-camera SDK, then expand via plugins.
- **Network Latency Variability**: LAN jitter can desync feeds. Mitigation: adaptive buffering and periodic clock drift checks via timestamp exchange.
- **High CPU/GPU Load**: Real-time processing may max out resources. Mitigation: provide adjustable buffer lengths and optional lower resolution modes.
- **Plugin Compatibility**: Third-party modules might break core workflow. Mitigation: define clear plugin API and sandbox execution.
- **Time Sync Drift**: Uncorrected clocks lead to misalignment over long sessions. Mitigation: run periodic NTP sync checks and adjust buffers in real time.

---

This PRD serves as the definitive guide for building sync-camera’s core features, tech choices, and quality standards. Subsequent technical documents (architecture diagrams, detailed frontend rules, backend service specs) will draw directly from these requirements, ensuring alignment and no ambiguity.