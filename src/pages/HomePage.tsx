import { usePageMetadata } from '../app/usePageMetadata'
import { ContactSection } from '../features/home/ContactSection'
import { Hero } from '../features/home/Hero'
import { IntroSection } from '../features/home/IntroSection'
import { ProofBar } from '../features/home/ProofBar'
import { Specializations } from '../features/home/Specializations'
import { SelectedProjects } from '../features/home/SelectedProjects'
import { de } from '../data/locales/de'
import { site } from '../data/site'

export function HomePage() {
  usePageMetadata(site.name, de.hero.metadata)

  return (
    <>
      <Hero />
      <ProofBar />
      <IntroSection />
      <Specializations />
      <SelectedProjects />
      <ContactSection />
    </>
  )
}
