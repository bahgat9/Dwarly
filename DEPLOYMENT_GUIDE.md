# DWARLY Deployment Guide

## Overview
This guide covers the deployment of DWARLY to Vercel (frontend) and Railway (backend).

## Frontend Deployment (Vercel)

### Environment Variables
Set the following environment variable in your Vercel dashboard:

```
VITE_API_URL=https://your-railway-backend-url.railway.app
```

### Build Configuration
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Vercel Configuration
The `vercel.json` file is already configured for SPA routing:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

## Backend Deployment (Railway)

### Environment Variables
Set the following environment variables in your Railway dashboard:

```
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=production
PORT=4000
```

### CORS Configuration
The server is configured to allow requests from:
- `https://dwarly.vercel.app` (production frontend)
- `https://dwarly-frontend.vercel.app` (alternative Vercel URL)
- `http://localhost:5173` (local development)
- `http://localhost:3000` (alternative local development)

## Recent Fixes Applied

### 1. API Configuration
- Updated default API URL to Railway backend
- Fixed authentication context to use production URL

### 2. Job Requests Issue
- Removed session dependency from JobOpportunities component
- Fixed authentication state management
- Jobs now load properly regardless of login status

### 3. Mobile Responsiveness
- Improved mobile layouts across all pages
- Added responsive breakpoints for better mobile experience
- Enhanced touch-friendly button sizing
- Improved text truncation and spacing

### 4. CORS Configuration
- Updated allowed origins for production deployment
- Added support for multiple Vercel URLs

## Testing Checklist

### Frontend (Vercel)
- [ ] Home page loads correctly
- [ ] Navigation works on mobile and desktop
- [ ] Job opportunities page displays jobs
- [ ] Authentication flow works properly
- [ ] Mobile responsiveness is good

### Backend (Railway)
- [ ] API endpoints respond correctly
- [ ] CORS is properly configured
- [ ] Database connection is working
- [ ] File uploads work (CV uploads)
- [ ] Authentication endpoints work

## Troubleshooting

### Common Issues

1. **Jobs not loading after login**
   - Fixed: Removed session dependency from JobOpportunities component
   - Jobs now load independently of authentication state

2. **CORS errors**
   - Check that your Vercel URL is added to the allowed origins in server/src/index.js
   - Ensure the API URL is correctly set in Vercel environment variables

3. **Mobile layout issues**
   - Applied responsive design improvements
   - Added proper breakpoints and mobile-first approach

4. **Authentication issues**
   - Fixed AuthContext to use production API URL
   - Improved error handling for unauthenticated requests

## Deployment Steps

1. **Deploy Backend to Railway**
   - Connect your GitHub repository
   - Set environment variables
   - Deploy

2. **Deploy Frontend to Vercel**
   - Connect your GitHub repository
   - Set VITE_API_URL environment variable
   - Deploy

3. **Update CORS if needed**
   - Add your Vercel URL to allowed origins in server/src/index.js
   - Redeploy backend

4. **Test the deployment**
   - Check all pages load correctly
   - Test authentication flow
   - Verify mobile responsiveness
   - Test job application functionality
