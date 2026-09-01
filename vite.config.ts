/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/event-templates': {
        target: 'https://dev.intellsys.ai',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/sub-system/pluto/ottopilot/event-templates/get',
      },
      '/sub-system': {
        target: 'https://dev.intellsys.ai',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
