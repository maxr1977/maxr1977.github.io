import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, readFile, writeFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { build } from 'vite'
import { projects } from '../src/data/projects.ts'
import { selectPublishedProjects } from '../build/projectPublication.ts'
import { releaseBlockers, releaseStatus } from '../src/data/release.ts'
import { checkRelease } from '../scripts/check-release.mjs'
import { inspectText, auditRepository } from '../scripts/audit-repository.mjs'
import { publicRecords, approvedMedia } from '../scripts/public-source.mjs'
import { preparePublic } from '../scripts/prepare-public.mjs'
import { githubPagesPlugin } from '../build/githubPagesPlugin.ts'

const root = fileURLToPath(new URL('../', import.meta.url))

test('Pages build has a 200-capable directory index for every approved public route and a separate 404', async () => {
  const result = await build({
    root,
    logLevel: 'silent',
    build: { write: false }
  })
  const files = result.output ?? result.flatMap((bundle) => bundle.output)
  const shell = files.find((file) => file.fileName === 'index.html')
  const expected = [
    'index.html',
    'projekte/index.html',
    'impressum/index.html',
    'datenschutz/index.html',
    ...selectPublishedProjects(projects, (file) => file).map(
      (project) => 'projekte/' + project.slug + '/index.html'
    ),
    '404.html'
  ]
  assert.deepEqual(
    files
      .filter((file) => file.fileName.endsWith('.html'))
      .map((file) => file.fileName)
      .sort(),
    expected.sort()
  )
  for (const path of expected)
    assert.deepEqual(
      files.find((file) => file.fileName === path).source,
      shell.source
    )
  assert.ok(files.some((file) => file.fileName === '.nojekyll'))
  assert.match(String(shell.source), /src="\/assets\/[^"]+\.js"/)
  for (const record of projects.filter(
    (record) => record.status !== 'published' || !record.publicationApproved
  )) {
    assert.ok(!files.some((file) => file.fileName.includes(record.slug)))
  }
})

test('root base and conditional robots preserve blocked previews while allowing a reviewed release', async () => {
  const config = await readFile(
    new URL('../vite.config.ts', import.meta.url),
    'utf8'
  )
  assert.match(config, /base: '\/'/)
  const input = '<meta name="robots" content="noindex, nofollow" />'
  assert.equal(githubPagesPlugin([], false).transformIndexHtml(input), input)
  assert.match(
    githubPagesPlugin([], true).transformIndexHtml(input),
    /index, follow/
  )
})

test('owner approval cannot bypass legal, media, source or open privacy items', () => {
  assert.equal(releaseStatus.hostingProvider, 'GitHub Pages')
  assert.equal(releaseStatus.publicationApproved, true)
  const ready = {
    publicationApproved: true,
    legalReviewApproved: true,
    assetRightsApproved: true,
    repositoryReviewApproved: true,
    hostingProvider: 'GitHub Pages',
    openItems: []
  }
  const completePrivacy = { sections: [{ paragraphs: ['Reviewed notice.'] }] }
  assert.deepEqual(checkRelease(ready, completePrivacy), [])
  for (const flag of [
    'publicationApproved',
    'legalReviewApproved',
    'assetRightsApproved',
    'repositoryReviewApproved'
  ])
    assert.ok(releaseBlockers({ ...ready, [flag]: false }).length)
  assert.ok(releaseBlockers({ ...ready, hostingProvider: null }).length)
  assert.ok(
    checkRelease(ready, {
      sections: [{ paragraphs: ['OFFEN: actual unresolved item'] }]
    }).length
  )
  assert.ok(
    checkRelease(
      { ...ready, openItems: ['Unresolved rights.'] },
      completePrivacy
    ).length
  )
})

test('public records are derived once from the existing publication projection with no private source fields', () => {
  const clean = publicRecords(projects)
  assert.equal(clean.length, 3)
  assert.ok(!JSON.stringify(clean).includes('internalNotes'))
  assert.ok(
    clean.every(
      (record) =>
        record.status === 'published' && record.publicationApproved === true
    )
  )
  assert.deepEqual(
    selectPublishedProjects(clean, (file) => file),
    selectPublishedProjects(projects, (file) => file)
  )
  assert.equal(new Set(approvedMedia(projects)).size, 13)
})

test('legal readiness describes informed owner approval without claiming independent professional certification', () => {
  const approval = releaseStatus.legalApproval
  assert.equal(approval.kind, 'owner-informed-publication-approval')
  assert.equal(approval.approvedBy, 'Maksym Rechyn')
  assert.match(approval.approvedOn, /^\d{4}-\d{2}-\d{2}$/)
  assert.match(approval.approvedTextsSha256, /^[a-f0-9]{64}$/)
  assert.equal(approval.independentProfessionalCertification, false)
  assert.ok(releaseStatus.acknowledgedUncertainties.length > 0)
  if (releaseStatus.legalReviewApproved && releaseStatus.openItems.length === 0)
    assert.deepEqual(checkRelease(), [])
  assert.ok(
    checkRelease({ ...releaseStatus, legalReviewApproved: false }).length > 0
  )
})

test('source inspection detects unpublished registry data and token/key patterns without reporting secret values', () => {
  assert.ok(
    inspectText(
      'src/data/projects.ts',
      'status: "draft", internalNotes: "test"'
    ).includes('unpublished-project-records')
  )
  const token = 'gh' + 'p_' + 'a'.repeat(36)
  const key = '-----BEGIN ' + 'RSA PRIVATE KEY-----'
  assert.deepEqual(inspectText('test.txt', token), ['credential-pattern'])
  assert.deepEqual(inspectText('test.txt', key), ['credential-pattern'])
  assert.ok(!JSON.stringify(inspectText('test.txt', token)).includes(token))
})

test('clean export copies only approved source/media, excludes history and refuses overwrite or escape', async () => {
  // Fresh directory inside the declared workspace, never a computed outside deletion target.
  await mkdir(resolve(root, '.release'), { recursive: true })
  const directory = await mkdtemp(resolve(root, '.release/test-public-'))
  const target = resolve(directory, 'snapshot')
  try {
    const report = await preparePublic(root, target)
    assert.equal(report.projects, 3)
    assert.equal(report.media, 13)
    const source = await readFile(
      resolve(target, 'src/data/projects.ts'),
      'utf8'
    )
    assert.ok(!source.includes('internalNotes'))
    for (const record of projects.filter(
      (record) => record.status !== 'published' || !record.publicationApproved
    ))
      assert.ok(!source.includes(record.slug))
    await assert.rejects(readFile(resolve(target, '.git/config')))
    await assert.rejects(readFile(resolve(target, 'CONTENT.md')))
    await assert.rejects(
      readFile(resolve(target, '.qa/refinement/browser-results.json'))
    )
    for (const file of approvedMedia(projects))
      assert.deepEqual(
        await readFile(resolve(target, file)),
        await readFile(resolve(root, file))
      )
    const audit = await auditRepository(target, { snapshot: true })
    assert.equal(audit.ownHistory, false)
    assert.deepEqual(audit.findings, [])
    await assert.rejects(preparePublic(root, target), /already exists/)
    await assert.rejects(
      preparePublic(root, resolve(root, 'outside-export')),
      /inside/
    )
    // Snapshot inspections also catch a newly introduced token; it never leaves this test.
    await writeFile(
      resolve(target, 'src/isolated-test.js'),
      'export const test = "' + 'gh' + 'p_' + 'a'.repeat(36) + '"'
    )
    assert.ok(
      (await auditRepository(target, { snapshot: true })).findings.some(
        (item) => item.kind === 'credential-pattern'
      )
    )
  } finally {
    assert.ok(resolve(directory).startsWith(resolve(root, '.release') + sep))
    await rm(directory, { recursive: true, force: true })
  }
})

test('Pages workflow uploads dist only after audits and release gate with least privilege and main/repository guards', async () => {
  const workflow = await readFile(
    new URL('../.github/workflows/deploy.yml', import.meta.url),
    'utf8'
  )
  for (const value of [
    'branches: [main]',
    "github.repository == 'maxr1977/maxr1977.github.io'",
    'persist-credentials: false',
    'fetch-depth: 0',
    'npm ci',
    'npm run typecheck',
    'npm run lint',
    'npm test',
    'npm audit --audit-level=moderate',
    'npm run audit:repository',
    'npm run check:release',
    'path: dist',
    'name: github-pages'
  ])
    assert.ok(workflow.includes(value), value)
  assert.ok(
    workflow.indexOf('npm run check:release') <
      workflow.indexOf('actions/upload-pages-artifact')
  )
  const [buildJob, deployJob] = workflow.split('\n  deploy:')
  assert.ok(
    !buildJob.includes('pages: write') && !buildJob.includes('id-token: write')
  )
  assert.ok(
    deployJob.includes('pages: write') && deployJob.includes('id-token: write')
  )
  assert.ok(
    !workflow.includes('pull_request_target') &&
      !workflow.includes('continue-on-error')
  )
})
