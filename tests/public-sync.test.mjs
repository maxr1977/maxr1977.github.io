import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { preparePublic } from '../scripts/prepare-public.mjs'
import {
  allowedPublicPath,
  assertPublicGit,
  publicContentEqual,
  syncPublic
} from '../scripts/sync-public.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
test('line endings do not create text-only churn while media remain byte-exact', () => {
  assert.equal(
    publicContentEqual(
      'src/main.tsx',
      Buffer.from('same\r\n'),
      Buffer.from('same\n')
    ),
    true
  )
  assert.equal(
    publicContentEqual(
      'src/main.tsx',
      Buffer.from('old\r\n'),
      Buffer.from('new\n')
    ),
    false
  )
  assert.equal(
    publicContentEqual(
      'public/media/projects/case/original.jpg',
      Buffer.from('same\r\n'),
      Buffer.from('same\n')
    ),
    false
  )
})
test('public synchronization rejects unsafe paths, origins, branches and dirty checkouts', () => {
  for (const path of [
    '.git/config',
    'src/../../.git/config',
    'private/data.json',
    '.env',
    'dist/index.html',
    'node_modules/index.js',
    'src\\bad.ts',
    '/src/a.ts',
    'src/.env',
    '.qa/report.json'
  ])
    assert.equal(allowedPublicPath(path), false, path)
  for (const path of [
    'src/App.tsx',
    'tests/public-sync.test.mjs',
    '.github/workflows/deploy.yml',
    'public/media/projects/photo-restoration/original.jpg'
  ])
    assert.equal(allowedPublicPath(path), true, path)
  const target = resolve(root, '../mock-public')
  const state = {
    top: target,
    branch: 'main',
    dirty: '',
    origin: 'https://github.com/maxr1977/maxr1977.github.io.git',
    pushOrigin: 'https://github.com/maxr1977/maxr1977.github.io.git',
    head: 'TEST_SAME_COMMIT',
    remoteHead: 'TEST_SAME_COMMIT'
  }
  assert.doesNotThrow(() => assertPublicGit(state, target))
  for (const patch of [
    { top: root },
    { branch: 'feature' },
    { remoteHead: 'TEST_OTHER_COMMIT' },
    { pushOrigin: 'https://github.com/other/repo.git' },
    { dirty: ' M src/App.tsx' },
    { origin: 'https://example.com/maxr1977/maxr1977.github.io.git' },
    { origin: 'https://github.com/other/repo.git' }
  ])
    assert.throws(() => assertPublicGit({ ...state, ...patch }, target))
})

test('export protects existing and descendant Git checkouts without touching metadata', async () => {
  const directory = await mkdtemp(resolve(root, '.release/test-checkout-'))
  try {
    await mkdir(resolve(directory, '.git'))
    await writeFile(
      resolve(directory, '.git/config'),
      'TEST_ONLY_HISTORY_SENTINEL'
    )
    await assert.rejects(
      preparePublic(root, resolve(directory, 'nested-export')),
      /inside a Git checkout/
    )
    await assert.rejects(preparePublic(root, directory), /already exists/)
    assert.equal(
      await readFile(resolve(directory, '.git/config'), 'utf8'),
      'TEST_ONLY_HISTORY_SENTINEL'
    )
  } finally {
    assert.ok(directory.startsWith(resolve(root, '.release') + sep))
    await rm(directory, { recursive: true, force: true })
  }
})

test('isolated sync dry-run, apply, stale deletion and rollback preserve Git metadata', async (t) => {
  const directory = await mkdtemp(resolve(root, '.release/test-sync-'))
  try {
    const original = resolve(directory, 'original-export')
    await preparePublic(root, original)
    const privateRoot = resolve(directory, 'private')
    await cp(original, privateRoot, { recursive: true })
    const source = resolve(privateRoot, '.release/export')
    await mkdir(resolve(privateRoot, '.release'))
    await cp(original, source, { recursive: true })
    const destination = resolve(directory, 'public')
    await cp(original, destination, { recursive: true })
    await mkdir(resolve(destination, '.git'))
    await writeFile(
      resolve(destination, '.git/config'),
      'TEST_ONLY_GIT_SENTINEL'
    )
    const { sourceFiles, approvedMedia } =
      await import('../scripts/public-source.mjs')
    const { projects } = await import('../src/data/projects.ts')
    const tracked = [
      ...(await sourceFiles(privateRoot)),
      ...approvedMedia(projects),
      'README.md'
    ]
    const state = {
      top: destination,
      branch: 'main',
      dirty: '',
      origin: 'https://github.com/maxr1977/maxr1977.github.io.git',
      pushOrigin: 'https://github.com/maxr1977/maxr1977.github.io.git',
      head: 'TEST_SAME_COMMIT',
      remoteHead: 'TEST_SAME_COMMIT',
      tracked
    }
    const dependencies = {
      getGit: () => state,
      gate: () => {},
      audit: async () => ({ findings: [] })
    }
    const options = { root: privateRoot, from: source, to: destination }
    const current = await readFile(resolve(source, 'src/main.tsx'))
    await writeFile(
      resolve(destination, 'src/main.tsx'),
      '// previous reviewed version\n'
    )
    await writeFile(
      resolve(destination, 'src/obsolete.ts'),
      '// stale public file\n'
    )
    state.tracked.push('src/obsolete.ts')
    await t.test(
      'dry-run reports without writing, including safe stale-file deletion',
      async () => {
        const report = await syncPublic(options, dependencies)
        assert.equal(report.mode, 'dry-run')
        assert.equal(report.modified, 1)
        assert.equal(report.deleted, 1)
        assert.match(
          await readFile(resolve(destination, 'src/main.tsx'), 'utf8'),
          /previous/
        )
        assert.match(
          await readFile(resolve(destination, 'src/obsolete.ts'), 'utf8'),
          /stale/
        )
      }
    )
    await t.test(
      'failed post-sync gate rolls back both writes and deletion',
      async () => {
        let gates = 0
        await assert.rejects(
          syncPublic(
            { ...options, apply: true },
            {
              ...dependencies,
              gate: () => {
                if (++gates === 3) throw new Error('TEST_ONLY_GATE_FAILURE')
              }
            }
          ),
          /TEST_ONLY_GATE_FAILURE/
        )
        assert.match(
          await readFile(resolve(destination, 'src/main.tsx'), 'utf8'),
          /previous/
        )
        assert.match(
          await readFile(resolve(destination, 'src/obsolete.ts'), 'utf8'),
          /stale/
        )
      }
    )
    await t.test(
      'explicit apply updates approved files and preserves Git bytes',
      async () => {
        const report = await syncPublic(
          { ...options, apply: true },
          dependencies
        )
        assert.equal(report.mode, 'apply')
        assert.deepEqual(
          await readFile(resolve(destination, 'src/main.tsx')),
          current
        )
        await assert.rejects(readFile(resolve(destination, 'src/obsolete.ts')))
        assert.equal(
          await readFile(resolve(destination, '.git/config'), 'utf8'),
          'TEST_ONLY_GIT_SENTINEL'
        )
      }
    )
    state.tracked = state.tracked.filter((path) => path !== 'src/obsolete.ts')
    await t.test(
      'private materials or a stale export block before apply',
      async () => {
        await writeFile(resolve(source, 'private.json'), '{}')
        await assert.rejects(syncPublic(options, dependencies), /inventory/)
        await rm(resolve(source, 'private.json'))
        await writeFile(resolve(source, 'src/main.tsx'), '// unexpected change')
        await assert.rejects(
          syncPublic(options, dependencies),
          /Stale or changed export/
        )
        await writeFile(resolve(source, 'src/main.tsx'), current)
      }
    )
    await t.test(
      'audit failures and nested destinations stop synchronization',
      async () => {
        await assert.rejects(
          syncPublic(options, {
            ...dependencies,
            audit: async () => ({ findings: ['TEST_ONLY_FINDING'] })
          }),
          /audit failed/
        )
        await assert.rejects(
          syncPublic(
            { ...options, to: resolve(privateRoot, '.release/public') },
            dependencies
          ),
          /separate checkout/
        )
      }
    )
  } finally {
    assert.ok(directory.startsWith(resolve(root, '.release') + sep))
    await rm(directory, { recursive: true, force: true })
  }
})
