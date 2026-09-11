/**
 * Human-friendly reference numbers. Date prefix keeps them sortable and
 * scannable; the random suffix avoids needing a separate counter table.
 */
const suffix = () => {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 4; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

const datePart = () => {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

export const orderNumber = () => `AE-${datePart()}-${suffix()}`
export const serviceRequestNumber = () => `SR-${datePart()}-${suffix()}`
