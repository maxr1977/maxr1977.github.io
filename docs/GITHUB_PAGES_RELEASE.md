# Maksym Rechyn — GitHub Pages release

Vite + React + TypeScript. Target repository: **maxr1977/maxr1977.github.io**.
Expected URL after a successful, approved deployment: **https://maxr1977.github.io/**.
This URL is not evidence of an existing deployment.

## Local validation

Use Node.js 22.13+ (22.x) or Node.js 24+. The workflow uses Node 24.

```powershell
npm.cmd ci
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd audit --audit-level=moderate
npm.cmd run build
npm.cmd run audit:repository
npm.cmd run check:release
```

Build is allowed for local review while release checks are blocked. Never change
approval fields only to make a check green. Document the evidence first.

## Routing on Pages

BrowserRouter and clean URLs are preserved. Vite uses base `/` for this user site.
The build emits a copy of the application shell for `/projekte/`, `/impressum/`,
`/datenschutz/` and each approved published project path. Known directory paths
therefore return HTTP 200 on a static host; extensionless requests may first
redirect to a trailing slash. Query parameters survive the directory redirect.
Unknown paths use `404.html` with an actual 404, rather than making known routes
depend on a 404 workaround. `.nojekyll` is emitted. Only `dist` is uploaded.
Actions artifact upload excludes dotfiles; Pages Actions deployments do not run
Jekyll, so they do not depend on `.nojekyll` being included in that artifact.
These are application shells, not prerendered content. New static routes need a
plugin/test update; newly approved project slugs are included automatically.

For an optional local static-host check, with Python 3 available:

```powershell
npm.cmd run build
python -m http.server 5185 --bind 127.0.0.1 --directory dist
```

Open known deep URLs and reload. This server serves real directory indexes,
without a Vite SPA fallback. Its unknown-path error body differs from Pages'
custom 404, so check the latter again after the real deployment.

## Owner approval and release status

On 24 November 2026 Maksym Rechyn explicitly reviewed and approved the final
Impressum and Datenschutzerklärung, including the voluntary-contact amendment,
for GitHub Pages publication. `legalReviewApproved` means this informed owner
approval. It does not mean independent professional legal certification.
`legalApproval` records the owner/date, approval kind, approved document SHA-256
and `independentProfessionalCertification: false`. Approved legal/contact source
files are preserved. If these texts or contact details change, obtain renewed
owner approval and update the record; do not silently inherit an old approval.

The owner expressly acknowledges the documented uncertainties. They remain in
`acknowledgedUncertainties`; they are not represented as independently resolved.
Pending owner approval is closed, so `openItems` is empty. All existing readiness,
OFFEN, asset, source/history and CI checks remain enabled.
GitHub Pages is selected; it documents visitor IP logging for security. No exact
Pages IP-log retention period is stated in the cited Pages documentation.
The revised German notice identifies personal Gmail (not Workspace) and links
Google's privacy, international-transfer and retention information. The owner
adopted monthly necessity reviews and manual deletion of unneeded completed
correspondence, with continued storage for active employment processes or concrete
legal grounds. No fixed blanket retention period or auto-deletion is claimed.
Provider roles/basis/any necessary agreements and the scope of transfers remain
documented limitations accepted by the owner. A provider's general statement is
not an account-specific DPA or a guarantee for every transfer. Gmail's trash rule
is not automatic inbox deletion. No professional legal compliance warranty is made.

The monthly review is now the owner's expressly adopted practice, not a statutory
retention duration or an automation implemented by this application. The final
texts are now owner-approved. Preview-only pending banners are hidden on approval.
The release gate permits the approved clean snapshot; the old development source
and its history must still fail the public source audit.

On 24 November 2026 the owner confirmed his own selfie as the portrait source,
its editing in consumer Google Gemini and publication authorization. He also
confirmed family photograph/scan rights and use of both the manual Photoshop and
separate Gemini reconstruction. No exact image model is asserted.

Google's consumer terms do not claim ownership of created original content;
Gemini guidance requires review before publication and respect for others' rights.
No general prohibition of this described use was identified. This scoped review
does not establish exclusive copyright in generated elements, an indemnity or a
warranty of legal compliance. The images remain unchanged.

- [Consumer terms, Germany](https://policies.google.com/terms?hl=de&gl=de)
- [Gemini image guidance](https://support.google.com/gemini/answer/14286560?hl=de)
- [Generative AI prohibited-use policy](https://policies.google.com/terms/generative-ai/use-policy?hl=de)

### Public asset inventory reviewed for this preparation

| Group                  | Files                         | Findings / remaining confirmation                                                                                                                      |
| ---------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| StudioFlow             | 4 existing WebP screenshots   | Authentic supplied frontend-demo captures with fictional data; no source repository is copied.                                                         |
| IT Support Lab         | 4 existing WebP screenshots   | Selected supplied report views; raw diagnostic reports and private source remain excluded.                                                             |
| Portrait               | 2 existing WebP sizes         | Own selfie edited in consumer Gemini; explicit owner publication authorization confirmed.                                                              |
| Historical restoration | 3 original JPEGs, 1334 × 2048 | Owner-authorized family scan, separate manual Photoshop work and consumer Gemini reconstruction. Historical age alone was not used as proof of rights. |

All 13 media files remain byte-for-byte unchanged. No EXIF entries were found
with Pillow's inspection; this does not prove absence of every possible metadata
format or establish rights. Favicon and icons use existing inline SVG; fonts use
the system stack. No new assets, image conversions or AI-generated media were added.

`check:release` still fails if
any readiness flag is missing, openItems is nonempty, or privacy paragraphs still
contain OFFEN. CI also runs a fresh npm audit and public history audit. Noindex is
retained in blocked builds; the Pages plugin enables indexing only for ready builds.
Passing records owner publication readiness, not independent legal certification.

## Safe public source

Do not push a private development repository or its old history without review.
Production bundle filtering does not hide tracked source or old Git objects.
The local working registry may contain unpublished records and internal notes.

`npm.cmd run prepare:public` creates a **new** `.release/public-source` snapshot,
without `.git`, private planning files, QA output or raw reports. It copies an
allowlist of source/config/tests and the approved media, projects only approved
records through the existing publication whitelist, and substitutes this short
public README for private development history. It does not initialize Git, commit,
upload or deploy. Existing output directories are never overwritten.

The approved release snapshot is **`.release/public-source-approved`**. The older
`.release/public-source` and `.release/public-source-final` copies are stale and
must not be published. This approved snapshot was regenerated through the existing
allowlist, without any `.git`. Never copy the original development history.
Local validation may create ignored node_modules,
dist or caches; those are not source files and must not enter the staged release.

For a later snapshot use a fresh path:

```powershell
npm.cmd run prepare:public -- --out .release/public-source-after-review
```

Review all generated files. The source audit uses best-effort credential/path
patterns, not a guarantee that every secret or copyright issue has been detected.
Do not include personal PDFs, credentials, unreviewed image sources or proprietary
repositories. Keep the original private history locally.

## First public push — owner actions only, after all blockers are resolved

1. On github.com, sign in as **maxr1977** and create an empty **Public** repository
   named **maxr1977.github.io**. Do not initialize a README, license or .gitignore.
   If that repository already exists, inspect it before doing anything; do not
   force-push or replace existing work.
2. Use only the approved snapshot path below. If its source has changed since
   validation, review approvals, rerun validation and regenerate into a fresh path.
3. In the reviewed snapshot directory only (not the private working repository):

```powershell
Set-Location C:\Projekt\Portfolio\maksym-portfolio\maksym-portfolio-starter\.release\public-source-approved
npm.cmd run check:release
if ($LASTEXITCODE -ne 0) { throw 'Release is still blocked. Stop before Git initialization.' }
node --experimental-strip-types scripts/audit-repository.mjs --snapshot
if ($LASTEXITCODE -ne 0) { throw 'Public snapshot audit failed.' }
git init -b main
if ($LASTEXITCODE -ne 0) { throw 'Git initialization failed.' }
git add .
if ($LASTEXITCODE -ne 0) { throw 'Staging failed.' }
git diff --cached --stat
git diff --cached --check
if ($LASTEXITCODE -ne 0) { throw 'Staged diff check failed.' }
# Review staged content before committing. Use a reviewed Git author identity.
git commit -m "Initial public portfolio release"
if ($LASTEXITCODE -ne 0) { throw 'Commit failed.' }
npm.cmd run audit:repository
if ($LASTEXITCODE -ne 0) { throw 'Repository/history audit failed. Do not push.' }
npm.cmd run check:release
if ($LASTEXITCODE -ne 0) { throw 'Release gate failed. Do not push.' }
git remote add origin https://github.com/maxr1977/maxr1977.github.io.git
if ($LASTEXITCODE -ne 0) { throw 'Remote setup failed. Inspect existing configuration.' }
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw 'Push failed. Inspect the error; do not force-push.' }
```

If a fresh snapshot was generated at another path, substitute that exact path.
Dependencies can be installed in the snapshot with `npm.cmd ci` before checking.
Stop if audit or readiness fails. Use normal GitHub authentication; do not put a
personal access token in the remote URL or source. Prefer a GitHub no-reply commit
email if you do not want a personal author email in public history.

## Enable GitHub Pages — owner actions only

1. Open the repository → **Settings → Pages → Build and deployment → Source**.
2. Select **GitHub Actions**, not deployment from a branch or `/docs` folder.
3. Inspect `.github/workflows/deploy.yml`. Pushes to main and manual runs on main
   validate, audit, enforce release checks, build, then upload only `dist`.
4. Open **Actions → Validate and deploy GitHub Pages → Run workflow**, branch main,
   or rerun the initial run if it failed before Pages was enabled.
5. The deploy job uses the **github-pages** environment. Configure its deployment
   protection/reviewer rules as appropriate. No user PAT is required by the workflow.
6. Wait for both jobs to succeed. Check the environment URL and Settings → Pages.
   Only then treat https://maxr1977.github.io/ as an active deployment.
7. Verify HTTPS, all seven direct routes, reload, filters, images, legal links,
   comparison/viewers, browser history and console on the real public host.
   Repeat privacy/header/cookie checks on the actual service.

## Later updates

Keep private planning in the local working project. Generate a new reviewed public
snapshot and compare/copy its changed public files into the public checkout.
Do not copy `.git`, QA folders or private registry records. Run checks, review the
diff, commit and push to main manually. A successful workflow updates Pages.
Never force-push to remove accidentally exposed secrets: revoke affected secrets
and handle history cleanup separately. A private source repository is not deployed.

## Future custom domain

No custom domain is configured now. After selecting and verifying a domain, follow
GitHub's domain-verification and DNS instructions, set it in Settings → Pages,
enable HTTPS when available, and update the expected URL and privacy information.
For this custom Actions workflow, GitHub says a repository CNAME file is ignored
and is not required; configure the domain in Pages settings instead. A DNS CNAME
record for a subdomain is a different thing and may still be required.
Do not guess DNS values; take current values from the official documentation.
Root base `/` remains appropriate for a root custom domain.

## Official references (reviewed 24 November 2026)

- [Pages and visitor IP logging](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection)
- [GitHub General Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)
- [Google privacy / Gmail](https://policies.google.com/privacy?hl=de)
- [Google transfers](https://policies.google.com/privacy/frameworks?hl=de)
- [Google retention](https://policies.google.com/technologies/retention?hl=de)
- [Gmail deletion](https://support.google.com/mail/answer/7401?hl=de)
- [European Commission: storage limitation](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/principles-gdpr_en#storage-limitation)
- [Custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Publishing source settings](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

No site-wide content license or exclusive rights in AI-generated elements are
granted by this README. Owner authorization is specific to this portfolio's media.
