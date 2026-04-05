# TEKLA AI Backend ↔ Frontend Integration Contract

This document defines the REST API and data shapes shared between the Node.js/Express backend and the Next.js admin frontend.

## Base assumptions

- Backend is exposed over HTTP and consumed via REST.
- Frontend does not access MongoDB directly.
- All date values are ISO 8601 strings.
- All monetary values are numbers in the backend response and rendered as currency in the frontend.
- Identifiers are MongoDB ObjectId strings in JSON.
- Backend uses CommonJS; frontend consumes JSON only.

---

## 1) Admin analytics endpoint

### Endpoint

`GET /api/admin/stats`

### Purpose

Provides dashboard metrics for the admin summary cards and recent lead widgets.

### Response shape

```json
{
  "totalLeads": 128,
  "totalEstimatedRevenue": 2450000,
  "conversionRate": 37.5,
  "conversionCount": 48,
  "recentLeads": [
    {
      "_id": "66c1f0d8f10d8a0012345678",
      "status": "NEW",
      "createdAt": "2026-04-04T10:30:00.000Z",
      "inputData": {
        "projectName": "Warehouse Expansion"
      },
      "score": 82,
      "tag": "HOT"
    }
  ]
}
```

### Field contract

- `totalLeads`:
  - number
  - Total count of stored leads
- `totalEstimatedRevenue`:
  - number
  - Sum of estimated/optimized revenue used by the dashboard
- `conversionRate`:
  - number
  - Percentage value from 0 to 100
- `conversionCount`:
  - number
  - Number of converted/won leads
- `recentLeads`:
  - optional array
  - Most recent leads for dashboard preview

---

## 2) Lead document contract used by the UI

### Endpoint examples

- `GET /api/leads`
- `GET /api/leads/:id`
- `PATCH /api/leads/:id` for status updates, if enabled by backend

### Lead object shape

```json
{
  "_id": "66c1f0d8f10d8a0012345678",
  "status": "NEW",
  "createdAt": "2026-04-04T10:30:00.000Z",
  "inputData": {
    "projectName": "Warehouse Expansion",
    "location": "Johannesburg",
    "area": 3200
  },
  "boq": {
    "steelTonnage": 18.2,
    "boltCount": 420
  },
  "cost": 1850000,
  "quotationText": "Proposed quotation text...",
  "score": 82,
  "tag": "HOT",
  "optimizedPrice": 2240000,
  "marginSuggestion": "Target 18% gross margin",
  "pricingJustification": "High-demand location and large project size support premium pricing."
}
```

### UI-required fields

The frontend should expect these fields to exist on each lead:

- `_id`
- `status`
- `createdAt`
- `inputData`
- `boq`
- `cost`
- `quotationText`
- `score`
- `tag`
- `optimizedPrice`
- `marginSuggestion`
- `pricingJustification`

### UI assumptions

- `status` is a string used for filter chips and status badges.
- `createdAt` is used for table sorting and date display.
- `inputData` is a nested object and can vary by lead source; the frontend should render known fields defensively.
- `boq` is a nested object containing quantity/cost breakdown data.
- `quotationText` is a long free-text field displayed in the details page.
- `cost` and `optimizedPrice` are numeric values displayed as currency.
- `score` is a number from 0 to 100.
- `tag` is one of `HOT`, `WARM`, or `COLD`.

---

## 3) Lead scoring contract

### Scoring fields

The backend persists scoring results on the lead document:

```json
{
  "score": 82,
  "tag": "HOT"
}
```

### Meaning

- `score`:
  - integer from 0 to 100
  - Higher score means stronger sales priority
- `tag`:
  - string enum
  - Expected values: `HOT`, `WARM`, `COLD`

### Frontend usage

- `score` should be shown in tables and details panels.
- `tag` should drive color-coded badges.
- Do not derive scoring in the UI; always trust backend values.

---

## 4) Pricing optimization contract

### Endpoint

`POST /api/pricing/optimize`

If the backend uses a different route name, the response shape below must remain the same.

### Request shape

```json
{
  "baseCost": 1850000,
  "projectSize": 3200,
  "location": "Johannesburg"
}
```

### Response shape

```json
{
  "optimizedPrice": 2240000,
  "marginSuggestion": "Target 18% gross margin",
  "pricingJustification": "High-demand location and large project size support premium pricing."
}
```

### Field contract

- `optimizedPrice`:
  - number
  - Final suggested selling price
- `marginSuggestion`:
  - string
  - Human-readable pricing guidance
- `pricingJustification`:
  - string
  - Explanation for the price recommendation

### UI usage

- Show optimized price on lead detail pages.
- Display margin suggestion and justification in a callout or note section.
- If any field is missing, the frontend should show a graceful fallback.

---

## 5) Tekla-ready JSON contract

### Endpoint

`POST /api/tekla/prepare`

If the backend uses a different route name, the response shape below must remain the same.

### Request shape

```json
{
  "frameSpacing": 6,
  "bayCount": 4,
  "columnSection": "HEB 260",
  "rafterDepth": 550,
  "connectionType": "Rigid"
}
```

### Response shape

```json
{
  "frameSpacing": 6,
  "bayCount": 4,
  "columnSection": "HEB 260",
  "rafterDepth": 550,
  "connectionType": "Rigid"
}
```

### Field contract

- `frameSpacing`:
  - number
  - Frame spacing in meters
- `bayCount`:
  - number
  - Total number of bays
- `columnSection`:
  - string
  - Tekla-ready structural section designation
- `rafterDepth`:
  - number
  - Suggested rafter depth in mm
- `connectionType`:
  - string
  - Connection classification such as `Rigid`, `Pinned`, or similar backend-approved value

### UI usage

- The frontend should treat this as a structured engineering output.
- Render all values as read-only.
- Do not rename fields in the UI layer; use the backend contract exactly.

---

## 6) Endpoint summary for frontend integration

The frontend should be built around these endpoints and shapes:

- `GET /api/admin/stats`
  - dashboard summary cards and recent leads
- `GET /api/leads`
  - leads list page
- `GET /api/leads/:id`
  - lead detail page
- `PATCH /api/leads/:id`
  - update status action, if supported
- `POST /api/pricing/optimize`
  - pricing optimization details
- `POST /api/tekla/prepare`
  - Tekla-ready design output

---

## 7) Frontend rendering rules

- Use `status` for list filters and update actions.
- Use `createdAt` for human-readable timestamps.
- Use `inputData`, `boq`, and `quotationText` in the lead detail page.
- Use `score` and `tag` as the primary sales-priority indicators.
- Use `optimizedPrice`, `marginSuggestion`, and `pricingJustification` in pricing sections.
- Treat missing optional nested fields defensively and avoid crashing the page.
- Keep backend and frontend decoupled; all data must come from API responses.

---

## 8) Change control

If backend fields change, update this document first or alongside the backend change so the frontend stays aligned.