# Deployment Guide for Render

## Environment Variables Required

Set these in your Render dashboard:

1. **DATABASE_URL**: Your MongoDB connection string
2. **NODE_ENV**: `production`
3. **PORT**: `10000` (Render will override this)

## Build & Start Commands

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

## Health Check

Visit: `https://your-app.onrender.com/api/health`

Should return:

```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "production"
}
```

## Troubleshooting

1. **502 Error**: Check if DATABASE_URL is set correctly
2. **Build Failures**: Ensure all dependencies are in package.json
3. **Socket.IO Issues**: Check CORS settings in socket-server.mjs

## Local Testing

```bash
npm run build
npm start
```

Visit: `http://localhost:3000/api/health`
