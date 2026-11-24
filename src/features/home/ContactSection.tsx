import { Icon } from '../../components/ui/Icon'
import { Reveal } from '../../components/ui/Reveal'
import { de } from '../../data/locales/de'
import { contact } from '../../data/contact'
import styles from './ContactSection.module.css'

export function ContactSection() {
  return (
    <section
      className={styles.section}
      id="kontakt"
      tabIndex={-1}
      aria-labelledby="contact-title"
    >
      <div className={`container ${styles.layout}`}>
        <Reveal>
          <p className={styles.label}>
            <span>{de.contact.number}</span>
            <span aria-hidden="true">/</span>
            {de.contact.label}
          </p>
          <p className={styles.kicker}>{de.contact.kicker}</p>
          <h2 className={styles.title} id="contact-title">
            {de.contact.title}
            <span>{de.contact.titleAccent}</span>
          </h2>
          <p className={styles.description}>{de.contact.description}</p>
        </Reveal>
        <Reveal className={styles.panel}>
          <div className={styles.panelHeading}>
            <h3>{de.contact.panelLabel}</h3>
            <Icon name="sparkle" />
          </div>
          <dl className={styles.details}>
            <div>
              <dt>{de.contact.locationLabel}</dt>
              <dd>{de.contact.location}</dd>
            </div>
            <div>
              <dt>{de.contact.regionLabel}</dt>
              <dd>{de.contact.region}</dd>
            </div>
            <div>
              <dt>{de.contact.opportunityLabel}</dt>
              <dd>{de.contact.opportunity}</dd>
            </div>
          </dl>
          <nav className={styles.links} aria-label={de.contact.links}>
            <a href={`mailto:${contact.email}`}>
              <span>
                {de.contact.email}
                <small>{contact.email}</small>
              </span>
              <Icon name="arrowUpRight" />
            </a>
            {[
              { href: contact.linkedin, label: de.contact.linkedin },
              { href: contact.github, label: de.contact.github }
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
              >
                {link.label}
                <span className={styles.srOnly}> — {de.contact.newTab}</span>
                <Icon name="arrowUpRight" />
              </a>
            ))}
          </nav>
        </Reveal>
      </div>
    </section>
  )
}
