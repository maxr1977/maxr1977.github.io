import { pathToFileURL } from 'node:url'
import { releaseStatus, releaseBlockers } from '../src/data/release.ts'
import { legalCopy } from '../src/data/legal.ts'

export function checkRelease(
  state = releaseStatus,
  privacy = legalCopy.privacy
) {
  return releaseBlockers(
    state,
    privacy.sections.flatMap((section) => section.paragraphs)
  )
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const blockers = checkRelease()
  if (blockers.length) {
    console.error(
      'Release blocked:\n' + blockers.map((value) => '- ' + value).join('\n')
    )
    process.exitCode = 1
  } else
    console.log('Release checks passed. This command does not push or deploy.')
}
