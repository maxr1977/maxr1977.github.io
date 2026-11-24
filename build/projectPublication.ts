import type {
  ImageSource,
  Localized,
  LocalizedText,
  ProjectContent,
  ProjectRecord,
  PublishedImage,
  PublishedProject,
  PublishedVideo,
  VerifiedLink,
  Restoration
} from '../src/types/project.ts'

export type AssetKind = 'image' | 'video/mp4' | 'video/webm' | 'captions'
export type ResolveAsset = (file: string, kind: AssetKind) => string

const text = (value: string | undefined) => value?.trim() || undefined
const list = (value: readonly string[] | undefined) =>
  value?.map((item) => item.trim()).filter(Boolean) ?? []

function localizedText(
  value: LocalizedText | undefined
): LocalizedText | undefined {
  if (!value || !text(value.de)) return undefined
  const de = value.de.trim()
  return text(value.en) ? { de, en: value.en!.trim() } : { de }
}

function localizedList(
  value: Localized<readonly string[]> | undefined
): Localized<readonly string[]> | undefined {
  if (!value || list(value.de).length === 0) return undefined
  const de = list(value.de)
  const en = list(value.en)
  return en.length > 0 ? { de, en } : { de }
}

function presentation(value: Restoration<ImageSource>['presentation']) {
  if (!value) return undefined
  const fit = value.fit ?? 'contain'
  if (fit !== 'contain' && fit !== 'cover')
    throw new Error('Invalid photo comparison fit.')
  if (
    value.aspectRatio !== undefined &&
    (!Number.isFinite(value.aspectRatio) || value.aspectRatio <= 0)
  ) {
    throw new Error('Comparison aspect ratio must be a positive finite number.')
  }
  if (
    value.allowCropping !== undefined &&
    typeof value.allowCropping !== 'boolean'
  ) {
    throw new Error('Comparison cropping permission must be a boolean.')
  }
  if (value.allowCropping === false && fit !== 'contain') {
    throw new Error('Uncropped comparisons must use contain.')
  }
  return {
    fit,
    aspectRatio: value.aspectRatio,
    allowCropping: value.allowCropping
  }
}

function chapters(values: ProjectContent['chapters']) {
  const ids = new Set<string>()
  return (
    values
      ?.filter((item) => text(item.title) && text(item.description))
      .map((item) => {
        if (!/^[a-z][a-z0-9-]*$/.test(item.id) || ids.has(item.id)) {
          throw new Error('Case chapter ids must be valid and unique.')
        }
        ids.add(item.id)
        if (
          item.examples &&
          !['laboratory', 'simulation'].includes(item.examples.kind)
        ) {
          throw new Error(
            'Troubleshooting examples require a truthful laboratory or simulation label.'
          )
        }
        return {
          id: item.id,
          title: item.title.trim(),
          description: item.description.trim(),
          bullets: list(item.bullets),
          imageId: text(item.imageId),
          ...(item.examples
            ? {
                examples: {
                  kind: item.examples.kind,
                  items: item.examples.items
                    .filter(
                      (example) => text(example.title) && text(example.problem)
                    )
                    .map((example) => ({
                      title: example.title.trim(),
                      problem: example.problem.trim(),
                      diagnosis: text(example.diagnosis),
                      solution: text(example.solution),
                      result: text(example.result)
                    }))
                }
              }
            : {})
        }
      }) ?? []
  )
}

function content(value: ProjectContent): ProjectContent {
  return {
    title: value.title.trim(),
    subtitle: text(value.subtitle),
    summary: text(value.summary),
    background: text(value.background),
    demo: text(value.demo),
    chapters: chapters(value.chapters),
    contribution: text(value.contribution),
    objectives: list(value.objectives),
    responsibilities: list(value.responsibilities),
    process:
      value.process
        ?.filter((step) => text(step.title) && text(step.description))
        .map((step) => ({
          title: step.title.trim(),
          description: step.description.trim()
        })) ?? [],
    results: list(value.results),
    lessons: list(value.lessons),
    humanContribution: text(value.humanContribution),
    aiContribution: text(value.aiContribution)
  }
}

function link(
  value: VerifiedLink | undefined,
  kind: 'github' | 'live'
): string | undefined {
  if (value?.publicationApproved !== true || value.verified !== true)
    return undefined
  const url = new URL(value.url)
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    (kind === 'github' && url.hostname !== 'github.com')
  ) {
    throw new Error(
      'Published project links must be verified HTTPS URLs without credentials.'
    )
  }
  return url.href
}

function image(
  value: ImageSource | undefined,
  resolve: ResolveAsset
): PublishedImage | undefined {
  if (value?.publicationApproved !== true) return undefined
  const alt = localizedText(value.alt)
  if (
    !alt ||
    !value.id ||
    !Number.isInteger(value.width) ||
    !Number.isInteger(value.height) ||
    value.width <= 0 ||
    value.height <= 0
  ) {
    throw new Error(
      'Approved images need an id, German alt text and positive integer dimensions.'
    )
  }
  return {
    id: value.id,
    src: resolve(value.file, 'image'),
    width: value.width,
    height: value.height,
    alt,
    caption: localizedText(value.caption)
  }
}

function images(
  values: readonly ImageSource[] | undefined,
  resolve: ResolveAsset
): PublishedImage[] {
  const approved =
    values
      ?.map((value) => image(value, resolve))
      .filter((value) => value !== undefined) ?? []
  if (new Set(approved.map((value) => value.id)).size !== approved.length) {
    throw new Error('Image ids must be unique within a gallery.')
  }
  return approved
}

function video(
  project: ProjectRecord,
  resolve: ResolveAsset
): PublishedVideo | undefined {
  const value = project.video
  if (value?.publicationApproved !== true) return undefined
  if (value.kind === 'embed' && value.privacyReviewApproved !== true)
    return undefined
  const title = localizedText(value.title)
  if (!title) throw new Error('Approved videos need a German title.')
  if (value.aiAssisted) {
    for (const locale of Object.values(project.content)) {
      if (!text(locale.humanContribution) || !text(locale.aiContribution)) {
        throw new Error(
          'AI-assisted videos require clear human and AI contributions.'
        )
      }
    }
  }
  const metadata = {
    title,
    poster: image(value.poster, resolve),
    transcript: localizedText(value.transcript),
    aiAssisted: value.aiAssisted === true
  }
  if (value.kind === 'local') {
    if (
      !Number.isInteger(value.width) ||
      !Number.isInteger(value.height) ||
      value.width <= 0 ||
      value.height <= 0
    )
      throw new Error('Local videos need positive dimensions.')
    return {
      ...metadata,
      kind: 'local',
      src: resolve(value.file, value.mimeType),
      mimeType: value.mimeType,
      width: value.width,
      height: value.height,
      captions:
        value.captions
          ?.filter((track) => track.publicationApproved === true)
          .map((track) => ({
            src: resolve(track.file, 'captions'),
            language: track.language,
            label: track.label.trim()
          })) ?? []
    }
  }
  const validId =
    value.provider === 'youtube'
      ? /^[\w-]{11}$/.test(value.videoId)
      : /^\d{1,20}$/.test(value.videoId)
  if (!validId) throw new Error('Invalid approved video provider id.')
  return {
    ...metadata,
    kind: 'embed',
    provider: value.provider,
    embedUrl:
      value.provider === 'youtube'
        ? `https://www.youtube-nocookie.com/embed/${value.videoId}`
        : `https://player.vimeo.com/video/${value.videoId}`
  }
}

export function selectPublishedProjects(
  records: readonly ProjectRecord[],
  resolve: ResolveAsset
): PublishedProject[] {
  const ids = new Set<string>()
  const slugs = new Set<string>()
  for (const record of records) {
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug) ||
      !record.id ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id) ||
      ids.has(record.id) ||
      slugs.has(record.slug)
    )
      throw new Error('Project ids and slugs must be valid and unique.')
    ids.add(record.id)
    slugs.add(record.slug)
  }

  return records
    .filter(
      (record) =>
        record.status === 'published' && record.publicationApproved === true
    )
    .map((record) => {
      if (
        record.isOwnerWork !== true ||
        !text(record.content.de.title) ||
        !text(record.content.de.contribution)
      ) {
        throw new Error(
          'Published work needs an approved title and a truthful personal contribution.'
        )
      }
      if (
        !['web', 'it', 'creative'].includes(record.category) ||
        ![
          'employment_practice',
          'personal',
          'educational',
          'demonstration',
          'professional_experience'
        ].includes(record.origin)
      )
        throw new Error('Invalid published category or origin.')
      for (const locale of Object.values(record.content)) {
        if (!text(locale.title) || !text(locale.contribution)) {
          throw new Error(
            'Every published translation needs a title and a personal contribution.'
          )
        }
      }
      const de = content(record.content.de)
      const localized: Localized<ProjectContent> = record.content.en
        ? { de, en: content(record.content.en) }
        : { de }
      const versions = record.restoration
        ? {
            original: image(record.restoration.versions.original, resolve),
            manual: image(record.restoration.versions.manual, resolve),
            aiAssisted: image(record.restoration.versions.aiAssisted, resolve)
          }
        : undefined
      const hasRestoration = versions && Object.values(versions).some(Boolean)
      if (versions?.aiAssisted) {
        for (const locale of Object.values(localized)) {
          if (!text(locale.humanContribution) || !text(locale.aiContribution)) {
            throw new Error(
              'AI restoration needs transparent human and AI contributions in every published translation.'
            )
          }
        }
      }
      return {
        id: record.id,
        slug: record.slug,
        category: record.category,
        origin: record.origin,
        status: 'published',
        publicationApproved: true,
        isOwnerWork: true,
        content: localized,
        tools: [...new Set(list(record.tools))],
        cover: image(record.cover, resolve),
        gallery: images(record.gallery, resolve),
        storyboard: images(record.storyboard, resolve),
        video: video(record, resolve),
        restoration: hasRestoration
          ? {
              versions,
              overview: localizedText(record.restoration?.overview),
              techniques: localizedList(record.restoration?.techniques),
              presentation: presentation(record.restoration?.presentation),
              manualProcess: localizedText(record.restoration?.manualProcess),
              aiProcess: localizedText(record.restoration?.aiProcess)
            }
          : undefined,
        links: {
          github: link(record.links?.github, 'github'),
          live: link(record.links?.live, 'live')
        },
        updatedAt: text(record.updatedAt)
      }
    })
}
