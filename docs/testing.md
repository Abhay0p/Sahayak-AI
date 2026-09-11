# Testing Guide

Sahayak AI encompasses frontend UI testing, backend API testing, and complex cross-browser features (like WebRTC and Web Speech API).

## 1. Static Analysis & Typing

Before pushing code, ensure that TypeScript and ESLint pass.

**Frontend:**
```bash
cd sahayak-frontend
npm run lint
npx tsc --noEmit
```

**Backend:**
```bash
cd sahayak-backend
npm run build
```

## 2. End-to-End Testing (Manual Smoke Tests)

Because Sahayak AI heavily relies on WebRTC, Speech APIs, and real-time sockets, automated headless testing cannot cover all scenarios. You must manually smoke test the following before major deployments:

### Elderly Portal
- [ ] Login as `elderly1`
- [ ] Verify "My Day" routine timeline populates correctly.
- [ ] Click the Voice Assistant microphone. Allow permissions.
- [ ] Speak "What is next?". Verify the AI responds via TTS.
- [ ] Play a cognitive game (e.g., Memory Match) and complete it.
- [ ] Trigger an SOS alert.

### Family Portal
- [ ] Login as `family1` in an incognito window.
- [ ] Verify the SOS alert appears.
- [ ] Check the daily summary of `elderly1`.
- [ ] Send a text message to `elderly1`.
- [ ] Call `elderly1` (requires two browser windows and camera/mic permissions).

### Caregiver Portal
- [ ] Login as `caregiver1`
- [ ] Verify patient list loads.
- [ ] Check off a care task.
- [ ] Add a care note.

### Healthcare Portal
- [ ] Login as `healthcare1`
- [ ] View patient clinical details.
- [ ] Check cognitive game trends/charts.

## 3. Automated API Tests (Future Roadmap)

*Note: Automated Jest tests for the backend API services are on the roadmap for the next development phase.*
