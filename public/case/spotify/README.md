# Musikk (Spotify-appen)

Legg lydfiler (`.mp3`, `.m4a`, `.ogg` …) her, og list dem opp i `src/case/manifest.ts`
under `spotify: [...]`:

```ts
spotify: [
  { src: 'case/spotify/sang1.mp3', title: 'Tittel', artist: 'Artist' },
  { src: 'case/spotify/sang2.mp3' }, // tittel/artist utledes fra filnavnet
],
```

Spilleren velger en **tilfeldig** sang og lar deg pause, hoppe fram (ny tilfeldig)
og tilbake (forrige spilte). Mangler en fil, viser den «Kunne ikke spille sporet».
Appen skjules fra skrivebordet hvis `spotify`-lista er tom.
