export interface RoadmapPhase {
  version: string
  label: string
  status: 'active' | 'upcoming' | 'future'
  items: string[]
}

export const ROADMAP: RoadmapPhase[] = [
  {
    version: 'V1',
    label: 'KV Cache Optimization',
    status: 'active',
    items: [
      'Single optimization target: KV cache under a global model & hardware',
      'King-of-the-hill competition, winner-take-all emission',
      'Centralized harness with sandbox isolation',
      'PG19 prompt source, block-hash seeded',
      'PyTorch ops only — no custom CUDA/Triton',
    ],
  },
  {
    version: 'V2',
    label: 'Expanded Optimization Surface',
    status: 'upcoming',
    items: [
      'Triton kernel support with kernel-level sandboxing',
      'Hybrid KV strategies (quantization + eviction)',
      'Cache offloading to CPU/NVMe',
      'Multi-turn, long-context, and RAG workloads',
      'Multiple hardware targets',
      'Verifiable eval rollouts for decentralized auditing',
    ],
  },
  {
    version: 'V3',
    label: 'Policy Generation',
    status: 'future',
    items: [
      'Given model + hardware + workload + quality constraints',
      'Output the best inference policy for that configuration',
      'Automated policy search across the optimization space',
    ],
  },
  {
    version: 'V4',
    label: 'Deployment',
    status: 'future',
    items: [
      'One-click config generation',
      'Direct integration into vLLM, HuggingFace, TensorRT-LLM',
      'From evaluating ideas to shipping them',
    ],
  },
]
