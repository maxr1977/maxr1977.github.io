import { useEffect } from 'react'
import { site } from '../data/site'

export function usePageMetadata(title: string, description: string) {
  useEffect(() => {
    document.title = title === site.name ? site.title : `${title} — ${site.name}`
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [title, description])
}
