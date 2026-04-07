# Keep-Alive and Production Best Practices

This project uses a Node.js/Express API and a Next.js admin frontend. The backend exposes a fast `GET /health` endpoint that should stay responsive even when MongoDB is slow or temporarily unavailable.

## 1) Keep the backend awake with UptimeRobot

Use a free uptime monitor to ping the API every 5 minutes.

### Recommended setup

1. Go to **https://uptimerobot.com/**
2. Create a free account.
3. Click **Add New Monitor**.
4. Set:
   - **Monitor Type:** `HTTP(s)`
   - **Friendly Name:** `SteelEstimate API Health`
   - **URL (to monitor):** `https://steelestimate.onrender.com/health`
   - **Monitoring Interval:** `5 minutes`
5. Save the monitor.

### Optional but recommended checks

Add a second monitor for the API base path if you want an extra signal:

- `https://steelestimate.onrender.com/api/health` if your deployment exposes it
- otherwise keep only the root `/health` check to avoid extra noise

### What to expect

- Free uptime plans usually allow 5-minute checks.
- If the app sleeps on a free host, the first request after inactivity may be slow.
- This ping strategy reduces cold starts but does not eliminate them completely.

### Similar free alternatives

Any free HTTP uptime checker that supports 5-minute intervals works, for example:

- Better Stack Uptime: `https://betterstack.com/uptime/`
- Cron-job style services that can hit a URL on a schedule

Use the same target URL and interval:
- `GET https://steelestimate.onrender.com/health`
- every `5 minutes`

---

## 2) Recommended Render configuration

### Production settings

For the backend service on Render, use these settings:

- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `node server.js`
- **Region:** choose the region closest to your main users
- **Auto-Deploy:** enabled for production branches
- **Health Check Path:** `/health`

### Environment variables

Set these in the Render dashboard:

- `NODE_ENV=production`
- `PORT` is assigned by Render automatically
- `MONGO_URI=<your MongoDB connection string>`
- `CORS_ORIGIN=https://<your-vercel-frontend-domain>`
- `FRONTEND_URL=https://<your-vercel-frontend-domain>`

If you also use a local/admin domain during development, keep that separate in dev-only environment settings.

### CORS notes

Allow the deployed frontend origin explicitly. A typical production frontend origin looks like:

- `https://your-project.vercel.app`

If you use a custom domain on Vercel, add that exact origin too.

### When free Render is enough

A free plan is usually acceptable for:

- development
- demos
- low-traffic internal use
- light testing with occasional requests

### When to upgrade to paid Render

Upgrade when you need any of the following:

- fewer or no cold starts
- consistent API response times
- production traffic from real users
- higher uptime expectations
- background jobs or more reliable always-on behavior
- predictable availability for sales/demo workflows

As a practical rule: if users are waiting on the first request too often, or if the app is used daily by clients, move to a paid plan.

---

## 3) Monitoring recommendations

### Uptime monitoring

Use at least one uptime monitor on:

- `GET https://steelestimate.onrender.com/health`

Recommended alerts:

- email alert on downtime
- retry on failure before alerting
- notify after 2 failed checks if your tool supports it

### Error monitoring

Track application errors in addition to uptime. Good options:

- Render logs for server-side errors
- browser console and network errors in the frontend
- a lightweight error tracker if you already use one in the stack

At minimum, watch for:

- 5xx API responses
- repeated MongoDB connection failures
- slow first-response times after inactivity
- failed frontend fetches to `NEXT_PUBLIC_API_URL`

### What to log

Make sure logs clearly show:

- request path
- response status
- MongoDB connection success/failure
- startup errors
- health check failures

Avoid noisy logging in `/health`; keep that endpoint fast and simple.

---

## 4) How real SaaS apps handle cold starts

Cold starts are common on free or scaled-down hosts. Production SaaS apps reduce the impact with a few patterns:

### Common mitigation patterns

- **Always-on plans:** paid hosting keeps the app warm
- **health pings:** uptime monitors hit the app every few minutes
- **short timeouts and retries on the client:** helps the first request recover
- **lazy loading expensive work:** delay heavy initialization until needed
- **connection reuse:** keep database connections efficient
- **queueing background jobs:** avoid blocking user requests with slow tasks
- **CDN/static caching:** move non-API content closer to users
- **separate critical endpoints:** keep `/health` fast and independent of MongoDB

### Practical pattern for this project

For this codebase, the best low-cost setup is:

1. Keep `/health` lightweight and independent of MongoDB.
2. Ping `/health` every 5 minutes with UptimeRobot.
3. Use Render’s paid plan once real users depend on the app.
4. Configure the frontend to retry failed API calls and show a message like:
   - `Server is waking up, please wait...`

That combination gives you the best balance of cost and reliability.

---

## 5) Quick production checklist

- [ ] Backend deployed to Render
- [ ] `GET /health` returns fast without waiting on MongoDB
- [ ] UptimeRobot monitor points to `https://steelestimate.onrender.com/health`
- [ ] Monitor interval set to `5 minutes`
- [ ] `CORS_ORIGIN` allows the Vercel frontend domain
- [ ] Frontend uses `NEXT_PUBLIC_API_URL=https://steelestimate.onrender.com/api`
- [ ] Render logs are checked after deployment
- [ ] Upgrade to a paid Render plan if cold starts affect users regularly

## 6) Recommended URLs

Use these production URLs as the default pattern:

- Backend API: `https://steelestimate.onrender.com/api`
- Health check: `https://steelestimate.onrender.com/health`
- Frontend: `https://<your-vercel-domain>`

Keep the exact frontend origin in CORS and environment variables so requests work consistently across deployments.