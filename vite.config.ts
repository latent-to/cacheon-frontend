import { reactRouter } from '@react-router/dev/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import mdx from 'fumadocs-mdx/vite'
import { defineConfig } from 'vite'
import * as MdxConfig from './source.config'

const fumadocsDeps = ['fumadocs-core/source/client', 'fumadocs-core/search/server']

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    include: fumadocsDeps,
  },
  ssr: {
    optimizeDeps: {
      include: fumadocsDeps,
    },
  },
  server: {
    proxy: {
      '/proxy-api': {
        target: 'https://api.cacheon.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-api/, ''),
      },
    },
  },
  plugins: [
    mdx(MdxConfig),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    reactRouter(),
  ],
})
