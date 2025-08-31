# Backend Structure Document

This document outlines the backend setup for **sync-camera**, detailing its architecture, databases, APIs, hosting, infrastructure, security, monitoring, and maintenance. It’s written in clear, everyday language so anyone can understand how the backend works.

## 1. Backend Architecture

### Overall Design
- We follow a **microservices-style** approach, even though most services run on the same host. This keeps components loosely coupled and easier to update.
- The core API server is built with **Node.js** and **TypeScript**, using either **Express** or **Fastify** as the web framework.
- Real-time communication (live metrics and control commands) uses **WebSockets** powered by **socket.io**.
- Compute-heavy video processing (stitching, basic fusion) is handed off to a separate **Python microservice** leveraging **OpenCV**.
- All services run in their own **Docker containers** for consistency across development, testing, and production.

### Scalability, Maintainability, Performance
- **Scalability**: Services can be scaled independently by running more container instances behind a load balancer.
- **Maintainability**: Clear separation between API logic, real-time channels, and video processing means updates in one area don’t break others.
- **Performance**: In-memory buffers align video frames quickly before handing them off to processing, minimizing disk I/O. WebSockets avoid constant HTTP polling for real-time data.

## 2. Database Management

### Technologies Used
- **SQLite** (SQL) for persistent storage of:
  - User accounts and authentication tokens
  - Camera profiles and settings
  - Session templates and metadata
  - Plugin configurations
- **In-memory data structures** for temporary frame buffers and live session state

### Data Organization
- Structured, relational tables store core entities (users, cameras, sessions).
- Each table has clear, typed columns (e.g., camera IP, user email).
- We use an ORM-like layer (e.g., TypeORM or Prisma) in TypeScript to read/write data with type safety.
- Regular backups of the SQLite file ensure data durability.

## 3. Database Schema

Below is a high-level, human-readable description of each table, followed by SQL statements to create them.

### Tables in SQLite

1. **users**
   - Holds registered user data.
   - Columns: id (primary key), email, password_hash, created_at
2. **cameras**
   - Stores each camera’s address and default settings.
   - Columns: id, user_id (foreign key), name, address, default_frame_rate, default_resolution, created_at
3. **sessions**
   - Describes capture sessions.
   - Columns: id, user_id, name, start_time, end_time, output_format, created_at
4. **session_cameras**
   - Joins sessions and cameras (which cameras are in each session).
   - Columns: session_id, camera_id
5. **plugins**
   - Lists installed plugins and their configuration.
   - Columns: id, user_id, name, version, settings_json, installed_at

### SQL Schema (SQLite)
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cameras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  default_frame_rate INTEGER,
  default_resolution TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  start_time DATETIME,
  end_time DATETIME,
  output_format TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE session_cameras (
  session_id INTEGER NOT NULL,
  camera_id INTEGER NOT NULL,
  PRIMARY KEY (session_id, camera_id),
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  FOREIGN KEY (camera_id) REFERENCES cameras(id)
);

CREATE TABLE plugins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  version TEXT,
  settings_json TEXT,
  installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```  

## 4. API Design and Endpoints

We follow a **RESTful** style for configuration and a **WebSocket** approach for live data.

### Authentication
- **POST /api/auth/signup**: Register a new user.
- **POST /api/auth/login**: Log in and receive a JWT.
- **POST /api/auth/refresh**: Refresh an expired token.
- **POST /api/auth/reset-password**: Send reset link via email.

### Camera Management
- **GET /api/cameras**: List all cameras for the user.
- **POST /api/cameras**: Add a new camera.
- **PUT /api/cameras/:id**: Update camera settings.
- **DELETE /api/cameras/:id**: Remove a camera.

### Session Management
- **GET /api/sessions**: List past sessions.
- **POST /api/sessions**: Create and start a new session.
- **PUT /api/sessions/:id/stop**: End an active session.

### Plugin Management
- **GET /api/plugins**: List installed plugins.
- **POST /api/plugins**: Install a plugin.
- **DELETE /api/plugins/:id**: Uninstall a plugin.

### Exporting Data
- **GET /api/exports/:sessionId**: Generate and download session output.

### Real-Time Channels (WebSockets)
- **connect**: Client opens socket with JWT.
- **joinSession**: Subscribe to a session’s live data.
- **frameMetrics**: Server pushes per-camera latency and buffer stats.
- **controlCommand**: Client sends commands (pause, resume, recover).

## 5. Hosting Solutions

- **Docker Containers**: All backend services (API server, Python processor) run in Docker.
- **Flexible Hosting**: You can deploy on an on-premises server or any cloud VM (e.g., AWS EC2, DigitalOcean Droplet).
- **Benefits**:
  - *Reliability*: Docker ensures each service has its dependencies isolated.
  - *Scalability*: Spin up more container instances behind a load balancer.
  - *Cost-Effectiveness*: Choose a VM size that matches your camera count and processing needs.

## 6. Infrastructure Components

- **Reverse Proxy/Load Balancer** (e.g., Nginx or Traefik)
  - Routes HTTP(S) and WebSocket traffic to the correct container.
  - Provides TLS termination (HTTPS).
- **In-Memory Buffers**
  - Temporarily store video frames for timestamp alignment.
- **Optional Cache Layer** (e.g., Redis)
  - Cache frequent read data like user profiles or camera lists (speeds up API responses).
- **CDN**
  - Serve static assets (dashboard bundles) closer to users if you host remotely.

These pieces work together to ensure fast, reliable communication and processing.

## 7. Security Measures

- **HTTPS/TLS**: All web traffic is encrypted.
- **JWT Authentication**: Each API request must carry a valid token.
- **Password Safety**: User passwords are hashed (e.g., with bcrypt) before storage.
- **Input Validation**: Every API endpoint checks data formats to prevent malicious input.
- **Access Control**: Users can only access their own cameras, sessions, and plugins.
- **Database Backups**: Regular snapshots of the SQLite file stored securely.

## 8. Monitoring and Maintenance

### Monitoring Tools
- **Built-in Metrics**: The API exposes health endpoints (e.g., `/health`) reporting service status.
- **Logging**: Use a logging library (e.g., Winston) to record errors, requests, and recovery events.
- **External Monitoring**: Optionally integrate with Prometheus + Grafana or Datadog for real-time dashboards and alerts.

### Maintenance Strategies
- **CI/CD Pipeline**: GitHub Actions runs linting, tests, and builds Docker images on every commit.
- **Rolling Updates**: Deploy new container versions without downtime by updating one instance at a time.
- **Automated Backups**: Schedule periodic exports of the SQLite database.
- **Dependency Updates**: Regularly review and update Node.js, Python, and library versions for security patches.

## 9. Conclusion and Overall Backend Summary

The backend for **sync-camera** is a modular, containerized system that balances performance and simplicity. Key points:
- **Node.js + TypeScript** powers the API and real-time channels.
- **SQLite** handles reliable, small-footprint data storage.
- **Python + OpenCV** modules take on heavy video tasks without blocking the main server.
- **Docker** ensures consistent environments and smooth deployments.
- **Security** is built in with HTTPS, JWT, and input validation.
- **Monitoring** and **maintenance** workflows (CI/CD, logging, backups) keep the system healthy.

This setup aligns perfectly with our goals: millisecond-level camera synchronization, an intuitive web dashboard, and a plugin-friendly architecture that can grow with future needs.