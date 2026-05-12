# Transcript Tool — CSRI

A browser-based translation and quality assessment tool for multilingual transcripts.  
Developed at the Centre for Socially Responsible Innovations (CSRI), Faculty of Management, University of Warsaw.

## What it does

- **Translation**: Translates transcripts into any EU language via AI (Anthropic/OpenAI/Google API)
- **Quality Assessment**: Flags potential ASR errors in transcripts (minor/serious) with color coding
- **Summary**: Generates a structured overview of transcript content
- **Export**: SRT (subtitles), TXT, DOCX, PDF, HTML

## How to use

1. Open `index.html` in any modern browser — no installation needed
2. Paste your API key (Anthropic, OpenAI, or Google)
3. Choose mode: Translation / Quality Assessment / Both
4. Drag & drop transcript files (TXT, DOCX, SRT, PDF)
5. Click "Process Files"

## Project structure

```
transcript-tool/
├── index.html          ← main page (open this in browser)
├── css/
│   └── style.css       ← all styles
├── js/
│   ├── app.js          ← state, file handling, UI logic
│   ├── api.js          ← AI provider calls (Anthropic, OpenAI, Google)
│   ├── prompts.js      ← all AI prompts (translate, quality, summary)
│   ├── export.js       ← export functions (SRT, TXT, DOCX, PDF)
│   └── render.js       ← result rendering and formatting
├── transcription-tool.html  ← original monolithic file (for reference)
└── README.md
```

## Continuing development in Claude Code

```bash
# 1. Navigate to the project folder
cd transcript-tool

# 2. Start Claude Code
claude

# 3. Ask Claude Code to work on the project, e.g.:
#    "Add a review dialog where users can annotate flagged fragments"
#    "Fix the DOCX export encoding"
#    "Add a new export format"
```

## Dependencies (loaded from CDN, no install needed)

- JSZip 3.10.1 — reading DOCX files
- docx 8.5.0 — writing DOCX files
- pdf.js 3.11.174 — reading PDF files
- Google Fonts: DM Sans, JetBrains Mono

## AI models used

| Provider  | Default (fast/cheap)      | Higher quality           |
|-----------|---------------------------|--------------------------|
| Anthropic | Claude Haiku 4.5          | Claude Sonnet 4.6        |
| OpenAI    | GPT-4o mini               | GPT-4o                   |
| Google    | Gemini 2.0 Flash          | Gemini 2.5 Pro           |

## Known issues / TODO

- DOCX export may need testing with long files
- Summary two-stage extraction could miss nuance in very long transcripts
- Review/annotation dialog not yet implemented
- Speaker label reliability warning in summary could be more prominent
