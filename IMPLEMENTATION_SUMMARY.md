# Steel Structure Estimation App — Architecture Summary

## 1) System Architecture
- Mobile app: React Native, offline-first, production-grade estimation client for Android and iOS.
- Backend: Node.js + Express + MongoDB, REST API, lead capture, estimate persistence, PDF output.
- Admin/ops: Existing Next.js admin frontend remains the operator console for leads, estimates, and history.
- Deployment: Android Play Store, iOS App Store, cloud-hosted Node.js backend, MongoDB Atlas.

## 2) Module Breakdown

### Phase 1 — MVP / Revenue Focus
1. Steel Weight Calculator
   - ISMB, ISMC, ISA, RHS, SHS, plates
   - custom section input
   - weight per meter and total weight

2. Basic PEB Estimator
   - span, height, bay spacing
   - quick tonnage estimate
   - preliminary sizing logic only

3. Lead Capture
   - enquiry form
   - backend sync
   - MongoDB persistence

### Phase 2
4. Load Calculations
   - dead load
   - live load
   - wind load
   - basic seismic load

5. PDF Export
   - calculation summary
   - export/shareable report

### Phase 3
6. Foundation Estimation
7. Material Estimation
8. Advanced structural logic
9. AI suggestions

## 3) Recommended Tech Stack
- React Native for the mobile app
- Node.js + Express for backend
- MongoDB Atlas for persistence
- REST APIs
- Offline-first local storage with sync queue

## 4) Engineering Positioning
- The app must clearly distinguish:
  - preliminary site-level estimation
  - exact code-compliant structural design
- Outputs should always include assumptions and warning notes.
- Best use case: on-site estimation, lead generation, early-stage project scoping.

## 5) MVP Screen Flow
- Splash
- Home dashboard
- Calculator selection
- Steel weight calculator
- PEB estimator
- Estimate summary
- Lead capture form
- Saved projects
- Settings

## 6) Backend API Direction
- `POST /api/v1/estimates`
- `GET /api/v1/estimates/:id`
- `POST /api/v1/leads`
- optional auth endpoints for users/admins
- PDF generation endpoint for estimates

## 7) Data Contract
Use a shared estimate object:
```json
{
  "id": "string",
  "projectType": "string",
  "inputs": {},
  "assumptions": [],
  "results": {},
  "warnings": [],
  "createdAt": "ISO string"
}
```

## 8) Engineering Logic Spec
A dedicated engineering formula document has been created:
- `engineering-calculation-spec.md`

It covers:
- steel weight calculation
- quick load estimation
- PEB tonnage estimation
- foundation reaction approximation
- material estimation
- exact-design vs estimation boundary

## 9) Backend Files Created by Sub-Agent
The backend sub-agent created these files:
- `controllers/estimateController.js`
- `services/estimateService.js`
- `models/Estimate.js`
- `routes/v1/estimateRoutes.js`
- `routes/v1/leadRoutes.js`
- `routes/v1/authRoutes.js`
- `validators/estimateValidator.js`
- `validators/leadValidator.js`

## 10) Integration Note
The current server entrypoint still mounts legacy routes:
- `/api/peb`
- `/api/payments`
- `/api/auth`
- `/api/leads`
- `/api/admin`
- `/api/api-keys`

The new v1 estimate routes exist but are not yet wired into `server.js`, so the next implementation step is route integration and validation against the existing auth middleware and Mongoose models.
