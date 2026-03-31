// ===== Model Definitions =====
const MODELS = [
    { id: 'gpt-4o',          name: 'GPT-4o',           provider: 'OpenAI',    encoding: 'o200k_base', inputPrice: 2.50,  outputPrice: 10.00 },
    { id: 'gpt-4o-mini',     name: 'GPT-4o Mini',      provider: 'OpenAI',    encoding: 'o200k_base', inputPrice: 0.15,  outputPrice: 0.60 },
    { id: 'gpt-4-turbo',     name: 'GPT-4 Turbo',      provider: 'OpenAI',    encoding: 'cl100k_base', inputPrice: 10.00, outputPrice: 30.00 },
    { id: 'gpt-3.5-turbo',   name: 'GPT-3.5 Turbo',    provider: 'OpenAI',    encoding: 'cl100k_base', inputPrice: 0.50,  outputPrice: 1.50 },
    { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', encoding: 'cl100k_base', ratio: 1.0, inputPrice: 3.00, outputPrice: 15.00 },
    { id: 'claude-3-opus',   name: 'Claude 3 Opus',    provider: 'Anthropic',  encoding: 'cl100k_base', ratio: 1.0, inputPrice: 15.00, outputPrice: 75.00 },
    { id: 'claude-3-haiku',  name: 'Claude 3 Haiku',   provider: 'Anthropic',  encoding: 'cl100k_base', ratio: 1.0, inputPrice: 0.25, outputPrice: 1.25 },
    { id: 'llama-3-70b',     name: 'Llama 3 70B',      provider: 'Meta',       encoding: 'cl100k_base', ratio: 1.05, inputPrice: 0.59, outputPrice: 0.79 },
    { id: 'gemini-1.5-pro',  name: 'Gemini 1.5 Pro',   provider: 'Google',     encoding: 'cl100k_base', ratio: 1.0, inputPrice: 1.25, outputPrice: 5.00 },
    { id: 'deepseek-v3',     name: 'DeepSeek V3',      provider: 'DeepSeek',   encoding: 'cl100k_base', ratio: 0.7, inputPrice: 0.27, outputPrice: 1.10 },
    { id: 'qwen-2.5-72b',    name: 'Qwen 2.5 72B',     provider: 'Alibaba',    encoding: 'cl100k_base', ratio: 0.85, inputPrice: 0.40, outputPrice: 1.20 },
    { id: 'kimi-k2',         name: 'Kimi K2',          provider: 'Moonshot',   encoding: 'cl100k_base', ratio: 0.9, inputPrice: 1.00, outputPrice: 4.00 },
];

// ===== Globals =====
let encoderCache = {};
let tiktokenReady = false;

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initEncoders();
    buildResultCards();
    buildCostCards();
    bindEvents();
});

// ===== Theme =====
function initTheme() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    document.getElementById('themeToggle').addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
        document.getElementById('themeToggle').textContent = isDark ? '🌙' : '☀️';
    });
}

// ===== Encoders =====
async function initEncoders() {
    try {
        // js-tiktoken exposes getEncoding on window after CDN load
        if (typeof window.getEncoding === 'function') {
            tiktokenReady = true;
        } else if (typeof window.tiktokenReady !== 'undefined') {
            tiktokenReady = true;
        }
    } catch (e) {
        console.warn('tiktoken not available, using estimation', e);
    }
}

function getEncoder(encodingName) {
    if (encoderCache[encodingName]) return encoderCache[encodingName];
    try {
        if (typeof window.getEncoding === 'function') {
            encoderCache[encodingName] = window.getEncoding(encodingName);
            return encoderCache[encodingName];
        }
    } catch (e) {
        console.warn(`Failed to load encoder ${encodingName}:`, e);
    }
    return null;
}

function countTokens(text, model) {
    if (!text) return 0;
    
    // Try tiktoken first
    const encoder = getEncoder(model.encoding);
    if (encoder) {
        try {
            const tokens = encoder.encode(text);
            const count = tokens.length;
            // Apply ratio for non-OpenAI models
            return Math.round(count * (model.ratio || 1.0));
        } catch (e) {
            // fall through to estimation
        }
    }
    
    // Fallback: rough estimation
    // English: ~4 chars/token, Chinese: ~1.5 chars/token
    const chineseChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
    const otherChars = text.length - chineseChars;
    const estimated = Math.ceil(chineseChars / 1.5 + otherChars / 4);
    return Math.round(estimated * (model.ratio || 1.0));
}

// ===== UI Build =====
function buildResultCards() {
    const grid = document.getElementById('resultsGrid');
    grid.innerHTML = MODELS.map(m => `
        <div class="result-card" data-model="${m.id}">
            <div class="model-name">${m.name}</div>
            <div class="token-count" id="tokens-${m.id}">0</div>
            <div class="token-label">tokens</div>
            <div class="provider-badge">${m.provider}</div>
        </div>
    `).join('');
}

function buildCostCards() {
    const grid = document.getElementById('costGrid');
    grid.innerHTML = MODELS.map(m => `
        <div class="cost-card" data-model="${m.id}">
            <div class="model-name">${m.name}</div>
            <div class="cost-value" id="cost-${m.id}">$0.0000</div>
            <div class="cost-breakdown" id="cost-detail-${m.id}">Input: $0 · Output: $0</div>
        </div>
    `).join('');
}

// ===== Event Binding =====
function bindEvents() {
    const textarea = document.getElementById('textInput');
    let debounceTimer;
    
    textarea.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => updateAll(textarea.value), 150);
    });
    
    document.getElementById('outputTokens').addEventListener('input', () => {
        updateCosts(document.getElementById('textInput').value);
    });
    
    document.getElementById('clearBtn').addEventListener('click', () => {
        textarea.value = '';
        updateAll('');
        textarea.focus();
    });
    
    document.getElementById('pasteBtn').addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            textarea.value = text;
            updateAll(text);
        } catch (e) {
            textarea.focus();
        }
    });
    
    document.getElementById('sampleBtn').addEventListener('click', () => {
        const sample = `The quick brown fox jumps over the lazy dog. This is a sample text to demonstrate token counting across different LLM tokenizers.\n\n这是一段中文示例文本，用于展示不同大语言模型的 Token 计算差异。中文字符通常会产生更多的 token。\n\nCode example:\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nMarkdown:\n- Item 1\n- Item 2\n- **Bold text** and *italic text*`;
        textarea.value = sample;
        updateAll(sample);
    });
}

// ===== Update Logic =====
function updateAll(text) {
    updateStats(text);
    updateTokens(text);
    updateCosts(text);
}

function updateStats(text) {
    document.getElementById('charCount').textContent = text.length.toLocaleString();
    document.getElementById('wordCount').textContent = text.trim() ? text.trim().split(/\s+/).length.toLocaleString() : '0';
    document.getElementById('lineCount').textContent = text ? text.split('\n').length.toLocaleString() : '0';
    document.getElementById('sentenceCount').textContent = text.trim() ? (text.match(/[.!?。！？]+/g) || []).length.toLocaleString() : '0';
}

function updateTokens(text) {
    MODELS.forEach(m => {
        const count = countTokens(text, m);
        const el = document.getElementById(`tokens-${m.id}`);
        el.textContent = count.toLocaleString();
        
        // Animate
        el.style.transform = 'scale(1.05)';
        setTimeout(() => el.style.transform = 'scale(1)', 150);
    });
}

function updateCosts(text) {
    const outputTokens = parseInt(document.getElementById('outputTokens').value) || 0;
    
    MODELS.forEach(m => {
        const inputTokens = countTokens(text, m);
        const inputCost = (inputTokens / 1_000_000) * m.inputPrice;
        const outputCost = (outputTokens / 1_000_000) * m.outputPrice;
        const totalCost = inputCost + outputCost;
        
        const costEl = document.getElementById(`cost-${m.id}`);
        const detailEl = document.getElementById(`cost-detail-${m.id}`);
        
        costEl.textContent = formatCost(totalCost);
        detailEl.textContent = `In: ${formatCost(inputCost)} · Out: ${formatCost(outputCost)}`;
        
        // Color coding
        costEl.className = 'cost-value';
        if (totalCost > 0.1) costEl.classList.add('high');
        else if (totalCost > 0.01) costEl.classList.add('medium');
    });
}

function formatCost(cost) {
    if (cost === 0) return '$0.0000';
    if (cost < 0.0001) return '<$0.0001';
    if (cost < 0.01) return '$' + cost.toFixed(4);
    if (cost < 1) return '$' + cost.toFixed(4);
    return '$' + cost.toFixed(2);
}
