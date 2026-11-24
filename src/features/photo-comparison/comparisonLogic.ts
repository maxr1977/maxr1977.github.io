import type { PublishedImage } from '../../types/project'

export type { ComparisonFit } from '../../types/project'

export function clampPosition(value: number, fallback = 50): number {
  const safeFallback = Number.isFinite(fallback) ? fallback : 50
  const number = Number.isFinite(value) ? value : safeFallback
  return Math.round(Math.min(100, Math.max(0, number)) * 10) / 10
}

export function positionFromPointer(clientX: number, left: number, width: number, current: number): number {
  if (!Number.isFinite(clientX) || !Number.isFinite(left) || !Number.isFinite(width) || width <= 0) {
    return clampPosition(current)
  }
  return clampPosition((clientX - left) / width * 100, current)
}

export function positionFromKey(key: string, current: number): number | null {
  const value = clampPosition(current)
  switch (key) {
    case 'ArrowLeft':
    case 'ArrowDown': return clampPosition(value - 1)
    case 'ArrowRight':
    case 'ArrowUp': return clampPosition(value + 1)
    case 'Home': return 0
    case 'End': return 100
    default: return null
  }
}

export function isComparisonImage(image: PublishedImage | undefined): image is PublishedImage {
  return !!image?.src.trim() && Number.isFinite(image.width) && image.width > 0 &&
    Number.isFinite(image.height) && image.height > 0
}

export function comparisonAspectRatio(before: PublishedImage, requested?: number): number {
  return requested !== undefined && Number.isFinite(requested) && requested > 0 ?
    requested : before.width / before.height
}
