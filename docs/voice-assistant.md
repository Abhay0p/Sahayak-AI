# Voice Assistant Architecture

Sahayak AI features an integrated, multilingual, empathetic voice assistant tailored for elderly users. It can answer questions about the patient's day, check schedules, and navigate the application entirely via voice.

## Architecture Flow

1. **Microphone Capture**: The browser accesses the microphone.
2. **Speech-to-Text (STT)**: Audio is converted to text using the browser's native `webkitSpeechRecognition` API.
3. **Context Injection**: The frontend grabs the current `timelineContext` (the live data of the patient's schedule, what they just did, what is coming next) and bundles it with the transcript.
4. **AI Processing**: The request is sent to the authenticated backend (`/api/voice-chat`). The backend calls Google Gemini 1.5 Flash.
5. **Intent Parsing & Response Generation**: 
   - The AI acts as "Sahayak" (or Kamla), an empathetic elderly companion.
   - It parses the user's spoken intent (e.g., `TIMELINE_WHATS_NEXT`, `NAV_FAMILY`, `CHAT`).
   - It generates a short, 1-3 sentence response in the user's native language.
6. **Text-to-Speech (TTS)**: The frontend receives the response and speaks it using the browser's `SpeechSynthesis` API.

## Supported Intents

The AI is explicitly trained to classify speech into actionable intents:
- `NAV_HOME`: Navigate to Dashboard.
- `NAV_MYDAY`: Navigate to the Routine/Timeline.
- `NAV_GAMES`: Navigate to Cognitive Games.
- `NAV_FAMILY`: Navigate to Family Portal/Call.
- `NAV_MEMORIES`: Navigate to Photo Albums.
- `NAV_MESSAGES`: Navigate to Messages.
- `NAV_HELP`: Trigger SOS/Emergency.
- `TIMELINE_WHATS_NOW`: AI answers "What is happening right now?"
- `TIMELINE_WHATS_NEXT`: AI answers "What is coming up next?"
- `TIMELINE_TODAY_SUMMARY`: AI summarizes the day.
- `TIMELINE_MISSED`: AI informs the user of overdue/missed tasks.
- `TIMELINE_WHEN_ITEM`: AI answers specific scheduling questions (e.g., "When is lunch?").
- `TIMELINE_START_ACTIVITY`: Navigates to a brain activity.
- `CHAT`: General empathetic conversational response.

## Limitations & Dependencies

1. **Browser Dependency (STT)**: STT relies heavily on Google Chrome or Microsoft Edge's implementation of the Web Speech API. Firefox and Safari have limited or no support.
2. **Translation Quality**: The accuracy of the response in non-English languages depends entirely on Google Gemini's translation capabilities for that specific language.
3. **TTS Voices**: Voice quality varies dramatically by OS and Browser. Windows natively provides voices like "Microsoft Kalpana" for Hindi, while macOS has "Lekha".
