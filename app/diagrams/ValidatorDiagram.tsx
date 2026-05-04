/**
 * Validator flow: chain -> CPU (validator) -> GPU (Docker eval) -> results back.
 * Reflects the new containerized architecture.
 */
export default function ValidatorDiagram() {
  const flow = 'var(--diagram-flow)'
  const arrowFill = 'var(--diagram-flow)'

  return (
    <svg
      viewBox="0 0 1000 260"
      fill="none"
      role="img"
      aria-label="Architecture: Bittensor chain connects to a CPU validator server, which talks over SSH to a GPU pod that runs Docker containers for evaluation; results return to the CPU server."
      style={{
        width: '100%',
        maxWidth: 'min(100%, 56rem)',
        minHeight: 'clamp(200px, 28vw, 280px)',
        height: 'auto',
      }}
    >
      {/* Bittensor chain */}
      <rect
        x="24"
        y="72"
        width="168"
        height="88"
        rx="10"
        stroke="var(--border)"
        strokeWidth="2"
        fill="var(--surface)"
      />
      <text
        x="108"
        y="112"
        textAnchor="middle"
        fill="var(--text)"
        fontSize="15"
        fontWeight="600"
        fontFamily="var(--mono)"
      >
        Bittensor
      </text>
      <text
        x="108"
        y="136"
        textAnchor="middle"
        fill="var(--text-secondary)"
        fontSize="13"
        fontFamily="var(--mono)"
      >
        chain
      </text>

      {/* Arrow chain -> CPU */}
      <line
        x1="192"
        y1="116"
        x2="248"
        y2="116"
        stroke={flow}
        strokeWidth="2"
        markerEnd="url(#vd-arrow)"
        opacity="0.85"
      />

      {/* CPU Server */}
      <rect
        x="248"
        y="32"
        width="288"
        height="196"
        rx="10"
        stroke="var(--border)"
        strokeWidth="2"
        fill="var(--surface)"
      />
      <text
        x="392"
        y="68"
        textAnchor="middle"
        fill="var(--text)"
        fontSize="17"
        fontWeight="600"
        fontFamily="var(--mono)"
      >
        CPU server
      </text>
      <text
        x="392"
        y="98"
        textAnchor="middle"
        fill="var(--text-secondary)"
        fontSize="12.5"
        fontFamily="var(--mono)"
      >
        reads on-chain commitments
      </text>
      <text
        x="392"
        y="122"
        textAnchor="middle"
        fill="var(--text-secondary)"
        fontSize="12.5"
        fontFamily="var(--mono)"
      >
        dispatches eval jobs
      </text>
      <text
        x="392"
        y="146"
        textAnchor="middle"
        fill="var(--text-secondary)"
        fontSize="12.5"
        fontFamily="var(--mono)"
      >
        assigns network rewards
      </text>
      <text
        x="392"
        y="170"
        textAnchor="middle"
        fill="var(--text-secondary)"
        fontSize="12.5"
        fontFamily="var(--mono)"
      >
        holds wallet keys
      </text>

      {/* Arrow CPU -> GPU */}
      <line
        x1="536"
        y1="116"
        x2="592"
        y2="116"
        stroke={flow}
        strokeWidth="2"
        markerEnd="url(#vd-arrow)"
        opacity="0.85"
      />
      <text
        x="564"
        y="104"
        textAnchor="middle"
        fill="var(--text-secondary)"
        fontSize="12"
        fontFamily="var(--mono)"
      >
        SSH
      </text>

      {/* GPU Pod */}
      <rect
        x="592"
        y="32"
        width="288"
        height="196"
        rx="10"
        stroke="var(--border)"
        strokeWidth="2"
        fill="var(--surface)"
      />
      <text
        x="736"
        y="68"
        textAnchor="middle"
        fill="var(--text)"
        fontSize="17"
        fontWeight="600"
        fontFamily="var(--mono)"
      >
        GPU pod (4x H200)
      </text>
      <text
        x="736"
        y="98"
        textAnchor="middle"
        fill="var(--text-secondary)"
        fontSize="12.5"
        fontFamily="var(--mono)"
      >
        vLLM baseline (always-on)
      </text>
      <text
        x="736"
        y="122"
        textAnchor="middle"
        fill="var(--text-secondary)"
        fontSize="12.5"
        fontFamily="var(--mono)"
      >
        pulls miner Docker images
      </text>
      <text
        x="736"
        y="146"
        textAnchor="middle"
        fill="var(--text-secondary)"
        fontSize="12.5"
        fontFamily="var(--mono)"
      >
        {'measures TTFT & throughput'}
      </text>
      <text
        x="736"
        y="170"
        textAnchor="middle"
        fill="var(--text-secondary)"
        fontSize="12.5"
        fontFamily="var(--mono)"
      >
        no chain, no wallet keys
      </text>

      {/* Return path GPU -> CPU */}
      <path
        d="M736 228 L736 248 L392 248 L392 228"
        stroke={flow}
        strokeWidth="2"
        fill="none"
        markerEnd="url(#vd-arrow)"
        opacity="0.55"
        strokeDasharray="6 4"
      />
      <text
        x="564"
        y="238"
        textAnchor="middle"
        fill="var(--text-secondary)"
        fontSize="12"
        fontFamily="var(--mono)"
      >
        results back
      </text>

      <defs>
        <marker id="vd-arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
          <path d="M0,0 L10,4 L0,8" fill={arrowFill} opacity="0.9" />
        </marker>
      </defs>
    </svg>
  )
}
