import { useState } from 'react'
import { savePlayer, type Player } from '../lib/player'

export default function NamePrompt({ onDone }: { onDone: (p: Player) => void }) {
  const [name, setName] = useState('')
  return (
    <div className="panel">
      <p style={{ marginTop: 0 }}>
        <strong>Velkommen, etterforsker.</strong> Hva heter du? (Navnet vises ikke til andre — det
        brukes bare for å huske stemmene dine.)
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim().length < 2) return
          onDone(savePlayer(name))
        }}
      >
        <input
          className="field"
          placeholder="Navn eller kallenavn"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          autoFocus
        />
        <div style={{ marginTop: 12 }}>
          <button className="btn btn--primary" type="submit" disabled={name.trim().length < 2}>
            Fortsett
          </button>
        </div>
      </form>
    </div>
  )
}
