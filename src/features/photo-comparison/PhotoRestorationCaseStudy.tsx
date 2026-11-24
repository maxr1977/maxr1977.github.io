import { useState } from 'react'
import type { PublishedImage, Restoration } from '../../types/project'
import { projectLabels } from '../../data/projectLabels'
import { BeforeAfterSlider } from './BeforeAfterSlider'
import { FullImageGallery } from './FullImageGallery'
import { isComparisonImage } from './comparisonLogic'
import type { ComparisonFit } from './comparisonLogic'
import { comparisonLabels as copy } from './comparisonLabels'
import styles from './PhotoComparison.module.css'
import { Modal } from '../../components/ui/Modal'

type Mode = 'manual' | 'aiAssisted'

export function PhotoRestorationCaseStudy({
  restoration,
  featured = false
}: {
  restoration: Restoration<PublishedImage>
  featured?: boolean
}) {
  const versions = restoration.versions
  const [requestedMode, setMode] = useState<Mode>('manual')
  const [expanded, setExpanded] = useState(false)
  const allowCropping = restoration.presentation?.allowCropping !== false
  const [requestedFit, setFit] = useState<ComparisonFit>(
    restoration.presentation?.fit ?? 'contain'
  )
  const fit = allowCropping ? requestedFit : 'contain'
  const original = isComparisonImage(versions.original)
    ? versions.original
    : undefined
  const manual = original && isComparisonImage(versions.manual)
  const ai = original && isComparisonImage(versions.aiAssisted)
  const selected: Mode | null =
    requestedMode === 'manual' && manual
      ? 'manual'
      : requestedMode === 'aiAssisted' && ai
        ? 'aiAssisted'
        : manual
          ? 'manual'
          : ai
            ? 'aiAssisted'
            : null
  const namedImages = (['original', 'manual', 'aiAssisted'] as const).map(
    (key) => ({
      key,
      label: projectLabels.case.versions[key],
      image: versions[key]
    })
  )
  const anyImages = namedImages.some((item) => isComparisonImage(item.image))
  const modeButtons = () => (
    <div className={styles.modeButtons} role="group" aria-label={copy.modes}>
      <button
        type="button"
        disabled={!manual}
        aria-pressed={selected === 'manual'}
        onClick={() => setMode('manual')}
      >
        {copy.manualMode}
      </button>
      <button
        type="button"
        disabled={!ai}
        aria-pressed={selected === 'aiAssisted'}
        onClick={() => setMode('aiAssisted')}
      >
        {copy.aiMode}
      </button>
    </div>
  )
  const slider = (inDialog = false) =>
    selected &&
    original && (
      <BeforeAfterSlider
        before={original}
        after={versions[selected]}
        fit={fit}
        aspectRatio={restoration.presentation?.aspectRatio}
        showIndividualImages={false}
        instructions={inDialog ? copy.expandedInstructions : copy.instructions}
        label={selected === 'manual' ? copy.manualMode : copy.aiMode}
        beforeLabel={projectLabels.case.versions.original}
        afterLabel={projectLabels.case.versions[selected]}
      />
    )

  return (
    <div className={`${styles.restoration} ${featured ? styles.featured : ''}`}>
      {restoration.overview?.de && (
        <p className={styles.overview}>{restoration.overview.de}</p>
      )}
      <div className={styles.showcase}>
        <section
          className={styles.comparisonPanel}
          aria-label={copy.comparison}
        >
          <h3 className={featured ? styles.srOnly : undefined}>
            {copy.comparison}
          </h3>
          {modeButtons()}
          {selected && original ? (
            <>
              {allowCropping && (
                <div
                  className={styles.fitButtons}
                  role="group"
                  aria-label={copy.fitLabel}
                >
                  <button
                    type="button"
                    aria-pressed={fit === 'contain'}
                    onClick={() => setFit('contain')}
                  >
                    {copy.contain}
                  </button>
                  <button
                    type="button"
                    aria-pressed={fit === 'cover'}
                    onClick={() => setFit('cover')}
                  >
                    {copy.cover}
                  </button>
                </div>
              )}
              {(!featured || allowCropping) && (
                <p className={styles.instructions}>
                  {fit === 'contain' ? copy.containNote : copy.coverNote}
                </p>
              )}
              {slider()}
              {featured && (
                <button
                  type="button"
                  className={styles.expandButton}
                  aria-haspopup="dialog"
                  onClick={() => setExpanded(true)}
                >
                  {copy.enlarge}
                </button>
              )}
            </>
          ) : (
            <p className={styles.notice} role="status">
              {anyImages ? copy.resultMissing : copy.pending}
            </p>
          )}
        </section>
        <div className={styles.context}>
          {(restoration.manualProcess?.de || restoration.aiProcess?.de) && (
            <section aria-label={copy.methods} className={styles.methods}>
              {restoration.manualProcess?.de && (
                <div>
                  <h3>{projectLabels.case.manualProcess}</h3>
                  <p>{restoration.manualProcess.de}</p>
                </div>
              )}
              {restoration.aiProcess?.de && (
                <div>
                  <h3>{projectLabels.case.aiProcess}</h3>
                  <p>{restoration.aiProcess.de}</p>
                </div>
              )}
            </section>
          )}
          {!!restoration.techniques?.de.length && (
            <section aria-label={copy.techniques}>
              <h3>{copy.techniques}</h3>
              <ul className={styles.techniques}>
                {restoration.techniques.de.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
          )}
          {versions.aiAssisted && (
            <p className={styles.caution}>{projectLabels.case.aiCaution}</p>
          )}
        </div>
      </div>
      <FullImageGallery images={namedImages} initiallyOpen={featured} />
      {expanded && (
        <Modal
          title={copy.comparison}
          closeLabel={copy.close}
          onClose={() => setExpanded(false)}
          className={styles.comparisonDialog}
        >
          <div className={styles.expanded}>
            {modeButtons()}
            {slider(true)}
          </div>
        </Modal>
      )}
    </div>
  )
}
