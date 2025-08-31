# Tech Stack Document for sync-camera

This document explains, in plain language, the technology choices behind sync-camera. It’s designed so anyone—technical or not—can understand why we picked each tool and how they work together.

## Frontend Technologies

These are the tools that build the web interface you see and interact with.

- React (with TypeScript)
  • A popular library for building user interfaces.
  • TypeScript adds clear type checking, reducing bugs early on.
- Next.js
  • Handles server-side rendering, so pages load faster and rank better in search engines.
  • Simplifies routing and code-splitting for us.
- Styling Tools
  • We use CSS modules (or a similar scoped styling approach) to keep styles tied to individual components—no global clashes.
  • In-app charts use a lightweight library (like Chart.js) to display real-time latency and health metrics.
- Real-Time Updates
  • socket.io-client (WebSockets) lets the frontend receive live updates about camera buffers, frame drift, and system alerts without refreshing the page.

How these choices help:
- Fast, responsive interface that feels like a desktop app.
- Clear structure for building and maintaining UI components.
- Real-time feedback keeps users informed of any capture or network issues.

## Backend Technologies

These tools run behind the scenes to manage data, camera control, and processing tasks.

- Node.js with TypeScript
  • Runs our main API server, handling requests from the dashboard.
  • TypeScript ensures consistent code quality and easier maintenance.
- Express or Fastify
  • Lightweight web frameworks that define HTTP and WebSocket endpoints for camera commands, session control, and metrics streaming.
- socket.io (WebSockets)
  • Provides a persistent connection for live metrics and control commands between frontend and backend.
- Python Microservice (OpenCV)
  • Handles compute-heavy video tasks (stitching, basic fusion) in a separate process.
  • Communicates with the Node.js server through well-defined HTTP or message queues.
- Data Storage
  • SQLite (or another small-footprint database) stores camera profiles, session templates, user accounts, and settings.
  • In-memory buffers hold video frames temporarily to align timestamps before delivering them to the processing pipeline.
- Plugin Loader
  • Uses Node.js dynamic imports (`require()` or ESM syntax) to add new sync strategies or processing modules at runtime without restarting the server.

How these pieces fit together:
- The Node.js API server coordinates camera discovery, session management, and real-time monitoring.
- Python services perform video-specific work, keeping the Node.js server responsive.
- WebSockets stream live data to users, while HTTP endpoints handle configuration and file downloads.

## Infrastructure and Deployment

This section covers where and how we host, build, and deploy sync-camera.

- Containerization: Docker
  • Each service (API server, Python processor) runs in its own Docker container.
  • Ensures consistent environments locally, in testing, and in production.
- Version Control: Git (GitHub)
  • Our code lives in a GitHub repository, providing history, collaboration, and issue tracking.
- CI/CD: GitHub Actions
  • Automates linting (ESLint), formatting (Prettier), unit tests, and building Docker images whenever code is pushed.
  • Runs end-to-end checks to catch problems before deployment.
- Hosting Platform
  • Can be an on-premises server or cloud VM (e.g., AWS EC2, DigitalOcean Droplet) running Docker containers.
  • NTP synchronization is configured to ensure all devices (server and cameras) share the same clock.

Benefits:
- Reliable, repeatable deployments through Docker and CI/CD.
- Easy rollback to previous versions if something goes wrong.
- Flexible hosting—no vendor lock-in.

## Third-Party Integrations

sync-camera uses a few external services to enhance its capabilities:

- Email Service (e.g., SendGrid, AWS SES)
  • Sends account confirmation and password reset links.
- Time Sync (NTP servers)
  • Ensures host and cameras use synchronized clocks.
- Analytics (optional)
  • Google Analytics or similar can track how users navigate the dashboard (optional setup).

Why these help:
- Automated emails make account management smooth.
- Clock synchronization is critical to aligning video frames.
- Usage data can guide future improvements.

## Security and Performance Considerations

Here’s how we keep sync-camera safe and fast:

- Secure Connections
  • HTTPS/TLS for all web traffic.
  • JWT-based authentication for API access, ensuring each request is from a verified user.
- Input Validation
  • Every camera address, session parameter, and user input is checked on the server to prevent malformed or malicious data.
- Error Handling & Recovery
  • Built-in routines detect dropped frames or lost camera connections and attempt automatic retries.
  • Real-time alerts inform users of issues, with options to recover or ignore.
- Performance Optimizations
  • In-memory buffering aligns frames before they hit disk or processing, reducing I/O delays.
  • Adjustable buffer lengths and optional lower-resolution modes help manage CPU/GPU load.
  • WebSockets keep the dashboard responsive without constant polling.

These measures ensure:
- Data stays protected in transit and at rest.
- The system recovers gracefully from common failures.
- Users experience smooth, lag-free monitoring and control.

## Conclusion and Overall Tech Stack Summary

In sync-camera, we’ve chosen a modern, familiar set of tools that work together to deliver real-time, multi-camera synchronization with minimal setup:

- **Frontend**: React + Next.js + TypeScript + WebSockets for a snappy, real-time dashboard.
- **Backend**: Node.js + Express/Fastify + TypeScript + Python (OpenCV) to handle API, control logic, and video processing.
- **Infrastructure**: Docker + GitHub Actions + Git + flexible hosting for reliable builds and deployments.
- **Security & Performance**: HTTPS, JWT, input validation, in-memory buffering, and automatic recovery keep the system safe and fast.

This combination aligns with our goals of millisecond-level sync accuracy, an intuitive UI, and a plugin-friendly architecture. It also makes future features—like AI-driven plugins or cloud streaming—easy to add without major rewrites.