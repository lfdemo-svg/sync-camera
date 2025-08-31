flowchart TD
  A[Landing Page] --> B[Sign Up]
  A --> D[Login]
  B --> C[Email Confirmation]
  C --> D
  D --> E[Dashboard]
  E --> F[Cameras Page]
  F --> G[Add Camera]
  G --> F
  F --> H[Edit Camera]
  H --> F
  F --> I[Remove Camera]
  I --> F
  E --> J[Sessions Page]
  J --> K[New Session Form]
  K --> L[Start Session]
  L --> M[Monitoring Page]
  M --> N[Pause Session]
  N --> M
  M --> O[Stop Session]
  O --> P[Confirm Stop]
  P --> Q[Exports Page]
  E --> R[Plugins Page]
  R --> S[Install Plugin]
  S --> R
  E --> T[Settings Page]
  T --> U[Profile Settings]
  U --> T
  T --> V[Security Settings]
  V --> T
  T --> W[Notification Settings]
  W --> T
  M --> X[Error Alert]
  X --> M