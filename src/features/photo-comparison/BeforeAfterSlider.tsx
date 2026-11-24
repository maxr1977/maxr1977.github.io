import { useEffect, useId, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { PhotoComparisonProps, PublishedImage } from '../../types/project'
import { projectLabels } from '../../data/projectLabels'
import { bindComparisonControls } from './comparisonControls'
import {
  clampPosition,
  comparisonAspectRatio,
  isComparisonImage
} from './comparisonLogic'
import { comparisonLabels as copy } from './comparisonLabels'
import { FullImageGallery } from './FullImageGallery'
import styles from './PhotoComparison.module.css'

type ReadyProps = Omit<PhotoComparisonProps, 'before' | 'after'> & {
  before: PublishedImage
  after: PublishedImage
}
const numberFormat = new Intl.NumberFormat('de-DE', {
  maximumFractionDigits: 1
})

export function BeforeAfterSlider(props: PhotoComparisonProps) {
  const { before, after, showIndividualImages = true } = props
  if (!isComparisonImage(before) || !isComparisonImage(after)) {
    return (
      <div className={styles.comparison}>
        <p className={styles.controlLabel}>{props.label}</p>
        <p className={styles.notice} role="status">
          {copy.unavailable}
        </p>
        {showIndividualImages && (
          <FullImageGallery
            images={[
              {
                key: 'before',
                label:
                  props.beforeLabel ?? projectLabels.case.versions.original,
                image: before
              },
              {
                key: 'after',
                label: props.afterLabel ?? projectLabels.case.versions.manual,
                image: after
              }
            ]}
          />
        )}
      </div>
    )
  }
  return (
    <ReadyComparison
      key={`${before.src}|${after.src}|${clampPosition(props.initialPosition ?? 50)}`}
      {...props}
      before={before}
      after={after}
    />
  )
}

function ReadyComparison({
  before,
  after,
  label,
  initialPosition = 50,
  fit = 'contain',
  aspectRatio,
  beforeLabel = projectLabels.case.versions.original,
  afterLabel = projectLabels.case.versions.manual,
  showIndividualImages = true,
  instructions = copy.instructions
}: ReadyProps) {
  const id = useId()
  const stage = useRef<HTMLDivElement>(null)
  const range = useRef<HTMLInputElement>(null)
  const [position, setPosition] = useState(() => clampPosition(initialPosition))
  const [loaded, setLoaded] = useState({ before: false, after: false })
  const [failed, setFailed] = useState(false)
  const [dragging, setDragging] = useState(false)
  const ready = loaded.before && loaded.after && !failed
  const valueText = `${beforeLabel}: ${numberFormat.format(position)} %, ${afterLabel}: ${numberFormat.format(100 - position)} %`

  useEffect(() => {
    if (!ready || !stage.current || !range.current) return
    return bindComparisonControls({
      stage: stage.current,
      range: range.current,
      onPositionChange: setPosition,
      onDraggingChange: setDragging
    })
  }, [ready])

  const frameStyle = {
    aspectRatio: comparisonAspectRatio(before, aspectRatio),
    '--comparison-position': `${position}%`,
    '--comparison-aspect-ratio': comparisonAspectRatio(before, aspectRatio)
  } as CSSProperties

  return (
    <div
      className={styles.comparison}
      role="group"
      aria-labelledby={`${id}-label`}
    >
      {failed ? (
        <p className={styles.controlLabel} id={`${id}-label`}>
          {label}
        </p>
      ) : (
        <label
          className={styles.controlLabel}
          id={`${id}-label`}
          htmlFor={`${id}-range`}
        >
          {label}
        </label>
      )}
      {failed ? (
        <p className={styles.notice} role="status">
          {copy.failed}
        </p>
      ) : (
        <>
          <div className={styles.stageSlot}>
            <div className={styles.imageLabels}>
              <span>{beforeLabel}</span>
              <span>{afterLabel}</span>
            </div>
            <div
              className={styles.stage}
              style={frameStyle}
              ref={stage}
              aria-hidden="true"
              data-dragging={dragging || undefined}
              data-ready={ready}
            >
              <img
                className={styles.layer}
                src={after.src}
                alt=""
                draggable={false}
                width={after.width}
                height={after.height}
                style={{ objectFit: fit }}
                onLoad={() =>
                  setLoaded((current) => ({ ...current, after: true }))
                }
                onError={() => setFailed(true)}
              />
              <img
                className={`${styles.layer} ${styles.before}`}
                src={before.src}
                alt=""
                draggable={false}
                width={before.width}
                height={before.height}
                style={{ objectFit: fit }}
                onLoad={() =>
                  setLoaded((current) => ({ ...current, before: true }))
                }
                onError={() => setFailed(true)}
              />
              <span className={styles.divider}>
                <span className={styles.handle}>↔</span>
              </span>
            </div>
          </div>
          <div className={styles.rangeRow}>
            <input
              className={styles.range}
              id={`${id}-range`}
              ref={range}
              type="range"
              min="0"
              max="100"
              step="0.1"
              defaultValue={clampPosition(initialPosition)}
              disabled={!ready}
              aria-valuetext={valueText}
              aria-describedby={`${id}-instructions`}
            />
            <output
              className={styles.value}
              htmlFor={`${id}-range`}
              aria-hidden="true"
            >
              {numberFormat.format(position)} %
            </output>
          </div>
          {!ready && (
            <p className={styles.loading} role="status">
              {copy.loading}
            </p>
          )}
          <p className={styles.instructions} id={`${id}-instructions`}>
            {instructions}
          </p>
        </>
      )}
      {showIndividualImages && (
        <FullImageGallery
          images={[
            { key: 'before', label: beforeLabel, image: before },
            { key: 'after', label: afterLabel, image: after }
          ]}
        />
      )}
    </div>
  )
}
