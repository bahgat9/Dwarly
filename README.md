# DWARLY Fullstack (MongoDB + Express + React)

## Admin Login
- **Email:** admin@dwarly.eg
- **Password:** DWARLY-Admin#2025

## Quick Start
```bash
# from dwarly/ (root)
npm install
cp server/.env.example server/.env   # then edit your Mongo password
# open server/.env and set MONGODB_URI to:
# mongodb+srv://BY7:<db_password>@qr-attendance.nphqruk.mongodb.net/dwarly
npm run dev    # runs server (4000) + client (5173)
```

## Deploy
- Frontend: Vercel/Netlify (build in /client)
- Backend: Render/Heroku (start script in /server)
- Set env on backend:
  - MONGODB_URI
  - JWT_SECRET
  - CORS_ORIGIN (comma-separated, e.g. https://your-frontend.vercel.app)

