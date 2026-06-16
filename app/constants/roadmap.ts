export interface RoadmapPhase {
  version: string
  label: string
  status: 'complete' | 'active' | 'upcoming' | 'future'
  items: string[]
}

export const ROADMAP: RoadmapPhase[] = [
  {
    version: 'Phase 1',
    label: 'Single-Model Inference Arena',
    status: 'complete',
    items: [
      'Proved the mechanism: top miners outperforming vLLM baseline by 35%+',
      'Qwen2.5-72B-Instruct on 8xH200/B200, scored against a pinned vLLM baseline',
      'Miners submitted full Docker containers with any serving stack',
      'Correctness gate + median end-to-end speedup scoring',
      'Leader/runner-up emission split (80/20)',
    ],
  },
  {
    version: 'Phase 2',
    label: 'Optimization Pipeline',
    status: 'upcoming',
    items: [
      'Redesigned incentives mechanism',
      'Auditable code contributions (patches to vLLM) targeting specific bottlenecks',
      'Expanded optimization surface: concurrency, multi-turn, throughput under SLA',
      'Automated GPU provisioning closes the manual eval loop',
      'Continuously improving optimization baseline, compounding across contributors',
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
