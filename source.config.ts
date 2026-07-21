import { defineDocs, defineConfig } from 'fumadocs-mdx/config'

// Rewrite ```mermaid fenced code blocks into <Mermaid chart="..." /> at the
// mdast stage, before fumadocs' shiki pass highlights them. The chart source is
// passed as an expression attribute (a JSON string literal) so newlines and
// quotes survive intact.
function remarkMermaid() {
  const toMermaidNode = (value: string) => ({
    type: 'mdxJsxFlowElement',
    name: 'Mermaid',
    attributes: [
      {
        type: 'mdxJsxAttribute',
        name: 'chart',
        value: {
          type: 'mdxJsxAttributeValueExpression',
          value: JSON.stringify(value),
          data: {
            estree: {
              type: 'Program',
              sourceType: 'module',
              body: [
                {
                  type: 'ExpressionStatement',
                  expression: { type: 'Literal', value },
                },
              ],
            },
          },
        },
      },
    ],
    children: [],
  })

  const walk = (node: any) => {
    if (!node || !Array.isArray(node.children)) return
    node.children = node.children.map((child: any) => {
      if (child?.type === 'code' && child.lang === 'mermaid') {
        return toMermaidNode(child.value ?? '')
      }
      walk(child)
      return child
    })
  }

  return (tree: any) => {
    walk(tree)
  }
}

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
})

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkMermaid],
  },
})
