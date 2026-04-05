# TEKLA AI Admin Frontend

Next.js App Router admin UI for the TEKLA AI PEB estimation backend.

## Environment

Set the backend base URL with:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

If omitted, the frontend defaults to `http://localhost:5000`.

## Routes

- `/admin/dashboard` - analytics summary and recent leads
- `/admin/leads` - all leads with status/date filters
- `/admin/leads/[id]` - lead detail view with status update form

## API expectations

The UI expects these backend endpoints:

- `GET /api/admin/stats`
- `GET /api/leads`
- `GET /api/leads/:id`
- `PATCH /api/leads/:id/status`

The lead payload should include:

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

The admin stats response should include:

- `totalLeads`
- `totalEstimatedRevenue`
- `conversionRate`
- `conversionCount`
- `recentLeads` optional

## Notes

This frontend is intentionally decoupled from the backend and only consumes REST APIs.