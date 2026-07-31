WAI-108.0 — Professional Technician Voice Write-Up

This release upgrades technician job-card voice dictation while preserving every existing Workshop AI workflow.

Improvements:
- Prevents overlapping microphone sessions.
- Correctly separates interim and final speech-recognition results.
- Removes repeated words and duplicated phrases.
- Filters common filler words.
- Corrects common automotive terminology.
- Adds punctuation and capitalisation.
- Provides live Listening, Processing and Ready states.
- Adds a review screen with Accept & Add, Edit and Record Again.
- Preserves existing job-card notes instead of overwriting them.
- Supports standard SpeechRecognition and webkitSpeechRecognition browsers.

Safety:
Voice input only adds technician write-up text. It cannot change job status, stop or pause labour timers, clock technicians off, approve work or alter invoices.

Browser note:
Raw recognition quality still depends on microphone quality, browser support, internet connectivity and workshop background noise. Chrome or Edge is recommended for initial testing.
