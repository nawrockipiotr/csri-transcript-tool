// ─── CSRI Transcript Analysis Tool v2.8 — Coding Export ───
// Exports structured JSON for qualitative coding tools

// ─── Speaker turn parser ───
function parseDialogueTurns(text, isSrt) {
  const speakerPattern = /^(Speaker\s*\d+|Person\s*\d+|Interviewer|Respondent|Moderator|Badacz|Prowadzący|[A-Z][a-zA-Z]*\s*\d*)\s*[:：]\s*/m;
  const segments = [];
  
  if (isSrt) {
    return parseSrtTurns(text);
  }
  
  const lines = text.split('\n');
  let currentAuthor = null;
  let currentLines = [];
  
  for (const line of lines) {
    const match = line.match(speakerPattern);
    if (match) {
      // Save previous segment
      if (currentAuthor && currentLines.length > 0) {
        const segText = currentLines.join('\n').trim();
        if (segText) segments.push({ author: currentAuthor, text: segText, timestamp_start: null, timestamp_end: null });
      }
      currentAuthor = match[1].trim();
      const rest = line.replace(speakerPattern, '').trim();
      currentLines = rest ? [rest] : [];
    } else if (line.trim()) {
      if (currentAuthor) {
        currentLines.push(line.trim());
      } else {
        // No speaker label yet — treat as anonymous segment per paragraph
        if (line.trim()) {
          segments.push({ author: 'Unknown', text: line.trim(), timestamp_start: null, timestamp_end: null });
        }
      }
    } else if (!line.trim() && currentAuthor && currentLines.length > 0) {
      // Empty line within a turn — keep accumulating
      // (speaker turn ends only when a new speaker starts)
    }
  }
  // Save last segment
  if (currentAuthor && currentLines.length > 0) {
    const segText = currentLines.join('\n').trim();
    if (segText) segments.push({ author: currentAuthor, text: segText, timestamp_start: null, timestamp_end: null });
  }
  
  // If no speakers found, split by paragraphs
  if (segments.length === 0) {
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    for (const p of paragraphs) {
      segments.push({ author: 'Unknown', text: p, timestamp_start: null, timestamp_end: null });
    }
  }
  
  return segments;
}

function parseSrtTurns(text) {
  const blocks = text.split(/\n\s*\n/).filter(b => b.trim());
  const segments = [];
  let currentAuthor = null;
  let currentLines = [];
  let currentStart = null;
  let currentEnd = null;
  
  const timePattern = /(\d{2}:\d{2}:\d{2})[.,]\d{3}\s*-->\s*(\d{2}:\d{2}:\d{2})[.,]\d{3}/;
  const speakerPattern = /^(Speaker\s*\d+|Person\s*\d+|Interviewer|Respondent|Moderator|Badacz|Prowadzący|[A-Z][a-zA-Z]*\s*\d*)\s*[:：]\s*/;
  
  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;
    
    // Find timestamp line
    let timeMatch = null;
    let textLines = [];
    for (const line of lines) {
      const tm = line.match(timePattern);
      if (tm) {
        timeMatch = tm;
      } else if (!/^\d+$/.test(line)) {
        textLines.push(line);
      }
    }
    
    if (!timeMatch || textLines.length === 0) continue;
    
    const blockStart = timeMatch[1];
    const blockEnd = timeMatch[2];
    const fullText = textLines.join(' ');
    
    // Check for speaker label
    const spkMatch = fullText.match(speakerPattern);
    const author = spkMatch ? spkMatch[1].trim() : (currentAuthor || 'Unknown');
    const cleanText = spkMatch ? fullText.replace(speakerPattern, '').trim() : fullText;
    
    if (author === currentAuthor) {
      // Continue current turn
      currentLines.push(cleanText);
      currentEnd = blockEnd;
    } else {
      // Save previous turn
      if (currentAuthor && currentLines.length > 0) {
        segments.push({
          author: currentAuthor,
          text: currentLines.join(' ').trim(),
          timestamp_start: currentStart,
          timestamp_end: currentEnd
        });
      }
      currentAuthor = author;
      currentLines = [cleanText];
      currentStart = blockStart;
      currentEnd = blockEnd;
    }
  }
  // Save last turn
  if (currentAuthor && currentLines.length > 0) {
    segments.push({
      author: currentAuthor,
      text: currentLines.join(' ').trim(),
      timestamp_start: currentStart,
      timestamp_end: currentEnd
    });
  }
  
  return segments;
}

// ─── Map QA flags to segments ───
// ─── Detect specific QA flag type from flag text ───
function detectFlagType(flagText, severity) {
  const t = flagText.toLowerCase();
  // Inaudible / missing speech patterns (no \b — breaks on [ and Polish chars)
  if (/(inaudible|nies[lł]yszaln|nieczytelne|no speech|brak mowy|unintelligible|niezrozumia[lł])/i.test(t)) {
    return 'inaudible_fragment';
  }
  // Overlap patterns (from timestamp QA)
  if (/(overlap|nak[lł]adanie|nak[lł]ada si[eę])/i.test(t)) {
    return 'overlap';
  }
  // Speaker mismatch patterns
  if (/(speaker.*mismatch|m[oó]wca.*niezgodn|wrong speaker|z[lł]y m[oó]wca|speaker label)/i.test(t)) {
    return 'speaker_mismatch';
  }
  // Fall back to severity-based mapping
  if (severity === 'serious') return 'low_confidence';
  if (severity === 'minor') return 'minor_issue';
  if (severity === 'corrected') return 'corrected';
  return 'minor_issue';
}

function mapQaFlagsToSegments(segments, qualityHtml) {
  if (!qualityHtml) return segments.map(() => ({ qa_flags: [], qa_score: null }));
  
  // Extract flags from HTML
  const flagPattern = /<span class="flag-(yellow|red)"[^>]*>([\s\S]*?)<\/span>/g;
  const allFlags = [];
  let match;
  while ((match = flagPattern.exec(qualityHtml)) !== null) {
    allFlags.push({ severity: match[1] === 'red' ? 'serious' : 'minor', text: match[2].trim() });
  }
  
  // Also count corrected flags
  const correctedPattern = /<span class="flag-corrected"[^>]*>([\s\S]*?)<\/span>/g;
  while ((match = correctedPattern.exec(qualityHtml)) !== null) {
    allFlags.push({ severity: 'corrected', text: match[1].trim() });
  }
  
  // Map flags to segments by text proximity
  return segments.map(seg => {
    const segFlags = [];
    const segLower = seg.text.toLowerCase();
    for (const flag of allFlags) {
      // Check if flag text appears in or near this segment
      const flagWords = flag.text.toLowerCase().split(/\s+/).slice(0, 3).join(' ');
      if (segLower.includes(flagWords) || flagWords.length < 4) {
        // Detect specific flag type from text content before falling back to severity
        const ft = flag.text.toLowerCase();
        const flagType = detectFlagType(ft, flag.severity);
        segFlags.push(flagType);
      }
    }
    // Compute segment-level qa_score based on flag density
    const wordCount = seg.text.split(/\s+/).length;
    const flagCount = segFlags.filter(f => f !== 'corrected').length;
    const qaScore = wordCount > 0 ? Math.max(0, Math.round((1 - flagCount / Math.max(wordCount / 10, 1)) * 100) / 100) : null;
    
    return { qa_flags: [...new Set(segFlags)], qa_score: qaScore };
  });
}

// ─── Map glossary terms to segments ───
function mapGlossaryToSegments(segments, glossaryTerms) {
  if (!glossaryTerms || glossaryTerms.length === 0) return segments.map(() => []);
  
  return segments.map(seg => {
    const found = [];
    const lower = seg.text.toLowerCase();
    for (const term of glossaryTerms) {
      const src = (term.source || '').toLowerCase();
      if (src && lower.includes(src)) {
        found.push(term.source);
      }
    }
    return [...new Set(found)];
  });
}

// ─── Map translation to segments ───
function mapTranslationToSegments(primarySegments, translationText) {
  if (!translationText) return primarySegments.map(() => null);
  
  // Parse translation into turns using same logic
  const isSrt = false; // translation output is never SRT format
  const transSegments = parseDialogueTurns(translationText, isSrt);
  
  // If same count, 1:1 mapping
  if (transSegments.length === primarySegments.length) {
    return transSegments.map(s => s.text);
  }
  
  // If different count, try to match by sequence
  // Fall back: distribute translation text proportionally
  const transTexts = [];
  const totalPrimary = primarySegments.reduce((sum, s) => sum + s.text.length, 0);
  let transPos = 0;
  const fullTrans = translationText.replace(/^(Speaker\s*\d+|Person\s*\d+|Interviewer|Respondent|Moderator|[A-Z][a-zA-Z]*\s*\d*)\s*[:：]\s*/gm, '');
  
  for (let i = 0; i < primarySegments.length; i++) {
    const ratio = primarySegments[i].text.length / totalPrimary;
    const chunkLen = Math.round(fullTrans.length * ratio);
    const chunk = fullTrans.slice(transPos, transPos + chunkLen).trim();
    transTexts.push(chunk || null);
    transPos += chunkLen;
  }
  
  return transTexts;
}

// ─── Detect author role ───
function detectAuthorRole(author) {
  const lower = (author || '').toLowerCase();
  const moderatorPatterns = ['moderator', 'interviewer', 'badacz', 'prowadzący', 'researcher', 'facilitator'];
  for (const pat of moderatorPatterns) {
    if (lower.includes(pat)) return 'moderator';
  }
  return 'informant';
}

// ─── Show speaker role dialog ───
function showSpeakerRoleDialog(speakers, callback) {
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'coding-export-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'coding-export-modal';
  
  let html = '<h3>Assign speaker roles</h3>';
  html += '<p class="coding-export-hint">Select the role for each speaker before exporting.</p>';
  html += '<div class="coding-export-roles">';
  
  for (const spk of speakers) {
    const autoRole = detectAuthorRole(spk);
    html += `<div class="coding-role-row">
      <span class="coding-role-name">${spk}</span>
      <select class="coding-role-select" data-speaker="${spk}">
        <option value="moderator" ${autoRole === 'moderator' ? 'selected' : ''}>Moderator</option>
        <option value="informant" ${autoRole === 'informant' ? 'selected' : ''}>Informant</option>
        <option value="observer">Observer</option>
        <option value="other">Other</option>
      </select>
    </div>`;
  }
  
  html += '</div>';
  html += '<div class="coding-export-actions">';
  html += '<button class="coding-export-cancel">Cancel</button>';
  html += '<button class="coding-export-confirm">Export JSON</button>';
  html += '</div>';
  
  modal.innerHTML = html;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Events
  modal.querySelector('.coding-export-cancel').addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  modal.querySelector('.coding-export-confirm').addEventListener('click', () => {
    const roles = {};
    modal.querySelectorAll('.coding-role-select').forEach(sel => {
      roles[sel.dataset.speaker] = sel.value;
    });
    document.body.removeChild(overlay);
    callback(roles);
  });
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) document.body.removeChild(overlay);
  });
}

// ─── Detect speaker label inconsistencies ───
function detectLabelInconsistencies(speakers) {
  const warnings = [];
  const normalized = speakers.map(s => ({
    original: s,
    norm: s.toLowerCase().replace(/[^a-z0-9]/g, "")
  }));
  for (let i = 0; i < normalized.length; i++) {
    for (let j = i + 1; j < normalized.length; j++) {
      const a = normalized[i], b = normalized[j];
      // Check if labels are similar (e.g. "P1" vs "Participant 1")
      const aDigits = a.norm.replace(/[^0-9]/g, "");
      const bDigits = b.norm.replace(/[^0-9]/g, "");
      if (aDigits && aDigits === bDigits && a.norm !== b.norm) {
        warnings.push("\"" + a.original + "\" and \"" + b.original + "\" may refer to the same speaker (same number).");
      }
    }
  }
  return warnings;
}

// ─── Main export function ───
async function exportCodingJSON(fileId) {
  // Find the file data
  const data = window._fileExportData && window._fileExportData[fileId];
  if (!data) {
    alert(I18N.get('msg_no_data'));
    return;
  }
  
  const { fileName, content, translationResult, qualityResult, langData, glossaryTerms, anonymResult, mode, isSrt } = data;

  // Use anonymized text if available (prevents PII leak)
  const effectiveContent = anonymResult ? anonymResult : content;

  // Warn if mode produces sparse export
  if ('speaker' === mode || 'anonymize' === mode) {
    if (!confirm(I18N.msg('msg_sparse_mode', {mode: mode}))) return;
  }
  
  // Parse segments from original text
  const segments = parseDialogueTurns(effectiveContent, isSrt);
  
  if (segments.length === 0) {
    alert(I18N.get('msg_no_segments'));
    return;
  }
  
  // Get unique speakers
  const speakers = [...new Set(segments.map(s => s.author))];
  
  // Warn about potential speaker label inconsistencies (spec validation point 3)
  const labelWarnings = detectLabelInconsistencies(speakers);
  if (labelWarnings.length > 0) {
    const msg = "Possible speaker label inconsistencies detected:\n" + labelWarnings.join("\n") + "\n\nContinue with export?";
    if (!confirm(msg)) return;
  }

  // Show role assignment dialog (skip if single speaker — spec requirement)
  if (speakers.length <= 1) {
    const roles = {};
    speakers.forEach(s => roles[s] = detectAuthorRole(s));
    finishExport(roles);
    return;
  }
  showSpeakerRoleDialog(speakers, function(roles) {
    finishExport(roles);
  });
  return;

  function finishExport(roles) {
    // Map QA flags
    const qualityHtml = document.getElementById('qual_' + fileId)?.innerHTML || null;
    const qaData = mapQaFlagsToSegments(segments, qualityHtml);
    
    // Map glossary terms
    const glossaryPerSegment = mapGlossaryToSegments(segments, glossaryTerms);
    
    // Map translations
    const hasTranslation = ['translate', 'both'].includes(mode) && translationResult;
    const translationPerSegment = hasTranslation ? mapTranslationToSegments(segments, translationResult) : segments.map(() => null);
    
    // Detect languages
    const sourceLang = langData?.primary || null;
    const targetLang = hasTranslation ? (document.getElementById('targetLang')?.value || null) : null;
    
    // Build session ID from filename
    const sessionId = fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Check anonymization
    const hasAnon = !!anonymResult;
    
    // Build JSON
    const exportObj = {
      metadata: {
        source_tool: 'CSRI_Transcript_Analysis_Tool',
        source_tool_version: typeof TOOL_VERSION !== 'undefined' ? TOOL_VERSION : 'unknown',
        export_timestamp: new Date().toISOString(),
        session_id: sessionId,
        source_language: sourceLang,
        target_language: targetLang,
        translation_available: hasTranslation,
        total_segments: segments.length,
        total_speakers: speakers.length,
        speakers_list: speakers
      },
      segments: segments.map((seg, i) => ({
        segment_id: sessionId + '_' + String(i + 1).padStart(3, '0'),
        sequence_number: i + 1,
        author: seg.author,
        author_role: roles[seg.author] || 'informant',
        text_primary: seg.text,
        text_secondary: translationPerSegment[i] || null,
        language: sourceLang,
        timestamp_start: seg.timestamp_start || null,
        timestamp_end: seg.timestamp_end || null,
        context_metadata: {
          qa_score: qaData[i]?.qa_score ?? null,
          qa_flags: qaData[i]?.qa_flags || [],
          anonymized: hasAnon,
          glossary_terms: glossaryPerSegment[i] || []
        }
      }))
    };
    
    // Validate
    const emptySegs = exportObj.segments.filter(s => !s.text_primary || !s.text_primary.trim());
    if (emptySegs.length > 0) {
      console.warn(`${emptySegs.length} segments have empty text_primary — skipping them`);
      exportObj.segments = exportObj.segments.filter(s => s.text_primary && s.text_primary.trim());
      exportObj.metadata.total_segments = exportObj.segments.length;
    }
    
    // Download
    const dateStr = new Date().toISOString().slice(0, 10);
    const outputName = `${sessionId}_coding_export_${dateStr}.json`;
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    if (typeof FSTarget !== 'undefined') {
      FSTarget.saveFile(blob, outputName);
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = outputName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }
}
