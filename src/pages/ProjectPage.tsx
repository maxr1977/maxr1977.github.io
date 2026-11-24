import { useParams } from 'react-router'
import { projects } from 'virtual:portfolio-projects'
import { CaseStudyLayout } from '../features/projects/CaseStudyLayout'
import { NotFoundPage } from './NotFoundPage'

export function ProjectPage() {
  const { slug } = useParams()
  const project = projects.find(project => project.slug === slug)
  return project ? <CaseStudyLayout project={project} /> : <NotFoundPage />
}
