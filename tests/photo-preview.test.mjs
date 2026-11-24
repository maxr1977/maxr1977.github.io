import assert from 'node:assert/strict'
import { createServer as createHttpServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { after, before, test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { build, createServer } from 'vite'
import { devPreviewPlugin } from '../build/devPreviewPlugin.ts'
import { createTestPattern, patternSizes } from '../dev/testPattern.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
let server
let httpServer
let base
before(async () => {
  server = await createServer({
    root,
    cacheDir: 'node_modules/.cache/photo-preview-vite',
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

test('synthetic grids have explicit labels, coordinate marks and all supported dimensions', () => {
  for (const [size, [width, height]] of Object.entries(patternSizes)) {
    for (const variant of ['original', 'manual', 'aiAssisted']) {
      const pattern = createTestPattern(new URLSearchParams({ size, variant }))
      assert.equal(pattern.width, width)
      assert.equal(pattern.height, height)
      assert.match(pattern.svg, /SYNTHETISCHES TESTMUSTER/)
      assert.match(pattern.svg, /KEINE FOTORESTAURIERUNG/)
      assert.ok(
        pattern.svg.includes('viewBox="0 0 ' + width + ' ' + height + '"')
      )
      assert.ok(
        pattern.svg.includes('cx="' + width / 2 + '" cy="' + height / 2 + '"')
      )
      assert.ok(pattern.svg.includes('0–100 %'))
      assert.ok(!/<image|<script|href=/.test(pattern.svg))
    }
  }
})

test('pattern input is bounded and cannot inject markup, files or arbitrary delays', () => {
  for (const query of [
    'size=__proto__',
    'size=../../private',
    'variant=<script>',
    'delay=9999999',
    'delay=NaN',
    'failure=<script>',
    'size=constructor'
  ]) {
    assert.equal(createTestPattern(new URLSearchParams(query)), null)
  }
  assert.equal(
    createTestPattern(new URLSearchParams('delay=150&failure=1')).failure,
    true
  )
})

test('development endpoint serves no-store SVG, actual delay and intentional errors', async () => {
  const response = await fetch(
    base + '/__dev-photo-pattern.svg?size=portrait&variant=manual'
  )
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /image\/svg\+xml/)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.match(await response.text(), /width="800" height="1200"/)
  const start = performance.now()
  const delayed = await fetch(base + '/__dev-photo-pattern.svg?delay=150')
  await delayed.text()
  assert.ok(
    performance.now() - start >= 125,
    'Artificial loading delay should be real'
  )
  const failed = await fetch(base + '/__dev-photo-pattern.svg?failure=1')
  assert.equal(failed.status, 404)
  assert.match(
    await failed.text(),
    /Intentional development-only image failure/
  )
  const invalid = await fetch(base + '/__dev-photo-pattern.svg?size=invalid')
  assert.equal(invalid.status, 400)
})

test('development route renders real components with both modes, controls and full images', async () => {
  const { AppRoutes } = await server.ssrLoadModule('/src/app/routes.tsx')
  const html = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/dev/photo-comparison'] },
      createElement(AppRoutes)
    )
  )
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1)
  assert.match(html, /Bildvergleich im Test/)
  assert.match(html, /Ausschließlich synthetische Koordinatenraster/)
  assert.match(html, /Original ↔ Photoshop/)
  assert.match(html, /Original ↔ KI/)
  assert.equal((html.match(/<select\b/g) || []).length, 5)
  assert.match(html, /600 × 400/)
  assert.match(html, /4 Sekunden/)
  assert.match(html, /HTTP 404/)
  assert.match(html, /type="range"[^>]*disabled=""/)
  assert.match(html, /Einzelbilder vollständig ansehen/)
  assert.match(html, /<details/)
  assert.ok(!html.includes('Seite nicht gefunden'))
  const response = await fetch(base + '/dev/photo-comparison')
  assert.equal(response.status, 200)
  assert.match(await response.text(), /src\/main.tsx/)
})

async function isolatedBuild(entry) {
  return build({
    configFile: false,
    root,
    logLevel: 'silent',
    plugins: [
      devPreviewPlugin(),
      {
        name: 'isolated-test-entry',
        resolveId(id) {
          if (id === 'preview-boundary-entry') return '\0preview-boundary-entry'
        },
        load(id) {
          if (id === '\0preview-boundary-entry') return entry
        }
      }
    ],
    build: {
      write: false,
      minify: false,
      rollupOptions: { input: 'preview-boundary-entry' }
    }
  })
}

test('production virtual routes export an empty list without the preview path or imports', async () => {
  const result = await isolatedBuild(
    "import {devRoutes} from 'virtual:portfolio-dev-routes'; console.log(devRoutes)"
  )
  const code = result.output
    .filter((item) => item.type === 'chunk')
    .map((item) => item.code)
    .join('')
  let routes
  runInNewContext(code, {
    console: {
      log: (value) => {
        routes = value
      }
    }
  })
  assert.ok(Array.isArray(routes))
  assert.equal(routes.length, 0)
  assert.ok(
    !/photo-comparison|PhotoComparisonPreview|__dev-photo-pattern|SYNTHETISCH/.test(
      code
    )
  )
})

test('production fails closed for direct, raw, URL imports of preview and test fixtures', async () => {
  for (const file of [
    '/dev/testPattern.ts',
    '/dev/PhotoComparisonPreview.tsx',
    '/tests/project-ui.test.mjs'
  ]) {
    for (const suffix of ['', '?raw', '?url']) {
      await assert.rejects(
        () =>
          isolatedBuild(
            `import * as fixture from '${file}${suffix}'; console.log(fixture)`
          ),
        /cannot enter a production build/
      )
    }
  }
})
