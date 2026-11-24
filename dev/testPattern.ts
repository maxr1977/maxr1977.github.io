// Code-native coordinate fixtures. Never portfolio media or restoration results.
export const patternSizes = {
  landscape: [1200, 800], smallLandscape: [600, 400],
  square: [960, 960], portrait: [800, 1200], wide: [1400, 700],
} as const
export type PatternSize = keyof typeof patternSizes

export function createTestPattern(params: URLSearchParams) {
  const size = params.get('size') ?? 'landscape'
  const variant = params.get('variant') ?? 'original'
  const delay = Number(params.get('delay') ?? 0)
  const failure = params.get('failure') ?? '0'
  if (!Object.hasOwn(patternSizes, size) || !['original', 'manual', 'aiAssisted'].includes(variant) ||
    ![0, 150, 1500, 4000].includes(delay) || !['0', '1'].includes(failure)) return null
  const [width, height] = patternSizes[size as PatternSize]
  const background = variant === 'original' ? '#dce4fc' : variant === 'manual' ? '#b9e4d6' : '#f4d5c1'
  const name = variant === 'original' ? 'A · Original-Modus' : variant === 'manual' ? 'B · Photoshop-Modus' : 'C · KI-Modus'
  const font = Math.max(16, Math.round(width / 45))
  const lines = Array.from({ length: 11 }, (_, index) => {
    const x = width * index / 10
    const y = height * index / 10
    return `<path d="M ${x} 0 V ${height} M 0 ${y} H ${width}" />
      <text x="${x + 4}" y="${height * .63}" stroke="none" font-size="${font * .7}">${index * 10}</text>
      <text x="${width * .53}" y="${Math.max(font, y - 4)}" stroke="none" font-size="${font * .7}">${index * 10}</text>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <title>SYNTHETISCHES TESTMUSTER — KEINE FOTORESTAURIERUNG</title>
    <rect width="100%" height="100%" fill="${background}"/>
    <g stroke="#63769a" stroke-width="1" fill="#121b2b" font-family="monospace">${lines}</g>
    <g fill="none" stroke="#121b2b" stroke-width="3">
      <rect x="${width * .02}" y="${height * .02}" width="${width * .96}" height="${height * .96}"/>
      <circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) * .12}"/>
      <path d="M ${width * .3} ${height / 2} H ${width * .7} M ${width / 2} ${height * .3} V ${height * .7}"/>
      <circle cx="${width * .1}" cy="${height * .1}" r="${font / 2}"/>
      <circle cx="${width * .9}" cy="${height * .9}" r="${font / 2}"/>
    </g>
    <g fill="#121b2b" font-family="monospace" font-size="${font}" font-weight="bold">
      <text x="5%" y="20%">SYNTHETISCHES TESTMUSTER</text>
      <text x="5%" y="25%">KEINE FOTORESTAURIERUNG</text>
      <text x="5%" y="80%">${name}</text>
      <text x="5%" y="86%">${width} × ${height} · Raster 0–100 %</text>
      <text x="5%" y="94%">(0,0) oben links · (100,100) unten rechts</text>
    </g>
  </svg>`
  return { svg, width, height, delay, failure: failure === '1' }
}
