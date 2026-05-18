// ─── Transcript Analysis Tool v2.7 — API Layer ───

// ─── v2.5: Human-readable API error messages ───
function formatApiError(status, serverMsg, provider) {
  const providerLinks = {
    Anthropic: 'console.anthropic.com',
    OpenAI: 'platform.openai.com',
    Google: 'aistudio.google.com',
    Local: ''
  };
  const link = providerLinks[provider] || '';

  switch (status) {
    case 401:
    case 403:
      return `Invalid API key — check your ${provider} key` + (link ? ` at ${link}` : '') + '.';
    case 429:
      return `Rate limit exceeded — wait 60 seconds or reduce batch size. ${serverMsg || ''}`.trim();
    case 404:
      return `Model not found — check the model name` + (provider === 'Local' ? ' (run "ollama list" to see available models)' : '') + '.';
    case 500:
    case 502:
    case 503:
      return `${provider} server error (${status}) — try again in a few minutes. ${serverMsg || ''}`.trim();
    case 0:
      return provider === 'Local'
        ? `Cannot reach local server — is it running? Check the endpoint URL.`
        : `Network error — check your internet connection.`;
    default:
      return serverMsg || `${provider} API error ${status}`;
  }
}

// ─── Retry with exponential backoff ───
async function callAIWithRetry(apiKey, systemPrompt, userContent, maxRetries = 3, options = {}) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await callAI(apiKey, systemPrompt, userContent, options);
    } catch (err) {
      lastError = err;
      if (err.name === 'AbortError') throw err;
      
      // Don't retry on auth errors
      const msg = err.message || '';
      if (msg.includes('401') || msg.includes('403') || msg.includes('invalid')) throw err;

      // Retry on rate limit (429) or server errors (5xx)
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

// ─── Core API dispatch ───
async function callAI(apiKey, systemPrompt, userContent, options = {}) {
  if (currentProvider === 'anthropic') {
    return callAnthropic(apiKey, systemPrompt, userContent, options);
  } else if (currentProvider === 'openai') {
    return callOpenAI(apiKey, systemPrompt, userContent, options);
  } else if (currentProvider === 'google') {
    return callGoogle(apiKey, systemPrompt, userContent, options);
  } else if (currentProvider === 'local') {
    return callLocal(apiKey, systemPrompt, userContent, options);
  }
}

async function callAnthropic(apiKey, systemPrompt, userContent, options = {}) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal: abortController?.signal,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: getModel(),
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
      ...(options.temperature !== undefined && { temperature: options.temperature })
    })
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(formatApiError(resp.status, err.error?.message, 'Anthropic'));
  }

  const data = await resp.json();
  return data.content.map(c => c.text || '').join('');
}

async function callOpenAI(apiKey, systemPrompt, userContent, options = {}) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal: abortController?.signal,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: getModel(),
      max_tokens: 8192,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      ...(options.temperature !== undefined && { temperature: options.temperature })
    })
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(formatApiError(resp.status, err.error?.message, 'OpenAI'));
  }

  const data = await resp.json();
  return data.choices[0]?.message?.content || '';
}

async function callGoogle(apiKey, systemPrompt, userContent, options = {}) {
  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${getModel()}:generateContent?key=${apiKey}`, {
    method: 'POST',
    signal: abortController?.signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userContent }] }],
      generationConfig: { maxOutputTokens: 8192, ...(options.temperature !== undefined && { temperature: options.temperature }) }
    })
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(formatApiError(resp.status, err.error?.message, 'Google'));
  }

  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
}

// ─── Local OpenAI-compatible server (Ollama, LM Studio, vLLM, etc.) ───
async function callLocal(apiKey, systemPrompt, userContent, options = {}) {
  const endpoint = document.getElementById('localEndpoint')?.value?.trim() || 'http://localhost:11434/v1';
  const url = endpoint.replace(/\/+$/, '') + '/chat/completions';

  const headers = { 'Content-Type': 'application/json' };
  // API key is optional for local servers, but some (LM Studio) support it
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  let resp;
  try {
    resp = await fetch(url, {
      method: 'POST',
      signal: abortController?.signal,
      headers,
      body: JSON.stringify({
        model: getModel(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        ...(options.temperature !== undefined && { temperature: options.temperature })
      })
    });
  } catch (fetchErr) {
    if (fetchErr.name === 'AbortError') throw fetchErr;
    throw new Error(formatApiError(0, fetchErr.message, 'Local'));
  }

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(formatApiError(resp.status, err.error?.message, 'Local'));
  }

  const data = await resp.json();
  return data.choices[0]?.message?.content || '';
}

// ─── Language detection ───
async function detectLanguage(apiKey, textSample) {
  const result = await callAIWithRetry(apiKey, getLanguageDetectionPrompt(), textSample);
  const lines = result.trim().split('\n');
  const parsed = { primary: 'unknown', secondary: 'none', confidence: 'low' };
  
  for (const line of lines) {
    const l = line.trim();
    if (l.startsWith('PRIMARY:')) parsed.primary = l.replace('PRIMARY:', '').trim();
    else if (l.startsWith('SECONDARY:')) parsed.secondary = l.replace('SECONDARY:', '').trim();
    else if (l.startsWith('CONFIDENCE:')) parsed.confidence = l.replace('CONFIDENCE:', '').trim().toLowerCase();
  }
  
  return parsed;
}
