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
}

/** Undermappe i en dag-mappe — grupperer dokumenter og gir dem et felles utseende. */
export interface SubfolderDef {
  id: string
  title: string // 'Vitneutsagn'
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
          intro: 'Forklaringer avgitt til politiet. _Minst én av dem lyver._',
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
            'hjelp og ringe ambulanse. På veien dultet jeg borti Anna. Etter resepsjonen ble ' +
            'ringt så løp jeg tilbake. De forstod ikke situasjonen med en gang så det tok ' +
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
          inline:
            '## [RUNILL NOTATER]\n\n' +
            '11:13 –\n\n' +
            '18:12 – Ga ibux til Angela, dobbeltsjekke at alt går bra i morgen\n\n' +
            '18:42 – Hadde samtale med edruvakt Henriette angående tips.\n\n' +
            '21:02 – Edruvakt måtte byttes, rakk ikke nytt møte',
        },
      ],
      question: {
        type: 'multiple_choice',
        prompt: 'Hvem lyver i vitneutsagnet sitt?',
        options: [
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
          { from: 'me', text: 'Skjønner, takk! Er du klar for GF da?', time: '29. juli 11:50' },
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
          { from: 'them', text: 'Heeei! Du ville vel ikke hatt lyst til å bli med til Køben i sommer? 🍷', time: '14. mai 18:22' },
          { from: 'them', text: 'Du la igjen laderen din på kjøkkenet btw', time: '19. mai 10:05', unread: true },
        ],
      },

      // ---- Støy: Angela svarer aldri — innboksen flommer over av uleste -----
      {
        id: 'wa-amelia',
        name: 'Amelia ❤️',
        avatar: '👩',
        subtitle: 'sist sett i dag 08:15',
        messages: [
          { from: 'them', text: '你好！你能帮我做作业吗？', time: '2. juni 19:04', unread: true },
          { from: 'them', text: 'Angela???', time: '5. juni 12:31', unread: true },
        ],
      },
      {
        id: 'wa-gruppe-coloc',
        name: 'Coloc 🏠🔥',
        avatar: '🏠',
        subtitle: 'Maia, Sara, deg',
        messages: [
          { from: 'them', author: 'Sara', text: 'QUI a fini le lait ??', time: '26. mars 08:31', unread: true },
          { from: 'them', author: 'Maia 🏠', text: '??', time: '26. mars 09:12', unread: true },
        ],
      },
      {
        id: 'wa-paul',
        name: 'Paul',
        avatar: '⚽',
        subtitle: 'vue le 26 juillet',
        messages: [
          { from: 'them', text: 'yo, tu viens au reunion de PIR aujourd\'hui ? Perso j\'ai rien fait', time: '10. april 12:50', unread: true },
          { from: 'them', text: '??', time: '10. april 14:19', unread: true },
        ],
      },
      {
        id: 'wa-paulrohel',
        name: 'Paul Rohel',
        avatar: '🤓',
        subtitle: 'vue hier à 18:33',
        messages: [
          { from: 'them', text: 'Salut Angela, n\'oublie pas d\'installer l\'appli Hevy', time: '21. november 2025 12:20' },
                    { from: 'me', text: 'Oui, comme ca je peux voir le 300kg leg press d\'Andreas!', time: '21. november 2025 19:20' },
        ],
      },
      {
        id: 'wa-carole',
        name: 'Carole 🏃‍♀️',
        avatar: '🏃‍♀️',
        subtitle: 'vue aujourd’hui à 07:02',
        messages: [
          { from: 'them', text: 'Coucou! T\'étais pas en cours aujourd\'hui, est-ce que tout va bien ?', time: '19. mars 20:12', unread: true },
        ],
      },
      {
        id: 'wa-malaumne',
        name: 'Malaumne',
        avatar: '🧑‍🎨',
        subtitle: 'vue le 20 juillet',
        messages: [
          { from: 'them', text: 'Si j\'emprunte ton passeport, je pourrai recevoir des tutorats gratuitement??', time: '17. april 16:30', unread: true },
        ],
      },
      {
        id: 'wa-claire',
        name: 'Claire',
        avatar: '👩‍🦰',
        subtitle: 'vue aujourd’hui à 09:40',
        messages: [
          { from: 'them', text: 'Coucou ! On se fait un café cette semaine ? ☕', time: '3. mai 11:15', unread: true },
          { from: 'them', text: 'Angela ?? T’es vivante ?', time: '9. mai 14:02', unread: true },
          { from: 'them', text: 'Bon. Je prends ça pour un non 😤', time: '16. mai 19:55', unread: true },
        ],
      },
      {
        id: 'wa-alice',
        name: 'Alice',
        avatar: '👧',
        subtitle: 'vue hier à 22:10',
        messages: [
          { from: 'them', text: 'Soirée chez moi vendredi, tu viens ? 🎉', time: '10. juli 15:44', unread: true },
        ],
      },
      {
        id: 'wa-andreas',
        name: 'Andreas',
        suspectId: 'andreas',
        subtitle: 'sist sett i dag 07:58',
        messages: [
          { from: 'them', text: 'Jeg fant en komando på git som fikser alt!! Magisk', time: '13. mars 2025 13:37' },
          { from: 'me', text: 'Ahah hvilken?', time: '13. mars 2025 18:12'},
          { from: 'them', text: '\"git push origin main --force\"! Men nå fungerer ingenting lenger. Gjorde du noe?', time: '13. mars 2025 18:13' },
          { from: 'me', text: 'Mais bah tu es idiot, je sais même pas pourquoi t\'es en IR💀', time: '13. mars 2025 19:02'},
          { from: 'them', text: 'Moi un idiot?? C\'est toi qui a mis des choses dans ma branche!', time: '24. juli 17:26' },
          { from: 'me', text: 'Vi fikk en A lol, chillern da', time: '22. mars 2025 17:26' },
          { from: 'them', text: 'LETSGOO', time: '22. mars 2025 18:01' },
          { from: 'them', text: 'Gratulerer med dagen!!', time: '25. mars 2025 18:01' },
          { from: 'them', text: 'Du som er ANSA proff, vet du om det er for sent å sende inn vedtektsforslag? Står åtte uker på nettsiden (aka utgått frist), men tenkte det var greit å spørre i tilfelle', time: '11. juni 2026 16:51' },
          { from: 'me', text: 'Det er dessverre for sent, men lov å ta med juice til åpen debatt!!', time: '12. juni 2026 14:55' },
          { from: 'me', text: 'Håper du koser deg så langt i Noreg', time: '12. juni 2026 14:56' },
          { from: 'them', text: 'Jeg er klar til å bestille! Fikse i morgen?😆', time: '13. juni 2026 00:37' },
          { from: 'them', text: 'Blir kjempebra. Får fikse litt god stemning blant oss franskmenn🤗 vi blir vel sånn 20 stk', time: '13. juni 2026 00:37' },
          { from: 'them', text: 'Hvor mye utestenging av ikke-franskmenn kan jeg gjøre?', time: '13. juni 2026 00:38' },
          { from: 'them', text: 'Masse! Men savner jo deg da🫣 blir godt å se dere alle igjen', time: '13. juni 2026 00:38' },
          { from: 'me', text: 'Aw det blir fint å se deg igjen!! Gleder meg til å komme på besøk i Adamstua😎', time: '14. juni 2026 22:10' },
          { from: 'me', text: 'Jaa herregud, vi er helt sjukt mange!!!', time: '14. juni 2026 22:10' },
          { from: 'me', text: 'Du får lese hva som står om utestening av ikke-franskmenn i vedtektene:))', time: '14. juni 2026 22:11' },
          { from: 'me', text: 'Jeg er veldig klar for å bestille flybilletter i morgen🥰', time: '14. juni 2026 22:11' },
          { from: 'them', text: 'Ingenting sist jeg sjekket😇', time: '15. juni 2026 00:44' },
          { from: 'them', text: 'Supert! Jeg kan ringe deg en gang på ettermiddagen?', time: '15. juni 2026 00:45' },
          { from: 'them', text: 'Husker du forresten om vi skulle leie Airbnb eller om vi kunne låne leilighet osv.?', time: '15. juni 2026 00:45' },
          { from: 'me', text: 'Maia og Wiktor skulle se på Airbnb!', time: '15. juni 2026 14:55' },
          { from: 'me', text: 'Ja, bare å gjøre det!', time: '15. juni 2026 14:55' },
          { from: 'them', text: 'Supert! Spiser om litt også ringer jeg deg etter det🤗', time: '15. juni 2026 17:18' },
          { from: 'me', text: 'Nice!', time: '15. juni 2026 17:38' },
        ],
      },
      {
        id: 'wa-gruppe-toulouse',
        name: 'Kremen av promo 60',
        avatar: '👥',
        subtitle: 'Maia, Brage, Andreas, Aleksander, Wiktor, Svea, Oskar, deg',
        messages: [
          { from: 'them', author: 'Maia Vejlgaard Evensen', text: 'Nach hos oss Angela?', time: '17.10.2025 23:26' },
          { from: 'me', text: 'Vi kommer!', time: '17.10.2025 23:29' },
          { from: 'them', author: 'Brage Flønæs Johnsen', text: 'Besteforeldre på tur her', time: '17.10.2025 23:30' },
          { from: 'me', text: 'Sure😜❤️', time: '17.10.2025 23:32' },
          { from: 'me', text: 'Er det rett på nach?', time: '17.10.2025 23:33' },
          { from: 'them', author: 'Maia Vejlgaard Evensen', text: 'Tror vi tenkte oss litt ut først…', time: '17.10.2025 23:33' },
          { from: 'me', text: 'Where to?', time: '17.10.2025 23:54' },
          { from: 'them', author: 'Andreas Holmsen', text: 'Café oz!', time: '17.10.2025 23:55' },
          { from: 'them', author: 'Brage Flønæs Johnsen', text: 'Branle-nach hos Angela!', time: '17.10.2025 23:55' },
          { from: 'me', text: 'Ait rett over gata', time: '17.10.2025 23:56' },
          { from: 'me', text: 'Vi sitt å jobbe rævva av oss for én ECTS.', time: '17.12.2025 19:27' },
          { from: 'them', author: 'Aleksander Victor Taban', text: 'prosjektet e 20% av ein ECTS 🤡🤡🤡', time: '17.12.2025 19:28' },
          { from: 'them', author: 'Wiktor Jankowski', text: 'Hahahha hva søøøren', time: '17.12.2025 19:40' },
          { from: 'me', text: 'Lykke til gutter!!🔥', time: '17.12.2025 20:10' },
          { from: 'me', text: 'Jeg turer østover nå🛫🇨🇳. Fikk dessverre ikke sagt hade til alle😔Ønsker dere noen fine siste dager i Toulouse beste gjengen❤️', time: '17.12.2025 20:15' },
          { from: 'them', author: 'Aleksander Victor Taban', text: 'God tur Angela og god jul! ❤️', time: '17.12.2025 20:49' },
          { from: 'them', author: 'Svea Hedda Marie König', text: 'kom godt fram Angela! kos deg masse💕', time: '17.12.2025 20:52' },
          { from: 'them', author: 'Maia Vejlgaard Evensen', text: 'Lykke til gutter, sender varme tanker!', time: '17.12.2025 21:23' },
          { from: 'them', author: 'Aleksander Victor Taban', text: 'Baggislunsj på maille idag? 😁', time: '15.4.2026 10:47', unread: true},
          { from: 'them', author: 'Andreas Holmsen', text: 'Jeg er down', time: '15.4.2026 11:32', unread: true},
          { from: 'them', author: 'Svea Hedda Marie König', text: 'maia og jeg går til butikken nå, skal vi ta med til dere andre?', time: '15.4.2026 12:02', unread: true },
          { from: 'them', author: 'Andreas Holmsen', text: 'Æ tar metroen fra St. Mich nå. Stopper på Rang!', time: '15.4.2026 12:04', unread: true },
          { from: 'them', author: 'Svea Hedda Marie König', text: 'vi er på carrefour:)', time: '15.4.2026 12:09', unread: true },
          { from: 'them', author: 'Svea Hedda Marie König', text: 'vi har fiksa masse mat', time: '15.4.2026 12:21', unread: true },
          { from: 'them', author: 'Oskar Orvik', text: 'Sitter på maille', time: '15.4.2026 12:23', unread: true },
          { from: 'them', author: 'Aleksander Victor Taban', text: 'brage og meg går mod butikken nå', time: '15.4.2026 12:25', unread: true },
          { from: 'them', author: 'Andreas Holmsen', text: 'Vi har alt fikset masse mat', time: '15.4.2026 12:25', unread: true },
          { from: 'them', author: 'Wiktor Jankowski', text: 'Er maille pk?', time: '15.4.2026 12:36', unread: true },
        ],
      },
    ],
    email: [
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
        body:
          'Var det sånn at Broiler var i slekt med deg og du kunne fått han til å opptre på GF-banketten? Jeg tenkte at ',
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
            { author: 'Angela', text: 'Bordplasseringen er klar! Ligger i driven.', time: 'fre 14:05' },
            { author: 'Kari', text: 'Hvorfor sitter jeg ved siden av Per??', time: 'fre 14:22' },
            { author: 'Angela', text: 'Det ordner seg sikkert 😅', time: 'fre 14:30', edited: true },
            { author: 'Per', text: 'Jeg bytter gjerne plass.', time: 'fre 15:01' },
          ],
        },
        {
          id: 'sl-dm-erik',
          name: 'Erik',
          dm: true,
          messages: [
            { author: 'Angela', text: 'Erik, husk møtet!', time: '4. juni 11:32' },
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
            { author: 'Erik', suspectId: 'erik', text: 'Takk!', time: '18. juni 13:21' },
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
              text:
                'Nei no har eg sett det òg!',
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
          id: 'sl-dm-kari',
          name: 'Kari',
          dm: true,
          messages: [
            { author: 'Kari', text: 'Vi må snakke om det du så. IKKE si det til noen.', time: 'fre 23:12' },
            { author: 'Angela', text: 'Jeg lover ingenting.', time: 'lør 08:03' },
          ],
        },
      ],
    },
  },

  // Sendeplan til «Radio France»-appen. Legg .mp3-filene i public/case/spotify/
  // og pek på dem her. `title`/`artist` er valgfritt (utledes ellers fra filnavnet).
  spotify: [
    { src: 'case/spotify/chanson_1.m4a', title: 'On va s\'aimer', artist: 'Gilbert Montagné' },
    { src: 'case/spotify/chanson_2.m4a', title: 'Nuit de folie', artist: 'Début De Soirée' },
    { src: 'case/spotify/chanson_3.m4a', title: 'Les démons de minuit', artist: 'Images' },
    { src: 'case/spotify/chanson_4.m4a', title: 'Emmenez-moi', artist: 'Charles Aznavour' },
    { src: 'case/spotify/chanson_5.m4a', title: 'Dans les yeux d\'Émilie', artist: 'Joe Dassin' },
    { src: 'case/spotify/chanson_6.m4a', title: 'Destinée', artist: 'Vladimir Cosma, Guy Marchand' },
    { src: 'case/spotify/chanson_7.m4a', title: 'Les lacs du Connemara', artist: 'Michel   Sardou' },
    { src: 'case/spotify/chanson_8.m4a', title: 'Partenaire Particulier', artist: 'Partenaire Particulier' },
    { src: 'case/spotify/chanson_9.m4a', title: 'Aline', artist: 'Christophe' },
    { src: 'case/spotify/chanson_10.m4a', title: 'Hier encore', artist: 'Charles Aznavour' },
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
