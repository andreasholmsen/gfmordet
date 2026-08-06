// ---------------------------------------------------------------------------
//  BRAGEVALGOMATEN — alt innholdet redigeres HER (spørsmål + Bragene).
//
//  Slik virker det: hver Brage har svart på de samme spørsmålene (`answers`:
//  spørsmåls-id → alternativ-id). Spilleren svarer på quizen, og matchen er
//  den Bragen med flest like svar. Resultatet vises som rangert liste med
//  prosent (NRK-valgomat-stil).
//
//  Alternativene ER Bragenes egne svar (ett per Brage per spørsmål), men
//  rekkefølgen er stokket per spørsmål så ingen Brage alltid ligger øverst.
// ---------------------------------------------------------------------------

export interface ValgomatOption {
  id: string
  label: string
}

export interface ValgomatQuestion {
  id: string
  text: string
  options: ValgomatOption[]
}

export interface BrageProfile {
  id: string
  name: string
  /** Emoji som «portrett» i rangeringslista (og reserve om bildet mangler). */
  emoji: string
  /** Foto som vises på resultatkortet (sti relativt fra /public). */
  img?: string
  /** Kort beskrivelse som vises når man matcher med denne Bragen. */
  description: string
  /** Bragens egne svar: spørsmåls-id → alternativ-id. */
  answers: Record<string, string>
}

export const VALGOMAT_QUESTIONS: ValgomatQuestion[] = [
  {
    id: 'q1',
    text: 'Hvis du ville vært strandet på en øde øy, hvilket ene objekt ville du tatt med deg?',
    options: [
      { id: 'fiskestang', label: 'Fiskestang' },
      { id: 'kniv', label: 'MSK1 kniv' },
      { id: 'snus', label: 'Epok n. 21 freeze' },
    ],
  },
  {
    id: 'q2',
    text: 'Du er på date og trenger å kjapt komme på et samtaleemne, hva begynner du å snakke om?',
    options: [
      { id: 'skole', label: '«Hvilken skole går du på?»' },
      { id: 'harrypotter', label: 'Harry Potter' },
      { id: 'berlinmuren', label: 'Berlinmuren' },
    ],
  },
  {
    id: 'q3',
    text: 'Flyet ditt har blitt forsinket og du er stuck på en flyplass, hvordan får du tiden til å gå?',
    options: [
      { id: 'reels', label: 'Doomscroller reels' },
      { id: 'memes', label: 'Lager memes' },
      { id: 'klm', label: 'Er ikke forsinket, flyr KLM' },
    ],
  },
  {
    id: 'q4',
    text: 'Åneii du har begått en stor feil på jobb og du får kjeft av sjefen!! Hvordan øker du moralen etter jobb?',
    options: [
      { id: 'is', label: 'Spiser en is' },
      { id: 'fjelltur', label: 'Går på fjelltur' },
      { id: 'krampe', label: 'Løper til jeg får krampe' },
    ],
  },
  {
    id: 'q5',
    text: 'GTA VI har nettopp kommet ut. Hvordan sørger du for å få mest mulig tid til å spille 24/7?',
    options: [
      { id: 'pappaperm', label: 'Pappaperm' },
      { id: 'adderal', label: 'Adderal' },
      { id: 'hytta', label: 'Drar på hytta' },
    ],
  },
  {
    id: 'q6',
    text: 'Hvordan ville du imponert ditt ANSA GF crush?',
    options: [
      { id: 'president', label: 'Benket meg til president' },
      { id: 'salto', label: 'Salto på morgenbadet' },
      { id: 'tskjorte', label: 'Ta av t-skjorta' },
    ],
  },
  {
    id: 'q7',
    text: 'Hva tenker du om 6-7 memes?',
    options: [
      { id: 'trigga', label: 'Digger det, blir trigga hver gang' },
      { id: 'tall', label: '6666666667777777!!!!' },
      { id: 'lowkey', label: 'Lowkey avhengighetsskapende' },
    ],
  },
  {
    id: 'q8',
    text: 'Du har et fly (uavhengig av distanse) på kvelden, legger du setet ditt tilbake eller ikke?',
    options: [
      { id: 'neiii', label: 'Neiiiiii' },
      { id: 'heele', label: 'Heeeeeeeele veien' },
      { id: 'aldri', label: 'Aldri!' },
    ],
  },
  {
    id: 'q9',
    text: 'Hva er det beste tidspunktet på døgnet for å bade?',
    options: [
      { id: 'kl0800', label: '08:00' },
      { id: 'kl1742', label: '17:42' },
      { id: 'skinny', label: 'Skinny dipping kl. 02:30' },
    ],
  },
  {
    id: 'q10',
    text: 'Det er den internasjonale kvinnedagen, hvordan sørger du for at den viktigste kvinnen i livet ditt føler seg satt pris på?',
    options: [
      { id: 'blomster', label: 'Blomster og hjemmelaget middag' },
      { id: 'tog', label: 'Gå i tog og behandle henne like godt som alle andre dager' },
      { id: 'kanelboller', label: 'Baker kanelboller til hun 😊' },
    ],
  },
]

export const BRAGER: BrageProfile[] = [
  {
    id: 'okland',
    name: 'Brage Økland',
    emoji: '🎣',
    img: 'case/brage/brage1.jpg',
    description:
      'Memes, fjellturer og salto på morgenbadet. Bader presis 17:42 og går i tog på kvinnedagen — men behandler henne like godt alle andre dager.',
    answers: {
      q1: 'fiskestang',
      q2: 'berlinmuren',
      q3: 'memes',
      q4: 'fjelltur',
      q5: 'adderal',
      q6: 'salto',
      q7: 'lowkey',
      q8: 'neiii',
      q9: 'kl1742',
      q10: 'tog',
    },
  },
  {
    id: 'johnsen',
    name: 'Brage Johnsen',
    emoji: '✈️',
    img: 'case/brage/brage2.jpg',
    description:
      'Flyr KLM (aldri forsinket), kjører i 140km/t og legger flysetet heeeeeeele veien tilbake. Baker kanelboller til sine spesielle',
    answers: {
      q1: 'kniv',
      q2: 'skole',
      q3: 'klm',
      q4: 'is',
      q5: 'hytta',
      q6: 'president',
      q7: 'tall',
      q8: 'heele',
      q9: 'kl0800',
      q10: 'kanelboller',
    },
  },
  {
    id: 'wikmark',
    name: 'Brage Wikmark',
    emoji: '🏃',
    img: 'case/brage/brage3.jpg',
    description:
      'Epok i leppa, løper til krampa tar ham og skinny dipper kl. 02:30. Tar av t-skjorta ved behov. Blir trigga av 6-7 hver eneste gang.',
    answers: {
      q1: 'snus',
      q2: 'harrypotter',
      q3: 'reels',
      q4: 'krampe',
      q5: 'pappaperm',
      q6: 'tskjorte',
      q7: 'trigga',
      q8: 'aldri',
      q9: 'skinny',
      q10: 'blomster',
    },
  },
]
