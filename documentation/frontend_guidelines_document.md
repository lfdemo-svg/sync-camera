# Frontend Guideline Document

This document lays out how we build and organize the sync-camera web interface. It’s written in simple terms so anyone can understand our choices, structure, and best practices.

## 1. Frontend Architecture

### 1.1 Frameworks and Libraries
- **React (with TypeScript)**: for building reusable UI components with clear typing.
- **Next.js**: powers server-side rendering (SSR) and file-based routing, so pages load fast and our code splits automatically.
- **Socket.io-client**: establishes a live WebSocket connection to receive real-time camera metrics and alerts without page reloads.
- **Chart.js**: lightweight library for drawing live charts (latency, buffer health, etc.).

### 1.2 How It Supports Scalability, Maintainability, Performance
- **Scalability**: Next.js code splitting and dynamic imports let us grow the dashboard without bloating initial load.
- **Maintainability**: TypeScript and React’s component model keep code predictable and easy to refactor.
- **Performance**: SSR gives users a usable page quickly, and socket.io avoids constant polling. React memoization and lazy loading prevent unnecessary re-renders.

## 2. Design Principles

### 2.1 Key Principles
- **Usability**: clear labels, tooltips, and minimal clicks—users start a session in just a few steps.
- **Accessibility**: semantic HTML, proper ARIA labels on forms and controls, keyboard navigation, and color-contrast-checked palettes.
- **Responsiveness**: fluid layouts and flexible grids adapt from desktop to tablets.
- **Consistency**: uniform spacing, typography, and component behavior across the app.

### 2.2 Applying Principles in UI
- Form fields highlight errors inline, guiding users to correct inputs.
- Buttons and links follow a single interaction pattern (hover, focus, active states).
- Charts and tables adapt to container width, ensuring legibility on various screens.

## 3. Styling and Theming

### 3.1 Styling Approach
- **CSS Modules** scoped per component—each `.module.css` file keeps styles local to avoid global conflicts.
- **Optional SASS layer**: if we need nesting or variables, we add SASS on top of CSS modules.
- **Design tokens via CSS variables**: define colors, spacing, and font sizes centrally in `:root`.

### 3.2 Theming
- **Light and Dark themes**: CSS variables switch values based on a top-level `data-theme` attribute on `<html>`.
- Theme toggle persists in user settings and localStorage.

### 3.3 Visual Style
- **Modern flat design** with subtle glassmorphism for overlay panels (slight background blur, gentle shadows).
- Clean cards, clear typography, and minimal decorative elements.

### 3.4 Color Palette
- Primary Blue: `#1976D2` (on-primary: `#FFFFFF`)
- Secondary Teal: `#26A69A` (on-secondary: `#FFFFFF`)
- Accent Amber: `#FFB300`
- Background Light: `#F5F5F5`, Dark: `#121212`
- Surface (Cards/Panels) Light: `#FFFFFF`, Dark: `#1E1E1E`
- Error Red: `#D32F2F` (on-error: `#FFFFFF`)

### 3.5 Typography
- **Font family**: “Inter”, system-fallback (`-apple-system, BlinkMacSystemFont, sans-serif`).
- Sizes: base font 16px, headings scale according to visual hierarchy (e.g., H1 = 32px, H2 = 24px).

## 4. Component Structure

### 4.1 Organization
- **`/components/`**: small, reusable UI pieces (Buttons, Inputs, Cards, Modals).
- **`/layouts/`**: wrappers for pages (MainLayout with sidebar/header).
- **`/pages/`** (Next.js): each file is a route, importing layouts and components.
- **`/features/`** (optional): groups components, hooks, and styles by domain (e.g., `features/cameras/`).

### 4.2 Reuse and Maintainability
- Follow the **single-responsibility principle**: each component does one thing.
- Expose props for customization (e.g., `<Button variant="primary" onClick=…>`).
- Co-locate tests, styles, and stories (if using Storybook) next to each component.

## 5. State Management

### 5.1 Approach and Libraries
- **React Context API** for global state (theme, auth status, user profile).
- **Local component state** via `useState` and `useReducer` for UI interactions.
- **Custom hooks** (e.g., `useSocket`, `useCameraList`) encapsulate data fetching and socket logic.

### 5.2 Sharing State Across Components
- Wrap the app in a `Provider` at `_app.tsx` for theme and authentication contexts.
- Session data and live metrics flow through context or via individual hooks that subscribe to socket events.

## 6. Routing and Navigation

### 6.1 How Routing Works
- Next.js **file-based routing**: create `pages/cameras.tsx`, `pages/sessions/new.tsx`, etc.
- Dynamic routes for session details: `pages/sessions/[sessionId].tsx`.

### 6.2 Navigation Structure
- **MainLayout** includes a sidebar with links: Cameras, Sessions, Monitoring, Exports, Plugins, Settings.
- **`next/link`** for client-side transitions, preserving state and avoiding full reloads.

## 7. Performance Optimization

### 7.1 Code Splitting & Lazy Loading
- Let Next.js auto-split code by page.
- Use `React.lazy` and `next/dynamic` for heavy components (e.g., charts, modals).

### 7.2 Asset Optimization
- Optimize images with Next.js `<Image>` component (automatic resizing and formats).
- Minify CSS and JS via Next.js build pipeline.

### 7.3 Rendering Optimizations
- Memoize pure components with `React.memo`.
- Use `useCallback` and `useMemo` for expensive calculations or event handlers.

### 7.4 Network Efficiency
- Socket.io keeps a single open connection for live updates instead of polling.
- Compress API responses server-side (gzip).

## 8. Testing and Quality Assurance

### 8.1 Unit Testing
- **Jest** with **React Testing Library**:
  - Test component rendering and user interactions.
  - Mock socket.io events to verify real-time behaviors.

### 8.2 Integration Testing
- Combine components and context providers to test flows (e.g., session start → monitoring view).

### 8.3 End-to-End (E2E) Testing
- **Cypress** or **Playwright**:
  - Simulate user signup, camera addition, session start/stop, export.
  - Verify charts update and alert banners appear on simulated errors.

### 8.4 Linting and Formatting
- **ESLint** with TypeScript rules and **Prettier** for consistent code style.
- Pre-commit hooks (Husky) run lint and basic tests before commits.

## 9. Conclusion and Overall Frontend Summary

Our frontend setup uses a modern, familiar stack—React + Next.js + TypeScript—backed by CSS modules, Context API, and socket.io for real-time updates. We follow clear design principles (usability, accessibility, responsiveness) and a component-based structure for easy reuse and maintenance. Performance is ensured through SSR, code splitting, and memoization. Testing at unit, integration, and E2E levels keeps our code reliable. Together, these guidelines provide a consistent, scalable, and performant foundation for the sync-camera dashboard, aligning perfectly with our goals of millisecond-level synchronization and a seamless user experience.