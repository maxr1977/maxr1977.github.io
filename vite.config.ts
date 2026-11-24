import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { devPreviewPlugin } from './build/devPreviewPlugin.ts'
import { portfolioPlugin } from './build/portfolioPlugin.ts'
import { githubPagesPlugin } from './build/githubPagesPlugin.ts'
import { projects } from './src/data/projects.ts'
import { releaseStatus, releaseBlockers } from './src/data/release.ts'
import { legalCopy } from './src/data/legal.ts'

const releaseReady =
  releaseBlockers(
    releaseStatus,
    legalCopy.privacy.sections.flatMap((section) => section.paragraphs)
  ).length === 0

export default defineConfig({
  base: '/',
  plugins: [
    portfolioPlugin(projects),
    devPreviewPlugin(),
    react(),
    githubPagesPlugin(projects, releaseReady)
  ],
  // Only approved imported/emitted assets enter dist.
  publicDir: false,
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    fs: {
      deny: [
        '.env',
        '.env.*',
        '**/.git/**',
        '**/private/**',
        '**/reference/**',
        '**/*.md',
        '**/src/data/projects.ts',
        '**/build/**',
        '**/vite.config.*',
        '**/.vite-temp/**'
      ]
    }
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true
  }
})
