// Readiness records informed owner publication approval, not independent legal certification.
export const releaseStatus = {
  publicationApproved: true,
  // Existing flag: explicit owner approval of the final legal texts.
  legalReviewApproved: true,
  legalApproval: {
    kind: 'owner-informed-publication-approval',
    approvedBy: 'Maksym Rechyn',
    approvedOn: '2026-11-24',
    independentProfessionalCertification: false,
    approvedTextsSha256:
      'ae95884130842ec405753c6d536e328bf14feaab7b1671806d52a7995ee0b533'
  },
  // Owner confirmations + consumer Gemini terms review; no exclusive AI copyright is claimed.
  assetRightsApproved: true,
  // Applies only to the audited clean export. The development history remains forbidden.
  repositoryReviewApproved: true,
  hostingProvider: 'GitHub Pages',
  repository: 'maxr1977/maxr1977.github.io',
  expectedUrl: 'https://maxr1977.github.io/',
  // These limitations were disclosed and expressly acknowledged by the owner; not certified as resolved.
  acknowledgedUncertainties: [
    'Die konkrete Rollen- und Vertragseinordnung von GitHub Pages und persönlichem Gmail sowie der genaue Kontext internationaler Übermittlungen sind nicht unabhängig professionell bestätigt. Allgemeine Anbietererklärungen belegen keinen kontospezifischen Vertrag.',
    'Die rechtliche Bewertung von Art. 6 Abs. 1 lit. f DSGVO, Interessenabwägung und Impressum-Einordnung nach § 18 MStV beziehungsweise § 5 DDG ist nicht unabhängig professionell zertifiziert.',
    'Die geprüften Anbieterinformationen nennen keine konkrete Pages-Besucher-IP-Speicherfrist und bestätigen nicht jedes einzelne Verarbeitungsszenario oder Übermittlungsinstrument.'
  ],
  openItems: [] as readonly string[]
} as const

export type ReleaseReadiness = {
  publicationApproved: boolean
  legalReviewApproved: boolean
  assetRightsApproved: boolean
  repositoryReviewApproved: boolean
  hostingProvider: string | null
  openItems: readonly string[]
}

export function releaseBlockers(
  state: ReleaseReadiness,
  privacyParagraphs: readonly string[] = []
): string[] {
  return [
    ...(!state.publicationApproved
      ? ['Owner publication approval is missing.']
      : []),
    ...(!state.hostingProvider ? ['Hosting provider is not selected.'] : []),
    ...(!state.legalReviewApproved
      ? ['Owner approval of the final legal texts is outstanding.']
      : []),
    ...(!state.assetRightsApproved
      ? ['Public asset rights are not confirmed.']
      : []),
    ...(!state.repositoryReviewApproved
      ? ['Public source and history review is outstanding.']
      : []),
    ...state.openItems,
    ...(privacyParagraphs.some((text) => /\bOFFEN\b/.test(text))
      ? ['Unresolved OFFEN items remain in the privacy notice.']
      : [])
  ]
}
