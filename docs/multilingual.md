# Multilingual Support

Sahayak AI is architected to support multiple languages, ensuring elderly users can interact with the platform in their native tongue. 

The platform targets the 22 Scheduled Indian Languages + English, though current support levels vary based on browser STT/TTS capabilities and AI translation models.

## Language Configuration

A user's language preference is stored in their `Profile` (`languagePreference`). When changed, the entire application immediately translates:
1. Static UI text (via Next.js frontend translation dictionaries).
2. Dynamic AI text (The AI is instructed to respond strictly in the requested language).
3. Speech-to-Text (STT) parsing language.
4. Text-to-Speech (TTS) voice selection.

## 22 Scheduled Indian Languages Matrix

*Note: AI/Translation is powered by Google Gemini 1.5 Flash. TTS/STT is powered by the local browser (Chrome/Edge recommended).*

| Language | UI Translation | STT (Speech Input) | AI (Understanding/Reply) | TTS (Spoken Output) | RTL |
|----------|:---:|:---:|:---:|:---:|:---:|
| **English** | ✅ FULL | ✅ FULL | ✅ FULL | ✅ FULL | No |
| **Hindi** | ✅ FULL | ✅ FULL | ✅ FULL | ✅ FULL | No |
| **Bengali** | ✅ FULL | ✅ FULL | ✅ FULL | ⚠️ Partial (OS dependent) | No |
| **Telugu** | ✅ FULL | ✅ FULL | ✅ FULL | ⚠️ Partial (OS dependent) | No |
| **Marathi** | ✅ FULL | ✅ FULL | ✅ FULL | ⚠️ Partial (OS dependent) | No |
| **Tamil** | ✅ FULL | ✅ FULL | ✅ FULL | ✅ FULL | No |
| **Urdu** | ✅ FULL | ✅ FULL | ✅ FULL | ⚠️ Partial (OS dependent) | ✅ Yes |
| **Gujarati** | ✅ FULL | ✅ FULL | ✅ FULL | ⚠️ Partial (OS dependent) | No |
| **Kannada** | ✅ FULL | ✅ FULL | ✅ FULL | ⚠️ Partial (OS dependent) | No |
| **Odia** | ⚠️ Text Only | ❌ Unavailable | ✅ FULL | ❌ Unavailable | No |
| **Malayalam**| ✅ FULL | ✅ FULL | ✅ FULL | ⚠️ Partial (OS dependent) | No |
| **Punjabi** | ⚠️ Text Only | ❌ Unavailable | ✅ FULL | ❌ Unavailable | No |
| **Assamese** | ⚠️ Text Only | ❌ Unavailable | ✅ FULL | ❌ Unavailable | No |
| **Maithili** | ⚠️ Text Only | ❌ Unavailable | ⚠️ Partial | ❌ Unavailable | No |
| **Sanskrit** | ⚠️ Text Only | ❌ Unavailable | ⚠️ Partial | ❌ Unavailable | No |
| **Santali** | ⚠️ Text Only | ❌ Unavailable | ⚠️ Partial | ❌ Unavailable | No |
| **Kashmiri** | ⚠️ Text Only | ❌ Unavailable | ⚠️ Partial | ❌ Unavailable | ✅ Yes |
| **Nepali** | ⚠️ Text Only | ✅ FULL | ✅ FULL | ❌ Unavailable | No |
| **Sindhi** | ⚠️ Text Only | ❌ Unavailable | ⚠️ Partial | ❌ Unavailable | ✅ Yes |
| **Konkani** | ⚠️ Text Only | ❌ Unavailable | ⚠️ Partial | ❌ Unavailable | No |
| **Dogri** | ⚠️ Text Only | ❌ Unavailable | ⚠️ Partial | ❌ Unavailable | No |
| **Manipuri** | ⚠️ Text Only | ❌ Unavailable | ⚠️ Partial | ❌ Unavailable | No |
| **Bodo** | ⚠️ Text Only | ❌ Unavailable | ⚠️ Partial | ❌ Unavailable | No |

## Definitions
- **FULL**: The language is fully tested and supported by the UI, STT, AI, and TTS (assuming standard OS voices).
- **Text Only**: Only the written UI and written AI responses are supported.
- **Partial**: AI can somewhat understand/generate it, or TTS relies on fallback mechanisms.
- **Unavailable**: Browser `webkitSpeechRecognition` or `speechSynthesis` does not support this locale code.
