import type { PublishedProject } from '../../types/project'

// Presentation order only; all records and approval remain in the build-time registry.
export const selectedProjectSlugs = [
  'studioflow',
  'it-support-lab',
  'photo-restoration'
] as const

export function orderProjects(projects: readonly PublishedProject[]) {
  const rank = (slug: string) => {
    const index = selectedProjectSlugs.findIndex((value) => value === slug)
    return index < 0 ? selectedProjectSlugs.length : index
  }
  return [...projects].sort((a, b) => rank(a.slug) - rank(b.slug))
}
