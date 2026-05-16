// ─── CSRI Transcript Analysis Tool v2.3 — Prompts ───

function getLanguageDetectionPrompt() {
  return `Detect the primary language of this transcript. Also note any secondary languages present (code-switching, foreign inserts, quotes in other languages).

RESPONSE FORMAT (strict, one line each):
PRIMARY: [language name in English]
SECONDARY: [comma-separated list of other languages found, or "none"]
CONFIDENCE: [high/medium/low]

RULES:
1. Return ONLY the three lines above, nothing else.
2. Base detection on the dominant language of the content, not metadata or labels.
3. If the text is heavily mixed (e.g., 40/60 split), pick the majority language and note the other as secondary.
4. If you cannot determine the language, return PRIMARY: unknown.`;
}

function getTranslatePrompt(targetLang) {
  return `You are a professional translator. Translate the provided transcript into ${targetLang}.

RULES:
1. Preserve all speaker labels (e.g., "Person 1:", "Speaker 1:") without translating them.
2. Preserve SRT timestamps if present.
3. Translate naturally, keeping the meaning and tone.
4. Foreign inserts: if the transcript contains short phrases or quotes in a DIFFERENT language than the main text (code-switching), translate them into ${targetLang} and mark them with [CS]...[/CS] tags so the user knows these were originally in another language.
5. If a word or phrase is clearly a proper noun, brand name, or technical term that should stay in the original language, keep it as-is.
6. Do not add commentary. Return only the translation.`;
}


function getQualityPrompt() {
  return `You are a transcript quality assessor for ASR (automatic speech recognition) output. Your task is to evaluate transcription quality and mark problems inline.

RESPONSE FORMAT (strict):
Line 1: LANG: [detected primary language of the transcript]
Line 2: SCORE: [1-10, see scoring guide below]
Line 3: SUMMARY: [2-3 sentences describing overall quality and main issues]
Line 4 onwards: the original text with inline markers where issues are found.

SCORING GUIDE:
1-2: Largely unintelligible, most content garbled or missing
3-4: Poor quality, frequent serious errors, hard to follow
5-6: Moderate, understandable but with notable errors throughout
7-8: Good quality, minor issues only, fully comprehensible
9-10: Excellent, near-perfect transcription with minimal or no issues

ISSUE CATEGORIES — mark each with the appropriate tag:
- [Y]problematic text[/Y] — MINOR: slightly garbled but understandable from context (e.g., ASR mishearing, informal speech artifacts, minor word substitution)
- [R]problematic text[/R] — SERIOUS: incomprehensible, clearly wrong transcription, garbled names, major gaps, nonsensical fragments, missing speech content

RULES:
1. Return the COMPLETE original text. Do not summarize or skip sections.
2. Place markers ONLY around the specific problematic words/phrases, not entire sentences.
3. Never nest markers. Never mix opening/closing tags from different categories.
4. Do not add any commentary inside the text itself. All commentary goes in the SUMMARY line only.
5. Preserve all speaker labels, timestamps, and formatting exactly as they appear.
6. Pay special attention to proper names — if a name appears garbled or reversed, mark it with [R].
7. Empty turns or turns with no speech content: mark with [R](no speech)[/R].
8. Do not invent or correct text. Only mark what appears problematic.
9. Foreign language inserts: if the transcript is mainly in language X and some passages are in language Y (code-switching), do NOT flag the foreign passages as errors. They are intentional. Only flag them if the foreign text itself appears garbled.
10. Missing speaker labels: if a turn clearly belongs to a different speaker but has no label or the same label as previous turn, note this in SUMMARY but do not flag it inline (speaker check is a separate function).`;
}

function getSummaryPrompt(targetLang) {
  return `You are a research transcript analyst. Generate a structured summary of the provided transcript entirely in ${targetLang} — including ALL section headers and labels.

RESPONSE FORMAT (translate every header and label into ${targetLang}):

=== SUMMARY ===

[Context header in ${targetLang}]:
- [Source language label in ${targetLang}]: [the language(s) actually SPOKEN in the recording — detect from the transcript content, not from metadata. If multiple languages are spoken (code-switching), list all of them, e.g., "Spanish (primary), English (secondary)"]
- [Participants label in ${targetLang}]: [approximate number based on speaker turns and conversational cues. Do NOT assign names — speaker labels may be unreliable]
- [Estimated length label in ${targetLang}]: [estimate based on timestamps if available, or text volume]
- [Format label in ${targetLang}]: [type of interaction: interview, focus group, workshop, meeting, lecture, etc. — infer from content]

[Main topics header in ${targetLang}]:
[List 3-6 key topics discussed, in the order they appear. Keep each to one sentence.]

[Key points header in ${targetLang}]:
[Summarize the main conclusions, decisions, or actionable insights. Focus on substance, not logistics.]

[Ambiguities header in ${targetLang}]:
[Note any disagreements, unresolved questions, or unclear passages — if none, state so]

=== END ===

RULES:
1. Write EVERYTHING in ${targetLang} — every word, header, label, and content.
2. Do NOT use English for headers if the target language is not English.
3. Do NOT attribute statements to specific speakers.
4. Do NOT quote the transcript directly.
5. Do NOT interpret or evaluate — summarize factually.
6. Do NOT inflate estimates — base length on timestamps or text volume.
7. Keep it concise: 150-300 words total.
8. CRITICAL: Detect the source language from the CONTENT of the transcript (what language are the speakers actually using?), not from file names, metadata, or the translation target language. If the transcript has already been translated, try to identify the original language from contextual clues.`;
}

function getSummaryExtractionPrompt() {
  return `You are a research transcript analyst. Extract the key points from this transcript chunk.

RULES:
1. List the main topics discussed, any conclusions or decisions, and any unresolved questions.
2. Be concise — bullet points, max 150 words.
3. Do NOT attribute statements to specific speakers (speaker labels may be unreliable).
4. Write in the SAME LANGUAGE as the transcript content. Do not translate.
5. Note if there is code-switching (multiple languages used).
6. Note the approximate number of distinct voices/speakers you can identify from context (not just from labels).`;
}

function getSpeakerCheckPrompt(analysisLang) {
  const langNote = analysisLang
    ? `\n\nIMPORTANT: Write all your analysis text — ISSUES descriptions, SUMMARY, and any commentary — in ${analysisLang}. The structured labels (SPEAKERS_DECLARED, SPEAKERS_ESTIMATED, LABEL_COVERAGE, LINE) stay in English as parsing tokens.`
    : '';

  return `You are a transcript diarization quality assessor. Analyze the speaker labels in this transcript.

RESPONSE FORMAT (strict):
Line 1: SPEAKERS_DECLARED: [number of unique speaker labels found]
Line 2: SPEAKERS_ESTIMATED: [your estimate of actual distinct speakers based on conversational cues, context, and turn-taking patterns]
Line 3: LABEL_COVERAGE: [percentage of speech turns that have a speaker label]

Then provide a detailed analysis:

ISSUES:
[List each issue found, one per line, in this format:]
- LINE [timestamp or approximate position]: [description of issue]

ISSUE TYPES to check for:
1. MISSING_LABEL: Speech turns without any speaker label
2. WRONG_LABEL: Same label used for clearly different speakers (detectable from context: different language, contradictory statements, self-references)
3. LABEL_INCONSISTENCY: Same person appears under different labels (detectable from context continuity)
4. MONOLOGUE_SPLIT: Single continuous speech split into multiple turns with same label unnecessarily
5. MISSING_TURN: Conversational cues suggest a response that is not in the transcript (e.g., "right?" followed by continuation without acknowledgment)

SUMMARY:
[2-3 sentences: overall assessment of diarization quality and main recommendations]

RULES:
1. Do NOT attempt to identify speakers by name. Use label references only (Speaker 1, Speaker 2, etc.).
2. Base your analysis on conversational patterns, not assumptions.
3. Return the COMPLETE original text with [S]...[/S] markers around turns where you detected a speaker label issue.
4. Be conservative — only flag issues you are reasonably confident about.${langNote}`;
}

function getAnonymizationPrompt(analysisLang) {
  const langNote = analysisLang
    ? `\n\nIMPORTANT: Write the PII_SUMMARY section and any commentary in ${analysisLang}. The structured labels (PII_SUMMARY, Names found, Organizations found, etc.) stay in English as parsing tokens.`
    : '';

  return `You are a research data anonymization assistant. Identify and mark all personally identifiable information (PII) and potentially identifying details in this transcript.

RESPONSE FORMAT:
Return the COMPLETE original text with the following markers:

- [NAME]real name[/NAME] — personal names (first, last, nicknames)
- [ORG]organization name[/ORG] — company names, institution names, department names
- [LOC]location[/LOC] — specific addresses, city names, neighborhood names, building names
- [ID]identifier[/ID] — phone numbers, email addresses, ID numbers, account numbers
- [DATE]specific date[/DATE] — specific dates that could identify events or people (not general time references like "last year")

After the marked text, provide:

PII_SUMMARY:
- Names found: [count]
- Organizations found: [count]
- Locations found: [count]
- Identifiers found: [count]
- Dates found: [count]
- Risk level: [LOW/MEDIUM/HIGH — based on density and sensitivity of PII]

RULES:
1. Return the COMPLETE original text. Do not summarize or skip sections.
2. Be thorough but avoid false positives — generic references like "the company" or "the university" without specific names should NOT be flagged.
3. Speaker labels (Speaker 1, Person 1) are NOT PII — they are already anonymized.
4. Do NOT flag fictional or hypothetical names created as part of an exercise (e.g., persona creation in workshops) — but DO note them in the summary.
5. Country names used in general context are NOT PII. City names in combination with other details ARE.
6. Preserve all formatting, timestamps, and speaker labels exactly.${langNote}`;
}

// ─── v2.2: Auto-Glossary ───

function getGlossaryExtractionPrompt(targetLang) {
  return `You are a terminology extraction specialist for research transcripts. Analyze this transcript and extract domain-specific terms that require consistent translation.

RESPONSE FORMAT (strict, one term per line after the header):
GLOSSARY_START
[source term]|[suggested ${targetLang} translation]|[category]
GLOSSARY_END

CATEGORIES:
- DOMAIN: field-specific jargon, technical terms, methodology terms
- ACRONYM: abbreviations, initialisms (provide expanded form in translation)
- NAME: recurring proper nouns that need consistent rendering (organizations, projects, tools)
- CONCEPT: abstract concepts discussed repeatedly that benefit from fixed translation

RULES:
1. Extract 5-30 terms depending on transcript length and domain density.
2. Only include terms where consistent translation matters — skip generic vocabulary.
3. For acronyms, provide the expansion in ${targetLang} if a standard one exists, otherwise transliterate.
4. Proper nouns (person names): do NOT include — those should stay as-is.
5. If a term appears in multiple forms (singular/plural, verb/noun), pick the base form.
6. Sort by category, then alphabetically within category.
7. If the transcript has very few domain terms, return at minimum the most important ones.
8. Do NOT include common words that any translator would handle identically.`;
}

function getTranslateWithGlossaryPrompt(targetLang, glossaryText) {
  return `You are a professional translator. Translate the provided transcript into ${targetLang}.

MANDATORY GLOSSARY — use these translations consistently throughout:
${glossaryText}

RULES:
1. Preserve all speaker labels (e.g., "Person 1:", "Speaker 1:") without translating them.
2. Preserve SRT timestamps if present.
3. Translate naturally, keeping the meaning and tone.
4. CRITICAL: For every term in the glossary above, use EXACTLY the specified translation. Do not deviate.
5. Foreign inserts (code-switching): translate into ${targetLang} and mark with [CS]...[/CS].
6. Proper nouns, brand names, or technical terms not in the glossary: keep as-is.
7. Do not add commentary. Return only the translation.`;
}

// ─── v2.2: Back-translation ───

function getBackTranslatePrompt(sourceLang) {
  return `You are a professional translator. Translate the following text back into ${sourceLang}.

RULES:
1. This is a BACK-TRANSLATION for quality verification. Translate as literally and faithfully as possible.
2. Preserve speaker labels without translating them.
3. Preserve timestamps if present.
4. Do NOT smooth out awkward phrasing — translate exactly what is written.
5. Do not add commentary. Return only the translation.`;
}

function getBackTranslationComparePrompt() {
  return `You are a translation quality evaluator. Compare the ORIGINAL transcript with its BACK-TRANSLATION (original → target language → back to original language).

Divergences between original and back-translation indicate potential translation inaccuracies.

RESPONSE FORMAT (strict):
SCORE: [1-10 overall fidelity score]
DIVERGENCE_COUNT: [number of meaningful divergences found]

DIVERGENCES:
[List each divergence, one per line:]
- LINE [position/timestamp]: ORIGINAL: "[original phrase]" → BACK: "[back-translated phrase]" | SEVERITY: [minor/major] | NOTE: [brief explanation]

SUMMARY: [2-3 sentences: overall translation fidelity assessment]

SCORING GUIDE:
9-10: Near-perfect fidelity, trivial wording differences only
7-8: Good fidelity, minor meaning shifts but no significant loss
5-6: Moderate, some content altered or lost in translation
3-4: Poor, significant meaning changes
1-2: Very poor, large portions of meaning lost or altered

RULES:
1. Ignore differences in: word order (if meaning preserved), synonyms with identical meaning, punctuation.
2. Flag: meaning shifts, omissions, additions, wrong terminology, tone changes.
3. Be conservative — only flag genuine meaning divergences, not stylistic variation.
4. Focus on content that matters for research (facts, quotes, data) over filler words.
5. Maximum 20 divergences — prioritize the most significant ones.`;
}

// ─── v2.2: Consistency Check ───

function getConsistencyCheckPrompt(targetLang) {
  return `You are a terminology consistency auditor. Analyze the following translated segments from multiple files in the same research project. Check whether domain-specific terms are translated consistently across all segments.

RESPONSE FORMAT (strict):
CONSISTENT_TERMS: [count of terms translated consistently]
INCONSISTENT_TERMS: [count of terms with varying translations]

INCONSISTENCIES:
[List each inconsistency:]
- TERM: "[source term]" → TRANSLATIONS: "[translation1]" (files: X), "[translation2]" (files: Y) | RECOMMENDED: "[best translation]" | REASON: [brief justification]

SUMMARY: [2-3 sentences: overall consistency assessment and main recommendations]

RULES:
1. Focus on domain/technical terms, acronyms, and recurring concepts.
2. Ignore generic vocabulary variations (synonyms that don't affect meaning).
3. For each inconsistency, recommend the best translation based on context and convention.
4. If all terms are consistent, state so clearly.
5. Target language for analysis: ${targetLang}.`;
}
