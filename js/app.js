// ─── CSRI Transcript Analysis Tool v2.2 — App Logic ───

const TOOL_VERSION = 'v2.2';

// ─── State ───
let files = [];
let currentMode = 'translate';
let abortController = null;
let isProcessing = false;
let currentProvider = 'anthropic';

// v2.2 state
let glossaryData = {};        // { fileName: [{source, target, category}] }
let glossaryApproved = false; // true after user clicks Approve
let batchTranslations = [];   // [{fileName, original, translation}] for consistency check

const providerConfig = {
  anthropic: {
    label: 'Anthropic API Key', placeholder: 'sk-ant-...', storageKey: 'transcript_tool_api_key_anthropic',
    model: 'claude-haiku-4-5-20251001', modelHQ: 'claude-sonnet-4-6',
    hint: 'Default: Claude Haiku 4.5 (fast, cheap). Higher quality: Claude Sonnet 4.6 (~10× more expensive).'
  },
  openai: {
    label: 'OpenAI API Key', placeholder: 'sk-...', storageKey: 'transcript_tool_api_key_openai',
    model: 'gpt-4o-mini', modelHQ: 'gpt-4o',
    hint: 'Default: GPT-4o mini (fast, cheap). Higher quality: GPT-4o (~15× more expensive).'
  },
  google: {
    label: 'Google AI API Key', placeholder: 'AIza...', storageKey: 'transcript_tool_api_key_google',
    model: 'gemini-2.0-flash', modelHQ: 'gemini-2.5-pro-preview-05-06',
    hint: 'Default: Gemini Flash (fast, cheap). Higher quality: Gemini Pro (~10× more expensive).'
  },
  local: {
    label: 'API Key (optional)', placeholder: 'leave empty if not required', storageKey: 'transcript_tool_api_key_local',
    model: '', modelHQ: '',
    hint: 'Local model via OpenAI-compatible API (Ollama, LM Studio, vLLM). Data stays on your machine — no external data transfer.'
  }
};

// ─── Provider Toggle ───
function setProvider(provider) {
  currentProvider = provider;
  document.querySelectorAll('.provider-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.provider === provider);
  });
  const cfg = providerConfig[provider];
  document.getElementById('apiKeyLabel').textContent = cfg.label;
  apiKeyInput.placeholder = cfg.placeholder;
  document.getElementById('modelHint').textContent = cfg.hint;

  // Show/hide local-specific fields
  const localFields = document.getElementById('localFields');
  if (localFields) {
    localFields.style.display = provider === 'local' ? '' : 'none';
  }

  // Show/hide HQ checkbox (not relevant for local)
  const hqCheck = document.getElementById('highQuality');
  const hqLabel = hqCheck?.closest('.quality-check');
  if (hqLabel) {
    hqLabel.style.display = provider === 'local' ? 'none' : '';
  }

  const saved = localStorage.getItem(cfg.storageKey);
  if (saved) {
    apiKeyInput.value = saved;
    saveKeyCheck.checked = true;
  } else {
    apiKeyInput.value = '';
    saveKeyCheck.checked = false;
  }

  // Restore saved local settings
  if (provider === 'local') {
    const savedEndpoint = localStorage.getItem('transcript_tool_local_endpoint');
    const savedModel = localStorage.getItem('transcript_tool_local_model');
    if (savedEndpoint) document.getElementById('localEndpoint').value = savedEndpoint;
    if (savedModel) document.getElementById('localModel').value = savedModel;
  }
}

function getModel() {
  if (currentProvider === 'local') {
    return document.getElementById('localModel')?.value?.trim() || 'default';
  }
  const hq = document.getElementById('highQuality').checked;
  return hq ? providerConfig[currentProvider].modelHQ : providerConfig[currentProvider].model;
}

// ─── API Key persistence ───
const apiKeyInput = document.getElementById('apiKey');
const saveKeyCheck = document.getElementById('saveKey');

(function loadSavedKey() {
  const cfg = providerConfig[currentProvider];
  const saved = localStorage.getItem(cfg.storageKey);
  if (saved) {
    apiKeyInput.value = saved;
    saveKeyCheck.checked = true;
  }
})();

saveKeyCheck.addEventListener('change', () => {
  const cfg = providerConfig[currentProvider];
  if (saveKeyCheck.checked) {
    if (currentProvider === 'local') {
      // Save local settings too
      const endpoint = document.getElementById('localEndpoint')?.value?.trim();
      const model = document.getElementById('localModel')?.value?.trim();
      if (endpoint) localStorage.setItem('transcript_tool_local_endpoint', endpoint);
      if (model) localStorage.setItem('transcript_tool_local_model', model);
    }
    if (apiKeyInput.value.trim()) {
      localStorage.setItem(cfg.storageKey, apiKeyInput.value.trim());
    }
  } else {
    localStorage.removeItem(cfg.storageKey);
    if (currentProvider === 'local') {
      localStorage.removeItem('transcript_tool_local_endpoint');
      localStorage.removeItem('transcript_tool_local_model');
    }
  }
});

apiKeyInput.addEventListener('input', () => {
  const cfg = providerConfig[currentProvider];
  if (saveKeyCheck.checked && apiKeyInput.value.trim()) {
    localStorage.setItem(cfg.storageKey, apiKeyInput.value.trim());
  }
});

// ─── Mode Toggle ───
function setMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });

  const showTargetLang = ['translate', 'both'].includes(mode);
  document.getElementById('targetLangSetting').style.display = showTargetLang ? '' : 'none';

  const showAnalysisLang = ['speaker', 'anonymize'].includes(mode);
  document.getElementById('analysisLangSetting').style.display = showAnalysisLang ? '' : 'none';

  const summaryOpt = document.getElementById('summaryOption');
  if (summaryOpt) {
    summaryOpt.style.display = ['translate', 'quality', 'both'].includes(mode) ? '' : 'none';
  }

  const anonymizeOpt = document.getElementById('anonymizeOption');
  if (anonymizeOpt) {
    anonymizeOpt.style.display = ['translate', 'quality', 'both'].includes(mode) ? '' : 'none';
  }

  // v2.2 options
  const glossaryOpt = document.getElementById('glossaryOption');
  if (glossaryOpt) {
    glossaryOpt.style.display = ['translate', 'both'].includes(mode) ? '' : 'none';
  }
  const backtransOpt = document.getElementById('backtransOption');
  if (backtransOpt) {
    backtransOpt.style.display = ['translate', 'both'].includes(mode) ? '' : 'none';
  }
}

// ─── File Handling ───
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const fileListEl = document.getElementById('fileList');
const actionBtn = document.getElementById('actionBtn');

dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  addFiles(e.dataTransfer.files);
});
dropzone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  addFiles(fileInput.files);
  fileInput.value = '';
});

function addFiles(newFiles) {
  for (const f of newFiles) {
    const ext = f.name.split('.').pop().toLowerCase();
    if (['txt', 'srt', 'docx', 'pdf'].includes(ext)) {
      files.push(f);
    }
  }
  renderFileList();
}

function removeFile(idx) {
  files.splice(idx, 1);
  renderFileList();
}

function renderFileList() {
  fileListEl.innerHTML = files.map((f, i) => `
    <div class="file-item">
      <span class="name">${escapeHtml(f.name)}</span>
      <span class="size">${(f.size / 1024).toFixed(1)} KB</span>
      <button class="remove" onclick="removeFile(${i})">×</button>
    </div>
  `).join('');
  actionBtn.disabled = files.length === 0;
}

// ─── Read file content ───
async function readFileContent(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'txt' || ext === 'srt') {
    return await file.text();
  }

  if (ext === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const xmlFile = zip.file('word/document.xml');
    if (!xmlFile) return '';
    const xmlContent = await xmlFile.async('string');
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'application/xml');
    const paragraphs = doc.getElementsByTagName('w:p');
    let text = '';
    for (const p of paragraphs) {
      const runs = p.getElementsByTagName('w:t');
      let pText = '';
      for (const r of runs) pText += r.textContent;
      if (pText) text += pText + '\n';
    }
    return text;
  }

  if (ext === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      if (pageText.trim()) text += pageText + '\n';
    }
    return text;
  }

  return '';
}

// ─── Chunk text ───
function chunkText(text, maxChars) {
  const limit = maxChars || getChunkSize();
  const lines = text.split('\n');
  const chunks = [];
  let current = '';

  for (const line of lines) {
    if ((current + '\n' + line).length > limit && current) {
      chunks.push(current);
      current = line;
    } else {
      current = current ? current + '\n' + line : line;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// ─── Process ───
function stopProcessing() {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  isProcessing = false;
  document.getElementById('stopBtn').classList.remove('visible');
  document.getElementById('progressText').textContent = 'Stopped.';
  actionBtn.disabled = false;
}

// ─── v2.2: Timestamp Sanity Check (deterministic, no AI) ───
function checkTimestamps(text, fileName) {
  const srtPattern = /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/g;
  const timestamps = [];
  let match;

  while ((match = srtPattern.exec(text)) !== null) {
    const startMs = (+match[1]*3600 + +match[2]*60 + +match[3])*1000 + +match[4];
    const endMs = (+match[5]*3600 + +match[6]*60 + +match[7])*1000 + +match[8];
    timestamps.push({ start: startMs, end: endMs, line: match.index, raw: match[0] });
  }

  if (timestamps.length === 0) return null; // not an SRT file

  const issues = [];
  for (let i = 0; i < timestamps.length; i++) {
    const t = timestamps[i];
    const duration = t.end - t.start;

    // Negative or zero duration
    if (duration <= 0) {
      issues.push({ type: 'NEGATIVE_DURATION', index: i + 1, detail: `End ≤ Start (${t.raw})`, severity: 'serious' });
    }
    // Unrealistically long (>60s for a single subtitle)
    else if (duration > 60000) {
      issues.push({ type: 'LONG_DURATION', index: i + 1, detail: `${(duration/1000).toFixed(1)}s (${t.raw})`, severity: 'minor' });
    }
    // Very short (<500ms)
    else if (duration < 500) {
      issues.push({ type: 'SHORT_DURATION', index: i + 1, detail: `${duration}ms (${t.raw})`, severity: 'minor' });
    }

    // Overlap with next
    if (i < timestamps.length - 1) {
      const next = timestamps[i + 1];
      if (t.end > next.start) {
        const overlap = t.end - next.start;
        issues.push({ type: 'OVERLAP', index: i + 1, detail: `Overlaps next by ${overlap}ms`, severity: 'serious' });
      }
      // Large gap (>10s between consecutive subtitles)
      else if (next.start - t.end > 10000) {
        issues.push({ type: 'GAP', index: i + 1, detail: `${((next.start - t.end)/1000).toFixed(1)}s gap before next`, severity: 'minor' });
      }
    }

    // Non-monotonic (start goes backward)
    if (i > 0 && t.start < timestamps[i-1].start) {
      issues.push({ type: 'NON_MONOTONIC', index: i + 1, detail: `Start time earlier than previous entry`, severity: 'serious' });
    }
  }

  return { totalEntries: timestamps.length, issues, fileName };
}

// ─── v2.2: Glossary helpers ───
function parseGlossaryResponse(text) {
  const lines = text.split('\n');
  const terms = [];
  let inside = false;
  for (const line of lines) {
    if (line.trim() === 'GLOSSARY_START') { inside = true; continue; }
    if (line.trim() === 'GLOSSARY_END') break;
    if (inside && line.includes('|')) {
      const parts = line.split('|').map(s => s.trim());
      if (parts.length >= 3) {
        terms.push({ source: parts[0], target: parts[1], category: parts[2] });
      }
    }
  }
  return terms;
}

function glossaryToPromptText(terms) {
  return terms.map(t => `"${t.source}" → "${t.target}"`).join('\n');
}

function approveGlossary() {
  // Read edited values from the glossary table
  const table = document.getElementById('glossaryTable');
  if (!table) return;
  const rows = table.querySelectorAll('tbody tr');
  const approved = [];
  for (const row of rows) {
    const cells = row.querySelectorAll('td');
    const checkbox = row.querySelector('input[type="checkbox"]');
    if (checkbox && checkbox.checked) {
      approved.push({
        source: cells[0]?.textContent?.trim() || '',
        target: cells[1]?.querySelector('input')?.value?.trim() || cells[1]?.textContent?.trim() || '',
        category: cells[2]?.textContent?.trim() || ''
      });
    }
  }
  glossaryData._approved = approved;
  glossaryApproved = true;

  // Hide the glossary panel and enable process button
  const panel = document.getElementById('glossaryPanel');
  if (panel) panel.classList.add('approved');
  const approveBtn = document.getElementById('glossaryApproveBtn');
  if (approveBtn) approveBtn.textContent = `✓ Glossary approved (${approved.length} terms)`;

  // Resume processing
  if (typeof resumeAfterGlossary === 'function') resumeAfterGlossary();
}

// ─── Batch QA report data (populated during processing) ───
let batchReportData = [];

async function processFiles() {
  const apiKey = apiKeyInput.value.trim();
  // Local provider: API key is optional
  if (!apiKey && currentProvider !== 'local') { showError('Enter your API key.'); return; }

  // Local provider: validate endpoint and model
  if (currentProvider === 'local') {
    const endpoint = document.getElementById('localEndpoint')?.value?.trim();
    const model = document.getElementById('localModel')?.value?.trim();
    if (!endpoint) { showError('Enter the local server endpoint URL.'); return; }
    if (!model) { showError('Enter the model name for your local server.'); return; }
  }

  abortController = new AbortController();
  isProcessing = true;
  batchReportData = [];

  const targetLang = document.getElementById('targetLang').value;
  const analysisLang = document.getElementById('analysisLang').value;
  const progressArea = document.getElementById('progressArea');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const resultsArea = document.getElementById('resultsArea');
  const stopBtn = document.getElementById('stopBtn');

  progressArea.classList.add('visible');
  resultsArea.classList.add('visible');
  resultsArea.innerHTML = '';
  hideError();
  actionBtn.disabled = true;
  stopBtn.classList.add('visible');
  progressBar.style.width = '0%';

  // Hide batch export bar (will show after processing)
  const batchBar = document.getElementById('batchExportBar');
  if (batchBar) batchBar.style.display = 'none';

  // Read all files
  const fileContents = [];
  for (const file of files) {
    progressText.textContent = `Reading ${file.name}...`;
    const content = await readFileContent(file);
    const chunks = chunkText(content);
    fileContents.push({ file, content, chunks });
  }

  const addSummary = document.getElementById('addSummary')?.checked && ['translate', 'quality', 'both'].includes(currentMode);
  const addAnonymization = document.getElementById('addAnonymization')?.checked && ['translate', 'quality', 'both'].includes(currentMode);
  const useGlossary = document.getElementById('useGlossary')?.checked && ['translate', 'both'].includes(currentMode);
  const useBacktrans = document.getElementById('useBacktrans')?.checked && ['translate', 'both'].includes(currentMode);

  // Reset v2.2 state
  glossaryApproved = false;
  glossaryData = {};
  batchTranslations = [];

  let totalWork = 0;
  for (const { chunks } of fileContents) {
    if (currentMode === 'translate') totalWork += chunks.length + 1;
    else if (currentMode === 'quality') totalWork += chunks.length + 1;
    else if (currentMode === 'both') totalWork += chunks.length * 2 + 1;
    else if (currentMode === 'speaker') totalWork += chunks.length + 1;
    else if (currentMode === 'anonymize') totalWork += chunks.length + 1;
    if (addAnonymization) totalWork += chunks.length;
    if (useGlossary) totalWork += 1; // glossary extraction pass
    if (useBacktrans) totalWork += chunks.length + 1; // back-translate + compare
  }

  let doneWork = 0;

  for (const { file, content, chunks } of fileContents) {
    try {
      let translationResult = '';
      let qualityResult = '';
      let summaryResult = '';
      let speakerResult = '';
      let anonymResult = '';
      let langData = null;
      let bodies = [];

      // ─── Step 1: Detect language ───
      progressText.textContent = `Detecting language of ${file.name}...`;
      const sampleText = content.substring(0, 2000);
      langData = await detectLanguage(apiKey, sampleText);
      doneWork++;
      progressBar.style.width = ((doneWork / totalWork) * 100) + '%';

      if (['translate', 'both'].includes(currentMode) && langData.primary.toLowerCase() === targetLang.toLowerCase()) {
        const langInfo = document.createElement('div');
        langInfo.className = 'lang-warning';
        langInfo.innerHTML = `⚠ <strong>${file.name}</strong>: detected language (${langData.primary}) matches target language (${targetLang}). Translation may not be needed. Processing anyway.`;
        resultsArea.appendChild(langInfo);
      }

      // ─── Summary ───
      if (addSummary) {
        if (chunks.length === 1) {
          progressText.textContent = `Generating summary for ${file.name}...`;
          summaryResult = await callAIWithRetry(apiKey, getSummaryPrompt(targetLang), content);
        } else {
          const keyPoints = [];
          for (let ci = 0; ci < chunks.length; ci++) {
            progressText.textContent = `Extracting key points from ${file.name}... chunk ${ci + 1}/${chunks.length}`;
            const extraction = await callAIWithRetry(apiKey, getSummaryExtractionPrompt(),
              chunks[ci] + `\n[Chunk ${ci + 1} of ${chunks.length}]`);
            keyPoints.push(`Chunk ${ci + 1}:\n${extraction}`);
          }
          progressText.textContent = `Synthesizing summary for ${file.name}...`;
          summaryResult = await callAIWithRetry(apiKey, getSummaryPrompt(targetLang),
            `Below are key points extracted from all chunks of a transcript. Synthesize them into a single coherent summary following your format.\n\n${keyPoints.join('\n\n')}`);
        }
      }

      // ─── v2.2: Glossary extraction (before translation) ───
      let activeGlossaryText = '';
      if (useGlossary && ['translate', 'both'].includes(currentMode)) {
        progressText.textContent = `Extracting glossary from ${file.name}...`;
        const sample = content.substring(0, 6000); // use first 6000 chars for extraction
        const glossaryRaw = await callAIWithRetry(apiKey, getGlossaryExtractionPrompt(targetLang), sample);
        const terms = parseGlossaryResponse(glossaryRaw);
        glossaryData[file.name] = terms;
        doneWork++;
        progressBar.style.width = ((doneWork / totalWork) * 100) + '%';

        // If first file and glossary not yet approved, show table and wait
        if (!glossaryApproved && terms.length > 0) {
          renderGlossaryTable(terms, file.name);
          // Wait for user approval
          await new Promise(resolve => { window.resumeAfterGlossary = resolve; });
        }
        // Build glossary text for prompt
        const approvedTerms = glossaryData._approved || terms;
        activeGlossaryText = glossaryToPromptText(approvedTerms);
      }

      // ─── Translation mode ───
      if (currentMode === 'translate') {
        const translatedParts = [];
        const translatePrompt = activeGlossaryText
          ? getTranslateWithGlossaryPrompt(targetLang, activeGlossaryText)
          : getTranslatePrompt(targetLang);
        for (let ci = 0; ci < chunks.length; ci++) {
          progressText.textContent = `Translating ${file.name}... chunk ${ci + 1}/${chunks.length}`;
          const result = await callAIWithRetry(apiKey, translatePrompt, chunks[ci]);
          translatedParts.push(result);
          doneWork++;
          progressBar.style.width = ((doneWork / totalWork) * 100) + '%';
        }
        translationResult = translatedParts.join('\n');
      }

      // ─── Quality mode ───
      if (currentMode === 'quality' || currentMode === 'both') {
        const qualityParts = [];
        let firstLang = '';
        let scores = [];
        let summaries = [];

        for (let ci = 0; ci < chunks.length; ci++) {
          progressText.textContent = `Assessing quality of ${file.name}... chunk ${ci + 1}/${chunks.length}`;
          const chunkNote = chunks.length > 1
            ? `\n[This is chunk ${ci + 1} of ${chunks.length} from the same file. Assess only this chunk.]`
            : '';
          const result = await callAIWithRetry(apiKey, getQualityPrompt(), chunks[ci] + chunkNote);

          const lines = result.split('\n');
          let bodyStart = 0;
          for (let i = 0; i < Math.min(lines.length, 10); i++) {
            const l = lines[i].trim();
            if (l.startsWith('LANG:') && !firstLang) { firstLang = l.replace('LANG:', '').trim(); bodyStart = i + 1; }
            else if (l.startsWith('SCORE:')) { const s = parseFloat(l.replace('SCORE:', '').trim()); if (!isNaN(s)) scores.push(s); bodyStart = i + 1; }
            else if (l.startsWith('SUMMARY:')) { summaries.push(l.replace('SUMMARY:', '').trim()); bodyStart = i + 1; }
            else if (bodyStart > 0) break;
          }
          let bodyText = lines.slice(bodyStart).join('\n');
          bodyText = bodyText.replace(/\[This is chunk \d+ of \d+ from the same file[^\]]*\]/g, '');
          bodyText = bodyText.replace(/^SUMMARY:.*$/gm, '');
          bodyText = bodyText.replace(/^LANG:.*$/gm, '');
          bodyText = bodyText.replace(/^SCORE:.*$/gm, '');
          bodyText = bodyText.replace(/\n{3,}/g, '\n\n');
          bodies.push(bodyText.trim());
          doneWork++;
          progressBar.style.width = ((doneWork / totalWork) * 100) + '%';
        }

        const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 'N/A';
        const combinedSummary = summaries.length > 1 ? summaries.join(' ') : (summaries[0] || '');
        qualityResult = `LANG: ${firstLang}\nSCORE: ${avgScore}\nSUMMARY: ${combinedSummary}\n${bodies.join('\n')}`;

        // Collect batch report data
        const qaMetrics = computeQAMetrics(bodies.join('\n'));
        batchReportData.push({
          fileName: file.name,
          language: firstLang,
          score: avgScore,
          minorFlags: qaMetrics.minorCount,
          seriousFlags: qaMetrics.seriousCount,
          totalFlags: qaMetrics.totalFlags,
          flaggedPercent: qaMetrics.flaggedPercent,
          summary: combinedSummary
        });
      }

      // ─── Both mode: translate from ORIGINAL text ───
      if (currentMode === 'both') {
        const origChunks = chunkText(content);
        const translatedParts = [];
        const translatePrompt = activeGlossaryText
          ? getTranslateWithGlossaryPrompt(targetLang, activeGlossaryText)
          : getTranslatePrompt(targetLang);
        for (let ci = 0; ci < origChunks.length; ci++) {
          progressText.textContent = `Translating ${file.name}... chunk ${ci + 1}/${origChunks.length}`;
          const result = await callAIWithRetry(apiKey, translatePrompt, origChunks[ci]);
          translatedParts.push(result);
          doneWork++;
          progressBar.style.width = ((doneWork / totalWork) * 100) + '%';
        }
        translationResult = translatedParts.join('\n');
      }

      // ─── Speaker Check (standalone) ───
      if (currentMode === 'speaker') {
        const speakerParts = [];
        for (let ci = 0; ci < chunks.length; ci++) {
          progressText.textContent = `Checking speakers in ${file.name}... chunk ${ci + 1}/${chunks.length}`;
          const chunkNote = chunks.length > 1 ? `\n[This is chunk ${ci + 1} of ${chunks.length}.]` : '';
          const result = await callAIWithRetry(apiKey, getSpeakerCheckPrompt(analysisLang), chunks[ci] + chunkNote);
          speakerParts.push(result);
          doneWork++;
          progressBar.style.width = ((doneWork / totalWork) * 100) + '%';
        }
        speakerResult = speakerParts.join('\n\n---\n\n');
      }

      // ─── Anonymization (standalone) ───
      if (currentMode === 'anonymize') {
        const anonParts = [];
        for (let ci = 0; ci < chunks.length; ci++) {
          progressText.textContent = `Anonymizing ${file.name}... chunk ${ci + 1}/${chunks.length}`;
          const result = await callAIWithRetry(apiKey, getAnonymizationPrompt(analysisLang), chunks[ci]);
          anonParts.push(result);
          doneWork++;
          progressBar.style.width = ((doneWork / totalWork) * 100) + '%';
        }
        anonymResult = anonParts.join('\n');
      }

      // ─── Add-on anonymization ───
      if (addAnonymization) {
        const anonParts = [];
        for (let ci = 0; ci < chunks.length; ci++) {
          progressText.textContent = `Anonymizing ${file.name}... chunk ${ci + 1}/${chunks.length}`;
          const anonLang = ['translate', 'both'].includes(currentMode) ? targetLang : 'English';
          const result = await callAIWithRetry(apiKey, getAnonymizationPrompt(anonLang), chunks[ci]);
          anonParts.push(result);
          doneWork++;
          progressBar.style.width = ((doneWork / totalWork) * 100) + '%';
        }
        anonymResult = anonParts.join('\n');
      }

      // ─── v2.2: Back-translation ───
      let backtransResult = null;
      if (useBacktrans && translationResult && langData) {
        const transChunks = chunkText(translationResult);
        const backParts = [];
        const sourceLang = langData.primary;
        for (let ci = 0; ci < transChunks.length; ci++) {
          progressText.textContent = `Back-translating ${file.name}... chunk ${ci + 1}/${transChunks.length}`;
          const result = await callAIWithRetry(apiKey, getBackTranslatePrompt(sourceLang), transChunks[ci]);
          backParts.push(result);
          doneWork++;
          progressBar.style.width = ((doneWork / totalWork) * 100) + '%';
        }
        const backTranslation = backParts.join('\n');

        // Compare original vs back-translation
        progressText.textContent = `Comparing translations for ${file.name}...`;
        const compareInput = `ORIGINAL:\n${content.substring(0, 4000)}\n\nBACK-TRANSLATION:\n${backTranslation.substring(0, 4000)}`;
        const compareResult = await callAIWithRetry(apiKey, getBackTranslationComparePrompt(), compareInput);
        doneWork++;
        progressBar.style.width = ((doneWork / totalWork) * 100) + '%';
        backtransResult = compareResult;
      }

      // ─── v2.2: Timestamp sanity check (for SRT files) ───
      let timestampResult = null;
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext === 'srt') {
        timestampResult = checkTimestamps(content, file.name);
      }

      // ─── v2.2: Store for consistency check ───
      if (translationResult && ['translate', 'both'].includes(currentMode)) {
        batchTranslations.push({ fileName: file.name, original: content, translation: translationResult });
      }

      renderResult(file.name, translationResult, qualityResult, summaryResult, langData, speakerResult, anonymResult, backtransResult, timestampResult);

    } catch (err) {
      if (err.name === 'AbortError') break;
      showError(`Error processing ${file.name}: ${err.message}`);
    }
  }

  isProcessing = false;
  abortController = null;
  stopBtn.classList.remove('visible');
  progressText.textContent = 'Done.';
  actionBtn.disabled = false;

  // Show batch export bar if multiple files processed
  if (files.length > 1 && batchBar) {
    batchBar.style.display = '';
    // Show QA report button only if QA data collected
    const qaReportBtn = document.getElementById('batchQAReportBtn');
    if (qaReportBtn) {
      qaReportBtn.style.display = batchReportData.length > 0 ? '' : 'none';
    }
    // Show consistency check button if translations collected
    const consistBtn = document.getElementById('batchConsistencyBtn');
    if (consistBtn) {
      consistBtn.style.display = batchTranslations.length > 1 ? '' : 'none';
    }
  }
}

// ─── Batch Export: ZIP all results ───
async function exportAllZip() {
  const resultsArea = document.getElementById('resultsArea');
  const blocks = resultsArea.querySelectorAll('.result-block');
  if (blocks.length === 0) return;

  const zip = new JSZip();
  const metadata = getProcessingMetadata();
  const langCode = getTargetLangCode();

  for (const block of blocks) {
    // Translations
    const transEl = block.querySelector('[id^="trans_"]');
    if (transEl) {
      const fileId = transEl.id.replace('trans_', '');
      const baseName = fileId.replace(/_/g, ' ').replace(/\s(txt|srt|docx|pdf)$/i, '');
      let text = transEl.textContent;
      const cleanCheck = document.getElementById(`clean_${fileId}`);
      if (cleanCheck && cleanCheck.checked) text = stripTimestamps(text);

      let header = metadata + '\n\n';
      const inclSumm = document.getElementById(`inclsumm_${fileId}`);
      if (inclSumm && inclSumm.checked) {
        const summEl = document.getElementById(`summ_${fileId}`);
        if (summEl) header += summEl.textContent + '\n\n';
      }
      header += '---\n\n';
      zip.file(`${baseName}_${langCode}.txt`, header + text);
    }

    // Quality
    const qualEl = block.querySelector('[id^="qual_"]');
    if (qualEl) {
      const fileId = qualEl.id.replace('qual_', '');
      const baseName = fileId.replace(/_/g, ' ').replace(/\s(txt|srt|docx|pdf)$/i, '');
      const metricsHeader = getQAMetricsHeader(fileId);
      let bodyText = qualEl.innerHTML;
      bodyText = bodyText.replace(/<span class="flag-yellow"[^>]*>([\s\S]*?)<\/span>/g, '[⚠ MINOR: $1]');
      bodyText = bodyText.replace(/<span class="flag-red"[^>]*>([\s\S]*?)<\/span>/g, '[❌ SERIOUS: $1]');
      bodyText = bodyText.replace(/<[^>]+>/g, '');
      bodyText = bodyText.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      zip.file(`${baseName}_quality.txt`, metadata + '\n\n' + metricsHeader + FLAGS_LEGEND + '\n\n---\n\n' + bodyText);
    }

    // Speaker check
    const spkrEl = block.querySelector('[id^="spkr_"]');
    if (spkrEl) {
      const fileId = spkrEl.id.replace('spkr_', '');
      const baseName = fileId.replace(/_/g, ' ').replace(/\s(txt|srt|docx|pdf)$/i, '');
      zip.file(`${baseName}_speaker_check.txt`, metadata + '\n\n' + spkrEl.textContent);
    }

    // Anonymization
    const anonEl = block.querySelector('[id^="anon_"]');
    if (anonEl) {
      const fileId = anonEl.id.replace('anon_', '');
      const baseName = fileId.replace(/_/g, ' ').replace(/\s(txt|srt|docx|pdf)$/i, '');
      // Redacted version
      let redacted = anonEl.innerHTML;
      redacted = redacted.replace(/<span class="flag-pii flag-name"[^>]*>([\s\S]*?)<\/span>/g, '[PERSON]');
      redacted = redacted.replace(/<span class="flag-pii flag-org"[^>]*>([\s\S]*?)<\/span>/g, '[ORGANIZATION]');
      redacted = redacted.replace(/<span class="flag-pii flag-loc"[^>]*>([\s\S]*?)<\/span>/g, '[LOCATION]');
      redacted = redacted.replace(/<span class="flag-pii flag-id"[^>]*>([\s\S]*?)<\/span>/g, '[ID_REMOVED]');
      redacted = redacted.replace(/<span class="flag-pii flag-date"[^>]*>([\s\S]*?)<\/span>/g, '[DATE]');
      redacted = redacted.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      zip.file(`${baseName}_anonymized.txt`, metadata + '\n\n' + redacted);
    }
  }

  // Add QA report if available
  if (batchReportData.length > 0) {
    zip.file('_QA_report.csv', generateQAReportCSV());
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `transcript_tool_results_${new Date().toISOString().substring(0, 10)}.zip`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ─── Batch QA Report CSV ───
function generateQAReportCSV() {
  const metadata = getProcessingMetadata();
  let csv = '# ' + metadata.replace(/\n/g, '\n# ') + '\n\n';
  csv += 'File,Language,Score,Minor Flags,Serious Flags,Total Flags,Flagged %,Summary\n';
  for (const row of batchReportData) {
    const summary = '"' + (row.summary || '').replace(/"/g, '""') + '"';
    csv += `"${row.fileName}",${row.language},${row.score},${row.minorFlags},${row.seriousFlags},${row.totalFlags},${row.flaggedPercent}%,${summary}\n`;
  }
  return csv;
}

function exportQAReport() {
  if (batchReportData.length === 0) return;
  const csv = generateQAReportCSV();
  downloadText(csv, `QA_report_${new Date().toISOString().substring(0, 10)}.csv`, 'text/csv');
}

// ─── v2.2: Consistency Check (post-batch) ───
async function runConsistencyCheck() {
  if (batchTranslations.length < 2) return;
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey && currentProvider !== 'local') { showError('Enter API key for consistency check.'); return; }

  const targetLang = document.getElementById('targetLang').value;
  const progressText = document.getElementById('progressText');
  const progressArea = document.getElementById('progressArea');
  progressArea.classList.add('visible');
  progressText.textContent = 'Running consistency check across files...';

  // Build segments: first 2000 chars of each translation with file label
  const segments = batchTranslations.map(bt =>
    `--- FILE: ${bt.fileName} ---\n${bt.translation.substring(0, 2000)}`
  ).join('\n\n');

  try {
    const result = await callAIWithRetry(apiKey, getConsistencyCheckPrompt(targetLang), segments);
    renderConsistencyReport(result);
    progressText.textContent = 'Consistency check complete.';
  } catch (err) {
    showError('Consistency check failed: ' + err.message);
  }
}

// ─── v2.2: Diff view toggle ───
function toggleDiffView(fileId) {
  const container = document.getElementById(`diff_${fileId}`);
  if (!container) return;
  const current = container.dataset.diffState || 'translation';
  const states = ['translation', 'sidebyside', 'inline'];
  const nextIdx = (states.indexOf(current) + 1) % states.length;
  const next = states[nextIdx];
  container.dataset.diffState = next;

  const transEl = container.querySelector('.diff-translation');
  const sideEl = container.querySelector('.diff-sidebyside');
  const inlineEl = container.querySelector('.diff-inline');
  const btn = document.getElementById(`diffBtn_${fileId}`);

  if (transEl) transEl.style.display = next === 'translation' ? '' : 'none';
  if (sideEl) sideEl.style.display = next === 'sidebyside' ? '' : 'none';
  if (inlineEl) inlineEl.style.display = next === 'inline' ? '' : 'none';

  const labels = { translation: '📄 Translation only', sidebyside: '↔ Side by side', inline: '🔍 Inline diff' };
  if (btn) btn.textContent = labels[next];
}

// ─── Error ───
function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.classList.add('visible');
}

function hideError() {
  document.getElementById('errorMsg').classList.remove('visible');
}
