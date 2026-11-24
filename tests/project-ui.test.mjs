import assert from 'node:assert/strict'
import { createServer as createHttpServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'
import { selectPublishedProjects } from '../build/projectPublication.ts'
import { projects as sourceRecords } from '../src/data/projects.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
let server
let httpServer
let base
before(async () => {
  server = await createServer({
    root,
    cacheDir: 'node_modules/.cache/project-ui-vite',
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

// Synthetic, isolated rendering inputs. Never imported by the website registry.
const record = (overrides = {}) => ({
  id: 'fixture-web',
  slug: 'fixture-web',
  category: 'web',
  origin: 'demonstration',
  status: 'published',
  publicationApproved: true,
  isOwnerWork: true,
  content: {
    de: { title: 'TEST_FIXTURE_WEB', contribution: 'Test-only contribution.' }
  },
  ...overrides
})
const publicProject = (overrides) =>
  selectPublishedProjects(
    [record(overrides)],
    (file) => '/test-only/' + file
  )[0]
const image = (id) => ({
  id,
  file: 'media/projects/' + id + '.png',
  width: 1,
  height: 1,
  alt: { de: 'Test-only image ' + id },
  publicationApproved: true
})
const render = (Component, props = {}, url = '/projekte') =>
  renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [url] },
      createElement(Component, props)
    )
  )

function semanticChecks(html) {
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1)
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])
  assert.equal(ids.length, new Set(ids).size)
  for (const match of html.matchAll(/aria-labelledby="([^"]+)"/g)) {
    for (const id of match[1].split(' '))
      assert.ok(ids.includes(id), 'Missing accessible heading: ' + id)
  }
  const accessibleHtml = html.replace(
    /<div[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/div>/g,
    ''
  )
  assert.ok(!/href=""|href="#"|src="undefined"|alt=""/.test(accessibleHtml))
}

test('real routes show filters, no draft projects and 404 for every draft slug', async () => {
  const { AppRoutes } = await server.ssrLoadModule('/src/app/routes.tsx')
  for (const url of [
    '/',
    '/projekte',
    '/projekte?category=creative',
    '/projekte?category=web',
    '/projekte?category=it',
    '/impressum',
    '/datenschutz',
    '/unknown'
  ]) {
    const html = render(AppRoutes, {}, url)
    semanticChecks(html)
    if (url.startsWith('/projekte')) {
      assert.equal((html.match(/aria-pressed="true"/g) || []).length, 1)
      if (url.includes('category=it')) {
        assert.match(html, /IT Support Lab/)
        assert.match(html, /href="\/projekte\/it-support-lab"/)
        assert.ok(!html.includes('href="/projekte/studioflow"'))
        assert.ok(!html.includes('href="/projekte/photo-restoration"'))
      } else if (url.includes('category=web')) {
        assert.match(html, /StudioFlow/)
        assert.match(html, /href="\/projekte\/studioflow"/)
        assert.ok(!html.includes('href="/projekte/photo-restoration"'))
      } else {
        assert.match(html, /Historische Fotorestaurierung/)
        assert.match(html, /href="\/projekte\/photo-restoration"/)
        assert.match(
          html,
          /src="\/media\/projects\/photo-restoration\/photoshop.jpg"/
        )
      }
      for (const record of sourceRecords.filter(
        (record) => record.status !== 'published' || !record.publicationApproved
      ))
        assert.ok(!html.includes(record.content.de.title))
      assert.ok(!html.includes('TEST_FIXTURE'))
    }
  }
  for (const slug of [
    ...sourceRecords
      .filter(
        (record) => record.status !== 'published' || !record.publicationApproved
      )
      .map((record) => record.slug),
    'not-an-approved-project'
  ]) {
    const html = render(AppRoutes, {}, '/projekte/' + slug)
    assert.match(html, /Seite nicht gefunden/)
  }
})

test('catalog filters select exactly one button and the right cards for URL state', async () => {
  const { ProjectCatalog } = await server.ssrLoadModule(
    '/src/features/projects/ProjectCatalog.tsx'
  )
  const projects = ['web', 'it', 'creative'].map((category) =>
    publicProject({
      id: 'fixture-' + category,
      slug: 'fixture-' + category,
      category,
      content: {
        de: {
          title: 'TEST_FIXTURE_' + category,
          contribution: 'Test-only role.'
        }
      }
    })
  )
  for (const category of ['all', 'web', 'it', 'creative', 'invalid']) {
    const html = render(
      ProjectCatalog,
      { projects },
      '/projekte?category=' + category
    )
    semanticChecks(html)
    assert.equal((html.match(/aria-pressed="true"/g) || []).length, 1)
    assert.equal(
      (html.match(/<article\b/g) || []).length,
      category === 'all' || category === 'invalid' ? 3 : 1
    )
    assert.match(html, /role="status"/)
    assert.match(html, /aria-controls="project-results"/)
  }
  const empty = render(
    ProjectCatalog,
    { projects: [] },
    '/projekte?category=web'
  )
  assert.match(empty, /Arbeitsproben folgen/)
  const categoryEmpty = render(
    ProjectCatalog,
    { projects: projects.filter((item) => item.category === 'web') },
    '/projekte?category=it'
  )
  assert.match(categoryEmpty, /Hier ist noch Platz/)
  assert.match(categoryEmpty, /Alle Bereiche anzeigen/)
})

test('minimal case studies omit empty sections, images and external links', async () => {
  const { CaseStudyLayout } = await server.ssrLoadModule(
    '/src/features/projects/CaseStudyLayout.tsx'
  )
  const html = render(CaseStudyLayout, { project: publicProject() })
  semanticChecks(html)
  assert.match(html, /case-contribution/)
  for (const absent of [
    'case-background',
    'case-objectives',
    'case-process',
    'case-results',
    'case-lessons',
    'case-gallery',
    'case-video',
    'case-storyboard',
    'case-attribution',
    'case-restoration'
  ]) {
    assert.ok(
      !html.includes('id="' + absent + '"'),
      absent + ' must not be an empty section'
    )
  }
  assert.ok(!html.includes('<img'))
  assert.ok(!html.includes('target="_blank"'))
  assert.match(html, /\/projekte\?category=web/)
})

test('complete template supports approved media, process, attribution and verified links', async () => {
  const { CaseStudyLayout } = await server.ssrLoadModule(
    '/src/features/projects/CaseStudyLayout.tsx'
  )
  const project = publicProject({
    content: {
      de: {
        title: 'TEST_FIXTURE_COMPLETE',
        summary: 'Synthetic rendering input.',
        background: 'Test-only background.',
        objectives: ['Test-only objective.'],
        contribution: 'Test-only contribution.',
        responsibilities: ['Test-only responsibility.'],
        process: [
          {
            title: 'Test-only step',
            description: 'Test-only process description.'
          }
        ],
        results: ['Test-only result.'],
        lessons: ['Test-only lesson.'],
        humanContribution: 'Test-only human contribution.',
        aiContribution: 'Test-only AI contribution.'
      },
      en: {
        title: 'TEST_FIXTURE_EN',
        contribution: 'Synthetic contribution.',
        humanContribution: 'Synthetic human role.',
        aiContribution: 'Synthetic AI role.'
      }
    },
    tools: ['Test tool'],
    cover: image('fixture-cover'),
    gallery: [image('fixture-gallery')],
    storyboard: [image('fixture-frame')],
    restoration: {
      versions: {
        original: image('fixture-original'),
        manual: image('fixture-manual'),
        aiAssisted: image('fixture-ai')
      }
    },
    video: {
      kind: 'embed',
      provider: 'youtube',
      videoId: 'abcdefghijk',
      aiAssisted: true,
      title: { de: 'Test-only video' },
      publicationApproved: true,
      privacyReviewApproved: true,
      transcript: { de: 'Synthetic transcript.' },
      poster: image('fixture-poster')
    },
    links: {
      github: {
        url: 'https://github.com/example/test-fixture',
        verified: true,
        publicationApproved: true
      }
    }
  })
  const html = render(CaseStudyLayout, { project })
  semanticChecks(html)
  for (const section of [
    'background',
    'objectives',
    'contribution',
    'process',
    'results',
    'lessons',
    'gallery',
    'video',
    'storyboard',
    'attribution',
    'restoration'
  ]) {
    assert.ok(html.includes('id="case-' + section + '"'))
  }
  assert.match(html, /Historisch|historisch/)
  assert.match(html, /Externes Video laden/)
  assert.ok(
    !html.includes('<iframe'),
    'Embeds must not connect before activation'
  )
  assert.ok(!html.includes('youtube-nocookie.com'))
  assert.match(html, /type="range"/)
  assert.match(html, /Einzelbilder vollständig ansehen/)
  assert.match(html, /loading="lazy"/)
  assert.match(html, /width="1" height="1"/)
  assert.match(html, /rel="noopener noreferrer"/)
})

test('local video has native controls, approved captions and no autoplay', async () => {
  const { ProjectVideo } = await server.ssrLoadModule(
    '/src/features/projects/ProjectVideo.tsx'
  )
  const project = publicProject({
    video: {
      kind: 'local',
      file: 'media/projects/test.webm',
      mimeType: 'video/webm',
      width: 1280,
      height: 720,
      title: { de: 'Test-only local video' },
      publicationApproved: true,
      captions: [
        {
          file: 'media/projects/test.vtt',
          language: 'de',
          label: 'Deutsch',
          publicationApproved: true
        }
      ]
    }
  })
  const html = render(ProjectVideo, { video: project.video })
  assert.match(html, /controls=""/)
  assert.match(html, /preload="none"/)
  assert.match(html, /kind="captions"/)
  assert.ok(!html.includes('autoPlay') && !html.includes('autoplay'))
})

test('dev HTTP serves only public project data and returns plain 403 for private source', async () => {
  for (const path of [
    '/projekte',
    '/projekte?category=it',
    '/projekte/not-an-approved-project'
  ]) {
    const response = await fetch(base + path)
    assert.equal(response.status, 200)
    assert.ok((await response.text()).includes('<div id="root"></div>'))
  }
  const module = await fetch(base + '/@id/__x00__virtual:portfolio-projects')
  assert.equal(module.status, 200)
  const publicModule = await module.text()
  assert.match(publicModule, /Historische Fotorestaurierung/)
  assert.ok(
    !sourceRecords
      .filter(
        (record) => record.status !== 'published' || !record.publicationApproved
      )
      .some((record) => publicModule.includes(record.slug)) &&
      !publicModule.includes('internalNotes')
  )
  for (const path of [
    '/src/data/projects.ts',
    '/src/data/projects.ts?raw',
    '/src/data/projects.ts?url',
    '/build/projectPublication.ts',
    '/vite.config.ts?raw',
    '/CONTENT.md?raw',
    '/reference/portfolio-design-prototype.html',
    '/private/photo-restoration/CASE_CONTENT_DE.md',
    '/private/photo-restoration/CASE_CONTENT_DE.md?raw'
  ]) {
    const response = await fetch(base + path)
    assert.equal(response.status, 403, path)
    assert.equal(await response.text(), 'Not available.')
  }
})

test('empty-state icons match categories and actions remain useful when the whole catalog is empty', async () => {
  const { ProjectCatalog } = await server.ssrLoadModule(
    '/src/features/projects/ProjectCatalog.tsx'
  )
  const icons = []
  for (const category of ['all', 'web', 'it', 'creative']) {
    const html = render(
      ProjectCatalog,
      { projects: [] },
      '/projekte?category=' + category
    )
    const icon = html.match(
      /<span[^>]*aria-hidden="true"><svg[\s\S]*?<\/svg><\/span>/
    )?.[0]
    assert.ok(icon, category + ': missing empty-state illustration')
    icons.push(icon)
    assert.ok(
      !html.includes('Alle Bereiche anzeigen'),
      'A reset is not useful when every category is empty'
    )
    assert.match(html, /href="\/#kompetenzen"/)
    assert.match(html, /href="\/#kontakt"/)
    assert.ok(!html.includes('mailto:'))
  }
  assert.equal(
    new Set(icons).size,
    4,
    'All, web, IT and creative should have distinct icons'
  )
})

test('isolated project cards render with and without an approved preview image', async () => {
  const { ProjectCard } = await server.ssrLoadModule(
    '/src/features/projects/ProjectCard.tsx'
  )
  for (const cover of [undefined, image('fixture-card-cover')]) {
    const project = publicProject({ tools: ['TEST_TOOL'], cover })
    const html = render(ProjectCard, { project })
    assert.match(html, /Demonstrationsprojekt/)
    assert.match(html, /TEST_TOOL/)
    assert.match(html, /href="\/projekte\/fixture-web"/)
    assert.match(html, /Fallstudie ansehen/)
    assert.equal((html.match(/<img\b/g) || []).length, cover ? 1 : 0)
    assert.ok(!/src="undefined"|href=""|<h2[^>]*><\/h2>/.test(html))
  }
})

test('photo comparison renders a labelled native range, shared alignment and complete-image access', async () => {
  const { BeforeAfterSlider } = await server.ssrLoadModule(
    '/src/features/photo-comparison/BeforeAfterSlider.tsx'
  )
  const before = {
    id: 'fixture-before',
    src: '/test-only/before.png',
    width: 800,
    height: 1200,
    alt: { de: 'TEST_FIXTURE original metadata' }
  }
  const after = {
    ...before,
    id: 'fixture-after',
    src: '/test-only/after.png',
    width: 1600,
    height: 900
  }
  for (const fit of ['contain', 'cover']) {
    const html = render(BeforeAfterSlider, {
      before,
      after,
      fit,
      label: 'TEST_FIXTURE comparison'
    })
    assert.match(html, /type="range"/)
    assert.match(html, /min="0" max="100" step="0.1"/)
    assert.match(html, /aria-valuetext=/)
    assert.match(html, /aria-describedby=/)
    assert.match(
      html,
      /disabled=""/,
      'Loading images must not expose an active empty comparison'
    )
    assert.equal(
      (html.match(new RegExp('object-fit:' + fit, 'g')) || []).length,
      2
    )
    assert.match(html, /<details/)
    assert.match(html, /Einzelbilder vollständig ansehen/)
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])
    for (const match of html.matchAll(
      /(?:for|aria-labelledby|aria-describedby)="([^"]+)"/g
    )) {
      assert.ok(
        ids.includes(match[1]),
        'Label or description must have a real target'
      )
    }
    assert.ok(!html.includes('src=""'))
  }
})

test('both restoration modes are available only with their original and result metadata', async () => {
  const { PhotoRestorationCaseStudy } = await server.ssrLoadModule(
    '/src/features/photo-comparison/PhotoRestorationCaseStudy.tsx'
  )
  const picture = (id) => ({
    id,
    src: '/test-only/' + id + '.png',
    width: 800,
    height: 1200,
    alt: { de: 'TEST_FIXTURE metadata only' }
  })
  const original = picture('fixture-original')
  const manual = picture('fixture-manual')
  const aiAssisted = picture('fixture-ai')
  const complete = render(PhotoRestorationCaseStudy, {
    restoration: {
      versions: { original, manual, aiAssisted },
      overview: { de: 'TEST_FIXTURE overview' },
      manualProcess: { de: 'TEST_FIXTURE manual method' },
      aiProcess: { de: 'TEST_FIXTURE AI method' },
      techniques: { de: ['TEST_FIXTURE technique'] }
    }
  })
  assert.match(complete, /Original ↔ Photoshop/)
  assert.match(complete, /Original ↔ KI/)
  assert.match(complete, /TEST_FIXTURE overview/)
  assert.match(complete, /TEST_FIXTURE manual method/)
  assert.match(complete, /TEST_FIXTURE technique/)
  assert.match(complete, /type="range"/)
  assert.match(complete, /Ohne Beschnitt/)
  assert.match(complete, /Einheitlich zuschneiden/)
  const aiOnly = render(PhotoRestorationCaseStudy, {
    restoration: { versions: { original, aiAssisted } }
  })
  assert.match(aiOnly, /aria-pressed="true"[^>]*>Original ↔ KI/)
  assert.match(aiOnly, /disabled=""[^>]*>Original ↔ Photoshop/)
  const missing = render(PhotoRestorationCaseStudy, {
    restoration: { versions: {} }
  })
  assert.ok(!missing.includes('<input') && !missing.includes('<img'))
  assert.match(missing, /keine Ersatzbilder/)
})

test('missing comparison assets produce an honest fallback, not fabricated images or controls', async () => {
  const { BeforeAfterSlider } = await server.ssrLoadModule(
    '/src/features/photo-comparison/BeforeAfterSlider.tsx'
  )
  const before = {
    id: 'fixture-before',
    src: '/test-only/before.png',
    width: 800,
    height: 1200,
    alt: { de: 'TEST_FIXTURE original metadata' }
  }
  for (const after of [
    undefined,
    { ...before, src: '' },
    { ...before, width: 0 }
  ]) {
    const html = render(BeforeAfterSlider, {
      before,
      after,
      label: 'TEST_FIXTURE unavailable comparison'
    })
    assert.ok(!html.includes('<input'))
    assert.match(html, /noch nicht verfügbar/)
    assert.ok(!html.includes('src=""'))
    assert.match(html, /Einzelbilder vollständig ansehen/)
  }
  const none = render(BeforeAfterSlider, { label: 'TEST_FIXTURE no images' })
  assert.ok(!none.includes('<img') && !none.includes('<input'))
})

test('comparison CSS preserves immediate movement, vertical scrolling and reduced-motion rules', async () => {
  const { readFile } = await import('node:fs/promises')
  const css = await readFile(
    new URL(
      '../src/features/photo-comparison/PhotoComparison.module.css',
      import.meta.url
    ),
    'utf8'
  )
  assert.match(css, /touch-action: pan-y pinch-zoom/)
  assert.match(css, /prefers-reduced-motion: reduce/)
  assert.match(css, /transition: none/)
  assert.match(css, /clip-path: inset/)
})

test('real photo case has correct pairs, attribution, full images and no crop/detail gallery', async () => {
  const { AppRoutes } = await server.ssrLoadModule('/src/app/routes.tsx')
  const { projects } = await server.ssrLoadModule('virtual:portfolio-projects')
  assert.equal(projects.length, 3)
  const project = projects.find((item) => item.slug === 'photo-restoration')
  const html = render(AppRoutes, {}, '/projekte/photo-restoration')
  semanticChecks(html)
  assert.match(html, /<h1>Historische Fotorestaurierung<\/h1>/)
  assert.match(html, /Photoshop vs\. KI — Zwei Methoden im Vergleich/)
  assert.ok(
    html.indexOf('id="case-restoration"') < html.indexOf('id="case-background"')
  )
  assert.equal(
    (html.match(/<img\b/g) || []).length,
    5,
    'Two comparison layers and three full images, without duplicate cover'
  )
  assert.match(html, /Original ↔ Photoshop/)
  assert.match(html, /Original ↔ KI/)
  assert.match(html, /nicht manuell in Photoshop nachbearbeitet/)
  assert.match(html, /nicht historisch verifiziert/)
  assert.match(html, /Eigenprojekt/)
  assert.ok(
    !/KI \+ Photoshop|AI \+ Photoshop|case-gallery|case-storyboard|case-video/.test(
      html
    )
  )
  assert.ok(!html.includes('Einheitlich zuschneiden'))
  assert.ok(
    html.indexOf('id="case-restoration"') <
      html.indexOf('id="case-contribution"')
  )
  assert.match(html, /<details[^>]*open=""/)
  const fullImages = html.match(/<details[\s\S]*?<\/details>/)?.[0]
  assert.equal((fullImages.match(/<figure\b/g) || []).length, 3)
  assert.match(fullImages, /data-count="3"/)
  for (const version of Object.values(project.restoration.versions)) {
    assert.ok(html.includes(version.src))
    assert.equal(version.width, 1334)
    assert.equal(version.height, 2048)
  }
  const manualStage = html.match(
    /<div[^>]*aria-hidden="true"[^>]*data-ready=[\s\S]*?<\/div>/
  )?.[0]
  assert.ok(manualStage)
  assert.ok(
    !manualStage.includes('Original') && !manualStage.includes('Photoshop'),
    'Source labels must stay outside the photograph'
  )
  assert.match(
    html.slice(0, html.indexOf(manualStage)),
    /<span>Original<\/span><span>Photoshop<\/span>/
  )
  assert.ok(
    manualStage.includes('original.jpg') &&
      manualStage.includes('photoshop.jpg')
  )
  assert.ok(!manualStage.includes('ai.jpg'))
  assert.equal((manualStage.match(/object-fit:contain/g) || []).length, 2)
  assert.match(manualStage, /aspect-ratio:0.6513671875/)

  // Exercise the real AI pair through the existing missing-manual fallback.
  // This is SSR pair selection, not a claimed browser button click.
  const { PhotoRestorationCaseStudy } = await server.ssrLoadModule(
    '/src/features/photo-comparison/PhotoRestorationCaseStudy.tsx'
  )
  const aiHtml = render(PhotoRestorationCaseStudy, {
    restoration: {
      ...project.restoration,
      versions: { ...project.restoration.versions, manual: undefined }
    }
  })
  const aiStage = aiHtml.match(
    /<div[^>]*aria-hidden="true"[^>]*data-ready=[\s\S]*?<\/div>/
  )?.[0]
  assert.ok(aiStage)
  assert.ok(aiStage.includes('original.jpg') && aiStage.includes('ai.jpg'))
  assert.ok(!aiStage.includes('photoshop.jpg'))
  assert.match(aiHtml, /aria-pressed="true"[^>]*>Original ↔ KI/)
})

test('all real JPEG URLs return original bytes on the development server', async () => {
  const { readFile } = await import('node:fs/promises')
  await server.ssrLoadModule('virtual:portfolio-projects')
  for (const name of ['original', 'photoshop', 'ai']) {
    const url = base + '/media/projects/photo-restoration/' + name + '.jpg'
    const response = await fetch(url)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'image/jpeg')
    const bytes = Buffer.from(await response.arrayBuffer())
    const original = await readFile(
      new URL(
        '../public/media/projects/photo-restoration/' + name + '.jpg',
        import.meta.url
      )
    )
    assert.deepEqual(bytes, original)
    const head = await fetch(url, { method: 'HEAD' })
    assert.equal(head.status, 200)
    assert.equal(Number(head.headers.get('content-length')), original.length)
    assert.equal((await head.arrayBuffer()).byteLength, 0)
  }
})

test('StudioFlow route renders authentic screenshots, sections and an inactive pending demo status', async () => {
  const { AppRoutes } = await server.ssrLoadModule('/src/app/routes.tsx')
  const html = render(AppRoutes, {}, '/projekte/studioflow')
  semanticChecks(html)
  assert.match(html, /StudioFlow — Digitale Fotostudioverwaltung/)
  assert.match(html, /Eigenprojekt/)
  for (const id of [
    'dashboard',
    'orders',
    'customers',
    'responsive',
    'demo-stack',
    'full-stack',
    'quality'
  ]) {
    assert.ok(html.includes('id="chapter-' + id + '"'))
  }
  assert.equal((html.match(/<img\b/g) || []).length, 4)
  for (const filename of [
    'studio-dashboard.webp',
    'studio-orders.webp',
    'studio-customers.webp',
    'studio-dashboard-mobile.webp'
  ]) {
    assert.ok(html.includes('/media/projects/studioflow/' + filename))
  }
  assert.match(html, /Live-Demo wird vorbereitet/)
  assert.ok(!html.includes('Live-Demo öffnen'))
  assert.ok(!/href="(?:#"|https?:\/\/localhost|[A-Z]:\\)/i.test(html))
  assert.match(
    html,
    /keine echte Anmeldung, keine Live-API und keine Datenbank/
  )
  assert.match(html, /Full-Stack-Version in Entwicklung/)
})

test('demo link activates only after verified publication approval and preserves legacy project links', async () => {
  const { CaseStudyLayout } = await server.ssrLoadModule(
    '/src/features/projects/CaseStudyLayout.tsx'
  )
  const url = 'https://demo.example.test/app'
  for (const [verified, publicationApproved] of [
    [false, false],
    [false, true],
    [true, false],
    [true, true]
  ]) {
    const project = publicProject({
      content: {
        de: {
          title: 'TEST_FIXTURE_DEMO',
          contribution: 'Test',
          demo: 'Test-only demo description.'
        }
      },
      links: { live: { url, verified, publicationApproved } }
    })
    const html = render(CaseStudyLayout, { project })
    assert.equal(
      html.includes('href="' + url + '"'),
      verified && publicationApproved
    )
    assert.equal(
      html.includes('Live-Demo wird vorbereitet'),
      !(verified && publicationApproved)
    )
    assert.equal(
      html.includes('Live-Demo öffnen'),
      verified && publicationApproved
    )
  }
  const legacy = render(CaseStudyLayout, {
    project: publicProject({
      links: { live: { url, verified: true, publicationApproved: true } }
    })
  })
  assert.match(legacy, /href="https:\/\/demo.example.test\/app"/)
  assert.ok(!legacy.includes('case-demo'))
})

test('chapter media may be absent without broken images or duplicated gallery entries', async () => {
  const { CaseStudyLayout } = await server.ssrLoadModule(
    '/src/features/projects/CaseStudyLayout.tsx'
  )
  const html = render(CaseStudyLayout, {
    project: publicProject({
      content: {
        de: {
          title: 'TEST_FIXTURE_CHAPTER',
          contribution: 'Test',
          chapters: [
            {
              id: 'missing',
              title: 'Chapter',
              description: 'Text',
              imageId: 'unapproved'
            }
          ]
        }
      }
    })
  })
  semanticChecks(html)
  assert.match(html, /id="chapter-missing"/)
  assert.ok(!html.includes('<img'))
  assert.ok(!html.includes('src=""'))
})

test('StudioFlow WebP images are served as image/webp without cross-repository runtime paths', async () => {
  const { projects } = await server.ssrLoadModule('virtual:portfolio-projects')
  const project = projects.find((item) => item.slug === 'studioflow')
  const { readFile } = await import('node:fs/promises')
  for (const image of [project.cover, ...project.gallery]) {
    const response = await fetch(base + image.src)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'image/webp')
    assert.deepEqual(
      Buffer.from(await response.arrayBuffer()),
      await readFile(new URL('../public' + image.src, import.meta.url))
    )
  }
})

test('StudioFlow exposes four accessible enlargement controls while the photo case retains its viewer', async () => {
  const { AppRoutes } = await server.ssrLoadModule('/src/app/routes.tsx')
  const studio = render(AppRoutes, {}, '/projekte/studioflow')
  assert.equal((studio.match(/aria-haspopup="dialog"/g) || []).length, 4)
  assert.equal((studio.match(/aria-label="Bild vergrößern:/g) || []).length, 4)
  assert.ok(
    !studio.includes('<dialog'),
    'Dialog is mounted only after an explicit action'
  )
  for (const term of [
    'React-/TypeScript',
    'CRUD',
    'Formulare mit Validierung',
    'Zustandsverwaltung',
    'responsive Design',
    'automatisierte Tests',
    'Playwright'
  ]) {
    assert.ok(studio.includes(term), 'Missing contribution detail: ' + term)
  }
  const photo = render(AppRoutes, {}, '/projekte/photo-restoration')
  assert.equal((photo.match(/aria-haspopup="dialog"/g) || []).length, 1)
  assert.match(photo, /Vergleich vergrößern/)
  assert.match(photo, /Einzelbilder vollständig ansehen/)
  assert.match(photo, /Original ↔ Photoshop/)
  assert.match(photo, /Original ↔ KI/)
})

test('hero portrait exposes responsive sources, intrinsic dimensions and accessible priority loading', async () => {
  const { HeroArtwork } = await server.ssrLoadModule(
    '/src/features/home/HeroArtwork.tsx'
  )
  const html = render(HeroArtwork)
  assert.equal((html.match(/<img /g) || []).length, 1)
  assert.match(
    html,
    /alt="Porträt von Maksym Rechyn mit verschränkten Armen vor dunkelblauem Hintergrund"/
  )
  assert.match(
    html,
    /srcSet="[^"]*maksym-portrait-640\.webp 640w, [^"]*maksym-portrait-1200\.webp 1200w"/i
  )
  assert.match(html, /sizes="[^"]+"/)
  assert.match(html, /width="1200"/)
  assert.match(html, /height="1607"/)
  assert.match(html, /loading="eager"/)
  assert.match(html, /fetchPriority="high"/i)
  assert.ok(!html.includes('aria-hidden'))
})
