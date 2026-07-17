# Memes (WeChat-spøken)

WeChat-appen (`src/components/WeChatApp.tsx`) «verifiserer» brukeren og viser et meme.
Legg disse filene her:

| Fil | Vises når | Type |
| --- | --- | --- |
| `idiot.gif` | Etter «Pass» → ta bilde → Last opp | bilde/gif |
| `klovn.mp4` | Etter «Selfie» → ta bilde → Last opp | video |
| `alarm.mp4` | Etter «Bankkontodetaljer» → Bekreft | video |
| `larry.gif` | Skjult: 1 % sjanse etter hvert klikk («hacket»-glitch) | bilde/gif |

Mangler en fil, viser appen bare «(Legg fila på …)» i stedet — ingen feil.
Ingen data forlater enheten; kamerabildet og kortfeltene brukes kun lokalt til spøken.
