import assert from 'node:assert/strict'
import test from 'node:test'
import { bindComparisonControls } from '../src/features/photo-comparison/comparisonControls.ts'
import {
  clampPosition, comparisonAspectRatio, isComparisonImage, positionFromKey, positionFromPointer,
} from '../src/features/photo-comparison/comparisonLogic.ts'

class Surface extends EventTarget {
  left = 100
  width = 400
  captured = new Set()
  failCapture = false
  getBoundingClientRect() { return { left: this.left, width: this.width } }
  setPointerCapture(id) {
    if (this.failCapture) throw new Error('Test-only unavailable capture')
    this.captured.add(id)
  }
  hasPointerCapture(id) { return this.captured.has(id) }
  releasePointerCapture(id) { this.captured.delete(id) }
}
class Range extends EventTarget {
  value = '50'
  disabled = false
  focusCalls = []
  focus(options) { this.focusCalls.push(options) }
}
function fire(target, type, properties = {}) {
  const event = Object.assign(new Event(type, { cancelable: true }), properties)
  target.dispatchEvent(event)
  return event
}
function harness() {
  const stage = new Surface()
  const range = new Range()
  const positions = []
  const dragging = []
  const cleanup = bindComparisonControls({
    stage, range, onPositionChange: value => positions.push(value),
    onDraggingChange: value => dragging.push(value),
  })
  return { stage, range, positions, dragging, cleanup }
}
const pointer = (id, clientX, pointerType = 'mouse') => ({
  pointerId: id, clientX, pointerType, button: 0, isPrimary: true,
})

test('positions clamp, preserve useful precision and never expose NaN', () => {
  assert.equal(clampPosition(-20), 0)
  assert.equal(clampPosition(120), 100)
  assert.equal(clampPosition(33.33333), 33.3)
  assert.equal(clampPosition(NaN, 27), 27)
  assert.equal(clampPosition(Infinity), 50)
  assert.equal(clampPosition(NaN, NaN), 50)
})

test('pointer positions use current dimensions and safe fallbacks', () => {
  assert.equal(positionFromPointer(100, 100, 400, 50), 0)
  assert.equal(positionFromPointer(300, 100, 400, 50), 50)
  assert.equal(positionFromPointer(500, 100, 400, 50), 100)
  assert.equal(positionFromPointer(-100, 100, 400, 50), 0)
  assert.equal(positionFromPointer(900, 100, 400, 50), 100)
  assert.equal(positionFromPointer(300, 100, 0, 40), 40)
  assert.equal(positionFromPointer(NaN, 100, 400, 40), 40)
})

test('Arrow keys, Home and End have defined bounds and direction', () => {
  assert.equal(positionFromKey('ArrowLeft', 50), 49)
  assert.equal(positionFromKey('ArrowDown', 50), 49)
  assert.equal(positionFromKey('ArrowRight', 50), 51)
  assert.equal(positionFromKey('ArrowUp', 50), 51)
  assert.equal(positionFromKey('Home', 50), 0)
  assert.equal(positionFromKey('End', 50), 100)
  assert.equal(positionFromKey('ArrowLeft', 0), 0)
  assert.equal(positionFromKey('ArrowRight', 100), 100)
  assert.equal(positionFromKey('Tab', 50), null)
})

for (const type of ['mouse', 'touch']) {
  test(type + ' dragging updates, captures and releases the active pointer', () => {
    const h = harness()
    const down = fire(h.stage, 'pointerdown', pointer(7, 200, type))
    assert.equal(down.defaultPrevented, type === 'mouse')
    assert.equal(h.range.value, '25')
    assert.ok(h.stage.hasPointerCapture(7))
    assert.deepEqual(h.range.focusCalls, [{ preventScroll: true }])
    fire(h.stage, 'pointermove', pointer(7, 400, type))
    assert.equal(h.range.value, '75')
    fire(h.stage, 'pointermove', pointer(7, 999, type))
    assert.equal(h.range.value, '100')
    fire(h.stage, 'pointerup', pointer(7, 300, type))
    assert.equal(h.range.value, '50')
    assert.ok(!h.stage.hasPointerCapture(7))
    assert.deepEqual(h.dragging, [true, false])
    fire(h.stage, 'pointermove', pointer(7, 400, type))
    assert.equal(h.range.value, '50', 'No dragging after release')
    h.cleanup()
  })
}

test('secondary buttons, secondary touches and unrelated pointer ids are ignored', () => {
  const h = harness()
  fire(h.stage, 'pointerdown', { ...pointer(1, 200), button: 2 })
  fire(h.stage, 'pointerdown', { ...pointer(2, 200, 'touch'), isPrimary: false })
  assert.equal(h.range.value, '50')
  fire(h.stage, 'pointerdown', pointer(3, 200))
  fire(h.stage, 'pointerdown', pointer(4, 400))
  fire(h.stage, 'pointermove', pointer(4, 400))
  fire(h.stage, 'pointerup', pointer(4, 400))
  assert.equal(h.range.value, '25')
  assert.ok(h.stage.hasPointerCapture(3))
  h.cleanup()
})

test('touch cancellation and lost capture end the gesture without a position jump', () => {
  for (const eventName of ['pointercancel', 'lostpointercapture']) {
    const h = harness()
    fire(h.stage, 'pointerdown', pointer(4, 250, 'touch'))
    assert.equal(h.range.value, '37.5')
    fire(h.stage, eventName, pointer(4, 0, 'touch'))
    assert.equal(h.range.value, '37.5')
    assert.equal(h.dragging.at(-1), false)
    fire(h.stage, 'pointermove', pointer(4, 500, 'touch'))
    assert.equal(h.range.value, '37.5')
    h.cleanup()
  }
})

test('the bound keyboard handler prevents scrolling only for handled unmodified keys', () => {
  const h = harness()
  for (const [key, expected] of [['ArrowRight', '51'], ['ArrowLeft', '50'], ['Home', '0'], ['End', '100']]) {
    const event = fire(h.range, 'keydown', { key })
    assert.equal(h.range.value, expected)
    assert.ok(event.defaultPrevented)
  }
  for (const properties of [{ key: 'Tab' }, { key: 'ArrowLeft', altKey: true },
    { key: 'Home', ctrlKey: true }, { key: 'End', metaKey: true }]) {
    assert.ok(!fire(h.range, 'keydown', properties).defaultPrevented)
    assert.equal(h.range.value, '100')
  }
  h.cleanup()
})

test('native range input is synchronized and disabled controls do not react', () => {
  const h = harness()
  h.range.value = '62.4'
  fire(h.range, 'input')
  assert.deepEqual(h.positions, [62.4])
  fire(h.range, 'change')
  assert.deepEqual(h.positions, [62.4])
  h.range.value = 'bad-value'
  fire(h.range, 'input')
  assert.equal(h.range.value, '62.4')
  h.range.disabled = true
  fire(h.range, 'keydown', { key: 'Home' })
  fire(h.stage, 'pointerdown', pointer(1, 100))
  assert.equal(h.range.value, '62.4')
  assert.equal(h.dragging.length, 0)
  h.cleanup()
})

test('responsive resizing during a drag uses fresh bounds', () => {
  const h = harness()
  fire(h.stage, 'pointerdown', pointer(1, 300))
  assert.equal(h.range.value, '50')
  h.stage.width = 800
  fire(h.stage, 'pointermove', pointer(1, 300))
  assert.equal(h.range.value, '25')
  h.range.disabled = true
  fire(h.stage, 'pointermove', pointer(1, 600))
  assert.equal(h.range.value, '25')
  assert.ok(!h.stage.hasPointerCapture(1))
  assert.equal(h.dragging.at(-1), false)
  h.cleanup()
})

test('failed capture cannot leave a stuck drag and cleanup releases event bindings', () => {
  const h = harness()
  h.stage.failCapture = true
  fire(h.stage, 'pointerdown', pointer(1, 200))
  assert.equal(h.range.value, '25')
  fire(h.stage, 'pointerdown', pointer(2, 400))
  assert.equal(h.range.value, '75')
  h.stage.failCapture = false
  fire(h.stage, 'pointerdown', pointer(3, 300))
  assert.ok(h.stage.hasPointerCapture(3))
  h.cleanup()
  assert.ok(!h.stage.hasPointerCapture(3))
  fire(h.range, 'keydown', { key: 'Home' })
  fire(h.stage, 'pointerdown', pointer(4, 100))
  assert.equal(h.range.value, '50')
})

test('image dimensions may differ without changing their shared comparison frame', () => {
  const before = { id: 'test-before', src: '/test-only/original.png', width: 800, height: 1200,
    alt: { de: 'Test metadata only' } }
  const after = { ...before, id: 'test-after', width: 1600, height: 900 }
  assert.ok(isComparisonImage(before) && isComparisonImage(after))
  assert.equal(comparisonAspectRatio(before), 800 / 1200)
  assert.equal(comparisonAspectRatio(before, 16 / 9), 16 / 9)
  assert.equal(comparisonAspectRatio(before, -1), 800 / 1200)
  assert.ok(!isComparisonImage(undefined))
  assert.ok(!isComparisonImage({ ...before, src: '' }))
  assert.ok(!isComparisonImage({ ...before, width: 0 }))
})
