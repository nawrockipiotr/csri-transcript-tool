// ─── CSRI Transcript Analysis Tool v2.1 — Render ───

function sanitizeId(name) {
  return name.replace(/[^a-zA-Z0-9]/g, '_');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Compute QA metrics from flagged text ───
function computeQAMetrics(text) {
  const minorMatches = text.match(/\[Y\][\s\S]*?\[\/Y\]/g) || [];
  const seriousMatches = text.match(/\[R\][\s\S]*?\[\/R\]/g) || [];
  
  // Strip tags to get clean text length
  const cleanText = text.replace(/\[(Y|R|\/Y|\/R)\]/g, '');
  const totalChars = cleanText.length;
  
  // Count flagged character length
  let flaggedChars = 0;
  for (const m of [...minorMatches, ...seriousMatches]) {
    const inner = m.replace(/\[(Y|R|\/Y|\/R)\]/g, '');
    flaggedChars += inner.length;
  }
  
  const flaggedPercent = totalChars > 0 ? ((flaggedChars / totalChars) * 100).toFixed(1) : '0.0';
  
  return {
    minorCount: minorMatches.length,
    seriousCount: seriousMatches.length,
    totalFlags: minorMatches.length + seriousMatches.length,
    flaggedPercent,
    totalChars
  };
}

// ─── Render language detection info ───
function renderLanguageInfo(langData, fileName) {
  if (!langData) return '';
  let html = `<div class="lang-info">`;
  html += `<span class="lang-tag">Detected: <strong>${langData.primary}</strong></span>`;
  if (langData.secondary && langData.secondary !== 'none') {
    html += ` <span class="lang-tag secondary">+ ${langData.secondary}</span>`;
  }
  html += ` <span class="confidence-${langData.confidence}">${langData.confidence} confidence</span>`;
  html += `</div>`;
  return html;
}

// ─── Main result renderer ───
function renderResult(fileName, translation, quality, summary, langData, speakerCheck, anonymization) {
  const resultsArea = document.getElementById('resultsArea');
  const block = document.createElement('div');
  block.className = 'result-block';

  let contentHtml = '';

  // Language info bar
  if (langData) {
    contentHtml += renderLanguageInfo(langData, fileName);
  }

  // Summary
  if (summary) {
    contentHtml += `<div class="result-header">
      <span>Summary — ${fileName}</span>
    </div>
    <div class="result-content" id="summ_${sanitizeId(fileName)}" style="white-space: pre-wrap;">${escapeHtml(summary)}</div>`;
  }

  // Translation
  if (translation) {
    let transHtml = escapeHtml(translation);
    transHtml = transHtml.replace(/\[Y\]([\s\S]*?)\[\/Y\]/g, '<span class="flag-yellow">$1</span>');
    transHtml = transHtml.replace(/\[R\]([\s\S]*?)\[\/R\]/g, '<span class="flag-red">$1</span>');
    transHtml = transHtml.replace(/\[CS\]([\s\S]*?)\[\/CS\]/g, '<span class="flag-cs" title="Code-switch: originally in a different language">$1</span>');

    contentHtml += `<div class="result-header">
      <span>Translation — ${fileName}</span>
    </div>
    <div class="result-content" id="trans_${sanitizeId(fileName)}">${transHtml}</div>
    <div class="export-row">
      <button class="export-btn" onclick="exportFile('${sanitizeId(fileName)}', 'translation', 'srt')">SRT</button>
      <button class="export-btn" onclick="exportFile('${sanitizeId(fileName)}', 'translation', 'txt')">TXT</button>
      <button class="export-btn" onclick="exportFile('${sanitizeId(fileName)}', 'translation', 'docx')">DOCX</button>
      <button class="export-btn" onclick="exportFile('${sanitizeId(fileName)}', 'translation', 'pdf')">PDF</button>
      <label class="clean-transcript-check">
        <input type="checkbox" id="clean_${sanitizeId(fileName)}" /> No timestamps
      </label>
      <label class="clean-transcript-check">
        <input type="checkbox" id="inclsumm_${sanitizeId(fileName)}" checked /> Include summary
      </label>
    </div>`;
  }

  // Quality Assessment
  if (quality) {
    const formatted = formatQuality(quality);
    const metrics = computeQAMetrics(quality);
    
    contentHtml += `<div class="result-header">
      <span>Quality Assessment — ${fileName}</span>
      <span class="detected-lang">${formatted.langLine}</span>
    </div>
    <div class="qa-metrics-bar">
      <span class="metric"><span class="metric-num">${metrics.totalFlags}</span> flags total</span>
      <span class="metric minor-metric"><span class="metric-num">${metrics.minorCount}</span> minor</span>
      <span class="metric serious-metric"><span class="metric-num">${metrics.seriousCount}</span> serious</span>
      <span class="metric"><span class="metric-num">${metrics.flaggedPercent}%</span> text flagged</span>
    </div>
    <div class="qa-legend">
      <span class="legend-item"><span class="legend-swatch yellow-swatch"></span> Minor — garbled but understandable from context</span>
      <span class="legend-item"><span class="legend-swatch red-swatch"></span> Serious — incomprehensible, clearly wrong, major gap</span>
    </div>
    <div class="result-content" id="qual_${sanitizeId(fileName)}">${formatted.html}</div>
    <div class="export-row">
      <button class="export-btn" onclick="exportQuality('${sanitizeId(fileName)}', 'html')">HTML (with colors)</button>
      <button class="export-btn" onclick="exportQuality('${sanitizeId(fileName)}', 'txt')">TXT (annotated)</button>
      <button class="export-btn" onclick="exportQuality('${sanitizeId(fileName)}', 'docx')">DOCX (with colors)</button>
    </div>`;
  }

  // Speaker Check
  if (speakerCheck) {
    const formatted = formatSpeakerCheck(speakerCheck);
    contentHtml += `<div class="result-header">
      <span>Speaker Check — ${fileName}</span>
      <span class="detected-lang">${formatted.statsLine}</span>
    </div>
    <div class="result-content" id="spkr_${sanitizeId(fileName)}">${formatted.html}</div>
    <div class="export-row">
      <button class="export-btn" onclick="exportGeneric('${sanitizeId(fileName)}', 'spkr', 'txt')">TXT</button>
      <button class="export-btn" onclick="exportGeneric('${sanitizeId(fileName)}', 'spkr', 'html')">HTML</button>
    </div>`;
  }

  // Anonymization
  if (anonymization) {
    const formatted = formatAnonymization(anonymization);
    contentHtml += `<div class="result-header">
      <span>Anonymization — ${fileName}</span>
      <span class="detected-lang">${formatted.statsLine}</span>
    </div>
    <div class="result-content" id="anon_${sanitizeId(fileName)}">${formatted.html}</div>
    <div class="export-row">
      <button class="export-btn" onclick="exportAnonymized('${sanitizeId(fileName)}', 'redacted')">TXT (redacted)</button>
      <button class="export-btn" onclick="exportAnonymized('${sanitizeId(fileName)}', 'marked')">TXT (marked)</button>
      <button class="export-btn" onclick="exportGeneric('${sanitizeId(fileName)}', 'anon', 'html')">HTML</button>
    </div>`;
  }

  block.innerHTML = contentHtml;
  resultsArea.appendChild(block);
}

// ─── Format quality assessment ───
function formatQuality(text) {
  const lines = text.split('\n');
  let lang = '';
  let score = '';
  let summary = '';
  let bodyStartIdx = 0;

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].trim();
    if (line.startsWith('LANG:')) {
      lang = line.replace('LANG:', '').trim();
      bodyStartIdx = i + 1;
    } else if (line.startsWith('SCORE:')) {
      score = line.replace('SCORE:', '').trim();
      bodyStartIdx = i + 1;
    } else if (line.startsWith('SUMMARY:')) {
      summary = line.replace('SUMMARY:', '').trim();
      bodyStartIdx = i + 1;
    } else if (lang && score) {
      if (!line.startsWith('SUMMARY:')) {
        bodyStartIdx = i;
        break;
      }
    }
  }

  const body = lines.slice(bodyStartIdx).join('\n');

  let html = escapeHtml(body);
  html = html.replace(/\[Y\]([\s\S]*?)\[\/Y\]/g, '<span class="flag-yellow" title="Minor: ASR mishearing, garbled but understandable">$1</span>');
  html = html.replace(/\[R\]([\s\S]*?)\[\/R\]/g, '<span class="flag-red" title="Serious: incomprehensible, wrong, or missing content">$1</span>');
  // Legacy tags
  html = html.replace(/\[YELLOW_START\]([\s\S]*?)\[YELLOW_END\]/g, '<span class="flag-yellow">$1</span>');
  html = html.replace(/\[RED_START\]([\s\S]*?)\[RED_END\]/g, '<span class="flag-red">$1</span>');

  const summaryHtml = summary
    ? `<div class="qa-summary-text">${escapeHtml(summary)}</div>`
    : '';

  const scoreNum = parseFloat(score);
  let scoreClass = 'score-poor';
  if (scoreNum >= 7) scoreClass = 'score-good';
  else if (scoreNum >= 5) scoreClass = 'score-moderate';

  return {
    html: summaryHtml + '<div class="qa-body">' + html + '</div>',
    langLine: `${lang} · <span class="${scoreClass}" title="Scoring guide:\n1–2 = largely unintelligible\n3–4 = poor, frequent serious errors\n5–6 = moderate, understandable but with errors\n7–8 = good, minor issues only\n9–10 = excellent, near-perfect">Score: ${score}/10</span>`
  };
}

// ─── Format speaker check ───
function formatSpeakerCheck(text) {
  const lines = text.split('\n');
  let declared = '', estimated = '', coverage = '';
  let bodyStartIdx = 0;

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].trim();
    if (line.startsWith('SPEAKERS_DECLARED:')) {
      declared = line.replace('SPEAKERS_DECLARED:', '').trim();
      bodyStartIdx = i + 1;
    } else if (line.startsWith('SPEAKERS_ESTIMATED:')) {
      estimated = line.replace('SPEAKERS_ESTIMATED:', '').trim();
      bodyStartIdx = i + 1;
    } else if (line.startsWith('LABEL_COVERAGE:')) {
      coverage = line.replace('LABEL_COVERAGE:', '').trim();
      bodyStartIdx = i + 1;
    } else if (declared && estimated) {
      bodyStartIdx = i;
      break;
    }
  }

  const body = lines.slice(bodyStartIdx).join('\n');
  let html = escapeHtml(body);
  html = html.replace(/\[S\]([\s\S]*?)\[\/S\]/g, '<span class="flag-speaker" title="Speaker label issue detected">$1</span>');

  const mismatch = declared !== estimated;
  const statsLine = `Labels: ${declared} · Estimated speakers: ${estimated}${mismatch ? ' ⚠' : ''} · Coverage: ${coverage}`;

  return {
    html: '<div class="qa-body">' + html + '</div>',
    statsLine
  };
}

// ─── Format anonymization ───
function formatAnonymization(text) {
  const lines = text.split('\n');
  let piiStart = -1;
  
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim().startsWith('PII_SUMMARY:')) {
      piiStart = i;
      break;
    }
  }

  const bodyText = piiStart > 0 ? lines.slice(0, piiStart).join('\n') : text;
  const piiText = piiStart > 0 ? lines.slice(piiStart).join('\n') : '';

  let html = escapeHtml(bodyText);
  html = html.replace(/\[NAME\]([\s\S]*?)\[\/NAME\]/g, '<span class="flag-pii flag-name" title="Personal name">$1</span>');
  html = html.replace(/\[ORG\]([\s\S]*?)\[\/ORG\]/g, '<span class="flag-pii flag-org" title="Organization">$1</span>');
  html = html.replace(/\[LOC\]([\s\S]*?)\[\/LOC\]/g, '<span class="flag-pii flag-loc" title="Location">$1</span>');
  html = html.replace(/\[ID\]([\s\S]*?)\[\/ID\]/g, '<span class="flag-pii flag-id" title="Identifier">$1</span>');
  html = html.replace(/\[DATE\]([\s\S]*?)\[\/DATE\]/g, '<span class="flag-pii flag-date" title="Specific date">$1</span>');

  // Parse PII summary for stats
  let names = 0, orgs = 0, locs = 0, ids = 0, dates = 0, risk = 'LOW';
  if (piiText) {
    const nm = piiText.match(/Names found:\s*(\d+)/); if (nm) names = parseInt(nm[1]);
    const om = piiText.match(/Organizations found:\s*(\d+)/); if (om) orgs = parseInt(om[1]);
    const lm = piiText.match(/Locations found:\s*(\d+)/); if (lm) locs = parseInt(lm[1]);
    const im = piiText.match(/Identifiers found:\s*(\d+)/); if (im) ids = parseInt(im[1]);
    const dm = piiText.match(/Dates found:\s*(\d+)/); if (dm) dates = parseInt(dm[1]);
    const rm = piiText.match(/Risk level:\s*(\w+)/); if (rm) risk = rm[1];
  }

  const total = names + orgs + locs + ids + dates;
  const statsLine = `${total} PII items · Risk: ${risk}`;

  return {
    html: '<div class="qa-body">' + html + '</div>',
    statsLine
  };
}
