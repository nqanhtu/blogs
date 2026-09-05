import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    nitro({
      handlers: [
        { route: '/feed.xml', handler: './server/routes/feed.xml.ts' },
        { route: '/sitemap.xml', handler: './server/routes/sitemap.xml.ts' },
        { route: '/robots.txt', handler: './server/routes/robots.txt.ts' },
        { route: '/og.svg', handler: './server/routes/og.svg.ts' },
      ],
      rollupConfig: {
        external: [/^@sentry\//],
      },
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  // @ts-expect-error vitest config
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
  },
})
