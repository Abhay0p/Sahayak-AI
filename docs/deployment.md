# Deployment Guide

This guide outlines how to deploy Sahayak AI to production.

## Architecture Separation

Sahayak AI is separated into two primary deployments:
1. **Frontend**: Next.js application (React, SSR/SSG).
2. **Backend**: Express/Node.js microservices + Socket.io Server + Database.

---

## 1. Deploying the Frontend (Vercel / Netlify)

The easiest way to deploy the frontend is via Vercel.

1. Push your repository to GitHub.
2. In Vercel, create a new project and point it to the `sahayak-frontend` directory.
3. Set the Build Command: `npm run build`
4. Set the Install Command: `npm install`
5. **Set Environment Variables in Vercel**:
   - `NEXT_PUBLIC_APP_NAME="Sahayak AI"`
   - `NEXT_PUBLIC_APP_URL="https://your-frontend-domain.com"`
   - `NEXT_PUBLIC_API_URL="https://api.your-backend-domain.com"`
   - `NEXT_PUBLIC_SOCKET_URL="https://socket.your-backend-domain.com"`
   - `GEMINI_API_KEY="your-production-gemini-key"`
   - `AI_API_KEY="your-production-gemini-key"`

---

## 2. Deploying the Backend (Docker / Render / AWS)

For production, SQLite should be replaced with PostgreSQL.

### Update Prisma for Production (PostgreSQL)

1. Change the provider in `schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Run `npx prisma migrate deploy` in your CI/CD pipeline.

### Docker Deployment

The backend contains a `docker-compose.yml` file for unified orchestration.

1. Build the images on your server.
2. Provide a production `.env` file to the Docker containers:
   - `DATABASE_URL="postgres://user:pass@host:5432/sahayak"`
   - `JWT_SECRET="your-secure-random-256-bit-key"`
3. Run:
   ```bash
   docker-compose up -d --build
   ```
4. Put the backend behind an NGINX reverse proxy to handle SSL (HTTPS) and route traffic to the API Gateway (port 8000) and Socket Server (port 8005).

---

## 3. Realtime / WebRTC Considerations (Important)

If you are deploying the video calling feature to the open internet, peer-to-peer WebRTC connections will fail across strict NATs or Firewalls.

You **must** configure a STUN/TURN server (like Twilio Network Traversal or an open-source Coturn server) in production. Update the `iceServers` configuration in `sahayak-frontend/src/components/CallProvider/CallProvider.tsx` with your production TURN credentials.

---

## 4. Security Checklist

- [ ] Ensure HTTPS is forced everywhere.
- [ ] Rotate `JWT_SECRET` for production.
- [ ] Ensure `.env` is **NOT** committed to GitHub.
- [ ] Restrict CORS in the API Gateway to only allow requests from `NEXT_PUBLIC_APP_URL`.
