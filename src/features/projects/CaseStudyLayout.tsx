import { Link } from 'react-router'
import type { ReactNode } from 'react'
import { usePageMetadata } from '../../app/usePageMetadata'
import { Icon } from '../../components/ui/Icon'
import { projectLabels as copy } from '../../data/projectLabels'
import type { PublishedProject } from '../../types/project'
import { CaseStudyChapters } from './CaseStudyChapters'
import { ProjectDemo } from './ProjectDemo'
import { ProjectGallery } from './ProjectGallery'
import { ProjectImage } from './ProjectImage'
import { EnlargeableProjectImage } from './EnlargeableProjectImage'
import { ProjectVideo } from './ProjectVideo'
import { RestorationPreview } from './RestorationPreview'
import styles from './Portfolio.module.css'

function CaseSection({
  id,
  title,
  children,
  wide = false
}: {
  id: string
  title: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <section
      className={`${styles.caseSection} ${wide ? styles.wideSection : ''}`}
      aria-labelledby={id}
    >
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  )
}

function TextList({ items }: { items: readonly string[] }) {
  return (
    <ul className={styles.textList}>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
}

export function CaseStudyLayout({ project }: { project: PublishedProject }) {
  const content = project.content.de
  usePageMetadata(content.title, content.summary ?? content.title)
  const links = [
    { url: project.links.github, label: copy.case.github },
    {
      url: content.demo ? undefined : project.links.live,
      label: copy.case.live
    }
  ].filter((link) => link.url)
  const chapters = content.chapters ?? []
  const editorial = chapters.length > 0
  const chapterImages = [
    ...(!editorial && project.cover ? [project.cover] : []),
    ...project.gallery
  ]
  const remainingGallery = project.gallery.filter(
    (image) => !chapters.some((chapter) => chapter.imageId === image.id)
  )
  const restoration = project.restoration
  const hasRestoration =
    restoration && Object.values(restoration.versions).some(Boolean)
  const background = content.background && (
    <CaseSection id="case-background" title={copy.case.background}>
      <p>{content.background}</p>
    </CaseSection>
  )
  const contribution = (content.contribution ||
    !!content.responsibilities?.length) && (
    <CaseSection id="case-contribution" title={copy.case.contribution}>
      {content.contribution && <p>{content.contribution}</p>}
      {!!content.responsibilities?.length && (
        <TextList items={content.responsibilities} />
      )}
    </CaseSection>
  )

  return (
    <article
      className={
        hasRestoration
          ? styles.photoCase
          : editorial
            ? styles.editorialCase
            : undefined
      }
    >
      <header className={styles.caseHero}>
        <div className="container">
          <nav aria-label={copy.case.breadcrumb} className={styles.breadcrumb}>
            <Link to="/">{copy.case.home}</Link>
            <span aria-hidden="true">/</span>
            <Link to="/projekte">{copy.case.projects}</Link>
          </nav>
          <p className={styles.eyebrow}>
            {copy.categories[project.category]} / {copy.origins[project.origin]}
          </p>
          <h1>{content.title}</h1>
          {(content.subtitle || content.summary) && (
            <p
              className={
                content.subtitle ? styles.caseSubtitle : styles.caseLead
              }
            >
              {content.subtitle || content.summary}
            </p>
          )}
        </div>
      </header>
      <div className={`container ${styles.caseBody}`}>
        <div className={styles.caseContent}>
          {project.cover && !hasRestoration && (
            <figure className={styles.cover}>
              {editorial ? (
                <EnlargeableProjectImage image={project.cover} eager />
              ) : (
                <ProjectImage image={project.cover} eager />
              )}
              {project.cover.caption?.de && (
                <figcaption>{project.cover.caption.de}</figcaption>
              )}
            </figure>
          )}
          {hasRestoration && (
            <CaseSection
              id="case-restoration"
              title={copy.case.restoration}
              wide
            >
              <RestorationPreview
                key={project.id}
                restoration={restoration}
                featured
              />
            </CaseSection>
          )}
          {editorial ? (
            <div className={styles.caseIntro}>
              {background}
              {contribution}
            </div>
          ) : (
            background
          )}
          {!!content.objectives?.length && (
            <CaseSection id="case-objectives" title={copy.case.objectives}>
              <TextList items={content.objectives} />
            </CaseSection>
          )}
          {!editorial && contribution}
          {content.demo && (
            <ProjectDemo description={content.demo} url={project.links.live} />
          )}
          {editorial && (
            <CaseStudyChapters chapters={chapters} images={chapterImages} />
          )}
          {!!content.process?.length && (
            <CaseSection id="case-process" title={copy.case.process}>
              <ol className={styles.process}>
                {content.process.map((step, index) => (
                  <li key={index}>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </li>
                ))}
              </ol>
            </CaseSection>
          )}
          {!!content.results?.length && (
            <CaseSection id="case-results" title={copy.case.results}>
              <TextList items={content.results} />
            </CaseSection>
          )}
          {!!content.lessons?.length && (
            <CaseSection id="case-lessons" title={copy.case.lessons}>
              <TextList items={content.lessons} />
            </CaseSection>
          )}
          {!hasRestoration && remainingGallery.length > 0 && (
            <CaseSection id="case-gallery" title={copy.case.gallery}>
              <ProjectGallery images={remainingGallery} />
            </CaseSection>
          )}
          {hasRestoration && project.gallery.length > 0 && (
            <CaseSection id="case-gallery" title={copy.case.detailGallery}>
              <ProjectGallery images={project.gallery} />
            </CaseSection>
          )}
          {project.video && (
            <CaseSection id="case-video" title={copy.case.video}>
              <ProjectVideo video={project.video} />
            </CaseSection>
          )}
          {project.storyboard.length > 0 && (
            <CaseSection id="case-storyboard" title={copy.case.storyboard}>
              <ProjectGallery images={project.storyboard} />
            </CaseSection>
          )}
          {(content.humanContribution || content.aiContribution) && (
            <CaseSection id="case-attribution" title={copy.case.attribution}>
              {content.humanContribution && (
                <div>
                  <h3>{copy.case.human}</h3>
                  <p>{content.humanContribution}</p>
                </div>
              )}
              {content.aiContribution && (
                <div>
                  <h3>{copy.case.ai}</h3>
                  <p>{content.aiContribution}</p>
                </div>
              )}
            </CaseSection>
          )}
        </div>
        <aside className={styles.projectProfile} aria-labelledby="case-profile">
          <h2 id="case-profile">{copy.case.profile}</h2>
          <dl>
            <div>
              <dt>{copy.case.category}</dt>
              <dd>{copy.categories[project.category]}</dd>
            </div>
            <div>
              <dt>{copy.case.origin}</dt>
              <dd>{copy.origins[project.origin]}</dd>
            </div>
          </dl>
          {project.tools.length > 0 && (
            <div>
              <h3>{copy.case.tools}</h3>
              <ul className={styles.tags}>
                {project.tools.map((tool) => (
                  <li key={tool}>{tool}</li>
                ))}
              </ul>
            </div>
          )}
          {links.length > 0 && (
            <div>
              <h3>{copy.case.links}</h3>
              <ul className={styles.projectLinks}>
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${link.label} — ${copy.case.newTab}`}
                    >
                      {link.label}
                      <Icon name="arrowUpRight" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link
            className={styles.backLink}
            to={`/projekte?category=${project.category}`}
          >
            {copy.case.back}
            <Icon name="arrowRight" />
          </Link>
        </aside>
      </div>
    </article>
  )
}
