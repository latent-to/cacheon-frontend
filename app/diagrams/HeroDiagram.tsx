export default function HeroDiagram() {
  const barH = 10
  const gap = 16
  const leftX = 30
  const barMaxW = 200

  const rows = [
    { label: 'vLLM baseline', pct: 1.0, accent: false },
    { label: 'Your server', pct: 0.62, accent: true },
  ]

  const startY = 30
  const totalH = startY + rows.length * (barH + gap) + 20

  return (
    <svg
      viewBox={`0 0 340 ${totalH}`}
      fill="none"
      style={{ width: '100%', maxWidth: 480, height: 'auto', opacity: 0.92 }}
      aria-label="Inference speed comparison: your server vs vLLM baseline"
    >
      {/* Title */}
      <text x={leftX} y={18} fill="var(--text-secondary)" fontSize="8" fontFamily="var(--mono)">
        TTFT (lower is faster)
      </text>

      {rows.map((row, i) => {
        const y = startY + i * (barH + gap)
        const w = barMaxW * row.pct
        return (
          <g key={row.label}>
            <rect
              x={leftX}
              y={y}
              width={w}
              height={barH}
              rx={2}
              fill={row.accent ? 'var(--accent)' : 'var(--diagram-bar-strong)'}
              opacity={row.accent ? 0.85 : 0.55}
            />
            <text
              x={leftX}
              y={y + barH + 12}
              fill="var(--text-secondary)"
              fontSize="7.5"
              fontFamily="var(--mono)"
            >
              {row.label}
            </text>
            {row.accent && (
              <text
                x={leftX + w + 8}
                y={y + barH / 2 + 3}
                fill="var(--accent)"
                fontSize="8"
                fontFamily="var(--mono)"
                fontWeight="600"
              >
                38% faster
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
