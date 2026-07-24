# Lydfiler (app-nivå)

Legg lydfiler som brukes av selve appen her (ikke saksinnhold — det ligger i `case/`).

- `30sec.mp3` — spilles i politi-hacket når det er 30 sekunder igjen.
- `hack-theme.m4a` (eller `hack-theme.mp3`) — bakgrunnsmusikk som looper så lenge
  politi-hacket er åpent. Anbefalt format: AAC/.m4a ~96 kbps
  (`ffmpeg -i sang.wav -c:a aac -b:a 96k hack-theme.m4a`).

Alle filene er valgfrie — mangler en fil spilles ingenting (ingen feil).
