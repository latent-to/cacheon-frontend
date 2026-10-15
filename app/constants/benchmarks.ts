export type ProviderResult = {
  name: string
  throughput: number
  ttft: number
  inputPrice: number
  outputPrice: number
}

export type ModelBenchmark = {
  id: string
  name: string
  source: string
  cacheon: {
    throughput: number
    ttft: number | null
    label: string
    methodology: string
    evidence?: string
  }
  providers: ProviderResult[]
}

// Dated editorial snapshot, not a live feed. Values are the displayed P50 metrics
// from each linked OpenRouter model page, captured on 2026-10-15.
// Include the top three throughput endpoints in Standard routing and the fastest
// TTFT endpoint when distinct. Keep each endpoint's metrics together.
export const snapshotDate = 'October 15, 2026'
export const modelBenchmarks: ModelBenchmark[] = [
  {
    id: 'qwen',
    name: 'Qwen3.6 35B A3B',
    source: 'https://openrouter.ai/qwen/qwen3.6-35b-a3b',
    cacheon: {
      throughput: 528.928151916859,
      ttft: 0.19634094050002204,
      label: 'Tuned Qwen checkpoint · six-prompt median',
      methodology:
        'Measured October 7, 2026 on one H100 80 GB. Tuned albedo-qwen3.6-35b-king-CXXV checkpoint; six 10,000-token prompts, one request at a time, thinking enabled, MTP. Throughput counts reasoning and answer text with o200k tokens and excludes TTFT. TTFT is the median of all six streams, including the first. This checkpoint, tokenizer, caching, and workload differ from OpenRouter traffic.',
      evidence: '/benchmarks/qwen-h100-20261007.json',
    },
    providers: [
      { name: 'CoreWeave', throughput: 130, ttft: 0.44, inputPrice: 0.25, outputPrice: 1.25 },
      { name: 'DekaLLM', throughput: 129, ttft: 0.73, inputPrice: 0.1, outputPrice: 1 },
      { name: 'Venice', throughput: 127, ttft: 0.69, inputPrice: 0.1, outputPrice: 1 },
    ],
  },
  {
    id: 'glm',
    name: 'GLM-5.3',
    source: 'https://openrouter.ai/z-ai/glm-5.3',
    cacheon: {
      throughput: 125,
      ttft: null,
      label: 'Internally reported · protocol pending',
      methodology:
        '125 tok/s/user is the internally reported Cacheon result. Test conditions and time to first token have not yet been published. A matched provider comparison is still needed to establish relative performance.',
    },
    providers: [
      {
        name: 'Baseten FP8 Fast · endpoint 1',
        throughput: 144,
        ttft: 1.1,
        inputPrice: 2.1,
        outputPrice: 6.6,
      },
      {
        name: 'Baseten FP8 Fast · endpoint 2',
        throughput: 131,
        ttft: 1.01,
        inputPrice: 2.1,
        outputPrice: 6.6,
      },
      { name: 'Fireworks Fast', throughput: 124, ttft: 1.14, inputPrice: 2.1, outputPrice: 6.6 },
      {
        name: 'ModelRun by Modular',
        throughput: 108,
        ttft: 0.29,
        inputPrice: 2.1,
        outputPrice: 6.6,
      },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek V4.1 Flash',
    source: 'https://openrouter.ai/deepseek/deepseek-v4.1-flash',
    cacheon: {
      throughput: 232,
      ttft: null,
      label: 'Internally reported · protocol pending',
      methodology:
        '232 tok/s/user is the internally reported Cacheon result. Test conditions and time to first token have not yet been published. A matched provider comparison is still needed to establish relative performance.',
    },
    providers: [
      { name: 'Baseten FP32 Fast', throughput: 320, ttft: 0.48, inputPrice: 0.6, outputPrice: 2.4 },
      { name: 'Together', throughput: 226, ttft: 0.32, inputPrice: 0.3, outputPrice: 1.2 },
      { name: 'DigitalOcean', throughput: 194, ttft: 0.82, inputPrice: 0.225, outputPrice: 0.9 },
    ],
  },
]
