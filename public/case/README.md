# Hvor du legger bevismateriale

Legg filene dine her, og pek på dem fra `src/case/manifest.ts` (uten `public/`-prefiks):

| Type           | Legg filen i        | I manifestet                                                    |
| -------------- | ------------------- | --------------------------------------------------------------- |
| Bilde          | `case/dag1/foto.jpg`| `{ kind: 'image', src: 'case/dag1/foto.jpg' }`                  |
| PDF            | `case/dag2/rapp.pdf`| `{ kind: 'pdf', src: 'case/dag2/rapp.pdf' }`                    |
| Instagram-bilde| `case/instagram/p1.jpg` | `{ img: 'case/instagram/p1.jpg' }` (i `instagram`-lista)   |

Tekstdokumenter kan enten skrives rett i manifestet (`inline: '...'`) eller legges
som `.md`/`.html`-fil her og pekes på med `src`.

Tips: bruk gjerne litt kryptiske filnavn på senere dagers filer (f.eks.
`case/dag3/8f2a-brev.jpg`) så ingen gjetter URL-en før dagen er åpnet.
