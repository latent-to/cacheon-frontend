import { reactRouter } from '@react-router/dev/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import mdx from 'fumadocs-mdx/vite'
import { defineConfig } from 'vite'
import * as MdxConfig from './source.config'

const fumadocsDeps = ['fumadocs-core/source/client', 'fumadocs-core/search/server']

const API_UPSTREAM = 'http://127.0.0.1:8080'

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
        target: API_UPSTREAM,
        changeOrigin: false,
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
