import type { ProjectCategory, ProjectOrigin } from '../types/project'

// Labels are UI copy, not a second source of project records.
export const projectLabels = {
  all: 'Alle',
  categories: {
    web: 'Web Development',
    it: 'IT & Support',
    creative: 'Photography & AI Media'
  } satisfies Record<ProjectCategory, string>,
  origins: {
    employment_practice: 'Praxisprojekt',
    personal: 'Eigenprojekt',
    educational: 'Weiterbildungsprojekt',
    demonstration: 'Demonstrationsprojekt',
    professional_experience: 'Berufserfahrung'
  } satisfies Record<ProjectOrigin, string>,
  catalog: {
    eyebrow: 'Portfolio / Projekte',
    title: 'Projekte &',
    titleAccent: 'Arbeitsproben.',
    description:
      'Einblicke in meine praktische Arbeit: Webentwicklung, technische Aufgaben und visuelle Gestaltung. Veröffentlicht werden ausschließlich freigegebene Arbeiten.',
    metadata:
      'Projekte und Arbeitsproben von Maksym Rechyn aus Web Development, IT & Support und Photography & AI Media.',
    filterLabel: 'Projekte nach Bereich filtern',
    resultLabel: 'Projektergebnisse',
    singular: 'Projekt',
    plural: 'Projekte',
    emptyTitle: 'Arbeitsproben folgen.',
    emptyDescription:
      'Aktuell sind noch keine Projekte zur Veröffentlichung freigegeben.',
    categoryEmptyTitle: 'Hier ist noch Platz für Neues.',
    categoryEmptyDescription:
      'In diesem Bereich sind noch keine freigegebenen Projekte veröffentlicht.',
    reset: 'Alle Bereiche anzeigen',
    back: 'Kompetenzen ansehen',
    contact: 'Kontaktinformationen',
    openCase: 'Fallstudie ansehen'
  },
  case: {
    breadcrumb: 'Seitennavigation',
    home: 'Startseite',
    projects: 'Projekte',
    back: 'Zur Projektübersicht',
    profile: 'Projektprofil',
    demo: 'Interaktive Demo',
    demoPending: 'Live-Demo wird vorbereitet',
    openDemo: 'Live-Demo öffnen',
    category: 'Bereich',
    origin: 'Projektart',
    tools: 'Technologien & Werkzeuge',
    problem: 'Problem',
    diagnosis: 'Diagnose',
    solution: 'Lösung',
    result: 'Ergebnis',
    laboratory: 'Reale Laborübung',
    simulation: 'Simulation · Test-Fixture',
    background: 'Hintergrund',
    objectives: 'Ziele',
    contribution: 'Mein Beitrag',
    process: 'Vorgehen',
    results: 'Ergebnis',
    lessons: 'Erkenntnisse',
    gallery: 'Einblicke ins Projekt',
    video: 'Video',
    storyboard: 'Storyboard & ausgewählte Frames',
    attribution: 'Mensch & KI',
    human: 'Mein gestalterischer Beitrag',
    ai: 'Beitrag der KI-Werkzeuge',
    links: 'Projektlinks',
    github: 'GitHub',
    live: 'Live-Demo',
    newTab: 'öffnet einen neuen Tab',
    restoration: 'Fotorestaurierung im Vergleich',
    detailGallery: 'Details der Restaurierung',
    versions: { original: 'Original', manual: 'Photoshop', aiAssisted: 'KI' },
    manualProcess: 'Manuelle Restaurierung',
    aiProcess: 'KI-gestützter Prozess',
    aiCaution:
      'KI-generierte Rekonstruktionen können interpretierte Details enthalten und sind nicht automatisch historisch authentisch.'
  },
  media: {
    unavailable: 'Bild aktuell nicht verfügbar',
    enlarge: 'Bild vergrößern',
    viewerTitle: 'Bildansicht',
    closeImage: 'Schließen',
    enlargedImage: 'Bild in Originalgröße',
    openImage: 'Bilddatei öffnen',
    viewerHelp:
      'Ansicht in Originalgröße. Zum Verschieben scrollen oder Pfeiltasten nutzen; Escape schließt die Ansicht.',
    videoUnavailable: 'Das Video ist aktuell nicht verfügbar.',
    externalNotice:
      'Das Video wird erst nach dem Laden mit dem externen Anbieter verbunden. Dabei können Daten an den Anbieter übertragen werden.',
    loadExternal: 'Externes Video laden',
    transcript: 'Text zum Video',
    captions: 'Untertitel'
  }
} as const
