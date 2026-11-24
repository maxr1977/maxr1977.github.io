import {
  mkdir,
  readFile,
  writeFile,
  copyFile,
  realpath,
  stat
} from 'node:fs/promises'
import { resolve, dirname, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { projects } from '../src/data/projects.ts'
import { sourceFiles, publicRecords, approvedMedia } from './public-source.mjs'

export async function preparePublic(root, output, records = projects) {
  root = await realpath(root)
  const releaseRoot = resolve(root, '.release')
  output = resolve(root, output)
  if (!output.startsWith(releaseRoot + sep))
    throw new Error('Export must stay inside the workspace .release directory.')
  try {
    await stat(output)
    throw new Error(
      'Export already exists; use a fresh output path. Nothing was overwritten.'
    )
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  await mkdir(releaseRoot, { recursive: true })
  if ((await realpath(releaseRoot)) !== releaseRoot)
    throw new Error('Export parent must not be a symlink.')
  const cleanRecords = publicRecords(records)
  const files = [
    ...new Set([...(await sourceFiles(root)), ...approvedMedia(records)])
  ]
  await mkdir(output, { recursive: true })
  for (const file of files) {
    if (file === 'src/data/projects.ts') continue
    const source = resolve(root, file)
    if (!source.startsWith(root + sep) || (await realpath(source)) !== source)
      throw new Error('Unsafe export source: ' + file)
    const target = resolve(output, file)
    await mkdir(dirname(target), { recursive: true })
    await copyFile(source, target)
  }
  const registry =
    "import type { ProjectRecord } from '../types/project'\n\n// Public snapshot: approved records only. Keep private planning in the local source repository.\nexport const projects: readonly ProjectRecord[] = " +
    JSON.stringify(cleanRecords, null, 2) +
    '\n'
  await writeFile(resolve(output, 'src/data/projects.ts'), registry)
  await writeFile(
    resolve(output, 'README.md'),
    await readFile(resolve(root, 'docs/GITHUB_PAGES_RELEASE.md'))
  )
  const forbidden = records
    .filter(
      (record) => record.status !== 'published' || !record.publicationApproved
    )
    .map((record) => record.slug)
  for (const file of [
    ...files.filter((file) => !/\.(jpg|webp)$/.test(file)),
    'README.md'
  ]) {
    const text = await readFile(resolve(output, file), 'utf8')
    if (forbidden.some((marker) => text.includes(marker)))
      throw new Error('Private draft identifier remains in export: ' + file)
  }
  return {
    output,
    files: files.length + 1,
    projects: cleanRecords.length,
    media: approvedMedia(records).length,
    privateGitHistoryCopied: false
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const index = process.argv.indexOf('--out')
  const output = index < 0 ? '.release/public-source' : process.argv[index + 1]
  if (!output) throw new Error('Missing --out path')
  console.log(
    JSON.stringify(await preparePublic(process.cwd(), output), null, 2)
  )
}
