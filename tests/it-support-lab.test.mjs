import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer as createHttpServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'
import { projects } from '../src/data/projects.ts'
import { selectPublishedProjects } from '../build/projectPublication.ts'
import { filterProjects } from '../src/features/projects/catalogFilters.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const lab = projects.find((project) => project.slug === 'it-support-lab')
const publicProjects = selectPublishedProjects(
  projects,
  (file) => '/' + file.replace(/^public\//, '')
)
let server
let httpServer
let base
before(async () => {
  server = await createServer({
    root,
    cacheDir: 'node_modules/.cache/it-support-lab-vite',
    logLevel: 'error',
    server: { middlewareMode: true, hmr: false, ws: false, watch: null }
  })
  httpServer = createHttpServer(server.middlewares)
  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve))
  base = 'http://127.0.0.1:' + httpServer.address().port
})
after(async () => {
  if (httpServer) await new Promise((resolve) => httpServer.close(resolve))
  await server?.close()
})
const render = (Component, props = {}, url = '/projekte/it-support-lab') =>
  renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [url] },
      createElement(Component, props)
    )
  )

test('IT lab is a unique approved personal case while the Docker proposal remains private', () => {
  assert.equal(
    projects.filter((project) => project.slug === lab.slug).length,
    1
  )
  assert.equal(lab.category, 'it')
  assert.equal(lab.origin, 'personal')
  assert.equal(lab.status, 'published')
  assert.equal(lab.publicationApproved, true)
  assert.equal(lab.isOwnerWork, true)
  assert.equal(lab.links, undefined)
  assert.equal(lab.content.de.demo, undefined)
  assert.equal(lab.cover.id, 'lab-windows-health')
  assert.equal(lab.gallery.length, 3)
  for (const other of projects.filter(
    (project) => project.category === 'it' && project.slug !== lab.slug
  )) {
    assert.equal(other.status, 'draft')
    assert.equal(other.publicationApproved, false)
  }
  assert.deepEqual(
    filterProjects(publicProjects, 'it').map((project) => project.slug),
    ['it-support-lab']
  )
  assert.ok(
    !filterProjects(publicProjects, 'web').some(
      (project) => project.slug === lab.slug
    )
  )
  assert.ok(
    !filterProjects(publicProjects, 'creative').some(
      (project) => project.slug === lab.slug
    )
  )
})

test('IT lab copy distinguishes performed exercises, measurements and deterministic network simulations', () => {
  const content = lab.content.de
  const chapter = (id) =>
    JSON.stringify(content.chapters.find((item) => item.id === id))
  assert.match(content.background, /keine produktive Unternehmensumgebung/)
  assert.match(chapter('linux-troubleshooting'), /tatsächlich erzeugt/)
  for (const value of [
    'Exit 126',
    'chmod 700',
    '666 auf 640',
    'Arbeitsverzeichnis'
  ]) {
    assert.ok(chapter('linux-troubleshooting').includes(value))
  }
  assert.match(
    chapter('network-fixtures'),
    /ausschließlich mit deterministischen Test-Fixtures simuliert/
  )
  assert.match(chapter('network-fixtures'), /keine realen Netzwerkausfälle/)
  assert.match(chapter('network-diagnostics'), /opt-in/)
  assert.match(chapter('network-diagnostics'), /nicht ausgeführt/)
  assert.match(
    chapter('network-diagnostics'),
    /DNS und Internetverbindung wurden nicht getestet/
  )
  for (const term of [
    'vier generierte Testdateien',
    'unabhängige Prüfung',
    'demselben Computer',
    'Manipulierte',
    'Fehlende',
    'Überschreiben verweigert'
  ]) {
    assert.ok(chapter('backup-restore').includes(term))
  }
  assert.match(chapter('quality-assurance'), /271 bestandene/)
  assert.match(
    chapter('quality-assurance'),
    /nicht aus einem extern zertifizierten Audit/
  )
  assert.match(chapter('scope-and-privacy'), /kein Live-Monitoring/)
})

test('IT case route renders four accessible screenshots, all chapters and no misleading demo or source link', async () => {
  const { AppRoutes } = await server.ssrLoadModule('/src/app/routes.tsx')
  const html = render(AppRoutes)
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1)
  assert.match(
    html,
    /IT Support Lab — Windows &amp; Linux Systemadministration/
  )
  assert.match(html, /IT &amp; Support \/ Eigenprojekt/)
  assert.equal((html.match(/<img\b/g) || []).length, 4)
  assert.equal((html.match(/aria-haspopup="dialog"/g) || []).length, 4)
  for (const chapter of lab.content.de.chapters) {
    assert.ok(html.includes('id="chapter-' + chapter.id + '"'))
  }
  for (const image of [lab.cover, ...lab.gallery]) {
    assert.ok(html.includes(image.file.replace(/^public/, '')))
  }
  assert.match(html, /href="\/projekte\?category=it"/)
  assert.ok(
    !/Live-Demo|href="https:|case-demo|case-gallery|src="undefined"|href=""/.test(
      html
    )
  )
  const response = await fetch(base + '/projekte/it-support-lab')
  assert.equal(response.status, 200)
})

test('IT project card uses the reviewed Windows preview and existing category URL filtering', async () => {
  const { AppRoutes } = await server.ssrLoadModule('/src/app/routes.tsx')
  const html = render(AppRoutes, {}, '/projekte?category=it')
  assert.match(html, /href="\/projekte\/it-support-lab"/)
  assert.match(html, /windows-health.webp/)
  assert.match(html, /PowerShell/)
  assert.match(html, /aria-pressed="true"[^>]*>IT &amp; Support/)
  assert.ok(!html.includes('href="/projekte/studioflow"'))
  assert.ok(!html.includes('href="/projekte/photo-restoration"'))
})

test('all four IT screenshots retain their approved dimensions and are served as local WebP bytes', async () => {
  await server.ssrLoadModule('virtual:portfolio-projects')
  const expected = [
    [1104, 654],
    [1104, 423],
    [1104, 657],
    [1104, 401]
  ]
  for (const [index, image] of [lab.cover, ...lab.gallery].entries()) {
    assert.equal(image.publicationApproved, true)
    assert.deepEqual([image.width, image.height], expected[index])
    assert.ok(image.alt.de && image.caption.de)
    const path = image.file.replace(/^public/, '')
    assert.match(path, /^\/media\/projects\/it-support-lab\/[\w-]+\.webp$/)
    const bytes = await readFile(new URL('../public' + path, import.meta.url))
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF')
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP')
    const response = await fetch(base + path)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'image/webp')
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes)
    const head = await fetch(base + path, { method: 'HEAD' })
    assert.equal(Number(head.headers.get('content-length')), bytes.length)
  }
})

test('optional future IT source links remain hidden unless both verified and explicitly approved', async () => {
  const { CaseStudyLayout } = await server.ssrLoadModule(
    '/src/features/projects/CaseStudyLayout.tsx'
  )
  // Isolated test URL; never part of the registry or application bundle.
  const url = 'https://github.com/example/test-only-it-lab'
  for (const verified of [false, true]) {
    for (const publicationApproved of [false, true]) {
      const [project] = selectPublishedProjects(
        [{ ...lab, links: { github: { url, verified, publicationApproved } } }],
        (file) => '/' + file.replace(/^public\//, '')
      )
      const html = render(CaseStudyLayout, { project })
      assert.equal(
        html.includes('href="' + url + '"'),
        verified && publicationApproved
      )
      assert.ok(!html.includes('Live-Demo'))
    }
  }
})

test('IT public projection contains neither internal provenance nor source repository paths', () => {
  const result = JSON.stringify(
    publicProjects.find((project) => project.slug === lab.slug)
  )
  assert.ok(!result.includes(lab.internalNotes))
  assert.ok(
    !/internalNotes|[A-Z]:\\|\/reports\/|\.qa\/|system-health-2026|linux-health-qt62/.test(
      result
    )
  )
})
