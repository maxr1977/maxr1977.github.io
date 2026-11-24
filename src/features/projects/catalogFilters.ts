import type { ProjectCategory, PublishedProject } from '../../types/project'

export const categories = ['all', 'web', 'it', 'creative'] as const
export type ProjectFilter = 'all' | ProjectCategory

export function readCategory(params: URLSearchParams): ProjectFilter {
  const category = params.get('category')
  return categories.find(value => value === category) ?? 'all'
}

export function categoryParams(params: URLSearchParams, category: ProjectFilter): URLSearchParams {
  const next = new URLSearchParams(params)
  if (category === 'all') next.delete('category')
  else next.set('category', category)
  return next
}

export function filterProjects(projects: readonly PublishedProject[], category: ProjectFilter) {
  return category === 'all' ? projects : projects.filter(project => project.category === category)
}
