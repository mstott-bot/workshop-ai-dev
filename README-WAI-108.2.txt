Workshop AI — WAI-108.2 Stable Technician Voice Engine

Changes:
- Requests microphone permission directly before starting browser speech recognition.
- Stops the permission test stream immediately after approval.
- Improves handling of denied microphone, unsupported browser, network and speech-service errors.
- Correctly processes results from resultIndex to reduce repeated phrases.
- Retains duplicate-word removal and automotive terminology corrections.
- Adds a Device Dictation fallback for browsers that disable Web Speech recognition.
- Voice notes remain isolated from job status and labour timers.

Recommended use:
- Open Workshop AI through localhost or HTTPS.
- Google Chrome provides the most reliable Web Speech recognition support.
- When asked, allow microphone access for the Workshop AI site.
