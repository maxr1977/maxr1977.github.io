import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { createTestPattern } from '../dev/testPattern.ts'

const virtualId = 'virtual:portfolio-dev-routes'
const resolvedId = '\0' + virtualId
const endpoint = '/__dev-photo-pattern.svg'
const normalized = (id: string) => id.split('?')[0]!.replaceAll('\\', '/').toLowerCase()

// This boundary removes the route, its imports and its fixtures before bundling.
export function devPreviewPlugin(): Plugin {
  let serving = false
  let restricted: string[] = []
  return {
    name: 'portfolio-development-preview',
    enforce: 'pre',
    configResolved(config) {
      serving = config.command === 'serve'
      restricted = ['dev', 'tests'].map(directory => normalized(resolve(config.root, directory)) + '/')
    },
    resolveId(id) {
      if (id === virtualId) return resolvedId
    },
    load(id) {
      if (!serving && restricted.some(directory => normalized(id).startsWith(directory))) {
        this.error('Development previews and test fixtures cannot enter a production build.')
      }
      if (id !== resolvedId) return
      return serving ? `
        import { createElement } from 'react';
        import { Route } from 'react-router';
        import { PhotoComparisonPreview } from '/dev/PhotoComparisonPreview.tsx';
        export const devRoutes = [createElement(Route, {
          key: 'photo-comparison-preview', path: '/dev/photo-comparison',
          element: createElement(PhotoComparisonPreview)
        })];
      ` : 'export const devRoutes = [];'
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = new URL(request.url ?? '/', 'http://localhost')
        if (url.pathname !== endpoint) { next(); return }
        response.setHeader('Cache-Control', 'no-store')
        response.setHeader('X-Content-Type-Options', 'nosniff')
        const pattern = createTestPattern(url.searchParams)
        if (!pattern) {
          response.statusCode = 400
          response.end('Invalid synthetic pattern parameters.')
          return
        }
        const send = () => {
          if (response.destroyed) return
          response.statusCode = pattern.failure ? 404 : 200
          response.setHeader('Content-Type', pattern.failure ? 'text/plain; charset=utf-8' : 'image/svg+xml; charset=utf-8')
          response.end(pattern.failure ? 'Intentional development-only image failure.' : pattern.svg)
        }
        const timer = setTimeout(send, pattern.delay)
        response.on('close', () => clearTimeout(timer))
      })
    },
  }
}
