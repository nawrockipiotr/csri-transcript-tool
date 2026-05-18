// ─── Transcript Analysis Tool v2.5 — Render ───

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

// ─── v2.4: Score breakdown explanation ───
function buildScoreBreakdown(metrics, formatted) {
  const reasons = [];
  if (metrics.seriousCount > 0) reasons.push(metrics.seriousCount + ' serious flag(s) — incomprehensible or clearly wrong content');
  if (metrics.minorCount > 0) reasons.push(metrics.minorCount + ' minor flag(s) — garbled but understandable');
  if (parseFloat(metrics.flaggedPercent) > 10) reasons.push(metrics.flaggedPercent + '% of text flagged — indicates widespread issues');
  else if (parseFloat(metrics.flaggedPercent) > 3) reasons.push(metrics.flaggedPercent + '% of text flagged — moderate issue density');
  if (reasons.length === 0) reasons.push('No significant issues detected');
  return '<div class="score-breakdown">Score rationale: ' + reasons.join('; ') + '.</div>';
}

// ─── Main result renderer ───
function renderResult(fileName, translation, quality, summary, langData, speakerCheck, anonymization, backtransResult, timestampResult) {
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

    // v2.2: Build diff view if we have original content stored
    const hasDiff = batchTranslations.some(bt => bt.fileName === fileName);
    let diffHtml = '';
    if (hasDiff) {
      const bt = batchTranslations.find(b => b.fileName === fileName);
      const diff = buildDiffView(bt.original, bt.translation, sanitizeId(fileName));
      diffHtml = `
        <div class="diff-seg-control" id="diffSeg_${sanitizeId(fileName)}">
          <button class="diff-seg-btn active" data-view="translation" onclick="setDiffView('${sanitizeId(fileName)}', 'translation')">📄 Translation</button>
          <button class="diff-seg-btn" data-view="sidebyside" onclick="setDiffView('${sanitizeId(fileName)}', 'sidebyside')">⇔ Side by side</button>
          <button class="diff-seg-btn" data-view="inline" onclick="setDiffView('${sanitizeId(fileName)}', 'inline')">±  Inline diff</button>
        </div>
        <div id="diff_${sanitizeId(fileName)}" data-diff-state="translation">
          <div class="diff-translation">${transHtml}</div>
          <div class="diff-sidebyside" style="display:none;">${diff.sideHtml}</div>
          <div class="diff-inline" style="display:none;">${diff.inlineHtml}</div>
        </div>`;
    } else {
      diffHtml = transHtml;
    }

    contentHtml += `<div class="result-header">
      <span>Translation — ${fileName}</span>
    </div>
    <div class="result-content" id="trans_${sanitizeId(fileName)}">${diffHtml}</div>
    <div class="export-row">
      <button class="export-btn" onclick="exportFile('${sanitizeId(fileName)}', 'translation', 'srt')">SRT</button>
      <button class="export-btn" onclick="exportFile('${sanitizeId(fileName)}', 'translation', 'txt')">TXT</button>
      <button class="export-btn" onclick="exportFile('${sanitizeId(fileName)}', 'translation', 'docx')">DOCX</button>
      <button class="export-btn" onclick="exportFile('${sanitizeId(fileName)}', 'translation', 'pdf')">HTML</button>
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
    
    // v2.4: Score breakdown
    const scoreBreakdown = buildScoreBreakdown(metrics, formatted);
    contentHtml += `<div class="result-header">
      <span>Quality Assessment — ${fileName}</span>
      <span class="detected-lang">${formatted.langLine}</span>
    </div>
    ${scoreBreakdown}
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
      <button class="export-btn" onclick="exportGeneric('${sanitizeId(fileName)}', 'spkr', 'docx')">DOCX</button>
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
      <button class="export-btn" onclick="exportGeneric('${sanitizeId(fileName)}', 'anon', 'docx')">DOCX</button>
      <button class="export-btn" onclick="exportGeneric('${sanitizeId(fileName)}', 'anon', 'html')">HTML</button>
    </div>`;
  }

  // v2.2: Back-translation result
  if (backtransResult) {
    const bt = formatBackTranslation(backtransResult);
    contentHtml += `<div class="result-header">
      <span>Back-Translation Validation — ${fileName}</span>
      <span class="detected-lang">${bt.scoreLine}</span>
    </div>
    <div class="result-content" id="btrans_${sanitizeId(fileName)}" style="white-space: pre-wrap;">${bt.html}</div>
    <div class="export-row">
      <button class="export-btn" onclick="exportGeneric('${sanitizeId(fileName)}', 'btrans', 'txt')">TXT</button>
      <button class="export-btn" onclick="exportGeneric('${sanitizeId(fileName)}', 'btrans', 'docx')">DOCX</button>
      <button class="export-btn" onclick="exportGeneric('${sanitizeId(fileName)}', 'btrans', 'html')">HTML</button>
    </div>`;
  }

  // v2.2: Timestamp check result
  if (timestampResult && timestampResult.issues.length > 0) {
    contentHtml += `<div class="result-header">
      <span>Timestamp Check — ${fileName}</span>
      <span class="detected-lang">${timestampResult.totalEntries} entries · ${timestampResult.issues.length} issues</span>
    </div>
    <div class="result-content" id="tstamp_${sanitizeId(fileName)}">
      <div class="qa-body">${formatTimestampIssues(timestampResult.issues)}</div>
    </div>`;
  } else if (timestampResult && timestampResult.issues.length === 0) {
    contentHtml += `<div class="result-header">
      <span>Timestamp Check — ${fileName}</span>
      <span class="detected-lang">${timestampResult.totalEntries} entries · ✓ No issues</span>
    </div>`;
  }

  // v2.5: wrap in collapsible body + add toggle button to first header
  const fileIndex = files ? files.findIndex(f => f.name === fileName) : -1;
  const rerunBtn = fileIndex >= 0 ? ' <button class="rerun-btn" onclick="reprocessFile(' + fileIndex + ')" title="Re-process this file">↻ Re-run</button>' : '';
  // Insert toggle + re-run into the first result-header
  contentHtml = contentHtml.replace(
    /(<div class="result-header">)/,
    '<div class="result-header"><span class="result-header-left"><button class="result-toggle" onclick="toggleResultBlock(this)" title="Collapse/expand">▼</button>'
  );
  // Close the header-left span after the first </span> that follows
  contentHtml = contentHtml.replace(
    /<div class="result-header"><span class="result-header-left"><button class="result-toggle"[^<]*<\/button>([\s\S]*?<\/span>)/,
    function(match, p1) {
      return '<div class="result-header"><span class="result-header-left"><button class="result-toggle" onclick="toggleResultBlock(this)" title="Collapse/expand">▼</button>' + p1 + rerunBtn + '</span>';
    }
  );

  // Find the first result-header closing tag and wrap everything after in result-body
  const firstHeaderEnd = contentHtml.indexOf('</div>', contentHtml.indexOf('result-header'));
  if (firstHeaderEnd > 0) {
    const headerPart = contentHtml.substring(0, firstHeaderEnd + 6);
    const bodyPart = contentHtml.substring(firstHeaderEnd + 6);
    contentHtml = headerPart + '<div class="result-body">' + bodyPart + '</div>';
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

// ─── v2.2: Format back-translation result ───
function formatBackTranslation(text) {
  const lines = text.split('\n');
  let score = 'N/A', divergenceCount = '0', summary = '';
  let bodyStartIdx = 0;

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].trim();
    if (line.startsWith('SCORE:')) { score = line.replace('SCORE:', '').trim(); bodyStartIdx = i + 1; }
    else if (line.startsWith('DIVERGENCE_COUNT:')) { divergenceCount = line.replace('DIVERGENCE_COUNT:', '').trim(); bodyStartIdx = i + 1; }
    else if (line.startsWith('SUMMARY:')) { summary = line.replace('SUMMARY:', '').trim(); bodyStartIdx = i + 1; }
  }

  const body = lines.slice(bodyStartIdx).join('\n');
  let html = escapeHtml(body);
  // Highlight severity markers
  html = html.replace(/SEVERITY:\s*major/g, '<span class="flag-red">SEVERITY: major</span>');
  html = html.replace(/SEVERITY:\s*minor/g, '<span class="flag-yellow">SEVERITY: minor</span>');

  const scoreNum = parseFloat(score);
  let scoreClass = 'score-poor';
  if (scoreNum >= 7) scoreClass = 'score-good';
  else if (scoreNum >= 5) scoreClass = 'score-moderate';

  const summaryHtml = summary ? `<div class="qa-summary-text">${escapeHtml(summary)}</div>` : '';

  return {
    html: summaryHtml + '<div class="qa-body">' + html + '</div>',
    scoreLine: `<span class="${scoreClass}">Fidelity: ${score}/10</span> · ${divergenceCount} divergences`
  };
}

// ─── v2.2: Format timestamp issues ───
function formatTimestampIssues(issues) {
  return issues.map(issue => {
    const sevClass = issue.severity === 'serious' ? 'flag-red' : 'flag-yellow';
    const icon = issue.severity === 'serious' ? '❌' : '⚠';
    return `<div class="timestamp-issue"><span class="${sevClass}">${icon} #${issue.index} ${issue.type}</span>: ${escapeHtml(issue.detail)}</div>`;
  }).join('');
}

// ─── v2.2: Render glossary table (editable) ───
function renderGlossaryTable(terms, fileName) {
  const resultsArea = document.getElementById('resultsArea');

  // Remove existing glossary panel if any
  const existing = document.getElementById('glossaryPanel');
  if (existing) existing.remove();

  let tableRows = terms.map((t, i) => `
    <tr>
      <td>${escapeHtml(t.source)}</td>
      <td><input type="text" class="glossary-edit" value="${escapeHtml(t.target)}" /></td>
      <td><span class="glossary-cat-badge">${escapeHtml(t.category)}</span></td>
      <td><input type="checkbox" checked aria-label="Include ${escapeHtml(t.source)}" /></td>
    </tr>`).join('');

  const panel = document.createElement('div');
  panel.id = 'glossaryPanel';
  panel.className = 'result-block glossary-panel';
  panel.innerHTML = `
    <div class="result-header">
      <span>Auto-Glossary — ${fileName}</span>
      <span class="detected-lang">${terms.length} terms extracted</span>
    </div>
    <div class="glossary-info">Review and edit translations below. Uncheck terms you don't want enforced.</div>
    <div class="glossary-mass-actions">
      <button class="glossary-mass-btn" onclick="glossarySelectAll(true)">Select all</button>
      <button class="glossary-mass-btn" onclick="glossarySelectAll(false)">Deselect all</button>
      <button class="glossary-mass-btn" onclick="glossarySortBy('category')">Sort by category</button>
    </div>
    <div class="glossary-info" id="glossaryWaitMsg" style="color: var(--accent-teal); font-weight: 600;">⏳ Waiting for your approval before translating...</div>
    <table class="glossary-table" id="glossaryTable">
      <thead><tr>
        <th class="sortable" onclick="glossarySortBy('source')">Source Term ↕</th>
        <th>Translation</th>
        <th class="sortable" onclick="glossarySortBy('category')">Category ↕</th>
        <th>Use</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
    <button class="action-btn glossary-approve-btn" id="glossaryApproveBtn" onclick="approveGlossary()">Approve Glossary & Continue</button>
  `;
  resultsArea.prepend(panel);
}

// v2.4: Glossary mass operations
function glossarySelectAll(checked) {
  const table = document.getElementById('glossaryTable');
  if (!table) return;
  table.querySelectorAll('tbody input[type="checkbox"]').forEach(cb => cb.checked = checked);
}

function glossarySortBy(field) {
  const table = document.getElementById('glossaryTable');
  if (!table) return;
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const idx = field === 'source' ? 0 : field === 'category' ? 2 : 0;
  rows.sort((a, b) => {
    const aText = a.cells[idx]?.textContent?.trim().toLowerCase() || '';
    const bText = b.cells[idx]?.textContent?.trim().toLowerCase() || '';
    return aText.localeCompare(bText);
  });
  rows.forEach(r => tbody.appendChild(r));
}

// ─── v2.2: Render consistency report ───
function renderConsistencyReport(text) {
  const resultsArea = document.getElementById('resultsArea');
  const lines = text.split('\n');
  let consistent = '', inconsistent = '';
  let bodyStartIdx = 0;

  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i].trim();
    if (line.startsWith('CONSISTENT_TERMS:')) { consistent = line.replace('CONSISTENT_TERMS:', '').trim(); bodyStartIdx = i + 1; }
    else if (line.startsWith('INCONSISTENT_TERMS:')) { inconsistent = line.replace('INCONSISTENT_TERMS:', '').trim(); bodyStartIdx = i + 1; }
  }

  const body = lines.slice(bodyStartIdx).join('\n');
  let html = escapeHtml(body);
  html = html.replace(/RECOMMENDED:\s*"([^"]+)"/g, 'RECOMMENDED: <strong>"$1"</strong>');

  const block = document.createElement('div');
  block.className = 'result-block';
  block.innerHTML = `
    <div class="result-header">
      <span>Consistency Check (batch)</span>
      <span class="detected-lang">Consistent: ${consistent} · Inconsistent: ${inconsistent}</span>
    </div>
    <div class="result-content" style="white-space: pre-wrap;"><div class="qa-body">${html}</div></div>
  `;
  resultsArea.appendChild(block);
}

// ─── v2.2: Build diff view HTML (for translation results with original) ───
function buildDiffView(original, translation, fileId) {
  // Simple line-by-line side-by-side and inline diff
  const origLines = original.split('\n').slice(0, 200); // limit for performance
  const transLines = translation.split('\n').slice(0, 200);

  // Side by side
  let sideHtml = '<div class="diff-sidebyside-grid">';
  const maxLines = Math.max(origLines.length, transLines.length);
  for (let i = 0; i < maxLines; i++) {
    const oLine = origLines[i] || '';
    const tLine = transLines[i] || '';
    sideHtml += `<div class="diff-orig-line">${escapeHtml(oLine)}</div><div class="diff-trans-line">${escapeHtml(tLine)}</div>`;
  }
  sideHtml += '</div>';

  // Inline: interleave with visual markers
  let inlineHtml = '';
  for (let i = 0; i < maxLines; i++) {
    const oLine = origLines[i] || '';
    const tLine = transLines[i] || '';
    if (oLine || tLine) {
      inlineHtml += `<div class="diff-inline-pair">`;
      if (oLine) inlineHtml += `<span class="diff-del">${escapeHtml(oLine)}</span>`;
      if (tLine) inlineHtml += `<span class="diff-ins">${escapeHtml(tLine)}</span>`;
      inlineHtml += `</div>`;
    }
  }

  return { sideHtml, inlineHtml };
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
