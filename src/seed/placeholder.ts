import sharp from 'sharp'

const PALETTE = ['#0B2A5B', '#123A7E', '#1E4A9E', '#0f172a', '#334155']

/** Generate a simple branded placeholder PNG with a label. */
export const placeholderPng = async (
  label: string,
  width = 800,
  height = 800,
  seed = 0,
): Promise<Buffer> => {
  const bg = PALETTE[seed % PALETTE.length]

  // Bullet CCTV camera, lens + status LED lit — matches <AlertEyeMark />.
  const cam = `<g transform="translate(${width / 2} ${height * 0.4}) scale(${width / 190}) translate(-32 -28)">
    <path d="M8 9H22" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M15.5 9V16" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" fill="none"/>
    <rect x="9" y="24" width="38" height="17" rx="8.5" stroke="#ffffff" stroke-width="3.4" fill="none"/>
    <path d="M11 25.5C10 17 16 14.5 24 14.5H41C47 14.5 50.5 17 51 21.5" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" fill="none"/>
    <circle cx="16.5" cy="31" r="3" fill="#F5A623" opacity="0.22"/>
    <circle cx="16.5" cy="31" r="1.5" fill="#F5A623"/>
    <circle cx="40" cy="32.5" r="8" fill="#F5A623" opacity="0.15"/>
    <circle cx="40" cy="32.5" r="7.4" stroke="#F5A623" stroke-width="2.8" fill="none"/>
    <circle cx="40" cy="27.6" r="0.95" fill="#F5A623"/>
    <circle cx="44.9" cy="32.5" r="0.95" fill="#F5A623"/>
    <circle cx="40" cy="37.4" r="0.95" fill="#F5A623"/>
    <circle cx="35.1" cy="32.5" r="0.95" fill="#F5A623"/>
    <circle cx="40" cy="32.5" r="3.3" fill="#ffffff"/>
    <circle cx="40" cy="32.5" r="1.5" fill="#F5A623"/>
    <path d="M52 25a9 9 0 0 1 0 15" stroke="#F5A623" stroke-width="2.6" stroke-linecap="round" fill="none"/>
    <path d="M56.5 20.5a15 15 0 0 1 0 24" stroke="#F5A623" stroke-width="2.6" stroke-linecap="round" fill="none" opacity="0.4"/>
  </g>`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="${bg}"/>
    <rect x="16" y="16" width="${width - 32}" height="${height - 32}" fill="none" stroke="#F5A623" stroke-width="4" rx="18"/>
    ${cam}
    <text x="50%" y="64%" font-family="Arial, sans-serif" font-size="${Math.round(width / 22)}" fill="#ffffff" text-anchor="middle">${label.replace(/&/g, '&amp;').slice(0, 28)}</text>
    <text x="50%" y="72%" font-family="Arial, sans-serif" font-weight="bold" font-size="${Math.round(width / 26)}" fill="#F5A623" text-anchor="middle" letter-spacing="2">ALERT EYE</text>
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}
