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
}

export interface InstagramPost {
  id: string
  img: string // 'case/instagram/p1.jpg'
  caption: string
  author: string
  likes?: number
  postedLabel?: string // 'for 2 timer siden'
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

export interface CaseManifest {
  title: string
  /** Kort velkomsttekst på skrivebordet / i POLITI-appen. */
  intro: string
  days: DayContent[]
  instagram: InstagramPost[]
  /** Personene i saken (valgfritt) — vises på «Mistenkte»-tavla. */
  suspects?: Suspect[]
  /** Dag 4: fasit og konklusjon. */
  solution: {
    killerId: string // bør matche en option-id fra dag 3
    headline: string
    /** Markdown. Den store avsløringen. */
    body: string
  }
}

// ----------------------------------------------------------------------------
//  EKSEMPELINNHOLD — bytt ut med din egen sak.
// ----------------------------------------------------------------------------
export const CASE: CaseManifest = {
  title: 'Mordet på Angela',
  intro:
    'Angela Berg ble funnet død i sitt eget hjem. Politiet trenger din hjelp. ' +
    'Nye bevis slippes hver dag — studer mappene, følg sporene, og svar på dagens spørsmål i POLITI-appen.',

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
            '**Avdøde:** Angela Berg (34)\n\n' +
            '**Funnsted:** Hjemmet i Storgata 14, kjøkkenet.\n\n' +
            'Avdøde ble funnet av naboen kl. 08:20. Ingen tegn til innbrudd. ' +
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
      img: 'case/instagram/p1.jpg',
      caption: 'Siste kveld med jentene 🍷 #fredag',
      author: 'angela.berg',
      likes: 87,
      postedLabel: 'for 1 dag siden',
    },
    {
      id: 'ig2',
      img: 'case/instagram/p2.jpg',
      caption: 'Noen som vet hvem dette er? 👀',
      author: 'kari.lund',
      likes: 12,
      postedLabel: 'for 3 timer siden',
    },
  ],

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

  solution: {
    killerId: 'per',
    headline: 'Morderen var Per Haug',
    body:
      '## Løsningen\n\n' +
      'Per Haug løy om telefonsamtalen. Den fant aldri sted — telefonloggen viser ingenting kl. 22. ' +
      'Det ukjente stoffet i blodet stammet fra et legemiddel kun Per hadde tilgang til.\n\n' +
      'Angela ble forgiftet, ikke et naturlig dødsfall. Brevet var Pers forsøk på å skremme henne til taushet.\n\n' +
      '**Takk for at du etterforsket med oss!** Se hvordan gjetningene fordelte seg nedenfor.',
  },
}
