# App Flow Document for sync-camera

## Onboarding and Sign-In/Sign-Up

When a new user first accesses sync-camera, they arrive at a clean landing page that briefly describes the system’s purpose and invites them to get started. From this page, a “Sign Up” button directs them to a registration form where they enter an email address, choose a password, and confirm agreement with the terms of service. After submitting, they receive a confirmation email. Clicking the link in that email activates their account and brings them back to the dashboard login screen. If at any time a returning user forgets their password, they can click “Forgot Password” on the login form, enter their email, and receive a reset link by email. That link opens a secure password reset page where they set a new password, then return to the login screen. Once signed in, the user sees a “Log Out” option consistently in the top navigation bar, which ends their session and returns them to the landing page.

## Main Dashboard or Home Page

After signing in, the user lands on the main dashboard. The page features a sidebar on the left that lists the primary sections: Cameras, Sessions, Monitoring, Exports, Plugins, and Settings. A top header shows the user’s name with a drop-down for profile and logout. In the center of the dashboard, key system status cards display the number of connected cameras, current session state, and recent alerts or errors. Below those cards, live summary charts hint at camera drift or buffer health. From this view, the sidebar items are the gateway to deeper parts of the application. Clicking any of these items loads the corresponding page in the main content area.

## Detailed Feature Flows and Page Transitions

### Camera Management Flow

When the user selects “Cameras” in the sidebar, they see a list of all cameras currently added to the system. Each entry shows the camera’s name, IP or USB identifier, and status indicator. A prominent “Add Camera” button at the top triggers a modal window where the user types in the camera address, labels the device, and chooses default settings like resolution and frame rate. After saving, the camera appears in the list. To adjust an existing camera’s settings, the user clicks its row, which opens an inline editor where they can tweak exposure or white balance. Saving changes updates the camera immediately. If the user selects “Remove,” a confirmation prompt appears before the camera is deleted from the system. Navigation back to the main dashboard is possible by clicking the dashboard logo in the top left corner.

### Session Creation and Control Flow

From the sidebar, clicking “Sessions” brings up the session management page. Here the user sees past session logs and a button labeled “New Session.” Clicking that loads a full-screen form where the user selects which of the added cameras should participate, sets a duration, picks an output format, and names the session for reference. Pressing “Start” begins the capture immediately and transitions the user to the real-time monitoring view. If they want to cancel before starting, they click “Cancel” at the bottom of the form to return to the sessions list without saving.

### Real-Time Monitoring Flow

Once a session is active, the app automatically switches to the “Monitoring” page. This view shows time-aligned video previews side by side, live latency charts for each camera, and buffer occupancy meters. The user can pause or stop the session at any time with buttons in the top-right corner. If they pause, the feeds halt and charts freeze until the user clicks “Resume.” Hitting “Stop” ends data capture, and the system prompts the user to confirm ending the session. Once confirmed, the user is redirected to the Exports page.

### Export and Plugin Management Flow

On the “Exports” page, the user sees a list of completed sessions. Each entry displays session name, date, and output type. Clicking “Download” beside any session generates a synchronized video file or stitched output and begins the download. If the user wants to process the output further, they navigate to “Plugins” in the sidebar. That page lists available plugins, letting the user click “Install” to add new sync strategies or processing modules. After installation, plugins appear in the session form under an “Advanced Options” section where they can be toggled on before starting a new capture.

## Settings and Account Management

Selecting “Settings” from the sidebar opens the account management area. The first tab is “Profile,” where the user edits their name or changes their email. Below that is “Security,” which allows password changes by entering the current password and setting a new one. A third tab, “Notifications,” lets the user choose whether to receive email alerts for dropped frames or session completions. Changes in any tab are applied immediately when the user clicks “Save.” A link at the bottom returns them to the main dashboard view without changing pages, preserving any unsaved edits until they click “Save.”

## Error States and Alternate Paths

If the user enters an invalid camera address when adding a new device, an inline error message appears next to the field saying it could not connect. The form remains open so the user can correct the input. During a live session, if connectivity to any camera is lost, a red warning icon appears by that camera’s chart in real time and an alert banner slides down from the header. The user can then click “Recover” in the banner to retry connection, or “Ignore” to continue without that feed. In cases of network failure, the entire dashboard displays a small overlay notifying of offline status and blocks new requests until connectivity returns. Once the connection is reestablished, the overlay disappears and the user’s last view reloads automatically.

## Conclusion and Overall App Journey

In a typical day, a user signs up for sync-camera, confirms their account, and logs in. They add cameras by specifying addresses and default settings, then define a capture session by choosing cameras and output parameters. They start the session and watch live latency and alignment metrics, recovering automatically from minor errors. After stopping the session, they download the synchronized outputs or apply installed plugins for further processing. Finally, they adjust personal settings or log out. Throughout this journey, every page and action flows seamlessly from one to the next, ensuring smooth management of multi-camera synchronization tasks from first login to finished export.