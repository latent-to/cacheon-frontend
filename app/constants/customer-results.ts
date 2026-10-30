import type { ProviderResult } from '../lib/comparisons'

export type CustomerModelId = 'deepseek' | 'glm' | 'musespark'

export type CustomerModel = {
  id: CustomerModelId
  name: string
  /** Decode output tokens per second per user; paired with ttft from the same run. */
  speed: number
  ttft: number
  hardware: string
  stat: string
  note: string
  detail: string
  openRouterModel: string
  marketUrl: string
  mappingNote: string
  evidenceUrl: string
  resultUrl: string
  arenaResult: {
    speed: number
    ttft: number
    baselineSpeed: number
    baselineTtft: number
    observedOn: string
    status: string
    submission: string
    concurrency: number
    hardware: string
  }
}

/** Captured October 30, 2026. Evidence and measurement conditions stay with each figure. */
export const customerModels: CustomerModel[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek V4.1 Flash',
    speed: 434.06736713754543,
    ttft: 2.597567250050037,
    hardware: '2 × NVIDIA B300',
    stat: 'Internal arena replay · warm-turn mean',
    note: '*October 19, 2026 · 24 concurrent sessions. Internal replay; performance varies with workload and configuration.',
    detail:
      'DeepSeek V4.1 Flash · October 19, 2026 UTC · 2 × NVIDIA B300 per lane · 24 live sessions. Mean warm-turn per-user decode speed and mean time to first token across three candidate windows in the same audited PASS. Decode speed pools warm-turn tokens and decode time within each window. This result does not measure total fleet throughput or establish production integration.',
    openRouterModel: 'deepseek/deepseek-v4.1-flash',
    marketUrl: 'https://openrouter.ai/deepseek/deepseek-v4.1-flash#providers',
    mappingNote:
      'Original DeepSeek V4.1 Flash, retained in our previous arena; compared with deepseek/deepseek-v4.1-flash (September model), not deepseek-v4.1-flash-1017. The active 1017 PD arena has no accepted winner as of October 30. Our measured checkpoint is NVIDIA’s NVFP4 derivative; OpenRouter providers may use different precision.',
    evidenceUrl: '/benchmarks/arena-results-20261030.json',
    resultUrl:
      'https://dash.cacheon.ai/deepseek-v4.1-flash-legacy?submission=394ba05ee260a9deebf201231f5bcadbb9ad6c9918954fdcfd5999903e8537de#winners',
    arenaResult: {
      speed: 434.06736713754543,
      ttft: 2.597567250050037,
      baselineSpeed: 349.51913450316084,
      baselineTtft: 3.1017893015555558,
      observedOn: 'October 19, 2026 UTC',
      status: 'Audited PASS · previous arena',
      submission: '394ba05ee260a9deebf201231f5bcadbb9ad6c9918954fdcfd5999903e8537de',
      concurrency: 24,
      hardware: '2 × NVIDIA B300',
    },
  },
  {
    id: 'glm',
    name: 'GLM-5.3',
    speed: 297.0138688177521,
    ttft: 0.7153227505004907,
    hardware: '4 × NVIDIA B300',
    stat: 'Internal streaming benchmark · median',
    note: '*October 16, 2026 · one concurrent request. Separate from the latest arena result shown in measurement details.',
    detail:
      'GLM-5.3 · October 16, 2026 · 4 × B300 · SGLang 0.5.20 · one concurrent request. Median per-user decode speed across six 10,000-token prompts, counting reasoning and answers with o200k and excluding time to first token. All six requests completed naturally with at least 1,500 answer tokens. This retained custom streaming benchmark is separate from the concurrent arena replay below.',
    openRouterModel: 'z-ai/glm-5.3',
    marketUrl: 'https://openrouter.ai/z-ai/glm-5.3#providers',
    mappingNote:
      'Our incoai/GLM-5.3-NVFP4 checkpoint is a quantized GLM-5.3 derivative. The OpenRouter family is z-ai/glm-5.3; providers may use different precision.',
    evidenceUrl: '/benchmarks/arena-results-20261030.json',
    resultUrl:
      'https://dash.cacheon.ai/glm-5.3?submission=267785688a6ba143aa583415ff746d79709aa259058c177b63a6e8c494555f18#winners',
    arenaResult: {
      speed: 125.0439568665574,
      ttft: 2.9131185586534216,
      baselineSpeed: 110.62644018746244,
      baselineTtft: 3.0613577549403974,
      observedOn: 'October 10, 2026 UTC',
      status: 'Crowned · audit PASS',
      submission: '267785688a6ba143aa583415ff746d79709aa259058c177b63a6e8c494555f18',
      concurrency: 24,
      hardware: '4 × NVIDIA B300',
    },
  },
  {
    id: 'musespark',
    name: 'Muse Spark Open',
    speed: 199.2529406496159,
    ttft: 1.8979672124784053,
    hardware: '4 × NVIDIA B300',
    stat: 'Internal arena replay · warm-turn mean',
    note: '*October 25, 2026 · 16 concurrent sessions. Internal replay; performance varies with workload and configuration.',
    detail:
      'Muse Spark Open · October 25, 2026 UTC · 4 × NVIDIA B300 per lane · 16 live sessions. Mean warm-turn per-user decode speed and mean time to first token across three candidate windows in the same audited PASS. Decode speed pools warm-turn tokens and decode time within each window. This result does not measure total fleet throughput or establish production integration.',
    openRouterModel: 'meta/muse-spark-open',
    marketUrl: 'https://openrouter.ai/meta/muse-spark-open#providers',
    mappingNote:
      'Our Muse-Spark-Open-816B-A42B-NVFP4 checkpoint uses the open-weight Muse Spark model. Its OpenRouter family is meta/muse-spark-open; provider precision and speculative decoding can differ.',
    evidenceUrl: '/benchmarks/arena-results-20261030.json',
    resultUrl:
      'https://dash.cacheon.ai/muse-spark-open?submission=e1dae02da5eb964f549f1a279afdb4c4098e72b1d0bc9128f18136d36bde9af9#winners',
    arenaResult: {
      speed: 199.2529406496159,
      ttft: 1.8979672124784053,
      baselineSpeed: 175.50459459036702,
      baselineTtft: 1.9343356004097452,
      observedOn: 'October 25, 2026 UTC',
      status: 'Crowned · audit PASS',
      submission: 'e1dae02da5eb964f549f1a279afdb4c4098e72b1d0bc9128f18136d36bde9af9',
      concurrency: 16,
      hardware: '4 × NVIDIA B300',
    },
  },
]

/** Paired legacy DeepSeek replay, October 19: same hardware and workload. */
export const deepseekCaseStudy = { baseline: 349.51913450316084, candidate: 434.06736713754543 }

export type ProviderSnapshot = {
  observedOn: string
  scope: string
  openRouterModel: string
  providers: ProviderResult[]
}

export { providerSnapshots } from './provider-snapshots.ts'
