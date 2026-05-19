# Transcript Tool — CSRI

A browser-based translation and quality assessment tool for multilingual transcripts.  
Developed at the Centre for Socially Responsible Innovations (CSRI), Faculty of Management, University of Warsaw.

**Live version:** [nawrockipiotr.github.io/csri-transcript-tool](https://nawrockipiotr.github.io/csri-transcript-tool/)

## What it does

- **Translation**: Translates transcripts into any EU language via AI (Anthropic/OpenAI/Google/Local API)
- **Quality Assessment**: Flags potential ASR errors in transcripts (minor/serious) with color coding
- **Both**: Translation + Quality Assessment in one pass
- **Speaker Check**: Validates speaker label consistency and diarization quality
- **Anonymization**: Detects and redacts PII (names, emails, phone numbers, etc.) with configurable categories
- **Summary**: Generates a structured overview of transcript content
- **Auto-Glossary**: Extracts domain terms, lets you review/edit, then enforces them in translation
- **Back-translation**: Translates back to source language and compares for quality scoring
- **Consistency Check**: Detects terminology inconsistencies across batch files
- **Diff view**: Side-by-side and inline highlight comparison of original vs. translation
- **Timestamp check**: Validates SRT timing (gaps, overlaps, duration)
- **Inline edit**: Click on QA flags to correct text directly in the browser
- **Stats**: Word count, speaker turns, duration — deterministic, no AI call needed
- **Coding JSON export**: Structured JSON for import into qualitative coding tools (segments with metadata)
- **Export**: TXT, DOCX, PDF, HTML, SRT, XLSX (batch QA report), JSON (coding), ZIP (all files)

## How to use

1. Open `index.html` in any modern browser — no installation needed
2. Paste your API key (Anthropic, OpenAI, Google) or configure a local server
3. Choose mode: Translation / Quality Assessment / Both / Speaker Check / Anonymization
4. Drag & drop transcript files (TXT, DOCX, SRT, PDF)
5. Click "Process Files"

## Project structure

```
transcript-tool/
├── index.html              ← main page (open this in browser)
├── css/
│   └── style.css           ← all styles (incl. dark mode)
├── js/
│   ├── app.js              ← state, file handling, UI logic, processing pipeline
│   ├── api.js              ← AI provider calls (Anthropic, OpenAI, Google, Local)
│   ├── prompts.js          ← all AI prompts (translate, quality, summary, glossary, etc.)
│   ├── export.js           ← export functions (SRT, TXT, DOCX, PDF, XLSX, ZIP)
│   ├── coding-export.js    ← structured JSON export for qualitative coding tools
│   └── render.js           ← result rendering, tabs, inline edit, diff view
└── README.md
```

## Dependencies (loaded from CDN, no install needed)

- Lucide 0.460.0 — icons
- JSZip 3.10.1 — reading DOCX files, ZIP export
- docx 8.5.0 — writing DOCX files
- pdf.js 3.11.174 — reading PDF files
- SheetJS (xlsx) 0.20.3 — XLSX export

## AI models used

| Provider  | Default (fast/cheap)      | Higher quality           |
|-----------|---------------------------|--------------------------|
| Anthropic | Claude Haiku 4.5          | Claude Sonnet 4.6        |
| OpenAI    | GPT-4o mini               | GPT-4o                   |
| Google    | Gemini 2.0 Flash          | Gemini 2.5 Pro           |
| Local     | User-configured (Ollama, LM Studio, vLLM) | — |

## Known issues / TODO

- Summary two-stage extraction could miss nuance in very long transcripts
- Coding JSON: translation-to-segment alignment uses proportional fallback when speaker turn counts differ
- Session persistence saves results but not settings (creativity slider, processing detail)

## Author

Piotr Nawrocki, Faculty of Management, University of Warsaw, Centre for Socially Responsible Innovations (CSRI).
