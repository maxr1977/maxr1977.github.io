import { useEffect, useId, useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './Modal.module.css'

export function Modal({
  title,
  closeLabel,
  help,
  onClose,
  children,
  footer,
  className = ''
}: {
  title: string
  closeLabel: string
  help?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  className?: string | undefined
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const id = useId()
  useEffect(() => {
    const element = dialog.current
    if (!element) return
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element.showModal()
    return () => {
      element.close()
      document.body.style.overflow = overflow
      if (opener?.isConnected) opener.focus({ preventScroll: true })
    }
  }, [])

  function keepFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return
    const targets = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex="0"]'
      )
    ].filter((element) => element.getClientRects().length > 0)
    const first = targets[0]
    const last = targets.at(-1)
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  return createPortal(
    <dialog
      ref={dialog}
      className={`${styles.dialog} ${className}`}
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      aria-describedby={help ? `${id}-help` : undefined}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onKeyDown={keepFocus}
    >
      <header className={styles.header}>
        <h2 id={`${id}-title`}>{title}</h2>
        <button type="button" className={styles.close} onClick={onClose}>
          {closeLabel}
        </button>
      </header>
      {help && (
        <p className={styles.help} id={`${id}-help`}>
          {help}
        </p>
      )}
      <div className={styles.content} data-modal-content>
        {children}
      </div>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </dialog>,
    document.body
  )
}
