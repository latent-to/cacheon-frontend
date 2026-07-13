import { useEffect, useId, useState } from 'react'

// Client-only mermaid renderer. The site is dark-only (see app/root.tsx:
// <html className="dark">, RootProvider theme disabled), so we render with the
// dark theme unconditionally. mermaid touches the DOM, so rendering happens in
// an effect on the client; during SSR the block is an empty placeholder that
// fills in on hydration.
export function Mermaid({ chart }: { chart: string }) {
  const rawId = useId()
  const id = `mmd${rawId.replace(/[^a-zA-Z0-9]/g, '')}`
  const [svg, setSvg] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'strict',
          fontFamily: 'inherit',
        })
        const { svg } = await mermaid.render(id, chart)
        if (!cancelled) {
          setSvg(svg)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [chart, id])

  if (error) {
    return (
      <pre className="my-4 overflow-x-auto text-sm">
        <code>{chart}</code>
      </pre>
    )
  }

  return (
    <div
      className="my-4 flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
