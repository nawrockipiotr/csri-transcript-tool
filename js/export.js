// ─── CSRI Transcript Analysis Tool v2.7 — Export ───

function stripTimestamps(text) {
  return text
    .replace(/^\d+\s*$/gm, '')
    .replace(/^\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}\s*$/gm, '')
    .replace(/^\d{2}:\d{2}(:\d{2})?\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripFlags(text) {
  return text
    .replace(/\[(Y|R|CS|S|NAME|ORG|LOC|ID|DATE)\]/g, '')
    .replace(/\[\/(Y|R|CS|S|NAME|ORG|LOC|ID|DATE)\]/g, '');
}

// ─── Get target language for filenames ───
function getTargetLangCode() {
  const lang = document.getElementById('targetLang')?.value || '';
  const codes = {
    Bulgarian:'BG', Croatian:'HR', Czech:'CS', Danish:'DA', Dutch:'NL', English:'EN',
    Estonian:'ET', Finnish:'FI', French:'FR', German:'DE', Greek:'EL', Hungarian:'HU',
    Irish:'GA', Italian:'IT', Latvian:'LV', Lithuanian:'LT', Maltese:'MT', Polish:'PL',
    Portuguese:'PT', Romanian:'RO', Slovak:'SK', Slovenian:'SL', Spanish:'ES', Swedish:'SV'
  };
  return codes[lang] || lang.substring(0, 2).toUpperCase();
}

// ─── Processing metadata block ───
function getProcessingMetadata() {
  const provider = currentProvider || 'unknown';
  const model = getModel ? getModel() : 'unknown';
  const version = typeof TOOL_VERSION !== 'undefined' ? TOOL_VERSION : 'unknown';
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  return `--- Processing metadata ---
Tool: Transcript Analysis Tool ${version} (CSRI, Faculty of Management, University of Warsaw)
Provider: ${provider}
Model: ${model}
Exported: ${timestamp}
Note: AI-generated output — verify before use in research.
---`;
}

// ─── Scoring legend (reusable) ───
const SCORE_LEGEND = `Quality Score guide: 1–2 largely unintelligible · 3–4 poor, frequent errors · 5–6 moderate, understandable with errors · 7–8 good, minor issues · 9–10 excellent.`;

const FLAGS_LEGEND = `Flag legend:
  ⚠ MINOR — garbled but understandable from context (ASR mishearing, informal speech)
  ❌ SERIOUS — incomprehensible, scrambled names, missing speech, or nonsensical fragments`;

const FLAGS_LEGEND_TRANSLATION = `Flag legend (from quality assessment):
  «text»  — minor issue in original transcript (garbled but understandable)
  «TEXT»  — serious issue in original transcript (incomprehensible or wrong)
  [CS: text] — code-switch: originally spoken in a different language`;

// ─── Build QA metrics header for exports ───
function getQAMetricsHeader(fileId) {
  const qualEl = document.getElementById(`qual_${fileId}`);
  if (!qualEl) return '';

  const block = qualEl.closest('.result-block');
  if (!block) return '';

  // v2.6: quality info is in tab-badge inside quality panel, not in result-header
  const qualPanel = qualEl.closest('.result-tab-panel');
  const headerEl = qualPanel ? qualPanel.querySelector('.tab-badge') : block.querySelector('.result-header .detected-lang');
  const scorePart = headerEl ? headerEl.textContent.trim() : '';

  const metricsBar = block.querySelector('.qa-metrics-bar');
  const metricsPart = metricsBar ? metricsBar.textContent.trim().replace(/\s+/g, ' ') : '';

  if (!scorePart && !metricsPart) return '';

  let header = '=== QUALITY ASSESSMENT ===\n';
  if (scorePart) header += scorePart + '\n';
  if (metricsPart) header += metricsPart + '\n';
  header += '\n' + SCORE_LEGEND + '\n';
  header += '===\n\n';
  return header;
}

// ─── Translation export ───
function exportFile(fileId, type, format) {
  const container = document.getElementById(`trans_${fileId}`);
  if (!container) return;

  // Detect active diff view
  const diffContainer = document.getElementById(`diff_${fileId}`);
  const activeView = diffContainer ? (diffContainer.dataset.diffState || 'translation') : 'translation';

  // For HTML/DOCX: if side-by-side or inline is active, export that view with styling
  if (activeView !== 'translation' && (format === 'pdf' || format === 'docx')) {
    const viewEl = activeView === 'sidebyside'
      ? diffContainer.querySelector('.diff-sidebyside')
      : diffContainer.querySelector('.diff-inline');
    if (viewEl) {
      const viewLabel = activeView === 'sidebyside' ? 'side_by_side' : 'inline_diff';
      const langCode = getTargetLangCode();
      const baseName = fileId.replace(/_/g, ' ').replace(/\s(txt|srt|docx|pdf)$/i, '');
      if (format === 'pdf') {
        exportDiffHtml(viewEl, activeView, `${baseName}_${viewLabel}_${langCode}.html`);
      } else {
        exportDiffHtml(viewEl, activeView, `${baseName}_${viewLabel}_${langCode}.html`);
      }
      return;
    }
  }

  // Default: export translation text
  const el = container.querySelector('.diff-translation') || container;

  // Get text — for TXT/DOCX/PDF, convert flag spans to text markers
  let text;
  if (format === 'srt') {
    // SRT: strip all flags, clean text only
    text = el.textContent;
  } else {
    // Convert HTML flag spans to readable text markers
    let html = el.innerHTML;
    html = html.replace(/<span class="flag-yellow"[^>]*>([\s\S]*?)<\/span>/g, '\u00ab$1\u00bb');
    html = html.replace(/<span class="flag-red"[^>]*>([\s\S]*?)<\/span>/g, '\u00ab\u200b$1\u200b\u00bb');
    html = html.replace(/<span class="flag-cs"[^>]*>([\s\S]*?)<\/span>/g, '[CS: $1]');
    html = html.replace(/<span class="flag-corrected"[^>]*>([\s\S]*?)<\/span>/g, '$1');
    html = html.replace(/<[^>]+>/g, '');
    html = html.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    text = html;
  }

  const cleanCheck = document.getElementById(`clean_${fileId}`);
  if (cleanCheck && cleanCheck.checked) {
    text = stripTimestamps(text);
  }

  // For non-SRT: prepend metadata + summary + QA metrics + legends
  if (format !== 'srt') {
    let header = getProcessingMetadata() + '\n\n';

    const inclSumm = document.getElementById(`inclsumm_${fileId}`);
    if (inclSumm && inclSumm.checked) {
      const summEl = document.getElementById(`summ_${fileId}`);
      if (summEl) {
        header += summEl.textContent + '\n\n';
      }
    }

    const qaHeader = getQAMetricsHeader(fileId);
    if (qaHeader) {
      header += qaHeader;
    }

    // Add flag legend if translation contains flag markers
    if (text.includes('«') || text.includes('[CS:')) {
      header += FLAGS_LEGEND_TRANSLATION + '\n\n---\n\n';
    } else if (header) {
      header += '---\n\n';
    }

    text = header + text;
  }

  const langCode = getTargetLangCode();
  const baseName = fileId.replace(/_/g, ' ').replace(/\s(txt|srt|docx|pdf)$/i, '');

  if (format === 'txt' || format === 'srt') {
    downloadText(text, `${baseName}_${langCode}.${format}`, 'text/plain');
  }
  if (format === 'docx') {
    exportDocx(text, `${baseName}_${langCode}.docx`);
  }

}

// ─── Quality export ───
function exportQuality(fileId, format) {
  const el = document.getElementById(`qual_${fileId}`);
  if (!el) return;

  const baseName = fileId.replace(/_/g, ' ').replace(/\s(txt|srt|docx|pdf)$/i, '');
  const metadata = getProcessingMetadata();
  const metricsHeader = getQAMetricsHeader(fileId);
  const fullLegend = metadata + '\n\n' + metricsHeader + FLAGS_LEGEND + '\n\n';

  if (format === 'html') {
    const legendHtml = `<div style="background:#f3f4f6;padding:0.75rem 1rem;border-radius:6px;margin-bottom:1rem;font-size:0.85rem;color:#374151;white-space:pre-line;">${escapeHtml(fullLegend.trim())}</div>`;
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Quality: ${baseName}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 2rem; line-height: 1.8; max-width: 800px; margin: 0 auto; color: #1a1d27; }
      .flag-yellow { background: #fef9c3; border-left: 3px solid #facc15; padding: 2px 6px; }
      .flag-red { background: #fee2e2; border-left: 3px solid #f87171; padding: 2px 6px; }
      .flag-corrected { background: #dcfce7; color: #166534; padding: 2px 6px; border-left: 3px solid #22c55e; }
      .flag-corrected::after { content: ' ✓'; font-size: 0.8em; opacity: 0.7; }
      .qa-summary-text { padding: 0.75rem 0; border-bottom: 1px solid #e5e7eb; color: #6b7085; font-size: 0.9rem; }
      .qa-body { white-space: pre-wrap; }
    </style></head><body>
    <h2>Quality Assessment: ${escapeHtml(baseName)}</h2>
    ${legendHtml}
    ${el.innerHTML}</body></html>`;
    downloadText(htmlContent, `${baseName}_quality.html`, 'text/html');
  }

  if (format === 'txt') {
    let text = fullLegend + '---\n\n';
    let bodyText = el.innerHTML;
    bodyText = bodyText.replace(/<span class="flag-yellow"[^>]*>([\s\S]*?)<\/span>/g, '[⚠ MINOR: $1]');
    bodyText = bodyText.replace(/<span class="flag-red"[^>]*>([\s\S]*?)<\/span>/g, '[❌ SERIOUS: $1]');
    bodyText = bodyText.replace(/<span class="flag-corrected"[^>]*>([\s\S]*?)<\/span>/g, '[✓ CORRECTED: $1]');
    bodyText = bodyText.replace(/<[^>]+>/g, '');
    bodyText = bodyText.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    text += bodyText;
    downloadText(text, `${baseName}_quality.txt`, 'text/plain');
  }

  if (format === 'docx') {
    exportQualityDocx(el, `${baseName}_quality.docx`, fullLegend);
  }
}

// ─── Generic export (speaker check, anonymization) ───
function exportGeneric(fileId, prefix, format) {
  const el = document.getElementById(`${prefix}_${fileId}`);
  if (!el) return;

  const baseName = fileId.replace(/_/g, ' ').replace(/\s(txt|srt|docx|pdf)$/i, '');
  const labelMap = { summ: 'summary', spkr: 'speaker_check', anon: 'anonymization', btrans: 'back_translation' };
  const label = labelMap[prefix] || prefix;
  const metadata = getProcessingMetadata();

  if (format === 'html') {
    const metaHtml = `<div style="background:#f3f4f6;padding:0.75rem 1rem;border-radius:6px;margin-bottom:1rem;font-size:0.8rem;color:#6b7085;white-space:pre-line;">${escapeHtml(metadata)}</div>`;
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${label}: ${baseName}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 2rem; line-height: 1.8; max-width: 800px; margin: 0 auto; color: #1a1d27; }
      .flag-speaker { background: #dbeafe; border-left: 3px solid #3b82f6; padding: 2px 6px; }
      .flag-pii { padding: 2px 6px; border-radius: 2px; }
      .flag-name { background: #fce7f3; border-left: 3px solid #ec4899; }
      .flag-org { background: #e0e7ff; border-left: 3px solid #6366f1; }
      .flag-loc { background: #d1fae5; border-left: 3px solid #10b981; }
      .flag-id { background: #fee2e2; border-left: 3px solid #ef4444; }
      .flag-date { background: #fef3c7; border-left: 3px solid #f59e0b; }
      .qa-body { white-space: pre-wrap; }
    </style></head><body>
    ${metaHtml}
    ${el.innerHTML}</body></html>`;
    downloadText(htmlContent, `${baseName}_${label}.html`, 'text/html');
  }

  if (format === 'txt') {
    const text = metadata + '\n\n' + el.textContent;
    downloadText(text, `${baseName}_${label}.txt`, 'text/plain');
  }

  if (format === 'docx') {
    const text = metadata + '\n\n' + el.textContent;
    exportDocx(text, `${baseName}_${label}.docx`);
  }
}

// ─── Anonymized export (supports txt, docx, html) ───
function exportAnonymized(fileId, mode, format) {
  const el = document.getElementById(`anon_${fileId}`);
  if (!el) return;

  const baseName = fileId.replace(/_/g, ' ').replace(/\s(txt|srt|docx|pdf)$/i, '');
  const metadata = getProcessingMetadata();
  const fmt = format || 'txt';

  // HTML format: styled HTML with redaction or marking applied
  if (fmt === 'html') {
    const metaHtml = `<div style="background:#f3f4f6;padding:0.75rem 1rem;border-radius:6px;margin-bottom:1rem;font-size:0.8rem;color:#6b7085;white-space:pre-line;">${escapeHtml(metadata)}</div>`;
    let bodyHtml = el.innerHTML;
    if (mode === 'redacted') {
      bodyHtml = bodyHtml.replace(/<span class="flag-pii[^"]*"[^>]*>[\s\S]*?<\/span>/g, function(match) {
        if (match.includes('flag-name')) return '<span style="background:#e5e7eb;padding:2px 6px;border-radius:2px;">[PERSON]</span>';
        if (match.includes('flag-org')) return '<span style="background:#e5e7eb;padding:2px 6px;border-radius:2px;">[ORGANIZATION]</span>';
        if (match.includes('flag-loc')) return '<span style="background:#e5e7eb;padding:2px 6px;border-radius:2px;">[LOCATION]</span>';
        if (match.includes('flag-id')) return '<span style="background:#e5e7eb;padding:2px 6px;border-radius:2px;">[ID_REMOVED]</span>';
        if (match.includes('flag-date')) return '<span style="background:#e5e7eb;padding:2px 6px;border-radius:2px;">[DATE]</span>';
        if (match.includes('flag-custom')) {
          const title = match.match(/title="([^"]+)"/);
          const label = title ? title[1] : 'REDACTED';
          return '<span style="background:#e5e7eb;padding:2px 6px;border-radius:2px;">[' + label + ']</span>';
        }
        return match;
      });
    }
    const styles = mode === 'redacted' ? '' : `
      .flag-pii { padding: 2px 6px; border-radius: 2px; }
      .flag-name { background: #fce7f3; border-left: 3px solid #ec4899; }
      .flag-org { background: #e0e7ff; border-left: 3px solid #6366f1; }
      .flag-loc { background: #d1fae5; border-left: 3px solid #10b981; }
      .flag-id { background: #fee2e2; border-left: 3px solid #ef4444; }
      .flag-date { background: #fef3c7; border-left: 3px solid #f59e0b; }
      .flag-custom { background: #e0e7ff; border-left: 3px solid #818cf8; }`;
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Anonymized (${mode}): ${baseName}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 2rem; line-height: 1.8; max-width: 800px; margin: 0 auto; color: #1a1d27; }
      .qa-body { white-space: pre-wrap; }
      ${styles}
    </style></head><body>
    ${metaHtml}
    ${bodyHtml}</body></html>`;
    downloadText(htmlContent, `${baseName}_anonymized_${mode}.html`, 'text/html');
    return;
  }

  // TXT and DOCX: convert HTML to plain text with redaction/marking
  let text = el.innerHTML;

  if (mode === 'redacted') {
    text = text.replace(/<span class="flag-pii flag-name"[^>]*>([\s\S]*?)<\/span>/g, '[PERSON]');
    text = text.replace(/<span class="flag-pii flag-org"[^>]*>([\s\S]*?)<\/span>/g, '[ORGANIZATION]');
    text = text.replace(/<span class="flag-pii flag-loc"[^>]*>([\s\S]*?)<\/span>/g, '[LOCATION]');
    text = text.replace(/<span class="flag-pii flag-id"[^>]*>([\s\S]*?)<\/span>/g, '[ID_REMOVED]');
    text = text.replace(/<span class="flag-pii flag-date"[^>]*>([\s\S]*?)<\/span>/g, '[DATE]');
    text = text.replace(/<span class="flag-pii flag-custom"[^>]*title="([^"]*)"[^>]*>[\s\S]*?<\/span>/g, '[$1]');
  } else {
    text = text.replace(/<span class="flag-pii flag-name"[^>]*>([\s\S]*?)<\/span>/g, '[NAME: $1]');
    text = text.replace(/<span class="flag-pii flag-org"[^>]*>([\s\S]*?)<\/span>/g, '[ORG: $1]');
    text = text.replace(/<span class="flag-pii flag-loc"[^>]*>([\s\S]*?)<\/span>/g, '[LOC: $1]');
    text = text.replace(/<span class="flag-pii flag-id"[^>]*>([\s\S]*?)<\/span>/g, '[ID: $1]');
    text = text.replace(/<span class="flag-pii flag-date"[^>]*>([\s\S]*?)<\/span>/g, '[DATE: $1]');
    text = text.replace(/<span class="flag-pii flag-custom"[^>]*title="([^"]*)"[^>]*>([\s\S]*?)<\/span>/g, '[$1: $2]');
  }

  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  text = metadata + '\n\n' + text;

  if (fmt === 'docx') {
    exportDocx(text, `${baseName}_anonymized_${mode}.docx`);
  } else {
    downloadText(text, `${baseName}_anonymized_${mode}.txt`, 'text/plain');
  }
}

// ─── Download helpers ───
function downloadText(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function exportDocx(text, filename) {
  const { Document, Packer, Paragraph, TextRun } = docx;

  const paragraphs = text.split('\n').map(line =>
    new Paragraph({
      children: [new TextRun({ text: line, size: 24, font: 'Calibri' })]
    })
  );

  const doc = new Document({
    sections: [{ children: paragraphs }]
  });

  const blob = await Packer.toBlob(doc);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function exportQualityDocx(el, filename, legendText) {
  const { Document, Packer, Paragraph, TextRun } = docx;
  
  const children = [];

  // Legend header
  if (legendText) {
    for (const line of legendText.trim().split('\n')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: line, size: 20, font: 'Calibri', color: '6B7085', italics: true })]
      }));
    }
    children.push(new Paragraph({ children: [new TextRun({ text: '', size: 20 })] }));
  }

  // Parse HTML for flags
  function processNode(node) {
    const runs = [];
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent;
        if (text) runs.push(new TextRun({ text, size: 22, font: 'Calibri' }));
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const text = child.textContent;
        if (child.classList.contains('flag-yellow')) {
          runs.push(new TextRun({ text, size: 22, font: 'Calibri', highlight: 'yellow' }));
        } else if (child.classList.contains('flag-red')) {
          runs.push(new TextRun({ text, size: 22, font: 'Calibri', color: 'CC0000', bold: true }));
        } else if (child.classList.contains('flag-corrected')) {
          runs.push(new TextRun({ text, size: 22, font: 'Calibri', color: '16A34A', italics: true }));
        } else {
          for (const c of child.childNodes) {
            if (c.nodeType === Node.TEXT_NODE && c.textContent) {
              runs.push(new TextRun({ text: c.textContent, size: 22, font: 'Calibri' }));
            }
          }
        }
      }
    }
    return runs;
  }

  const lineChunks = el.innerHTML.split('\n');
  for (const lineHtml of lineChunks) {
    const lineDiv = document.createElement('div');
    lineDiv.innerHTML = lineHtml;
    const runs = processNode(lineDiv);
    children.push(new Paragraph({ children: runs.length > 0 ? runs : [new TextRun({ text: '', size: 22 })] }));
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}


// ─── Export diff view as styled HTML ───
function exportDiffHtml(viewEl, viewType, filename) {
  const metadata = getProcessingMetadata();
  const metaHtml = '<div style="background:#f3f4f6;padding:0.75rem 1rem;border-radius:6px;margin-bottom:1rem;font-size:0.8rem;color:#6b7085;white-space:pre-line;">' + escapeHtml(metadata) + '</div>';

  let styles = '';
  if (viewType === 'sidebyside') {
    styles = `
      .diff-sidebyside-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #ddd; }
      .diff-orig-line, .diff-trans-line { padding: 4px 8px; border-bottom: 1px solid #eee; font-size: 0.9rem; line-height: 1.6; white-space: pre-wrap; }
      .diff-orig-line { background: #fff5f5; border-right: 1px solid #ddd; }
      .diff-trans-line { background: #f0fdf4; }
    `;
  } else {
    styles = `
      .diff-inline-pair { margin-bottom: 2px; line-height: 1.6; }
      .diff-del { background: #fecaca; text-decoration: line-through; padding: 2px 4px; border-radius: 2px; color: #991b1b; }
      .diff-ins { background: #bbf7d0; padding: 2px 4px; border-radius: 2px; color: #166534; }
    `;
  }

  const htmlContent = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + escapeHtml(filename) + '</title>'
    + '<style>body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 2rem; max-width: 900px; margin: 0 auto; color: #1a1d27; }'
    + styles + '</style></head><body>'
    + metaHtml
    + viewEl.innerHTML
    + '</body></html>';
  downloadText(htmlContent, filename, 'text/html');
}
