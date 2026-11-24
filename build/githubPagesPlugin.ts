import type { Plugin } from 'vite'
import type { ProjectRecord } from '../src/types/project.ts'
import { selectPublishedProjects } from './projectPublication.ts'

export function githubPagesPlugin(
  records: readonly ProjectRecord[],
  releaseReady = false
): Plugin {
  return {
    name: 'portfolio-github-pages-routes',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      return releaseReady
        ? html.replace(
            /<meta\s+name="robots"\s+content="noindex, nofollow"\s*\/>/,
            '<meta name="robots" content="index, follow" />'
          )
        : html
    },
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const entry = bundle['index.html']
        if (!entry || entry.type !== 'asset')
          throw new Error('Missing application shell.')
        const approved = selectPublishedProjects(records, (file) => file)
        const routes = [
          'projekte',
          'impressum',
          'datenschutz',
          ...approved.map((project) => `projekte/${project.slug}`)
        ]
        for (const route of routes)
          this.emitFile({
            type: 'asset',
            fileName: `${route}/index.html`,
            source: entry.source
          })
        // Known routes return 200 from their own directory indexes. Unknown routes remain 404.
        this.emitFile({
          type: 'asset',
          fileName: '404.html',
          source: entry.source
        })
        this.emitFile({ type: 'asset', fileName: '.nojekyll', source: '' })
      }
    }
  }
}
