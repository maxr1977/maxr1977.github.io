import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { selectPublishedProjects } from '../build/projectPublication.ts'

export async function sourceFiles(root) {
  const files = []
  async function walk(directory) {
    for (const entry of await readdir(join(root, directory), {
      withFileTypes: true
    })) {
      const path = directory + '/' + entry.name
      if (entry.isSymbolicLink())
        throw new Error('Public source must not contain symlinks: ' + path)
      if (entry.isDirectory()) await walk(path)
      else if (/\.(?:tsx?|css|m?js|json|ya?ml)$/.test(entry.name))
        files.push(path)
    }
  }
  for (const dir of ['src', 'build', 'dev', 'tests', 'scripts', '.github'])
    await walk(dir)
  return [
    ...files,
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
  ]
}

const sourceImage = (image) =>
  image && {
    id: image.id,
    file: image.src,
    width: image.width,
    height: image.height,
    alt: image.alt,
    caption: image.caption,
    publicationApproved: true
  }

export function publicRecords(records) {
  return selectPublishedProjects(records, (file) => file).map((project) => {
    if (project.video)
      throw new Error(
        'Review public source video export before adding video projects.'
      )
    const links = Object.fromEntries(
      Object.entries(project.links)
        .filter(([, url]) => url)
        .map(([key, url]) => [
          key,
          { url, verified: true, publicationApproved: true }
        ])
    )
    return {
      ...project,
      cover: sourceImage(project.cover),
      gallery: project.gallery.map(sourceImage),
      storyboard: project.storyboard.map(sourceImage),
      restoration: project.restoration && {
        ...project.restoration,
        versions: Object.fromEntries(
          Object.entries(project.restoration.versions).map(([key, image]) => [
            key,
            sourceImage(image)
          ])
        )
      },
      links: Object.keys(links).length ? links : undefined
    }
  })
}

export function approvedMedia(records) {
  const files = new Set()
  selectPublishedProjects(records, (file) => {
    files.add(file)
    return file
  })
  // Owner-approved portrait imports; no other public/ files are copied implicitly.
  files.add('public/media/projects/portrait/maksym-portrait-640.webp')
  files.add('public/media/projects/portrait/maksym-portrait-1200.webp')
  return [...files]
}
