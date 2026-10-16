import { providerSnapshots } from './openrouter-data.js';

const root = document.getElementById('cacheon-homepage');
const el = id => document.getElementById(id);
const endpoint = '/api/comparisons';
const models = {
  deepseek: {
    name: 'DeepSeek V4.1 Flash', speed: 372.33505, hardware: '2 × NVIDIA B300',
    stat: 'Internal replay · warm-turn mean',
    note: '*Internal multi-turn replay. Performance varies with workload and configuration.',
    detail: 'DeepSeek V4.1 Flash · October 16, 2026 · 2 × B300 per lane · 24 live sessions. Decode speed pools warm-turn tokens and decode time within each replay window, then averages three windows. This result does not measure total fleet throughput.',
    market: 'https://openrouter.ai/deepseek/deepseek-v4.1-flash#providers',
  },
  glm: {
    name: 'GLM-5.3', speed: 297.0138688177521, hardware: '4 × NVIDIA B300',
    stat: 'Internal streaming benchmark · median',
    note: '*Best measured configuration in our October streaming benchmark. Performance varies with workload and configuration.',
    detail: 'GLM-5.3 · October 16, 2026 · 4 × B300 · SGLang 0.5.20 · one concurrent request. Median per-user decode speed across six 10,000-token prompts, counting reasoning and answers with o200k and excluding time to first token. All six requests completed naturally with at least 1,500 answer tokens. Median time to first token: 0.715 seconds. Custom streaming benchmark; separate from the agent replay shown for DeepSeek.',
    market: 'https://openrouter.ai/z-ai/glm-5.3#providers',
  },
};
let model = 'deepseek';
let comparisons = { ...providerSnapshots };
let lastRefresh = 0;
const validSpeed = row => Number.isFinite(row.throughput) && row.throughput > 0;
const price = value => Number.isFinite(value) ? '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '—';
const prices = row => [row.pricing?.input, row.pricing?.cachedInput, row.pricing?.output].map(price);

function render() {
  const own = models[model];
  const comparison = comparisons[model];
  const rows = (comparison?.providers ?? []).filter(validSpeed).sort((a, b) => b.throughput - a.throughput || a.id.localeCompare(b.id));
  const leader = rows[0];
  const scale = Math.max(own.speed, leader?.throughput ?? 0);
  el('ch-hero-speed').textContent = own.speed.toFixed(1);
  el('ch-hero-hardware').textContent = own.hardware;
  el('ch-hero-note').textContent = own.note;
  el('ch-model-title').textContent = own.name;
  el('ch-own-stat').textContent = own.stat;
  el('ch-own-speed').textContent = own.speed.toFixed(1);
  el('ch-own-bar').style.width = (own.speed / scale * 100) + '%';
  el('ch-run-detail').textContent = own.detail;
  el('ch-market-source').href = own.market;
  el('ch-provider-name').textContent = leader ? leader.name + ' · OpenRouter P50' : 'Comparison unavailable';
  el('ch-provider-speed').textContent = leader ? leader.throughput.toFixed(1) : '—';
  el('ch-provider-bar').style.width = leader ? (leader.throughput / scale * 100) + '%' : '0%';
  el('ch-reference-title').textContent = leader ? leader.name : 'Reference API pricing';
  el('ch-reference-prices').textContent = leader ? `Input ${prices(leader)[0]} · cached ${prices(leader)[1]} · output ${prices(leader)[2]} /M` : 'See current prices on OpenRouter';
  const timestamp = comparison?.fetchedAt;
  el('ch-market-status').textContent = comparison?.status === 'snapshot'
    ? `OpenRouter · ${comparison.scope} · snapshot ${comparison.observedOn}`
    : leader && Number.isFinite(timestamp)
    ? `OpenRouter · last-30-minute P50 · ${comparison.status === 'stale' ? 'delayed data · ' : ''}fetched ${new Date(timestamp).toLocaleString('en-GB', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' })} UTC`
    : 'Current provider metrics are available on OpenRouter';
  el('ch-provider-list-title').textContent = comparison?.status === 'snapshot' ? 'Providers in this snapshot' : 'All measured OpenRouter endpoints';
  el('ch-provider-table').replaceChildren();
  for (const row of rows) {
    const tr = document.createElement('tr');
    for (const value of [row.name, row.throughput.toFixed(1), Number.isFinite(row.ttft) ? row.ttft.toFixed(2) + ' s' : '—', prices(row).join(' / ')]) {
      const td = document.createElement('td');
      td.textContent = value;
      tr.append(td);
    }
    el('ch-provider-table').append(tr);
  }
  if (!rows.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = 'No measurements are available here.';
    tr.append(td);
    el('ch-provider-table').append(tr);
  }
  root.querySelectorAll('[data-model]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.model === model)));
}

async function refresh() {
  lastRefresh = Date.now();
  try {
    const response = await fetch(endpoint, { credentials: 'omit', signal: AbortSignal.timeout(10000), cache: 'no-store' });
    if (!response.ok) throw new Error('Comparison unavailable');
    const payload = await response.json();
    if (!payload.comparisons || !Object.values(payload.comparisons).every(row => row && Array.isArray(row.providers))) throw new Error('Invalid comparison response');
    for (const id of Object.keys(models)) {
      const fresh = payload.comparisons[id];
      comparisons[id] = fresh?.providers.some(validSpeed) ? fresh : providerSnapshots[id];
    }
  } catch {
    comparisons = { ...providerSnapshots };
  }
  render();
}

root.querySelectorAll('[data-model]').forEach(button => button.addEventListener('click', () => {
  model = button.dataset.model;
  render();
}));
root.querySelector('[data-open-details]').addEventListener('click', () => {
  model = 'deepseek';
  render();
  el('ch-methodology').open = true;
});
render();
if (endpoint) {
  setInterval(() => { if (!document.hidden) refresh(); }, 300000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - lastRefresh > 300000) refresh(); });
  refresh();
}
