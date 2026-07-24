export interface RoadmapPhase {
  version: string
  label: string
  status: 'complete' | 'active' | 'upcoming' | 'future'
  items: string[]
}

export const ROADMAP: RoadmapPhase[] = [
  {
    version: 'Phase 1',
    label: 'Single-Model Container Arena',
    status: 'complete',
    items: [
      'Cacheon proved the mechanism: miners beat a pinned vLLM baseline on the same model and hardware',
      'Qwen2.5-72B-Instruct on 8xH200/B200, scored against a pinned vLLM baseline',
      'Miners submitted full Docker containers with any serving stack',
      'Correctness gate + median end-to-end speedup scoring',
      'Leader/runner-up emission split (80/20)',
    ],
  },
  {
    version: 'Phase 2',
    label: 'Kernel Optimization Competition',
    status: 'active',
    items: [
      'Cacheon: miners submit Triton/CuteDSL kernels for typed slots (op, block, collective), swapped into a pinned sglang engine',
      'Throughput scored gated by fidelity: per-token KL vs a stock reference + real-benchmark task accuracy',
      'Commit-reveal submissions; a target crowns only after two independent qualification passes beat the incumbent',
      'Auditable kernel source instead of opaque containers',
      'Mechanism validated on real GPUs up to gpt-oss-120b',
    ],
  },
  {
    version: 'Phase 3',
    label: 'Production Inference Provider',
    status: 'future',
    items: [
      'Winning configurations deployed as live endpoints serving real traffic',
      'Agent, RAG, and multi-turn workloads with P99 latency targets',
      'PMF: teams route traffic to Cacheon for the fastest production backend',
    ],
  },
  {
    version: 'Phase 4',
    label: 'Intelligence Layer',
    status: 'future',
    items: [
      'Routing intelligence above inference providers',
      'Given a workload, determine the optimal provider, model, hardware, and serving config',
      'Optimization data compounds: each discovery narrows future search',
    ],
  },
]
