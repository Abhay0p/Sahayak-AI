# Local Setup Guide

Follow these steps to run Sahayak AI on your local machine for development and testing.

## Prerequisites

1. **Node.js**: Version 20.x or higher
2. **npm**: Version 10.x or higher
3. **Git**: To clone the repository
4. **Google Gemini API Key**: Get one free from [Google AI Studio](https://aistudio.google.com/)

---

## 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-org/sahayak-ai.git
cd sahayak-ai

# Install Frontend Dependencies
cd sahayak-frontend
npm install

# Install Backend Dependencies
cd ../sahayak-backend
npm install
```

## 2. Configure Environment Variables

Do not commit real API keys! Copy the example environment files.

```bash
# In the root directory (or manually copy .env.example)
cp .env.example .env
cp .env.example sahayak-frontend/.env.local
cp .env.example sahayak-backend/.env
```

Open `sahayak-frontend/.env.local` and `sahayak-backend/.env` and add your **Gemini API Key**:
```env
GEMINI_API_KEY="your-actual-api-key"
AI_API_KEY="your-actual-api-key"
```

## 3. Database Setup

Sahayak AI uses Prisma with a local SQLite database for development, meaning no heavy Docker/Postgres setup is required.

```bash
cd sahayak-backend

# Generate Prisma Client
npx prisma generate

# (Optional) If you need to reset or push the schema
# npx prisma db push
```

*Note: The SQLite file `dev.db` is located at `sahayak-backend/packages/database/prisma/dev.db`.*

## 4. Run the Application

Sahayak AI uses a microservices architecture. You must run the backend services and the frontend portal.

**Terminal 1: Start Backend Services**
```bash
cd sahayak-backend
npm run dev
```
*(This starts the API Gateway on port 8000, Socket server on 8005, and all internal microservices).*

**Terminal 2: Start Frontend Next.js Application**
```bash
cd sahayak-frontend
npm run dev
```
*(This starts the frontend on port 3000).*

## 5. Access the Application

Open your browser to: [http://localhost:3000](http://localhost:3000)

**Default Login Accounts (For local DB testing):**
- **Elderly User**: `elderly1` / `password123`
- **Family Member**: `family1` / `password123`
- **Caregiver**: `caregiver1` / `password123`
- **Healthcare**: `healthcare1` / `password123`
