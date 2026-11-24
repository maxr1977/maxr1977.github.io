import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router'
import { usePageMetadata } from '../../app/usePageMetadata'
import { Icon } from '../../components/ui/Icon'
import type { IconName } from '../../components/ui/Icon'
import { projectLabels as copy } from '../../data/projectLabels'
import type { PublishedProject } from '../../types/project'
import {
  categories,
  categoryParams,
  filterProjects,
  readCategory
} from './catalogFilters'
import type { ProjectFilter } from './catalogFilters'
import { ProjectGrid } from './ProjectGrid'
import { ProjectFilters } from './ProjectFilters'
import styles from './Portfolio.module.css'

const emptyIcons: Record<ProjectFilter, IconName> = {
  all: 'grid',
  web: 'code',
  it: 'server',
  creative: 'sparkle'
}

export function ProjectCatalog({
  projects
}: {
  projects: readonly PublishedProject[]
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const selected = readCategory(searchParams)
  const visible = filterProjects(projects, selected)
  usePageMetadata(copy.case.projects, copy.catalog.metadata)

  useEffect(() => {
    const raw = searchParams.get('category')
    if (
      raw === 'all' ||
      (raw !== null && !categories.some((category) => category === raw)) ||
      searchParams.getAll('category').length > 1
    ) {
      setSearchParams(categoryParams(searchParams, selected), {
        replace: true,
        preventScrollReset: true
      })
    }
  }, [searchParams, selected, setSearchParams])

  const changeCategory = (category: ProjectFilter) => {
    if (
      category === selected &&
      searchParams.getAll('category').length <= 1 &&
      (category !== 'all' || !searchParams.has('category'))
    )
      return
    setSearchParams(categoryParams(searchParams, category), {
      preventScrollReset: true
    })
  }
  const resetCategory = () => {
    document.getElementById('project-filter-all')?.focus()
    changeCategory('all')
  }

  return (
    <>
      <header className={styles.catalogHeading}>
        <div className={`container ${styles.headingGrid}`}>
          <div>
            <p className={styles.eyebrow}>{copy.catalog.eyebrow}</p>
            <h1>
              {copy.catalog.title}
              <span>{copy.catalog.titleAccent}</span>
            </h1>
          </div>
          <p className={styles.lead}>{copy.catalog.description}</p>
        </div>
      </header>
      <section
        className={`container ${styles.catalog}`}
        aria-label={copy.catalog.resultLabel}
      >
        <ProjectFilters selected={selected} onChange={changeCategory} />
        <p
          className={styles.resultCount}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {visible.length}{' '}
          {visible.length === 1 ? copy.catalog.singular : copy.catalog.plural}
          <span aria-hidden="true"> · </span>
          {selected === 'all' ? copy.all : copy.categories[selected]}
        </p>
        <div id="project-results">
          {visible.length > 0 ? (
            <ProjectGrid projects={visible} />
          ) : (
            <div className={styles.empty}>
              <span className={styles.emptyMark} aria-hidden="true">
                <Icon name={emptyIcons[selected]} />
              </span>
              <h2>
                {projects.length === 0
                  ? copy.catalog.emptyTitle
                  : copy.catalog.categoryEmptyTitle}
              </h2>
              <p>
                {projects.length === 0
                  ? copy.catalog.emptyDescription
                  : copy.catalog.categoryEmptyDescription}
              </p>
              <div className={styles.emptyActions}>
                {projects.length > 0 && selected !== 'all' && (
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={resetCategory}
                  >
                    {copy.catalog.reset}
                  </button>
                )}
                <Link to="/#kompetenzen">
                  {copy.catalog.back}
                  <Icon name="arrowRight" />
                </Link>
                {projects.length === 0 && (
                  <Link to="/#kontakt">
                    {copy.catalog.contact}
                    <Icon name="arrowRight" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
