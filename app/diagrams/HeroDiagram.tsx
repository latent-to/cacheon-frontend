export default function HeroDiagram() {
  const rowH = 6
  const gap = 3
  const leftRows = 12
  const rightRows = 4
  const leftX = 20
  const rightX = 200
  const leftW = 100
  const rightW = 80
  const totalH = leftRows * (rowH + gap)

  const leftStartY = 10
  const rightStartY = leftStartY + (totalH - rightRows * (rowH + gap)) / 2

  return (
    <svg
      viewBox="0 0 320 120"
      fill="none"
      style={{ width: '100%', maxWidth: 480, height: 'auto', opacity: 0.92 }}
      aria-label="KV cache compression diagram"
    >
      {/* Left: full cache rows (K/V pairs) — neutral bars */}
      {Array.from({ length: leftRows }).map((_, i) => {
        const y = leftStartY + i * (rowH + gap)
        return (
          <g key={`l-${i}`}>
            <rect
              x={leftX}
              y={y}
              width={leftW * 0.48}
              height={rowH}
              rx={1.5}
              fill="var(--diagram-bar-strong)"
              opacity={0.55 + (i % 3) * 0.08}
            />
            <rect
              x={leftX + leftW * 0.52}
              y={y}
              width={leftW * 0.48}
              height={rowH}
              rx={1.5}
              fill="var(--diagram-bar)"
              opacity={0.65 + (i % 3) * 0.06}
            />
          </g>
        )
      })}

      {/* Labels */}
      <text
        x={leftX + leftW * 0.24}
        y={totalH + leftStartY + 14}
        textAnchor="middle"
        fill="var(--text-secondary)"
        fontSize="7"
        fontFamily="var(--mono)"
      >
        K
      </text>
      <text
        x={leftX + leftW * 0.76}
        y={totalH + leftStartY + 14}
        textAnchor="middle"
        fill="var(--text-secondary)"
        fontSize="7"
        fontFamily="var(--mono)"
      >
        V
      </text>

      {/* Arrow / compression flow lines */}
      {Array.from({ length: rightRows }).map((_, i) => {
        const ry = rightStartY + i * (rowH + gap) + rowH / 2
        const fromTop = leftStartY + i * (leftRows / rightRows) * (rowH + gap) + rowH / 2
        const fromBot =
          leftStartY + ((i + 1) * (leftRows / rightRows) - 1) * (rowH + gap) + rowH / 2
        return (
          <g key={`a-${i}`} opacity={0.35}>
            <line
              x1={leftX + leftW + 4}
              y1={fromTop}
              x2={rightX - 4}
              y2={ry}
              stroke="var(--diagram-flow)"
              strokeWidth={0.7}
            />
            <line
              x1={leftX + leftW + 4}
              y1={fromBot}
              x2={rightX - 4}
              y2={ry}
              stroke="var(--diagram-flow)"
              strokeWidth={0.7}
            />
          </g>
        )
      })}

      {/* Right: compressed cache rows */}
      {Array.from({ length: rightRows }).map((_, i) => {
        const y = rightStartY + i * (rowH + gap)
        return (
          <rect
            key={`r-${i}`}
            x={rightX}
            y={y}
            width={rightW}
            height={rowH}
            rx={1.5}
            fill="var(--diagram-bar-strong)"
            opacity={0.75}
          />
        )
      })}

      {/* Query arc — single accent stroke */}
      <path
        d={`M${rightX + rightW + 8},${rightStartY - 6} Q${rightX + rightW + 30},${rightStartY + (rightRows * (rowH + gap)) / 2} ${rightX + rightW + 8},${rightStartY + rightRows * (rowH + gap) + 2}`}
        stroke="var(--accent)"
        strokeWidth={1.2}
        fill="none"
        opacity={0.65}
        strokeDasharray="3 2"
      />
      <text
        x={rightX + rightW + 34}
        y={rightStartY + (rightRows * (rowH + gap)) / 2 + 3}
        fill="var(--text-secondary)"
        fontSize="7"
        fontFamily="var(--mono)"
      >
        Q
      </text>

      <text
        x={rightX + rightW / 2}
        y={rightStartY + rightRows * (rowH + gap) + 14}
        textAnchor="middle"
        fill="var(--text-secondary)"
        fontSize="6.5"
        fontFamily="var(--mono)"
      >
        compressed
      </text>
    </svg>
  )
}
