import { clampPosition, positionFromKey, positionFromPointer } from './comparisonLogic.ts'

type PointerSurface = EventTarget & {
  getBoundingClientRect: () => { left: number; width: number }
  setPointerCapture: (pointerId: number) => void
  hasPointerCapture: (pointerId: number) => boolean
  releasePointerCapture: (pointerId: number) => void
}
type RangeControl = EventTarget & {
  value: string
  disabled: boolean
  focus: (options?: FocusOptions) => void
}
type Options = {
  stage: PointerSurface
  range: RangeControl
  onPositionChange: (value: number) => void
  onDraggingChange: (dragging: boolean) => void
}

// The same native event binding is used by React and isolated EventTarget tests.
export function bindComparisonControls({ stage, range, onPositionChange, onDraggingChange }: Options) {
  let pointer: number | null = null
  let position = clampPosition(Number(range.value))
  range.value = String(position)

  const publish = (value: number) => {
    const next = clampPosition(value, position)
    range.value = String(next)
    if (next !== position) {
      position = next
      onPositionChange(next)
    }
  }
  const fromPointer = (event: PointerEvent) => {
    const bounds = stage.getBoundingClientRect()
    publish(positionFromPointer(event.clientX, bounds.left, bounds.width, position))
  }
  const release = (id: number) => {
    try {
      if (stage.hasPointerCapture(id)) stage.releasePointerCapture(id)
    } catch {
      // The browser may already have cancelled or released this pointer.
    }
  }
  const endDrag = () => {
    if (pointer === null) return
    const previous = pointer
    pointer = null
    release(previous)
    onDraggingChange(false)
  }
  const onPointerDown = (raw: Event) => {
    const event = raw as PointerEvent
    if (range.disabled || event.button !== 0 || event.isPrimary === false || pointer !== null) return
    pointer = event.pointerId
    // Keep mouse/pen focus on the range instead of the non-focusable image surface.
    // Touch panning remains governed by touch-action and is not cancelled here.
    if (event.pointerType !== 'touch') event.preventDefault()
    range.focus({ preventScroll: true })
    fromPointer(event)
    try {
      stage.setPointerCapture(event.pointerId)
    } catch {
      // A failed capture must not leave a stuck drag. The click still updates the position.
      pointer = null
      onDraggingChange(false)
      return
    }
    onDraggingChange(true)
  }
  const onPointerMove = (raw: Event) => {
    const event = raw as PointerEvent
    if (pointer === null || event.pointerId !== pointer) return
    if (range.disabled) { endDrag(); return }
    fromPointer(event)
  }
  const onPointerUp = (raw: Event) => {
    const event = raw as PointerEvent
    if (pointer === null || event.pointerId !== pointer) return
    if (!range.disabled) fromPointer(event)
    endDrag()
  }
  const onPointerCancel = (raw: Event) => {
    if ((raw as PointerEvent).pointerId === pointer) endDrag()
  }
  const onKeyDown = (raw: Event) => {
    const event = raw as KeyboardEvent
    if (range.disabled || event.altKey || event.ctrlKey || event.metaKey) return
    const next = positionFromKey(event.key, position)
    if (next === null) return
    event.preventDefault()
    publish(next)
  }
  const onInput = () => {
    if (!range.disabled) publish(clampPosition(Number(range.value), position))
  }

  stage.addEventListener('pointerdown', onPointerDown)
  stage.addEventListener('pointermove', onPointerMove)
  stage.addEventListener('pointerup', onPointerUp)
  stage.addEventListener('pointercancel', onPointerCancel)
  stage.addEventListener('lostpointercapture', onPointerCancel)
  range.addEventListener('keydown', onKeyDown)
  range.addEventListener('input', onInput)
  range.addEventListener('change', onInput)

  return () => {
    stage.removeEventListener('pointerdown', onPointerDown)
    stage.removeEventListener('pointermove', onPointerMove)
    stage.removeEventListener('pointerup', onPointerUp)
    stage.removeEventListener('pointercancel', onPointerCancel)
    stage.removeEventListener('lostpointercapture', onPointerCancel)
    range.removeEventListener('keydown', onKeyDown)
    range.removeEventListener('input', onInput)
    range.removeEventListener('change', onInput)
    if (pointer !== null) release(pointer)
    pointer = null
  }
}
