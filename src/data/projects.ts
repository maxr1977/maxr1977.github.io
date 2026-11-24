import type { ProjectRecord } from '../types/project'

// Public snapshot: approved records only. Keep private planning in the local source repository.
export const projects: readonly ProjectRecord[] = [
  {
    "id": "studioflow",
    "slug": "studioflow",
    "category": "web",
    "origin": "personal",
    "status": "published",
    "publicationApproved": true,
    "isOwnerWork": true,
    "content": {
      "de": {
        "title": "StudioFlow — Digitale Fotostudioverwaltung",
        "subtitle": "Fotografie-Erfahrung trifft moderne Webentwicklung.",
        "summary": "Interaktive Frontend-Demo für Kunden, Fotoaufträge und Bearbeitungsprozesse. Eine separate Full-Stack-Version entsteht parallel.",
        "background": "StudioFlow ist eine von mir entwickelte Anwendung zur übersichtlichen Verwaltung von Kunden, Fotoaufträgen und Bearbeitungsprozessen. Das Eigenprojekt verbindet meine langjährige Erfahrung in der Fotografie und Bildbearbeitung mit meinen Kenntnissen in der modernen Webentwicklung. Ziel ist, Kontakte, Arbeitsstände und Fristen an einem Ort nachvollziehbar zu machen.",
        "demo": "Die fertige interaktive Frontend-Demo benötigt keine Registrierung und arbeitet ausschließlich mit fiktiven Beispieldaten im Arbeitsspeicher des Browsers. Kunden und Aufträge lassen sich anlegen, ändern und löschen; ein Reset stellt den Ausgangszustand wieder her. Änderungen werden nicht dauerhaft gespeichert und gehen beim Neuladen oder Beenden verloren. Die Demo verwendet keine echte Anmeldung, keine Live-API und keine Datenbank.",
        "chapters": [
          {
            "id": "dashboard",
            "title": "Dashboard: den Arbeitsstand im Blick",
            "description": "Die Studioübersicht bündelt Aufträge, Bearbeitungsstatus und anstehende Fristen. Kennzahlen passen sich nach Änderungen automatisch an.",
            "bullets": [
              "Aktuelle Aufträge und Statusverteilung",
              "Anstehende Termine und überfällige Arbeiten"
            ],
            "imageId": "studio-dashboard"
          },
          {
            "id": "orders",
            "title": "Aufträge vom Eingang bis zum Abschluss",
            "description": "Fotoaufträge lassen sich erstellen, bearbeiten und durch die Phasen Neu, In Bearbeitung, Zur Prüfung und Abgeschlossen führen.",
            "bullets": [
              "Suche nach Auftrag oder Demo-Kunde",
              "Filter nach Status und Frist sowie Sortierung",
              "Formulare mit Validierung und direkte Statusänderungen"
            ],
            "imageId": "studio-orders"
          },
          {
            "id": "customers",
            "title": "Kunden und zugehörige Aufträge",
            "description": "Kundenkarten zeigen Kontaktdaten und die Anzahl zugehöriger Aufträge. Detailansichten verbinden den Kontakt mit seinen Arbeiten.",
            "bullets": [
              "Kunden anlegen, bearbeiten und löschen",
              "Kontakte suchen, filtern und sortieren"
            ],
            "imageId": "studio-customers"
          },
          {
            "id": "responsive",
            "title": "Für Desktop, Tablet und Smartphone",
            "description": "Navigation, Kennzahlen, Listen und Formulare passen sich der verfügbaren Breite an. Der gezeigte mobile Dashboard-Ausschnitt stammt aus der echten Demo.",
            "bullets": [],
            "imageId": "studio-dashboard-mobile"
          },
          {
            "id": "demo-stack",
            "title": "Technik der interaktiven Demo",
            "description": "Die eigenständige Frontend-Anwendung basiert auf React, TypeScript und Vite. CSS Modules strukturieren die Gestaltung, React Router die Navigation.",
            "bullets": [
              "Clientseitige CRUD-Logik und gemeinsam aktualisierte Daten",
              "Fiktive In-Memory-Daten pro Demo-Sitzung",
              "Keine Registrierung und kein Backend in dieser Version"
            ]
          },
          {
            "id": "full-stack",
            "title": "Separate Full-Stack-Version in Entwicklung",
            "description": "Parallel entwickle ich StudioFlow mit Node.js, Express, TypeScript und MongoDB weiter. Lokal umgesetzt sind REST-APIs, Datenvalidierung, Benutzerkonten, serverseitige Sitzungen, geschützte Zugriffe und die Trennung von Daten verschiedener Fotostudios. Diese Version befindet sich weiterhin in Entwicklung und Qualitätssicherung; sie ist nicht öffentlich verfügbar und nicht für den Produktivbetrieb freigegeben.",
            "bullets": [
              "Node.js · Express · TypeScript",
              "MongoDB · Mongoose · REST API · Zod",
              "Authentifizierung und studioabhängige Datenzugriffe"
            ]
          },
          {
            "id": "quality",
            "title": "Qualitätssicherung und nächste Schritte",
            "description": "Zur Qualitätssicherung gehören automatisierte Tests und responsive Browserprüfungen mit Playwright. Die öffentliche Bereitstellung der Frontend-Demo wird vorbereitet. Die weitere Full-Stack-Entwicklung und ihre Qualitätssicherung erfolgen davon getrennt.",
            "bullets": []
          }
        ],
        "contribution": "Ich habe die React-/TypeScript-Oberfläche, die clientseitigen CRUD-Abläufe, Formulare mit Validierung und die gemeinsame Zustandsverwaltung umgesetzt. Dazu gehören das responsive Design, automatisierte Tests und Browserprüfungen mit Playwright.",
        "objectives": [],
        "responsibilities": [],
        "process": [],
        "results": [],
        "lessons": []
      }
    },
    "tools": [
      "React",
      "TypeScript",
      "Vite",
      "CSS Modules",
      "React Router"
    ],
    "cover": {
      "id": "studio-dashboard",
      "file": "public/media/projects/studioflow/studio-dashboard.webp",
      "width": 1440,
      "height": 1040,
      "alt": {
        "de": "StudioFlow Dashboard mit Auftragskennzahlen, Statusübersicht und ausschließlich fiktiven Demo-Aufträgen."
      },
      "caption": {
        "de": "Dashboard der echten Frontend-Demo. Alle angezeigten Daten sind fiktiv."
      },
      "publicationApproved": true
    },
    "gallery": [
      {
        "id": "studio-orders",
        "file": "public/media/projects/studioflow/studio-orders.webp",
        "width": 1177,
        "height": 1539,
        "alt": {
          "de": "StudioFlow Auftragstabelle mit Suche, Statusfiltern, Fristen und fiktiven Demo-Aufträgen."
        },
        "caption": {
          "de": "Auftragsverwaltung mit Suche, Filtern und Bearbeitungsphasen."
        },
        "publicationApproved": true
      },
      {
        "id": "studio-customers",
        "file": "public/media/projects/studioflow/studio-customers.webp",
        "width": 1192,
        "height": 933,
        "alt": {
          "de": "StudioFlow Kundenkarten für Demo-Kunden A bis F mit fiktiven Kontaktdaten und Auftragszahlen."
        },
        "caption": {
          "de": "Kundenverwaltung mit fiktiven Kontakten und zugehörigen Aufträgen."
        },
        "publicationApproved": true
      },
      {
        "id": "studio-dashboard-mobile",
        "file": "public/media/projects/studioflow/studio-dashboard-mobile.webp",
        "width": 360,
        "height": 660,
        "alt": {
          "de": "Mobiler Ausschnitt des StudioFlow Dashboards mit Schaltfläche Neuer Auftrag und vier Kennzahlen."
        },
        "caption": {
          "de": "Authentischer mobiler Dashboard-Ausschnitt aus der Frontend-Demo."
        },
        "publicationApproved": true
      }
    ],
    "storyboard": [],
    "updatedAt": "2026-11-14"
  },
  {
    "id": "photo-restoration",
    "slug": "photo-restoration",
    "category": "creative",
    "origin": "personal",
    "status": "published",
    "publicationApproved": true,
    "isOwnerWork": true,
    "content": {
      "de": {
        "title": "Historische Fotorestaurierung",
        "subtitle": "Photoshop vs. KI — Zwei Methoden im Vergleich",
        "summary": "Beschädigtes historisches Porträt mit zwei unterschiedlichen Methoden wiederhergestellt: klassische Handarbeit in Photoshop und eine KI-generierte Alternative.",
        "background": "Ausgangspunkt ist ein echter Scan der historischen Originalfotografie (ca. 1920er-Jahre). Das Paarporträt zeigt Falten, Risse, Abnutzung und farbliche Markierungen. Beide Fassungen gehen auf diesen Scan zurück.",
        "chapters": [],
        "contribution": "Ich habe das Ausgangsbild ausgewählt und vorbereitet sowie beide Ergebnisse verglichen und beurteilt.",
        "objectives": [],
        "responsibilities": [],
        "process": [],
        "results": [],
        "lessons": [
          "Manuelle Retusche bietet gezielte Kontrolle über Bildtreue; KI greift stärker interpretierend ein.",
          "Ein überzeugender Bildeindruck allein belegt keine historische Genauigkeit. Auch gleiche Bildabmessungen garantieren keine deckungsgleichen Gesichtsdetails."
        ],
        "humanContribution": "Die Photoshop-Fassung habe ich eigenständig und vollständig manuell restauriert und koloriert.",
        "aiContribution": "Die alternative Fassung entstand separat mit Google Gemini. Sie wurde nicht manuell in Photoshop nachbearbeitet."
      }
    },
    "tools": [
      "Adobe Photoshop",
      "AI image restoration"
    ],
    "cover": {
      "id": "restoration-photoshop",
      "file": "public/media/projects/photo-restoration/photoshop.jpg",
      "width": 1334,
      "height": 2048,
      "alt": {
        "de": "Dasselbe Paarporträt, von Maksym Rechyn manuell in Adobe Photoshop restauriert und koloriert."
      },
      "caption": {
        "de": "Photoshop — von Maksym Rechyn manuell restauriert und koloriert."
      },
      "publicationApproved": true
    },
    "gallery": [],
    "storyboard": [],
    "restoration": {
      "versions": {
        "original": {
          "id": "restoration-original",
          "file": "public/media/projects/photo-restoration/original.jpg",
          "width": 1334,
          "height": 2048,
          "alt": {
            "de": "Originalscan eines historischen Paarporträts (ca. 1920er-Jahre) mit Falten, Rissen und farblichen Markierungen."
          },
          "caption": {
            "de": "Original — echter Scan der historischen Originalfotografie (ca. 1920er-Jahre)."
          },
          "publicationApproved": true
        },
        "manual": {
          "id": "restoration-photoshop",
          "file": "public/media/projects/photo-restoration/photoshop.jpg",
          "width": 1334,
          "height": 2048,
          "alt": {
            "de": "Dasselbe Paarporträt, von Maksym Rechyn manuell in Adobe Photoshop restauriert und koloriert."
          },
          "caption": {
            "de": "Photoshop — von Maksym Rechyn manuell restauriert und koloriert."
          },
          "publicationApproved": true
        },
        "aiAssisted": {
          "id": "restoration-ai",
          "file": "public/media/projects/photo-restoration/ai.jpg",
          "width": 1334,
          "height": 2048,
          "alt": {
            "de": "KI-basiert rekonstruierte und kolorierte Fassung des Paarporträts mit interpretierten Gesichts-, Kleidungs- und Texturdetails."
          },
          "caption": {
            "de": "KI — KI-basierte Restaurierung ohne Photoshop-Nachbearbeitung. Rekonstruierte Details sind nicht historisch verifiziert."
          },
          "publicationApproved": true
        }
      },
      "techniques": {
        "de": [
          "Adobe Photoshop: Retusche und Kolorierung",
          "KI-basierte Bildrekonstruktion und Kolorierung"
        ]
      },
      "presentation": {
        "fit": "contain",
        "aspectRatio": 0.6513671875,
        "allowCropping": false
      },
      "manualProcess": {
        "de": "Bildschäden wurden gezielt retuschiert, Farben und Kontraste bewusst gewählt. Die kolorierte Fassung bewahrt einen nachvollziehbaren Bezug zur beschädigten Aufnahme."
      },
      "aiProcess": {
        "de": "Google Gemini rekonstruiert und koloriert das Motiv. Dabei können Gesichter, Kleidungsdetails und Bildtexturen neu interpretiert werden; diese Unterschiede bleiben im Vergleich sichtbar."
      }
    },
    "updatedAt": "2026-11-24"
  },
  {
    "id": "it-support-lab",
    "slug": "it-support-lab",
    "category": "it",
    "origin": "personal",
    "status": "published",
    "publicationApproved": true,
    "isOwnerWork": true,
    "content": {
      "de": {
        "title": "IT Support Lab — Windows & Linux Systemadministration",
        "subtitle": "Abgeschlossenes lokales Lern- und Praxisprojekt mit Windows 11 und Ubuntu 24.04 unter WSL2.",
        "summary": "PowerShell- und Bash-Automatisierung, lokale Diagnose, drei praktische Linux-Fehleranalysen sowie geprüfte Backup- und Restore-Abläufe mit Testdaten.",
        "background": "Ich habe ein lokales IT-Administrationslabor für Windows 11 und Ubuntu 24.04 LTS unter WSL2 entwickelt. Es verbindet nachvollziehbare Diagnose mit praktischen Übungen und datensparsamen Offline-HTML-Berichten. Das abgeschlossene Lern- und Praxisprojekt läuft auf einem einzelnen Computer; es ist keine produktive Unternehmensumgebung.",
        "chapters": [
          {
            "id": "windows-health",
            "title": "Windows System Health",
            "description": "PowerShell erfasst Systeminformationen, CPU- und RAM-Auslastung, feste Datenträger und den Zustand ausgewählter Windows-Dienste. Ein offline lesbarer HTML-Bericht macht die Ergebnisse nachvollziehbar, ohne personenbezogene Systemkennungen auszugeben.",
            "bullets": [
              "Kurze Messungen und klar benannte Warn- oder unbekannte Zustände",
              "Datensparsame Ausgabe statt vollständiger System- und Netzwerkdetails"
            ],
            "imageId": "lab-windows-health"
          },
          {
            "id": "linux-administration",
            "title": "Linux: Automatisierung und Systemzustand",
            "description": "Unter Ubuntu 24.04 in WSL2 habe ich Bash-Automatisierung, Benutzer- und Gruppenzugehörigkeit, Dateirechte sowie Prozess- und systemd-Status untersucht. Die Diagnose berichtet zusammengefasste Werte statt Prozessnamen oder Benutzerkennungen.",
            "bullets": [
              "Benutzer und Gruppen beobachtet, keine Systemkonten angelegt oder verändert",
              "Übungen ohne sudo mit eigenen, temporären Dateien auf dem Linux-Dateisystem"
            ],
            "imageId": "lab-linux-administration"
          },
          {
            "id": "linux-troubleshooting",
            "title": "Drei echte Linux-Troubleshooting-Übungen",
            "description": "Die Fehler wurden mit entbehrlichen Labordateien tatsächlich erzeugt, eingegrenzt und behoben. Bestehende Benutzer, Gruppen und Systemkonfigurationen blieben unverändert.",
            "bullets": [],
            "examples": {
              "kind": "laboratory",
              "items": [
                {
                  "title": "Ausführungsrecht fehlt",
                  "problem": "Der direkte Skriptstart scheitert mit Exit 126.",
                  "diagnosis": "ls, stat und test -x bestätigen Dateimodus 600 ohne Ausführungsrecht.",
                  "solution": "chmod 700 ausschließlich für das eigene Laborskript.",
                  "result": "Direkter Start mit LAB_EXEC_OK und Exit 0; Dateimodus 700 bestätigt."
                },
                {
                  "title": "Konfiguration zu weit freigegeben",
                  "problem": "Die neue Testdatei hat unnötig weit gesetzte Schreibrechte.",
                  "diagnosis": "stat und ls zeigen Modus 666. Der private Elternordner bleibt auf 700.",
                  "solution": "Rechte von 666 auf 640 begrenzt, ohne rekursive Änderung.",
                  "result": "Inhalt mode=lab unverändert. Kein Zugriffstest mit einem zweiten Benutzer; bestehende Systemkonten unverändert."
                },
                {
                  "title": "Relativer Pfad zeigt ins Leere",
                  "problem": "Das Lesen der Konfiguration scheitert aus einem anderen Arbeitsverzeichnis mit Exit 1.",
                  "diagnosis": "Arbeitsverzeichnis, Laborstruktur und Skriptpfad verglichen.",
                  "solution": "Pfad vom Skriptverzeichnis aus abgeleitet, statt vom Aufrufverzeichnis.",
                  "result": "Erfolgreicher Aufruf auch aus einem anderen Arbeitsverzeichnis: LAB_PATH_OK und Exit 0."
                }
              ]
            }
          },
          {
            "id": "network-diagnostics",
            "title": "Netzwerkdiagnose mit klaren Grenzen",
            "description": "Windows- und Linux-Skripte untersuchen Adapterstatus, Routing, die lokale Resolverkonfiguration, die lokale Auflösung von localhost und IPv4-Loopback. Der gezeigte Bericht enthält Ergebnisse eines abgeschlossenen lokalen Diagnoselaufs.",
            "bullets": [
              "Resolverkonfiguration als Anzahl von Einträgen, ohne IP- oder MAC-Adressen",
              "Ein einzelner lokaler TCP-Test ist ausdrücklich opt-in; in den realen Validierungsläufen wurde er nicht ausgeführt.",
              "Öffentliches DNS und Internetverbindung wurden nicht getestet."
            ],
            "imageId": "lab-network-troubleshooting"
          },
          {
            "id": "network-fixtures",
            "title": "Drei Netzwerkfehler — bewusst simuliert",
            "description": "Die folgenden Fehlerfälle wurden ausschließlich mit deterministischen Test-Fixtures simuliert. Es wurden keine realen Netzwerkausfälle erzeugt oder repariert.",
            "bullets": [],
            "examples": {
              "kind": "simulation",
              "items": [
                {
                  "title": "Lokale Namensauflösung fehlt",
                  "problem": "Das Fehler-Fixture liefert keine erfolgreiche lokale Auflösung.",
                  "diagnosis": "Den vorgegebenen Auflösungsstatus mit dem korrigierten Fixture verglichen.",
                  "solution": "Korrigiertes Fixture mit erfolgreichem Auflösungsstatus verwendet.",
                  "result": "Erwartete Vorher-/Nachher-Zustände geprüft; kein echter Resolver verändert."
                },
                {
                  "title": "Erforderliche Route fehlt",
                  "problem": "Im Fehler-Fixture fehlt die erforderliche Route.",
                  "diagnosis": "Die vorgegebenen Routing-Zustände getrennt von anderen Prüfebenen ausgewertet.",
                  "solution": "Korrigiertes Fixture mit vorhandener Route verwendet.",
                  "result": "Statusfolge automatisch geprüft; keine reale Route angelegt oder repariert."
                },
                {
                  "title": "Lokale TCP-Verbindung abgelehnt",
                  "problem": "Das Fixture meldet eine abgelehnte lokale TCP-Verbindung.",
                  "diagnosis": "Die Route ist bereits vorhanden; sie erklärt den simulierten TCP-Fehler nicht.",
                  "solution": "Korrigiertes Fixture mit erfolgreichem lokalen TCP-Status verwendet.",
                  "result": "Beide Zustände geprüft; kein echter Dienst gestartet und kein entfernter TCP-Dienst getestet."
                }
              ]
            }
          },
          {
            "id": "backup-restore",
            "title": "Backup und Restore: Daten tatsächlich zurückgeholt",
            "description": "Auf Windows und Linux wurden je vier generierte Testdateien gesichert und wiederhergestellt. SHA-256-Prüfungen vergleichen Quelle und Sicherung; eine unabhängige Prüfung bestätigt den Restore. Alle Vorgänge nutzten entbehrliche Testdaten auf demselben Computer.",
            "bullets": [
              "Manipulierte Datei in einer separaten Testkopie erkannt",
              "Fehlende Datei in einer separaten Testkopie erkannt",
              "Bereits vorhandenes Zielverzeichnis geschützt; Überschreiben verweigert",
              "Kein Offsite-Backup und kein Nachweis für Disaster Recovery oder Produktivbetrieb"
            ],
            "imageId": "lab-backup-restore"
          },
          {
            "id": "quality-assurance",
            "title": "271 automatisierte Prüfungen",
            "description": "Der jüngste Validierungsbericht des Projekts dokumentiert 271 bestandene automatisierte Prüfungen: Windows Health 55, Linux Health 36, Netzwerk Windows 54 und Linux 50 sowie Backup Windows und Linux je 38. Diese Zahl stammt aus der Projektvalidierung, nicht aus einem extern zertifizierten Audit.",
            "bullets": [
              "Reale lokale Messungen und Dateioperationen getrennt von simulierten Netzwerkfehlern",
              "Reproduzierbare Prüfungen mit klar benannten Grenzen statt pauschaler Erfolgsaussagen"
            ]
          },
          {
            "id": "scope-and-privacy",
            "title": "Einordnung und Datenschutz",
            "description": "Die vier Bilder sind ausgewählte Ausschnitte abgeschlossener Labordurchläufe vom 19. und 20. November 2026, kein Live-Monitoring. Veröffentlicht werden nur geprüfte Bildschirmbilder, keine rohen Diagnoseberichte. Namen, Hostnamen, private Pfade, IP- und MAC-Adressen sind darin nicht enthalten.",
            "bullets": [
              "Ein lokales Eigenprojekt als praktischer Kompetenznachweis",
              "Keine Aussage über produktive Server, Unternehmensnetzwerke oder einen externen Sicherheitsnachweis"
            ]
          }
        ],
        "contribution": "Ich habe die PowerShell- und Bash-Skripte, die HTML/CSS-Berichte und automatisierten Prüfungen umgesetzt. Dazu gehören die lokale Windows- und Linux-Diagnose, drei echte Linux-Troubleshooting-Übungen, getrennte Netzwerk-Simulationen sowie Backup und Restore mit Integritätsprüfung.",
        "objectives": [],
        "responsibilities": [],
        "process": [],
        "results": [],
        "lessons": []
      }
    },
    "tools": [
      "Windows 11",
      "PowerShell",
      "Ubuntu 24.04 LTS",
      "WSL2",
      "Bash",
      "SHA-256",
      "HTML/CSS-Berichte",
      "Netzwerkdiagnostik",
      "Git",
      "Automatisierte Tests"
    ],
    "cover": {
      "id": "lab-windows-health",
      "file": "public/media/projects/it-support-lab/windows-health.webp",
      "width": 1104,
      "height": 654,
      "alt": {
        "de": "Ausschnitt eines echten Windows-Systemberichts mit Systemüberblick, CPU-Messung und RAM-Warnung; ohne personenbezogene Kennungen."
      },
      "caption": {
        "de": "Windows System Health: statischer Ausschnitt eines abgeschlossenen Labordurchlaufs, kein Live-Monitoring."
      },
      "publicationApproved": true
    },
    "gallery": [
      {
        "id": "lab-linux-administration",
        "file": "public/media/projects/it-support-lab/linux-administration.webp",
        "width": 1104,
        "height": 423,
        "alt": {
          "de": "Linux-Bericht mit zusammengefassten Prozesszahlen, systemd-Status und Benutzerkontext ohne Namen oder Prozesskennungen."
        },
        "caption": {
          "de": "Linux System Health: Prozess- und systemd-Status sowie Benutzerkontext als datensparsame Zusammenfassung."
        },
        "publicationApproved": true
      },
      {
        "id": "lab-network-troubleshooting",
        "file": "public/media/projects/it-support-lab/network-troubleshooting.webp",
        "width": 1104,
        "height": 657,
        "alt": {
          "de": "Echter Netzwerkbericht mit lokaler Auflösung und IPv4-Loopback; TCP nicht ausgeführt, öffentliches DNS und Internet nicht geprüft."
        },
        "caption": {
          "de": "Lokale Netzwerkdiagnose eines abgeschlossenen Laufs. TCP nicht ausgeführt; öffentliches DNS und Internet nicht geprüft."
        },
        "publicationApproved": true
      },
      {
        "id": "lab-backup-restore",
        "file": "public/media/projects/it-support-lab/backup-restore.webp",
        "width": 1104,
        "height": 401,
        "alt": {
          "de": "Backup-Bericht mit vier Testdateien, erfolgreicher SHA-256-Integritätsprüfung und unabhängig geprüftem Restore."
        },
        "caption": {
          "de": "Echter Backup-/Restore-Lauf mit vier generierten Testdateien auf demselben Computer."
        },
        "publicationApproved": true
      }
    ],
    "storyboard": [],
    "updatedAt": "2026-11-20"
  }
]
