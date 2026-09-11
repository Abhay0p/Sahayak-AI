# Sahayak AI Internal API Documentation

This document outlines the core internal APIs used by Sahayak AI. All endpoints require a valid JWT `Authorization: Bearer <token>` header unless otherwise specified.

## Base URL
Local Development: `http://localhost:8000/api`

---

## Authentication Service (`/auth`)

### `POST /auth/login`
- **Purpose**: Authenticate a user and issue a JWT.
- **Request Body**:
  ```json
  {
    "username": "elderly1",
    "password": "password123"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "token": "eyJhbG...",
    "user": { "id": "...", "role": "elderly", ... }
  }
  ```

---

## User & Profile Service (`/users`, `/patients`)

### `GET /users/me`
- **Purpose**: Get the authenticated user's full profile and preferences.
- **Role**: All
- **Response**: `200 OK` Returns `Profile` object including `routinePreferences`.

### `GET /patients`
- **Purpose**: Get a list of assigned or connected patients.
- **Role**: `family`, `caregiver`, `healthcare`
- **Response**: `200 OK` Array of patient `Profile` objects.

### `GET /patients/:id`
- **Purpose**: Get detailed data for a specific patient.
- **Role**: `family`, `caregiver`, `healthcare` (Must be authorized for the specific ID).
- **Response**: `200 OK` Patient `Profile` object.

---

## Notification & Routine Service (`/notifications`)

### `GET /notifications`
- **Purpose**: Get recent notifications/alerts for the current user.
- **Role**: All
- **Response**: `200 OK` Array of `InAppNotification` objects.

### `POST /notifications/hydration`
- **Purpose**: Log a glass of water for the current patient day. Idempotent per minute.
- **Role**: `elderly`, `caregiver`
- **Response**: `200 OK`

### `GET /notifications/hydration/today`
- **Purpose**: Get the total hydration count for today.
- **Role**: All
- **Response**: `200 OK` `{ "count": 3 }`

---

## AI & Voice Service (`/voice-chat`)

### `POST /voice-chat`
- **Purpose**: Process a spoken transcript, determine user intent, and generate a localized response.
- **Role**: All
- **Request Body**:
  ```json
  {
    "transcript": "What is next on my schedule?",
    "language": "en",
    "timelineContext": "10:00 AM Breakfast (Done), 12:00 PM Medicine (Next)"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "intent": "TIMELINE_WHATS_NEXT",
    "response": "Your next activity is your afternoon medicine at 12:00 PM."
  }
  ```

---

## Communication Service (`/messages`, `/calls`)

### `GET /messages`
- **Purpose**: Retrieve the message history for the user.
- **Role**: All
- **Response**: `200 OK` Array of `Message` objects.

### `POST /calls/initiate`
- **Purpose**: Initiate a WebRTC signaling request for a video/audio call.
- **Role**: All
- **Response**: `200 OK`

*Note: Real-time messaging and call signaling rely on Socket.IO (`http://localhost:8005`).*
