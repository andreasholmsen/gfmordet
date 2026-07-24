// ============================================================================
//  INNHOLD — dette er den ENESTE filen du trenger å redigere for å fylle saken.
//  Legg dokument- og bildefiler i /public/case/... og pek på dem her.
//  URL-er bygges automatisk med riktig base (se assetUrl under), så skriv dem
//  relativt fra /public, f.eks. 'case/dag1/vitne-kart.jpg'.
//
//  MERK: Utløsningsdatoer (når hver dag åpnes) ligger IKKE her — de settes i
//  Supabase-tabellen `case_config`, slik at tidslåsen ikke kan jukses fra
//  nettleseren. Se supabase/migrations/0001_init.sql og README.
// ============================================================================

export type DocKind = 'image' | 'pdf' | 'markdown' | 'html'

export interface CaseDoc {
  id: string
  title: string // vises på ikonet (norsk)
  kind: DocKind
  /** Sti til fil i /public, f.eks. 'case/dag1/obduksjon.pdf'. Påkrevd for image/pdf.
   *  Kan utelates for markdown/html hvis du bruker `inline` i stedet. */
  src?: string
  /** For 'markdown'/'html': skriv innholdet rett her i stedet for en fil. */
  inline?: string
  /** DAG 3-BEVIS-DELING (Romansaiansa): merk dokumentet 'A' eller 'B' for å dele
   *  det mellom matchede partnere. Umerkede dokumenter vises til begge. Solo-
   *  spillere (uparet/avlyst romanse) ser alt uansett. */
  group?: 'A' | 'B'
}

export interface InstagramPost {
  id: string
  img: string // 'case/instagram/p1.jpg'
  caption: string
  author: string
  likes?: number
  postedLabel?: string // 'for 2 timer siden'
}

export interface LinkedInPost {
  id: string
  author: string // 'Angela Berg'
  authorTitle: string // 'Markedssjef | Oslo' — undertittel-linjen
  text: string // selve innlegget (ren tekst)
  img?: string // 'case/linkedin/p1.jpg' (valgfritt)
  likes?: number
  comments?: number
  postedLabel?: string // '2 d'
  /** Hvis satt: posten vises først når denne dagen er åpen (ellers alltid synlig). */
  day?: number
  /** Ekstern URL — settes KUN på bunn-posten. Åpner i ny fane ved klikk. */
  link?: string
}

export interface SpotifyTrack {
  /** Sti til lydfil i /public, f.eks. 'case/spotify/sang1.mp3'. */
  src: string
  /** Vises i spilleren. Utledes fra filnavnet hvis utelatt. */
  title?: string
  artist?: string
}

export type Question =
  | {
      type: 'multiple_choice'
      prompt: string
      options: { id: string; label: string }[]
    }
  | {
      type: 'free_text'
      prompt: string
      placeholder?: string
    }
  | {
      type: 'mc_with_other'
      prompt: string
      options: { id: string; label: string }[]
      otherOptionId: string // hvilket alternativ som åpner fritekstfeltet
      otherPlaceholder?: string
    }
  | {
      // Som multiple_choice, men hvert alternativ kan ha et bilde (vises som
      // klikkbare bildekort). Lagres likt som flervalg (choice = option.id).
      type: 'image_choice'
      prompt: string
      options: { id: string; label: string; img?: string }[]
    }

/** En person i saken — vises på «Mistenkte»-tavla. */
export interface Suspect {
  id: string
  name: string
  role: string // 'Nabo', 'Eks-kjæreste', …
  img?: string // 'case/mistenkte/per.jpg' (valgfritt — initialer vises ellers)
  status?: 'mistenkt' | 'renvasket' | 'ukjent'
  /** Korte etterforskningsnotater (markdown). */
  notes?: string
}

export interface DayContent {
  day: 1 | 2 | 3 | 4
  title: string // 'Dag 1'
  /** Kort intro vist øverst i mappen (markdown støttes). */
  intro?: string
  docs: CaseDoc[]
  /** Dagens spørsmål i POLITI-appen. La stå udefinert for dag 4 (ingen stemming). */
  question?: Question
}

/** «Romansaiansa» (Tinder-modus). Valgfri — utelates for å skru av feature-en.
 *  Alternativene her fyller nedtrekk/valg i profil-oppsettet. `quiz` er rene
 *  flavor-spørsmål som vises på swipe-kortene. */
export interface RomanceConfig {
  /** Kjønnsalternativer man velger for seg selv (id lagres, label vises). */
  genders: { id: string; label: string }[]
  /** «Interessert i» — hvilke kjønn-id-er man kan krysse av for. */
  interestedIn: { id: string; label: string }[]
  /** Mini-quiz om romantiske preferanser (flavor). Vises på kortene. */
  quiz: { id: string; prompt: string; options: string[] }[]
}

export interface CaseManifest {
  title: string
  /** Kort velkomsttekst på skrivebordet / i POLITI-appen. */
  intro: string
  days: DayContent[]
  /** Romansaiansa-config (valgfritt). */
  romance?: RomanceConfig
  instagram: InstagramPost[]
  linkedin: LinkedInPost[]
  /** Personene i saken (valgfritt) — vises på «Mistenkte»-tavla. */
  suspects?: Suspect[]
  /** Angelas egne, personlige filer (valgfritt) — vises i en fargerik mappe.
   *  Bruker samme CaseDoc-type som dagene (bilde/pdf/markdown/html). */
  angelaFiles?: CaseDoc[]
  /** Sanger til Spotify-appen (valgfritt). Legg lydfiler i public/case/spotify/. */
  spotify?: SpotifyTrack[]
  /** Dag 4: fasit og konklusjon. */
  solution: {
    killerId: string // bør matche en option-id fra dag 3
    headline: string
    /** Markdown. Den store avsløringen. */
    body: string
    /** Liten leken sluttreplikk i avsløringen (valgfritt). */
    wink?: string
  }
}

// ----------------------------------------------------------------------------
//  EKSEMPELINNHOLD — bytt ut med din egen sak.
// ----------------------------------------------------------------------------
export const CASE: CaseManifest = {
  title: 'GF-mordet',
  intro:
    'SWQganVzdCBsaWtlIHRvIGludGVyamVjdCBmb3IgYSBtb21lbnQuIFdoYXQgeW91cmUgcmVmZXJpbmcgdG8gYXMgTGludXgsIGlzIGluIGZhY3QsIEdOVS9MaW51eCwgb3IgYXMgSXZlIHJlY2VudGx5IHRha2VuIHRvIGNhbGxpbmcgaXQsIEdOVSBwbHVzIExpbnV4LiBMaW51eCBpcyBub3QgYW4gb3BlcmF0aW5nIHN5c3RlbSB1bnRvIGl0c2VsZiwgYnV0IHJhdGhlciBhbm90aGVyIGZyZWUgY29tcG9uZW50IG9mIGEgZnVsbHkgZnVuY3Rpb25pbmcgR05VIHN5c3RlbSBtYWRlIHVzZWZ1bCBieSB0aGUgR05VIGNvcmVsaWJzLCBzaGVsbCB1dGlsaXRpZXMgYW5kIHZpdGFsIHN5c3RlbSBjb21wb25lbnRzIGNvbXByaXNpbmcgYSBmdWxsIE9TIGFzIGRlZmluZWQgYnkgUE9TSVgu',
  romance: {
    genders: [
      { id: 'mann', label: 'Mann' },
      { id: 'kvinne', label: 'Kvinne' },
      { id: 'annet', label: 'Annet' },
    ],
    interestedIn: [
      { id: 'mann', label: 'Menn' },
      { id: 'kvinne', label: 'Kvinner' },
      { id: 'annet', label: 'Andre' },
    ],
    quiz: [
      {
        id: 'date',
        prompt: 'Perfekt første date?',
        options: ['Krimkveld', 'Lang skogstur', 'Utepils', 'Netflix og avhør'],
      },
      {
        id: 'redflag',
        prompt: 'Ditt største red flag?',
        options: ['Sier «uansett» for mye', 'Alltid for sen', 'For glad i mord-mysterier', 'Ingen — jeg er perfekt'],
      },
      {
        id: 'weapon',
        prompt: 'Våpen i Cluedo?',
        options: ['Lysestaken', 'Tauet', 'Skiftenøkkelen', 'Giften'],
      },
    ],
  },
  days: [
    {
      day: 1,
      title: 'Dag 1',
      intro: 'De første dokumentene i saken. Les nøye — hvem av vitnene snakker egentlig sant?',
      docs: [
        {
          id: 'd1-rapport',
          title: 'Politirapport',
          kind: 'markdown',
          inline:
            '# Politirapport — sak 24-0617\n\n' +
            '**Avdøde:** Angela Liu (34)\n\n' +
            '**Funnsted:** Middagslokalet på GF etter bankettmiddag lørdag kveld\n\n' +
            'Avdøde ble funnet av naboen kl. 23:20. Ingen andre var til stede. ' +
            'Fire personer var i nærheten kvelden før. Alle har avgitt forklaring (se egne dokumenter).',
        },
        {
          id: 'd1-vitne-1',
          title: 'Vitneutsagn: Kari',
          kind: 'markdown',
          inline:
            '## Kari Lund (nabo)\n\n' +
            '«Jeg så lyset i kjøkkenet til Angela slukke rundt 23. ' +
            'Jeg hørte ingenting etterpå. Jeg la meg klokka halv tolv.»',
        },
        {
          id: 'd1-vitne-2',
          title: 'Vitneutsagn: Per',
          kind: 'markdown',
          inline:
            '## Per Haug (eks-kjæreste)\n\n' +
            '«Vi snakket på telefon rundt 22. Hun hørtes glad ut. ' +
            'Jeg var hjemme hele kvelden, det kan søsteren min bekrefte.»',
        },
        // Eksempel på bilde og PDF (legg filene i /public/case/dag1/):
        // { id: 'd1-kart', title: 'Åstedsskisse', kind: 'image', src: 'case/dag1/skisse.jpg' },
        // { id: 'd1-obd', title: 'Obduksjonsrapport', kind: 'pdf', src: 'case/dag1/obduksjon.pdf' },
      ],
      question: {
        type: 'multiple_choice',
        prompt: 'Hvem lyver i vitneutsagnet sitt?',
        options: [
          { id: 'kari', label: 'Kari Lund (nabo)' },
          { id: 'per', label: 'Per Haug (eks-kjæreste)' },
          { id: 'thomas', label: 'Thomas Berg (bror)' },
          { id: 'ingen', label: 'Ingen av dem lyver' },
        ],
      },
    },

    {
      day: 2,
      title: 'Dag 2',
      intro: 'Obduksjonen er klar, og bildet blir mer komplisert.',
      docs: [
        {
          id: 'd2-obd',
          title: 'Foreløpig obduksjon',
          kind: 'markdown',
          inline:
            '## Obduksjon (foreløpig)\n\n' +
            'Dødsårsak først antatt å være hjertestans. Nye prøver tyder på noe annet. ' +
            'Spor av et ukjent stoff i blodet. Ingen ytre skader.',
        },
      ],
      question: {
        type: 'free_text',
        prompt: 'Hvordan døde EGENTLIG offeret?',
        placeholder: 'Skriv din teori …',
      },
    },

    {
      day: 3,
      title: 'Dag 3',
      intro: 'Det siste beviset. Nå må du bestemme deg.',
      docs: [
        {
          id: 'd3-brev',
          title: 'Funnet brev',
          kind: 'markdown',
          inline: '## Brev funnet i en skuff\n\n«Jeg vet hva du gjorde. Møt meg i kveld, ellers …»',
        },
      ],
      question: {
        type: 'mc_with_other',
        prompt: 'Hvem drepte egentlig Angela?',
        options: [
          { id: 'kari', label: 'Kari Lund' },
          { id: 'per', label: 'Per Haug' },
          { id: 'thomas', label: 'Thomas Berg' },
          { id: 'annet', label: 'Annet (skriv selv)' },
        ],
        otherOptionId: 'annet',
        otherPlaceholder: 'Hvem tror du gjorde det – og hvorfor?',
      },
    },

    {
      day: 4,
      title: 'Dag 4',
      intro: 'Saken er løst. Les fasiten i POLITI-appen.',
      docs: [],
      // Ingen question på dag 4 — kun avsløring + statistikk.
    },
  ],

  instagram: [
    {
      id: 'ig1',
      img: 'case/instagram/jegvetikkehvadetteerengang.jpg',
      caption: 'Zwei kebab mit brot',
      author: 'hevind.sharo',
      likes: 404,
      postedLabel: 'for 34 uker siden',
    },
    {
      id: 'ig2',
      img: 'case/instagram/biljard.jpg',
      caption: 'Running and romping about',
      author: 'andreasholmsen',
      likes: 112,
      postedLabel: 'for 93 dager siden',
    },
    {
      id: 'ig2',
      img: 'case/instagram/jofridkontakt.png',
      author: 'studentprestjofrid',
      caption: '🌸Bli kjent med studentpresten Jofrid🌸\n\nJofrid er studentprest for Danmark, Tyskland, Nederland, Luxembourg, Østerrriket, Sverige, Sveits, Italia, Frankrike og Belgia🌎\n\nHun er her for studentene, enten du ønsker støtte eller en samtale om stort og smått i studenthverdagen🤩\n\nFølg henne gjerne på Instagram og ta kontakt dersom du trenger noen å prate med🥰',
      likes: 91725,
      postedLabel: 'for 42 dager siden',
    },
    {
    id: 'ig3',
    img: 'case/instagram/pyrra.jpg',
    caption: 'Pyrra was not ready for the Norwegian takeover⛷️',
    author: 'henriette.moe',
    likes: 80182,
    postedLabel: 'for 21 uker siden',
  },
    {
    id: 'ig5',
    img: 'case/instagram/ansamadrid.png',
    author: 'ansamadrid',
    caption: '💜Det nye styret er klart!💜\n\nBli kjent med den nye gjengen med å høre deres beste tips om favorittbyen, og ei litta fun fact🔥\n\nGled dere til året som kommer; Det blir bra!🤩',
    likes: 0,
    postedLabel: 'for 304 dager siden',
  },
  {
    id: 'ig4',
    img: 'case/instagram/oljebyen.jpg',
    caption: 'Tur til Oljebyen🚌🚌🚌🚌',
    author: 'oskarorvik',
    likes: 919,
    postedLabel: 'for 101 uker siden',
  },
  ],

  // LinkedIn-feed (falsk plattform). Bytt ut med ekte innhold; legg bilder i
  // public/case/linkedin/. Bunn-posten har `link` og åpner en ekte profil ved klikk.
  linkedin: [
    {
      id: 'li1',
      author: 'Angela Liu',
      authorTitle: 'Prosjektleder · ANSA',
      text: 'Stolt over å annonsere at vi lanserer et nytt prosjekt. Mer info kommer snart! 🚀 #nyestart #karriere #stolt',
      img: 'case/linkedin/engineers.jpg',
      likes: 214,
      comments: 31,
      postedLabel: '1 d',
    },
    {
      id: 'li2',
      author: 'Brage Flønæs Johnsen',
      authorTitle: '4th year master student at INSA Toulouse',
      text: 'Jeg vil gjerne meddele at jeg har startet i sommerjobb hos Anko AS i Sandnes! #PMS',
      likes: 24,
      comments: 9,
      postedLabel: '3 d',
    },
    {
      id: 'li3',
      author: 'Studentprest Sverre',
      authorTitle: 'Studentprest · Vinylvrenger',
      text: 'Sa noen enda en Pubquiz?? 🤷',
      img: 'case/linkedin/studentprest.jpg',
      likes: 87623,
      comments: 1192,
      postedLabel: '12 d',
    },
    {
      id: 'li4',
      author: 'Maud Alfstad Bjørum',
      authorTitle: 'President at ANSA',
      text: 'Økt studentmobilitet er en viktig del av et tettere samarbeid med de nordiske landene! Heldigvis er vi ikke alene om å mene det💫 \n \nFlott kveld hos Foreningen Norden_Norge🌻 Tusen takk for invitasjonen!',
      likes: 33,
      comments: 5,
      postedLabel: '1 mo',
    },
    {
      // Vises FØRST når dag 3 er åpen (day: 3). Bytt ut med ekte dag 3-hint.
      id: 'li-d3',
      author: '(navn)',
      authorTitle: '(tittel)',
      text: 'PLACEHOLDER — dag 3-innlegg. Skriv det ekte hintet her.',
      likes: 0,
      comments: 0,
      postedLabel: '1 d',
      day: 3,
    },
    {
      // Bunn-posten: ser ut som en vanlig post, men klikk åpner ekte LinkedIn-profil.
      id: 'li5',
      author: 'Andreas Holmsen',
      authorTitle: 'Vorsorganisator · Claudekriger',
      text: 'Følg med videre for flere inshallah commits. 👀',
      img: 'case/linkedin/villdj.jpg',
      likes: 128,
      comments: 17,
      postedLabel: '1 t',
      link: 'https://www.linkedin.com/in/andreasnholmsen/',
    },
  ],

  // MERK: `id` her må matche dag 3-alternativene og `solution.killerId` for at
  // dag 4-avsløringen (line-up + SKYLDIG-stempel) skal fungere.
  suspects: [
    {
      id: 'kari',
      name: 'Kari Lund',
      role: 'Nabo',
      status: 'mistenkt',
      notes:
        'Hevder hun la seg kl. 23.30 og ikke hørte noe. Bor vegg-i-vegg — burde ha hørt mer. ' +
        'Hadde en uoppgjort konflikt med Angela om et felles gjerde.',
    },
    {
      id: 'per',
      name: 'Per Haug',
      role: 'Eks-kjæreste',
      status: 'mistenkt',
      notes:
        'Sier han snakket med Angela på telefon kl. 22. Telefonloggen er ikke sjekket ennå. ' +
        'Arbeider i helsevesenet — tilgang til legemidler.',
    },
    {
      id: 'thomas',
      name: 'Thomas Berg',
      role: 'Bror',
      status: 'ukjent',
      notes: 'Skal ha vært på hytta, men ingen kan bekrefte det. Arvet huset etter Angela.',
    },
  ],

  // Angelas egne filer (fargerik mappe). Ren eksempeldata — bytt ut med ekte
  // innhold. Tekst kan skrives inline; bilder legges i public/case/angela/.
  angelaFiles: [
    {
      id: 'a-dagbok',
      title: 'Dagbok',
      kind: 'markdown',
      inline:
        '# Kjære dagbok 🌸\n\n' +
        '**Onsdag.** I dag var en av de rare dagene. Per ringte igjen — jeg orker nesten ikke ' +
        'svare lenger. Han sier han bare vil «snakke», men jeg vet ikke om jeg tror på det.\n\n' +
        'Kari kom bortom med en kake. Snilt av henne, men jeg merker at det fortsatt er litt ' +
        'stivt mellom oss etter hele gjerde-saken. 🙄\n\n' +
        'Thomas har ikke ringt på flere uker. Håper alt er bra med ham på hytta.\n\n' +
        '_Gleder meg til helgen med jentene._ 🍷',
    },
    {
      id: 'a-brev',
      title: 'Ulest brev',
      kind: 'markdown',
      inline:
        '## Til Angela\n\n' +
        'Du kan ikke bare late som ingenting har skjedd. Vi må snakke sammen — før det er for ' +
        'sent. Du vet hva dette handler om.\n\n' +
        'Ikke fortell det til noen.\n\n' +
        '— *(ingen avsender)*',
    },
    {
      id: 'a-handleliste',
      title: 'Handleliste',
      kind: 'markdown',
      inline:
        '### Huskeliste 📝\n\n' +
        '- [ ] Rødvin (til fredag)\n' +
        '- [ ] Blomster til stua\n' +
        '- [x] Ringe banken\n' +
        '- [ ] Bytte lås?? 🔐\n' +
        '- [ ] Snakke med Kari om gjerdet\n',
    },
    {
      id: 'a-foto',
      title: 'Feriebilde',
      kind: 'image',
      src: 'case/angela/foto1.jpg',
    },
  ],

  // Sanger til Spotify-appen. Legg .mp3-filene i public/case/spotify/ og pek på
  // dem her. `title`/`artist` er valgfritt (utledes ellers fra filnavnet).
  spotify: [
    { src: 'case/spotify/sang1.mp3', title: 'Spor 1', artist: 'Ukjent artist' },
    { src: 'case/spotify/sang2.mp3', title: 'Spor 2', artist: 'Ukjent artist' },
    { src: 'case/spotify/sang3.mp3', title: 'Spor 3', artist: 'Ukjent artist' },
  ],

  solution: {
    killerId: 'per',
    headline: 'Morderen var Per Haug',
    body:
      '## Løsningen\n\n' +
      'Per Haug løy om telefonsamtalen. Den fant aldri sted — telefonloggen viser ingenting kl. 22. ' +
      'Det ukjente stoffet i blodet stammet fra et legemiddel kun Per hadde tilgang til.\n\n' +
      'Angela ble forgiftet, ikke et naturlig dødsfall. Brevet var Pers forsøk på å skremme henne til taushet.\n\n' +
      '**Takk for at du etterforsket med oss!** Se hvordan gjetningene fordelte seg nedenfor.',
    wink: 'P.S. Andreas visste svaret hele tiden. Han sier alltid «ja». 😉',
  },
}
