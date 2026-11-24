import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { build } from 'vite'
import { portfolioPlugin } from '../build/portfolioPlugin.ts'
import { selectPublishedProjects } from '../build/projectPublication.ts'
import { projects } from '../src/data/projects.ts'
import {
  categoryParams,
  filterProjects,
  readCategory
} from '../src/features/projects/catalogFilters.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const asset = (file) => '/approved/' + file
const fixture = (overrides = {}) => ({
  id: 'test-fixture',
  slug: 'test-fixture',
  category: 'web',
  origin: 'demonstration',
  status: 'published',
  publicationApproved: true,
  isOwnerWork: true,
  content: {
    de: {
      title: 'TEST FIXTURE — not portfolio content',
      contribution:
        'Synthetic input used only to test the publication boundary.'
    }
  },
  ...overrides
})

test('the registry or clean public snapshot exposes exactly the three authorized cases and excludes all private drafts', () => {
  assert.ok(projects.length >= 3)
  const published = selectPublishedProjects(projects, asset)
  assert.deepEqual(
    published.map((project) => project.slug),
    ['studioflow', 'photo-restoration', 'it-support-lab']
  )
  assert.ok(
    projects
      .filter(
        (record) =>
          !['studioflow', 'photo-restoration', 'it-support-lab'].includes(
            record.slug
          )
      )
      .every(
        (record) => record.status === 'draft' && !record.publicationApproved
      )
  )
  assert.deepEqual(
    selectPublishedProjects(
      projects.filter(
        (record) =>
          !['studioflow', 'photo-restoration', 'it-support-lab'].includes(
            record.slug
          )
      ),
      () => assert.fail('Draft assets must not be read')
    ),
    []
  )
})

test('status and explicit boolean approval must both allow publication', () => {
  for (const status of ['draft', 'ready', 'published']) {
    for (const publicationApproved of [false, true, 'false', 1, undefined]) {
      const result = selectPublishedProjects(
        [fixture({ status, publicationApproved })],
        asset
      )
      assert.equal(
        result.length,
        status === 'published' && publicationApproved === true ? 1 : 0
      )
    }
  }
})

test('public projection removes private fields at every level', () => {
  const records = [
    fixture({
      internalNotes: 'PRIVATE_ROOT_SENTINEL',
      content: {
        de: {
          title: 'TEST FIXTURE',
          subtitle: '  Test-only subtitle  ',
          contribution: 'Test-only role.',
          privateNotes: 'PRIVATE_CONTENT_SENTINEL'
        }
      },
      links: {
        github: {
          url: 'https://github.com/example/fixture',
          verified: true,
          publicationApproved: true,
          internalNotes: 'PRIVATE_LINK_SENTINEL'
        }
      }
    })
  ]
  const serialized = JSON.stringify(selectPublishedProjects(records, asset))
  assert.ok(!serialized.includes('PRIVATE_'))
  assert.ok(!serialized.includes('internalNotes'))
  assert.equal(
    JSON.parse(serialized)[0].content.de.subtitle,
    'Test-only subtitle'
  )
  assert.ok(serialized.includes('https://github.com/example/fixture'))
})

test('unapproved or unverified links and media are never resolved', () => {
  const result = selectPublishedProjects(
    [
      fixture({
        cover: { publicationApproved: false, file: 'PRIVATE_FILE_SENTINEL' },
        gallery: [
          { publicationApproved: false, file: 'PRIVATE_GALLERY_SENTINEL' }
        ],
        video: { publicationApproved: false, file: 'PRIVATE_VIDEO_SENTINEL' },
        links: {
          github: {
            url: 'PRIVATE_LINK_SENTINEL',
            verified: false,
            publicationApproved: true
          },
          live: {
            url: 'PRIVATE_LINK_SENTINEL',
            verified: true,
            publicationApproved: false
          }
        }
      })
    ],
    () => assert.fail('Unapproved files must not be read')
  )
  assert.ok(!JSON.stringify(result).includes('PRIVATE_'))
})

test('published work requires a truthful contribution and valid identity', () => {
  assert.throws(() =>
    selectPublishedProjects([fixture({ isOwnerWork: false })], asset)
  )
  assert.throws(() =>
    selectPublishedProjects(
      [fixture({ content: { de: { title: 'TEST FIXTURE' } } })],
      asset
    )
  )
  assert.throws(() =>
    selectPublishedProjects([fixture({ category: 'invalid' })], asset)
  )
  assert.throws(() => selectPublishedProjects([fixture(), fixture()], asset))
  assert.throws(() =>
    selectPublishedProjects([fixture({ slug: '../private' })], asset)
  )
})

test('unsafe approved URLs are rejected', () => {
  for (const url of [
    'javascript:alert(1)',
    'http://example.com',
    'https://name:secret@example.com'
  ]) {
    assert.throws(() =>
      selectPublishedProjects(
        [
          fixture({
            links: { live: { url, verified: true, publicationApproved: true } }
          })
        ],
        asset
      )
    )
  }
})

test('approved images have dimensions, alt text and no editorial fields', () => {
  const source = {
    id: 'fixture-image',
    file: 'media/projects/test.png',
    width: 1,
    height: 1,
    alt: { de: 'Test-only image', internal: 'PRIVATE_ALT_SENTINEL' },
    publicationApproved: true,
    internalNotes: 'PRIVATE_IMAGE_SENTINEL'
  }
  const [result] = selectPublishedProjects([fixture({ cover: source })], asset)
  assert.ok(result.cover.src)
  assert.ok(!JSON.stringify(result).includes('PRIVATE_'))
  assert.throws(() =>
    selectPublishedProjects(
      [fixture({ cover: { ...source, width: 0 } })],
      asset
    )
  )
  assert.throws(() =>
    selectPublishedProjects(
      [fixture({ cover: { ...source, alt: { de: '' } } })],
      asset
    )
  )
})

test('AI videos require attribution; unreviewed embeds are excluded', () => {
  const video = {
    kind: 'embed',
    provider: 'youtube',
    videoId: 'abcdefghijk',
    title: { de: 'Test-only video' },
    publicationApproved: true,
    privacyReviewApproved: true,
    aiAssisted: true
  }
  assert.throws(() => selectPublishedProjects([fixture({ video })], asset))
  const [result] = selectPublishedProjects(
    [
      fixture({
        video: { ...video, privacyReviewApproved: false }
      })
    ],
    asset
  )
  assert.equal(result.video, undefined)
})

test('query helpers preserve unrelated parameters and filter all categories', () => {
  const input = new URLSearchParams('view=compact&category=web')
  assert.equal(
    categoryParams(input, 'it').toString(),
    'view=compact&category=it'
  )
  assert.equal(input.toString(), 'view=compact&category=web')
  assert.equal(categoryParams(input, 'all').toString(), 'view=compact')
  assert.equal(readCategory(new URLSearchParams('category=unknown')), 'all')
  const publicRecords = ['web', 'it', 'creative'].map(
    (category, index) =>
      selectPublishedProjects(
        [
          fixture({
            category,
            id: 'fixture-' + index,
            slug: 'fixture-' + index
          })
        ],
        asset
      )[0]
  )
  assert.equal(filterProjects(publicRecords, 'all').length, 3)
  for (const category of ['web', 'it', 'creative']) {
    assert.deepEqual(
      filterProjects(publicRecords, category).map((record) => record.category),
      [category]
    )
  }
})

async function temporaryProject(run) {
  const qa = resolve(root, '.qa')
  await mkdir(qa, { recursive: true })
  const directory = await mkdtemp(join(qa, 'project-boundary-'))
  try {
    return await run(directory)
  } finally {
    assert.ok(directory.startsWith(qa + sep), 'Cleanup must remain in .qa')
    await rm(directory, { recursive: true, force: true })
  }
}

async function bundle(
  directory,
  records,
  entry = "import {projects} from 'virtual:portfolio-projects'; console.log(projects)"
) {
  const entryFile = join(directory, 'entry.js')
  await writeFile(entryFile, entry)
  return build({
    configFile: false,
    root: directory,
    logLevel: 'silent',
    plugins: [portfolioPlugin(records)],
    build: {
      write: false,
      assetsInlineLimit: 0,
      minify: false,
      rollupOptions: { input: entryFile }
    }
  })
}

test('actual bundling includes approved data and media but excludes draft sentinels', async () => {
  await temporaryProject(async (directory) => {
    await mkdir(join(directory, 'media/projects'), { recursive: true })
    await writeFile(
      join(directory, 'media/projects/test.png'),
      'PUBLIC_ASSET_FIXTURE_NOT_A_PHOTOGRAPH'
    )
    const published = fixture({
      cover: {
        id: 'fixture-image',
        file: 'media/projects/test.png',
        width: 1,
        height: 1,
        alt: { de: 'Test-only asset' },
        publicationApproved: true
      }
    })
    const result = await bundle(directory, [
      published,
      fixture({
        id: 'unpublished-fixture',
        slug: 'unpublished-fixture',
        status: 'draft',
        internalNotes: 'PRIVATE_BUILD_SENTINEL',
        content: { de: { title: 'PRIVATE_TITLE_SENTINEL' } },
        cover: { file: 'PRIVATE_FILE_SENTINEL', publicationApproved: true }
      })
    ])
    const code = result.output
      .filter((item) => item.type === 'chunk')
      .map((item) => item.code)
      .join('')
    assert.ok(code.includes('TEST FIXTURE'))
    assert.ok(!code.includes('PRIVATE_'))
    assert.ok(!code.includes('unpublished-fixture'))
    assert.ok(result.output.some((item) => item.type === 'asset'))
    assert.ok(!code.includes('media/projects/test.png'))
  })
})

test('direct, raw and URL imports of the registry fail instead of leaking records', async () => {
  await temporaryProject(async (directory) => {
    await mkdir(join(directory, 'src/data'), { recursive: true })
    await writeFile(
      join(directory, 'src/data/projects.ts'),
      "export const projects = ['PRIVATE_REGISTRY_SENTINEL']"
    )
    for (const suffix of ['', '?raw', '?url']) {
      const entry = suffix
        ? `import data from './src/data/projects.ts${suffix}'; console.log(data)`
        : "import {projects} from './src/data/projects.ts'; console.log(projects)"
      await assert.rejects(() => bundle(directory, [], entry), /build-only/)
    }
  })
})

test('approved media cannot escape the media directory', async () => {
  await temporaryProject(async (directory) => {
    const source = {
      id: 'fixture-image',
      file: 'media/projects/../../secret.png',
      width: 1,
      height: 1,
      alt: { de: 'Test-only asset' },
      publicationApproved: true
    }
    await assert.rejects(
      () => bundle(directory, [fixture({ cover: source })]),
      /web copies/
    )
  })
})

test('the real production bundle contains none of the actual draft records', async () => {
  const result = await build({
    root,
    logLevel: 'silent',
    build: { write: false }
  })
  const output = Array.isArray(result)
    ? result.flatMap((item) => item.output)
    : result.output
  const contents = output
    .map((item) => (item.type === 'chunk' ? item.code : String(item.source)))
    .join('\n')
  for (const marker of [
    '/dev/photo-comparison',
    '__dev-photo-pattern',
    'PhotoComparisonPreview',
    'CASE_CONTENT_DE.md',
    'Projektstatus und Fakten',
    'AGENTS.md',
    'PROJECT_BRIEF.md',
    'CONTENT.md',
    'ROADMAP.md',
    'SYNTHETISCHES TESTMUSTER',
    'KEINE FOTORESTAURIERUNG',
    'TEST_FIXTURE',
    'PRIVATE_'
  ]) {
    assert.ok(
      !contents.includes(marker),
      'Development or private marker leaked: ' + marker
    )
  }
  for (const chunk of output.filter((item) => item.type === 'chunk')) {
    for (const id of Object.keys(chunk.modules)) {
      assert.ok(
        !/\/(dev|tests)\//.test(id.replaceAll('\\', '/')),
        'Development module leaked: ' + id
      )
    }
  }
  for (const record of projects) {
    if (record.status !== 'published' || !record.publicationApproved) {
      assert.ok(
        !contents.includes(record.slug),
        'Draft slug leaked: ' + record.slug
      )
    }
    if (record.internalNotes)
      assert.ok(
        !contents.includes(record.internalNotes),
        'Internal note leaked'
      )
  }
  const { createHash } = await import('node:crypto')
  const jpegAssets = output.filter(
    (item) => item.type === 'asset' && item.fileName.endsWith('.jpg')
  )
  assert.equal(
    jpegAssets.length,
    3,
    'Only the three approved JPEGs should be emitted, without duplicate cover'
  )
  for (const name of ['original', 'photoshop', 'ai']) {
    const bytes = await readFile(
      join(root, 'public/media/projects/photo-restoration', name + '.jpg')
    )
    const hash = createHash('sha256').update(bytes).digest('hex')
    assert.equal(
      jpegAssets.filter(
        (item) =>
          createHash('sha256').update(item.source).digest('hex') === hash
      ).length,
      1
    )
  }
  assert.ok(!output.some((item) => /\.(md|pdf|svg)$/.test(item.fileName)))
  assert.match(contents, /Historische Fotorestaurierung/)
  assert.ok(!contents.includes('KI + Photoshop'))
  const webpAssets = output.filter(
    (item) => item.type === 'asset' && item.fileName.endsWith('.webp')
  )
  const studioflow = projects.find((project) => project.slug === 'studioflow')
  const webpFiles = [
    ...[studioflow.cover, ...studioflow.gallery].map((image) => image.file),
    ...projects
      .filter((project) => project.slug === 'it-support-lab')
      .flatMap((project) =>
        [project.cover, ...project.gallery].map((image) => image.file)
      ),
    'public/media/projects/portrait/maksym-portrait-640.webp',
    'public/media/projects/portrait/maksym-portrait-1200.webp'
  ]
  assert.equal(webpAssets.length, webpFiles.length)
  for (const file of webpFiles) {
    const bytes = await readFile(join(root, file))
    const hash = createHash('sha256').update(bytes).digest('hex')
    assert.equal(
      webpAssets.filter(
        (item) =>
          createHash('sha256').update(item.source).digest('hex') === hash
      ).length,
      1
    )
  }
  assert.ok(!contents.includes('C:\\\\Projekt\\\\Portfolio\\\\studioflow'))
  const homepage = await readFile(join(root, 'src/pages/HomePage.tsx'), 'utf8')
  assert.ok(
    homepage.includes('<Hero />'),
    'Phase 2 homepage should remain intact'
  )
})

test('AI restoration attribution is complete in every published translation', () => {
  const picture = {
    id: 'fixture-ai',
    file: 'media/projects/test.png',
    width: 1,
    height: 1,
    alt: { de: 'Test-only image' },
    publicationApproved: true
  }
  const content = {
    de: {
      title: 'TEST FIXTURE',
      contribution: 'Test-only role.',
      humanContribution: 'Test-only human role.',
      aiContribution: 'Test-only AI role.'
    },
    en: { title: 'TEST FIXTURE EN', contribution: 'Test-only role.' }
  }
  const source = fixture({
    content,
    restoration: { versions: { aiAssisted: picture } }
  })
  assert.throws(
    () => selectPublishedProjects([source], asset),
    /every published translation/
  )
  assert.doesNotThrow(() =>
    selectPublishedProjects(
      [
        {
          ...source,
          content: {
            ...content,
            en: {
              ...content.en,
              humanContribution: 'Test-only human role.',
              aiContribution: 'Test-only AI role.'
            }
          }
        }
      ],
      asset
    )
  )
})

test('restoration metadata is explicitly projected and comparison presentation is validated', () => {
  const picture = {
    id: 'fixture-original',
    file: 'media/projects/test.png',
    width: 800,
    height: 1200,
    alt: { de: 'TEST_FIXTURE metadata' },
    publicationApproved: true
  }
  const restoration = {
    versions: { original: picture },
    overview: {
      de: 'Test-only overview',
      private: 'PRIVATE_OVERVIEW_SENTINEL'
    },
    techniques: {
      de: ['Test-only technique'],
      private: 'PRIVATE_TECHNIQUE_SENTINEL'
    },
    presentation: {
      fit: 'contain',
      aspectRatio: 4 / 3,
      allowCropping: false,
      private: 'PRIVATE_FRAME_SENTINEL'
    }
  }
  const [result] = selectPublishedProjects([fixture({ restoration })], asset)
  assert.equal(result.restoration.overview.de, 'Test-only overview')
  assert.deepEqual(result.restoration.techniques.de, ['Test-only technique'])
  assert.equal(result.restoration.presentation.fit, 'contain')
  assert.equal(result.restoration.presentation.allowCropping, false)
  assert.ok(!JSON.stringify(result).includes('PRIVATE_'))
  for (const presentation of [
    { fit: 'invalid' },
    { aspectRatio: 0 },
    { aspectRatio: Infinity },
    { allowCropping: 'false' },
    { fit: 'cover', allowCropping: false }
  ]) {
    assert.throws(() =>
      selectPublishedProjects(
        [
          fixture({
            restoration: { ...restoration, presentation }
          })
        ],
        asset
      )
    )
  }
})

test('real JPEG dimensions and source hashes are preserved without conversion', async () => {
  const { createHash } = await import('node:crypto')
  const expected = {
    original:
      '24c93c6ab623472797855a896b0f814f12822a95b78db9f0f9f544450ceac828',
    photoshop:
      'b2df94ec8ee9fffa8a15469290961e99f2cb9ccb82f77172d69d06386bea8f24',
    ai: 'cb18071ca9c1103c5639a11c0a76c4c12401dea785b2e47b61c5e824dc7ba75d'
  }
  const record = projects.find(
    (project) => project.slug === 'photo-restoration'
  )
  assert.equal(
    record.cover.file,
    'public/media/projects/photo-restoration/photoshop.jpg'
  )
  assert.equal(record.origin, 'personal')
  assert.equal(record.restoration.presentation.allowCropping, false)
  assert.ok(!record.gallery?.length)
  assert.deepEqual(record.tools, ['Adobe Photoshop', 'AI image restoration'])
  for (const [name, hash] of Object.entries(expected)) {
    const bytes = await readFile(
      join(root, 'public/media/projects/photo-restoration', name + '.jpg')
    )
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash)
    assert.equal(bytes.readUInt16BE(0), 0xffd8)
    let dimensions
    for (let offset = 2; offset < bytes.length - 9;) {
      assert.equal(bytes[offset], 0xff)
      while (bytes[offset] === 0xff) offset++
      const marker = bytes[offset++]
      if (marker === 0xd9 || marker === 0xda) break
      if (
        [
          0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
          0xce, 0xcf
        ].includes(marker)
      ) {
        dimensions = {
          width: bytes.readUInt16BE(offset + 5),
          height: bytes.readUInt16BE(offset + 3)
        }
        break
      }
      offset += bytes.readUInt16BE(offset)
    }
    assert.deepEqual(dimensions, { width: 1334, height: 2048 }, name)
  }
})

test('StudioFlow entry separates completed browser demo from ongoing full-stack work', () => {
  const source = projects.find((record) => record.slug === 'studioflow')
  const [project] = selectPublishedProjects([source], asset)
  assert.equal(project.category, 'web')
  assert.equal(project.origin, 'personal')
  assert.equal(project.links.live, undefined)
  assert.equal(project.links.github, undefined)
  assert.match(project.content.de.demo, /Arbeitsspeicher/)
  assert.match(project.content.de.demo, /keine Live-API und keine Datenbank/)
  assert.match(
    project.content.de.chapters.find((item) => item.id === 'full-stack')
      .description,
    /nicht öffentlich verfügbar/
  )
  assert.match(
    project.content.de.chapters.find((item) => item.id === 'full-stack')
      .description,
    /nicht für den Produktivbetrieb freigegeben/
  )
  assert.deepEqual(project.tools, [
    'React',
    'TypeScript',
    'Vite',
    'CSS Modules',
    'React Router'
  ])
  assert.equal(project.cover.id, 'studio-dashboard')
  assert.equal(project.gallery.length, 3)
})

test('editorial chapters are whitelisted and validated without importing unapproved images', () => {
  const chapter = {
    id: 'overview',
    title: ' Title ',
    description: ' Body ',
    imageId: 'missing',
    bullets: [' Valid ', ''],
    internalNotes: 'PRIVATE_CHAPTER_SENTINEL'
  }
  const [project] = selectPublishedProjects(
    [
      fixture({
        content: {
          de: {
            title: 'Test',
            contribution: 'Test',
            chapters: [chapter],
            demo: ' Demo '
          }
        }
      })
    ],
    asset
  )
  assert.deepEqual(project.content.de.chapters, [
    {
      id: 'overview',
      title: 'Title',
      description: 'Body',
      imageId: 'missing',
      bullets: ['Valid']
    }
  ])
  assert.equal(project.content.de.demo, 'Demo')
  assert.ok(!JSON.stringify(project).includes('PRIVATE_CHAPTER'))
  for (const chapters of [[{ ...chapter, id: '../bad' }], [chapter, chapter]]) {
    assert.throws(
      () =>
        selectPublishedProjects(
          [
            fixture({
              content: {
                de: {
                  title: 'Test',
                  contribution: 'Test',
                  chapters
                }
              }
            })
          ],
          asset
        ),
      /chapter ids/
    )
  }
})
