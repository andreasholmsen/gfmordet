// Enkel spiller-identitet lagret i nettleseren (localStorage).
// Ingen innlogging — bare et navn + en tilfeldig id som brukes til å hindre
// dobbel stemming per enhet. Best effort: to enheter = to identiteter.

const KEY = 'gf-mordet.player.v1'

export interface Player {
  playerId: string
  displayName: string
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  // Fallback for eldre nettlesere
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getPlayer(): Player | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Player
    if (p && p.playerId && p.displayName) return p
    return null
  } catch {
    return null
  }
}

export function savePlayer(displayName: string): Player {
  const existing = getPlayer()
  const player: Player = {
    playerId: existing?.playerId ?? uuid(),
    displayName: displayName.trim(),
  }
  localStorage.setItem(KEY, JSON.stringify(player))
  return player
}
