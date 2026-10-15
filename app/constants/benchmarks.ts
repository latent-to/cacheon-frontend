export type ModelBenchmark = {
  id: string
  name: string
  openRouterModel: string
  source: string
  cacheon: {
    throughput: number
    ttft: number | null
    label: string
    methodology: string
    evidence?: string
  }
}

export const modelBenchmarks: ModelBenchmark[] = [
  {
    id: 'glm',
    name: 'GLM-5.3',
    openRouterModel: 'z-ai/glm-5.3',
    source: 'https://openrouter.ai/z-ai/glm-5.3',
    cacheon: {
      throughput: 125,
      ttft: null,
      label: 'AIPerf benchmark',
      methodology:
        '125 tok/s/user measured with AIPerf. Time to first token has not yet been published. A matched provider comparison is still needed to establish relative performance.',
    },
  },
  {
    id: 'deepseek',
    name: 'DeepSeek V4.1 Flash',
    openRouterModel: 'deepseek/deepseek-v4.1-flash',
    source: 'https://openrouter.ai/deepseek/deepseek-v4.1-flash',
    cacheon: {
      throughput: 232,
      ttft: null,
      label: 'AIPerf benchmark',
      methodology:
        '232 tok/s/user measured with AIPerf. Time to first token has not yet been published. A matched provider comparison is still needed to establish relative performance.',
    },
  },
  {
    id: 'qwen',
    name: 'Qwen3.6 35B A3B',
    openRouterModel: 'qwen/qwen3.6-35b-a3b',
    source: 'https://openrouter.ai/qwen/qwen3.6-35b-a3b',
    cacheon: {
      throughput: 528.928151916859,
      ttft: 0.19634094050002204,
      label: 'Tuned Qwen checkpoint · six-prompt median',
      methodology:
        'Measured October 7, 2026 on one H100 80 GB. Tuned albedo-qwen3.6-35b-king-CXXV checkpoint; six 10,000-token prompts, one request at a time, thinking enabled, MTP. Throughput counts reasoning and answer text with o200k tokens and excludes TTFT. TTFT is the median of all six streams, including the first. This checkpoint, tokenizer, caching, and workload differ from OpenRouter traffic.',
      evidence: '/benchmarks/qwen-h100-20261007.json',
    },
  },
]
