import type { ProviderResult } from '../lib/comparisons'

export type CustomerModelId = 'deepseek' | 'glm'

/** Internal results shown on the customer page. Disclosures must stay with each figure. */
export type CustomerModel = {
  id: CustomerModelId
  name: string
  /** Decode output tokens per second per user. */
  speed: number
  hardware: string
  stat: string
  note: string
  detail: string
  marketUrl: string
}

export const customerModels: CustomerModel[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek V4.1 Flash',
    speed: 372.33505,
    hardware: '2 × NVIDIA B300',
    stat: 'Internal replay · warm-turn mean',
    note: '*Internal multi-turn replay. Performance varies with workload and configuration.',
    detail:
      'DeepSeek V4.1 Flash · October 16, 2026 · 2 × B300 per lane · 24 live sessions. Decode speed pools warm-turn tokens and decode time within each replay window, then averages three windows. This result does not measure total fleet throughput.',
    marketUrl: 'https://openrouter.ai/deepseek/deepseek-v4.1-flash#providers',
  },
  {
    id: 'glm',
    name: 'GLM-5.3',
    speed: 297.0138688177521,
    hardware: '4 × NVIDIA B300',
    stat: 'Internal streaming benchmark · median',
    note: '*Best measured configuration in our October streaming benchmark. Performance varies with workload and configuration.',
    detail:
      'GLM-5.3 · October 16, 2026 · 4 × B300 · SGLang 0.5.20 · one concurrent request. Median per-user decode speed across six 10,000-token prompts, counting reasoning and answers with o200k and excluding time to first token. All six requests completed naturally with at least 1,500 answer tokens. Median time to first token: 0.715 seconds. Custom streaming benchmark; separate from the agent replay shown for DeepSeek.',
    marketUrl: 'https://openrouter.ai/z-ai/glm-5.3#providers',
  },
]

/** Paired DeepSeek replay: baseline → candidate, same hardware and workload. */
export const deepseekCaseStudy = { baseline: 335.78065, candidate: 372.33505 }

export type ProviderSnapshot = {
  observedOn: string
  scope: string
  providers: ProviderResult[]
}

// endpoint, P50 tok/s, P50 latency s, input / cached input / output USD per million
type SnapshotRow = [string, number, number, number, number, number]

function snapshot(rows: SnapshotRow[]): ProviderSnapshot {
  return {
    observedOn: '17 Oct 2026',
    scope: 'Standard · all reasoning · P50',
    providers: rows.map(([name, throughput, ttft, input, cachedInput, output]) => ({
      id: name,
      name,
      throughput,
      ttft,
      pricing: { input, cachedInput, output },
    })),
  }
}

/**
 * OpenRouter provider tables recorded on 17 October 2026, transcribed from screenshots.
 * Shown only when the live comparison has no measured throughput for a model.
 */
export const providerSnapshots: Record<CustomerModelId, ProviderSnapshot> = {
  deepseek: snapshot([
    ['Together', 224, 0.34, 0.3, 0.006, 1.2],
    ['DigitalOcean', 182, 0.85, 0.225, 0.006, 0.9],
    ['Baseten', 174, 0.66, 0.3, 0.007, 1.2],
    ['Makora', 173, 0.44, 0.27, 0.009, 1.15],
    ['Prime Intellect', 171, 0.58, 0.3, 0.03, 1.2],
    ['CoreWeave', 159, 0.61, 0.15, 0.002, 0.65],
    ['Baseten · Fast', 158, 0.32, 0.6, 0.014, 2.4],
    ['Parasail', 148, 0.67, 0.3, 0.006, 1.2],
    ['Modal', 145, 0.51, 0.3, 0.03, 1.2],
    ['Baseten · US', 143, 0.64, 0.3, 0.007, 1.2],
    ['Ionstream', 140, 1.09, 0.27, 0.005, 1.1],
    ['Relace', 136, 0.71, 0.2, 0.008, 0.6],
  ]),
  glm: snapshot([
    ['Baseten (fp8) · US · Fast', 168, 0.61, 2.1, 0.21, 6.6],
    ['Baseten (fp8) · Fast', 160, 0.7, 2.1, 0.21, 6.6],
    ['Fireworks · Fast', 142, 1.06, 2.1, 0.39, 6.6],
    ['ModelRun [by Modular]', 114, 0.46, 2.1, 0.4, 6.6],
    ['Crusoe', 114, 1.13, 1.4, 0.13, 4.4],
    ['Modal', 110, 0.45, 1.4, 0.26, 4.4],
    ['Wafer · US', 109, 0.61, 0.079, 0.078, 4.8],
    ['Inceptron · EU', 108, 0.68, 0.55, 0.18, 2.1956],
    ['Friendli · 10% off', 104, 0.59, 1.26, 0.234, 3.96],
    ['CoreWeave', 99, 0.43, 1.2, 0.19, 4.0],
    ['Wafer', 97, 0.82, 0.17, 0.169, 4.8],
    ['Mistral', 96, 1.43, 1.4, 0.14, 4.4],
    ['Decart', 92, 0.94, 0.84, 0.19, 2.66],
    ['Prime Intellect', 91, 1.55, 1.4, 0.26, 4.4],
    ['DigitalOcean', 89, 0.76, 0.91, 0.169, 2.86],
  ]),
}
