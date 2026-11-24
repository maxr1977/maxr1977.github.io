import { Link } from 'react-router'
import { PageFrame } from '../components/ui/PageFrame'
import { de } from '../data/locales/de'

export function NotFoundPage() {
  return (
    <PageFrame title={de.notFound.title} eyebrow={de.notFound.eyebrow} description={de.notFound.description}>
      <Link className="action-link" to="/">{de.notFound.homeLink}<span aria-hidden="true">↗</span></Link>
    </PageFrame>
  )
}
