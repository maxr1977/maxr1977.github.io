import { useState } from 'react'
import type { PublishedImage, Restoration } from '../src/types/project'
import { PhotoRestorationCaseStudy } from '../src/features/photo-comparison/PhotoRestorationCaseStudy'
import { patternSizes } from './testPattern'
import type { PatternSize } from './testPattern'
import { previewLabels as copy } from './previewLabels'
import styles from './PhotoComparisonPreview.module.css'

type Frame = keyof typeof copy.frames
type Failure = keyof typeof copy.failures
type Scenario = { originalSize: PatternSize; resultSize: PatternSize; frame: Frame; delay: number; failure: Failure }
const defaults: Scenario = { originalSize: 'landscape', resultSize: 'landscape', frame: 'auto', delay: 0, failure: 'none' }
const frameRatios: Record<Frame, number | undefined> = { auto: undefined, square: 1, landscape: 4 / 3, wide: 16 / 9 }

export function PhotoComparisonPreview() {
  const [scenario, setScenario] = useState(defaults)
  const [revision, setRevision] = useState(1)
  const { originalSize, resultSize, frame, delay, failure } = scenario
  function update<K extends keyof Scenario>(key: K, value: Scenario[K]) {
    setScenario(current => ({ ...current, [key]: value }))
    setRevision(current => current + 1)
  }
  function image(variant: keyof typeof copy.names, size: PatternSize): PublishedImage {
    const [width, height] = patternSizes[size]
    const query = new URLSearchParams({ size, variant, delay: String(delay),
      failure: failure === variant ? '1' : '0', revision: String(revision) })
    return {
      id: variant, src: '/__dev-photo-pattern.svg?' + query, width, height,
      alt: { de: copy.image + ' · ' + copy.names[variant] },
      caption: { de: copy.caption },
    }
  }
  const restoration: Restoration<PublishedImage> = {
    versions: failure === 'missing' ? {} : {
      original: image('original', originalSize), manual: image('manual', resultSize),
      aiAssisted: image('aiAssisted', resultSize),
    },
    presentation: { fit: 'contain', aspectRatio: frameRatios[frame] },
  }
  const exampleKey = JSON.stringify(scenario) + revision

  return (
    <div className={styles.preview}>
      <header className={styles.hero}>
        <div className="container">
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p>{copy.intro}</p>
        </div>
      </header>
      <div className={`container ${styles.content}`}>
        <p className={styles.notice}>{copy.notice}</p>
        <section aria-labelledby="preview-controls" className={styles.panel}>
          <h2 id="preview-controls">{copy.controls}</h2>
          <div className={styles.controls}>
            <label>{copy.originalSize}
              <select value={originalSize} onChange={event => update('originalSize', event.target.value as PatternSize)}>
                {Object.entries(copy.sizes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
            <label>{copy.resultSize}
              <select value={resultSize} onChange={event => update('resultSize', event.target.value as PatternSize)}>
                {Object.entries(copy.sizes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
            <label>{copy.frame}
              <select value={frame} onChange={event => update('frame', event.target.value as Frame)}>
                {Object.entries(copy.frames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
            <label>{copy.delay}
              <select value={delay} onChange={event => update('delay', Number(event.target.value))}>
                <option value="0">{copy.delays.instant}</option>
                <option value="1500">{copy.delays.short}</option>
                <option value="4000">{copy.delays.long}</option>
              </select>
            </label>
            <label>{copy.failure}
              <select value={failure} onChange={event => update('failure', event.target.value as Failure)}>
                {Object.entries(copy.failures).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={() => setRevision(current => current + 1)}>{copy.restart}</button>
            <button type="button" onClick={() => { setScenario(defaults); setRevision(current => current + 1) }}>{copy.reset}</button>
            <span role="status">{copy.revision}: {revision}</span>
          </div>
        </section>
        <section aria-labelledby="preview-example">
          <h2 id="preview-example">{copy.example}</h2>
          <p className={styles.note}>{copy.alignment}</p>
          <PhotoRestorationCaseStudy key={exampleKey} restoration={restoration} />
        </section>
        <section aria-labelledby="preview-checklist" className={styles.panel}>
          <h2 id="preview-checklist">{copy.checklistTitle}</h2>
          <ol className={styles.checklist}>{copy.checklist.map(item => <li key={item}>{item}</li>)}</ol>
          <p className={styles.note}>{copy.limitation}</p>
        </section>
      </div>
    </div>
  )
}
