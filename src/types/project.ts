export type ProjectCategory = 'web' | 'it' | 'creative'
export type ProjectStatus = 'draft' | 'ready' | 'published'
export type ProjectOrigin =
  | 'employment_practice'
  | 'personal'
  | 'educational'
  | 'demonstration'
  | 'professional_experience'
export type Localized<T> = Readonly<{ de: T; en?: T }>
export type LocalizedText = Localized<string>

export type ProcessStep = Readonly<{ title: string; description: string }>

export type TroubleshootingExample = Readonly<{
  title: string
  problem: string
  diagnosis?: string | undefined
  solution?: string | undefined
  result?: string | undefined
}>

export type CaseChapter = Readonly<{
  id: string
  title: string
  description: string
  bullets?: readonly string[] | undefined
  imageId?: string | undefined
  examples?:
    | Readonly<{
        kind: 'laboratory' | 'simulation'
        items: readonly TroubleshootingExample[]
      }>
    | undefined
}>

export type ProjectContent = Readonly<{
  title: string
  subtitle?: string | undefined
  summary?: string | undefined
  demo?: string | undefined
  chapters?: readonly CaseChapter[] | undefined
  background?: string | undefined
  objectives?: readonly string[] | undefined
  contribution?: string | undefined
  responsibilities?: readonly string[] | undefined
  process?: readonly ProcessStep[] | undefined
  results?: readonly string[] | undefined
  lessons?: readonly string[] | undefined
  humanContribution?: string | undefined
  aiContribution?: string | undefined
}>

export type ImageSource = Readonly<{
  id: string
  file: string
  width: number
  height: number
  alt: LocalizedText
  caption?: LocalizedText | undefined
  publicationApproved: boolean
}>

export type PublishedImage = Readonly<{
  id: string
  src: string
  width: number
  height: number
  alt: LocalizedText
  caption?: LocalizedText | undefined
}>

export type CaptionSource = Readonly<{
  file: string
  language: 'de' | 'en'
  label: string
  publicationApproved: boolean
}>

type VideoMetadata = Readonly<{
  title: LocalizedText
  poster?: ImageSource | undefined
  transcript?: LocalizedText | undefined
  aiAssisted?: boolean | undefined
  publicationApproved: boolean
}>

export type VideoSource = VideoMetadata &
  (
    | Readonly<{
        kind: 'local'
        file: string
        mimeType: 'video/mp4' | 'video/webm'
        width: number
        height: number
        captions?: readonly CaptionSource[] | undefined
      }>
    | Readonly<{
        kind: 'embed'
        provider: 'youtube' | 'vimeo'
        videoId: string
        privacyReviewApproved: boolean
      }>
  )

type PublishedVideoMetadata = Readonly<{
  title: LocalizedText
  poster?: PublishedImage | undefined
  transcript?: LocalizedText | undefined
  aiAssisted: boolean
}>

export type PublishedVideo = PublishedVideoMetadata &
  (
    | Readonly<{
        kind: 'local'
        src: string
        mimeType: 'video/mp4' | 'video/webm'
        width: number
        height: number
        captions: readonly Readonly<{
          src: string
          language: 'de' | 'en'
          label: string
        }>[]
      }>
    | Readonly<{
        kind: 'embed'
        provider: 'youtube' | 'vimeo'
        embedUrl: string
      }>
  )

export type RestorationVersions<TImage> = Readonly<{
  original?: TImage | undefined
  manual?: TImage | undefined
  aiAssisted?: TImage | undefined
}>

export type ComparisonFit = 'contain' | 'cover'

export type Restoration<TImage> = Readonly<{
  versions: RestorationVersions<TImage>
  overview?: LocalizedText | undefined
  manualProcess?: LocalizedText | undefined
  aiProcess?: LocalizedText | undefined
  techniques?: Localized<readonly string[]> | undefined
  presentation?:
    | Readonly<{
        fit?: ComparisonFit | undefined
        aspectRatio?: number | undefined
        allowCropping?: boolean | undefined
      }>
    | undefined
}>

export type PhotoComparisonProps = Readonly<{
  before?: PublishedImage | undefined
  after?: PublishedImage | undefined
  label: string
  beforeLabel?: string | undefined
  afterLabel?: string | undefined
  initialPosition?: number | undefined
  fit?: ComparisonFit | undefined
  aspectRatio?: number | undefined
  showIndividualImages?: boolean | undefined
  instructions?: string | undefined
}>

export type VerifiedLink = Readonly<{
  url: string
  verified: boolean
  publicationApproved: boolean
}>

export type ProjectRecord = Readonly<{
  id: string
  slug: string
  category: ProjectCategory
  status: ProjectStatus
  origin: ProjectOrigin
  isOwnerWork: boolean
  publicationApproved: boolean
  content: Localized<ProjectContent>
  tools?: readonly string[] | undefined
  cover?: ImageSource | undefined
  gallery?: readonly ImageSource[] | undefined
  storyboard?: readonly ImageSource[] | undefined
  video?: VideoSource | undefined
  restoration?: Restoration<ImageSource> | undefined
  links?: Readonly<{ github?: VerifiedLink; live?: VerifiedLink }> | undefined
  updatedAt?: string | undefined
  internalNotes?: string
}>

export type PublishedProject = Readonly<{
  id: string
  slug: string
  category: ProjectCategory
  status: 'published'
  origin: ProjectOrigin
  isOwnerWork: true
  publicationApproved: true
  content: Localized<ProjectContent>
  tools: readonly string[]
  cover?: PublishedImage | undefined
  gallery: readonly PublishedImage[]
  storyboard: readonly PublishedImage[]
  video?: PublishedVideo | undefined
  restoration?: Restoration<PublishedImage> | undefined
  links: Readonly<{ github?: string | undefined; live?: string | undefined }>
  updatedAt?: string | undefined
}>
