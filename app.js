/* ══════════════════════════════════════════════════════════════
   Kalpanā API Interface — Application Logic
   ══════════════════════════════════════════════════════════════ */

const API_BASE = 'https://madurox-kalpana-api-cpu.hf.space';

// ── State ────────────────────────────────────────────────────
let chatHistory = [];
let selectedFile = null;
let selectedKpFile = null;

// ── Initialization ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetchHealth();
  fetchModels();
  setupDragDrop();
});

// ── Panel Navigation ─────────────────────────────────────────
function switchPanel(panelId) {
  // Deactivate all panels and nav items
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Activate selected
  const panel = document.getElementById(`panel-${panelId}`);
  const navItem = document.querySelector(`.nav-item[data-panel="${panelId}"]`);
  if (panel) panel.classList.add('active');
  if (navItem) navItem.classList.add('active');

  // Close sidebar on mobile
  if (window.innerWidth <= 900) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ── Inner Tabs (for Knowledge Packs panel) ───────────────────
function switchInnerTab(group, tabId, btn) {
  // Deactivate all inner tabs in this group
  const parent = btn.closest('.inner-tabs');
  parent.querySelectorAll('.inner-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  // Find all inner-tab-content siblings
  const panel = btn.closest('.panel');
  panel.querySelectorAll('.inner-tab-content').forEach(c => c.classList.remove('active'));
  const content = document.getElementById(`${group}-${tabId}`);
  if (content) content.classList.add('active');
}

// ══════════════════════════════════════════════════════════════
//  API CALLS
// ══════════════════════════════════════════════════════════════

// ── Health Check ─────────────────────────────────────────────
async function fetchHealth() {
  updateStatus('checking', 'Checking API...');
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();

    // Update stats
    document.getElementById('statStatus').textContent = data.status === 'ok' ? '● Online' : '○ Offline';
    document.getElementById('statStatus').className = `stat-value ${data.status === 'ok' ? 'text-green' : 'text-red'}`;
    document.getElementById('statEngine').textContent = data.engine || 'RIF';
    document.getElementById('statPacks').textContent = data.active_packs ?? '0';
    document.getElementById('statVersion').textContent = data.version || '—';

    // Update health JSON
    document.getElementById('healthJson').innerHTML = syntaxHighlight(data);
    document.getElementById('healthStatus').textContent = `${res.status} OK`;
    document.getElementById('healthStatus').style.color = 'var(--green-400)';

    // Update sidebar status
    updateStatus('online', `API v${data.version} • Online`);

    showToast('success', 'Connected', 'Kalpanā API is online and healthy');
  } catch (err) {
    document.getElementById('statStatus').textContent = '● Offline';
    document.getElementById('statStatus').className = 'stat-value text-red';
    document.getElementById('healthJson').textContent = `Error: ${err.message}`;
    document.getElementById('healthStatus').textContent = 'Error';
    document.getElementById('healthStatus').style.color = 'var(--red-400)';
    updateStatus('offline', 'API Unreachable');
    showToast('error', 'Connection Failed', err.message);
  }
}

// ── Models ───────────────────────────────────────────────────
async function fetchModels() {
  try {
    const res = await fetch(`${API_BASE}/v1/models`);
    const data = await res.json();
    const models = data.data || [];

    // Update dashboard models
    const dashContainer = document.getElementById('dashboardModels');
    const modelsGrid = document.getElementById('modelsGrid');
    document.getElementById('modelCount').textContent = `${models.length} models`;

    if (models.length === 0) {
      dashContainer.innerHTML = '<div class="empty-state"><span class="empty-icon">🤖</span><p class="empty-text">No models found</p></div>';
      return;
    }

    // Dashboard compact view
    let dashHtml = '<div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Model ID</th><th>Name</th><th>Provider</th><th>Cost</th></tr></thead><tbody>';
    models.forEach(m => {
      dashHtml += `<tr>
        <td style="font-family:'JetBrains Mono',monospace;font-size:0.8rem;color:var(--cyan-400)">${m.id}</td>
        <td style="color:var(--text-primary);font-weight:500">${m.name}</td>
        <td>${m.provider}</td>
        <td style="color:var(--green-400)">${m.cost}</td>
      </tr>`;
    });
    dashHtml += '</tbody></table></div>';
    dashContainer.innerHTML = dashHtml;

    // Models panel grid cards
    let gridHtml = '';
    models.forEach(m => {
      gridHtml += `
        <div class="model-card">
          <div class="model-card-name">${m.name}</div>
          <div class="model-card-id">${m.id}</div>
          <div class="model-card-detail">
            <span class="model-detail-label">Provider</span>
            <span class="model-detail-value">${m.provider}</span>
          </div>
          <div class="model-card-detail">
            <span class="model-detail-label">Native Context</span>
            <span class="model-detail-value">${m.native_context_window || '—'}</span>
          </div>
          <div class="model-card-detail">
            <span class="model-detail-label">With RIF</span>
            <span class="model-detail-value" style="color:var(--green-400)">${m.with_kalpana_rif || 'Unlimited'}</span>
          </div>
          <div class="model-card-detail">
            <span class="model-detail-label">Extension</span>
            <span class="model-detail-value" style="color:var(--cyan-400)">${m.context_extension || '—'}</span>
          </div>
          <div class="model-card-detail">
            <span class="model-detail-label">Cost</span>
            <span class="model-detail-value" style="color:var(--green-400)">${m.cost}</span>
          </div>
        </div>`;
    });
    modelsGrid.innerHTML = gridHtml;

  } catch (err) {
    console.error('Error fetching models:', err);
  }
}

// ── Chat ─────────────────────────────────────────────────────
async function sendChat() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message) return;

  const model = document.getElementById('chatModel').value;
  const packId = document.getElementById('chatPackId').value.trim();
  const maxTokens = parseInt(document.getElementById('chatMaxTokens').value);
  const temperature = parseFloat(document.getElementById('chatTemp').value);

  // Add user message to history
  chatHistory.push({ role: 'user', content: message });
  renderChatMessages();
  input.value = '';

  // Show typing indicator
  addTypingIndicator();

  // Disable send button
  const sendBtn = document.getElementById('chatSendBtn');
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<span class="spinner"></span> Sending...';

  const body = {
    model,
    messages: chatHistory.map(m => ({ role: m.role, content: m.content })),
    max_tokens: maxTokens,
    temperature,
    bandwidth: 2048
  };

  if (packId) body.active_pack_id = packId;

  try {
    const t0 = performance.now();
    const res = await fetch(`${API_BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const t1 = performance.now();
    const data = await res.json();

    removeTypingIndicator();

    if (res.ok && data.choices && data.choices.length > 0) {
      const reply = data.choices[0].message.content;
      chatHistory.push({ role: 'assistant', content: reply });
      renderChatMessages();

      // Update response viewer
      document.getElementById('chatResponseJson').innerHTML = syntaxHighlight(data);
      document.getElementById('chatResponseStatus').textContent = `${res.status} OK • ${Math.round(t1 - t0)}ms`;
      document.getElementById('chatResponseStatus').style.color = 'var(--green-400)';

      // Update RIF metrics
      if (data.kalpana_rif) {
        document.getElementById('metricRetrievalTime').textContent = `${data.kalpana_rif.retrieval_time_ms}ms`;
        document.getElementById('metricContextTokens').textContent = data.kalpana_rif.context_tokens_sent;
        document.getElementById('metricTokenReduction').textContent = data.kalpana_rif.token_reduction;
      }
      document.getElementById('metricGenTime').textContent = `${data.generation_time_sec}s`;

      if (data.provider === 'kalpana-rif-fallback' || reply.includes('HTTP 401') || reply.includes('HF Router notice')) {
        showToast('info', 'Register Provider Key', 'HF Serverless Router requires authentication. Click "LLM Providers" tab to connect your free Groq / OpenAI key!');
      } else {
        showToast('success', 'Response Received', `Model: ${data.model} • ${data.usage?.total_tokens || 0} tokens`);
      }
    } else {
      const errMsg = data.detail || data.error || 'Unknown error';
      document.getElementById('chatResponseJson').innerHTML = syntaxHighlight(data);
      document.getElementById('chatResponseStatus').textContent = `${res.status} Error`;
      document.getElementById('chatResponseStatus').style.color = 'var(--red-400)';
      showToast('error', 'Chat Error', errMsg);
    }
  } catch (err) {
    removeTypingIndicator();
    document.getElementById('chatResponseJson').textContent = `Error: ${err.message}`;
    document.getElementById('chatResponseStatus').textContent = 'Network Error';
    document.getElementById('chatResponseStatus').style.color = 'var(--red-400)';
    showToast('error', 'Network Error', err.message);
  }

  sendBtn.disabled = false;
  sendBtn.innerHTML = '🚀 Send';
}

function renderChatMessages() {
  const container = document.getElementById('chatMessages');
  if (chatHistory.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">💬</span>
        <p class="empty-text">Start a conversation</p>
        <p class="empty-hint">Type a message below and send it to the Kalpanā API</p>
      </div>`;
    return;
  }

  let html = '';
  chatHistory.forEach(msg => {
    const isUser = msg.role === 'user';
    html += `
      <div class="chat-message ${msg.role}">
        <div class="chat-avatar">${isUser ? '👤' : '🧠'}</div>
        <div class="chat-bubble">${escapeHtml(msg.content)}</div>
      </div>`;
  });
  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
}

function addTypingIndicator() {
  const container = document.getElementById('chatMessages');
  const indicator = document.createElement('div');
  indicator.className = 'chat-message assistant';
  indicator.id = 'typingIndicator';
  indicator.innerHTML = `
    <div class="chat-avatar">🧠</div>
    <div class="chat-bubble">
      <div class="typing-indicator"><span></span><span></span><span></span></div>
    </div>`;
  container.appendChild(indicator);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) indicator.remove();
}

function clearChat() {
  chatHistory = [];
  renderChatMessages();
  document.getElementById('chatResponseJson').textContent = 'Send a message to see the API response here...';
  document.getElementById('chatResponseStatus').textContent = 'Waiting...';
  document.getElementById('chatResponseStatus').style.color = '';
  document.getElementById('metricRetrievalTime').textContent = '—';
  document.getElementById('metricContextTokens').textContent = '—';
  document.getElementById('metricTokenReduction').textContent = '—';
  document.getElementById('metricGenTime').textContent = '—';
  showToast('info', 'Chat Cleared', 'Conversation history has been reset');
}

// ── Knowledge Packs ──────────────────────────────────────────
async function compileText() {
  const text = document.getElementById('kpText').value.trim();
  const bandwidth = parseInt(document.getElementById('kpBandwidth').value) || 2048;

  if (!text) {
    showToast('error', 'Validation Error', 'Please enter some document text');
    return;
  }

  const btn = document.getElementById('compileTextBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Compiling...';

  try {
    const res = await fetch(`${API_BASE}/v1/knowledge_packs/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, bandwidth })
    });
    const data = await res.json();

    document.getElementById('compileTextResult').innerHTML = syntaxHighlight(data);
    document.getElementById('compileTextStatus').textContent = res.ok ? `${res.status} OK` : `${res.status} Error`;
    document.getElementById('compileTextStatus').style.color = res.ok ? 'var(--green-400)' : 'var(--red-400)';

    if (res.ok) {
      showToast('success', 'Pack Compiled!', `Pack ID: ${data.pack_id} • ${data.chunks_absorbed} chunks • ${data.token_count} tokens`);
    } else {
      showToast('error', 'Compilation Failed', data.detail || 'Unknown error');
    }
  } catch (err) {
    document.getElementById('compileTextResult').textContent = `Error: ${err.message}`;
    document.getElementById('compileTextStatus').textContent = 'Error';
    document.getElementById('compileTextStatus').style.color = 'var(--red-400)';
    showToast('error', 'Network Error', err.message);
  }

  btn.disabled = false;
  btn.innerHTML = '⚙️ Compile into Knowledge Pack';
}

async function compileFile() {
  if (!selectedFile) {
    showToast('error', 'No File', 'Please select a PDF or TXT file first');
    return;
  }

  const bandwidth = parseInt(document.getElementById('kpFileBandwidth').value) || 2048;
  const btn = document.getElementById('compileFileBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Compiling...';

  const formData = new FormData();
  formData.append('file', selectedFile);
  formData.append('bandwidth', bandwidth);

  try {
    const res = await fetch(`${API_BASE}/v1/knowledge_packs/compile_file`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();

    document.getElementById('compileFileResult').innerHTML = syntaxHighlight(data);
    document.getElementById('compileFileStatus').textContent = res.ok ? `${res.status} OK` : `${res.status} Error`;
    document.getElementById('compileFileStatus').style.color = res.ok ? 'var(--green-400)' : 'var(--red-400)';

    if (res.ok) {
      showToast('success', 'File Compiled!', `Pack ID: ${data.pack_id} • ${data.source_file}`);
    } else {
      showToast('error', 'File Compilation Failed', data.detail || 'Unknown error');
    }
  } catch (err) {
    document.getElementById('compileFileResult').textContent = `Error: ${err.message}`;
    document.getElementById('compileFileStatus').textContent = 'Error';
    document.getElementById('compileFileStatus').style.color = 'var(--red-400)';
    showToast('error', 'Network Error', err.message);
  }

  btn.disabled = false;
  btn.innerHTML = '📄 Compile File into .kp';
}

async function uploadKp() {
  if (!selectedKpFile) {
    showToast('error', 'No File', 'Please select a .kp file first');
    return;
  }

  const btn = document.getElementById('uploadKpBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Importing...';

  const formData = new FormData();
  formData.append('file', selectedKpFile);

  try {
    const res = await fetch(`${API_BASE}/v1/knowledge_packs/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();

    document.getElementById('uploadKpResult').innerHTML = syntaxHighlight(data);
    document.getElementById('uploadKpStatus').textContent = res.ok ? `${res.status} OK` : `${res.status} Error`;
    document.getElementById('uploadKpStatus').style.color = res.ok ? 'var(--green-400)' : 'var(--red-400)';

    if (res.ok) {
      showToast('success', '.kp Imported!', `Pack ID: ${data.pack_id} • ${data.token_count} tokens`);
    } else {
      showToast('error', 'Import Failed', data.detail || 'Unknown error');
    }
  } catch (err) {
    document.getElementById('uploadKpResult').textContent = `Error: ${err.message}`;
    document.getElementById('uploadKpStatus').textContent = 'Error';
    document.getElementById('uploadKpStatus').style.color = 'var(--red-400)';
    showToast('error', 'Network Error', err.message);
  }

  btn.disabled = false;
  btn.innerHTML = '📦 Import Knowledge Pack';
}

async function listPacks() {
  try {
    const res = await fetch(`${API_BASE}/v1/knowledge_packs`);
    const data = await res.json();
    const packs = data.packs || [];

    const container = document.getElementById('packsList');

    if (packs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📦</span>
          <p class="empty-text">No active knowledge packs</p>
          <p class="empty-hint">Compile a document or upload a .kp file to create one</p>
        </div>`;
      return;
    }

    let html = '';
    packs.forEach(p => {
      html += `
        <div class="pack-item">
          <div class="pack-item-info">
            <span class="pack-item-id">${p.pack_id}</span>
            <div class="pack-item-stats">
              <span>📊 ${p.token_count?.toLocaleString() || 0} tokens</span>
              <span>📦 ${p.chunks} chunks</span>
              <span>💾 ${p.rif_state_mb} MB</span>
            </div>
          </div>
          <div class="pack-item-actions">
            <button class="btn btn-secondary btn-sm" onclick="downloadPack('${p.pack_id}')" title="Download .kp">⬇️</button>
            <button class="btn btn-danger btn-sm" onclick="deletePack('${p.pack_id}')" title="Delete">🗑️</button>
          </div>
        </div>`;
    });
    container.innerHTML = html;

    showToast('info', 'Packs Loaded', `${packs.length} active knowledge pack(s)`);
  } catch (err) {
    showToast('error', 'Error', err.message);
  }
}

async function deletePack(packId) {
  if (!confirm(`Delete knowledge pack ${packId}?`)) return;

  try {
    const res = await fetch(`${API_BASE}/v1/knowledge_packs/${packId}`, { method: 'DELETE' });
    const data = await res.json();

    if (res.ok) {
      showToast('success', 'Pack Deleted', `${packId} has been removed`);
      listPacks();
    } else {
      showToast('error', 'Delete Failed', data.detail || 'Unknown error');
    }
  } catch (err) {
    showToast('error', 'Network Error', err.message);
  }
}

function downloadPack(packId) {
  window.open(`${API_BASE}/v1/knowledge_packs/${packId}/download`, '_blank');
}

// ── Providers ────────────────────────────────────────────────
async function registerProvider() {
  const provider = document.getElementById('regProvider').value;
  const apiKey = document.getElementById('regApiKey').value.trim();
  const model = document.getElementById('regModel').value.trim();
  const baseUrl = document.getElementById('regBaseUrl').value.trim();

  if (!apiKey) {
    showToast('error', 'Validation Error', 'API Key is required');
    return;
  }

  if (!model) {
    showToast('error', 'Validation Error', 'Model name is required');
    return;
  }

  const btn = document.getElementById('regBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Registering...';

  const body = { provider, api_key: apiKey, model };
  if (baseUrl) body.base_url = baseUrl;

  try {
    const res = await fetch(`${API_BASE}/v1/providers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    document.getElementById('regResult').innerHTML = syntaxHighlight(data);
    document.getElementById('regStatus').textContent = res.ok ? `${res.status} OK` : `${res.status} Error`;
    document.getElementById('regStatus').style.color = res.ok ? 'var(--green-400)' : 'var(--red-400)';

    if (res.ok) {
      showToast('success', 'Provider Registered!', `${provider}/${model} is now available`);
    } else {
      showToast('error', 'Registration Failed', data.detail || 'Unknown error');
    }
  } catch (err) {
    document.getElementById('regResult').textContent = `Error: ${err.message}`;
    document.getElementById('regStatus').textContent = 'Error';
    document.getElementById('regStatus').style.color = 'var(--red-400)';
    showToast('error', 'Network Error', err.message);
  }

  btn.disabled = false;
  btn.innerHTML = '🔌 Register Provider';
}

async function fetchProviders() {
  try {
    const res = await fetch(`${API_BASE}/v1/providers`);
    const data = await res.json();
    const providers = data.known_providers || {};

    const container = document.getElementById('providersList');
    let html = '';

    Object.entries(providers).forEach(([name, info]) => {
      html += `
        <div class="provider-card mb-4">
          <div class="provider-name">${name}</div>
          <div class="provider-url">${info.base_url}</div>
          <div class="provider-models">
            ${(info.example_models || []).map(m => `<span class="provider-model-tag">${m}</span>`).join('')}
          </div>
        </div>`;
    });

    container.innerHTML = html;
    showToast('info', 'Providers Loaded', `${Object.keys(providers).length} known providers`);
  } catch (err) {
    showToast('error', 'Error', err.message);
  }
}

function onProviderChange() {
  const provider = document.getElementById('regProvider').value;
  const modelInput = document.getElementById('regModel');
  const baseUrlInput = document.getElementById('regBaseUrl');

  const defaults = {
    groq: { model: 'llama-3.1-8b-instant', url: '' },
    openai: { model: 'gpt-4o-mini', url: '' },
    gemini: { model: 'gemini-1.5-flash', url: '' },
    together: { model: 'meta-llama/Llama-3-8b-chat-hf', url: '' },
    cerebras: { model: 'llama3.1-8b', url: '' },
    openrouter: { model: 'meta-llama/llama-3.1-8b-instruct:free', url: '' },
    custom: { model: '', url: '' }
  };

  const d = defaults[provider] || defaults.custom;
  modelInput.value = d.model;
  baseUrlInput.value = d.url;
}

// ── File Handling ────────────────────────────────────────────
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    selectedFile = file;
    document.getElementById('fileDropText').textContent = `📎 ${file.name} (${formatFileSize(file.size)})`;
    document.getElementById('fileDropZone').style.borderColor = 'var(--green-400)';
  }
}

function handleKpSelect(event) {
  const file = event.target.files[0];
  if (file) {
    selectedKpFile = file;
    document.getElementById('kpDropText').textContent = `📎 ${file.name} (${formatFileSize(file.size)})`;
    document.getElementById('kpDropZone').style.borderColor = 'var(--green-400)';
  }
}

function setupDragDrop() {
  setupDropZone('fileDropZone', 'kpFileInput', (file) => {
    selectedFile = file;
    document.getElementById('fileDropText').textContent = `📎 ${file.name} (${formatFileSize(file.size)})`;
  });

  setupDropZone('kpDropZone', 'kpUploadInput', (file) => {
    selectedKpFile = file;
    document.getElementById('kpDropText').textContent = `📎 ${file.name} (${formatFileSize(file.size)})`;
  });
}

function setupDropZone(zoneId, inputId, onDrop) {
  const zone = document.getElementById(zoneId);
  if (!zone) return;

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('dragover');
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
      onDrop(file);
      zone.style.borderColor = 'var(--green-400)';
    }
  });
}

// ══════════════════════════════════════════════════════════════
//  UTILITIES
// ══════════════════════════════════════════════════════════════

// ── JSON Syntax Highlighting ─────────────────────────────────
function syntaxHighlight(obj) {
  let json = JSON.stringify(obj, null, 2);
  json = escapeHtml(json);
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

// ── HTML Escape ──────────────────────────────────────────────
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ── Toast Notifications ──────────────────────────────────────
function showToast(type, title, message) {
  const container = document.getElementById('toastContainer');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.setProperty('--toast-duration', '4s');
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>`;

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 4500);
}

// ── Status Updates ───────────────────────────────────────────
function updateStatus(status, text) {
  const dot = document.getElementById('statusDot');
  const label = document.getElementById('statusText');
  dot.className = `status-dot ${status}`;
  label.textContent = text;
}

// ── Copy Helpers ─────────────────────────────────────────────
function copyResponse(elementId) {
  const el = document.getElementById(elementId);
  const text = el.textContent || el.innerText;
  navigator.clipboard.writeText(text).then(() => {
    showToast('success', 'Copied!', 'Response copied to clipboard');
  }).catch(() => {
    showToast('error', 'Copy Failed', 'Could not copy to clipboard');
  });
}

function copyCodeBlock(btn) {
  const codeBlock = btn.closest('.code-block');
  const pre = codeBlock.querySelector('.code-block-body pre');
  const text = pre.textContent || pre.innerText;
  navigator.clipboard.writeText(text).then(() => {
    const origText = btn.textContent;
    btn.textContent = '✓ Copied!';
    setTimeout(() => { btn.textContent = origText; }, 1500);
  });
}

// ── File Size Formatter ──────────────────────────────────────
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
