// Run through Playwright MCP against the local application. No production import.
/* global document, getComputedStyle, innerWidth */
export async function checkPhotoLayout(page, base, screenshotDirectory) {
  const rows = []
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  const sizes = [
    [320, 667],
    [375, 667],
    [600, 730],
    [768, 667],
    [900, 730],
    [1024, 768],
    [1112, 730],
    [1280, 730],
    [1366, 768],
    [1440, 768],
    [1920, 1080],
    [683, 384],
    [960, 540]
  ]
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height })
    await page.goto(base + '/projekte/photo-restoration')
    await page.locator('[data-ready="true"]').first().waitFor()
    const panel = page.locator('section[aria-label="Interaktiver Vergleich"]')
    await panel.scrollIntoViewIfNeeded()
    const before = await measure(panel)
    assertLayout(before, width)
    await panel
      .getByRole('button', { name: 'Original ↔ KI', exact: true })
      .click()
    await panel.locator('[data-ready="true"]').waitFor()
    const after = await measure(panel)
    assertLayout(after, width)
    const individualSources = await page
      .locator('details img')
      .evaluateAll((images) => images.map((image) => image.src))
    if (
      !after.sources.includes(individualSources[2]) ||
      after.sources.includes(individualSources[1])
    )
      throw new Error('Incorrect AI comparison sources')
    if (
      Math.abs(before.photo.width - after.photo.width) > 1 ||
      Math.abs(before.photo.height - after.photo.height) > 1
    )
      throw new Error('Mode switch changed image size')
    rows.push({ width, height, ...before })
    if ([320, 375, 1112, 1366].includes(width) && screenshotDirectory) {
      await panel
        .getByRole('button', { name: 'Original ↔ Photoshop', exact: true })
        .click()
      await panel.locator('[data-ready="true"]').waitFor()
      await panel.screenshot({
        path: screenshotDirectory + '/after-panel-' + width + '.png'
      })
    }
  }
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.goto(base + '/projekte/photo-restoration')
  const panel = page.locator('section[aria-label="Interaktiver Vergleich"]')
  await panel.locator('[data-ready="true"]').waitFor()
  const range = panel.locator('input[type="range"]')
  await range.focus()
  for (const [key, value] of [
    ['Home', 0],
    ['ArrowRight', 1],
    ['End', 100],
    ['ArrowLeft', 99]
  ]) {
    await range.press(key)
    if (Number(await range.inputValue()) !== value)
      throw new Error('Keyboard regression: ' + key)
  }
  const stage = panel.locator('[data-ready="true"]')
  await stage.scrollIntoViewIfNeeded()
  const box = await stage.boundingBox()
  const dragY = Math.max(160, Math.min(600, box.y + box.height / 2))
  await page.mouse.move(box.x + box.width * 0.2, dragY)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.8, dragY, { steps: 8 })
  await page.mouse.up()
  if (Math.abs(Number(await range.inputValue()) - 80) > 1)
    throw new Error('Pointer drag regression')
  const dialogs = []
  for (const [width, height] of [
    [320, 667],
    [768, 384],
    [1366, 768]
  ]) {
    await page.setViewportSize({ width, height })
    const opener = panel.getByRole('button', { name: 'Vergleich vergrößern' })
    await opener.click()
    const dialog = page.getByRole('dialog')
    await dialog.locator('[data-ready="true"]').waitFor()
    const dimensions = await measure(dialog)
    assertLayout(dimensions, width)
    const modalRange = dialog.locator('input[type="range"]')
    await modalRange.focus()
    await modalRange.press('Home')
    await modalRange.press('ArrowRight')
    if ((await modalRange.inputValue()) !== '1')
      throw new Error('Dialog keyboard regression')
    await modalRange.press('Tab')
    if (!(await dialog.evaluate((el) => el.contains(document.activeElement))))
      throw new Error('Dialog focus escaped')
    await dialog
      .getByRole('button', { name: 'Original ↔ KI', exact: true })
      .click()
    await dialog.locator('[data-ready="true"]').waitFor()
    assertLayout(await measure(dialog), width)
    const scroll = await dialog
      .locator('[data-modal-content]')
      .evaluate((el) => ({
        overflowY: getComputedStyle(el).overflowY,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight
      }))
    if (
      scroll.scrollHeight > scroll.clientHeight &&
      scroll.overflowY !== 'auto'
    )
      throw new Error('Dialog cannot scroll')
    await page.keyboard.press('Escape')
    if (await page.getByRole('dialog').count()) throw new Error('Escape failed')
    if (!(await opener.evaluate((el) => el === document.activeElement)))
      throw new Error('Focus was not restored')
    dialogs.push({ width, height, ...dimensions, scroll })
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  if (
    !(await stage.evaluate(
      (el) => getComputedStyle(el).transitionDuration === '0s'
    ))
  )
    throw new Error('Reduced motion regression')
  await page.emulateMedia({ reducedMotion: null })
  // Real touch events through Chromium's input dispatcher, not synthetic DOM events.
  await page.setViewportSize({ width: 375, height: 667 })
  const session = await page.context().newCDPSession(page)
  await session.send('Emulation.setTouchEmulationEnabled', {
    enabled: true,
    maxTouchPoints: 1
  })
  await stage.scrollIntoViewIfNeeded()
  const touchBox = await stage.boundingBox()
  const y = touchBox.y + Math.min(100, touchBox.height / 2)
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: touchBox.x + touchBox.width * 0.25, y }]
  })
  for (const fraction of [0.35, 0.45, 0.55, 0.65, 0.75])
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: touchBox.x + touchBox.width * fraction, y }]
    })
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: []
  })
  const touchValue = Number(await range.inputValue())
  if (Math.abs(touchValue - 75) > 2)
    throw new Error('Touch drag regression: ' + touchValue)
  await session.send('Emulation.setTouchEmulationEnabled', { enabled: false })
  await session.detach()
  await page
    .getByText('Einzelbilder vollständig ansehen', { exact: true })
    .click()
  await page
    .getByText('Einzelbilder vollständig ansehen', { exact: true })
    .click()
  const fullImages = page.locator('details[open] img')
  const fullImage = []
  for (const image of await fullImages.all()) {
    await image.scrollIntoViewIfNeeded()
    await image.evaluate((el) => el.decode())
    fullImage.push(
      await image.evaluate((el) => ({
        loaded:
          el.complete && el.naturalWidth === 1334 && el.naturalHeight === 2048,
        fit: getComputedStyle(el).objectFit
      }))
    )
  }
  if (
    fullImage.length !== 3 ||
    fullImage.some((image) => !image.loaded || image.fit !== 'contain')
  )
    throw new Error('Full-image gallery failed')
  if (errors.length) throw new Error('Browser errors: ' + errors.join('; '))
  return {
    rows,
    dialogs,
    keyboard: true,
    pointer: true,
    touchValue,
    reducedMotion: true,
    fullImage,
    errors,
    actualBrowserZoomTested: false
  }
}

async function measure(container) {
  return container.evaluate((el) => {
    const stage = el.querySelector('[data-ready="true"]')
    const rect = (node) => {
      const r = node.getBoundingClientRect()
      return {
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        bottom: r.bottom
      }
    }
    const photo = rect(stage)
    const header = stage.previousElementSibling
    const images = [...stage.querySelectorAll('img')]
    return {
      photo,
      header: rect(header),
      labels: [...header.children].map(rect),
      range: rect(el.querySelector('input[type="range"]')),
      layers: images.map(rect),
      sources: images.map((image) => image.currentSrc),
      fit: images.map((image) => getComputedStyle(image).objectFit),
      overflow: document.documentElement.scrollWidth > innerWidth,
      columns: getComputedStyle(el.closest('[class*="showcase"]') ?? el)
        .gridTemplateColumns
    }
  })
}
function assertLayout(result, width) {
  const p = result.photo
  if (result.overflow) throw new Error('Horizontal overflow at ' + width)
  if (Math.abs(p.width / p.height - 1334 / 2048) > 0.002)
    throw new Error('Portrait aspect ratio changed')
  if (
    Math.abs(result.header.width - p.width) > 1 ||
    Math.abs(result.range.width - p.width) > 1 ||
    Math.abs(result.range.x - p.x) > 1
  )
    throw new Error('Controls do not align with photograph')
  for (const label of result.labels)
    if (
      label.bottom > p.y ||
      label.x < p.x - 1 ||
      label.x + label.width > p.x + p.width + 1
    )
      throw new Error('Label overlaps photograph or clips')
  if (
    result.layers.some(
      (layer) =>
        Math.abs(layer.width - (p.width - 2)) > 1 ||
        Math.abs(layer.height - (p.height - 2)) > 1
    ) ||
    result.fit.some((value) => value !== 'contain')
  )
    throw new Error('Comparison layers misaligned')
  if (width >= 1280 && p.width < 480)
    throw new Error('Desktop photograph is too small')
}
