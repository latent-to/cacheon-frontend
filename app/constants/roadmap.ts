export interface RoadmapPhase {
  version: string
  label: string
  status: 'active' | 'upcoming' | 'future'
  items: string[]
}

export const ROADMAP: RoadmapPhase[] = [
  {
    version: 'V1',
    label: 'Single-Model Inference Arena',
    status: 'active',
    items: [
      'Qwen2.5-72B-Instruct on a 4x H200-equivalent',
      'Miners submit Docker containers with full inference servers',
      'Scored against a production vLLM tensor-parallel baseline',
      'First-mismatch correctness gate with logprob verification; no speculative decoding or quantization',
      'Any language, any framework, any optimization technique',
    ],
  },
  {
    version: 'V2',
    label: 'Expanded Optimization Surface',
    status: 'upcoming',
    items: [
      'Speculative decoding and weight quantization allowed',
      'Concurrency benchmarks: throughput under load',
      'Batch throughput scoring with latency SLA',
      'Stricter correctness (full logprob KL validation)',
    ],
  },
  {
    version: 'V3',
    label: 'Production Inference Provider',
    status: 'future',
    items: [
      'Winning servers deployed as live endpoints for real traffic',
      'Agent, RAG, and multi-turn workloads with P99 SLA targets',
      'Teams route traffic because nobody else serves this model this fast',
      'The PMF: default high-performance backend for a top OSS model',
    ],
  },
  {
    version: 'V4',
    label: 'Multi-Model Expansion',
    status: 'future',
    items: [
      'Multiple arenas: one per important open-source model',
      'OpenRouter integration for serving real traffic at scale',
      'Revenue sharing between subnet and winning miners',
    ],
  },
]
