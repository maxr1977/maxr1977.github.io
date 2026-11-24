import { contact } from '../../data/contact'
import styles from './LegalPages.module.css'

export function LegalContact() {
  return (
    <address className={styles.address}>
      <strong>{contact.name}</strong>
      <br />
      {contact.address.street}
      <br />
      {contact.address.city}
      <br />
      {contact.address.country}
      <br />
      <a href={`mailto:${contact.email}`}>{contact.email}</a>
    </address>
  )
}
