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
  /** Legger dokumentet i en undermappe i dag-mappen. Verdien er `id`-en til en
   *  mappe i dagens `folders`-liste. Utelates ⇒ dokumentet ligger løst i dagen. */
  folder?: string
  /** Egen pastellfarge for KUN dette dokumentet — farger flisa og «papiret» når
   *  det åpnes, på samme måte som `tint` på en undermappe. Vinner over mappens
   *  tint. Brukes til å skille ut ett enkelt dokument (eks: Runills notater). */
  tint?: string
}

/** Undermappe i en dag-mappe — grupperer dokumenter og gir dem et felles utseende. */
export interface SubfolderDef {
  id: string
  title: string // 'Vitneutsagn'
  /** `id`-en til en annen mappe i samme dag ⇒ denne blir en UNDER-undermappe som
   *  vises inne i foreldremappen. Kun ÉN nivå nesting (mappe → mappe → dokument);
   *  utelates ⇒ mappen ligger på dagens rot-nivå som før. */
  parent?: string
  /** Emoji på mappe-flisen (standard 📁). */
  icon?: string
  /** Pastellfarge (CSS-farge) som tinter mappe-flisen, dokument-flisene inni og
   *  «papiret» når et dokument åpnes — f.eks. '#d7e9fb' for lyseblå vitneutsagn.
   *  Bruk lyse farger; teksten er alltid mørk. */
  tint?: string
  /** Kort intro øverst i undermappen (markdown støttes). */
  intro?: string
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
/** 8-bit-portrett tegnet som piksel-grid (samme stil som intro-cinematicen).
 *  `palette` mapper tegn → farge; tegn uten farge (f.eks. '.') er bakgrunn.
 *  `rows` er like lange rader med tegn fra paletten. */
export interface PixelPortraitData {
  palette: Record<string, string>
  rows: string[]
}

export interface Suspect {
  id: string
  name: string
  role: string // 'Nabo', 'Eks-kjæreste', …
  img?: string // 'case/mistenkte/per.jpg' (valgfritt — initialer vises ellers)
  /** 8-bit-portrett (valgfritt) — vinner over `img` hvis begge er satt. */
  pixel?: PixelPortraitData
  status?: 'mistenkt' | 'renvasket' | 'ukjent'
}

export interface DayContent {
  day: 1 | 2 | 3 | 4
  title: string // 'Dag 1'
  /** Kort intro vist øverst i mappen (markdown støttes). */
  intro?: string
  /** Undermapper (valgfritt). Dokumenter havner i en mappe via `doc.folder`. */
  folders?: SubfolderDef[]
  docs: CaseDoc[]
  /** Dagens spørsmål i POLITI-appen. La stå udefinert for dag 4 (ingen stemming). */
  question?: Question
  /** Dagens fasit (markdown). Vises i POLITI-appen når dagen er STENGT (neste
   *  dag har åpnet) — samtidig som stemmetallene frigis i Excel. */
  reveal?: string
  /** Dokument som ligger INNE I POLITI-appen (ikke i dag-mappen), og som MÅ
   *  åpnes før dagens spørsmål vises. Brukes til nye avhør politiet «henter
   *  inn» før man kan svare. Huskes per enhet (localStorage). */
  briefing?: {
    /** Etikett på knappen, f.eks. 'Nytt vitneavhør: Hedvig'. */
    title: string
    /** Markdown — selve avhøret. */
    body: string
    /** Kort tekst over knappen (markdown), valgfri. */
    intro?: string
  }
}

// ---------------------------------------------------------------------------
//  Offerets mobil — apper (WhatsApp / e-post / Slack). Alt er valgfritt; en app
//  vises kun når den har innhold. `day` på samtaler/meldinger/e-poster betyr
//  «vises først når dag N er åpen» (samme tidslås som dag-mappene) — slik kan
//  telefonen avsløre nytt innhold utover i spillet. Uten `day` vises alt straks.
// ---------------------------------------------------------------------------

export interface ChatMessage {
  /** 'me' = Angela (høyre, grønn boble) · 'them' = motparten (venstre, hvit). */
  from: 'me' | 'them'
  /** GRUPPECHAT: avsendernavn vist over boblen (farge utledes av navnet). */
  author?: string
  text?: string
  /** Bilde-boble: sti i /public, f.eks. 'case/angela/bilde.jpg'. */
  img?: string
  /** Vises i boblen, f.eks. '21:47' eller 'i går 21:47'. */
  time?: string
  /** «🚫 Denne meldingen ble slettet» — teksten/bildet vises IKKE. */
  deleted?: boolean
  /** Skjult påskeegg: vises som tooltip når man holder musa over boblen (PC).
   *  Mobil har ikke hover — bruk det til bonus-fluff, aldri nødvendige spor. */
  hover?: string
  /** Uleste innkommende meldinger telles opp i badge på samtalelisten. */
  unread?: boolean
  /** Vises først når dag N er åpen. */
  day?: number
}

export interface WhatsAppChat {
  id: string
  name: string // kontaktnavn
  /** Emoji-avatar i samtalelisten (standard 👤). */
  avatar?: string
  /** Bruk en mistenkt sitt portrett (pixel/img fra `suspects`) som avatar —
   *  sett til suspect-id, f.eks. 'erik'. Vinner over `avatar`. */
  suspectId?: string
  /** Undertittel i samtale-headeren, f.eks. 'sist sett i går 22:14'. */
  subtitle?: string
  messages: ChatMessage[]
  /** Hele samtalen vises først når dag N er åpen. */
  day?: number
}

export interface EmailMessage {
  id: string
  folder?: 'innboks' | 'sendt' | 'utkast' | 'spam'
  from: string // 'Marte Wik <marte@firma.no>'
  to?: string
  subject: string
  date?: string // 'ons. 17. juni, 14:02'
  /** Markdown. */
  body: string
  /** Vedlegg — åpnes med vanlig dokumentviser (bilde/pdf/markdown). */
  attachments?: CaseDoc[]
  /** Uleste vises i fet skrift + telles i badge. */
  unread?: boolean
  /** Vises først når dag N er åpen. */
  day?: number
}

export interface SlackMessage {
  author: string
  /** Emoji-avatar (overstyrer forbokstav-firkanten), f.eks. '🌸'. */
  avatar?: string
  /** Bruk en mistenkt sitt portrett (pixel/img fra `suspects`) som avatar —
   *  sett til suspect-id, f.eks. 'erik'. Vinner over `avatar`. */
  suspectId?: string
  text: string
  /** Bilde/gif i meldingen: sti i /public ('case/memes/party.gif') ELLER full
   *  URL ('https://…'). Lokal fil anbefales — virker uten nett-avhengigheter. */
  img?: string
  time?: string // 'i går 15:12'
  edited?: boolean // viser «(redigert)»
  /** Viser «👀 Sett av X» under meldingen — for ubesvarte meldinger som spor. */
  seenBy?: string
  day?: number
}

export interface SlackChannel {
  id: string
  name: string // 'festkomiteen' (uten #) eller personnavn for DM
  /** true ⇒ vises som direktemelding (👤) i stedet for #kanal. */
  dm?: boolean
  topic?: string
  messages: SlackMessage[]
  day?: number
}

export interface AngelaPhoneConfig {
  /** App-nivå tidslås: appen vises på hjemskjermen, men er låst (🔒) til dag N
   *  er åpen. Planen er at hver app får sitt eget «hack»-minigame for å komme
   *  inn — inntil de er laget åpnes appen automatisk når dagen nås. Utelatt
   *  app ⇒ åpen fra start. (Kommer i tillegg til `day` på enkeltinnhold.) */
  appDays?: { whatsapp?: number; email?: number; slack?: number }
  /** Ordet som knekkes i WhatsApp-hacket (BruteForce). Standard: 'GIGACHAD'. */
  whatsappHackWord?: string
  whatsapp?: WhatsAppChat[]
  email?: EmailMessage[]
  slack?: {
    workspace?: string // 'Firmaet AS'
    channels: SlackChannel[]
  }
}

export interface CaseManifest {
  title: string
  /** Kort velkomsttekst på skrivebordet / i POLITI-appen. */
  intro: string
  days: DayContent[]
  instagram: InstagramPost[]
  linkedin: LinkedInPost[]
  /** Personene i saken (valgfritt) — vises på «Mistenkte»-tavla. */
  suspects?: Suspect[]
  /** Angelas egne, personlige filer (valgfritt) — vises som en låst mobil.
   *  Bruker samme CaseDoc-type som dagene (bilde/pdf/markdown/html). */
  angelaFiles?: CaseDoc[]
  /** Apper på Angelas mobil (WhatsApp/e-post/Slack). Valgfritt — apper uten
   *  innhold vises ikke. Se typene over for dag-gating av meldinger. */
  angelaPhone?: AngelaPhoneConfig
  /** 4-sifret kode til Angelas mobil. Plant koden som et spor i dokumentene
   *  (f.eks. en bursdag). Utelates ⇒ ingen lås (filene åpnes direkte).
   *  Spillere kan også komme forbi via «POLITI-HACK»-minispillet. */
  phonePin?: string
  /** Sendeplan til «Radio France»-appen (valgfritt). Legg lydfiler i
   *  public/case/spotify/. Appen starter på tilfeldig sang ved åpning og
   *  looper lista — kun pause, ingen hopping (det er radio). */
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

// De 10 karakterene som har vitneutsagn — ENESTE kilde for stemmealternativene
// på både dag 1 og dag 3, så listene ikke kan komme i utakt. Rekkefølgen følger
// vitneutsagnene i dag 1. Legger du til en karakter: legg den til her.
const SUSPECT_OPTIONS: { id: string; label: string }[] = [
  { id: 'sverre', label: 'Sverre' },
  { id: 'hedvig', label: 'Hedvig' },
  { id: 'ane', label: 'Ane' },
  { id: 'runill', label: 'Runill' },
  { id: 'maud', label: 'Maud' },
  { id: 'erik', label: 'Erik' },
  { id: 'oskar', label: 'Oskar' },
  { id: 'anna', label: 'Anna' },
  { id: 'pia', label: 'Pia' },
  { id: 'andreas', label: 'Andreas' },
]

// ----------------------------------------------------------------------------
//  EKSEMPELINNHOLD — bytt ut med din egen sak.
// ----------------------------------------------------------------------------
export const CASE: CaseManifest = {
  title: 'GF-mordet',
  intro:
    'SWQganVzdCBsaWtlIHRvIGludGVyamVjdCBmb3IgYSBtb21lbnQuIFdoYXQgeW91cmUgcmVmZXJpbmcgdG8gYXMgTGludXgsIGlzIGluIGZhY3QsIEdOVS9MaW51eCwgb3IgYXMgSXZlIHJlY2VudGx5IHRha2VuIHRvIGNhbGxpbmcgaXQsIEdOVSBwbHVzIExpbnV4LiBMaW51eCBpcyBub3QgYW4gb3BlcmF0aW5nIHN5c3RlbSB1bnRvIGl0c2VsZiwgYnV0IHJhdGhlciBhbm90aGVyIGZyZWUgY29tcG9uZW50IG9mIGEgZnVsbHkgZnVuY3Rpb25pbmcgR05VIHN5c3RlbSBtYWRlIHVzZWZ1bCBieSB0aGUgR05VIGNvcmVsaWJzLCBzaGVsbCB1dGlsaXRpZXMgYW5kIHZpdGFsIHN5c3RlbSBjb21wb25lbnRzIGNvbXByaXNpbmcgYSBmdWxsIE9TIGFzIGRlZmluZWQgYnkgUE9TSVgu',
  days: [
    {
      day: 1,
      title: 'Dag 1',
      intro: 'De første dokumentene i saken. Les nøye — hvem av vitnene snakker egentlig sant?',
      // Undermapper: dokumenter med `folder: '<id>'` havner i mappen, og
      // `tint` farger både flisene og «papiret» (lyseblå vitneutsagn ↓).
      folders: [
        {
          id: 'vitner',
          title: 'Vitneutsagn',
          icon: '🗣️',
          tint: '#d7e9fb',
        },
      ],
      docs: [
        {
          id: 'd1-vitne-sverre',
          title: 'Vitneutsagn: Sverre',
          kind: 'markdown',
          folder: 'vitner',
          inline:
            '## Vitneutsagn — Sverre\n\n' +
            '**Kan du beskrive denne dagen?**\n\n' +
            '«Ja vi hadde en temmelig lang dag. Mye møter, foredrag og debatter. Det er alltid ' +
            'spennende å følge med, men ble nokså slitsomt. Vi hadde også et ekstra møte blant ' +
            'ansatte og hovedstyret. Det ble veldig slitsomt, så jeg la meg ikke så sent etter ' +
            'banketten. Jeg var også litt med den ene guttegjengen fra Frankrike på deres ' +
            'sosiale opplegg. Var morsomt, men ble litt for teknisk for meg.»\n\n' +
            '**Hvor var du rundt kl. 23 denne kvelden?**\n\n' +
            '«Hmmm jeg fulgte ikke så mye med på tiden, men jeg stod nok ute med de andre. ' +
            'Jeg snakket med Maud, Runill og et par andre. Litt tilfeldige samtaleemner — men ' +
            'blant annet om vi burde forby nattbading eller ikke. Vi har fått klager fra folk ' +
            'som Brage Johnsen om at det kan være farlig. Ane kom også etterhvert for å snakke ' +
            'med Runill, og etter at de dro så dro jeg også bare hjem for å sove. På veien hjem ' +
            'så møtte jeg bare på Erik i den ene gangen egentlig.»\n\n' +
            '**Vet du om noen som ville ønsket Angela død?**\n\n' +
            '«Nei Angela er jo helt fantastisk. Vi snakket sammen tidligere den dagen på møtet ' +
            'vårt, og da virket hun litt irritert på Andreas blant annet. Var visst noe om ' +
            'vedtekter og at han var forsinket — men det er vel nokså standard.»\n\n' +
            '**Har du andre kommentarer eller ting vi burde vite?**\n\n' +
            '«Det er ikke godt å si. Jeg trodde kanskje Ane nevnte Angela i samtalen hennes med ' +
            'Runill den kvelden, men kan ikke være sikker. De virket hemmelighetsfulle. Runill ' +
            'og Angela snakket også en del tidligere den dagen på møtet. Angela svarte også på ' +
            'noen meldinger som var litt «ork».»',
        },
        {
          id: 'd1-vitne-hedvig',
          title: 'Vitneutsagn: Hedvig',
          kind: 'markdown',
          folder: 'vitner',
          inline:
            '## Vitneutsagn — Hedvig\n\n' +
            '**Hva gjorde du i løpet av banketten?**\n\n' +
            '«Jeg var såklart med mine ANSA Madrid-venner. Stemningen var ikke sånn supergod ' +
            'etter alle prisene ble annonsert, men det er vel livet det... Jeg endte opp med å ' +
            'gå rundt mye av kvelden, gå litt ute og være ved baren. Når jeg gikk til baren ' +
            'rundt 22:30-tiden så stod noen av Frankrikegutta der. Oskar og Brage var veldig ' +
            'pratsomme, men Andreas virket litt mer stille. Nerver kanskje? Brage hjalp meg ' +
            'hvertfall velge ut en passende drikke, og jeg gikk gjennom salen hvor Angela satt. ' +
            'Vi snakket litt sammen også gikk jeg videre for å se hvor vennene mine var. En god ' +
            'stund senere gikk jeg tilbake i salen og der fant jeg Angela på bakken. Når jeg så ' +
            'henne trodde jeg hun hadde besvimt.»\n\n' +
            '**Hva gjorde du så?**\n\n' +
            '«Nei mitt første instinkt var naturligvis å løpe til resepsjonen for å spørre om ' +
            'hjelp og ringe ambulanse. På veien dultet jeg borti Anna. Etter resepsjonen ' +
            'ringte så løp jeg tilbake. De forstod ikke situasjonen med en gang så det tok ' +
            'lenger tid enn ønskelig. På veien tilbake klarte jeg å snuble, men innen jeg var ' +
            'tilbake så hadde andre folk oppdaget henne — og jeg ble bedt om å holde meg unna ' +
            'åstedet. Jeg husker ikke så mye av kvelden, alt gikk i ett. Det sykeste er hvor ' +
            'mange som ikke fikk med seg situasjonen før sent om natten. De som nattbadet var ' +
            'helt fjerne.»\n\n' +
            '**Du sier du snakket med Angela, hva snakket du med henne om?**\n\n' +
            '«Mest hva jeg burde forvente av morgendagen. Jeg søker jo inn på hovedstyret, og ' +
            'ville maksimere sjansene for å holde en relevant og god tale. Det var betryggende ' +
            'å snakke med Angela, siden hun er prosjektleder for GF. Hun virket litt småsyk, så ' +
            'jeg lot henne være litt alene. Ville ikke bli forkjølet rett før talen min!»\n\n' +
            '**Kjenner du noen som ville ønsket Angela vondt?**\n\n' +
            '«Nei egentlig ikke, dessverre.»',
        },
        {
          id: 'd1-vitne-ane',
          title: 'Vitneutsagn: Ane',
          kind: 'markdown',
          folder: 'vitner',
          inline:
            '## Vitneutsagn — Ane\n\n' +
            '**Hva kan du fortelle oss om kvelden?**\n\n' +
            '«Nei hele kvelden virket egentlig litt rar. Selv fra møtet mellom oss i TRIA, ' +
            'Hovedstyret, de ansatte og studentprestene virket Angela litt annerledes mot ' +
            'slutten der. Hun snakket mye med Runill men jeg skjønte ikke om hva. Tror Runill ' +
            'ga henne noen piller etter møtet, det så ut som ibux. Jeg også hadde trengt det om ' +
            'jeg skulle organisert hele GF.»\n\n' +
            '**Senere på kvelden da, hva skjedde?**\n\n' +
            '«Nei jeg var edruvakt så jeg gikk rundt. På et tidspunkt tok jeg meg en runde også ' +
            'så jeg Angela sittende alene med en Blue Lagoon-cocktail. Hun så kjempesliten ut, ' +
            'så jeg fratok henne drinken og gikk ut til Runill for å se. Runill sa hun burde ' +
            'bli med, så vi gikk sammen først til baren for å legge fra oss drikken og finne ut ' +
            'av hvordan i alle dager hun fikk tilgang til mer drikke. Køen i baren var noe helt ' +
            'utrolig lang — spesielt fra ANSA Benelux. Jeg satte drinken i ene vinduskarmen og ' +
            'måtte løse konflikter der, mens Runill gikk til Angela for å passe på at hun hadde ' +
            'det bra. Barkøen var vel rundt 23:30? Etter en ti minutter gikk jeg til salen hvor ' +
            'Angela var, men denne gangen var hun på bakken. Jeg fikk ikke sett ordentlig før ' +
            'Runill ba meg gå ut av rommet og passe på at ingen andre kunne komme inn. Så kom ' +
            'endelig dere — sikkert fra telefonsamtalen deres?»\n\n' +
            '**Hvorfor gikk du og Runill sammen til baren? Ville det ikke vært naturlig å ' +
            'splitte opp?**\n\n' +
            '«Jo, kanskje egentlig. Men dette er jo ikke første gangen at en ANSA-student er ' +
            'sliten. En vanlig dag på jobb da kan man si. Kanskje en dum vurdering av oss, men ' +
            'det er ikke så altfor ofte jeg får ha koselige samtaler med Runill heller. Det er ' +
            'litt som de fire gratis psykologtimene man kan få ved å være ANSA-medlem! Man ' +
            'trenger ikke spesifisere årsaken når man sender mail til sosialveileder@ansa.no, ' +
            'og psykologtimene er på nett med kort ventetid både i helgen og på kveldstid! ' +
            'Dessuten er Runill verdens koseligste menneske.»\n\n' +
            '**Jeg vet ikke hva Runill fortalte deg, men det ser ut som at hun ble slått av et ' +
            'tungt blunt objekt. Dessverre har vi ikke funnet objektet ennå. Har du forslag?**\n\n' +
            '«Nei ble hun det?? Det visste jeg ikke. Som sagt vi har ikke rukket å bli så godt ' +
            'informert om hva som hadde skjedd. Jeg kunne ikke se noe blundt objekt når Runill ' +
            'var der hvertfall — fra de to sekundene jeg så inn i rommet.»',
        },
        {
          id: 'd1-vitne-runill',
          title: 'Vitneutsagn: Runill',
          kind: 'markdown',
          folder: 'vitner',
          inline:
            '## Vitneutsagn — Runill\n\n' +
            '**Du var en av de som ringte oss. Hva kan du fortelle om åstedet?**\n\n' +
            '«Nei jeg hadde hørt fra Ane at Angela virket sliten og var inne på salen, så jeg ' +
            'tenkte meg bort bare for å sjekke at det gikk bra med henne. Jeg hadde snakket en ' +
            'del med Angela tidligere den dagen så jeg visste at hun begynte å bli sliten. Hun ' +
            'har jobbet på ekstremt hardt hele tiden, hun er kjempedyktig — akkurat som alle ' +
            'ANSA-ansatte og tillitsvalgte <3. På slutten av møtet så ga jeg Angela en pille ' +
            'mot noen milde smerter. Hun nevnte ikke så mye senere den dagen, men tydeligvis ' +
            'var hun jo mer sliten enn jeg trodde. Jeg fant Angela kl. 23:38. Jeg husker at jeg ' +
            'sjekket klokken. Etter det gikk jeg litt i sjokk (som er naturlig) og begynte å ' +
            'ringe og fikse situasjonen.»\n\n' +
            '**Det står i loggen vår at du ikke ringte før kl. 23:45? Hvorfor tok det så lang ' +
            'tid?**\n\n' +
            '«Såklart ville jeg jo hjelpe Angela, men jeg var redd for kaoset som ville blitt ' +
            'skapt hvis noen andre så henne og alt blodet. Min første tanke var å ikke stresse ' +
            'alle andre, så jeg passet på å lukke dører og jage vekk folk. Rett utenfor rommet ' +
            'var Maud og Erik som stod og diskuterte. De skrek litt mot hverandre så jeg ba dem ' +
            'ta saken et annet sted. Innen folk var borte og rommet sikret så ringte jeg. Den ' +
            'neste personen som kom var Ane, men jeg prøvde å holde henne unna området også. Et ' +
            'par minutter kom jo dere — dere kom helt sykt fort, innen et par minutter.»\n\n' +
            '**Resepsjonen ringte oss også, litt før deg. Det er den samtalen vi reagerte på ' +
            'først. Så du ikke Hedvig komme tilbake til offeret?**\n\n' +
            '«Joda det gjorde jeg. Hun hadde et sår på kneet — hun sa hun snublet når hun løp. ' +
            'Visstnok var det en eller annen idiot som hadde sølt øl på gulvet. Jeg lot ikke ' +
            'Hedvig gå inn i rommet da, jeg ville holde åstedet intakt.»\n\n' +
            '**Objektet som ble brukt da, så du det?**\n\n' +
            '«Nei jeg så ikke noe objekt. Ikke noe som lå igjen på åstedet hvertfall. Dessverre...»',
        },
        {
          id: 'd1-vitne-maud',
          title: 'Vitneutsagn: Maud',
          kind: 'markdown',
          folder: 'vitner',
          inline:
            '## Vitneutsagn — Maud\n\n' +
            '**Hva gjorde du i går?**\n\n' +
            '«Nei som president og presidentkandidat er det alltid mye å gjøre. Travelt hele ' +
            'dagen på generalforsamlingen, også hjalp det ikke at vi hadde ekstra møte på ' +
            'kvelden blant oss ansatte. Heldigvis var folk i godt humør. Spesielt Sverre ' +
            'faktisk! Han snakket masse om pub quiz, så mye at Angela ble synlig irritert. ' +
            'Etter det var det bankett, og en del samtaler senere i løpet av kvelden med folk. ' +
            'Jeg fulgte med på de som nattbadet en god del av kvelden. Jeg snakket med Runill ' +
            'og Sverre, også kom plutselig Ane. Virket som at de som badet klarte seg, så vi ' +
            'bare dro. På veien tilbake til baren så møtte jeg på Erik i en korridor. Vi ' +
            'snakket en del om vedtekter, nynorsk og litt slikt. Jeg ville ta opp litt ting som ' +
            'Angela hadde fortalt meg tidligere, rundt dette med nynorsk i vedtektene. Det ble ' +
            'litt debatt, så mye at Runill kom ut og ba oss dra et annet sted. Vi gjorde det, ' +
            'men ikke visste vi at det var på grunn av et mord!»\n\n' +
            '**Så du noe mistenkelig, siden du var i nærheten?**\n\n' +
            '«Nei egentlig ikke. Jeg vet at senere den kvelden så løp Andreas temmelig raskt ' +
            'med en stor rød flekk på skjorta si. Han ropte «jeg søølte viiiin!» men jeg kan ' +
            'ikke bekrefte noe. Senere den kvelden fortalte han om at han var sur på Oskar, ' +
            'men han turte ikke si hvorfor?»\n\n' +
            '**Virket det seriøst mellom Oskar og Andreas?**\n\n' +
            '«Nei det virket nokså vanlig. De har bodd sammen og studert sammen lenge, og jeg ' +
            'er sikker på at Andreas egentlig er veldig glad i Oskar (<3).»\n\n' +
            '**Andre ting vi burde vite?**\n\n' +
            '«Jeg så jo en del på folk gå rundt, og Anna ble sett av flere: hun lette etter ' +
            'Angela hele kvelden. Hun gikk rundt med ANSA-Paris lokallagstrofeet sitt fra 2024. ' +
            'Hun ville vise det frem til folk — så mye at hun badet med trofeet ved 00:30-tiden. ' +
            'Tror det var for å fremheve at ANSA Paris var bedre enn ANSA Toulouse — de vant ' +
            'nemlig årets pris.»',
        },
        {
          id: 'd1-vitne-erik',
          title: 'Vitneutsagn: Erik',
          kind: 'markdown',
          folder: 'vitner',
          inline:
            '## Vitneutsagn — Erik\n\n' +
            '**Du var en av de som var sett utenfor lokalet rundt dødstidspunktet, hvorfor ' +
            'det?**\n\n' +
            '«Nei, det var litt tilfeldig. Det vart litt slitsamt med alle desse fulle ANSA ' +
            'Benelux-folka. Så eg tok meg litt frisk luft og var litt aleine. Passa på at eg ' +
            'var klar for talen min i dag.»\n\n' +
            '**Møtte du på noen underveis? Noen som kan bekrefte hvor du var?**\n\n' +
            '«Eg møtte på Maud, og vi diskuterte nokre vedtektsgreier saman. Vi er kanskje ' +
            'ikkje alltid samde, men vi jobbar svært godt saman. Sverre burde òg kunne ' +
            'stadfeste at eg var i gangen! Ho gjekk mykje fram og tilbake heile kvelden for å ' +
            'passe på dei som bada. Anna enn det såg eg også Hedvig gå inn i den salen eit par ' +
            'gonger i løpet av kvelden. Ho hadde til og med nokre fancy cocktailar idet ho ' +
            'gjekk inn i salen for andre gong. Eg såg Pia gå både fram og tilbake, for å hente ' +
            'kameraet sitt. Ho hadde nettopp vore i Moldova, sa ho, var veldig gøy! Så ho viste ' +
            'bilete derfrå på kameraet sitt. Etter det gjekk ho ned for å ta bilete av resten ' +
            'av folka — og den fine månen.»\n\n' +
            '**Hva skjedde så?**\n\n' +
            '«Ja nei, eg hugsar ikkje heilt kva som skjedde først av at Pia dukka opp og at ' +
            'Maud var der. Kanskje Maud si hending skjedde sist? Iallfall då vi snakka, kom ' +
            'Runill plutseleg ut for å seie at vi måtte dra ein annan stad. Ho verka heilt ' +
            'forskrekka. Vi drog kvar vår veg. Eg drog til baren, der det var veldig mange ' +
            'folk. Ane hadde heldigvis kontroll — men så vart alt kaos igjen då Hedvig snubla ' +
            'på golvet. Eg skulle til å spørje om det gjekk bra, men ho heldt fram som om ' +
            'ingenting hadde skjedd. Nokon var vel sikkert travle for å bade!\n\n' +
            'Vidare snakka eg litt med Oskar, iallfall. Vi snakka smått om spelet dei hadde ' +
            'spelt tidlegare den kvelden med Sverre, og idet han skulle illustrere, kom Andreas ' +
            'ut frå toalettet og fekk heile vinglaset til Oskar på skjorta si. Men heldigvis ' +
            'var han ikkje irritert, berre bestemt på at han måtte kjappe seg for å bruke ' +
            'Vanish. Så han sprang av garde han også. Litt seinare gjekk eg berre tilbake ut ' +
            'med dei andre og kosa meg resten av kvelden.»\n\n' +
            '**Vet du hvem som ville vært misfornøyd med Angela?**\n\n' +
            '«Nei, eigentleg ikkje, ho gjer ein super jobb. Altså, det blir alltid konflikt på ' +
            'jobb med politikk i bildet, spesielt når ein ikkje kjenner kvarandre så godt. Eg ' +
            'har òg hatt mine augneblinkar med henne, med alle desse vedtektene og bruk av ' +
            'nynorsk. Men vi går jo overeins!»',
        },
        {
          id: 'd1-vitne-oskar',
          title: 'Vitneutsagn: Oskar',
          kind: 'markdown',
          folder: 'vitner',
          inline:
            '## Vitneutsagn — Oskar\n\n' +
            '**Hvor var du da mordet skjedde?**\n\n' +
            '«Nei jeg var nok i baren da? Jeg fikk snakket litt med Angela i løpet av ' +
            'banketten. Vi hadde noen småting å fikse fra ANSA Frankrike. Jeg er nemlig ' +
            'økonomiansvarlig der. Maten var hvertfall nyyy-dee-lig! Alle likte vinen også, ' +
            'utenom skjorta til Andreas — men det var ikke med meningen. Vi stod lenge i baren ' +
            'og snakket. Spesielt med Brage og slikt. Han hjalp Hedvig velge ut noe drikke. ' +
            'Jeg fulgte ikke med for jeg snakket med et par andre folk. Underveis gikk Andreas ' +
            'forbi og på do. Han var borte en stund. Anna kom innom for å lete etter Angela ' +
            'men uten hell. Hun gned det inn at ANSA Paris hadde vunnet for noen år tilbake — ' +
            'men det er jo bare tull for hun er jo ANSA Danmark nå!»\n\n' +
            '**Hvem tror du det var?**\n\n' +
            '«Nei jeg vet ikke helt jeg. Jeg tenkte jo ikke noe over dette i løpet av kvelden. ' +
            'Vi så masse politi men skjønte ikke konteksten. Det var ikke før jeg gikk på vei ' +
            'tilbake til rommet med Brage at vi fikk vite det. Vi møtte på vaktmesteren som ' +
            'gikk i samme retning, han skulle tydeligvis fikse en ødelagt dør. Typisk ANSA ' +
            'Benelux som drikker for mye. Kanskje Pia fikk noe smart fra bildene sine? Jeg ' +
            'fikk ikke sett, men hun virket entusiastisk for å endelig være tilbake fra ' +
            'Moldova hvertfall.»\n\n' +
            '**Kunne du estimert noen klokkeslett for kvelden?**\n\n' +
            '«Tja de andre var ferdige med møtet sitt når banketten begynte rundt kl. 19:30. ' +
            'Så fortsatte middagen og ANSA Toulouse sin dominante seier av årets lokallag til ' +
            '21:30. Etter det ble det kaos. Folk dro i mange forskjellige retninger og Angela ' +
            'måtte rydde en del ting. Anna blant annet gikk for å hente trofeet hun passet på, ' +
            'på vegne av ANSA Paris, men hun fikk aldri returnert det. Vi gutta gikk på rommet ' +
            'vårt litt med studentprest Sverre for å ha guttatid, og etter det dro vi til ' +
            'baren. Innen ikke lenge kom Hedvig som rakk å bestille drikke rett før køen ' +
            'startet. Rundt 22:30 kanskje? Jeg tror hun forutså at det ble kø, for hun virket ' +
            'travel. Vi gikk til rommet litt etter midnatt.»',
        },
        {
          id: 'd1-vitne-anna',
          title: 'Vitneutsagn: Anna',
          kind: 'markdown',
          folder: 'vitner',
          inline:
            '## Vitneutsagn — Anna\n\n' +
            '**Hva gjorde du i løpet av kvelden?**\n\n' +
            '«Nei jeg var jo med ANSA Danmark-gjengen mye av tiden, og litt med Frankrike. De ' +
            'ble veldig glade når de vant årets lokallag. Jeg ville vise frem trofeet til ANSA ' +
            'Paris en god stund, og etter det skulle jeg returnere det til Angela siden jeg nå ' +
            'er del av ANSA Danmark.»\n\n' +
            '**Du gikk rundt med det trofeet hele kvelden?**\n\n' +
            '«Jeg hentet det etter bankettmiddagen, og jeg lette overalt etter Angela. Jeg ' +
            'skjønte ikke hvorfor folk var så stressa hele tiden før det var altfor sent. ' +
            'Blant annet dultet jeg borti hun ene fra ANSA Madrid, og gikk i baren med folk ' +
            'da. Jeg snakket litt med Andreas: han virket deppa. Wiktor var det også, og ' +
            'forklarte at det var fordi han hadde vunnet i dataspillet CIV VII. Uansett, jeg ' +
            'gikk videre og etterhvert ga jeg bare opp.»\n\n' +
            '**Hva gjorde du rundt 23:30 til midnatt?**\n\n' +
            '«Nei jeg hadde jo lett rundt masse, og gjorde det da også. Senere tok jeg et ' +
            'nattbad derimot. Mange andre folk gjorde det, så jeg slang meg utti. Du vet ' +
            'hvordan folk glemmer å ta ut mobilen fra lomma før de bader? Jeg glemte å legge ' +
            'fra meg trofeet. Det gikk heldigvis fint, og da fikk jeg vasket trofeet da!»\n\n' +
            '**Skjønner... Og hvem andre møtte du på i løpet av kvelden?**\n\n' +
            '«Ja så og si alle på et tidspunkt? Gikk forbi Maud som diskuterte med de andre om ' +
            'ANSA-ting. Jeg fikk jo snakket litt med Pia da. Vi gjorde litt det samme den ' +
            'kvelden, gikk rundt og snakket med alle. Var litt morsomt at hun klarte å ha ' +
            'hint av jetlag fra Moldova som bare ligger én time foran Norge haha.»',
        },
        {
          id: 'd1-vitne-pia',
          title: 'Vitneutsagn: Pia',
          kind: 'markdown',
          folder: 'vitner',
          inline:
            '## Vitneutsagn — Pia\n\n' +
            '**Hvor befant du deg rundt mordtiden?**\n\n' +
            '«Mordet var vel litt før midnatt? Jeg hadde gått litt fram og tilbake for å hente ' +
            'kamera og slik for å vise bilder fra Moldova. Jeg kom så og si direkte fra ' +
            'Moldova, så hadde mye å vise. Endte opp med en god del bilder som jeg skal sende ' +
            'til dere. Kanskje klokken 22:30 så møtte jeg på Erik i den ene korridoren. Vi ' +
            'snakket litt før jeg dro videre. Så tok jeg jo masse bilder av de som badet ' +
            'såklart — men vet ikke hvor relevant det er. Sender dere hvertfall alle bildene ' +
            'jeg har så dere kan se selv. Snakket litt med Anna også — koselig jente!»\n\n' +
            '**Hvilke andre ting burde vi vite?**\n\n' +
            '«Nei ikke så mye. Jeg hørte gossip fra Andreas om at Oskar har brukt ANSA ' +
            'Frankrike-penger på masse pils, men det er lowkey rykter.»',
        },
        {
          id: 'd1-vitne-andreas',
          title: 'Vitneutsagn: Andreas',
          kind: 'markdown',
          folder: 'vitner',
          inline:
            '## Vitneutsagn — Andreas Holmsen\n\n' +
            '**Hva gjorde du i løpet av kvelden?**\n\n' +
            '«Nei jeg følte jeg burde snakke med så mange som mulig. Så utenom en liten pause ' +
            'på rommet etter banketten stod jeg litt i baren og overalt. Prøvde å holde ' +
            'humøret oppe. Det var en del vedtektsforslag jeg ikke fikk sendt, så jeg prøvde å ' +
            'kompensere ved å få folk til å stemme på andre ting slik jeg ville. Det var smart ' +
            'å sitte i baren da, for det var utrolig mange folk som kom underveis! Var nesten ' +
            'pub-quiz-stemning uten pub quiz.»\n\n' +
            '**Og hvor var du når mordet skjedde?**\n\n' +
            '«Nei jeg må helt ærlig si at jeg ikke husker så godt — minnet mitt er litt dårlig ' +
            'når jeg er på laserfylla. Muligens at det var da jeg måtte bytte skjorte fordi ' +
            'jeg hadde vin på den. Det var ikke blod assa, hvis det var det dere tvilte på! ' +
            'Jeg prøvde mitt beste, og fikk fjernet flekkene heldigvis. Møtte på Pia i gangen ' +
            'som hadde kameraet sitt så vi snakket litt. Fikset skjorta mi også badet jeg i ' +
            'løpet av kvelden med en del andre folk. Tror jeg møtte på noen kjentfolk? Husker ' +
            'ikke hvem, men snudde meg for å si hei. Vent nei eller var det bare en ' +
            'vaktmester? Uff nei det er ikke lett...»',
        },
        {
          id: 'd1-runill-notater',
          title: 'Runill notater',
          kind: 'markdown',
          // Gult notatark — skiller seg fra de lyseblå vitneutsagnene og de
          // fersken-tintede bildemappene.
          tint: '#fff3bf',
          inline:
            '## [RUNILL NOTATER]\n\n' +
            '11:13 – Passet på at alle har kommet seg fra gårsdagen\n\n' +
            '18:12 – Ga ibux til Angela, dobbeltsjekke at alt går bra i morgen\n\n' +
            '18:42 – Hadde samtale med edruvakt Henriette angående tips.\n\n' +
            '21:02 – Edruvakt måtte byttes, rakk ikke nytt møte',
        },
        {
          id: 'd1-dorlogg',
          title: 'Dørlogg',
          kind: 'markdown',
          // Blekgrønt «hullbånd»-papir — egen farge, så utskriften ikke forveksles
          // med de lyseblå vitneutsagnene, Pias fersken eller Runills gule ark.
          tint: '#dde9dd',
          inline:
            // Loggen registrerer BARE kortåpninger — ingen dørstatus, ingen
            // varsler, ingen avviste avlesinger. Det er derfor rom 327 ikke
            // skiller seg ut i det hele tatt: Sverre har en åpning 23:32 som
            // ser helt lik alle andres ut, og fordi utgang fra innsiden ikke
            // logges, sier loggen ingenting om at han gikk ut igjen. Beviset
            // er fraværet, ikke en rad. Ikke legg inn dørstatus-hendelser her.
            //
            // ASCII-blokkene ruller sidelengs på mobil, så MERKNAD-en ligger
            // BEVISST utenfor dem: den er selve nøkkelen til loggen («utgang fra
            // innsiden registreres ikke») og må brytes, ikke klippes.
            '```\n' +
            '════════════════════════════════════════\n' +
            '  ADGANGSKONTROLL — ÅPNINGSLOGG\n' +
            '  Anlegg ...... Sørmarka Oslo\n' +
            '  Periode ..... lør 01.08.2026 18:00 –\n' +
            '                søn 02.08.2026 04:00\n' +
            '  Utskrift .... søn 02.08.2026 09:14\n' +
            '  Enhet ....... dørkontroll v4.2 / A–C\n' +
            '════════════════════════════════════════\n' +
            '```\n\n' +
            '**MERKNAD:** Systemet registrerer kun godkjent kortåpning — ikke passering, ikke ' +
            'dørstatus. Utgang fra innsiden registreres ikke.\n\n' +
            '| DØR | TID |\n' +
            '| --- | --- |\n' +
            '| 318 | 17:52 |\n' +
            '| 305 | 18:04 |\n' +
            '| 118 | 18:20 |\n' +
            '| 322 | 18:31 |\n' +
            '| 311 | 18:47 |\n' +
            '| 206 | 19:02 |\n' +
            '| 209 | 19:08 |\n' +
            '| 404 | 19:11 |\n' +
            '| 203 | 19:15 |\n' +
            '| 224 | 19:19 |\n' +
            '| 107 | 19:22 |\n' +
            '| 316 | 19:24 |\n' +
            '| 213 | 19:26 |\n' +
            '| 221 | 19:26 |\n' +
            '| 104 | 19:28 |\n' +
            '| 327 | 19:29 |\n' +
            '| 112 | 19:33 |\n' +
            '| 120 | 20:41 |\n' +
            '| 118 | 21:00 |\n' +
            '| 308 | 21:19 |\n' +
            '| 305 | 21:30 |\n' +
            '| 316 | 21:38 |\n' +
            '| 221 | 21:41 |\n' +
            '| 213 | 21:48 |\n' +
            '| 319 | 21:52 |\n' +
            '| 410 | 21:55 |\n' +
            '| 322 | 22:00 |\n' +
            '| 209 | 22:05 |\n' +
            '| 224 | 22:12 |\n' +
            '| 316 | 22:14 |\n' +
            '| 224 | 22:26 |\n' +
            '| 206 | 22:33 |\n' +
            '| 410 | 22:45 |\n' +
            '| 107 | 23:01 |\n' +
            '| 120 | 23:04 |\n' +
            '| 404 | 23:12 |\n' +
            '| 308 | 23:20 |\n' +
            '| 327 | 23:32 |\n' +
            '| 213 | 23:34 |\n' +
            '| 215 | 23:38 |\n' +
            '| 213 | 23:51 |\n' +
            '| 206 | 23:58 |\n' +
            '| 319 | 00:07 |\n' +
            '| 104 | 00:16 |\n' +
            '| 316 | 00:18 |\n' +
            '| 112 | 00:20 |\n' +
            '| 410 | 00:31 |\n' +
            '| 120 | 00:39 |\n' +
            '| 209 | 00:50 |\n' +
            '| 203 | 00:55 |\n' +
            '| 305 | 01:05 |\n' +
            '| 322 | 01:12 |\n' +
            '| 221 | 01:20 |\n' +
            '| 311 | 01:30 |\n' +
            '| 107 | 01:44 |\n' +
            '| 404 | 02:02 |\n' +
            '| 308 | 02:16 |\n' +
            '| 215 | 02:29 |\n' +
            '| 118 | 03:04 |\n\n' +
            '```\n' +
            '════════════════════════════════════════\n' +
            '  Antall kortåpninger: 59\n' +
            '  Antall dører med aktivitet: 22\n' +
            '════════════════════════════════════════\n' +
            '```',
        },
      ],
      question: {
        type: 'multiple_choice',
        prompt: 'Hvem lyver i vitneutsagnet sitt?',
        options: [...SUSPECT_OPTIONS, { id: 'ingen', label: 'Ingen av dem lyver' }],
      },
      // Fasit for dag 1 — vises i POLITI når dag 2 har åpnet (avstemning stengt).
      reveal:
        '## Løsningen på Dag 1\n\n' +
        '**Løgneren? Hedvig.**\n\n' +
        'At Hedvig gikk inn i salen med drikke var nemlig ingen tilfeldighet — det var ' +
        'nemlig Angela som fikk drikken.\n\n' +
        'Hedvig sier:\n\n' +
        '> «Når jeg gikk til baren rundt 22:30-tiden så stod noen av Frankrikegutta der. ' +
        'Oskar og Brage var veldig pratsomme, men Andreas virket litt mer stille. Nerver ' +
        'kanskje? Brage hjalp meg hvertfall velge ut en passende drikke, og jeg gikk ' +
        'gjennom salen hvor Angela satt. Vi snakket litt sammen også gikk jeg videre for å ' +
        'se hvor vennene mine var.»\n\n' +
        'Men i Erik sitt vitneutsagn hører vi tydelig:\n\n' +
        '> «Anna enn det såg eg også Hedvig gå inn i den salen eit par gonger i løpet av ' +
        'kvelden. Ho hadde til og med nokre fancy cocktailar idet ho gjekk inn i salen for ' +
        'andre gong.»\n\n' +
        'Senere på kvelden hører vi også fra Ane:\n\n' +
        '> «Jeg var edruvakt så jeg gikk rundt. På et tidspunkt tok jeg meg en runde også ' +
        'så jeg Angela sittende alene med en Blue Lagoon-cocktail. Hun så kjempesliten ut, ' +
        'så jeg fratok henne drinken og gikk ut til Runill for å se.»\n\n' +
        'Hvorfor ville Hedvig løyet om å alt ha møtt Angela tidligere den kvelden, og ' +
        'hvorfor ga Hedvig en drink til Angela???\n\n' +
        '**På grunn av din smarte tenking tar politiet flere vitneavhør og samler mer bevis ' +
        'rundt saken 🤓**',
    },

    {
      day: 2,
      title: 'Dag 2',
      intro: 'Obduksjonen er klar, og bildet blir mer komplisert.',
      folders: [
        // Pias bilder → to under-undermapper (mobil / kamera). Filnavnene ER
        // dokumenttitlene, så tidsstemplene er synlige i fliselista.
        {
          id: 'pia-bilder',
          title: 'Pias bilder',
          icon: '📷',
          tint: '#ffe4cc',
          intro:
            'Bildene Pia sendte inn til politiet. Overført fra mobilen hennes — hun har flere\n\nbilder på kameraet som ikke er ferdig overført.',
        },
        {
          id: 'pia-mobil',
          parent: 'pia-bilder',
          title: 'Mobilbilder',
          icon: '📱',
          tint: '#ffe4cc',
          intro: 'Hentet fra Pias mobiltelefon.',
        },
      ],
      docs: [
        {
          id: 'd2-obd',
          title: 'Foreløpig obduksjonsrapport',
          kind: 'markdown',
          // Blek klinisk grå — skiller seg fra vitneutsagn (blå), Pia (fersken),
          // Runills notater (gul) og dørloggen (grønn).
          tint: '#eceff3',
          // VIKTIG: dag 2 skal IKKE forklare hodeskaden. Det var MYE blod på
          // åstedet (jf. Runill) — og nettopp det er gåten, siden Hedvig ikke
          // såg blod 20 min tidligere. Her skal giften være bekreftet og slaget
          // stå UFORKLART: den opprinnelige konklusjonen er strøket og stemplet.
          inline:
            '```\n' +
            '════════════════════════════════════════\n' +
            '  RETTSMEDISINSK INSTITUTT\n' +
            '  FORELØPIG OBDUKSJONSRAPPORT\n' +
            '  Sak ......... 2026-1738\n' +
            '  Avdøde ...... Angela Hengzhi Liu, 23 år\n' +
            '  Obdusert .... søn 02.08.2026 kl. 08:40\n' +
            '  Rekvirent ... politiet, Nordre Follo\n' +
            '  Status ...... FORELØPIG — ikke endelig\n' +
            '════════════════════════════════════════\n' +
            '```\n\n' +
            '### 1. Foreløpig konklusjon (fra åstedet)\n\n' +
            '~~Dødsårsak antas å være traume mot bakhodet påført med butt gjenstand. ' +
            'Skademønsteret er forenlig med ett enkelt slag. Dødsfallet vurderes som ' +
            'voldsomt.~~\n\n' +
            '```\n' +
            ' ╔═══════════════════════╗\n' +
            ' ║ ✗  MÅ UNDERSØKES   ✗ ║\n' +
            ' ╚═══════════════════════╝\n' +
            '```\n\n' +
            '**Konklusjonen over er strøket.** Toksikologisk hurtigprøve gir et annet bilde, ' +
            'se punkt 3.\n\n' +
            '### 2. Ytre undersøkelse\n\n' +
            '- Kvinne, 168 cm, normal ernæringstilstand. Ingen tidligere kjent sykdom.\n' +
            '- Iført festkjole (magenta) og én sko. Den andre skoen lå ca. 1 m fra kroppen.\n' +
            '- Skade i bakhodet, høyre side. **Tidspunkt og rekkefølge er ikke fastslått.**\n' +
            '- Ingen forsvarsskader på hender eller underarmer. Ingen tegn til kamp.\n' +
            '- Ingen merker på hals. Ingen stikk- eller kuttskader.\n' +
            '- Neglene er hele og rene.\n\n' +
            '### 3. Toksikologi (hurtigprøve)\n\n' +
            '- Påvist **ukjent stoff** i blod. Videre analyse pågår.\n' +
            '- Fordelingen i vev tilsier at **inntaket har skjedd fire til sju timer før ' +
            'dødstidspunktet** — ikke i minuttene eller kvarteret før.\n' +
            '- **Etanol: 0,2 ‰.** Avdøde var i praksis edru.\n' +
            '- Mageinnhold: sportsdrikk og noe uspist mat. Siste måltid anslås 3 timer før ' +
            'død.\n' +
            '- Ingen påvisning av narkotiske stoffer. Paracetamol i terapeutisk mengde.\n\n' +
            '### 4. Dødstidspunkt\n\n' +
            'Anslått mellom kl. 22:30 og 23:40 lørdag 1. august, basert på kroppstemperatur og ' +
            'likstivhet ved ankomst.\n\n' +
            '### 5. Merknader\n\n' +
            '- Prøver er sendt til utvidet analyse. Endelig rapport ettersendes.\n' +
            '- Klær, glass og øvrige gjenstander fra åstedet er oversendt kriminalteknikk.\n' +
            '- Rekvirent har bedt om særskilt vurdering av hodeskaden. **Dette punktet er ikke ' +
            'ferdig gjennomgått.**\n',
        },
        // ---------------------------------------------------------------------
        // RUNILL, AVHØR 2 — renvasking. Mange mistenker henne etter dag 1 (pilla,
        // de sju minuttene, at hun var alene med Angela). Her svarer hun presist
        // på alt, og korrigerer «alt blodet» fra første avhør — det er nettopp
        // korreksjonen som gjør henne troverdig, og den setter opp dag 3.
        // ---------------------------------------------------------------------
        {
          id: 'd2-vitne-runill-2',
          title: 'Vitneavhør 2: Runill',
          kind: 'markdown',
          tint: '#d7e9fb',
          inline:
            '## Vitneavhør 2 — Runill\n\n' +
            '**Du ga Angela en tablett på ettermiddagen. Hva var det?**\n\n' +
            '«To paracet, mot hodeverk. Jeg fører alt jeg gir ut i notatboka, så det står der ' +
            'med klokkeslett. Jeg ga det samme til fire andre den dagen — det er en helt vanlig ' +
            'dag på jobb for meg. Ved navnet hennes skrev jeg «sjekke i morgen», for hun så ' +
            'sliten ut.»\n\n' +
            '**Dere snakket lenge på telefon kvelden før. Om hva?**\n\n' +
            '«Det kan jeg ikke gå inn på. Sosialveiledning er taushetsbelagt — det står i ' +
            '§86.2, og det gjelder også etter at noen er død. Det jeg KAN si er at hun hadde ' +
            'bestilt en time hos meg mandagen etter GF. Det ligger i systemet, dere får se ' +
            'det selv.»\n\n' +
            '**Hvorfor tok det sju minutter før du ringte?**\n\n' +
            '«Fordi jeg gjorde jobben min i feil rekkefølge. Jeg sikret rommet først og ringte ' +
            'etterpå. Jeg er beredskapsopplært, og jeg vet at det skal være motsatt. Jeg tenkte ' +
            'på hundre studenter i gangen utenfor.»\n\n' +
            '**Du sa «alt blodet» i går. Beskriv det.**\n\n' +
            '«Det var mye. Det lå en pøl ved hodet hennes, og det er derfor jeg var så redd for ' +
            'at noen andre skulle komme inn og se det. Jeg satte meg ned på kne for å kjenne ' +
            'etter puls, og da fikk jeg det på buksa og på hånda. Dere har tatt klærne mine — ' +
            'bare undersøk dem.»\n\n' +
            '**Vi har gjort det.**\n\n' +
            '«Godt. Da vet dere mer enn meg.»',
        },
        {
          id: 'd2-runill-funnrapport',
          title: 'Funnrapport (Runill)',
          kind: 'markdown',
          tint: '#e3efe6',
          // MYE blod er selve gåten (Hedvig såg ingen blod 20 min tidligere).
          // IKKE endre til «lite blod» — det ødelegger dag 3.
          inline:
            '```\n' +
            '════════════════════════════════════\n' +
            '  ANSA — BEREDSKAP\n' +
            '  FUNNRAPPORT (nedskrevet på stedet)\n' +
            '  Skrevet av .. Runill, sosialveileder\n' +
            '  Dato ........ lør 01.08.2026\n' +
            '  Klokke ...... 23:45\n' +
            '════════════════════════════════════\n' +
            '```\n\n' +
            '**23:38** — Fant Angela Liu livløs på gulvet i plenumssalen. Ingen andre til stede ' +
            'i rommet.\n\n' +
            '**Observert:** Ingen puls. Hodeskade bak, høyre side. **Mye blod på gulvet ved ' +
            'hodet.** Ingen tegn til kamp. Stol veltet ved bordenden.\n\n' +
            '**Merk:** Jeg gikk ned på kne for å kjenne etter puls og fikk blod på buksa og ' +
            'høyre hånd. Ingenting annet i rommet er rørt av meg.\n\n' +
            '**23:39–23:44** — Lukket begge dører. Ba to personer i korridoren forlate området. ' +
            'Holdt ytterligere to personer unna rommet.\n\n' +
            '**23:45** — Ringte 113.\n\n' +
            '_Skrevet ned rett etterpå så jeg husker rekkefølgen riktig. Jeg vet at jeg burde ' +
            'ringt først._',
        },
        {
          // Renvasker Runill FYSISK — og virker bare fordi det var mye blod:
          // den som slo ville hatt sprut på seg. Hun har kun kontaktoverføring
          // (kne + høyre hånd) fra å kjenne etter puls.
          id: 'd2-klaer-runill',
          title: 'Undersøkelse: klær (Runill)',
          kind: 'markdown',
          tint: '#efe2e2',
          inline:
            '```\n' +
            '════════════════════════════════════\n' +
            '  KRIMINALTEKNISK UNDERSØKELSE\n' +
            '  Sak ......... 2026/1187\n' +
            '  Beslag ...... B-11 (klær, Runill)\n' +
            '  Sikret ...... 02.08.2026 kl. 00:20\n' +
            '════════════════════════════════════\n' +
            '```\n\n' +
            '**Funn**\n\n' +
            '- Blod på begge knær og i høyre håndflate. Mønsteret er **kontaktoverføring** — ' +
            'altså blod som er kommet dit ved berøring og knestående.\n' +
            '- **Ingen sprut- eller kastemønster** er påvist noe sted på klærne.\n' +
            '- Ingen blod på ermer, bryst, rygg eller i ansikt.\n' +
            '- Ingen blod på skosåler ut over ett avtrykk ved kroppen.\n\n' +
            '_Blodet på klærne er kontaktblod. Det er ikke funnet spor av sprut._',
        },
        // ---------------------------------------------------------------------
        // GLASSANALYSE — Hedvig ber selv om denne i avhøret på dag 2.
        // Ingen alkohol, ingen gift. Dreper hele barsporet.
        // ---------------------------------------------------------------------
        {
          id: 'd2-glassanalyse',
          title: 'Analyse: glass fra vinduskarm',
          kind: 'markdown',
          tint: '#efe2e2',
          inline:
            '```\n' +
            '════════════════════════════════════\n' +
            '  KRIMINALTEKNISK ANALYSE\n' +
            '  Sak ......... 2026-1738\n' +
            '  Beslag ...... B-04\n' +
            '  Beskrivelse . høyt glass, ca. 1/3\n' +
            '                fylt, blå væske\n' +
            '  Funnsted .... vinduskarm, korridor\n' +
            '                utenfor plenumssal\n' +
            '  Sikret ...... 02.08.2026 kl. 01:10\n' +
            '════════════════════════════════════\n' +
            '```\n\n' +
            '**Innhold**\n\n' +
            'Væsken består av vann, sukker, natrium, kalium, sitronsyre og fargestoffet ' +
            '**E133 (briljantblå)**. Sammensetningen samsvarer med kommersiell ' +
            'sportsdrikk.\n\n' +
            '**Alkohol:** ikke påvist.\n\n' +
            '**Toksiske stoffer:** ikke påvist. Væsken er analysert mot samme panel som i ' +
            'sak 2026/1187 pkt. 2, samt utvidet screening. Negativt i alle tester.\n\n' +
            '**Merknad fra teknisk**\n\n' +
            'Glasset er ikke et cocktailglass, men et ordinært høyt serveringsglass av typen ' +
            'hotellet bruker til alle drikkevarer. Isbitene var smeltet ved sikring, og ' +
            'kondensavtrykket på karmen viser at glasset hadde stått urørt i lang tid.\n\n' +
            'Avtrykk fra fire personer er identifisert, herunder avdødes. Avtrykkene har ingen ' +
            'bevisverdi da glasset er håndtert av flere.\n\n' +
            '**Konklusjon:** væsken i beslag B-04 er en blåfarget sportsdrikk. Den inneholder ' +
            'verken alkohol eller helseskadelige stoffer.',
        },
        {
          id: 'd2-barkvittering',
          title: 'Barkvittering 22:34',
          kind: 'markdown',
          // Varmt kvitteringspapir.
          tint: '#faf3e0',
          // Bekrefter Hedvigs andre utsagn: hun kjøpte TO Powerade (ingen
          // alkohol), og de er BLÅ — derfor tok Ane den for en Blue Lagoon.
          inline:
            '```\n' +
            '   SØRMARKA KONFERANSEHOTELL\n' +
            '          BAR 1 · KASSE 2\n' +
            '   Org.nr 914 552 108 MVA\n' +
            '- - - - - - - - - - - - - - - - - -\n' +
            '   Kvittering ..... 0417\n' +
            '   Dato ........... lør 01.08.2026\n' +
            '   Tid ............ 22:34\n' +
            '   Betjent av ..... TOBIAS\n' +
            '- - - - - - - - - - - - - - - - - -\n' +
            '   2 x POWERADE MOUNTAIN BLAST\n' +
            '       0,5 L (BLÅ)     2 x 45,00\n' +
            '                          90,00\n' +
            '- - - - - - - - - - - - - - - - - -\n' +
            '   TOTALT                 90,00\n' +
            '   Herav MVA 15 %         11,74\n' +
            '   Betalt: VIPPS *** 6642\n' +
            '   Navn:   H. HAZELAND\n' +
            '- - - - - - - - - - - - - - - - - -\n' +
            '   ALKOHOLENHETER ......... 0\n' +
            '   Takk for besøket!\n' +
            '   Åpen til 01:00 · nattbading\n' +
            '   skjer på eget ansvar\n' +
            '```\n\n' +
            '**MERKNAD (kriminalteknikk):** Kvitteringen ble funnet i lommen på en jakke i ' +
            'garderoben. Kasseloggen bekrefter kjøpet. Ingen alkohol er registrert på ' +
            'kvitteringen.',
        },

        {
          id: 'd2-anropslogg',
          title: 'Anropslogg (Angela)',
          kind: 'markdown',
          tint: '#e6e0f0',
          inline:
            '```\n' +
            '════════════════════════════════════\n' +
            '  TELEOPERATØR — TRAFIKKDATA\n' +
            '  Abonnent ... A. Liu\n' +
            '  Periode .... 28.07 – 01.08.2026\n' +
            '  Utlevert ... 02.08.2026\n' +
            '  Hjemmel .... straffeprosessloven\n' +
            '════════════════════════════════════\n' +
            '```\n\n' +
            '| DATO | TID | MOTPART | RETNING | VARIGHET |\n' +
            '| --- | --- | --- | --- | --- |\n' +
            '| 28.07 | 10:14 | Sørmarka konferansehotell | ut | 6 min |\n' +
            '| 28.07 | 15:47 | Ingeborg F. Dahl-Hilstad | inn | 11 min |\n' +
            '| 28.07 | 19:02 | Mamma | inn | 22 min |\n' +
            '| 29.07 | 09:41 | Ingeborg F. Dahl-Hilstad | ut | 4 min |\n' +
            '| 29.07 | 13:20 | Runill | ut | 2 min |\n' +
            '| 29.07 | 16:55 | Maia Vejlgaard Evensen | inn | 38 min |\n' +
            '| 29.07 | 20:08 | Sverre | ut | 4 min |\n' +
            '| 30.07 | 08:30 | Sørmarka konferansehotell | ut | 9 min |\n' +
            '| 30.07 | 11:12 | Henriette Moe Schjelderup | inn | 3 min |\n' +
            '| 30.07 | 14:26 | Runill | inn | 26 min |\n' +
            '| 30.07 | 17:44 | Andreas Holmsen | inn | 14 min |\n' +
            '| 31.07 | 09:05 | Aleksander Victor Taban | inn | 1 min |\n' +
            '| 31.07 | 09:06 | Aleksander Victor Taban | inn | 12 min |\n' +
            '| 31.07 | 18:20 | Brage Flønæs Johnsen | ut | 5 min |\n' +
            '| 31.07 | 22:15 | Runill | ut | 19 min |\n' +
            '| 01.08 | 12:02 | Mamma | inn | ubesvart |\n' +
            '| 01.08 | 12:40 | Sørmarka konferansehotell | inn | 2 min |\n\n' +
            '_Ingen anrop registrert etter kl. 12:40 den 01.08.2026._',
        },

        // =====================================================================
        //  DRIKKESERVERING PÅ MØTET — hint, ikke bevis.
        //  REGLER: ordet «vors», «alkohol» og «vin» finnes IKKE. Ingen som var
        //  der innrømmer noe; alle hintene kommer utenfra. Ingenting peker på
        //  hvem som ordnet drikken — fakturaen går til ROMMET, ikke en person.
        //  Selve bestillingen (hva som ble kjøpt) er et DAG 3-dokument.
        // =====================================================================
        {
          id: 'd2-hotellfaktura',
          title: 'Delfaktura fra hotellet',
          kind: 'markdown',
          tint: '#f6f1e4',
          inline:
            '```\n' +
            '════════════════════════════════════\n' +
            '  SØRMARKA KONFERANSEHOTELL\n' +
            '  Delfaktura 20261188\n' +
            '  Kunde: ANSA — Generalforsamling 70\n' +
            '  Periode: 31.07 – 02.08.2026\n' +
            '════════════════════════════════════\n' +
            '```\n\n' +
            '| Post | Detaljer | Beløp |\n' +
            '| --- | --- | --- |\n' +
            '| Plenumssal | 3 dager | 42 000 |\n' +
            '| Møterom Bjørk | lør 01.08, kl. 14:00–18:30 | 3 400 |\n' +
            '| Møterom Bjørk | **servering iht. bestilling, 14 pers.** | 6 860 |\n' +
            '| Bankettmiddag | 98 kuverter | 68 600 |\n' +
            '| Bar, bankett | etter forbruk, se eget bilag | 24 115 |\n' +
            '| Møterom Gran | fre 31.07, kl. 09–12 | 2 200 |\n' +
            '| Møterom Gran | kaffe/te, 20 pers. | 900 |\n' +
            '| Ekstra rydding | Møterom Bjørk, lør kveld | 750 |\n' +
            '| Overnatting | se romoversikt | 214 500 |\n\n' +
            '_Spørsmål om fakturaen rettes til resepsjonen. Bilag og bestillinger kan ' +
            'ettersendes på forespørsel._',
        },
        {
          id: 'd2-renholdslogg',
          title: 'Renholdslogg',
          kind: 'markdown',
          tint: '#e2e8f0',
          inline:
            '```\n' +
            '════════════════════════════════════\n' +
            '  SØRMARKA — RENHOLD\n' +
            '  Vaktliste lør 01.08.2026\n' +
            '  Ansv.: A. Ruud\n' +
            '════════════════════════════════════\n' +
            '```\n\n' +
            '| TID | ROM | MERKNAD |\n' +
            '| --- | --- | --- |\n' +
            '| 08:20 | Plenumssal | Standard. |\n' +
            '| 11:40 | Foajé | Standard. |\n' +
            '| 13:10 | Møterom Bjørk | Klargjort for 14 pers. Bestilling levert 13:50. |\n' +
            '| 15:30 | Plenumssal | Standard. |\n' +
            '| 18:45 | Møterom Bjørk | **Ekstra rydding. Mange glass. Stoler satt tilbake. ' +
            'Ett glass knust — ikke belastet.** |\n' +
            '| 19:00 | Bankettsal | Ferdigstilt før servering. |\n' +
            '| 22:10 | Toaletter 1. etg. | Standard. |\n' +
            '| 23:05 | Korridor v/sal | Søl på gulv, tørket opp. |\n' +
            '| — | Korridor v/sal | Videre renhold innstilt på politiets anmodning. |\n\n' +
            '_Merknad fra ansvarlig: bestilling til Bjørk ble levert av kjøkkenet, ikke av ' +
            'renhold. Se kjøkkenets bilag._',
        },

        // ------------------------------------------------------------------
        // PIAS BILDER. Filnavnet er tittelen, så klokkeslettet er synlig.
        // Mobilen stilte seg om til norsk tid ved landing; kameraet står
        // fortsatt på Moldova-tid (én time foran, jf. Anna sitt utsagn). De tre
        // bildene som finnes på BEGGE enhetene har derfor filnavn som ligger
        // nøyaktig én time fra hverandre — samme sekund, samme motiv:
        //   10:46:12 / 11:46:12  ·  19:30:45 / 20:30:45  ·  20:55:12 / 21:55:12
        // Legg filene i public/case/dag2/pia/ — se README-en der.
        // ------------------------------------------------------------------

        // --- Mobil (norsk tid — telefonen stilte seg om ved landing) ---
        {
          id: 'd2-pia-m1',
          title: 'IMG_20260730_121540.jpg', // Praha, mellomlanding
          kind: 'image',
          folder: 'pia-mobil',
          src: 'case/dag2/pia/moldova5.jpg',
        },
        {
          id: 'd2-pia-m2',
          title: 'IMG_20260730_181402.jpg', // inne i flyet
          kind: 'image',
          folder: 'pia-mobil',
          src: 'case/dag2/pia/plane.jpg',
        },
        {
          id: 'd2-pia-m3',
          title: 'IMG_20260730_195133.jpg', // flyvindu, solnedgang
          kind: 'image',
          folder: 'pia-mobil',
          src: 'case/dag2/pia/moldova.jpg',
        },
        {
          id: 'd2-pia-m4',
          title: 'IMG_20260730_211208.jpg', // Oslo lufthavn
          kind: 'image',
          folder: 'pia-mobil',
          src: 'case/dag2/pia/gardmeon airport.jpg',
        },
        {
          id: 'd2-pia-m5',
          title: 'IMG_20260731_101547.jpg', // Sørmarka-skiltet
          kind: 'image',
          folder: 'pia-mobil',
          src: 'case/dag2/pia/sørmarka1.jpg',
        },
        {
          // ★ samme fil som kameraets IMG_20260731_114612.jpg (+1 time)
          id: 'd2-pia-m6',
          title: 'IMG_20260731_104612.jpg', // Sørmarka over vannet
          kind: 'image',
          folder: 'pia-mobil',
          src: 'case/dag2/pia/sørmarka.jpg',
        },
        {
          id: 'd2-pia-m7',
          title: 'IMG_20260731_112033.jpg', // hotellrommet
          kind: 'image',
          folder: 'pia-mobil',
          src: 'case/dag2/pia/hotell2.jpg',
        },
        {
          // ★ samme fil som kameraets IMG_20260801_203045.jpg (+1 time)
          id: 'd2-pia-m8',
          title: 'IMG_20260801_193045.jpg', // bankettsalen
          kind: 'image',
          folder: 'pia-mobil',
          src: 'case/dag2/pia/sørmarlka3.jpg',
        },
        {
          // ★ samme fil som kameraets IMG_20260801_215512.jpg (+1 time)
          id: 'd2-pia-m9',
          title: 'IMG_20260801_205512.jpg', // gjengen
          kind: 'image',
          folder: 'pia-mobil',
          src: 'case/dag2/pia/people1.jpg',
        },

      ],
      question: {
        type: 'free_text',
        prompt: 'Hva var den faktiske dødsårsaken til Angela?',
        placeholder: 'Skriv din teori …',
      },
      // Fasit for dag 2 — vises i POLITI når dag 3 har åpnet (avstemning stengt).
      reveal:
        '## Løsningen på Dag 2\n\n' +
        '**Angela ble forgiftet.**\n\n' +
        'Glasset i vinduskarmen var en Powerade. Ingen alkohol, ingen gift — Hedvig ' +
        'snakket sant, og hun kjøpte to fordi hun tok en til seg selv også.\n\n' +
        'Men obduksjonen sier noe mer ubehagelig: stoffet ble tilført **fire til sju ' +
        'timer** før hun døde. Altså et sted mellom kl. 16:00 og 19:30.\n\n' +
        'Da hadde ikke banketten begynt engang.\n\n' +
        '> «Vi hadde også et ekstra møte blant ansatte og hovedstyret.»\n\n' +
        'Alle som har snakket om den ettermiddagen har kalt den noe forskjellig. Ingen ' +
        'har sagt hva som egentlig skjedde der.\n\n' +
        '**Og ett spørsmål står helt åpent:** hvis giften drepte henne — hvorfor er det ' +
        'et hodesår?\n\n' +
        '**Politiet jobber videre i natt. I morgen har vi svaret. 🕵️**',
      // Nytt avhør politiet hentet inn etter dag 1. MÅ åpnes før dagens
      // spørsmål vises — spilleren skal lese det før de svarer.
      briefing: {
        title: 'Nytt vitneavhør: Hedvig',
        intro:
          '### Og løgneren var …\n\n' +
          '# HEDVIG 🎭\n\n' +
          'At Hedvig gikk inn i salen med drikke var nemlig ingen tilfeldighet — det var ' +
          'nemlig Angela som fikk drikken.\n\n' +
          'Hedvig sier:\n\n' +
          '> «Når jeg gikk til baren rundt 22:30-tiden så stod noen av Frankrikegutta der. ' +
          'Oskar og Brage var veldig pratsomme, men Andreas virket litt mer stille. Nerver ' +
          'kanskje? Brage hjalp meg hvertfall velge ut en passende drikke, og jeg gikk gjennom ' +
          'salen hvor Angela satt. Vi snakket litt sammen også gikk jeg videre for å se hvor ' +
          'vennene mine var.»\n\n' +
          'Men i Erik sitt vitneutsagn hører vi tydelig:\n\n' +
          '> «Anna enn det såg eg også Hedvig gå inn i den salen eit par gonger i løpet av ' +
          'kvelden. Ho hadde til og med nokre fancy cocktailar idet ho gjekk inn i salen for ' +
          'andre gong.»\n\n' +
          'Senere på kvelden hører vi også fra Ane:\n\n' +
          '> «Jeg var edruvakt så jeg gikk rundt. På et tidspunkt tok jeg meg en runde også så ' +
          'jeg Angela sittende alene med en Blue Lagoon-cocktail. Hun så kjempesliten ut, så ' +
          'jeg fratok henne drinken og gikk ut til Runill for å se.»\n\n' +
          'Hvorfor ville Hedvig løyet om å alt ha møtt Angela tidligere enn kvelden, og hvorfor ' +
          'ga Hedvig en drink til Angela???\n\n' +
          '**På grunn av din smarte tenking tar politiet flere vitneavhør og samler mer bevis ' +
          'rundt saken 🤓**',
        body:
          '## Vitneavhør 2 — Hedvig\n\n' +
          '**Du har blitt observert gå inn i den salen flere ganger enn du nevnte! Din ' +
          'morder!!**\n\n' +
          '«Vent hæ nei jeg aner ikke hva du snakker om, såklart gjorde jeg da ikke det.»\n\n' +
          '**Åååå stakkars deg... Det er helt sikkert bare en misforståelse, hvordan endte hun ' +
          'opp med en Blue Lagoon-cocktail da?**\n\n' +
          '«Blue Lagoon? Neinei det har jeg faktisk ikke gjort. Jeg ga henne bare en Powerade ' +
          'siden hun virket litt sliten. Ifølge Brage så føler man seg mye bedre etter alkohol ' +
          'hvis man chugger en Powerade. Det var derfor jeg kjøpte en til meg selv også!»\n\n' +
          '**Så du innrømmer at du utela et møte med Angela??**\n\n' +
          '«Ja... Vi har jo vært litt rivaler siden hun er i Toulousegjengen og jeg er i ' +
          'Madrid. Når Toulouse vant årets lokallag tvilte jeg på at hun var objektiv rundt ' +
          'saken — så jeg ønsket å konfrontere henne om det. Men jeg lover intensjonene mine ' +
          'var gode!! Når jeg så henne skjønte jeg at hun var utmattet, så jeg gikk ut og ' +
          'skulle hente vann. Bare ta en analyse av glasset!»\n\n' +
          '**Vi skal ta en analyse av innholdet ja. Men hvorfor løy du?**\n\n' +
          '«Det ser jo forferdelig ut hvis jeg har skjeftet henne til døden. Når jeg kom inn ' +
          'og så henne kollapset var jeg kjemperedd. Mitt forrige vitneutsagn var sent på ' +
          'natten, jeg var sliten, hadde drukket og var allerede stresset til valg. Jeg mente ' +
          'ingenting vondt.»\n\n' +
          '**Så du noe som kunne vært et mordvåpen da i løpet av kvelden?**\n\n' +
          '«Mordvåpen? Nei hun kollapset jo bare da — hva mener du med mordvåpen?»\n\n' +
          '**Ja alt blodet? Det må da være forårsaket av et mordvåpen?**\n\n' +
          '«Det var ikke noe blod når jeg fant Angela kollapset...»',
      },
    },

    {
      day: 3,
      title: 'Dag 3',
      intro: 'Det siste beviset. Nå må du bestemme deg.',
      folders: [
        {
          id: 'pia-kamera',
          title: 'Pias kamerabilder',
          icon: '📷',
          tint: '#ffe4cc',
          intro:
            'Minnekortet fra Pias kamera er ferdig overført. Kameraet er et annet apparat enn ' +
            'mobilen hennes.',
        },
      ],
      docs: [
        // --- Pias KAMERABILDER (Moldova-tid). Moldova-bildene er tatt i Moldova, så
        //     der er klokka riktig; Norge-bildene ligger én time for sent. De tre
        //     ★-motivene finnes også i mobilmappen på DAG 2 — én times forskjell,
        //     samme sekund. Det er tidssone-sporet.
        {
          id: 'd3-pia-k1',
          title: 'IMG_20260728_201235.jpg', // folkedrakt i solnedgang
          kind: 'image',
          folder: 'pia-kamera',
          src: 'case/dag2/pia/Moldova4.jpg',
        },
        {
          id: 'd3-pia-k2',
          title: 'IMG_20260729_132408.jpg', // EU-flagg, midt på dagen
          kind: 'image',
          folder: 'pia-kamera',
          src: 'case/dag2/pia/Moldova3.jpg',
        },
        {
          id: 'd3-pia-k3',
          title: 'IMG_20260729_200317.jpg', // Chișinău ovenfra, gyllen time
          kind: 'image',
          folder: 'pia-kamera',
          src: 'case/dag2/pia/Moldova1.jpg',
        },
        {
          id: 'd3-pia-k4',
          title: 'IMG_20260729_211842.jpg', // jernbanestasjonen, blå time
          kind: 'image',
          folder: 'pia-kamera',
          src: 'case/dag2/pia/Moldova2.jpg',
        },
        {
          // ★ samme fil som mobilens (dag 2) IMG_20260731_104612.jpg
          id: 'd3-pia-k5',
          title: 'IMG_20260731_114612.jpg', // Sørmarka over vannet
          kind: 'image',
          folder: 'pia-kamera',
          src: 'case/dag2/pia/sørmarka.jpg',
        },
        {
          id: 'd3-pia-k6',
          title: 'IMG_20260731_150318.jpg', // hotellkorridoren
          kind: 'image',
          folder: 'pia-kamera',
          src: 'case/dag2/pia/hotelcorridor.jpg',
        },
        {
          // ★ samme fil som mobilens (dag 2) IMG_20260801_193045.jpg
          id: 'd3-pia-k7',
          title: 'IMG_20260801_203045.jpg', // bankettsalen
          kind: 'image',
          folder: 'pia-kamera',
          src: 'case/dag2/pia/sørmarlka3.jpg',
        },
        {
          // ★ samme fil som mobilens (dag 2) IMG_20260801_205512.jpg
          id: 'd3-pia-k8',
          title: 'IMG_20260801_215512.jpg', // gjengen
          kind: 'image',
          folder: 'pia-kamera',
          src: 'case/dag2/pia/people1.jpg',
        },
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
        options: [...SUSPECT_OPTIONS, { id: 'annet', label: 'Annet (skriv selv)' }],
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
      caption:
        '🌸Bli kjent med studentpresten Jofrid🌸\n\nJofrid er studentprest for Danmark, Tyskland, Nederland, Luxembourg, Østerrriket, Sverige, Sveits, Italia, Frankrike og Belgia🌎\n\nHun er her for studentene, enten du ønsker støtte eller en samtale om stort og smått i studenthverdagen🤩\n\nFølg henne gjerne på Instagram og ta kontakt dersom du trenger noen å prate med🥰',
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
      caption:
        '💜Det nye styret er klart!💜\n\nBli kjent med den nye gjengen med å høre deres beste tips om favorittbyen, og ei litta fun fact🔥\n\nGled dere til året som kommer; Det blir bra!🤩',
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
    // ---- Dag 2-drypp: annonser og gratulasjoner (vises når dag 2 er åpen) ----
    {
      id: 'li-d2-nso',
      author: 'Norsk studentorganisasjon (NSO)',
      authorTitle: 'Organisasjon · 14 032 følgere',
      day: 2,
      text:
        'Vi i NSO vil gratulere våre gode venner i ANSA med gjennomført generalforsamling ' +
        'nummer 70! 70 år med innsats for norske studenter i utlandet er hvertfall ikke noe ' +
        'å kimse av. Vi hører det har vært en temmelig begivenhetsrik helg — stå på videre! 🎉',
      likes: 214,
      comments: 12,
      postedLabel: '2 t',
    },
    {
      id: 'li-d2-sormarka',
      author: 'Sørmarka konferansehotell',
      authorTitle: 'Hotell · 1 204 følgere',
      day: 2,
      text:
        'Takk til ANSA som valgte oss for GF70! Det ble såklart en helg vi sent vil glemme. ' +
        'Vi minner forøvrig gjester om at nattbading skjer på eget ansvar. 🏊',
      likes: 67,
      comments: 23,
      postedLabel: '5 t',
    },
    {
      id: 'li-d2-vanish',
      author: 'Vanish Norge',
      authorTitle: 'Annonse · Sponset',
      day: 2,
      text:
        'Rødvin på den fineste skjorta di?? Det går helt fint. Vanish Oxi Action fjerner ' +
        'selv de verste flekkene — nesten uansett hva det er. 💪',
      likes: 8,
      comments: 1,
      postedLabel: 'Sponset',
    },
    {
      // Karakterisering, IKKE bevis: ingen tall som kan kobles mot
      // partnerkonto-tallene i Checkin-rapporten (det ville løst saken på dag 2).
      id: 'li-d2-sverre',
      author: 'Studentprest Sverre',
      authorTitle: 'Studentprest · Vinylvrenger',
      day: 2,
      text:
        'Pubquiz i Amsterdam er i boks! 🎉 Tusen takk til alle som kom — og til ANSA for at ' +
        'eg får reise rundt og gjere dette. Neste stopp: GF70. Nokon som vil ha ein til der?? 🤷',
      likes: 5140,
      comments: 88,
    },
    {
      id: 'li-d2-ansa-toulouse',
      author: 'ANSA',
      authorTitle: 'Association of Norwegian Students Abroad',
      day: 2,
      text:
        'Gratulerer til ANSA Toulouse som feide inn Årets lokallag på GF70! 🏆 Juryen var ' +
        'hvertfall ikke i tvil. Neste år kan det være DEG — søk verv da vel!',
      likes: 189,
      comments: 41,
    },
    {
      id: 'li-d2-checkin',
      author: 'Checkin',
      authorTitle: 'Annonse · Billettering for organisasjoner',
      day: 2,
      text:
        'Arrangerer du noe? Stort eller smått — Checkin gjør billettsalg nokså enkelt for ' +
        'studentorganisasjoner i hele Europa. Ingen skjulte kostnader, lover! 😇 Spør oss om ' +
        'partnerprogrammet — det lønner seg. 💸',
      likes: 6,
      comments: 0,
      postedLabel: 'Sponset',
    },
    {
      id: 'li1',
      author: 'Angela Liu',
      authorTitle: 'Prosjektleder · ANSA',
      text: 'Stolt over å annonsere at vi lanserer et nytt prosjekt. Mer info kommer snart! 🚀 #nyestart #karriere #stolt',
      img: 'case/linkedin/engineers.jpg',
      likes: 214,
      comments: 31,
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
      id: 'andreas',
      name: 'Andreas',
      role: '\"ANSA Brasil\"',
      status: 'ukjent',
      // 8-bit-portrett (tegnet for hånd — palett + piksel-grid, se PixelPortraitData)
      pixel: {
        palette: {
          _: '#b9c8d2', // bakgrunn (glassfasade)
          d: '#6e5233', // hår, mørkt (sider/skygge)
          h: '#8a6a45', // hår
          H: '#a98c5f', // hår, lyst (topp/tufser)
          s: '#eec39a', // hud
          S: '#d8a67c', // hud, skygge
          e: '#3a4a56', // øyne (gråblå)
          m: '#b06a52', // munn
          w: '#e8eef6', // skjorte, lys blå-hvit
          W: '#c6d4e6', // skjorte, skygge
          n: '#2a3550', // genser, marineblå
          N: '#1d2538', // genser, mørk skygge
        },
        rows: [
          '________HhH_Hh__________',
          '______HhhHhhhHhH________',
          '____HhhhhhHhhhhhHh______',
          '___HhhhhhhhhhhhhhhhH____',
          '__HhhhhhhhhhhhhhhhhhhH__',
          '__dhhhhhhhhhhhhhhhhhhd__',
          '__dhhhhhhhhhhhhhhhhhhd__',
          '__dhhhhHhhhhhhhhhhhhhd__',
          '__dhhhhsshhssssshhhhhd__',
          '__dhhssssssssssssshhd___',
          '__dhsssshhssshhsssshd___',
          '__dhsssseessseesssshd___',
          '__dhssssssSsssssssshd___',
          '__dhsssssSSsssssssshd___',
          '___dsssssmmmSsssssd_____',
          '____dssssssssssssd______',
          '_____Sssssssssssd_______',
          '________SssssS__________',
          '______ww_ssss_ww________',
          '__nnnnwwWssssWwwnnnn____',
          '_nnnnnnwWwwwwWwnnnnnnn__',
          'nnnnnnnnwWWwnnnnnnnnnn__',
          'nnnnnnnnnwWwnnnnnnnnnnn_',
          'NnnnnnnnnnWnnnnnnnnnnnN_',
        ],
      },
    },
    {
      id: 'maud',
      name: 'Maud',
      role: 'President i ANSA',
      status: 'ukjent',
      pixel: {
        palette: {
          _: '#7ba06f', // bakgrunn (grønt løvverk)
          d: '#a06334', // hår, mørkt (skygge)
          h: '#c9884a', // hår, rødblond
          H: '#e0aa6e', // hår, lyst (topp)
          s: '#f2c8a2', // hud
          S: '#d9a87e', // hud, skygge
          e: '#4a5d55', // øyne (grågrønne)
          m: '#c27661', // munn
          w: '#f0efe9', // hvit t-skjorte
          k: '#26262b', // jakke, svart
          K: '#17171b', // jakke, mørk skygge
          z: '#8f939d', // glidelås
        },
        rows: [
          '________hHHHHh__________',
          '______hHHHHHHHHh________',
          '_____hHhhhhdhhHHh_______',
          '____hhhhhhhdhhhhHh______',
          '___dhhhhhhhhdhhhhhh_____',
          '___dhhhssssssssshhhh____',
          '__dhhhssssssssssshhhd___',
          '__dhhhsshhsssshhshhhd___',
          '__dhhhsseesssseeshhhd___',
          '__dhhhsssssSssssshhhd___',
          '__dhhhssssSSssssshhhd___',
          '__dhhhsssmmmSsssshhhd___',
          '__dhhhhSsssssssShhhhd___',
          '__dhhhhhSssssShhhhhd____',
          '_dhhhhhhssssshhhhhhd____',
          '_dhhhhhhssssshhhhhhd____',
          '_dhhhhhhkwwwwkhhhhhd____',
          '_dhhhhhkkkwwwkkkhhhhd___',
          '__dhhhhkkkwzwkkkhhhd____',
          '_Kkkkkkkkkwzwkkkkkkkkk__',
          'Kkkkkkkkkkkzkkkkkkkkkkk_',
          'Kkkkkkkkkkkzkkkkkkkkkkk_',
          'KKkkkkkkkkkzkkkkkkkkkKK_',
          'KKkkkkkkkkkzkkkkkkkkkKK_',
        ],
      },
    },
    {
      id: 'erik',
      name: 'Erik',
      role: 'ANSA Tyskland Sør',
      status: 'ukjent',
      pixel: {
        palette: {
          _: '#e8b4c8', // bakgrunn (kirsebærrosa, solid)
          d: '#8a6b42', // hår, mørkt
          h: '#a8874f', // hår
          H: '#c9a869', // hår, lyst
          s: '#eec49c', // hud
          S: '#d8a87c', // hud, skygge
          e: '#3f4a52', // øyne
          m: '#b06a52', // munn (bredt smil)
          g: '#4a3524', // brilleinnfatning (skilpaddemønster)
          w: '#efe9dc', // kremhvit strikkegenser
          n: '#2b3245', // blazer, marineblå
          N: '#1c2233', // blazer, mørk skygge
          z: '#8b8f99', // glidelås
        },
        rows: [
          '________________________',
          '________________________',
          '________________________',
          '________hhhhhhh_________',
          '______hHHhhhhHhhh_______',
          '_____hhHhhhhhhhhhh______',
          '____dhhhhhhhhhhhhhd_____',
          '____dhhhHhhhhhhhhhd_____',
          '____dhhhhhhhhhhhshd_____',
          '____dhsgggggggggshd_____',
          '____dsggsegsgesggsd_____',
          '____dSsggggsggggsSd_____',
          '_____SsssssSsssssS______',
          '_____SsssmmmmmsssS______',
          '______SsssssssS_________',
          '________SssssS__________',
          '_______wwwwzwwww________',
          '____nnwwwwwzwwwwwnn_____',
          '__nnnnnwwwwzwwwnnnnn____',
          '_nnnnnnwwwwzwwwnnnnnn___',
          'nnnnnnnwwwwzwwwnnnnnnnn_',
          'Nnnnnnnnwwwzwwwnnnnnnnnn',
          'NNnnnnnnwwwzwwnnnnnnnnNN',
          'NNnnnnnnwwwzwwnnnnnnnnNN',
        ],
      },
    },
    {
      id: 'oskar',
      name: 'Oskar',
      role: 'ANSA Toulouse',
      status: 'ukjent',
      pixel: {
        palette: {
          _: '#d9cfc0', // bakgrunn (varm beige vegg)
          d: '#7a5c38', // hår, mørkt
          h: '#9a7a4c', // hår
          H: '#bd9c64', // hår, lyst (sveipen)
          s: '#eec49c', // hud
          S: '#d8a87c', // hud, skygge
          e: '#4a5a68', // øyne (blågrå)
          m: '#b06a52', // munn
          f: '#c8a97a', // skjeggstubb/fippskjegg (sandfarget)
          w: '#f2f4f6', // skjorte, hvit
          t: '#7e2634', // slips, burgunder
          j: '#6b6f6e', // blazer, grå tweed
          J: '#54585a', // blazer, mørk (jakkeslag)
          l: '#8a8e8c', // tweed-prikker
        },
        rows: [
          '________________________',
          '________________________',
          '_______hHhh_____________',
          '____hhhhhHhhhhhh________',
          '___dhhhhhhHHhhhhhh______',
          '___dhhhhhhhhHHhhhhh_____',
          '__dhhhhhhhhhhhHhhhhd____',
          '__dhhhhhhhhssssssshd____',
          '__dhhhsssssssssssshd____',
          '__dhhsshhsssshhssshd____',
          '__dhhsseesssseessshd____',
          '__dhhssssssSsssssshd____',
          '__dhhssssffffssssshd____',
          '_____ssssSmmmSssss______',
          '______SsssffffssS_______',
          '_______SsssssS__________',
          '________Sssss___________',
          '_____wwSssssSww_________',
          '__jjjJwwwtttwwwJjjj_____',
          '_jjljjJwwtttwwJjjljj____',
          'jjjjljjJwtttwJjjjljjj___',
          'jjljjjjjJtttJjjjjjljjj__',
          'Jjjjjljjjjttjjjjjljjjjj_',
          'JJjjjjjljjttjjjjjljjJJ__',
        ],
      },
    },
    {
      id: 'runill',
      name: 'Runill',
      role: 'Sosialveileder',
      status: 'ukjent',
      pixel: {
        palette: {
          _: '#a48fc9', // bakgrunn (lavendel, solid)
          d: '#7d5c3a', // hår, mørkt (midtskill/skygge)
          h: '#9c7a4e', // hår
          H: '#c09a62', // hår, lyst
          s: '#f0c8a2', // hud
          S: '#dcac82', // hud, skygge
          e: '#4a6f92', // øyne (blå)
          m: '#b5644f', // lepper
          T: '#f6f1e6', // tenner (bredt smil)
          w: '#f6f0e3', // blondebluse, kremhvit
          W: '#ded2b8', // bluse, skygge/blonder/knapper
        },
        rows: [
          '________________________',
          '________________________',
          '________hhdhh___________',
          '______hhhHdhHhhh________',
          '_____hhhhhdhhhhhh_______',
          '____dhhhhsssshhhhd______',
          '_____dhsssssssssshd_____',
          '_____dhshhsssshhshd_____',
          '_____dhseessseesshd_____',
          '_____dhssssSssssshd_____',
          '____hdhssssSSsssshdh____',
          '____hdhssmTTTmssshdh____',
          '____hdhsssssssssshdh____',
          '_____dSssssssSd_________',
          '________SssssS__________',
          '______wWwWwWwWwWw_______',
          '____wwwWwwwwwWwwwww_____',
          '__wWwwwwWwwWwwWwwwwWw___',
          '_wWwwwwWwwwWwwwWwwwWww__',
          'wwWwwwwWwwwWwwwWwwwwWww_',
          'WwwwWwwwwwwWwwwwwWwwwWww',
          'wwwwwwWwwwwWwwwWwwwwwwww',
          'WwWwwwwwwwwWwwwwwwwwWwWw',
          'wwwwWwwwwwwWwwwwwwWwwwww',
        ],
      },
    },
    {
      id: 'hedvig',
      name: 'Hedvig',
      role: 'ANSA Madrid',
      status: 'ukjent',
      pixel: {
        palette: {
          _: '#4f9a94', // bakgrunn (teal, solid)
          d: '#4e3a28', // hår, mørkt brunt
          h: '#6a5138', // hår
          s: '#f0c49e', // hud
          S: '#d9a87a', // hud, skygge
          f: '#cf9a6e', // fregner
          e: '#5a7488', // øyne (blågrå)
          m: '#b5644f', // munn
          g: '#c9a24a', // gullsmykke
          k: '#c14e2a', // genser, rødoransje
          K: '#9c3a1e', // genser, mørk (ribb)
          p: '#e5ded0', // strikkemønster, hvitt
        },
        rows: [
          '________________________',
          '________hhh_____________',
          '______hhhhhhhh__________',
          '_____hhhhhhhhhhh________',
          '____dhhhhhhhhhhhh_______',
          '____dhssssssssssshd_____',
          '____dhssssssssssshd_____',
          '____dhsdddsssdddshd_____',
          '____dhsseessseesshd_____',
          '___hdhsfsssSsssfshd_____',
          '___hdhsfssSSsssfshd_____',
          '____dhssSmmmmSssshd_____',
          '_____dSsssssssSd________',
          '______SssssssS__________',
          '________SssssS__________',
          '_______gssssg___________',
          '____KKKKKKgKKKKKK_______',
          '___kpkpkpkpkpkpkpk______',
          '__kkpkkkpkkkpkkkpkk_____',
          '_kppkppkppkppkppkppkp___',
          'kkkkkkkkkkkkkkkkkkkkkkkk',
          'kkpkkkkpkkkkpkkkkpkkkkpk',
          'kkkkkkkkkkkkkkkkkkkkkkkk',
          'KkkkkkkkkkkkkkkkkkkkkkkK',
        ],
      },
    },
    {
      id: 'ane',
      name: 'Ane',
      role: 'ANSA Irland',
      status: 'ukjent',
      pixel: {
        palette: {
          _: '#e07a5f', // bakgrunn (korall, solid)
          d: '#a87f45', // hår, mørk blond (midtskill/skygge)
          h: '#d4ab62', // hår, blond
          H: '#e8c987', // hår, lys blond
          s: '#f2c8a0', // hud
          S: '#dcaa7e', // hud, skygge
          e: '#4f7396', // øyne (blå)
          m: '#c26557', // lepper
          T: '#f6f1e8', // tenner (stort smil)
          b: '#9db8e2', // bluse, lyseblå
          B: '#7e9cc9', // bluse, skygge/krage
          w: '#f0f2f5', // knapper, hvite
        },
        rows: [
          '________________________',
          '________________________',
          '________hhdhh___________',
          '______hhhHdHhhhh________',
          '_____hhhhhdhhhhhh_______',
          '____dhhhhsssshhhhd______',
          '_____dhsssssssssshd_____',
          '_____dhsddssssddshd_____',
          '_____dhseessseesshd_____',
          '_____dhssssSssssshd_____',
          '____hdhssssSSsssshdh____',
          '____hdhsssTTTTssshdh____',
          '____hdhsssssssssshdh____',
          '_____dSssssssSd_________',
          '________SssssS__________',
          '________SssssS__________',
          '____bbssssssssssbb______',
          '___bbbbBssssssBbbbb_____',
          '__bbbbbbBssssBbbbbbb____',
          '_bbbbbbbbBssBbbbbbbbb___',
          'bbbbbbbbbBwBbbbbbbbbbb__',
          'bbbbbbbbbbwbbbbbbbbbbb__',
          'Bbbbbbbbbbwbbbbbbbbbbb__',
          'BBbbbbbbbbwbbbbbbbbbBB__',
        ],
      },
    },
    {
      id: 'sverre',
      name: 'Sverre',
      role: 'Studentprest',
      status: 'ukjent',
      pixel: {
        palette: {
          _: '#e8e4dc', // bakgrunn (lys vegg)
          h: '#8a7a5e', // hår, gråbrunt (tynt på toppen)
          d: '#6e6048', // hår/bryn, mørkt
          s: '#eec09a', // hud
          S: '#d8a276', // hud, skygge
          e: '#4f7396', // øyne (blå)
          b: '#93836a', // skjegg, gråmelert
          B: '#77684f', // skjegg, mørkt
          T: '#f6f1e6', // tenner (bredt smil)
          w: '#f2f2ec', // skjorte, hvit
          W: '#d8d8cc', // knapper/skygge
          v: '#b8d4b0', // rutemønster, grønt
          c: '#b0c4d8', // rutemønster, blått
        },
        rows: [
          '________________________',
          '________________________',
          '_________hh_h___________',
          '______hssssssssh________',
          '_____hhssssssssshh______',
          '____hhssssssssssshh_____',
          '____hhssssssssssshh_____',
          '___dhhssssssssssshhd____',
          '___dhhssddsssddsshhd____',
          '___dhhsseessseesshhd____',
          '___dhbssssSSsssssbhd____',
          '___dhbsbBBBBBBBbsbhd____',
          '___dhbbbBTTTTTBbbbhd____',
          '___dhbbbbbBBBbbbbbhd____',
          '____hbbbbBBBbbbbh_______',
          '______bbbBBBbbb_________',
          '________SsssS___________',
          '_____wwSsssSww__________',
          '__wwvwwwSssSwwvwww______',
          '_wwwvwwwwSswwwwvwwww____',
          '_ccccccccccWcccccccccc__',
          'wwwvwwwwwwwWwwwwvwwwwww_',
          'cccccccccccWccccccccccc_',
          'wwvwwwwwwwwWwwwwwvwwwww_',
        ],
      },
    },
    {
      id: 'anna',
      name: 'Anna',
      role: 'ANSA Danmark',
      status: 'ukjent',
      pixel: {
        palette: {
          _: '#7d8490', // bakgrunn (gråblå studiovegg)
          d: '#241d18', // hår, mørkest (midtskill) + bryn
          h: '#3a2f26', // hår, mørkebrunt
          s: '#edc19b', // hud
          S: '#d6a276', // hud, skygge
          e: '#5e4028', // øyne (brune)
          m: '#c08573', // lepper (lukket, dempet rosa)
          g: '#c9a24a', // gullringer (øredobber)
          P: '#f2efe8', // perler
          n: '#c8ccd2', // sølvkjede
          k: '#1d1d20', // bluse, svart
          K: '#2e2e33', // bluse, tekstur
        },
        rows: [
          '________________________',
          '________hhdhh___________',
          '______hhhhdhhhh_________',
          '_____hhhhhdhhhhhh_______',
          '____hhhhhssshhhhhh______',
          '___hhhhssssssshhhhh_____',
          '___hhhhsssssssssshhhh___',
          '___hhhhsdddssdddshhhh___',
          '___hhhhseessseesshhhh___',
          '___hhhhssssSSsssshhhh___',
          '___hhhgssssSSssssghhh___',
          '___hhhPssssSsssssPhhh___',
          '___hhhhsssmmmmssshhhh___',
          '___hhhhSssssssssShhhh___',
          '____hhhhSssssssShhhh____',
          '____hhhhhSssssShhhhh____',
          '____hhhhhnssssnhhhhh____',
          '____hhhkkkSssSkkkhhh____',
          '___hhhkkkksnnskkkkhhh___',
          '___hhhkkkkkkkkkkkkhhh___',
          '__hhhkkkkkKkkkkkkkkhh___',
          '__hhkkkkkkkkkkKkkkkkhh__',
          '__hhkkkKkkkkkkkkkkkkhh__',
          '_hhkkkkkkkkkKkkkkkkkkhh_',
        ],
      },
    },
    {
      id: 'pia',
      name: 'Pia',
      role: 'ANSA Sør-Korea',
      status: 'ukjent',
      pixel: {
        palette: {
          _: '#e2b13c', // bakgrunn (gyllen, solid)
          d: '#4e3a2a', // hår, mørkt (midtskill)
          h: '#6e5138', // hår, brunt
          H: '#a5825a', // hår, lyse tupper (balayage)
          s: '#f0c6a0', // hud
          S: '#dcaa80', // hud, skygge
          e: '#5f7568', // øyne (grågrønne)
          m: '#c67a6e', // lepper (mykt smil)
          g: '#c9a24a', // øredobber
          k: '#1f1f22', // skjorte, svart
          K: '#303036', // skjorte, knapper/tekstur
        },
        rows: [
          '________________________',
          '________________________',
          '_______hhdhh____________',
          '_____hhhhdhhhhh_________',
          '____hhhhhdhhhhhh________',
          '___hhhhhsssshhhhhh______',
          '__hhhhhsssssssssshhhhh__',
          '__hhhhhsddsssddsshhhhh__',
          '__hhhhhseessseesshhhhh__',
          '__hhhhhssssSSsssshhhhh__',
          '__hhhhgssssSSssssghhhh__',
          '__hhhhhssSmmmmSsshhhhh__',
          '__hhhhhSssssssssShhhhh__',
          '__hhhhhhSssssssShhhhhh__',
          '__hhhhhhhSssssShhhhhhh__',
          '__hhhhhhhkSssSkhhhhhhh__',
          '_hhhhhhhkkksskkkhhhhhhh_',
          '_hhhhhhkkkkKkkkkhhhhhhh_',
          'hHhhhhhkkkkKkkkkhhhhhHhh',
          'HhhHhhhkkkkkkkkkhhHhhHhH',
          'HhHhhHhkkkkKkkkkHhhHhHHh',
          'HHhHhHhkkkkkkkkkhHhHHHHH',
          'HHHhHHhkkkkKkkkkHhHHHHHH',
          'HHHHHHhkkkkkkkkkHHHHHHHH',
        ],
      },
    },
  ],

  // Koden til Angelas mobil — plant den som et spor i dokumentene
  // (f.eks. en dato: 25.03).
  phonePin: '2503',

  // Angelas egne filer (låst mobil). Ren eksempeldata — bytt ut med ekte
  // innhold. Tekst kan skrives inline; bilder legges i public/case/angela/.
  // Filene på Angelas mobil. Bevisst ufarlige — de gir farge og småting å lese,
  // men ingen av dem endrer tidslinjen eller peker på noen. Flere av dem plukker
  // opp tråder fra Slack (stolene, programversjonene, kvitteringene, CIV VII).
  angelaFiles: [
    {
      id: 'a-huskeliste',
      title: 'Huskeliste GF70',
      kind: 'markdown',
      inline:
        '### Huskeliste GF70 📝\n\n' +
        '- [x] Bordplassering — versjon 4. IKKE versjon 3.\n' +
        '- [x] Navneskilt. Brage får nytt, hans sa «Bryne Johsen» to år på rad\n' +
        '- [x] Duker. Litt for korte. Ingen kommer til å merke det\n' +
        '- [ ] Servietter: mintgrønne. Noen kommer helt sikkert til å merke det\n' +
        '- [ ] Høre om mikrofon 2 har sluttet å knase\n' +
        '- [ ] Batteri til klokka jeg gav toastmasteren\n' +
        '- [ ] Fjorten vanlige stoler. Fjorten. Det er alt de har.\n' +
        '- [ ] Spørre om kaffemaskinen i 2. etasje er ødelagt eller bare tom hele tiden\n' +
        '- [ ] Puste\n',
    },
    {
      id: 'a-romfordeling',
      title: 'Romfordeling GF70',
      kind: 'markdown',
      inline:
        '```\n' +
        'ANSA — GENERALFORSAMLING 70\n' +
        'Romfordeling, Hotell Bjørnstad\n' +
        'Oppdatert 30.07.2026 — v3\n' +
        'Kontakt ved endringer:\n' +
        'Angela Liu (prosjektansvarlig)\n' +
        '```\n\n' +
        '| Rom | Navn | Merknad |\n' +
        '| --- | --- | --- |\n' +
        '| 104 | Brage Flønæs Johnsen | |\n' +
        '| 107 | _ANSA Benelux (2)_ | dobbeltrom |\n' +
        '| 112 | Wiktor Jankowski | |\n' +
        '| 118 | Henriette Moe Schjelderup | |\n' +
        '| 120 | _ANSA Benelux (2)_ | dobbeltrom |\n' +
        '| 203 | Ane | |\n' +
        '| 206 | _ANSA Benelux (2)_ | dobbeltrom |\n' +
        '| 209 | Hedvig | |\n' +
        '| 213 | Andreas Holmsen | |\n' +
        '| 215 | _ANSA Benelux (2)_ | dobbeltrom |\n' +
        '| 221 | Anna | |\n' +
        '| 224 | Pia | ~~208~~ flyttet, se merknad |\n' +
        '| 305 | Erik | |\n' +
        '| 308 | _ANSA Benelux (2)_ | dobbeltrom |\n' +
        '| 311 | Runill | nær beredskapsrom |\n' +
        '| 316 | Oskar Orvik | |\n' +
        '| 318 | Angela Liu | |\n' +
        '| 319 | _delegat, ANSA Tyskland_ | |\n' +
        '| 322 | Maud Alfstad Bjørum | |\n' +
        '| 327 | Sverre | ankom sent, tildelt ved innsjekk |\n' +
        '| 404 | _delegat, ANSA Spania_ | |\n' +
        '| 410 | _ANSA Benelux (2)_ | dobbeltrom |\n\n' +
        '**MERKNADER**\n\n' +
        '- 224: flyttet fra 208 grunnet vannlekkasje 30.07.\n' +
        '- Sone A = 1. etasje, sone B = 2. etasje, sone C = 3.–4. etasje.\n' +
        '- Nøkkelkort deaktiveres automatisk lør 01.08 kl. 12:00.\n\n' +
        '_Hvis noen spør om å bytte rom én gang til, si nei. Jeg har sagt ja fire ganger._',
    },
    {
      id: 'a-tale',
      title: 'Åpningstale (utkast 4)',
      kind: 'markdown',
      inline:
        '## Åpningstale — utkast 4\n\n' +
        '«Kjære alle sammen, og velkommen til ANSAs 70. generalforsamling.»\n\n' +
        '~~«Det er en stor ære å stå her.»~~ for stivt\n\n' +
        '~~«Oi, mange folk!»~~ for lite stivt\n\n' +
        '«Sytti år. Sytti år med studenter som reiser ut, roter det litt til, finner ut av det, ' +
        'og kommer hjem med noe de ikke hadde da de dro.»\n\n' +
        'Her et sted: si at vi er rundt 100, og at halvparten ikke kjenner hverandre ennå. Det ' +
        'gjør de innen lørdag. Det gjør de alltid.\n\n' +
        '~~Vits om kylling og ris?~~ **JA.** Behold vitsen om kylling og ris.\n\n' +
        'Avslutning: «Vi har tre dager. Bruk dem godt, vær greie med hverandre, og les ' +
        'sakspapirene.»\n\n' +
        '_Ingen kommer til å lese sakspapirene._\n\n' +
        '**Skal vare 4 min. Sist jeg øvde brukte jeg 11.**',
    },
    {
      id: 'a-dumplings',
      title: 'Mormors dumplings',
      kind: 'markdown',
      inline:
        '### Mormors dumplings 🥟\n\n' +
        '**Deig**\n\n' +
        '- 300 g hvetemel\n' +
        '- 1,5 dl lunkent vann, litt om litt\n' +
        '- 1 klype salt\n\n' +
        '**Fyll**\n\n' +
        '- 400 g kvernet svinekjøtt\n' +
        '- 1/4 kinakål, finhakket og saltet i 10 min — klem ut vannet. IKKE hopp over dette.\n' +
        '- 3 vårløk\n' +
        '- 1 ss revet ingefær\n' +
        '- 2 fedd hvitløk\n' +
        '- 2 ss soyasaus, 1 ts sesamolje, 1 ts sukker, hvit pepper\n\n' +
        'Elt deigen glatt, hvil 30 min under et fuktig kjøkkenhåndkle. Rull ut tynne runde ' +
        'plater. Skje fyll i midten, fukt kanten, brett og klyp.\n\n' +
        'Kok 6–8 min til de flyter, eller stek dem i panna med litt vann under lokk hvis du vil ' +
        'ha sprø bunn.\n\n' +
        '_Mormor lager fjorten fine folder på hver. Mine ser ut som små poser. Hun sier det ' +
        'ikke betyr noe så lenge de ikke åpner seg i vannet._\n\n' +
        '_Mine åpner seg i vannet._',
    },
    {
      id: 'a-civ',
      title: 'CIV VII – resultatliste',
      kind: 'markdown',
      inline:
        '### CIV VII — den evige turneringen 🏆\n\n' +
        'Jeg fører denne fordi ingen andre gjør det, og fordi Andreas påstår ting.\n\n' +
        '- **Wiktor — 9 seire.** Sier ingenting. Vinner bare.\n' +
        '- **Oskar — 4 seire.** Skjønner fortsatt ikke hvorfor man bytter civ mellom tidsaldre. ' +
        'Har spilt 200 timer.\n' +
        '- **Aleksander — 3 seire.** Satser alltid på kultur. Taper alltid på kultur.\n' +
        '- **Brage — 2 seire.** Spiller mest for å være sosial. Respekt for det.\n' +
        '- **Andreas — 1 seier.** Hevder seks.\n\n' +
        'Lengste parti: sju timer. Andreas «hadde et tog».',
    },
    {
      id: 'a-nynorsk',
      title: 'Nynorskord',
      kind: 'markdown',
      inline:
        '### Nynorskord 🇳🇴\n\n' +
        'Erik retter meg hver eneste gang. Nå lærer jeg dem, og så bruker jeg dem tilbake på ham.\n\n' +
        '- **kvifor** — hvorfor\n' +
        '- **korleis** — hvordan\n' +
        '- **hugs** — husk\n' +
        '- **røynsle** — erfaring\n' +
        '- **framlegg** — forslag\n' +
        '- **føresegn** — bestemmelse\n' +
        '- **jamvel** — til og med\n\n' +
        'Mål: én hel setning på nynorsk før helgen er over. Uten å google underveis.',
    },
    {
      id: 'a-kvitteringer',
      title: 'Kvitteringer (todo)',
      kind: 'markdown',
      inline:
        '### Kvitteringer jeg ikke har levert\n\n' +
        'Lorenz spør. Lorenz har spurt tre ganger. Lorenz kommer til å spørre igjen.\n\n' +
        '- Tog Toulouse–Paris: ligger i en konvolutt\n' +
        '- Fly Paris–Oslo: ligger i en annen konvolutt\n' +
        '- Taxi: finnes ikke lenger. Den er borte. Jeg har lett overalt.\n' +
        '- Lunsj på flyplassen: 189 kr for en focaccia. Jeg vil ikke snakke om det.\n' +
        '- Bagasje: ???\n\n' +
        'Det holder med bilde av kvitteringen. Det har jeg visst i tre år, og glemmer hvert år.',
    },
    {
      id: 'a-neste-gf',
      title: 'Til neste GF',
      kind: 'markdown',
      inline:
        '### Til neste GF — les dette, Angela\n\n' +
        'Skrevet nå mens jeg fortsatt husker hvorfor.\n\n' +
        '1. Bestill flere vanlige stoler. Fjorten er ikke nok. Det var ikke nok i fjor heller.\n' +
        '2. Lag ÉN versjon av programmet. Kall den «PROGRAM». Ikke ' +
        '«programmet_ferdig_FERDIG».\n' +
        '3. Wifi-passordet må kunne skrives inn av et menneske på første forsøk.\n' +
        '4. Sett av tid til å spise. Faktisk tid. I kalenderen. Som et møte.\n' +
        '5. Kaffemaskinen i 2. etasje er ikke vennen vår.\n' +
        '6. Si ja til pub quiz. Folk spør hvert år, svaret er alltid nei, og de fortsetter å ' +
        'spørre. Bare si ja neste gang.\n',
    },
    {
      id: 'a-melding-sverre',
      title: 'Sverre melding',
      kind: 'markdown',
      inline:
        '### Sverre melding\n\n' +
        'kjære Sverre, jeg har sett en del i økonomisystemene og sett at dine pubquizzer er veldig \n\n' +
        'Mvh, Angela',
    },
    {
      id: 'a-notat-maia',
      title: 'Maia notat',
      kind: 'markdown',
      inline: 'HUSK: Maia snitchet i fysikktimen til Svetlana!!!',
    },
  ],

  // Apper på Angelas mobil. Tilgjengelige triks (se typene over): slettet
  // melding (`deleted`), uleste (badge, `unread`), dag-gating (`day: N`),
  // hover-påskeegg, e-postutkast, vedlegg, «(redigert)» og «Sett av» i Slack.
  angelaPhone: {
    // Appene «hackes opp» utover i spillet: Slack fra dag 1, e-post fra dag 2,
    // WhatsApp (det mest private) fra dag 3. Låste apper vises med 🔒 + dag.
    appDays: { slack: 1, email: 2, whatsapp: 3 },
    whatsappHackWord: 'gigachad',
    whatsapp: [
      {
        id: 'wa-erik',
        name: 'Erik',
        suspectId: 'erik',
        subtitle: 'sist sett i dag 11:52',
        messages: [
          {
            from: 'them',
            text:
              'Beklager sent svar på slack meldingen! Jeg har lest igjennom hele ordboka og ' +
              'dette er hva jeg fant: "Leiing" er faktisk lovleg bokmål. Radikalt, men lovleg ' +
              '— sjå Bokmålsordboka. Så eg skjønar ikkje heilt kva du meiner eg har gjort. ' +
              'Det som er rart er at §55 under seier "ledelse" to gonger, og at overskrifta ' +
              'lenger nede seier "Møteledelse". Nokon har endra eitt ord og gløymt resten. ' +
              'Ikkje eg. Fint at nokon spør.',
            time: '29. juli 11:37',
            hover:
              'notat fra Gud – jeg var dønn sikker på at leiing ikke var lovlig men etter ' +
              'litt research så fant jeg det i ordboka. The more you know!',
          },
          {
            from: 'me',
            text: 'Skjønner, takk! Er du klar for GF da?',
            time: '29. juli 11:50',
          },
          {
            from: 'them',
            text: 'Ja, eg gler meg som ei ku på vårslepp! 🐄',
            time: '29. juli 11:52',
          },
        ],
      },
      {
        id: 'wa-maia',
        name: 'Maia 🏠',
        avatar: '👱‍♀️',
        subtitle: 'sist sett i går 23:12',
        messages: [
          {
            from: 'them',
            text: 'Heeei! Du ville vel ikke hatt lyst til å bli med til Køben i sommer? 🍷',
            time: '14. mai 18:22',
          },
          {
            from: 'them',
            text: 'Du la igjen laderen din på kjøkkenet btw',
            time: '19. mai 10:05',
            unread: true,
          },
        ],
      },

      // ---- Støy: Angela svarer aldri — innboksen flommer over av uleste -----
      {
        id: 'wa-amelia',
        name: 'Amelia ❤️',
        avatar: '👩',
        subtitle: 'sist sett i dag 08:15',
        messages: [
          {
            from: 'them',
            text: '你好！你能帮我做作业吗？',
            time: '2. juni 19:04',
            unread: true,
          },
          {
            from: 'them',
            text: 'Angela???',
            time: '5. juni 12:31',
            unread: true,
          },
        ],
      },
      {
        id: 'wa-gruppe-coloc',
        name: 'Coloc 🏠🔥',
        avatar: '🏠',
        subtitle: 'Maia, Sara, deg',
        messages: [
          {
            from: 'them',
            author: 'Sara',
            text: 'QUI a fini le lait ??',
            time: '26. mars 08:31',
            unread: true,
          },
          {
            from: 'them',
            author: 'Maia 🏠',
            text: '??',
            time: '26. mars 09:12',
            unread: true,
          },
        ],
      },
      {
        id: 'wa-paul',
        name: 'Paul',
        avatar: '⚽',
        subtitle: 'vue le 26 juillet',
        messages: [
          {
            from: 'them',
            text: "yo, tu viens au reunion de PIR aujourd'hui ? Perso j'ai rien fait",
            time: '10. april 12:50',
            unread: true,
          },
          { from: 'them', text: '??', time: '10. april 14:19', unread: true },
        ],
      },
      {
        id: 'wa-paulrohel',
        name: 'Paul Rohel',
        avatar: '🤓',
        subtitle: 'vue hier à 18:33',
        messages: [
          {
            from: 'them',
            text: "Salut Angela, n'oublie pas d'installer l'appli Hevy",
            time: '21. november 2025 12:20',
          },
          {
            from: 'me',
            text: "Oui, comme ca je peux voir le 300kg leg press d'Andreas!",
            time: '21. november 2025 19:20',
          },
        ],
      },
      {
        id: 'wa-carole',
        name: 'Carole 🏃‍♀️',
        avatar: '🏃‍♀️',
        subtitle: 'vue aujourd’hui à 07:02',
        messages: [
          {
            from: 'them',
            text: "Coucou! T'étais pas en cours aujourd'hui, est-ce que tout va bien ?",
            time: '19. mars 20:12',
            unread: true,
          },
        ],
      },
      {
        id: 'wa-malaumne',
        name: 'Malaumne',
        avatar: '🧑‍🎨',
        subtitle: 'vue le 20 juillet',
        messages: [
          {
            from: 'them',
            text: "Si j'emprunte ton passeport, je pourrai recevoir des tutorats gratuitement??",
            time: '17. april 16:30',
            unread: true,
          },
        ],
      },
      {
        id: 'wa-claire',
        name: 'Claire',
        avatar: '👩‍🦰',
        subtitle: 'vue aujourd’hui à 09:40',
        messages: [
          {
            from: 'them',
            text: 'Coucou ! On se fait un café cette semaine ? ☕',
            time: '3. mai 11:15',
            unread: true,
          },
          {
            from: 'them',
            text: 'Angela ?? T’es vivante ?',
            time: '9. mai 14:02',
            unread: true,
          },
          {
            from: 'them',
            text: 'Bon. Je prends ça pour un non 😤',
            time: '16. mai 19:55',
            unread: true,
          },
        ],
      },
      {
        id: 'wa-alice',
        name: 'Alice',
        avatar: '👧',
        subtitle: 'vue hier à 22:10',
        messages: [
          {
            from: 'them',
            text: 'Soirée chez moi vendredi, tu viens ? 🎉',
            time: '10. juli 15:44',
            unread: true,
          },
        ],
      },
      {
        id: 'wa-andreas',
        name: 'Andreas',
        suspectId: 'andreas',
        subtitle: 'sist sett i dag 07:58',
        messages: [
          {
            from: 'them',
            text: 'Jeg fant en komando på git som fikser alt!! Magisk',
            time: '13. mars 2025 13:37',
          },
          { from: 'me', text: 'Ahah hvilken?', time: '13. mars 2025 18:12' },
          {
            from: 'them',
            text: '\"git push origin main --force\"! Men nå fungerer ingenting lenger. Gjorde du noe?',
            time: '13. mars 2025 18:13',
          },
          {
            from: 'me',
            text: "Mais bah tu es idiot, je sais même pas pourquoi t'es en IR💀",
            time: '13. mars 2025 19:02',
          },
          {
            from: 'them',
            text: "Moi un idiot?? C'est toi qui a mis des choses dans ma branche!",
            time: '24. juli 17:26',
          },
          {
            from: 'me',
            text: 'Vi fikk en A lol, chillern da',
            time: '22. mars 2025 17:26',
          },
          { from: 'them', text: 'LETSGOO', time: '22. mars 2025 18:01' },
          {
            from: 'them',
            text: 'Gratulerer med dagen!!',
            time: '25. mars 2025 18:01',
          },
          // Vedtektsforslag-spørsmålet er flyttet til Slack (sl-dm-andreas) — det er
          // en ANSA-sak, og hører hjemme i arbeidskanalen, ikke i privatchatten.
          {
            from: 'me',
            text: 'Håper du koser deg så langt i Noreg',
            time: '12. juni 2026 14:56',
          },
          {
            from: 'them',
            text: 'Jeg er klar til å bestille! Fikse i morgen?😆',
            time: '13. juni 2026 00:37',
          },
          {
            from: 'them',
            text: 'Blir kjempebra. Får fikse litt god stemning blant oss franskmenn🤗 vi blir vel sånn 20 stk',
            time: '13. juni 2026 00:37',
          },
          {
            from: 'them',
            text: 'Hvor mye utestenging av ikke-franskmenn kan jeg gjøre?',
            time: '13. juni 2026 00:38',
          },
          {
            from: 'them',
            text: 'Masse! Men savner jo deg da🫣 blir godt å se dere alle igjen',
            time: '13. juni 2026 00:38',
          },
          {
            from: 'me',
            text: 'Aw det blir fint å se deg igjen!! Gleder meg til å komme på besøk i Adamstua😎',
            time: '14. juni 2026 22:10',
          },
          {
            from: 'me',
            text: 'Jaa herregud, vi er helt sjukt mange!!!',
            time: '14. juni 2026 22:10',
          },
          {
            from: 'me',
            text: 'Du får lese hva som står om utestening av ikke-franskmenn i vedtektene:))',
            time: '14. juni 2026 22:11',
          },
          {
            from: 'me',
            text: 'Jeg er veldig klar for å bestille flybilletter i morgen🥰',
            time: '14. juni 2026 22:11',
          },
          {
            from: 'them',
            text: 'Ingenting sist jeg sjekket😇',
            time: '15. juni 2026 00:44',
          },
          {
            from: 'them',
            text: 'Supert! Jeg kan ringe deg en gang på ettermiddagen?',
            time: '15. juni 2026 00:45',
          },
          {
            from: 'them',
            text: 'Husker du forresten om vi skulle leie Airbnb eller om vi kunne låne leilighet osv.?',
            time: '15. juni 2026 00:45',
          },
          {
            from: 'me',
            text: 'Maia og Wiktor skulle se på Airbnb!',
            time: '15. juni 2026 14:55',
          },
          {
            from: 'me',
            text: 'Ja, bare å gjøre det!',
            time: '15. juni 2026 14:55',
          },
          {
            from: 'them',
            text: 'Supert! Spiser om litt også ringer jeg deg etter det🤗',
            time: '15. juni 2026 17:18',
          },
          { from: 'me', text: 'Nice!', time: '15. juni 2026 17:38' },
        ],
      },
      {
        id: 'wa-gruppe-toulouse',
        name: 'Kremen av promo 60',
        avatar: '👥',
        subtitle: 'Maia, Brage, Andreas, Aleksander, Wiktor, Svea, Oskar, deg',
        messages: [
          {
            from: 'them',
            author: 'Maia Vejlgaard Evensen',
            text: 'Nach hos oss Angela?',
            time: '17.10.2025 23:26',
          },
          { from: 'me', text: 'Vi kommer!', time: '17.10.2025 23:29' },
          {
            from: 'them',
            author: 'Brage Flønæs Johnsen',
            text: 'Besteforeldre på tur her',
            time: '17.10.2025 23:30',
          },
          { from: 'me', text: 'Sure😜❤️', time: '17.10.2025 23:32' },
          {
            from: 'me',
            text: 'Er det rett på nach?',
            time: '17.10.2025 23:33',
          },
          {
            from: 'them',
            author: 'Maia Vejlgaard Evensen',
            text: 'Tror vi tenkte oss litt ut først…',
            time: '17.10.2025 23:33',
          },
          { from: 'me', text: 'Where to?', time: '17.10.2025 23:54' },
          {
            from: 'them',
            author: 'Andreas Holmsen',
            text: 'Café oz!',
            time: '17.10.2025 23:55',
          },
          {
            from: 'them',
            author: 'Brage Flønæs Johnsen',
            text: 'Branle-nach hos Angela!',
            time: '17.10.2025 23:55',
          },
          { from: 'me', text: 'Ait rett over gata', time: '17.10.2025 23:56' },
          {
            from: 'me',
            text: 'Vi sitt å jobbe rævva av oss for én ECTS.',
            time: '17.12.2025 19:27',
          },
          {
            from: 'them',
            author: 'Aleksander Victor Taban',
            text: 'prosjektet e 20% av ein ECTS 🤡🤡🤡',
            time: '17.12.2025 19:28',
          },
          {
            from: 'them',
            author: 'Wiktor Jankowski',
            text: 'Hahahha hva søøøren',
            time: '17.12.2025 19:40',
          },
          {
            from: 'me',
            text: 'Lykke til gutter!!🔥',
            time: '17.12.2025 20:10',
          },
          {
            from: 'me',
            text: 'Jeg turer østover nå🛫🇨🇳. Fikk dessverre ikke sagt hade til alle😔Ønsker dere noen fine siste dager i Toulouse beste gjengen❤️',
            time: '17.12.2025 20:15',
          },
          {
            from: 'them',
            author: 'Aleksander Victor Taban',
            text: 'God tur Angela og god jul! ❤️',
            time: '17.12.2025 20:49',
          },
          {
            from: 'them',
            author: 'Svea Hedda Marie König',
            text: 'kom godt fram Angela! kos deg masse💕',
            time: '17.12.2025 20:52',
          },
          {
            from: 'them',
            author: 'Maia Vejlgaard Evensen',
            text: 'Lykke til gutter, sender varme tanker!',
            time: '17.12.2025 21:23',
          },
          {
            from: 'them',
            author: 'Aleksander Victor Taban',
            text: 'Baggislunsj på maille idag? 😁',
            time: '15.4.2026 10:47',
            unread: true,
          },
          {
            from: 'them',
            author: 'Andreas Holmsen',
            text: 'Jeg er down',
            time: '15.4.2026 11:32',
            unread: true,
          },
          {
            from: 'them',
            author: 'Svea Hedda Marie König',
            text: 'maia og jeg går til butikken nå, skal vi ta med til dere andre?',
            time: '15.4.2026 12:02',
            unread: true,
          },
          {
            from: 'them',
            author: 'Andreas Holmsen',
            text: 'Æ tar metroen fra St. Mich nå. Stopper på Rang!',
            time: '15.4.2026 12:04',
            unread: true,
          },
          {
            from: 'them',
            author: 'Svea Hedda Marie König',
            text: 'vi er på carrefour:)',
            time: '15.4.2026 12:09',
            unread: true,
          },
          {
            from: 'them',
            author: 'Svea Hedda Marie König',
            text: 'vi har fiksa masse mat',
            time: '15.4.2026 12:21',
            unread: true,
          },
          {
            from: 'them',
            author: 'Oskar Orvik',
            text: 'Sitter på maille',
            time: '15.4.2026 12:23',
            unread: true,
          },
          {
            from: 'them',
            author: 'Aleksander Victor Taban',
            text: 'brage og meg går mod butikken nå',
            time: '15.4.2026 12:25',
            unread: true,
          },
          {
            from: 'them',
            author: 'Andreas Holmsen',
            text: 'Vi har alt fikset masse mat',
            time: '15.4.2026 12:25',
            unread: true,
          },
          {
            from: 'them',
            author: 'Wiktor Jankowski',
            text: 'Er maille pk?',
            time: '15.4.2026 12:36',
            unread: true,
          },
        ],
      },
    ],
    email: [
      // =====================================================================
      //  DRIKKESERVERING PÅ MØTET (lør 1. aug) — hintene kommer UTENFRA.
      //  Ingen av avsenderne var på møtet, ingen bruker ordet «vors», og ingen
      //  peker på hvem som ordnet drikken. Bonusen: hintene får de USKYLDIGE
      //  til å se verst ut (presidenten, sosialveilederen, edruvaktene).
      //  Sverre nevnes ikke én gang.
      // =====================================================================
      {
        id: 'ep-ingeborg-referat-1',
        from: 'Ingeborg Frogner Dahl-Hilstad <ingeborg@ansa.no>',
        to: 'angela@epost.no',
        subject: 'Referat fra møtet lørdag',
        date: 'lør. 1. august, 18:40',
        unread: true,
        body:
          'Hei Angela,\n\n' +
          'Jeg finner ikke referatet fra møtet mellom sekretariatet, hovedstyret og TRIA i ' +
          'dag. Ligger det et annet sted enn i driven?\n\n' +
          'Jeg spør fordi jeg skal føre inn hva som ble besluttet om nattbadingen, og jeg har ' +
          'ingenting å føre fra.\n\n' +
          'Mvh\nIngeborg',
      },
      {
        id: 'ep-ingeborg-referat-2',
        folder: 'sendt',
        from: 'Angela',
        to: 'Ingeborg Frogner Dahl-Hilstad <ingeborg@ansa.no>',
        subject: 'SV: Referat fra møtet lørdag',
        date: 'lør. 1. august, 19:04',
        body:
          'Hei!\n\n' +
          'Det ble ikke skrevet referat. Det ble litt sånn etter hvert.\n\n' +
          'Vi konkluderte ikke noe om nattbadingen heller. Vi tar det på nytt i høst.\n\n' +
          'A.',
      },
      {
        id: 'ep-ingeborg-referat-3',
        from: 'Ingeborg Frogner Dahl-Hilstad <ingeborg@ansa.no>',
        to: 'angela@epost.no',
        subject: 'SV: SV: Referat fra møtet lørdag',
        date: 'lør. 1. august, 19:11',
        unread: true,
        body: 'Ingen referat og ingen konklusjon?\n\nVar det et møte da?',
      },
      {
        id: 'ep-jonathan-mote',
        from: 'Jonathan Nagelgaard <jonathan.nagelgaard@epost.no>',
        to: 'angela@epost.no',
        subject: 'Beklager forstyrrelsen i dag!',
        date: 'lør. 1. august, 17:22',
        unread: true,
        body:
          'Hei Angela!\n\n' +
          'Beklager at jeg banket på møterommet i ettermiddag. Jeg skjønte etterpå at det var ' +
          'et internt møte, jeg trodde bare det var en pause siden det var så god stemning ' +
          'der inne.\n\n' +
          'Jeg skulle bare spørre om hvor jeg skal sitte på banketten. Fant det ut selv! ' +
          'Det stod på et ark. 😅\n\n' +
          'Ses i kveld!\n\n' +
          'Jonathan',
      },
      {
        id: 'ep-henriette-edruvakt',
        from: 'Henriette Moe Schjelderup <henriette.moe@epost.no>',
        to: 'angela@epost.no',
        subject: 'Edruvaktene i kveld',
        date: 'lør. 1. august, 21:06',
        unread: true,
        body:
          'Hei! Bare så du er informert, siden du er prosjektleder.\n\n' +
          'Vi ble tre og ikke fem på edruvakt i kveld. Runill hadde gjennomgangen 18:30 som ' +
          'planlagt, men to av dem som skulle stå kom ikke — og jeg fikk beskjed om at de ' +
          'ikke burde stå vakt likevel i kveld.\n\n' +
          'Jeg måtte bytte i siste sekund selv også, så jeg rakk ikke gjennomgangen. Ane tok ' +
          'min vakt fra 21. Hun sa det var helt fint.\n\n' +
          'Går bra! Bare litt tynt. Sier det til Runill også.\n\n' +
          'Henriette',
      },

      // =====================================================================
      //  SVERRE-SPORET (Checkin). PRINSIPP: hint om forbrytelsen han ALLEREDE
      //  har begått — aldri om drapet. Ingen av disse navngir ham, og ingen
      //  gir ham motiv. Spillerne skal avslutte dag 2 med «det er noe rart
      //  med Checkin», IKKE med «Sverre gjorde det».
      //  Smoking gun-utkastet («sjekke etter GF») ligger på dag 3 (day: 3).
      // =====================================================================
      {
        id: 'ep-checkin-rapport',
        from: 'Checkin <rapport@checkin.no>',
        to: 'angela@epost.no',
        subject: 'Månedsoversikt juli — arrangement knyttet til ANSA',
        date: 'fre. 31. juli, 04:02',
        unread: true,
        body:
          'Automatisk generert oversikt. Du mottar denne fordi e-postadressen din er ' +
          'registrert som administrativ kontakt.\n\n' +
          '**Juli 2026**\n\n' +
          '| | |\n' +
          '| --- | --- |\n' +
          '| Arrangement opprettet | 9 |\n' +
          '| Solgte billetter | 612 |\n' +
          '| Herav opprettet av partnerkonto | 7 |\n' +
          '| Aktive partnerkontoer | 1 |\n\n' +
          '**Hittil i år**\n\n' +
          '| | |\n' +
          '| --- | --- |\n' +
          '| Arrangement opprettet | 68 |\n' +
          '| Solgte billetter | 4 431 |\n' +
          '| Herav opprettet av partnerkonto | 41 |\n\n' +
          'Se full oversikt ved å logge inn.\n\n' +
          '_Har du spørsmål om partnerordningen? Kontakt din kontaktperson hos Checkin._',
      },
      {
        id: 'ep-kasserer-1',
        from: 'Tuva Sæbø <tuva@ansadublin.no>',
        to: 'angela@epost.no',
        subject: 'Litt rart spørsmål om pubquiz-billetter',
        date: 'tor. 30. juli, 14:18',
        unread: true,
        body:
          'Hei Angela!\n\n' +
          'Beklager at jeg plager deg rett før GF, men du er den eneste jeg vet faktisk kan ' +
          'systemene.\n\n' +
          'Vi hadde pubquiz i mars og brukte Checkin til billettene. Vi satte prisen til ' +
          '80 kr. Men når jeg fører regnskapet nå får jeg det ikke til å stemme — det kom ' +
          'inn mindre enn 80 per billett. Ikke mye mindre, men nok til at det blir feil i ' +
          'årsregnskapet.\n\n' +
          'Er det et gebyr jeg ikke har fått med meg? Jeg finner ingenting i avtalen vi ' +
          'signerte, men jeg vet heller ikke helt hvem som signerte den.\n\n' +
          'Hilsen Tuva\n' +
          '_økonomiansvarlig, ANSA Dublin_',
      },
      {
        id: 'ep-kasserer-2',
        folder: 'sendt',
        from: 'Angela',
        to: 'Tuva Sæbø <tuva@ansadublin.no>',
        subject: 'SV: Litt rart spørsmål om pubquiz-billetter',
        date: 'tor. 30. juli, 22:51',
        body:
          'Hei Tuva!\n\n' +
          'Ikke beklag, dette er et helt riktig spørsmål å stille. Kort svar: det skal ikke ' +
          'være noe gebyr som ikke står i avtalen.\n\n' +
          'Kan du sende meg avtalen? Og hvem som satte opp arrangementet i Checkin?\n\n' +
          'Jeg ser på det i helgen.\n\n' +
          'Angela',
      },
      {
        // Sverre spør om nøyaktig de tallene som bestemmer utbetalingen hans.
        // Helt hjelpsom og ufarlig på dag 2. NB: bokmål — Sverre snakker
        // bokmål i vitneutsagnet, og nynorsk er Eriks spor (ikke bland dem).
        id: 'ep-sverre-deltakertall',
        from: 'Sverre <sverre@sjomannskirken.no>',
        to: 'angela@epost.no',
        subject: 'Deltakertall vår 2026',
        date: 'ons. 29. juli, 08:34',
        body:
          'Morn Angela!\n\n' +
          'Håper det går bra i innspurten. Si til om det er noe jeg kan avlaste med — jeg er ' +
          'på plass fra torsdag.\n\n' +
          'Én liten ting: har du samlet oversikt over deltakertall for arrangementene i ' +
          'Frankrike, Irland, Tyskland og Nederland i vår? Fint å ha til min egen ' +
          'rapportering. Holder med totaler per arrangement, trenger ikke navn.\n\n' +
          'Ingen hast. Sees på fredag!\n\n' +
          'Sverre',
      },
      {
        // DAG 3: smoking gun. Angela har begynt å telle — ingen navn, ingen
        // anklage, men «alle samme partnerkonto» + «ta det opp søndag».
        id: 'ep-til-meg-selv',
        folder: 'utkast',
        day: 3,
        from: 'Angela',
        to: 'angela@epost.no',
        subject: 'sjekke etter GF',
        date: 'lør. 1. august, 09:12',
        body:
          'Bordeaux 84\n' +
          'Toulouse 112\n' +
          'Dublin 61\n' +
          'München 90\n' +
          'Wien 55\n' +
          'Amsterdam 78\n' +
          'Praha 66\n\n' +
          'alle Checkin. alle samme partnerkonto.\n\n' +
          'gebyr?? finn avtalen\n\n' +
          'ta det opp søndag',
      },

      // E-post-tråden med Ingeborg om vedtektene (29. juli) — spørsmålet i
      // Sendt, svaret i Innboks, og Angelas beroligende svar i Sendt.
      {
        id: 'ep-ingeborg-1',
        folder: 'sendt',
        from: 'Angela',
        to: 'Ingeborg Frogner Dahl-Hilstad <ingeborg@ansa.no>',
        subject: 'Spørsmål om vedtektene',
        date: 'tir. 29. juli, 09:05',
        body:
          'Hei Ingeborg,\n\n' +
          'Kort spørsmål: Hva gjør jeg hvis jeg har oppdaget at noen har endret vedtektene ' +
          'bak ryggen på oss andre? Hva er konsekvensene?\n\n' +
          'Mvh\nAngela',
      },
      {
        id: 'ep-ingeborg-2',
        from: 'Ingeborg Frogner Dahl-Hilstad <ingeborg@ansa.no>',
        to: 'angela@epost.no',
        subject: 'SV: Spørsmål om vedtektene',
        date: 'tir. 29. juli, 09:38',
        body:
          'Dette er høyst ulovlig! Hvis dette faktisk har skjedd er det mulig at vedkommende ' +
          'får forvaring (mye mye fengsel). Hvem er det snakk om??',
      },
      {
        id: 'ep-ingeborg-3',
        folder: 'sendt',
        from: 'Angela',
        to: 'Ingeborg Frogner Dahl-Hilstad <ingeborg@ansa.no>',
        subject: 'SV: SV: Spørsmål om vedtektene',
        date: 'tir. 29. juli, 10:02',
        body:
          'Neida det var bare hypotetisk... Jeg sier ifra hvis noe sånt ville skjedd. ' +
          'Men har en liten mistanke, snakker først med vedkommende og tar det opp med deg ' +
          'på GF hvis det blir et problem',
      },
      // Pop-up-bar-forespørselen (27.–28. juli) — Aleksander svarer på siddis.
      {
        id: 'ep-aleksander-1',
        folder: 'sendt',
        from: 'Angela',
        to: 'aleksander@notail.no',
        subject: 'Pop-up bar på GF? 🍸',
        date: 'man. 27. juli, 13:22',
        body:
          'Hei Aleksander!\n\n' +
          'GF nærmer seg med stormskritt — og folk spør allerede: er det NOEN mulighet for ' +
          'at dere kan sette opp en av deres legendariske pop-up-barer igjen i år? Den i ' +
          'Toulouse har fortsatt buzzzin (med 3 z-er) status.\n\n' +
          'Si ja. 🙏\n\n' +
          'Hilsen Angela',
      },
      {
        id: 'ep-aleksander-2',
        from: 'Aleksander <aleksander@notail.no>',
        to: 'angela@epost.no',
        subject: 'SV: Pop-up bar på GF? 🍸',
        date: 'tir. 28. juli, 10:48',
        body:
          'Halla Angela!\n\n' +
          'løye at du spør, det varme ett gammalt bartenderhjerta. Men eg må nok ' +
          'skuffa deg — kalenderen min e HEILT sprengt.\n\n' +
          'Ses på GF!\n\n' +
          'Aleksander 🍹',
      },
      {
        id: 'ep-styret',
        from: 'Styret <styret@borettslaget.no>',
        to: 'angela@epost.no',
        subject: 'Vedr. klage på gjerde — sak 118',
        date: 'ons. 15:02',
        unread: true,
        body:
          'Hei Angela,\n\nVi har mottatt klagen din på naboens gjerde. Saken behandles på ' +
          'styremøtet neste uke. Vedlagt følger nabovarselet.\n\nMvh Styret',
        attachments: [
          {
            id: 'ep-styret-vedlegg',
            title: 'Nabovarsel',
            kind: 'markdown',
            inline:
              '## NABOVARSEL\n\nDet varsles herved om oppføring av gjerde i eiendomsgrensen. ' +
              'Merknader må fremsettes innen 14 dager.\n\n_Signert: K. Lund_',
          },
        ],
      },
      // ---- Reklame/varsler (fyllstoff — gjør innboksen troverdig) ----------
      {
        id: 'ep-github',
        from: 'GitHub <billing@github.com>',
        to: 'angela@epost.no',
        subject: 'Ditt GitHub Premium Push Assistant™-abonnement utløper snart',
        date: 'man. 28. juli, 08:14',
        unread: true,
        body:
          'Hei **angela-liu**,\n\n' +
          'Abonnementet ditt på **GitHub Premium Push Assistant™** utløper om 7 dager.\n\n' +
          'Uten Push Assistant må du dessverre pushe koden din helt selv. Vi anbefaler å ' +
          'fornye før det er for sent.\n\n' +
          '· Plan: Premium Push Assistant (årlig)\n' +
          '· Pris: $6-7/år\n\n' +
          '_Du mottar denne e-posten fordi du er et bedre menneske enn de fleste._',
      },
      {
        id: 'ep-slack-2fa',
        from: 'Slack <no-reply@slack.com>',
        to: 'angela@epost.no',
        subject: 'Bekreftelseskode for Slack: 828 417',
        date: 'fre. 25. juli, 19:32',
        body:
          'Koden din for å logge inn på **GF-komiteen.slack.com** er:\n\n' +
          '## 828 417\n\n' +
          'Koden er gyldig i 10 minutter. Var ikke dette deg? Da kan du trygt ignorere ' +
          'denne e-posten.',
      },
      {
        id: 'ep-slack-ad',
        from: 'Slack <hello@slack.com>',
        to: 'angela@epost.no',
        subject: 'Nytt i Slack: Huddles 2.0 og 14 andre ting du ikke ba om',
        date: 'tor. 24. juli, 11:00',
        body:
          'Hei Angela!\n\n' +
          'Visste du at teamet ditt kan være **23 % mer produktivt**?* Prøv Slack Pro gratis ' +
          'i 30 dager.\n\n' +
          '_*Tall fra en undersøkelse vi gjennomførte blant oss selv._',
      },
      {
        id: 'ep-foodora',
        from: 'foodora <noreply@foodora.no>',
        to: 'angela@epost.no',
        subject: 'Vi savner deg, Angela 🥺 20 % på neste bestilling',
        date: 'ons. 23. juli, 16:45',
        unread: true,
        body:
          'Det er 11 dager siden sist. Kebaben tenker fortsatt på deg.\n\n' +
          'Bruk koden **KOMTILBAKE20** innen søndag.',
      },
      {
        id: 'ep-finn',
        from: 'FINN.no <varsler@finn.no>',
        to: 'angela@epost.no',
        subject: '3 nye treff i søket ditt: «leilighet Grünerløkka»',
        date: 'tir. 22. juli, 07:30',
        body:
          'Nye annonser som matcher lagret søk:\n\n' +
          '· Lys 2-roms med balkong — 4 950 000 kr\n' +
          '· Sjarmerende loftsleilighet (42 m²) — 5 200 000 kr\n' +
          '· «Oppussingsobjekt» (les: brannskade) — 3 100 000 kr',
      },
      {
        id: 'ep-tbs',
        from: 'TBS Education — Service des Admissions <admissions@tbs-education.fr>',
        to: 'angela@epost.no',
        subject: 'Décision d’admission — Programme Grande École (dossier n° 2026-08841)',
        date: 'fre. 29. mai, 14:07',
        body:
          'Madame,\n\n' +
          'À la suite de l’examen attentif de votre dossier de candidature ainsi que de ' +
          'votre entretien de motivation du 26 mars dernier, nous avons l’honneur de vous ' +
          'informer que le jury d’admission a émis un **avis favorable** à votre intégration ' +
          'au sein du Programme Grande École de Toulouse Business School, pour la rentrée ' +
          'universitaire 2026–2027.\n\n' +
          'Afin de confirmer votre inscription, nous vous saurions gré de bien vouloir ' +
          'compléter les formalités administratives sur votre espace candidat avant le ' +
          '30 juin 2026, délai de rigueur. Passé cette date, votre place sera proposée à ' +
          'un candidat inscrit sur liste complémentaire.\n\n' +
          'Nous vous adressons toutes nos félicitations et nous réjouissons de vous ' +
          'accueillir prochainement sur notre campus de Toulouse.\n\n' +
          'Nous vous prions d’agréer, Madame, l’expression de nos salutations les plus ' +
          'distinguées.\n\n' +
          '_Le Service des Admissions_\n' +
          '_TBS Education — Toulouse Business School_\n' +
          '_1 Place Alphonse Jourdain, 31068 Toulouse_',
      },
      {
        id: 'ep-spam-toll',
        folder: 'spam',
        from: 'PostNorden <security@post-norden-tracking.info>',
        subject: 'Din pakke er holdt tilbake i tollen ⚠️',
        date: 'søn. 04:27',
        body:
          'Kjære kunde, pakken din (sporingsnr. NO-4471822) venter på betaling av tollgebyr: ' +
          '**23,50 kr**. Klikk her og oppgi kortnummer for å frigi pakken.',
      },
      {
        id: 'ep-utkast',
        folder: 'utkast',
        from: 'Angela',
        to: 'andreash@andreash.no',
        subject: '(uten emne)',
        date: 'lør. 12:13',
        body: 'Var det sånn at Broiler var i slekt med deg og du kunne fått han til å opptre på GF-banketten? Jeg tenkte at ',
      },
      {
        id: 'ep-spam',
        folder: 'spam',
        from: 'Advokat B. Diallo <winner@lotteri-intl.biz>',
        subject: 'DU HAR VUNNET 4 500 000 NOK!!',
        date: 'man. 03:11',
        body: 'Kjære heldige vinner! Send oss kontonummer og BankID for å motta premien.',
      },
    ],
    slack: {
      workspace: 'GF-komiteen',
      channels: [
        {
          id: 'sl-festkomiteen',
          name: 'festkomiteen',
          topic: 'Bankettmiddag lørdag 🥂',
          messages: [
            {
              author: 'Angela',
              text: 'Bordplasseringen er klar! Ligger i driven.',
              time: 'fre 14:05',
            },
            {
              author: 'Ingeborg Frogner Dahl-Hilstad',
              text: 'Skal hovedstyret sitte samlet, eller spredt utover bordene?',
              time: 'fre 14:22',
            },
            {
              author: 'Angela',
              text: 'Spredt. Folk skal snakke med noen de ikke kjenner. Det er hele poenget.',
              time: 'fre 14:30',
              edited: true,
            },
            {
              author: 'Henriette Moe Schjelderup',
              text: 'Jeg har kjøpt duker. De er litt for korte, men det ser helt fint ut på bilde.',
              time: 'fre 15:01',
            },
            {
              author: 'Jofrid',
              text: 'Jeg tar med blomster 🌸',
              time: 'fre 15:14',
            },
            {
              author: 'Brage Johnsen',
              text: 'Kan vi ha en toastmaster som faktisk holder tiden i år',
              time: 'fre 16:02',
            },
            {
              author: 'Angela',
              text: 'Vi HAR en toastmaster som holder tiden. Jeg har gitt hen en klokke og et blikk.',
              time: 'fre 16:10',
            },
            {
              author: 'Henriette Moe Schjelderup',
              text:
                'Serviettene i ANSA-grønn var utsolgt så nå er de mintgrønne. Ingen kommer til å ' +
                'merke det.',
              time: 'tor 11:40',
            },
            {
              author: 'Angela',
              text: 'Noen kommer helt sikkert til å merke det.',
              time: 'tor 11:44',
            },
          ],
        },
        {
          id: 'sl-francaise',
          name: 'la-delegation-francaise',
          topic: 'Ici on parle français 🇫🇷',
          messages: [
            // --- CIV VII før GF. Gutta (Andreas, Oskar, Brage, Aleksander, Wiktor)
            //     spiller konstant. Bekrefter Anna sitt utsagn om at Wiktor vant og
            //     at Andreas var deppa, og setter opp omkampen på GF.
            {
              author: 'Aleksander Victor Taban',
              text: 'qui veut jouer ce soir ? 🤡',
              time: '12. juli 17:40',
            },
            { author: 'Wiktor Jankowski', text: 'moi', time: '12. juli 17:41' },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: 'moi mais je ne joue plus jamais contre Wiktor',
              time: '12. juli 17:44',
            },
            {
              author: 'Wiktor Jankowski',
              text: 'mdrrrr',
              time: '12. juli 17:45',
            },
            {
              author: 'Oskar',
              suspectId: 'oskar',
              text: 'il boude encore',
              time: '12. juli 17:52',
            },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: 'je ne boude pas. je réfléchis à ma stratégie.',
              time: '12. juli 17:53',
            },
            {
              author: 'Brage Johnsen',
              text: 'il boude',
              time: '12. juli 17:55',
            },
            {
              author: 'Oskar',
              suspectId: 'oskar',
              text:
                "quelqu'un peut m'expliquer pourquoi on doit changer de civ entre les âges. " +
                '200 heures de jeu et je ne comprends toujours pas',
              time: '21. juli 20:12',
            },
            {
              author: 'Wiktor Jankowski',
              text: "c'est littéralement le principe du jeu Oskar",
              time: '21. juli 20:15',
            },
            {
              author: 'Oskar',
              suspectId: 'oskar',
              text: "c'est stupide",
              time: '21. juli 20:16',
            },
            {
              author: 'Brage Johnsen',
              text: 'il dit ça chaque partie',
              time: '21. juli 20:18',
            },
            {
              author: 'Aleksander Victor Taban',
              text: 'et il joue quand même chaque soir 🤡',
              time: '21. juli 20:20',
            },
            {
              author: 'Wiktor Jankowski',
              // ↳ bekrefter Anna: «Wiktor … forklarte at det var fordi han hadde vunnet i
              //   dataspillet CIV VII» — og Wiktor-DM-en (sju timer).
              text: 'SEPT HEURES. et il a quitté la partie avant la fin 😭',
              time: '27. juli 00:02',
            },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: "j'avais un train",
              time: '27. juli 08:40',
            },
            {
              author: 'Oskar',
              suspectId: 'oskar',
              text: "tu n'avais pas de train",
              time: '27. juli 08:42',
            },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: "j'avais moralement un train",
              time: '27. juli 08:43',
            },
            {
              author: 'Aleksander Victor Taban',
              text: '🤡🤡🤡',
              time: '27. juli 08:44',
            },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: "revanche à la GF. j'apporte mon pc.",
              time: '27. juli 09:10',
            },
            {
              author: 'Brage Johnsen',
              text: 'tu vas porter une tour de 12 kilos dans un avion ??',
              time: '27. juli 09:14',
            },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: 'oui',
              time: '27. juli 09:15',
            },
            {
              author: 'Angela',
              text: 'Pas dans la salle plénière. Je suis sérieuse.',
              time: '27. juli 09:30',
            },
            {
              author: 'Aleksander Victor Taban',
              text: 'on trouvera une chambre 🫡',
              time: '27. juli 09:32',
            },
            {
              author: 'Aleksander Victor Taban',
              text: "quelqu'un sait à quelle heure on part demain ?? 🤡",
              time: 'man 21:14',
            },
            {
              author: 'Maia Vejlgaard Evensen',
              text: '8h30 devant la réception. Je répète : 8h30.',
              time: 'man 21:20',
            },
            {
              author: 'Wiktor Jankowski',
              text: 'mdrrrr personne ne sera là à 8h30',
              time: 'man 21:22',
            },
            {
              author: 'Maia Vejlgaard Evensen',
              text: 'Je sais.',
              time: 'man 21:23',
            },
            {
              author: 'Svea Hedda Marie König',
              text: 'moi je viens mais je dors dans le bus 💕',
              time: 'man 21:41',
            },
            {
              author: 'Brage Johnsen',
              text: 'grève SNCF jeudi. évidemment. on va tous mourir dans cette gare',
              time: 'tir 07:55',
            },
            {
              author: 'Aleksander Victor Taban',
              text: 'on a raté le train, on prend le suivant, tout va très bien 🤡🤡',
              time: 'tir 10:32',
            },
            { author: 'Angela', text: 'Vous êtes où là ??', time: 'tir 10:40' },
            {
              author: 'Aleksander Victor Taban',
              text: 'dans un kebab',
              time: 'tir 10:41',
            },
            { author: 'Angela', text: 'Bien sûr.', time: 'tir 10:42' },
            {
              author: 'Wiktor Jankowski',
              text: "le kebab est bien meilleur que la nourriture de l'avion, donc c'est un choix stratégique",
              time: 'tir 10:50',
            },
            {
              author: 'Svea Hedda Marie König',
              text: "j'ai oublié mon chargeur à paris 😭",
              time: 'ons 18:03',
            },
            {
              author: 'Maia Vejlgaard Evensen',
              text: "tu as oublié ton chargeur à paris l'année dernière aussi",
              time: 'ons 18:07',
            },
            {
              author: 'Svea Hedda Marie König',
              text: "c'est ma tradition 💕",
              time: 'ons 18:09',
            },
            {
              author: 'Brage Johnsen',
              text: "quelqu'un peut m'expliquer pourquoi il fait 11 degrés en juillet ici",
              time: 'tor 08:12',
            },
            {
              author: 'Wiktor Jankowski',
              text: 'bienvenue en Norvège 🇳🇴',
              time: 'tor 08:15',
            },
            {
              author: 'Aleksander Victor Taban',
              text: "les norvégiens appellent ça l'été ☀️",
              time: 'tor 08:16',
            },
            { author: 'Angela', text: "C'est l'été.", time: 'tor 08:30' },
            {
              author: 'Svea Hedda Marie König',
              text: 'on se retrouve au bar après le dîner ? 💕',
              time: 'fre 17:22',
            },
            {
              author: 'Brage Johnsen',
              text: 'il y a UN barman pour 100 personnes. préparez-vous psychologiquement',
              time: 'fre 17:30',
            },
            {
              author: 'Aleksander Victor Taban',
              text: 'jsp pourquoi mais je trouve ça drôle 🤡',
              time: 'fre 17:31',
            },

            // --- Fredag kveld: omkampen på rommet etter prisutdelingen (21:30) og
            //     før baren (~22:20). Bekrefter Oskar («guttatid» på rommet med
            //     studentprest Sverre), Sverre («ble litt for teknisk for meg») og
            //     Erik (snakket med Oskar om spelet i baren etterpå). Stopper
            //     bevisst lenge før drapet 23:38 — ingen får alibi her.
            {
              author: 'Aleksander Victor Taban',
              text: 'la remise des prix est finie, on monte à la chambre 🤡',
              time: 'fre 21:34',
            },
            {
              author: 'Oskar',
              suspectId: 'oskar',
              // ↳ bekrefter at ANSA Toulouse vant årets lokallag (Oskar/Maud/Anna).
              text: "Toulouse a gagné. je n'ai plus rien à prouver ce soir",
              time: 'fre 21:36',
            },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: 'moi si',
              time: 'fre 21:37',
            },
            {
              author: 'Wiktor Jankowski',
              text: 'le prêtre monte avec nous ??',
              time: 'fre 21:41',
            },
            {
              author: 'Brage Johnsen',
              // ↳ bekrefter Oskar: «Vi gutta gikk på rommet vårt litt med studentprest
              //   Sverre for å ha guttatid».
              text: "sverre a dit oui. il ne sait pas du tout ce qui l'attend",
              time: 'fre 21:43',
            },
            {
              author: 'Aleksander Victor Taban',
              text: 'on lui explique les voies héritage en cinq minutes, ça va aller 🤡',
              time: 'fre 21:48',
            },
            {
              author: 'Oskar',
              suspectId: 'oskar',
              // ↳ bekrefter Sverre: «Var morsomt, men ble litt for teknisk for meg.»
              text: "il a dit que c'était trop technique. honnêtement il a raison",
              time: 'fre 21:57',
            },
            {
              author: 'Wiktor Jankowski',
              text: 'GG 🏆 bon, on descend au bar ?',
              time: 'fre 22:04',
            },
            {
              author: 'Brage Johnsen',
              // ↳ bekrefter Ane/Oskar: køen i baren ble helt utrolig lang.
              text: 'oui. et la queue va être infinie, comme chaque année',
              time: 'fre 22:07',
            },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: 'je vous rejoins, je range le pc',
              time: 'fre 22:09',
            },
            {
              author: 'Aleksander Victor Taban',
              text: "quelqu'un a vu mon chargeur 🤡",
              time: 'fre 22:10',
            },
            {
              author: 'Svea Hedda Marie König',
              text: 'demande à moi. je suis experte en chargeurs perdus 💕',
              time: 'fre 22:12',
            },
          ],
        },

        // ------------------------------------------------------------------
        // STØY-KANALER. Ingen spor her — bare vanlig GF-mas som gjør at
        // telefonen føles ekte og gir spillerne noe å lete gjennom. Ingen av
        // avsenderne er mistenkte (Brage/Ingeborg/Henriette/Jofrid er alle
        // navn som allerede finnes i saken andre steder).
        // ------------------------------------------------------------------
        {
          id: 'sl-generelt',
          name: 'generelt',
          topic: 'Alt og ingenting 🌀',
          messages: [
            {
              author: 'Angela',
              text: 'Wifi på hotellet er «GF2026» og passordet er «generalforsamling». Alt i små bokstaver. Ja jeg vet.',
              time: 'tor 09:14',
            },
            {
              author: 'Brage Johnsen',
              text: 'Nei det passordet kommer aldri noen til å klare å skrive inn på første forsøk',
              time: 'tor 09:20',
            },
            {
              author: 'Ingeborg Frogner Dahl-Hilstad',
              text:
                'Minner om at navneskiltene skal bæres synlig hele helgen. Det står i ' +
                'retningslinjene, og det er nokså greit for oss som ikke kjenner alle 200.',
              time: 'tor 09:41',
            },
            {
              author: 'Brage Johnsen',
              text: 'Mitt sier «Bryne Johnsen». To skilt på rad nå. Jeg gir opp assa 🙃',
              time: 'tor 09:52',
            },
            {
              author: 'Angela',
              text: 'Nei hæ! Jeg fikser et nytt til deg i morgen, lover.',
              time: 'tor 10:03',
            },
            {
              author: 'Henriette Moe Schjelderup',
              text:
                'Noen som har sett en svart ladekabel i plenumssalen? Den lå ved bordet foran, ' +
                'også var den plutselig borte. Ikke krise, men litt irriterende.',
              time: 'tor 16:30',
            },
            {
              author: 'Jofrid',
              text: 'Jeg har en hel pose med kabler som folk har glemt igjen. Kom og se innom 🌸',
              time: 'tor 16:44',
            },
            {
              author: 'Angela',
              text: 'Kaffemaskinen i 2. etasje er tom igjen. Dette er det tredje døgnet.',
              time: 'fre 07:58',
            },
            {
              author: 'Brage Johnsen',
              text: 'Det er vel livet det...',
              time: 'fre 08:02',
            },
          ],
        },
        {
          id: 'sl-logistikk',
          name: 'logistikk',
          topic: 'Buss, rom, nøkler 🚌',
          messages: [
            {
              author: 'Ingeborg Frogner Dahl-Hilstad',
              text:
                'Bussen fra flyplassen går 14:20 og 17:50. Ikke 14:30 som det står i det gamle ' +
                'programmet — det er rettet i den nye versjonen som ligger i driven.',
              time: 'ons 11:05',
            },
            {
              author: 'Angela',
              text: 'Jeg har lagt inn riktig tid i programmet nå. Versjon 4. Ikke bruk versjon 3. Eller 2.',
              time: 'ons 11:22',
              edited: true,
            },
            {
              author: 'Henriette Moe Schjelderup',
              text: 'Er det versjon 4 eller «programmet_ferdig_FERDIG.pdf»? 😅',
              time: 'ons 11:26',
            },
            {
              author: 'Angela',
              text: 'Den siste. Nei vent. Den nest siste. Jeg sletter resten.',
              time: 'ons 11:31',
            },
            {
              author: 'Brage Johnsen',
              text:
                'Litt av gjengen fra Frankrike kommer først sent på torsdag, så vi rekker ikke ' +
                'registreringen. Går det greit å hente navneskiltene fredag morgen?',
              time: 'ons 15:47',
            },
            {
              author: 'Angela',
              text: 'Jada helt fint. Jeg legger dem i en konvolutt i resepsjonen.',
              time: 'ons 15:52',
            },
            {
              author: 'Ingeborg Frogner Dahl-Hilstad',
              text:
                'To rom har fått feil antall nøkkelkort. Hotellet sier det er «umulig», men de ' +
                'har sagt det før også.',
              time: 'tor 13:14',
            },
            {
              author: 'Henriette Moe Schjelderup',
              text: 'Umulig er et sterkt ord for et hotell som booket oss inn på feil helg i fjor',
              time: 'tor 13:20',
            },
          ],
        },
        {
          id: 'sl-teknikk',
          name: 'teknikk',
          topic: 'Projektor, mikk, HDMI 🔌',
          messages: [
            {
              author: 'Angela',
              text: 'Mikrofon 2 knaser når man går forbi høyttaleren på venstre side. Noen som er tekniske?',
              time: 'tor 12:02',
            },
            {
              author: 'Brage Johnsen',
              text: 'Jeg er ikke teknisk men jeg kan holde den stille',
              time: 'tor 12:06',
            },
            {
              author: 'Henriette Moe Schjelderup',
              text:
                'Prøvde å bytte batteri, hjalp litt. Tror det er kabelen bak scenen som ligger ' +
                'oppå strømkabelen. Klassisk.',
              time: 'tor 12:35',
            },
            {
              author: 'Angela',
              text:
                'Projektoren viser alt i litt grønt. Hvertfall på min maskin. Fungerte helt fint ' +
                'i går, så nå vet jeg ikke helt.',
              time: 'tor 14:11',
            },
            {
              author: 'Henriette Moe Schjelderup',
              text: 'Grønt er ANSA-farge så det er nesten på tema?',
              time: 'tor 14:15',
            },
            {
              author: 'Angela',
              text: 'Byttet HDMI-kabel og nå er det bare litt grønt. Godt nok. Vi kjører på.',
              time: 'tor 14:52',
            },
            {
              author: 'Ingeborg Frogner Dahl-Hilstad',
              text:
                'Husk å teste presentasjonene FØR sesjonen begynner. Hvert år er det noen som ' +
                'oppdager at fonten ser helt annerledes ut på en annen maskin.',
              time: 'fre 08:30',
            },
          ],
        },
        {
          id: 'sl-mat',
          name: 'mat-og-allergier',
          topic: 'Catering 🍽️',
          messages: [
            {
              author: 'Ingeborg Frogner Dahl-Hilstad',
              text:
                'Frist for å melde inn allergier var forrige mandag. Vi har fått inn 14 nye ' +
                'siden da. Jeg sier ikke nei, jeg sier bare at det finnes en frist.',
              time: 'tir 10:40',
            },
            {
              author: 'Angela',
              text: 'Kjøkkenet sier de fikser det. De er kjempegreie.',
              time: 'tir 10:48',
            },
            {
              author: 'Jofrid',
              text: 'Er det vegetaralternativ på banketten? Spør for flere 🌸',
              time: 'tir 14:03',
            },
            {
              author: 'Angela',
              text: 'Ja! Og glutenfritt. Og ett måltid uten nøtter. Jeg har en tabell nå. Jeg elsker tabellen.',
              time: 'tir 14:19',
            },
            {
              author: 'Brage Johnsen',
              text: 'Kan vi få noe annet enn kylling og ris til lunsj tre dager på rad',
              time: 'tor 12:44',
            },
            {
              author: 'Angela',
              text: 'Nei 🙂',
              time: 'tor 12:45',
            },
            {
              author: 'Brage Johnsen',
              text: 'Respekterer det',
              time: 'tor 12:46',
            },
            {
              author: 'Henriette Moe Schjelderup',
              text:
                'Baren tar bare kort, ikke kontanter. Bare så folk vet det før køen blir helt ' +
                'utrolig lang som i fjor.',
              time: 'fre 16:20',
            },
          ],
        },
        {
          id: 'sl-dm-erik',
          name: 'Erik',
          dm: true,
          messages: [
            {
              author: 'Angela',
              text: 'Erik, husk møtet!',
              time: '4. juni 11:32',
            },
            {
              author: 'Erik',
              suspectId: 'erik',
              text: 'Helsike, eg kjappar meg! 🏃',
              time: '4. juni 11:45',
            },
            {
              author: 'Angela',
              text:
                'Bra møte i dag! Ikke glem arbeidsoppgavene dine. Maud virket også veldig ' +
                'fornøyd med innsatsen.',
              time: '4. juni 18:12',
            },
            {
              author: 'Erik',
              suspectId: 'erik',
              text: '',
              // Legg gif-en i public/case/memes/ (lokal fil anbefales — funker
              // også med full https://-URL hvis du heller vil det).
              img: 'case/memes/party.gif',
              time: '4. juni 18:14',
            },
            {
              author: 'Erik',
              suspectId: 'erik',
              text:
                'Kan jeg få tilgang på noen av medlemssystemene og slikt? Jeg må sjekke noe ' +
                'småting. Lover å ikke ødelegge noe!',
              time: '18. juni 13:05',
            },
            {
              author: 'Angela',
              text: 'Jada burde ikke være noe problem det. Jeg fikser i systemene våre',
              time: '18. juni 13:20',
            },
            {
              author: 'Erik',
              suspectId: 'erik',
              text: 'Takk!',
              time: '18. juni 13:21',
            },
            {
              author: 'Erik',
              suspectId: 'erik',
              text: 'Ligg SharePoint nede no?',
              time: '22. juni 09:58',
            },
            {
              author: 'Angela',
              text: 'Hacker meg inn i Microsoft og sjekker, 2 sek...',
              time: '22. juni 10:01',
            },
            {
              author: 'Angela',
              text:
                'Jepp virker sånn, en ansatt der glemte noen .env filer, to sek jeg får vel ' +
                'fikse det for dem',
              time: '22. juni 10:04',
            },
            {
              author: 'Angela',
              text:
                'Sånn! SharePoint skal være oppe igjen, og Microsoft har blitt fakturert for ' +
                'arbeidet mitt. Nå blir det gratis champagne på alle på GF!',
              time: '22. juni 10:12',
            },
            {
              author: 'Erik',
              suspectId: 'erik',
              text: 'Nei no har eg sett det òg!',
              time: '22. juni 10:13',
            },
            {
              author: 'Angela',
              text:
                'Hvorfor i ANSA-Vedtekter-2025-2026-1.pdf står det «Daglig leiing» rett over §55? ' +
                'Har du i all hemmelighet endret vedtektene til å bli mer nynorsk??',
              time: '28. juli 14:51',
              seenBy: 'Erik',
            },
          ],
        },
        {
          // Flyttet hit fra WhatsApp: vedtektsforslag-spørsmålet er en ANSA-sak.
          // ↳ bekrefter Andreas sitt eget utsagn («Det var en del vedtektsforslag jeg
          //   ikke fikk sendt …») og Sverre («irritert på Andreas … noe om vedtekter og
          //   at han var forsinket»). Resten av tråden er ren støy.
          id: 'sl-dm-andreas',
          name: 'Andreas',
          dm: true,
          messages: [
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: 'Er det wifi i plenumssalen?',
              time: '2. juni 10:14',
            },
            {
              author: 'Angela',
              text: 'Ja. Passordet står i #generelt.',
              time: '2. juni 10:40',
            },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: 'Jeg finner ikke #generelt',
              time: '2. juni 10:41',
            },
            {
              author: 'Angela',
              text: 'Det er en kanal. Du er med i den.',
              time: '2. juni 10:44',
            },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: 'Åh',
              time: '2. juni 10:45',
            },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: 'Er det dresskode på banketten??',
              time: '5. juni 21:02',
            },
            {
              author: 'Angela',
              text: 'Pent. Ikke smoking, ikke joggebukse.',
              time: '5. juni 21:30',
            },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: 'Så joggebukse med blazer?',
              time: '5. juni 21:31',
            },
            { author: 'Angela', text: 'Nei.', time: '5. juni 21:33' },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: 'Noteres 🫡',
              time: '5. juni 21:34',
            },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text:
                'Du som er ANSA proff, vet du om det er for sent å sende inn vedtektsforslag? ' +
                'Står åtte uker på nettsiden (aka utgått frist), men tenkte det var greit å ' +
                'spørre i tilfelle',
              time: '11. juni 16:51',
            },
            {
              author: 'Angela',
              text: 'Det er dessverre for sent, men lov å ta med juice til åpen debatt!!',
              time: '12. juni 14:55',
            },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: 'Blir det pub quiz på GF i år?',
              time: '20. juni 19:12',
            },
            {
              author: 'Angela',
              text: 'Det står ikke i tidsplanen nei.',
              time: '20. juni 19:40',
            },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: 'Men det STÅR ikke at det ikke er pub quiz heller',
              time: '20. juni 19:41',
            },
            { author: 'Angela', text: 'Teknisk sant.', time: '20. juni 19:44' },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: 'Hvem er møteleder i år?',
              time: '9. juli 12:30',
            },
            {
              author: 'Angela',
              text: 'Står i sakspapirene.',
              time: '9. juli 13:05',
            },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: 'Har lest sakspapirene',
              time: '9. juli 13:06',
            },
            {
              author: 'Angela',
              text: 'Tydeligvis ikke da.',
              time: '9. juli 13:07',
            },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: '',
              // Bytt gjerne til en annen fil i public/case/memes/.
              img: 'case/memes/axnus4.jpg',
              time: '9. juli 13:09',
            },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: 'Tar du med Vanish? Sånn i tilfelle',
              time: '24. juli 23:40',
            },
            {
              author: 'Angela',
              text: 'Hvorfor i alle dager',
              time: '25. juli 08:02',
            },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: 'Bare i tilfelle 🙂',
              time: '25. juli 08:15',
            },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: 'Viktige saker: https://kunde.byggekamera.no/?p=1171&c=1579',
              time: '27. juli 08:15',
            },
            {
              author: 'Andreas',
              suspectId: 'andreas',
              text: 'Byggekameraet til NOS (Nye Oslo Spektrum). Eneste vi gjør på jobb',
              time: '27. juli 08:15',
            },
          ],
        },
        // ------------------------------------------------------------------
        // STØY-DM-ER. Mest hverdagslig GF-mas, men noen meldinger bekrefter
        // ting vitnene sier (merket «↳ bekrefter …» i kommentar). Ingen av
        // motpartene er mistenkte, og ingenting her motsier tidslinjen.
        // ------------------------------------------------------------------
        {
          id: 'sl-dm-brage',
          name: 'Brage Johnsen',
          dm: true,
          messages: [
            {
              author: 'Angela',
              text: 'Brage! Har du regnearket fra ANSA Frankrike? Jeg trenger tallene før tirsdag.',
              time: '12. juli 09:20',
            },
            {
              author: 'Brage Johnsen',
              text: 'Jada kommer i morgen. Oskar sitter på den siste fila tror jeg',
              time: '12. juli 09:44',
            },
            {
              author: 'Angela',
              text: 'Takk <3',
              time: '12. juli 09:45',
            },
            {
              author: 'Brage Johnsen',
              text: 'Er det lov å ta med gitar? Spør for gjengen.',
              time: '21. juli 20:11',
            },
            {
              author: 'Angela',
              text: 'Ta med. Men ikke etter midnatt.',
              time: '21. juli 20:30',
            },
            {
              author: 'Brage Johnsen',
              // ↳ bekrefter Sverre: «Vi har fått klager fra folk som Brage Johnsen om at
              //   det kan være farlig» (nattbadingen).
              text:
                'Nei jeg må bare si det én gang til før helgen: jeg synes fortsatt nattbadinga ' +
                'er en temmelig dårlig idé. Det er stummende mørkt der nede og ingen har ' +
                'ordentlig oversikt. Jeg har sagt det til Sverre også.',
              time: 'ons 22:14',
            },
            {
              author: 'Angela',
              text:
                'Jeg skjønner deg helt. Vi tar det opp på møtet med de ansatte og hovedstyret, ' +
                'men jeg kan ikke love noe — folk elsker det jo. Vi har hvertfall edruvakt.',
              time: 'tor 07:52',
            },
            {
              author: 'Brage Johnsen',
              text: 'Det er det jeg sier hvert år og',
              time: 'tor 07:58',
            },
            {
              author: 'Angela',
              text: 'Og hvert år hører jeg på deg og gjør ingenting. Konsekvent hvertfall!',
              time: 'tor 08:01',
            },
          ],
        },
        {
          id: 'sl-dm-ingeborg',
          name: 'Ingeborg Frogner Dahl-Hilstad',
          dm: true,
          messages: [
            {
              author: 'Ingeborg Frogner Dahl-Hilstad',
              text: 'Har du malen for saksframlegg? Den gamle har fortsatt logoen fra 2019.',
              time: '18. juli 10:15',
            },
            {
              author: 'Angela',
              text: 'Ligger i driven under «Maler_NY». Ikke «Maler».',
              time: '18. juli 10:31',
            },
            {
              author: 'Ingeborg Frogner Dahl-Hilstad',
              text: 'Det er to mapper som heter «Maler_NY».',
              time: '18. juli 10:36',
            },
            {
              author: 'Angela',
              text: 'Den med emoji i navnet.',
              time: '18. juli 10:38',
            },
            {
              author: 'Ingeborg Frogner Dahl-Hilstad',
              text: 'Begge har emoji.',
              time: '18. juli 10:39',
            },
            {
              author: 'Angela',
              text: 'Jeg ringer deg.',
              time: '18. juli 10:40',
            },
            {
              author: 'Ingeborg Frogner Dahl-Hilstad',
              // ↳ bekrefter vedtekt/nynorsk-tråden (Erik-DM-en, e-posten, og det Maud,
              //   Sverre og Erik sier om vedtektskonflikten).
              text:
                'Du — har du sett at §55 har fått ny ordlyd i den siste vedtektsfila? Det står ' +
                '«Daglig leiing» nå. Jeg finner ikke vedtaket det skulle komme fra noe sted.',
              time: '28. juli 13:40',
            },
            {
              author: 'Angela',
              text: 'Jeg lurer på akkurat det samme. Jeg spør Erik direkte.',
              time: '28. juli 14:48',
            },
            {
              author: 'Ingeborg Frogner Dahl-Hilstad',
              text:
                'Fint. Jeg elsker nynorsk, men jeg elsker protokoll litt mer. Det skal jo stå ' +
                'i et referat et sted.',
              time: '28. juli 15:02',
            },
          ],
        },
        {
          id: 'sl-dm-henriette',
          name: 'Henriette Moe Schjelderup',
          dm: true,
          messages: [
            {
              author: 'Henriette Moe Schjelderup',
              text: 'Jeg kan ta edruvakt lørdag hvis ingen andre gidder. Har gjort det før, går helt fint.',
              time: 'man 19:40',
            },
            {
              author: 'Angela',
              text: 'Du er gull <3 Jeg setter deg opp.',
              time: 'man 19:52',
            },
            {
              author: 'Henriette Moe Schjelderup',
              // ↳ bekrefter Runills notater: «18:42 – Hadde samtale med edruvakt Henriette
              //   angående tips.»
              text:
                'Runill ville gå gjennom noen tips med oss edruvakter før banketten. Rundt ' +
                '18:30 sa hun. Skal jeg si det videre til de andre?',
              time: 'tor 15:20',
            },
            {
              author: 'Angela',
              text: 'Ja gjør det. Runill er kjempegod på sånt.',
              time: 'tor 15:26',
            },
            {
              author: 'Henriette Moe Schjelderup',
              // ↳ bekrefter Runills notater: «21:02 – Edruvakt måtte byttes, rakk ikke nytt møte.»
              text:
                'Nei her ble det rot. Jeg måtte bytte vakt i siste sekund, så jeg rakk ikke det ' +
                'nye møtet. Har sagt det til Runill. Beklager assa!',
              time: 'fre 21:02',
            },
            {
              author: 'Angela',
              text: 'Helt greit! Det ordner seg. Takk for at du sier det.',
              time: 'fre 21:09',
            },
          ],
        },
        {
          id: 'sl-dm-jofrid',
          name: 'Jofrid',
          dm: true,
          messages: [
            {
              author: 'Jofrid',
              text:
                'Hei Angela 🌸 Bare en liten sjekk-inn. Du har jobbet nokså mye nå, og jeg ser ' +
                'deg svare på meldinger klokka to om natta. Husk å spise noe.',
              time: '24. juli 11:12',
            },
            {
              author: 'Angela',
              text: 'Jada jeg spiser! Jeg har til og med laget GitHub Issues for måltidene. Funker fett.',
              time: '24. juli 12:30',
            },
            {
              author: 'Jofrid',
              text: 'Det var ikke helt svaret jeg håpet på 😄',
              time: '24. juli 12:41',
            },
            {
              author: 'Jofrid',
              text: 'Jeg tar med kakao og pledd til stillerommet i tilfelle noen trenger en pause 🌸',
              time: 'tor 09:05',
            },
            {
              author: 'Angela',
              text: 'Du er grunnen til at folk kommer tilbake hvert år <3',
              time: 'tor 09:20',
            },
          ],
        },
        {
          id: 'sl-dm-wiktor',
          name: 'Wiktor Jankowski',
          dm: true,
          messages: [
            {
              author: 'Wiktor Jankowski',
              // ↳ bekrefter Anna: «Wiktor var det også, og forklarte at det var fordi han
              //   hadde vunnet i dataspillet CIV VII.»
              text: 'ANGELA. Jeg vant i CIV mot Andreas. Han tar det ikke særlig bra.',
              time: '26. juli 23:48',
            },
            {
              author: 'Angela',
              text: 'HAHAHA. Hvor lang tid tok den runden?',
              time: '27. juli 08:14',
            },
            {
              author: 'Wiktor Jankowski',
              text: 'Sju timer? Vi begynte rett etter middag.',
              time: '27. juli 08:20',
            },
            {
              author: 'Angela',
              text: 'Sju TIMER. Skaff dere liv.',
              time: '27. juli 08:22',
            },
            {
              author: 'Wiktor Jankowski',
              text: 'Dette ER livene våre. Andreas krever omkamp på GF forresten, så det blir en laaang helg',
              time: '27. juli 08:31',
            },
            {
              author: 'Angela',
              text: 'Men hva faen da',
              time: '27. juli 08:35',
            },
            {
              author: 'Wiktor Jankowski',
              text: 'Vi finner et rom 🫡',
              time: '27. juli 08:36',
            },
          ],
        },
        {
          id: 'sl-dm-kaja',
          name: 'Hidde Bakker',
          dm: true,
          messages: [
            {
              author: 'Hidde Bakker',
              text: 'Hei! Vi kommer en del fra ANSA Benelux. Er det nok kapasitet i baren?',
              time: '20. juli 16:02',
            },
            {
              author: 'Angela',
              // ↳ bekrefter Ane: «Køen i baren var noe helt utrolig lang — spesielt fra
              //   ANSA Benelux.»
              text: 'Det er én bar og én bartender. Så nei 😅 Kom tidlig, eller kom med tålmodighet.',
              time: '20. juli 16:20',
            },
            {
              author: 'Hidde Bakker',
              text: 'Vi tar med tålmodighet og masse lægs',
              time: '20. juli 16:24',
            },
            {
              author: 'Hidde Bakker',
              text: 'Kan vi ta med egen høyttaler til nach?',
              time: 'tir 21:33',
            },
            { author: 'Angela', text: 'Bro', time: 'tir 21:40' },
            {
              author: 'Hidde Bakker',
              text: 'Verdt et forsøk 🙏',
              time: 'tir 21:41',
            },
          ],
        },
        {
          // Jonathan er førstegangsdelegat og har ingen rolle i planleggingen — bare
          // en nervøs nykommer som spør om alt. Ren støy.
          id: 'sl-dm-jonathan',
          name: 'Jonathan Nagelgaard',
          dm: true,
          messages: [
            {
              author: 'Jonathan Nagelgaard',
              text:
                'Hei! Beklager at jeg spør deg om alt, men det er første gang jeg skal på GF og ' +
                'jeg skjønner nokså lite. Er det dumt å spørre hva GF står for?',
              time: '14. juli 20:12',
            },
            {
              author: 'Angela',
              text: 'Generalforsamling! Og nei, det er ikke dumt. Halvparten sier bare «GF» og håper på det beste.',
              time: '14. juli 20:40',
            },
            {
              author: 'Jonathan Nagelgaard',
              text: 'Godt å høre. Neste spørsmål: hva er en forretningsorden',
              time: '14. juli 20:41',
            },
            {
              author: 'Angela',
              text: 'Et regelverk for møtet. Ingen har lest det. Møteledelsen har lest det.',
              time: '14. juli 20:52',
            },
            {
              author: 'Jonathan Nagelgaard',
              text: 'Så jeg trenger ikke lese det?',
              time: '14. juli 20:53',
            },
            {
              author: 'Angela',
              text: 'Du BØR lese det. Du kommer ikke til å lese det.',
              time: '14. juli 20:55',
            },
            {
              author: 'Jonathan Nagelgaard',
              text: 'Nei det er nok riktig det 😅',
              time: '14. juli 20:56',
            },
            {
              author: 'Jonathan Nagelgaard',
              text:
                'Må man si noe fra talerstolen? For jeg har egentlig ingenting å si, jeg har mest ' +
                'lyst til å sitte og se på',
              time: '19. juli 11:30',
            },
            {
              author: 'Angela',
              text:
                'Du må ingenting. Det er helt lov å bare følge med hele helgen. De fleste som ' +
                'snakker mest er de som har vært der ti ganger.',
              time: '19. juli 12:04',
            },
            {
              author: 'Jonathan Nagelgaard',
              text: 'Fint. Hvor mange er det egentlig der?',
              time: '19. juli 12:05',
            },
            { author: 'Angela', text: 'Rundt 100.', time: '19. juli 12:11' },
            {
              author: 'Jonathan Nagelgaard',
              text: '100???',
              time: '19. juli 12:11',
            },
            {
              author: 'Jonathan Nagelgaard',
              text: 'Jeg kjenner jo ingen assa',
              time: '19. juli 12:12',
            },
            {
              author: 'Angela',
              text:
                'Ingen kjente noen første gang. Du kommer til å kjenne halve Europa innen lørdag, ' +
                'det er sånn det funker.',
              time: '19. juli 12:30',
            },
            {
              author: 'Jonathan Nagelgaard',
              text: 'Blir det noe sosialt eller er det bare møter i tre dager',
              time: '26. juli 22:14',
            },
            {
              author: 'Angela',
              text: 'Det er bankett på lørdagen. Og folk finner alltid på noe etterpå.',
              time: '27. juli 08:20',
            },
            {
              author: 'Jonathan Nagelgaard',
              text: 'Er det gratis mat?',
              time: '27. juli 08:21',
            },
            {
              author: 'Angela',
              text: 'Ja. Kylling og ris. Mye kylling og ris.',
              time: '27. juli 08:24',
            },
            {
              author: 'Jonathan Nagelgaard',
              text: 'Elsker kylling og ris 🙏',
              time: '27. juli 08:25',
            },
            {
              author: 'Jonathan Nagelgaard',
              text: 'Siste spørsmål lover: er det noen som sjekker om man har lest sakspapirene',
              time: 'tor 23:41',
            },
            { author: 'Angela', text: 'Nei.', time: 'fre 07:50' },
            { author: 'Jonathan Nagelgaard', text: 'Nice', time: 'fre 07:52' },
            {
              author: 'Angela',
              text: 'Men det er 224 sider, så jeg hadde begynt nå hvis jeg var deg.',
              time: 'fre 07:53',
            },
            { author: 'Jonathan Nagelgaard', text: 'Å', time: 'fre 07:55' },
          ],
        },
        {
          id: 'sl-dm-bendik',
          name: 'Lorenz Strohe',
          dm: true,
          messages: [
            {
              author: 'Lorenz Strohe',
              text: 'Hei. Kvitteringene fra reisen din mangler MVA-felt, så jeg får ikke ført dem.',
              time: '15. juli 11:20',
            },
            {
              author: 'Angela',
              text: 'Sender på nytt i kveld. Jeg har dem i en konvolutt et eller annet sted.',
              time: '15. juli 12:05',
            },
            {
              author: 'Lorenz Strohe',
              text: 'Bilde av kvitteringen holder. Trenger ikke originalen.',
              time: '15. juli 12:09',
            },
            {
              author: 'Angela',
              text: 'Det burde jeg visst for tre år siden assa',
              time: '15. juli 12:11',
            },
            {
              author: 'Lorenz Strohe',
              text: 'Det står i rutinen. Som ingen leser. Jeg har lagt meg til ro med det.',
              time: '15. juli 12:15',
              edited: true,
            },
          ],
        },
      ],
    },
  },

  // Sendeplan til «Radio France»-appen. Legg .mp3-filene i public/case/spotify/
  // og pek på dem her. `title`/`artist` er valgfritt (utledes ellers fra filnavnet).
  spotify: [
    {
      src: 'case/spotify/chanson_1.m4a',
      title: "On va s'aimer",
      artist: 'Gilbert Montagné',
    },
    {
      src: 'case/spotify/chanson_2.m4a',
      title: 'Nuit de folie',
      artist: 'Début De Soirée',
    },
    {
      src: 'case/spotify/chanson_3.m4a',
      title: 'Les démons de minuit',
      artist: 'Images',
    },
    {
      src: 'case/spotify/chanson_4.m4a',
      title: 'Emmenez-moi',
      artist: 'Charles Aznavour',
    },
    {
      src: 'case/spotify/chanson_5.m4a',
      title: "Dans les yeux d'Émilie",
      artist: 'Joe Dassin',
    },
    {
      src: 'case/spotify/chanson_6.m4a',
      title: 'Destinée',
      artist: 'Vladimir Cosma, Guy Marchand',
    },
    {
      src: 'case/spotify/chanson_7.m4a',
      title: 'Les lacs du Connemara',
      artist: 'Michel   Sardou',
    },
    {
      src: 'case/spotify/chanson_8.m4a',
      title: 'Partenaire Particulier',
      artist: 'Partenaire Particulier',
    },
    { src: 'case/spotify/chanson_9.m4a', title: 'Aline', artist: 'Christophe' },
    {
      src: 'case/spotify/chanson_10.m4a',
      title: 'Hier encore',
      artist: 'Charles Aznavour',
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
      '**Takk for at du etterforsket med oss!**',
  },
}
