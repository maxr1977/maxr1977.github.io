import assert from 'node:assert/strict'
import { createServer as createHttpServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'
import { selectPublishedProjects } from '../build/projectPublication.ts'
import { projects as registry } from '../src/data/projects.ts'
import { orderProjects } from '../src/features/projects/projectOrder.ts'
import { releaseStatus, releaseBlockers } from '../src/data/release.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
let server
let httpServer
let base
let AppRoutes
before(async () => {
  server = await createServer({
    root,
    cacheDir: 'node_modules/.cache/refinement-vite',
    logLevel: 'error',
    server: { middlewareMode: true, hmr: false, ws: false, watch: null }
  })
  httpServer = createHttpServer(server.middlewares)
  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve))
  base = 'http://127.0.0.1:' + httpServer.address().port
  ;({ AppRoutes } = await server.ssrLoadModule('/src/app/routes.tsx'))
})
after(async () => {
  if (httpServer) await new Promise((resolve) => httpServer.close(resolve))
  await server?.close()
})
const render = (Component, props = {}, url = '/') =>
  renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [url] },
      createElement(Component, props)
    )
  )
const route = (url) => render(AppRoutes, {}, url)
const caseLinks = (html) =>
  [...html.matchAll(/href="\/projekte\/([a-z-]+)"/g)].map((match) => match[1])

test('homepage shows three approved projects in the required order with proper heading levels', () => {
  const html = route('/')
  assert.deepEqual(caseLinks(html), [
    'studioflow',
    'it-support-lab',
    'photo-restoration'
  ])
  assert.match(html, /<h2 id="selected-title">Ausgewählte Projekte<\/h2>/)
  assert.equal((html.match(/<h3[^>]*id="project-card-/g) || []).length, 3)
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1)
  assert.match(html, /maksym-portrait-1200/)
  assert.ok(
    !/Sales-App MVP|TEST_FIXTURE|Kontaktmöglichkeiten werden/.test(html)
  )
})

test('contact links are owner-provided, functional and independent of the legal address', async () => {
  const { contact } = await server.ssrLoadModule('/src/data/contact.ts')
  const html = route('/')
  assert.match(html, /Lassen Sie uns<span>ins Gespräch kommen\.<\/span>/)
  assert.match(html, /Festanstellung/)
  assert.ok(html.includes('href="mailto:' + contact.email + '"'))
  for (const url of [contact.linkedin, contact.github]) {
    assert.ok(
      html.includes(
        'href="' +
          url +
          '" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"'
      )
    )
  }
  assert.ok(!html.includes(contact.address.street))
  assert.ok(!html.includes('href="tel:'))
  assert.ok(!/<form\b|<iframe\b/.test(html))
  assert.match(html, /Speyer · Mannheim · Ludwigshafen/)
})

test('ordering is stable, preserves input and places future approved projects after the selected cases', () => {
  const source = selectPublishedProjects(registry, (file) => '/' + file)
  const before = source.map((project) => project.slug)
  const ordered = orderProjects([...source].reverse())
  assert.deepEqual(
    ordered.map((project) => project.slug),
    ['studioflow', 'it-support-lab', 'photo-restoration']
  )
  assert.deepEqual(
    source.map((project) => project.slug),
    before
  )
  const future = { ...source[0], slug: 'isolated-future-fixture' }
  assert.equal(orderProjects([future, ...source]).at(-1), future)
})

test('catalog keeps the same order and URL filters retain exactly the appropriate case links', () => {
  assert.deepEqual(caseLinks(route('/projekte')), [
    'studioflow',
    'it-support-lab',
    'photo-restoration'
  ])
  for (const [category, slug] of [
    ['web', 'studioflow'],
    ['it', 'it-support-lab'],
    ['creative', 'photo-restoration']
  ]) {
    const html = route('/projekte?category=' + category)
    assert.deepEqual(caseLinks(html), [slug])
    assert.equal((html.match(/aria-pressed="true"/g) || []).length, 1)
  }
})

test('IT case separates three real exercises and three simulated cases with problem/diagnosis/solution/results', () => {
  const html = route('/projekte/it-support-lab')
  assert.equal((html.match(/data-kind="laboratory"/g) || []).length, 3)
  assert.equal((html.match(/data-kind="simulation"/g) || []).length, 3)
  for (const label of ['Problem', 'Diagnose', 'Lösung', 'Ergebnis']) {
    assert.equal(
      (html.match(new RegExp('<dt>' + label + '</dt>', 'g')) || []).length,
      6
    )
  }
  assert.match(html, /keine realen Netzwerkausfälle/)
  assert.match(html, /271 bestandene automatisierte/)
  assert.match(html, /DNS und Internetverbindung wurden nicht getestet/)
  assert.ok(!html.includes('Live-Demo'))
})

test('example projection strips editorial/private fields and refuses unlabelled real/simulated provenance', () => {
  const source = registry.find((project) => project.slug === 'it-support-lab')
  const fixture = (kind) => ({
    ...source,
    content: {
      de: {
        ...source.content.de,
        chapters: [
          {
            id: 'test-case',
            title: 'Test case',
            description: 'Isolated test input.',
            examples: {
              kind,
              internalNotes: 'PRIVATE_EXAMPLES_SENTINEL',
              items: [
                {
                  title: ' Test ',
                  problem: ' Problem ',
                  diagnosis: ' Diagnosis ',
                  result: ' Result ',
                  secret: 'PRIVATE_EXAMPLE_SENTINEL'
                }
              ]
            }
          }
        ]
      }
    }
  })
  const [project] = selectPublishedProjects(
    [fixture('simulation')],
    (file) => '/' + file
  )
  assert.ok(!JSON.stringify(project).includes('PRIVATE_'))
  assert.deepEqual(project.content.de.chapters[0].examples.items[0], {
    title: 'Test',
    problem: 'Problem',
    diagnosis: 'Diagnosis',
    solution: undefined,
    result: 'Result'
  })
  assert.throws(
    () =>
      selectPublishedProjects([fixture('unverified')], (file) => '/' + file),
    /truthful/
  )
})

test('legal routes show approved responsible person, exact address and distinct substantive texts', async () => {
  const imprint = route('/impressum')
  const privacy = route('/datenschutz')
  for (const html of [imprint, privacy]) {
    assert.match(html, /Maksym Rechyn/)
    assert.match(html, /Wormser Landstraße 169/)
    assert.match(html, /67346 Speyer/)
    assert.match(html, /Deutschland/)
    assert.match(html, /href="mailto:maxr19777@gmail.com"/)
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1)
    assert.ok(!/Handelsregister|Umsatzsteuer|ODR|href="tel:/.test(html))
  }
  assert.match(
    imprint,
    /Angaben gemäß § 18 Abs. 1 Medienstaatsvertrag \(MStV\)/
  )
  assert.match(imprint, /keine entgeltlichen Dienstleistungen/)
  assert.equal(
    privacy.includes('Offener Entwurf'),
    !releaseStatus.legalReviewApproved
  )
  assert.match(privacy, /GitHub Pages/)
  assert.match(privacy, /IP-Adressen/)
  assert.match(privacy, /protokolliert und gespeichert/)
  assert.match(privacy, /Widerspruchsrecht/)
  assert.match(privacy, /Beschwerderecht/)
  for (const path of ['/impressum', '/datenschutz']) {
    const response = await fetch(base + path)
    assert.equal(response.status, 200)
    assert.match(await response.text(), /<div id="root"><\/div>/)
  }
})

test('all seven main routes expose keyboard-focusable footer links and no missing heading references', () => {
  for (const url of [
    '/',
    '/projekte',
    '/projekte/studioflow',
    '/projekte/it-support-lab',
    '/projekte/photo-restoration',
    '/impressum',
    '/datenschutz'
  ]) {
    const html = route(url)
    const footer = html.match(/<footer[\s\S]*?<\/footer>/)?.[0]
    assert.match(footer, /href="\/impressum"/)
    assert.match(footer, /href="\/datenschutz"/)
    assert.match(footer, /Datenschutzerklärung/)
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])
    assert.equal(new Set(ids).size, ids.length)
    for (const match of html.matchAll(/aria-labelledby="([^"]+)"/g)) {
      for (const id of match[1].split(' ')) assert.ok(ids.includes(id))
    }
  }
})

test('Gmail notice and consumer Gemini attribution stay separate from embedded services and private account details', () => {
  const privacy = route('/datenschutz')
  assert.match(
    privacy,
    /personenbezogenen Daten bei einer Kontaktaufnahme ist freiwillig/
  )
  assert.match(privacy, /weder gesetzlich noch vertraglich vorgeschrieben/)
  assert.match(
    privacy,
    /Ohne die für eine Antwort erforderlichen Kontaktangaben kann ich Ihre Anfrage nicht beantworten/
  )
  assert.match(privacy, /Gmail/)
  assert.match(privacy, /persönliches Gmail-Konto/)
  assert.match(privacy, /kein Google Workspace/)
  assert.match(
    privacy,
    /Eine automatische Löschung nach einer festen Frist ist nicht eingerichtet/
  )
  assert.match(privacy, /Google Ireland Limited/)
  for (const url of [
    'https://policies.google.com/privacy?hl=de',
    'https://policies.google.com/privacy/frameworks?hl=de',
    'https://policies.google.com/technologies/retention?hl=de',
    'https://support.google.com/mail/answer/7401?hl=de'
  ])
    assert.ok(privacy.includes(`href="${url}"`))
  assert.match(
    privacy,
    /keine automatische Löschfrist für den gesamten Posteingang/
  )
  const photo = route('/projekte/photo-restoration')
  assert.match(photo, /Google Gemini/)
  assert.match(photo, /nicht manuell in Photoshop nachbearbeitet/)
  assert.ok(!/Nano Banana|Abonnement|Subscription/.test(photo))
  for (const html of [privacy, photo]) {
    assert.ok(!/<iframe|<form|<script[^>]+src="https:\/\//.test(html))
  }
})

test('adopted monthly Gmail review uses purpose-based manual deletion without fictional fixed retention or premature legal approval', async () => {
  const { legalCopy } = await server.ssrLoadModule('/src/data/legal.ts')
  const retention = legalCopy.privacy.sections
    .find((section) => section.id === 'retention')
    .paragraphs.join(' ')
  assert.match(retention, /Einmal im Monat prüfe ich/)
  assert.match(retention, /Nach Abschluss der Korrespondenz lösche ich/)
  assert.match(retention, /Nachrichten und Anhänge manuell/)
  assert.match(retention, /aktiven Bewerbungsprozess/)
  assert.match(retention, /konkreter rechtlicher Grund/)
  assert.match(retention, /bis diese Notwendigkeit entfällt/)
  assert.match(retention, /keine pauschale Anzahl von Tagen/)
  assert.ok(!/OFFEN|6 Monate|12 Monate/.test(retention))
  const html = route('/datenschutz')
  assert.ok(
    html.includes('href="https://www.linkedin.com/legal/privacy-policy"')
  )
  // Publication prose can be complete while personal approval or a material review is still missing.
  const state = { ...releaseStatus, legalReviewApproved: false, openItems: [] }
  assert.ok(
    releaseBlockers(state, ['Ready for review.']).includes(
      'Owner approval of the final legal texts is outstanding.'
    )
  )
})

test('selected GitHub hosting and owner approval do not waive unresolved legal, media and source checks', () => {
  assert.equal(releaseStatus.hostingProvider, 'GitHub Pages')
  assert.equal(releaseStatus.publicationApproved, true)
  if (releaseStatus.openItems.length)
    assert.ok(releaseBlockers(releaseStatus).length > 0)
  assert.equal(typeof releaseStatus.legalReviewApproved, 'boolean')
  assert.equal(typeof releaseStatus.assetRightsApproved, 'boolean')
  const privacy = route('/datenschutz')
  for (const item of releaseStatus.openItems) assert.ok(privacy.includes(item))
})

test('photo case retains authentic pairs and full image access while offering an initially closed interactive dialog', () => {
  const html = route('/projekte/photo-restoration')
  assert.match(html, /aria-haspopup="dialog"[^>]*>Vergleich vergrößern/)
  assert.ok(!html.includes('<dialog'))
  assert.equal((html.match(/<img\b/g) || []).length, 5)
  assert.match(html, /Original ↔ Photoshop/)
  assert.match(html, /Original ↔ KI/)
  assert.match(html, /object-fit:contain/)
  assert.match(html, /Einzelbilder vollständig ansehen/)
  assert.ok(!html.includes('Einheitlich zuschneiden'))
})
