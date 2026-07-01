# Hvor du legger bevismateriale

> 📖 **Skal du skrive selve saken?** Se `docs/skriveguide.md` for hvordan du porsjonerer
> dokumenter, planter falske spor og holder alt kort. Kjør `npm run check:content` for å
> flagge dokumenter som blir for lange.

Legg filene dine her, og pek på dem fra `src/case/manifest.ts` (uten `public/`-prefiks):

| Type           | Legg filen i        | I manifestet                                                    |
| -------------- | ------------------- | --------------------------------------------------------------- |
| Bilde          | `case/dag1/foto.jpg`| `{ kind: 'image', src: 'case/dag1/foto.jpg' }`                  |
| PDF            | `case/dag2/rapp.pdf`| `{ kind: 'pdf', src: 'case/dag2/rapp.pdf' }`                    |
| Instagram-bilde| `case/instagram/p1.jpg` | `{ img: 'case/instagram/p1.jpg' }` (i `instagram`-lista)   |
| LinkedIn-bilde | `case/linkedin/p1.jpg`  | `{ img: 'case/linkedin/p1.jpg' }` (i `linkedin`-lista, valgfritt) |
| Angelas fil    | `case/angela/foto1.jpg` | `{ kind: 'image', src: 'case/angela/foto1.jpg' }` (i `angelaFiles`) |

Tekstdokumenter kan enten skrives rett i manifestet (`inline: '...'`) eller legges
som `.md`/`.html`-fil her og pekes på med `src`.

## Bilder inni tekst (markdown)

Du kan blande tekst og bilder i ett og samme dokument. Skriv vanlig markdown-bilde
med en relativ sti (uten `public/`), så får det automatisk riktig adresse:

```
![Åstedsskisse](case/dag1/skisse.jpg)
```

## Mistenkte-tavla

Fyll inn `suspects: [...]` i manifestet (id, navn, rolle, valgfritt `img`, `status`
og markdown-`notes`). Da dukker en «Mistenkte»-app opp på skrivebordet. Bilder legges
f.eks. i `case/mistenkte/per.jpg`. Uten `img` vises initialene.

## Bildevalg-spørsmål (image_choice)

Et flervalg der hvert alternativ kan ha et bilde:

```
question: {
  type: 'image_choice',
  prompt: 'Hvilket våpen ble brukt?',
  options: [
    { id: 'kniv', label: 'Kniv', img: 'case/dag3/kniv.jpg' },
    { id: 'gift', label: 'Gift', img: 'case/dag3/gift.jpg' },
  ],
}
```

Tips: bruk gjerne litt kryptiske filnavn på senere dagers filer (f.eks.
`case/dag3/8f2a-brev.jpg`) så ingen gjetter URL-en før dagen er åpnet.
