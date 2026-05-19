// ─── Transcript Analysis Tool v2.7 — App Logic ───

const TOOL_VERSION = 'v2.8';


// ─── v2.5: Dark mode ───
function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark-mode');
  localStorage.setItem('transcript_tool_dark_mode', isDark ? '1' : '0');
  const btn = document.getElementById('darkToggle');
  if (btn) btn.innerHTML = isDark ? '<i data-lucide="sun" class="icon-sm"></i> ' + I18N.get('light_label') : '<i data-lucide="moon" class="icon-sm"></i> ' + I18N.get('dark_label'); lucide.createIcons({nameAttr: 'data-lucide', node: btn});
}
(function initDarkMode() {
  if (localStorage.getItem('transcript_tool_dark_mode') === '1') {
    document.documentElement.classList.add('dark-mode');
    const btn = document.getElementById('darkToggle');
    if (btn) btn.innerHTML = '<i data-lucide="sun" class="icon-sm"></i> ' + I18N.get('light_label');
  }
})();

// ─── State ───
let files = [];
let currentMode = 'translate';
let abortController = null;
let isProcessing = false;
let currentProvider = 'anthropic';


// ─── v2.5: ETA tracking ───
let etaStartTime = 0;

// ─── Progress helpers ───
function showProgress(msg) {
  const el = document.getElementById('progressText');
  if (el) el.innerHTML = '<span class="api-spinner"></span>' + msg;
}


// ─── v2.5: ETA display ───
function updateETA(doneWork, totalWork) {
  const elapsed = (Date.now() - etaStartTime) / 1000; // seconds
  if (doneWork < 2 || elapsed < 3) return; // need at least 2 data points
  const rate = doneWork / elapsed;
  const remaining = (totalWork - doneWork) / rate;
  const etaEl = document.getElementById('etaText');
  if (remaining < 60) {
    if (etaEl) etaEl.textContent = I18N.msg('msg_remaining_s', {n: Math.ceil(remaining)});
  } else {
    if (etaEl) etaEl.textContent = I18N.msg('msg_remaining_m', {n: Math.ceil(remaining / 60)});
  }
}

// ─── v2.5: File type icons ───
function getFileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  const icons = { txt: 'file-text', srt: 'subtitles', docx: 'file-type', pdf: 'book-open' };
  const iconName = icons[ext] || 'paperclip';
  return '<i data-lucide="' + iconName + '" class="icon-sm"></i>';
}

// v2.2 state
let glossaryData = {};        // { fileName: [{source, target, category}] }
let glossaryApproved = false; // true after user clicks Approve
let uploadedGlossary = null;   // user-uploaded glossary terms (array or null)
let batchTranslations = [];   // [{fileName, original, translation}] for consistency check

const providerConfig = {
  anthropic: {
    label: 'Anthropic API Key', i18nLabel: 'lbl_api_key_anthropic', i18nHint: 'hint_anthropic', placeholder: 'sk-ant-...', storageKey: 'transcript_tool_api_key_anthropic',
    model: 'claude-haiku-4-5-20251001', modelHQ: 'claude-sonnet-4-6',
    hint: 'Default: Claude Haiku 4.5 (fast, cheap). Higher quality: Claude Sonnet 4.6 (~10× more expensive).'
  },
  openai: {
    label: 'OpenAI API Key', i18nLabel: 'lbl_api_key_openai', i18nHint: 'hint_openai', placeholder: 'sk-...', storageKey: 'transcript_tool_api_key_openai',
    model: 'gpt-4o-mini', modelHQ: 'gpt-4o',
    hint: 'Default: GPT-4o mini (fast, cheap). Higher quality: GPT-4o (~15× more expensive).'
  },
  google: {
    label: 'Google AI API Key', i18nLabel: 'lbl_api_key_google', i18nHint: 'hint_google', placeholder: 'AIza...', storageKey: 'transcript_tool_api_key_google',
    model: 'gemini-2.0-flash', modelHQ: 'gemini-2.5-pro-preview-05-06',
    hint: 'Default: Gemini Flash (fast, cheap). Higher quality: Gemini Pro (~10× more expensive).'
  },
  local: {
    label: 'API Key (optional)', i18nLabel: 'lbl_api_key_local', i18nHint: 'hint_local', placeholder: 'leave empty if not required', storageKey: 'transcript_tool_api_key_local',
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
  document.getElementById('apiKeyLabel').textContent = cfg.i18nLabel ? I18N.get(cfg.i18nLabel) : cfg.label;
  apiKeyInput.placeholder = cfg.placeholder;
  document.getElementById('modelHint').textContent = cfg.i18nHint ? I18N.get(cfg.i18nHint) : cfg.hint;

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
  updateCostEstimate();
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


// ─── v2.4: Cost estimation ───
const COST_PER_1K_TOKENS = {
  // [input, output] per 1K tokens in USD
  'claude-haiku-4-5-20251001': [0.0008, 0.004],
  'claude-sonnet-4-6': [0.003, 0.015],
  'gpt-4o-mini': [0.00015, 0.0006],
  'gpt-4o': [0.0025, 0.01],
  'gemini-2.0-flash': [0.0001, 0.0004],
  'gemini-2.5-pro-preview-05-06': [0.00125, 0.01],
};

function getCreativityTemperature() {
  const slider = document.getElementById('creativitySlider');
  if (!slider) return 0.3;
  return parseFloat(slider.value) / 10;
}

function updateCreativityLabel() {
  const slider = document.getElementById('creativitySlider');
  if (!slider) return;
  const val = parseFloat(slider.value) / 10;
  slider.title = 'Temperature: ' + val.toFixed(1);
}

function updateCostEstimate() {
  const panel = document.getElementById('costEstimate');
  const textEl = document.getElementById('costText');
  if (!panel || !textEl || files.length === 0) {
    if (panel) panel.style.display = 'none';
    return;
  }

  if (currentProvider === 'local') {
    panel.style.display = 'flex';
    textEl.textContent = I18N.get('msg_no_cost');
    return;
  }

  const model = getModel();
  const rates = COST_PER_1K_TOKENS[model];
  if (!rates) {
    panel.style.display = 'none';
    return;
  }

  // v2.5: Use actual file sizes for better estimate
  const totalFileBytes = files.reduce((sum, f) => sum + (f.size || 8000), 0);
  const avgCharsPerFile = Math.max(totalFileBytes / files.length, 1000);
  const tokensPerFile = avgCharsPerFile / 4;
  const callsPerFile = estimateCallsPerFile();
  const totalInputTokens = files.length * tokensPerFile * callsPerFile;
  const totalOutputTokens = totalInputTokens * 0.8;

  const cost = (totalInputTokens / 1000 * rates[0]) + (totalOutputTokens / 1000 * rates[1]);
  const low = (cost * 0.5).toFixed(3);
  const high = (cost * 1.5).toFixed(3);

  panel.style.display = 'flex';
  textEl.textContent = I18N.msg('msg_cost', {low: low, high: high, files: files.length, model: model, calls: callsPerFile});
}

function estimateCallsPerFile() {
  let calls = 1; // language detection
  if (currentMode === 'translate') calls += 2; // chunk translate + overhead
  else if (currentMode === 'quality') calls += 2;
  else if (currentMode === 'both') calls += 4;
  if (document.getElementById('addSummary')?.checked) calls += 1;
  if (document.getElementById('addAnonymization')?.checked) calls += 1;
  if (document.getElementById('addSpeakerCheck')?.checked) calls += 1;
  if (document.getElementById('useGlossary')?.checked) calls += 1;
  if (document.getElementById('useBacktrans')?.checked) calls += 3;
  return calls;
}

// ─── Mode Toggle ───
function setMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });

  const showTargetLang = ['translate', 'both'].includes(mode);
  document.getElementById('targetLangSetting').style.display = showTargetLang ? '' : 'none';
  updateCostEstimate();

  // All checkbox options visible for all modes except glossary/backtrans (translate/both only)
  ['summaryOption', 'anonymizeOption', 'speakerOption'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
  });

  // #2 v2.4: Gray out instead of hiding — user sees all options always
  const transMode = ['translate', 'both'].includes(mode);
  ['glossaryOption', 'backtransOption'].forEach(id => {
    const opt = document.getElementById(id);
    if (!opt) return;
    opt.style.display = '';
    const checkbox = opt.querySelector('input[type="checkbox"]');
    const unavail = opt.querySelector('.option-unavail');
    if (transMode) {
      opt.classList.remove('disabled-option');
      if (checkbox) checkbox.disabled = false;
      if (unavail) unavail.style.display = 'none';
    } else {
      opt.classList.add('disabled-option');
      if (checkbox) { checkbox.disabled = true; checkbox.checked = false; }
      if (unavail) unavail.style.display = '';
    }
  });
}



// ─── v2.4: Cost estimate hooks on option checkboxes ───
// Show/hide glossary upload row when checkbox toggled
document.getElementById('useGlossary')?.addEventListener('change', function() {
  const uploadRow = document.getElementById('glossaryUploadRow');
  if (uploadRow) uploadRow.style.display = this.checked ? 'flex' : 'none';
  if (!this.checked) {
    uploadedGlossary = null;
    const status = document.getElementById('glossaryUploadStatus');
    if (status) status.textContent = '';
    const fileInput = document.getElementById('glossaryFileInput');
    if (fileInput) fileInput.value = '';
  }
});

// Glossary file upload handler
document.getElementById('glossaryFileInput')?.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const status = document.getElementById('glossaryUploadStatus');
  const reader = new FileReader();
  reader.onload = function(ev) {
    const text = ev.target.result;
    const terms = parseUploadedGlossary(text);
    if (terms.length === 0) {
      if (status) { status.textContent = I18N.get('msg_glossary_no_terms'); status.style.color = 'var(--red)'; }
      uploadedGlossary = null;
      return;
    }
    uploadedGlossary = terms;
    if (status) { status.textContent = I18N.msg('msg_glossary_loaded', {n: terms.length, file: file.name}); status.style.color = 'var(--green)'; }
  };
  reader.readAsText(file);
});

['addSummary', 'addAnonymization', 'addSpeakerCheck', 'useGlossary', 'useBacktrans', 'highQuality', 'processingDetail'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', updateCostEstimate);
});


// ─── v2.7: Configurable anonymization categories ───
const DEFAULT_ANON_CATEGORIES = ['NAME', 'ORG', 'LOC', 'ID', 'DATE'];
let anonCategories = [...DEFAULT_ANON_CATEGORIES];

function renderAnonCatTags() {
  const container = document.getElementById('anonCatTags');
  if (!container) return;
  container.innerHTML = '';
  anonCategories.forEach((cat, i) => {
    const tag = document.createElement('span');
    const isDefault = DEFAULT_ANON_CATEGORIES.includes(cat);
    tag.className = 'anon-cat-tag' + (isDefault ? ' default' : '');
    tag.innerHTML = cat + (isDefault ? '' : ' <span class="anon-cat-remove" data-idx="' + i + '">&times;</span>');
    container.appendChild(tag);
  });
  container.querySelectorAll('.anon-cat-remove').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.dataset.idx);
      anonCategories.splice(idx, 1);
      renderAnonCatTags();
    });
  });
}

// Show/hide categories row when checkbox toggles
document.getElementById('addAnonymization')?.addEventListener('change', function() {
  const row = document.getElementById('anonCategoriesRow');
  if (row) {
    row.style.display = this.checked ? 'flex' : 'none';
    if (this.checked) renderAnonCatTags();
  }
});

// Add custom category on Enter
document.getElementById('anonCatInput')?.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const val = this.value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
    if (val && !anonCategories.includes(val)) {
      anonCategories.push(val);
      renderAnonCatTags();
    }
    this.value = '';
  }
});

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
  let duplicates = [];
  for (const f of newFiles) {
    const ext = f.name.split('.').pop().toLowerCase();
    if (['txt', 'srt', 'docx', 'pdf'].includes(ext)) {
      if (files.some(existing => existing.name === f.name)) {
        duplicates.push(f.name);
      } else {
        files.push(f);
      }
    }
  }
  if (duplicates.length > 0) {
    showError(`Skipped duplicate file(s): ${duplicates.join(', ')}`);
  }
  renderFileList();
}

function removeFile(idx) {
  files.splice(idx, 1);
  renderFileList();
}

function renderFileList() {
  fileListEl.innerHTML = files.map((f, i) => {
    const status = f._status || '';
    const statusClass = status ? 'file-status-' + status : '';
    const statusLabel = status === 'processing' ? '<i data-lucide="loader" class="icon-xs icon-spin"></i> processing' : status === 'done' ? '<i data-lucide="check" class="icon-xs"></i> done' : status === 'error' ? '<i data-lucide="x" class="icon-xs"></i> error' : status === 'queued' ? '<i data-lucide="minus" class="icon-xs"></i> queued' : '';
    return `
    <div class="file-item" id="fileItem_${i}">
      <span class="file-icon">${getFileIcon(f.name)}</span>
      <span class="name">${escapeHtml(f.name)}</span>
      <span class="size">${(f.size / 1024).toFixed(1)} KB</span>
      ${statusLabel ? '<span class="file-status ' + statusClass + '">' + statusLabel + '</span>' : ''}
      ${!isProcessing ? '<button class="remove" onclick="removeFile(' + i + ')">×</button>' : ''}
    </div>`;
  }).join('');
  actionBtn.disabled = files.length === 0;
  updateCostEstimate();
  if (typeof lucide !== 'undefined') lucide.createIcons({nameAttr: 'data-lucide', node: fileListEl});
}

function setFileStatus(fileIndex, status) {
  files[fileIndex]._status = status;
  const el = document.getElementById('fileItem_' + fileIndex);
  if (!el) return;
  const statusSpan = el.querySelector('.file-status');
  const labels = { processing: '<i data-lucide="loader" class="icon-xs icon-spin"></i> processing', done: '<i data-lucide="check" class="icon-xs"></i> done', error: '<i data-lucide="x" class="icon-xs"></i> error', queued: '<i data-lucide="minus" class="icon-xs"></i> queued' };
  if (statusSpan) {
    statusSpan.innerHTML = labels[status] || status;
    statusSpan.className = 'file-status file-status-' + status;
  } else {
    const span = document.createElement('span');
    span.className = 'file-status file-status-' + status;
    span.innerHTML = labels[status] || status;
    const removeBtn = el.querySelector('.remove');
    el.insertBefore(span, removeBtn);
  }
  if (typeof lucide !== 'undefined') lucide.createIcons({nameAttr: 'data-lucide', node: el});
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

// ─── v2.5: Smart chunk size ───
function getChunkSize(fileSize) {
  const detail = document.getElementById('processingDetail')?.value || 'balanced';
  const base = { fast: 8000, balanced: 5000, thorough: 3000 };
  let size = base[detail] || 5000;
  if (fileSize && fileSize > 200000 && detail !== 'thorough') {
    size = Math.min(size * 1.5, 12000);
  }
  return size;
}

// ─── Chunk text ───
function chunkText(text, maxChars, fileSize) {
  const limit = maxChars || getChunkSize(fileSize);
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
  // Release glossary wait if suspended
  if (window.resumeAfterGlossary) {
    window.resumeAfterGlossary();
    window.resumeAfterGlossary = null;
  }
  document.getElementById('stopBtn').classList.remove('visible');
  const doneCount = files.filter(f => f._status === 'done').length;
  document.getElementById('progressText').textContent = I18N.msg('msg_stopped', {n: doneCount});
  const etaEl = document.getElementById('etaText');
  if (etaEl) etaEl.textContent = '';
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

function parseUploadedGlossary(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  const terms = [];
  const firstLine = lines[0] || '';
  let delim = '|';
  if (firstLine.includes('\t')) delim = '\t';
  else if (firstLine.includes('|')) delim = '|';
  else if (firstLine.includes(';')) delim = ';';
  else if (firstLine.includes(',')) delim = ',';
  let start = 0;
  const hdr = ['source', 'target', 'term', 'translation', 'category', 'original'];
  if (hdr.some(w => firstLine.toLowerCase().includes(w))) start = 1;
  for (let i = start; i < lines.length; i++) {
    const parts = lines[i].split(delim).map(p => p.trim().replace(/^["']|["']$/g, ''));
    if (parts.length >= 2 && parts[0] && parts[1]) {
      terms.push({ source: parts[0], target: parts[1], category: parts[2] || 'DOMAIN' });
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

  // Convert glossary panel to read-only collapsed table
  const panel = document.getElementById('glossaryPanel');
  if (panel) {
    panel.classList.add('approved');
    // Remove unchecked rows, convert to read-only
    const tbody = table.querySelector('tbody');
    if (tbody) {
      const allRows = tbody.querySelectorAll('tr');
      allRows.forEach(row => {
        const cb = row.querySelector('input[type="checkbox"]');
        if (cb && !cb.checked) {
          row.remove();
          return;
        }
        // Remove checkbox cell
        const useCell = row.querySelector('td:last-child');
        if (useCell) useCell.remove();
        // Convert editable input to plain text
        const inputCell = row.querySelectorAll('td')[1];
        if (inputCell) {
          const input = inputCell.querySelector('input');
          if (input) inputCell.textContent = input.value;
        }
      });
    }
    // Remove "Use" column header
    const useHeader = table.querySelector('thead th:last-child');
    if (useHeader) useHeader.remove();
    // Remove approve button and info text
    const approveBtn = panel.querySelector('#glossaryApproveBtn');
    if (approveBtn) approveBtn.remove();
    const infoEl = panel.querySelector('.glossary-info');
    if (infoEl) infoEl.remove();
    // Add collapsible header bar (collapsed by default)
    const bar = document.createElement('div');
    bar.className = 'glossary-collapsed-bar';
    bar.onclick = function() { panel.classList.toggle('glossary-expanded'); };
    bar.innerHTML = '<span><i data-lucide="book-open" class="icon-sm"></i> ' + I18N.msg('msg_glossary_approved', {n: approved.length}) + '</span><span style="display:flex;align-items:center;gap:0.5rem;"><button class="export-btn" onclick="event.stopPropagation();exportGlossaryCSV()" title="Download glossary as CSV">CSV <i data-lucide="download" class="icon-xs"></i></button><span class="glossary-expand-hint"><i data-lucide="chevron-down" class="icon-xs"></i></span></span>';
    // Wrap existing table in collapsed content div
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'glossary-collapsed-content';
    tableWrapper.appendChild(table);
    panel.innerHTML = '';
    panel.appendChild(bar);
    panel.appendChild(tableWrapper);
    if (typeof lucide !== 'undefined') lucide.createIcons({nameAttr: 'data-lucide', node: panel});
  }

  // Resume processing
  if (typeof resumeAfterGlossary === 'function') resumeAfterGlossary();
}

function exportGlossaryCSV() {
  const terms = glossaryData._approved;
  if (!terms || terms.length === 0) return;
  let csv = 'source|target|category\n';
  for (const t of terms) {
    const src = t.source.replace(/"/g, '""');
    const tgt = t.target.replace(/"/g, '""');
    const cat = (t.category || '').replace(/"/g, '""');
    csv += `${src}|${tgt}|${cat}\n`;
  }
  downloadText(csv, 'glossary_' + new Date().toISOString().substring(0, 10) + '.csv', 'text/csv');
}

// ─── Transcript stats (deterministic, no API) ───
function computeTranscriptStats(text, fileName) {
  const lines = text.split('\n');
  const ext = fileName.split('.').pop().toLowerCase();
  
  // Word count
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const charCount = text.length;
  
  // Speaker turns
  const speakerPattern = /^(Speaker\s*\d+|Person\s*\d+|Interviewer|Respondent|[A-Z][a-zA-Z]*\s*\d*)\s*[:：]/;
  let turns = 0;
  const speakerCounts = {};
  let currentSpeaker = null;
  let currentTurnWords = 0;
  const turnLengths = [];
  
  for (const line of lines) {
    const match = line.match(speakerPattern);
    if (match) {
      // Save previous turn
      if (currentSpeaker && currentTurnWords > 0) {
        turnLengths.push(currentTurnWords);
        speakerCounts[currentSpeaker] = (speakerCounts[currentSpeaker] || 0) + currentTurnWords;
      }
      currentSpeaker = match[1].trim();
      turns++;
      currentTurnWords = line.replace(speakerPattern, '').trim().split(/\s+/).filter(w => w.length > 0).length;
    } else if (currentSpeaker && line.trim()) {
      currentTurnWords += line.trim().split(/\s+/).filter(w => w.length > 0).length;
    }
  }
  // Save last turn
  if (currentSpeaker && currentTurnWords > 0) {
    turnLengths.push(currentTurnWords);
    speakerCounts[currentSpeaker] = (speakerCounts[currentSpeaker] || 0) + currentTurnWords;
  }
  
  const avgTurnLength = turnLengths.length > 0 ? Math.round(turnLengths.reduce((a, b) => a + b, 0) / turnLengths.length) : 0;
  const speakerCount = Object.keys(speakerCounts).length;
  
  // SRT duration
  let duration = null;
  if (ext === 'srt') {
    const timePattern = /\d{2}:\d{2}:\d{2}[.,]\d{3}/g;
    const times = text.match(timePattern) || [];
    if (times.length >= 2) {
      const parseTime = t => {
        const [h, m, rest] = t.split(':');
        const [s, ms] = rest.replace(',', '.').split('.');
        return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
      };
      const first = parseTime(times[0]);
      const last = parseTime(times[times.length - 1]);
      const dur = last - first;
      const mins = Math.floor(dur / 60);
      const secs = Math.round(dur % 60);
      duration = mins + ':' + String(secs).padStart(2, '0');
    }
  }
  
  return { wordCount, charCount, turns, speakerCount, speakerCounts, avgTurnLength, duration };
}

// ─── Batch QA report data (populated during processing) ───
let batchReportData = [];
window._fileExportData = {};  // data for coding JSON export

async function processFiles(appendMode) {
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
  if (!appendMode) { batchReportData = []; window._fileExportData = {}; }
  etaStartTime = Date.now();

  const targetLang = document.getElementById('targetLang').value;
  const progressArea = document.getElementById('progressArea');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const resultsArea = document.getElementById('resultsArea');
  const stopBtn = document.getElementById('stopBtn');

  progressArea.classList.add('visible');
  resultsArea.classList.add('visible');
  if (!appendMode) resultsArea.innerHTML = '';
  hideError();
  actionBtn.disabled = true;
  stopBtn.classList.add('visible');
  progressBar.style.width = '0%';
  const progressBarWrap = document.getElementById('progressBarWrap');
  if (progressBarWrap) progressBarWrap.setAttribute('aria-valuenow', '0');

  // v2.5: ETA display
  let etaEl = document.getElementById('etaText');
  if (!etaEl) {
    etaEl = document.createElement('span');
    etaEl.id = 'etaText';
    etaEl.className = 'eta-text';
    progressText.parentNode.insertBefore(etaEl, progressText.nextSibling);
  }
  etaEl.textContent = '';

  // Hide batch export bar (will show after processing)
  const batchBar = document.getElementById('batchExportBar');
  if (batchBar) batchBar.style.display = 'none';

  // Read all files
  const fileContents = [];
  for (const file of files) {
    showProgress(`Reading ${file.name}...`);
    const content = await readFileContent(file);
    const chunks = chunkText(content, null, content.length);
    fileContents.push({ file, content, chunks });
  }

  // Warn about large files
  const largeFiles = fileContents.filter(fc => fc.content.length > 100000);
  if (largeFiles.length > 0) {
    const names = largeFiles.map(fc => fc.file.name).join(', ');
    const approxCalls = largeFiles.reduce((sum, fc) => sum + fc.chunks.length, 0);
    console.warn(`Large file(s) detected: ${names} (~${approxCalls} API calls per mode)`);
  }

  const addSummary = document.getElementById('addSummary')?.checked && ['translate', 'quality', 'both'].includes(currentMode);
  const addAnonymization = document.getElementById('addAnonymization')?.checked;
  const addSpeakerCheck = document.getElementById('addSpeakerCheck')?.checked;
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
    if (addSummary) totalWork += chunks.length > 1 ? chunks.length + 1 : 1;
    if (addAnonymization) totalWork += chunks.length;
    if (addSpeakerCheck) totalWork += chunks.length;
    if (useGlossary) totalWork += 1; // glossary extraction pass
    if (useBacktrans) totalWork += chunks.length + 1; // back-translate + compare
  }

  let doneWork = 0;

  // v2.4: Mark all files as queued
  files.forEach((f, i) => setFileStatus(i, 'queued'));
  renderFileList();

  for (let fi = 0; fi < fileContents.length; fi++) {
    const { file, content, chunks } = fileContents[fi];
    setFileStatus(fi, 'processing');
    try {
      let translationResult = '';
      let qualityResult = '';
      let summaryResult = '';
      let speakerResult = '';
      let anonymResult = '';
      let langData = null;
      let bodies = [];

      // ─── Step 1: Detect language ───
      showProgress(`Detecting language of ${file.name}...`);
      const sampleText = content.substring(0, 2000);
      langData = await detectLanguage(apiKey, sampleText);
      doneWork++;
      progressBar.style.width = ((doneWork / totalWork) * 100) + '%';
      if (progressBarWrap) progressBarWrap.setAttribute('aria-valuenow', Math.round((doneWork / totalWork) * 100));
      updateETA(doneWork, totalWork);

      if (['translate', 'both'].includes(currentMode) && langData.primary.toLowerCase() === targetLang.toLowerCase()) {
        const langInfo = document.createElement('div');
        langInfo.className = 'lang-warning';
        langInfo.innerHTML = '<i data-lucide="alert-triangle" class="icon-xs"></i> ' + I18N.msg('msg_lang_match', {file: file.name, source: langData.primary, target: targetLang});
        resultsArea.appendChild(langInfo);
      }

      // ─── Summary ───
      if (addSummary) {
        if (chunks.length === 1) {
          showProgress(`Generating summary for ${file.name}...`);
          summaryResult = await callAIWithRetry(apiKey, getSummaryPrompt(targetLang, langData?.primary), content, 3, { temperature: getCreativityTemperature() });
          doneWork++;
          progressBar.style.width = ((doneWork / totalWork) * 100) + '%';
      if (progressBarWrap) progressBarWrap.setAttribute('aria-valuenow', Math.round((doneWork / totalWork) * 100));
      updateETA(doneWork, totalWork);
        } else {
          const keyPoints = [];
          for (let ci = 0; ci < chunks.length; ci++) {
            showProgress(`Extracting key points from ${file.name}... chunk ${ci + 1}/${chunks.length}`);
            const extraction = await callAIWithRetry(apiKey, getSummaryExtractionPrompt(targetLang),
              chunks[ci] + `\n[Chunk ${ci + 1} of ${chunks.length}]`, 3, { temperature: getCreativityTemperature() });
            keyPoints.push(`Chunk ${ci + 1}:\n${extraction}`);
            doneWork++;
            progressBar.style.width = ((doneWork / totalWork) * 100) + '%';
      if (progressBarWrap) progressBarWrap.setAttribute('aria-valuenow', Math.round((doneWork / totalWork) * 100));
      updateETA(doneWork, totalWork);
          }
          showProgress(`Synthesizing summary for ${file.name}...`);
          summaryResult = await callAIWithRetry(apiKey, getSummaryPrompt(targetLang, langData?.primary),
            `Below are key points extracted from all chunks of a transcript. Synthesize them into a single coherent summary following your format.\n\n${keyPoints.join('\n\n')}`, 3, { temperature: getCreativityTemperature() });
          doneWork++;
          progressBar.style.width = ((doneWork / totalWork) * 100) + '%';
      if (progressBarWrap) progressBarWrap.setAttribute('aria-valuenow', Math.round((doneWork / totalWork) * 100));
      updateETA(doneWork, totalWork);
        }
      }

      // ─── v2.2: Glossary (uploaded or AI-extracted) ───
      let activeGlossaryText = '';
      if (useGlossary && ['translate', 'both'].includes(currentMode)) {
        if (uploadedGlossary && uploadedGlossary.length > 0) {
          // User uploaded their own glossary — use directly, show for review on first file
          if (!glossaryApproved) {
            glossaryData._uploaded = true;
            renderGlossaryTable(uploadedGlossary, 'Uploaded glossary');
            progressText.textContent = I18N.get('msg_glossary_review');
            const glossaryEl = document.getElementById('glossaryApproveBtn');
            if (glossaryEl) glossaryEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => { window.resumeAfterGlossary = resolve; });
            if (!isProcessing) throw { name: 'AbortError' };
          }
          const approvedTerms = glossaryData._approved || uploadedGlossary;
          activeGlossaryText = glossaryToPromptText(approvedTerms);
          doneWork++;
          progressBar.style.width = ((doneWork / totalWork) * 100) + '%';
          if (progressBarWrap) progressBarWrap.setAttribute('aria-valuenow', Math.round((doneWork / totalWork) * 100));
          updateETA(doneWork, totalWork);
        } else if (glossaryApproved && glossaryData._approved) {
          // Reuse first file's approved glossary for subsequent files
          activeGlossaryText = glossaryToPromptText(glossaryData._approved);
          doneWork++;
          progressBar.style.width = ((doneWork / totalWork) * 100) + '%';
          if (progressBarWrap) progressBarWrap.setAttribute('aria-valuenow', Math.round((doneWork / totalWork) * 100));
          updateETA(doneWork, totalWork);
        } else {
          // AI extraction (full text, temperature 0 for reproducibility)
          showProgress(`Extracting glossary from ${file.name}...`);
          const glossaryRaw = await callAIWithRetry(apiKey, getGlossaryExtractionPrompt(targetLang), content, 3, { temperature: 0 });
          let terms = parseGlossaryResponse(glossaryRaw);
          // Add frequency count for each term
          terms = terms.map(t => {
            const regex = new RegExp(t.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            const matches = content.match(regex);
            return { ...t, freq: matches ? matches.length : 0 };
          });
          // Sort by frequency descending
          terms.sort((a, b) => b.freq - a.freq);
          glossaryData[file.name] = terms;
          doneWork++;
          progressBar.style.width = ((doneWork / totalWork) * 100) + '%';
          if (progressBarWrap) progressBarWrap.setAttribute('aria-valuenow', Math.round((doneWork / totalWork) * 100));
          updateETA(doneWork, totalWork);

          if (!glossaryApproved && terms.length > 0) {
            renderGlossaryTable(terms, file.name);
            progressText.textContent = I18N.get('msg_glossary_review2');
            const glossaryEl = document.getElementById('glossaryApproveBtn');
            if (glossaryEl) glossaryEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => { window.resumeAfterGlossary = resolve; });
            if (!isProcessing) throw { name: 'AbortError' };
          }
          const approvedTerms = glossaryData._approved || terms;
          activeGlossaryText = glossaryToPromptText(approvedTerms);
        }
      }

      // ─── Translation mode ───
      if (currentMode === 'translate') {
        const translatedParts = [];
        const translatePrompt = activeGlossaryText
          ? getTranslateWithGlossaryPrompt(targetLang, activeGlossaryText)
          : getTranslatePrompt(targetLang);
        for (let ci = 0; ci < chunks.length; ci++) {
          showProgress(`Translating ${file.name}... chunk ${ci + 1}/${chunks.length}`);
          const result = await callAIWithRetry(apiKey, translatePrompt, chunks[ci], 3, { temperature: getCreativityTemperature() });
          translatedParts.push(result);
          doneWork++;
          progressBar.style.width = ((doneWork / totalWork) * 100) + '%';
      if (progressBarWrap) progressBarWrap.setAttribute('aria-valuenow', Math.round((doneWork / totalWork) * 100));
      updateETA(doneWork, totalWork);
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
          showProgress(`Assessing quality of ${file.name}... chunk ${ci + 1}/${chunks.length}`);
          const chunkNote = chunks.length > 1
            ? `\n[This is chunk ${ci + 1} of ${chunks.length} from the same file. Assess only this chunk.]`
            : '';
          const result = await callAIWithRetry(apiKey, getQualityPrompt(), chunks[ci] + chunkNote, 3, { temperature: getCreativityTemperature() });

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
      if (progressBarWrap) progressBarWrap.setAttribute('aria-valuenow', Math.round((doneWork / totalWork) * 100));
      updateETA(doneWork, totalWork);
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
        const origChunks = chunkText(content, null, content.length);
        const translatedParts = [];
        const translatePrompt = activeGlossaryText
          ? getTranslateWithGlossaryPrompt(targetLang, activeGlossaryText)
          : getTranslatePrompt(targetLang);
        for (let ci = 0; ci < origChunks.length; ci++) {
          showProgress(`Translating ${file.name}... chunk ${ci + 1}/${origChunks.length}`);
          const result = await callAIWithRetry(apiKey, translatePrompt, origChunks[ci], 3, { temperature: getCreativityTemperature() });
          translatedParts.push(result);
          doneWork++;
          progressBar.style.width = ((doneWork / totalWork) * 100) + '%';
      if (progressBarWrap) progressBarWrap.setAttribute('aria-valuenow', Math.round((doneWork / totalWork) * 100));
      updateETA(doneWork, totalWork);
        }
        translationResult = translatedParts.join('\n');
      }

      // ─── Speaker Check (add-on) ───
      if (addSpeakerCheck) {
        const speakerParts = [];
        const spkLang = document.getElementById('targetLang')?.value || 'English';
        for (let ci = 0; ci < chunks.length; ci++) {
          showProgress(`Checking speakers in ${file.name}... chunk ${ci + 1}/${chunks.length}`);
          const chunkNote = chunks.length > 1 ? `\n[This is chunk ${ci + 1} of ${chunks.length}.]` : '';
          const result = await callAIWithRetry(apiKey, getSpeakerCheckPrompt(spkLang), chunks[ci] + chunkNote, 3, { temperature: getCreativityTemperature() });
          speakerParts.push(result);
          doneWork++;
          progressBar.style.width = ((doneWork / totalWork) * 100) + '%';
      if (progressBarWrap) progressBarWrap.setAttribute('aria-valuenow', Math.round((doneWork / totalWork) * 100));
      updateETA(doneWork, totalWork);
        }
        speakerResult = speakerParts.join('\n\n---\n\n');
      }

      // ─── Add-on anonymization ───
      if (addAnonymization) {
        const anonParts = [];
        for (let ci = 0; ci < chunks.length; ci++) {
          showProgress(`Anonymizing ${file.name}... chunk ${ci + 1}/${chunks.length}`);
          const anonLang = targetLang || 'English';
          const result = await callAIWithRetry(apiKey, getAnonymizationPrompt(anonLang, anonCategories), chunks[ci], 3, { temperature: getCreativityTemperature() });
          anonParts.push(result);
          doneWork++;
          progressBar.style.width = ((doneWork / totalWork) * 100) + '%';
      if (progressBarWrap) progressBarWrap.setAttribute('aria-valuenow', Math.round((doneWork / totalWork) * 100));
      updateETA(doneWork, totalWork);
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
          showProgress(`Back-translating ${file.name}... chunk ${ci + 1}/${transChunks.length}`);
          const result = await callAIWithRetry(apiKey, getBackTranslatePrompt(sourceLang), transChunks[ci], 3, { temperature: getCreativityTemperature() });
          backParts.push(result);
          doneWork++;
          progressBar.style.width = ((doneWork / totalWork) * 100) + '%';
      if (progressBarWrap) progressBarWrap.setAttribute('aria-valuenow', Math.round((doneWork / totalWork) * 100));
      updateETA(doneWork, totalWork);
        }
        const backTranslation = backParts.join('\n');

        // Compare original vs back-translation
        showProgress(`Comparing translations for ${file.name}...`);
        const compareInput = `ORIGINAL:\n${content.substring(0, 4000)}\n\nBACK-TRANSLATION:\n${backTranslation.substring(0, 4000)}`;
        const compareResult = await callAIWithRetry(apiKey, getBackTranslationComparePrompt(), compareInput, 3, { temperature: getCreativityTemperature() });
        doneWork++;
        progressBar.style.width = ((doneWork / totalWork) * 100) + '%';
      if (progressBarWrap) progressBarWrap.setAttribute('aria-valuenow', Math.round((doneWork / totalWork) * 100));
      updateETA(doneWork, totalWork);
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

      const transcriptStats = computeTranscriptStats(content, file.name);
      renderResult(file.name, translationResult, qualityResult, summaryResult, langData, speakerResult, anonymResult, backtransResult, timestampResult, { provider: currentProvider, model: getModel() }, transcriptStats);

      // Save data for coding JSON export
      const codingFId = file.name.replace(/[^a-zA-Z0-9]/g, '_');
      window._fileExportData[codingFId] = {
        fileName: file.name,
        content: content,
        translationResult: translationResult,
        qualityResult: qualityResult,
        langData: langData,
        glossaryTerms: glossaryData._approved || [],
        anonymResult: anonymResult,
        mode: currentMode,
        isSrt: file.name.split('.').pop().toLowerCase() === 'srt'
      };

      setFileStatus(fi, 'done');

    } catch (err) {
      if (err.name === 'AbortError') break;
      setFileStatus(fi, 'error');
      showError(`Error processing ${file.name}: ${err.message}`);
    }
  } // end file loop

  isProcessing = false;
  abortController = null;
  stopBtn.classList.remove('visible');
  progressText.textContent = I18N.get('progress_done');
  actionBtn.disabled = false;
  const etaFinal = document.getElementById('etaText');
  if (etaFinal) etaFinal.textContent = '';


  // v2.5: Save session results to localStorage
  try {
    const resultsHtml = resultsArea.innerHTML;
    if (resultsHtml && resultsHtml.length < 5000000) { // max ~5MB
      localStorage.setItem('transcript_tool_session', JSON.stringify({
        html: resultsHtml,
        timestamp: new Date().toISOString(),
        fileCount: files.length,
        anonymResult: anonymResult,
        mode: currentMode,
        batchReportData: batchReportData
      }));
    }
  } catch(e) { /* localStorage full — skip */ }

  // Show batch export bar if multiple files processed
  if (files.length > 1 && batchBar) {
    batchBar.style.display = '';
    // Show QA report button only if QA data collected
    const qaReportBtn = document.getElementById('batchQAReportBtn');
    if (qaReportBtn) {
      qaReportBtn.style.display = batchReportData.length > 0 ? '' : 'none';
    }
    const qaXlsxBtn = document.getElementById('batchQAXlsxBtn');
    if (qaXlsxBtn) {
      qaXlsxBtn.style.display = batchReportData.length > 0 ? '' : 'none';
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
  try {
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

    // Back-translation
    const btransEl = block.querySelector('[id^="btrans_"]');
    if (btransEl) {
      const fileId = btransEl.id.replace('btrans_', '');
      const baseName = fileId.replace(/_/g, ' ').replace(/\s(txt|srt|docx|pdf)$/i, '');
      zip.file(`${baseName}_back_translation.txt`, metadata + '\n\n' + btransEl.textContent);
    }

    // Summary (standalone)
    const summEl = block.querySelector('[id^="summ_"]');
    if (summEl) {
      const fileId = summEl.id.replace('summ_', '');
      const baseName = fileId.replace(/_/g, ' ').replace(/\s(txt|srt|docx|pdf)$/i, '');
      zip.file(`${baseName}_summary.txt`, metadata + '\n\n' + summEl.textContent);
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
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } catch (err) {
    console.error('ZIP export failed:', err);
    alert(I18N.get('msg_export_failed') + (err.message || err));
  }
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
  showProgress('Running consistency check across files...');

  // Build segments: first 2000 chars of each translation with file label
  const segments = batchTranslations.map(bt =>
    `--- FILE: ${bt.fileName} ---\n${bt.translation.substring(0, 2000)}`
  ).join('\n\n');

  try {
    const result = await callAIWithRetry(apiKey, getConsistencyCheckPrompt(targetLang), segments, 3, { temperature: getCreativityTemperature() });
    renderConsistencyReport(result);
    showProgress('Consistency check complete.');
  } catch (err) {
    showError('Consistency check failed: ' + err.message);
  }
}

// ─── v2.2: Diff view toggle ───
function setDiffView(fileId, view) {
  const container = document.getElementById(`diff_${fileId}`);
  if (!container) return;
  container.dataset.diffState = view;

  const transEl = container.querySelector('.diff-translation');
  const sideEl = container.querySelector('.diff-sidebyside');
  const inlineEl = container.querySelector('.diff-inline');

  if (transEl) transEl.style.display = view === 'translation' ? '' : 'none';
  if (sideEl) sideEl.style.display = view === 'sidebyside' ? '' : 'none';
  if (inlineEl) inlineEl.style.display = view === 'inline' ? '' : 'none';

  // Update segmented control active state
  const seg = document.getElementById(`diffSeg_${fileId}`);
  if (seg) {
    seg.querySelectorAll('.diff-seg-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
  }
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

// ─── Info panel toggle ───
function toggleInfo(id) {
  const panel = document.getElementById(id);
  if (!panel) return;
  const isOpen = panel.classList.contains('open');
  // Close all panels first
  document.querySelectorAll('.info-panel.open').forEach(p => p.classList.remove('open'));
  document.querySelectorAll('.info-toggle-btn.active').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-expanded', 'false');
  });
  // Toggle the clicked one (if it was closed)
  if (!isOpen) {
    panel.classList.add('open');
    // Find the button that triggered this
    const btns = document.querySelectorAll('.info-toggle-btn');
    btns.forEach(b => {
      if (b.getAttribute('onclick')?.includes(id)) {
        b.classList.add('active');
        b.setAttribute('aria-expanded', 'true');
      }
    });
  }
}

// ─── v2.5: Session persistence ───
function restoreSession() {
  try {
    const saved = localStorage.getItem('transcript_tool_session');
    if (!saved) return;
    const data = JSON.parse(saved);
    const resultsArea = document.getElementById('resultsArea');
    resultsArea.innerHTML = data.html;
    resultsArea.classList.add('visible');
    if (data.batchReportData) batchReportData = data.batchReportData;
    document.getElementById('sessionBar').style.display = 'none';
  } catch(e) { console.warn('Session restore failed:', e); }
}

function dismissSession() {
  document.getElementById('sessionBar').style.display = 'none';
  localStorage.removeItem('transcript_tool_session');
}

(function checkSavedSession() {
  try {
    const saved = localStorage.getItem('transcript_tool_session');
    if (saved) {
      const data = JSON.parse(saved);
      const bar = document.getElementById('sessionBar');
      if (bar) {
        const d = new Date(data.timestamp);
        const timeStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        bar.querySelector('span').innerHTML = '<i data-lucide="clipboard-list" class="icon-sm"></i> ' + I18N.msg('msg_session_restore', {n: data.fileCount, time: timeStr}) + ''; if (typeof lucide !== 'undefined') lucide.createIcons({nameAttr: 'data-lucide', node: bar});
        bar.style.display = 'flex';
      }
    }
  } catch(e) {}
})();

// ─── v2.5: Re-process single file ───
async function reprocessFile(fileIndex) {
  if (isProcessing) return;
  const file = files[fileIndex];
  if (!file) return;

  // Reset and process just this one file
  const oldFiles = [...files];
  files = [file];

  // Remove old batch report entry for this file
  batchReportData = batchReportData.filter(r => r.fileName !== file.name);

  // Remove old result for this file
  const resultsArea = document.getElementById('resultsArea');
  const resultBlocks = resultsArea.querySelectorAll('.result-block');
  for (const block of resultBlocks) {
    if (block.querySelector('.result-header span')?.textContent?.includes(file.name)) {
      block.remove();
      break;
    }
  }

  await processFiles(true);
  files = oldFiles;
  renderFileList();
}

// ─── v2.5: Collapse/expand result blocks ───
function toggleResultBlock(btn) {
  const block = btn.closest('.result-block');
  if (!block) return;
  const body = block.querySelector('.result-body');
  if (!body) return;
  const collapsed = body.classList.toggle('collapsed');
  btn.innerHTML = collapsed ? '<i data-lucide="chevron-right" class="icon-sm"></i>' : '<i data-lucide="chevron-down" class="icon-sm"></i>'; if (typeof lucide !== 'undefined') lucide.createIcons({nameAttr: 'data-lucide', node: btn});
}

// ─── v2.5: XLSX QA Report export ───
function exportQAReportXlsx() {
  if (batchReportData.length === 0 || typeof XLSX === 'undefined') return;
  const ws_data = [['File', 'Language', 'Score', 'Minor Flags', 'Serious Flags', 'Total Flags', 'Flagged %', 'Summary']];
  for (const row of batchReportData) {
    ws_data.push([row.fileName, row.language, parseFloat(row.score) || 0, row.minorFlags, row.seriousFlags, row.totalFlags, parseFloat(row.flaggedPercent) || 0, row.summary || '']);
  }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // Column widths
  ws['!cols'] = [
    { wch: 30 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 50 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'QA Report');
  XLSX.writeFile(wb, 'QA_report_' + new Date().toISOString().substring(0, 10) + '.xlsx');
}
