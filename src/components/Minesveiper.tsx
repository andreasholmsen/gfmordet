import { useCallback, useMemo, useState } from 'react'
import AppWindow from './AppWindow'
import { sfx } from '../lib/sfx'

// Klassisk Minesveiper — helt frittstående lite spill (et lite påskeegg på
// skrivebordet). Nybegynnerbrett: 9×9 med 10 miner. Mobilvennlig: «flagg-modus»
// erstatter høyreklikk.

const COLS = 9
const ROWS = 9
const MINES = 10

interface Cell {
  mine: boolean
  revealed: boolean
  flagged: boolean
  adjacent: number
}

type Board = Cell[][]
type GameState = 'playing' | 'won' | 'lost'

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
    })),
  )
}

function neighbours(r: number, c: number): [number, number][] {
  const out: [number, number][] = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) out.push([nr, nc])
    }
  }
  return out
}

// Plasser miner FØR første klikk-feltet (og naboene) så første klikk er trygt.
function plantMines(board: Board, safeR: number, safeC: number): Board {
  const next = board.map((row) => row.map((cell) => ({ ...cell })))
  const forbidden = new Set<string>([`${safeR},${safeC}`])
  neighbours(safeR, safeC).forEach(([r, c]) => forbidden.add(`${r},${c}`))

  let placed = 0
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS)
    const c = Math.floor(Math.random() * COLS)
    if (forbidden.has(`${r},${c}`) || next[r][c].mine) continue
    next[r][c].mine = true
    placed++
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (next[r][c].mine) continue
      next[r][c].adjacent = neighbours(r, c).filter(([nr, nc]) => next[nr][nc].mine).length
    }
  }
  return next
}

function floodReveal(board: Board, r: number, c: number): Board {
  const next = board.map((row) => row.map((cell) => ({ ...cell })))
  const stack: [number, number][] = [[r, c]]
  while (stack.length) {
    const [cr, cc] = stack.pop()!
    const cell = next[cr][cc]
    if (cell.revealed || cell.flagged) continue
    cell.revealed = true
    if (cell.adjacent === 0 && !cell.mine) {
      neighbours(cr, cc).forEach(([nr, nc]) => {
        if (!next[nr][nc].revealed) stack.push([nr, nc])
      })
    }
  }
  return next
}

function countFlags(board: Board): number {
  return board.flat().filter((c) => c.flagged).length
}

function hasWon(board: Board): boolean {
  return board.flat().every((c) => c.mine || c.revealed)
}

function Game() {
  const [board, setBoard] = useState<Board>(emptyBoard)
  const [state, setState] = useState<GameState>('playing')
  const [started, setStarted] = useState(false)
  const [flagMode, setFlagMode] = useState(false)

  const reset = useCallback(() => {
    setBoard(emptyBoard())
    setState('playing')
    setStarted(false)
    setFlagMode(false)
  }, [])

  function handleCell(r: number, c: number) {
    if (state !== 'playing') return
    const cell = board[r][c]

    if (flagMode) {
      if (cell.revealed) return
      const next = board.map((row) => row.map((x) => ({ ...x })))
      next[r][c].flagged = !next[r][c].flagged
      sfx.click()
      setBoard(next)
      return
    }

    if (cell.flagged || cell.revealed) return

    let working = board
    if (!started) {
      working = plantMines(board, r, c)
      setStarted(true)
    }

    if (working[r][c].mine) {
      const next = working.map((row) => row.map((x) => ({ ...x })))
      next.forEach((row) => row.forEach((x) => x.mine && (x.revealed = true)))
      sfx.error()
      setBoard(next)
      setState('lost')
      return
    }

    const next = floodReveal(working, r, c)
    sfx.click()
    if (hasWon(next)) {
      setState('won')
      sfx.success()
    }
    setBoard(next)
  }

  const minesLeft = MINES - countFlags(board)
  const face = state === 'won' ? '😎' : state === 'lost' ? '💥' : '🙂'

  return (
    <div className="mine">
      <div className="mine__bar">
        <span className="mine__count" aria-label="Miner igjen">
          💣 {String(Math.max(0, minesLeft)).padStart(2, '0')}
        </span>
        <button className="mine__face" onClick={reset} aria-label="Nytt spill">
          {face}
        </button>
        <button
          className={`mine__flag-toggle ${flagMode ? 'is-active' : ''}`}
          onClick={() => setFlagMode((f) => !f)}
          aria-pressed={flagMode}
        >
          🚩 {flagMode ? 'på' : 'av'}
        </button>
      </div>

      {state === 'won' && <p className="notice notice--ok">Du klarte det! 🎉</p>}
      {state === 'lost' && <p className="notice notice--error">Bom! Trykk på fjeset for nytt spill.</p>}

      <div className="mine__grid" role="grid">
        {board.map((row, r) => (
          <div className="mine__row" role="row" key={r}>
            {row.map((cell, c) => {
              const cls = [
                'mine__cell',
                cell.revealed ? 'is-revealed' : '',
                cell.revealed && cell.adjacent ? `n${cell.adjacent}` : '',
              ]
                .filter(Boolean)
                .join(' ')
              return (
                <button
                  key={c}
                  className={cls}
                  role="gridcell"
                  onClick={() => handleCell(r, c)}
                >
                  {cell.revealed
                    ? cell.mine
                      ? '💣'
                      : cell.adjacent || ''
                    : cell.flagged
                      ? '🚩'
                      : ''}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <p className="notice mine__hint">
        Tips: slå på 🚩 for å markere miner i stedet for å avdekke ruter.
      </p>
    </div>
  )
}

export default function Minesveiper() {
  // Egen instans per montering.
  const game = useMemo(() => <Game />, [])
  return (
    <AppWindow title="Minesveiper" icon="💣" variant="folder">
      {game}
    </AppWindow>
  )
}
