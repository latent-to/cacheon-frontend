// OpenRouter provider tables recorded on 17 October 2026.
// Columns: endpoint, P50 tok/s, P50 latency seconds, input/cached/output USD per million.
const snapshot = (source, rows) => ({
  status: 'snapshot',
  observedOn: '17 Oct 2026',
  scope: 'Standard · all reasoning · P50',
  source,
  providers: rows.map(([name, throughput, ttft, input, cachedInput, output]) => ({
    id: name, name, throughput, ttft, pricing: { input, cachedInput, output },
  })),
});

export const providerSnapshots = {
  deepseek: snapshot('https://openrouter.ai/deepseek/deepseek-v4.1-flash#providers', [
    ['Together', 224, 0.34, 0.30, 0.006, 1.20],
    ['DigitalOcean', 182, 0.85, 0.225, 0.006, 0.90],
    ['Baseten', 174, 0.66, 0.30, 0.007, 1.20],
    ['Makora', 173, 0.44, 0.27, 0.009, 1.15],
    ['Prime Intellect', 171, 0.58, 0.30, 0.03, 1.20],
    ['CoreWeave', 159, 0.61, 0.15, 0.002, 0.65],
    ['Baseten · Fast', 158, 0.32, 0.60, 0.014, 2.40],
    ['Parasail', 148, 0.67, 0.30, 0.006, 1.20],
    ['Modal', 145, 0.51, 0.30, 0.03, 1.20],
    ['Baseten · US', 143, 0.64, 0.30, 0.007, 1.20],
    ['Ionstream', 140, 1.09, 0.27, 0.005, 1.10],
    ['Relace', 136, 0.71, 0.20, 0.008, 0.60],
  ]),
  glm: snapshot('https://openrouter.ai/z-ai/glm-5.3#providers', [
    ['Baseten (fp8) · US · Fast', 168, 0.61, 2.10, 0.21, 6.60],
    ['Baseten (fp8) · Fast', 160, 0.70, 2.10, 0.21, 6.60],
    ['Fireworks · Fast', 142, 1.06, 2.10, 0.39, 6.60],
    ['ModelRun [by Modular]', 114, 0.46, 2.10, 0.40, 6.60],
    ['Crusoe', 114, 1.13, 1.40, 0.13, 4.40],
    ['Modal', 110, 0.45, 1.40, 0.26, 4.40],
    ['Wafer · US', 109, 0.61, 0.079, 0.078, 4.80],
    ['Inceptron · EU', 108, 0.68, 0.55, 0.18, 2.1956],
    ['Friendli · 10% off', 104, 0.59, 1.26, 0.234, 3.96],
    ['CoreWeave', 99, 0.43, 1.20, 0.19, 4.00],
    ['Wafer', 97, 0.82, 0.17, 0.169, 4.80],
    ['Mistral', 96, 1.43, 1.40, 0.14, 4.40],
    ['Decart', 92, 0.94, 0.84, 0.19, 2.66],
    ['Prime Intellect', 91, 1.55, 1.40, 0.26, 4.40],
    ['DigitalOcean', 89, 0.76, 0.91, 0.169, 2.86],
  ]),
};
