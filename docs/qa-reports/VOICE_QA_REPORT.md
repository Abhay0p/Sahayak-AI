# SAHAYAK AI — MULTILINGUAL VOICE ASSISTANT QA REPORT

## Overview
Sahayak AI features an integrated Multilingual Voice Assistant supporting Speech-to-Text (STT) and Text-to-Speech (TTS) using standard BCP-47 locale tags (`hi-IN`, `ta-IN`, `te-IN`, `bn-IN`, `mr-IN`, `ur-PK`, `gu-IN`, `kn-IN`, `ml-IN`, `pa-IN`, `or-IN`, `as-IN`, `ne-NP`, `en-IN`, etc.).

---

## Voice Pipeline & Capability Matrix

| Language | BCP-47 Locale | Speech-to-Text (STT) | Text-to-Speech (TTS) | Voice Intent Recognition | Voice Fallback UX | Status |
|---|---|---|---|---|---|---|
| English | `en-IN` | Supported | Supported | Supported | Active | FULLY VOICE TESTED |
| Hindi | `hi-IN` | Supported | Supported | Supported | Active | FULLY VOICE TESTED |
| Bengali | `bn-IN` | Supported | Supported | Supported | Active | VOICE TESTED |
| Telugu | `te-IN` | Supported | Supported | Supported | Active | VOICE TESTED |
| Marathi | `mr-IN` | Supported | Supported | Supported | Active | VOICE TESTED |
| Tamil | `ta-IN` | Supported | Supported | Supported | Active | VOICE TESTED |
| Urdu | `ur-PK` | Supported | Supported | Supported | Active | VOICE TESTED |
| Gujarati | `gu-IN` | Supported | Supported | Supported | Active | VOICE TESTED |
| Kannada | `kn-IN` | Supported | Supported | Supported | Active | VOICE TESTED |
| Malayalam | `ml-IN` | Supported | Supported | Supported | Active | VOICE TESTED |
| Punjabi | `pa-IN` | Supported | Supported | Supported | Active | VOICE TESTED |
| Odia | `or-IN` | Browser Dependent | Browser Dependent | Supported | Active | TEXT FALLBACK READY |
| Assamese | `as-IN` | Browser Dependent | Browser Dependent | Supported | Active | TEXT FALLBACK READY |
| Maithili | `mai-IN` | Browser Dependent | Browser Dependent | Supported | Active | TEXT FALLBACK READY |
| Sanskrit | `sa-IN` | Browser Dependent | Browser Dependent | Supported | Active | TEXT FALLBACK READY |
| Kashmiri | `ks-IN` | Browser Dependent | Browser Dependent | Supported | Active | TEXT FALLBACK READY |
| Nepali | `ne-NP` | Supported | Supported | Supported | Active | VOICE TESTED |
| Sindhi | `sd-PK` | Browser Dependent | Browser Dependent | Supported | Active | TEXT FALLBACK READY |
| Konkani | `kok-IN` | Browser Dependent | Browser Dependent | Supported | Active | TEXT FALLBACK READY |
| Dogri | `doi-IN` | Browser Dependent | Browser Dependent | Supported | Active | TEXT FALLBACK READY |
| Manipuri | `mni-IN` | Browser Dependent | Browser Dependent | Supported | Active | TEXT FALLBACK READY |
| Bodo | `brx-IN` | Browser Dependent | Browser Dependent | Supported | Active | TEXT FALLBACK READY |

---

## Test Scenarios & Results

1. **Microphone Permission Handling**:
   - *Test*: User clicks "Start Speaking" without mic permission.
   - *Result*: Clean alert message displayed: `"Microphone access denied. Please grant permission."` with `[ TRY AGAIN ]` and `[ USE BUTTONS ]` options.

2. **Voice Intent Navigation**:
   - *Test*: User says `"घर / Dashboard"` or `"खेल / Play"`.
   - *Result*: Recognizes intent via `parseVoiceIntent()`, speaks confirmation back in active language, and navigates immediately.

3. **Fallback UX**:
   - *Test*: Triggering voice in browsers without `SpeechRecognition` support.
   - *Result*: Displays graceful fallback banner: `"Voice is currently unavailable in this language on this browser. You can type or use buttons."`

4. **Speech Synthesis (TTS)**:
   - *Test*: User clicks `🗣️ Listen` in game instructions.
   - *Result*: `speakText()` synthesizes instructions using matching BCP-47 locale.
