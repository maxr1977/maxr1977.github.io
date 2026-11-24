import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { sourceFiles } from './public-source.mjs'

const sensitivePath = (path) =>
  /(^|\/)(?:private|reference|\.qa|\.playwright-mcp|\.release|node_modules|dist|reports|coverage|test-results|playwright-report)(\/|$)/i.test(
    path
  ) ||
  (/(^|\/)(?:\.env(?:\..+)?|\.npmrc|AGENTS\.md|CONTENT\.md|ROADMAP\.md|PROJECT_BRIEF\.md|DESIGN\.md)$/i.test(
    path
  ) &&
    !path.endsWith('.env.example')) ||
  /\.(?:pem|key|pdf|psd|psb)$/i.test(path)
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{32,})\b/
]

export function inspectText(path, text) {
  const findings = []
  if (secretPatterns.some((pattern) => pattern.test(text)))
    findings.push('credential-pattern')
  if (path === 'src/data/projects.ts') {
    if (/["']?status["']?\s*:\s*["'](?:draft|ready)["']/.test(text))
      findings.push('unpublished-project-records')
    if (/["']?internalNotes["']?\s*:/.test(text))
      findings.push('internal-project-notes')
  }
  return findings
}

export async function auditRepository(root, { snapshot = false } = {}) {
  root = resolve(root)
  const git = (...args) =>
    execFileSync(
      'git',
      [
        '--no-optional-locks',
        '-c',
        'safe.directory=' + root.replaceAll('\\', '/'),
        ...args
      ],
      {
        cwd: root,
        maxBuffer: 100 * 1024 * 1024,
        stdio: ['pipe', 'pipe', 'pipe']
      }
    )
  let ownHistory = false
  try {
    ownHistory =
      resolve(git('rev-parse', '--show-toplevel').toString().trim()) === root
  } catch {
    /* Fresh public snapshot has no repository yet. */
  }
  const paths = ownHistory
    ? [
        ...new Set(
          (
            git('ls-files').toString() +
            git('ls-files', '--others', '--exclude-standard').toString()
          )
            .trim()
            .split(/\r?\n/)
            .filter(Boolean)
        )
      ]
    : [...(await sourceFiles(root)), 'README.md']
  const findings = []
  const add = (kind, path, object) =>
    findings.push({
      kind,
      path,
      ...(object ? { object: object.slice(0, 12) } : {})
    })
  if (!ownHistory && !snapshot) add('git-history-not-initialized', '.git')
  for (const path of paths) {
    if (sensitivePath(path)) add('sensitive-tracked-path', path)
    if (
      /\.(?:tsx?|m?js|json|ya?ml|md|html|css)$/.test(path) ||
      path === '.gitignore'
    ) {
      for (const kind of inspectText(
        path,
        await readFile(resolve(root, path), 'utf8')
      ))
        add(kind, path)
    }
  }
  let commits = 0,
    blobs = 0
  if (ownHistory) {
    commits = Number(git('rev-list', '--all', '--count').toString())
    const historicPaths = [
      ...new Set(
        git('log', '--all', '--format=', '--name-only')
          .toString()
          .split(/\r?\n/)
          .filter(Boolean)
      )
    ]
    for (const path of historicPaths)
      if (sensitivePath(path)) add('sensitive-historic-path', path)
    const objects = git('rev-list', '--objects', '--all')
      .toString()
      .split(/\r?\n/)
      .map((line) => {
        const space = line.indexOf(' ')
        return space < 0
          ? null
          : { id: line.slice(0, space), path: line.slice(space + 1) }
      })
      .filter(
        (item) =>
          item && /\.(?:tsx?|m?js|json|ya?ml|md|html|css)$/.test(item.path)
      )
    if (objects.length) {
      const bytes = execFileSync(
        'git',
        [
          '--no-optional-locks',
          '-c',
          'safe.directory=' + root.replaceAll('\\', '/'),
          'cat-file',
          '--batch'
        ],
        {
          cwd: root,
          input: objects.map((item) => item.id).join('\n') + '\n',
          maxBuffer: 100 * 1024 * 1024
        }
      )
      let offset = 0
      for (const object of objects) {
        const end = bytes.indexOf(10, offset)
        const header = bytes.subarray(offset, end).toString().split(' ')
        const size = Number(header[2])
        if (!Number.isFinite(size)) throw new Error('Invalid Git object header')
        const text = bytes.subarray(end + 1, end + 1 + size).toString('utf8')
        offset = end + 1 + size + 1
        if (header[1] !== 'blob') continue
        blobs++
        for (const kind of inspectText(object.path, text))
          add('history-' + kind, object.path, object.id)
      }
    }
  }
  return {
    ownHistory,
    snapshotOnly: !ownHistory,
    commits,
    textBlobs: blobs,
    trackedFiles: paths.length,
    findings,
    limits:
      'Best-effort path and credential-pattern scan; not a complete secret or copyright audit. Values are never printed.'
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = await auditRepository(process.cwd(), {
    snapshot: process.argv.includes('--snapshot')
  })
  console.log(JSON.stringify(report, null, 2))
  if (report.findings.length) process.exitCode = 1
}
