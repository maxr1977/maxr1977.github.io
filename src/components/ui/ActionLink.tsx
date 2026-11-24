import { Link } from 'react-router'
import type { LinkProps } from 'react-router'
import { Icon } from './Icon'
import styles from './ActionLink.module.css'

type ActionLinkProps = LinkProps & {
  tone?: 'primary' | 'ghost'
}

export function ActionLink({ tone = 'primary', children, className, ...props }: ActionLinkProps) {
  return (
    <Link className={[styles.link, styles[tone], className].filter(Boolean).join(' ')} {...props}>
      <span>{children}</span>
      <Icon name="arrowRight" />
    </Link>
  )
}
