# Render Free Tier Keep-Alive Setup

## Health Check Endpoint

**URL:** `https://your-app.onrender.com/health`

**Method:** `GET`

**Response:**
```json
{
  "status": "ok",
  "service": "yahaya-travel-and-trade",
  "timestamp": "2024-12-01T10:30:00.000Z",
  "uptime": 3600.5,
  "memory": {
    "used": 45,
    "total": 128
  },
  "environment": "production"
}
```

---

## Why This Is Needed

Render's free tier spins down services after 15 minutes of inactivity. When a request comes in, it takes 30-60 seconds to spin back up (cold start). 

The `/health` endpoint allows you to ping your server regularly to keep it alive and avoid cold starts.

---

## Setup Options

### Option 1: UptimeRobot (Recommended - Free & Easy)

1. **Sign up:** https://uptimerobot.com (free account)
2. **Add New Monitor:**
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `Yahaya Travel and Trade - Health Check`
   - URL: `https://your-app.onrender.com/health`
   - Monitoring Interval: `5 minutes` (free tier maximum)
3. **Alert Contacts:** Add your email to get notified if the site goes down
4. **Save:** UptimeRobot will now ping your `/health` endpoint every 5 minutes

**Pros:**
- ✅ Free forever
- ✅ Simple setup (5 minutes)
- ✅ Email alerts if site is down
- ✅ Status page available
- ✅ No coding required

---

### Option 2: Cron-Job.org (Free)

1. **Sign up:** https://cron-job.org (free account)
2. **Create Cronjob:**
   - Title: `Yahaya Health Check`
   - URL: `https://your-app.onrender.com/health`
   - Schedule: Every 5 minutes (`*/5 * * * *`)
   - Enabled: ✅
3. **Save**

**Pros:**
- ✅ Free
- ✅ Simple cron syntax
- ✅ Email notifications

---

### Option 3: GitHub Actions (Free for Public Repos)

Create `.github/workflows/keep-alive.yml`:

```yaml
name: Keep Render Alive

on:
  schedule:
    # Runs every 10 minutes
    - cron: '*/10 * * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping health endpoint
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://your-app.onrender.com/health)
          echo "Health check returned: $response"
          if [ $response -ne 200 ]; then
            echo "Health check failed with status: $response"
            exit 1
          fi
```

**Pros:**
- ✅ Free for public repos
- ✅ Integrated with your repo
- ✅ Can fail builds if health check fails

**Cons:**
- ❌ Requires public GitHub repo
- ❌ Slightly more complex setup

---

### Option 4: External Cron Service with curl

If you have a server or can run cron jobs elsewhere:

**Crontab entry:**
```bash
# Ping every 10 minutes
*/10 * * * * curl -s https://your-app.onrender.com/health > /dev/null
```

---

## Best Practices

### 1. **Don't Ping Too Frequently**
- ✅ Recommended: Every 5-10 minutes
- ❌ Avoid: Every 1 minute (wastes bandwidth)
- Why: Render free tier has 750 hours/month. If you keep it alive 24/7, that's 720 hours, leaving some buffer.

### 2. **Monitor Actual Usage**
```
750 hours/month ÷ 30 days = 25 hours/day
```
You can keep the server alive ~24 hours/day comfortably.

### 3. **Set Up Alerts**
Use UptimeRobot or similar to get email alerts when:
- Site goes down
- Response time is slow
- Health check returns error

### 4. **Test the Health Endpoint**

**Local test:**
```bash
curl http://localhost:5173/health
```

**Production test:**
```bash
curl https://your-app.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "yahaya-travel-and-trade",
  "timestamp": "2024-12-01T10:30:00.000Z",
  "uptime": 3600.5,
  "memory": {
    "used": 45,
    "total": 128
  },
  "environment": "production"
}
```

---

## Render Free Tier Limits

| Resource | Limit |
|----------|-------|
| Monthly Hours | 750 hours |
| RAM | 512 MB |
| CPU | Shared |
| Bandwidth | 100 GB/month |
| Cold Start Time | 30-60 seconds |
| Auto Spin Down | After 15 min inactivity |

**Note:** Health checks count toward bandwidth but it's minimal (~1KB per request).

---

## Troubleshooting

### Health Check Returns 404
- Verify `/health` route exists in `src/routes/health.tsx`
- Rebuild and redeploy to Render
- Check Render logs for errors

### Server Still Spinning Down
- Verify cron job is running (check UptimeRobot logs)
- Ensure interval is less than 15 minutes
- Check Render dashboard for activity

### Health Check Times Out
- Check Render logs for startup errors
- Verify environment variables are set
- May be cold start (wait 60 seconds and retry)

---

## Cost Analysis

**Free Tier Keep-Alive Cost:**
- Pings every 10 minutes = 144 pings/day
- 144 pings × ~1KB = 144 KB/day
- 144 KB × 30 days = 4.2 MB/month

**Well within the 100 GB/month bandwidth limit!**

---

## Recommended Setup

1. ✅ Use **UptimeRobot** for simplicity
2. ✅ Set interval to **5 minutes**
3. ✅ Enable **email alerts**
4. ✅ Monitor for **7 days** to confirm it works
5. ✅ Add status page to your internal docs

---

## Alternative: Upgrade to Paid Plan

If you need:
- Zero cold starts
- Always-on service
- More resources

Consider Render's **Starter plan ($7/month)**:
- No spin-down
- 1 GB RAM
- Better CPU allocation
- No keep-alive needed

---

**Status:** Health endpoint ready at `/health`
**Last Updated:** December 2024
