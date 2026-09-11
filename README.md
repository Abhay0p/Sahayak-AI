# Sahayak AI

**Your Memory. Your Routine. Your People.**

Sahayak AI is an AI-assisted cognitive engagement, memory assistance, daily routine support, and connected care platform for elderly users. 

🟢 **Status**: Pre-deployment / SIH Demonstration Build

---

## The Problem
As populations age, elderly individuals often face challenges with memory retention, adhering to daily routines (like hydration and medication), and feelings of isolation. Caregivers and family members struggle to maintain continuous, non-intrusive visibility into the well-being of their loved ones.

## The Solution
Sahayak AI bridges this gap through a highly accessible, voice-enabled, multilingual digital companion for the elderly, while providing real-time oversight and coordination tools for families, professional caregivers, and healthcare providers.

---

## Key Features

### 👴 Elderly Portal
- **My Day / Care Timeline**: Personalized, real-time schedule tracking.
- **Voice Assistant**: Natural language, voice-driven navigation and schedule querying (powered by Google Gemini).
- **Cognitive Activities**: 13 custom-built, accessible games (e.g., Memory Match, Pattern Detective).
- **Family Connection**: Simplified video calling and messaging.
- **Help / SOS**: Immediate alerts to family and caregivers.
- **Multilingual**: Supports 22 Scheduled Indian Languages + English.

### 👨‍👩‍👧 Family Portal
- **Patient Overview**: Real-time dashboard of the elderly user's day.
- **Communication**: Messages, voice notes, and video calls.
- **Memories**: Upload photo albums that integrate directly into the elderly user's cognitive games.
- **Scheduling**: Remotely manage appointments and reminders.

### 🩺 Caregiver Portal
- **Task Management**: Checklists for daily care tasks.
- **Alerts**: Real-time notifications for missed medications or SOS requests.
- **Care Notes**: Log observations for family and doctors.

### 🏥 Healthcare Portal
- **Clinical Dashboard**: Authorized overview of patient health data.
- **Cognitive Trends**: Charts analyzing the patient's performance in cognitive games over time.
- **Routine Adherence**: Data on medication and hydration compliance.

---

## Architecture & Technology Stack

Sahayak AI uses a microservices-inspired monolithic architecture with strict Role-Based Access Control (RBAC).

- **Frontend**: Next.js (React), TypeScript, CSS Modules
- **Backend**: Node.js, Express, Microservices (API Gateway, Auth, AI, Games, Healthcare, Notifications)
- **Database**: Prisma ORM (SQLite for development, PostgreSQL ready)
- **Realtime / Comms**: Socket.io, Simple-Peer (WebRTC)
- **AI / Voice**: Google Gemini 1.5 Flash, Web Speech API (STT), browser `speechSynthesis` (TTS)

---

## Documentation

Comprehensive documentation can be found in the `docs/` directory:

- [Setup Guide](docs/setup.md)
- [Architecture](docs/architecture.md)
- [Role-Based Access Control](docs/roles.md)
- [API Documentation](docs/api.md)
- [Voice Assistant](docs/voice-assistant.md)
- [Cognitive Games Catalogue](docs/games.md)
- [Multilingual Support](docs/multilingual.md)
- [Deployment Guide](docs/deployment.md)
- [Testing Guide](docs/testing.md)

---

## Quick Start (Local Development)

1. **Clone & Install**:
   ```bash
   git clone https://github.com/your-org/sahayak-ai.git
   cd sahayak-ai
   cd sahayak-backend && npm install
   cd ../sahayak-frontend && npm install
   ```
2. **Environment**:
   Copy `.env.example` to `.env.local` (frontend) and `.env` (backend). Add your `GEMINI_API_KEY`.
3. **Run Backend**:
   ```bash
   cd sahayak-backend
   npx prisma generate
   npm run dev
   ```
4. **Run Frontend**:
   ```bash
   cd sahayak-frontend
   npm run dev
   ```
5. **Access**: Open `http://localhost:3000`. Login with `elderly1` / `password123`.

---

## Contributing
Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, branch naming conventions, and the pull request process.

## Security
For vulnerabilities and security policies, please see [SECURITY.md](SECURITY.md). NEVER commit API keys or environment files.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
