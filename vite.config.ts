/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const vestaBase = (
    env.VESTA_BASE_URL ||
    env.VITE_VESTA_BASE_URL ||
    'https://dev.intellsys.ai'
  ).replace(/\/+$/, '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api/vesta': {
          target: vestaBase,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/vesta/, '/sub-system/pluto'),
        },
      },
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
      env: {
        VITE_VESTA_WORKSPACE_ID: 'ws-1',
        VITE_VESTA_ACCESS_TOKEN: 'token',
      },
    },
  }
})
