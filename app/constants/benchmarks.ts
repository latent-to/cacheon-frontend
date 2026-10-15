export type ModelBenchmark = {
  id: string
  name: string
  openRouterModel: string
  source: string
  hardware: { gpu: string; count: number; marketId: 'b300' | 'h100'; source: string }
  cacheon: {
    throughput: number
    ttft: number | null
    label: string
    methodology: string
    evidence?: string
    resultSource?: string
  }
}

export const modelBenchmarks: ModelBenchmark[] = [
  {
    id: 'glm',
    name: 'GLM-5.3',
    openRouterModel: 'z-ai/glm-5.3',
    source: 'https://openrouter.ai/z-ai/glm-5.3',
    hardware: {
      gpu: 'NVIDIA B300',
      count: 4,
      marketId: 'b300',
      source: '/docs/results/prefix-cache',
    },
    cacheon: {
      throughput: 125.0439568665574,
      ttft: 2.9131185586534216,
      label: 'AIPerf benchmark',
      methodology:
        'AIPerf arena replay result retained October 10, 2026: 125.04 tok/s/user and 2.913 s mean TTFT from the same winning submission. Concurrent, multi-turn workload; these means differ from OpenRouter P50 traffic measurements. A matched provider comparison is still needed to establish relative performance.',
      evidence: '/benchmarks/glm-arena-20261015.json',
      resultSource:
        'https://dash.cacheon.ai/glm-5.3?submission=267785688a6ba143aa583415ff746d79709aa259058c177b63a6e8c494555f18',
    },
  },
  {
    id: 'deepseek',
    name: 'DeepSeek V4.1 Flash',
    openRouterModel: 'deepseek/deepseek-v4.1-flash',
    source: 'https://openrouter.ai/deepseek/deepseek-v4.1-flash',
    hardware: {
      gpu: 'NVIDIA B300',
      count: 2,
      marketId: 'b300',
      source: '/docs/results/deepseek-v41-flash-b300',
    },
    cacheon: {
      throughput: 338.6842184583297,
      ttft: 3.576266984644592,
      label: 'AIPerf · newer baseline',
      methodology:
        'AIPerf arena replay on the newer baseline: 338.68 tok/s/user and 3.576 s mean TTFT from the baseline arm of the same run. These are baseline measurements; the candidate did not meet the speed threshold. Concurrent, multi-turn workload; these means differ from OpenRouter P50 traffic measurements. A matched provider comparison is still needed to establish relative performance.',
      evidence: '/benchmarks/deepseek-arena-20261015.json',
      resultSource:
        'https://dash.cacheon.ai/deepseek-v4.1-flash?submission=840a00d2a3400ad69102b343f43d114f213a9dbd31c258cf0fcf03b58c779719',
    },
  },
  {
    id: 'qwen',
    name: 'Qwen3.6 35B A3B',
    openRouterModel: 'qwen/qwen3.6-35b-a3b',
    source: 'https://openrouter.ai/qwen/qwen3.6-35b-a3b',
    hardware: {
      gpu: 'NVIDIA H100 80 GB',
      count: 1,
      marketId: 'h100',
      source: '/benchmarks/qwen-h100-20261007.json',
    },
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
