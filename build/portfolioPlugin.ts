import { readFileSync, realpathSync, statSync } from 'node:fs'
import { extname, isAbsolute, relative, resolve, sep } from 'node:path'
import type { Plugin } from 'vite'
import type { ProjectRecord } from '../src/types/project.ts'
import { selectPublishedProjects } from './projectPublication.ts'
import type { AssetKind } from './projectPublication.ts'

const virtualId = 'virtual:portfolio-projects'
const resolvedId = '\0' + virtualId
const normalize = (id: string) => id.split('?')[0]!.replaceAll('\\', '/').toLowerCase()
const mediaTypes: Record<string, string> = {
  '.avif': 'image/avif', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.mp4': 'video/mp4',
  '.webm': 'video/webm', '.vtt': 'text/vtt; charset=utf-8',
}

function readAsset(root: string, file: string, kind: AssetKind) {
  const directory = file.startsWith('public/media/projects/') ? 'public/media/projects/' : 'media/projects/'
  if (!file.startsWith(directory) || file.includes('\\') ||
    file.split('/').includes('..') || isAbsolute(file)) {
    throw new Error('Approved media must be web copies inside media/projects/ or public/media/projects/.')
  }
  const extensions: Record<AssetKind, readonly string[]> = {
    image: ['.avif', '.webp', '.png', '.jpg', '.jpeg'],
    'video/mp4': ['.mp4'], 'video/webm': ['.webm'], captions: ['.vtt'],
  }
  const extension = extname(file).toLowerCase()
  if (!extensions[kind].includes(extension)) throw new Error('Media type and file extension must match.')
  const allowed = realpathSync(resolve(root, directory))
  const absolute = realpathSync(resolve(root, file))
  const inside = relative(allowed, absolute)
  if (inside === '..' || inside.startsWith('..' + sep) || isAbsolute(inside) ||
    !statSync(absolute).isFile()) throw new Error('Media must not escape the approved media directory.')
  const bytes = readFileSync(absolute)
  if (kind === 'captions' && !bytes.toString('utf8').replace(/^\uFEFF/, '').startsWith('WEBVTT')) {
    throw new Error('Video captions must be valid WebVTT files.')
  }
  return { bytes, extension, url: '/' + file.replace(/^public\//, '').split('/').map(encodeURIComponent).join('/') }
}

// A small build boundary, not a second registry or a content generation pipeline.
export function portfolioPlugin(records: readonly ProjectRecord[]): Plugin {
  let root = ''
  let serving = false
  let registry = ''
  const approvedMedia = new Map<string, { bytes: Buffer; extension: string }>()
  return {
    name: 'portfolio-public-projects',
    enforce: 'pre',
    configResolved(config) {
      root = config.root
      serving = config.command === 'serve'
      registry = normalize(resolve(root, 'src/data/projects.ts'))
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        let pathname: string
        try {
          pathname = normalize(decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname))
        } catch {
          response.statusCode = 400
          response.end('Invalid request.')
          return
        }
        const protectedSource = pathname.endsWith('/src/data/projects.ts') ||
          pathname.endsWith('.md') || /\/(?:build|private|reference|\.git|\.vite-temp)\//.test(pathname) ||
          /\/vite\.config\.[^/]+$/.test(pathname)
        if (protectedSource) {
          response.statusCode = 403
          response.setHeader('Content-Type', 'text/plain; charset=utf-8')
          response.end('Not available.')
          return
        }
        const media = approvedMedia.get(pathname)
        if (media && (request.method === 'GET' || request.method === 'HEAD')) {
          response.setHeader('Content-Type', mediaTypes[media.extension]!)
          response.setHeader('Content-Length', media.bytes.length)
          response.setHeader('Cache-Control', 'no-cache')
          response.setHeader('X-Content-Type-Options', 'nosniff')
          response.end(request.method === 'HEAD' ? undefined : media.bytes)
          return
        }
        next()
      })
    },
    resolveId(id) {
      if (id === virtualId) return resolvedId
    },
    load(id) {
      if (normalize(id) === registry) {
        this.error('Project records are build-only. Import virtual:portfolio-projects instead.')
      }
      if (id !== resolvedId) return
      this.addWatchFile(resolve(root, 'src/data/projects.ts'))
      const references = new Map<string, string>()
      approvedMedia.clear()
      const projects = selectPublishedProjects(records, (file, kind) => {
        const { bytes, extension, url } = readAsset(root, file, kind)
        this.addWatchFile(resolve(root, file))
        if (serving) {
          // Existing media/projects URLs retain Vite's static/range handling.
          if (file.startsWith('public/')) approvedMedia.set(normalize(decodeURIComponent(url)), { bytes, extension })
          return url
        }
        const reference = this.emitFile({ type: 'asset', name: 'portfolio-media' + extension, source: bytes })
        const token = '__PORTFOLIO_ASSET_' + references.size + '__'
        references.set(token, reference)
        return token
      })
      let json = JSON.stringify(projects)
      for (const [token, reference] of references) {
        json = json.replaceAll('"src":' + JSON.stringify(token), '"src":import.meta.ROLLUP_FILE_URL_' + reference)
      }
      return 'export const projects = ' + json + ';'
    },
  }
}
