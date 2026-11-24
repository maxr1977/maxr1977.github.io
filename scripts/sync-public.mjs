import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import {
  lstat,
  readdir,
  readFile,
  realpath,
  mkdir,
  writeFile,
  unlink
} from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { projects } from '../src/data/projects.ts'
import { sourceFiles, approvedMedia, publicRecords } from './public-source.mjs'
import { auditRepository } from './audit-repository.mjs'

const rootNames = new Set([
  'README.md',
  '.gitignore',
  'index.html',
  'package.json',
  'package-lock.json',
  'eslint.config.js',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'docs/GITHUB_PAGES_RELEASE.md'
])
export function allowedPublicPath(path) {
  if (
    path.includes('\\') ||
    path
      .split('/')
      .some((part) => !part || part === '.' || part === '..' || part === '.git')
  )
    return false
  return (
    rootNames.has(path) ||
    /^(?:src|build|dev|tests|scripts)\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(?:tsx?|css|m?js|json)$/.test(
      path
    ) ||
    /^\.github\/workflows\/[a-zA-Z0-9_-]+\.ya?ml$/.test(path) ||
    /^public\/media\/projects\/(?:[a-zA-Z0-9_-]+\/)+[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp|svg)$/.test(
      path
    )
  )
}
const digest = (buffer) => createHash('sha256').update(buffer).digest('hex')
export function publicContentEqual(path, left, right) {
  // Git checkouts may use LF or CRLF. Do not rewrite otherwise unchanged text.
  // Approved media, including the original JPEGs, always use byte comparison.
  return path.startsWith('public/')
    ? left.equals(right)
    : left.toString('utf8').replaceAll('\r\n', '\n') ===
        right.toString('utf8').replaceAll('\r\n', '\n')
}
const inside = (parent, child) =>
  child === parent || child.startsWith(parent + sep)
async function absent(path) {
  try {
    await lstat(path)
    return false
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    return true
  }
}
async function safeFile(root, file) {
  if (!allowedPublicPath(file))
    throw new Error('Path outside public allowlist: ' + file)
  const path = resolve(root, file)
  if (!inside(root, path)) throw new Error('Path escape')
  for (let current = path; current !== root; current = dirname(current)) {
    if (
      !(await absent(current)) &&
      ((await lstat(current)).isSymbolicLink() ||
        (await realpath(current)) !== current)
    )
      throw new Error('Symlink/junction rejected: ' + file)
  }
  return path
}
async function walk(root, prefix = '') {
  const files = []
  for (const entry of await readdir(resolve(root, prefix), {
    withFileTypes: true
  })) {
    const path = prefix + entry.name
    if (entry.isSymbolicLink()) throw new Error('Symlink rejected: ' + path)
    if (entry.isDirectory()) files.push(...(await walk(root, path + '/')))
    else files.push(path)
  }
  return files.sort()
}
const gitCommand = (root, ...args) =>
  execFileSync(
    'git',
    [
      '--no-optional-locks',
      '-c',
      'safe.directory=' + root.replaceAll('\\', '/'),
      ...args
    ],
    { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  ).trim()
export function assertPublicGit(state, target) {
  if (resolve(state.top) !== target || state.branch !== 'main' || state.dirty)
    throw new Error('Expected a clean, independent main checkout.')
  if (!state.head || state.head !== state.remoteHead)
    throw new Error(
      'Checkout must match the fetched origin/main; review divergence first.'
    )
  if (
    !/^(?:https:\/\/github\.com\/|git@github\.com:)maxr1977\/maxr1977\.github\.io(?:\.git)?$/.test(
      state.origin
    )
  )
    throw new Error('Unexpected public origin.')
  if (state.pushOrigin !== state.origin)
    throw new Error('Unexpected public push URL.')
}
function readGit(target) {
  return {
    top: gitCommand(target, 'rev-parse', '--show-toplevel'),
    branch: gitCommand(target, 'branch', '--show-current'),
    dirty: gitCommand(
      target,
      'status',
      '--porcelain=v1',
      '--untracked-files=all'
    ),
    origin: gitCommand(target, 'remote', 'get-url', '--all', 'origin'),
    pushOrigin: gitCommand(
      target,
      'remote',
      'get-url',
      '--push',
      '--all',
      'origin'
    ),
    head: gitCommand(target, 'rev-parse', 'HEAD'),
    remoteHead: gitCommand(target, 'rev-parse', 'refs/remotes/origin/main'),
    tracked: gitCommand(target, 'ls-files', '-z').split('\0').filter(Boolean)
  }
}
async function metadataHash(target) {
  const directory = resolve(target, '.git')
  const entries = []
  for (const path of await walk(directory))
    entries.push([path, digest(await readFile(resolve(directory, path)))])
  return digest(JSON.stringify(entries))
}
function releaseGate(root) {
  execFileSync(
    process.execPath,
    ['--experimental-strip-types', 'scripts/check-release.mjs'],
    { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] }
  )
}
export async function syncPublic(
  { root, from, to, apply = false },
  dependencies = {}
) {
  // Dependency injection is used only by isolated filesystem tests, never CLI flags.
  const getGit = dependencies.getGit ?? readGit
  const audit = dependencies.audit ?? auditRepository
  const gate = dependencies.gate ?? releaseGate
  root = await realpath(root)
  const source = resolve(root, from)
  const target = resolve(root, to)
  if (
    !inside(resolve(root, '.release'), source) ||
    source === resolve(root, '.release') ||
    (await realpath(source)) !== source
  )
    throw new Error('Source must be a real clean export inside .release.')
  if (
    inside(root, target) ||
    inside(target, root) ||
    inside(source, target) ||
    (await realpath(target)) !== target
  )
    throw new Error(
      'Destination must be a separate checkout outside the private project.'
    )
  const gitPath = resolve(target, '.git')
  if (
    !(await lstat(gitPath)).isDirectory() ||
    (await realpath(gitPath)) !== gitPath
  )
    throw new Error(
      'Expected an ordinary checkout with its own .git directory.'
    )
  for (
    let parent = source;
    inside(resolve(root, '.release'), parent);
    parent = dirname(parent)
  ) {
    if (
      !(await absent(resolve(parent, '.git'))) ||
      (await realpath(parent)) !== parent
    )
      throw new Error('Export must not be inside a checkout or symlink.')
  }
  const state = getGit(target)
  assertPublicGit(state, target)
  const expected = [
    ...new Set([
      ...(await sourceFiles(root)),
      ...approvedMedia(projects),
      'README.md'
    ])
  ].sort()
  const actual = await walk(source)
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error('Export inventory differs from the intended public source.')
  const registry =
    "import type { ProjectRecord } from '../types/project'\n\n// Public snapshot: approved records only. Keep private planning in the local source repository.\nexport const projects: readonly ProjectRecord[] = " +
    JSON.stringify(publicRecords(projects), null, 2) +
    '\n'
  const sourceHashes = new Map()
  for (const file of expected) {
    const bytes = await readFile(await safeFile(source, file))
    const current =
      file === 'src/data/projects.ts'
        ? Buffer.from(registry)
        : await readFile(
            await safeFile(
              root,
              file === 'README.md' ? 'docs/GITHUB_PAGES_RELEASE.md' : file
            )
          )
    if (digest(bytes) !== digest(current))
      throw new Error('Stale or changed export: ' + file)
    sourceHashes.set(file, digest(bytes))
  }
  gate(root)
  gate(source)
  for (const [directory, options] of [
    [source, { snapshot: true }],
    [target, {}]
  ]) {
    if ((await audit(directory, options)).findings.length)
      throw new Error('Source/history audit failed.')
  }
  const tracked = new Set(state.tracked)
  const all = [...new Set([...expected, ...tracked])].sort()
  if (new Set(all.map((path) => path.toLowerCase())).size !== all.length)
    throw new Error('Case-colliding public paths.')
  const changes = []
  for (const file of all) {
    const destination = await safeFile(target, file)
    const exists = !(await absent(destination))
    if (!tracked.has(file) && exists)
      throw new Error('Untracked or ignored destination collision: ' + file)
    if (!sourceHashes.has(file)) changes.push({ action: 'delete', path: file })
    else if (!exists) changes.push({ action: 'add', path: file })
    else if (
      !publicContentEqual(
        file,
        await readFile(destination),
        await readFile(await safeFile(source, file))
      )
    )
      changes.push({ action: 'modify', path: file })
  }
  const metadataBefore = await metadataHash(target)
  const report = {
    mode: apply ? 'apply' : 'dry-run',
    source,
    destination: target,
    added: changes.filter((item) => item.action === 'add').length,
    modified: changes.filter((item) => item.action === 'modify').length,
    deleted: changes.filter((item) => item.action === 'delete').length,
    changes,
    gitMetadataUnchanged: true
  }
  if (!apply) return report
  assertPublicGit(getGit(target), target)
  const originals = new Map()
  try {
    for (const { path, action } of changes) {
      const destination = await safeFile(target, path)
      originals.set(
        path,
        (await absent(destination)) ? null : await readFile(destination)
      )
      if (action === 'delete') await unlink(destination)
      else {
        const bytes = await readFile(await safeFile(source, path))
        if (digest(bytes) !== sourceHashes.get(path))
          throw new Error('Export changed during synchronization.')
        await mkdir(dirname(destination), { recursive: true })
        await writeFile(destination, bytes)
      }
    }
    if ((await audit(target)).findings.length)
      throw new Error('Post-sync public audit failed.')
    gate(target)
    if ((await metadataHash(target)) !== metadataBefore)
      throw new Error('Git metadata changed concurrently. Stop and inspect.')
  } catch (error) {
    for (const [path, bytes] of originals) {
      const destination = await safeFile(target, path)
      if (bytes === null) {
        if (!(await absent(destination))) await unlink(destination)
      } else await writeFile(destination, bytes)
    }
    throw error
  }
  return report
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const args = process.argv.slice(2)
  const options = { root: process.cwd() }
  for (let index = 0; index < args.length; index++) {
    const key = args[index]
    if (key === '--apply' && !options.apply) options.apply = true
    else if (
      ['--from', '--to'].includes(key) &&
      !options[key.slice(2)] &&
      args[index + 1] &&
      !args[index + 1].startsWith('--')
    )
      options[key.slice(2)] = args[++index]
    else
      throw new Error(
        'Use --from EXPORT --to CHECKOUT [--apply], without duplicate options.'
      )
  }
  if (!options.from || !options.to)
    throw new Error('Both --from and --to are required.')
  console.log(JSON.stringify(await syncPublic(options), null, 2))
}
