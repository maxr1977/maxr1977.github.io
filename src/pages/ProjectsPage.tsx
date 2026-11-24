import { projects } from 'virtual:portfolio-projects'
import { ProjectCatalog } from '../features/projects/ProjectCatalog'

export function ProjectsPage() {
  return <ProjectCatalog projects={projects} />
}
