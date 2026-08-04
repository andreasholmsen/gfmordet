import { useSettings } from './SettingsContext'

// ---------------------------------------------------------------------------
//  Nynorsk-modus for MENYENE (ikke sakens innhold — det skrives i manifestet).
//  Kun UI-kromet oversettes: oppgavelinje, dialoger, mappe-chrome, prompts og
//  Innstillinger-appen. `{x}`-plassholdere fylles inn via t(key, { x: ... }).
// ---------------------------------------------------------------------------

export type Lang = 'nb' | 'nn'

const nb = {
  // felles
  cancel: 'Avbryt',
  backToFolder: '← Tilbake til mappen',
  backTo: '← Tilbake til {name}',

  // nedtellingsforsiden (GF-mordet 2027)
  cd27Days: 'dager',
  cd27Hours: 'timer',
  cd27Min: 'min',
  cd27Sec: 'sek',
  cd27Enter: 'Gå til 2026-utgaven →',
  cd27Syncing: 'synkroniserer klokke …',

  // oppgavelinjen
  dayStatus: 'Dag {n} av {total} åpen',

  // lyd-prompt (førstegang)
  soundTitle: 'Lyd',
  soundQuestion: 'Spillet er best med lyd — vil du skru den på?',
  soundHint: 'Du kan når som helst endre dette i ⚙️ Innstillinger.',
  soundYes: '🔊 Ja takk (anbefalt)',
  soundNo: '🔇 Uten lyd',

  // skrivebordet
  socialFolder: 'Sosiale medier',
  victimFiles: 'Offerets filer',
  minesweeper: 'Minesveiper',
  menuRefresh: 'Oppdater',
  menuTrash: 'Tøm papirkurv',
  menuAbout: 'Om denne PC-en',
  trashTitle: 'Papirkurv',
  trashEmpty: 'Papirkurven er allerede tom.',
  trashNote: '(Bevis kastes aldri i denne saken — alt kan bli viktig.)',
  lockedTitle: 'Låst',
  lockedBody1: 'Etterforskningen har ikke startet ennå.',
  lockedBody2: 'Åpne 📨 START HER først.',
  aboutLine1: 'Sikkert terminalmiljø for etterforskning. Bevismateriale slippes dag for dag. Alle handlinger logges (på liksom 😉).',
  aboutLine2: 'Bygget med kaffe og altfor lite søvn. Lykke til, etterforsker.',

  // dag-mapper
  unknownFolder: 'Ukjent mappe',
  folderNotExist: 'Denne mappen finnes ikke.',
  notOpenYet: 'er ikke åpnet ennå.',
  comeBack: 'Svar på spørsmålet for dagen før i 🚓 POLITI-appen, så låses denne dagen opp.',
  emptyFolder: 'Ingen dokumenter i denne mappen.',
  docsAfterReveal: '🔒 Politiets sluttrapport låses opp her når du har åpnet saken i POLITI-appen.',
  docCount1: '{n} dokument',
  docCountN: '{n} dokumenter',

  // Innstillinger-appen (på Angelas mobil)
  settingsApp: 'Innstillinger',
  settingsLang: 'Språk i menyene',
  settingsLangNote: 'Gjelder bare menyene — sakens innhold er som det er.',
  settingsSound: 'Lyd',
  on: 'På',
  off: 'Av',
  settingsReset: 'Nullstill fremdrift',
  settingsResetNote:
    'Sletter svarene og fremdriften din på denne enheten, så mysteriet kan utforskes fra start.',
  resetConfirmBody:
    'Er du sikker? Svarene dine, opplåste dager og hack-fremdriften slettes fra denne enheten. Språk- og lydvalget beholdes.',
  resetConfirmYes: 'Ja, nullstill',

  // Larry-siden (easter egget). Han tilbyr «hjelp», gjør ingenting, og sier
  // rett ut at han noterte at du spurte.
  larryTitle: 'ukjent prosess',
  larryOffer:
    'Vil du ha hjelp? Jeg kan fjerne halvparten av vitnene for deg … Vil du det?',
  larryYes: 'Ja',
  larryNo: 'Nei',
  larryDeclined: 'Klokt. Jeg hadde ikke gjort det for deg likevel.',
  larryReveal1: 'Ha. Je vais te toucher la nuit.',
  larryReveal2: 'Je te jette une malédiction.',
  larryReveal3: 'Patetisk... Jeg ville aldri hjulpet deg',}

const nn: typeof nb = {
  cancel: 'Avbryt',
  backToFolder: '← Tilbake til mappa',
  backTo: '← Tilbake til {name}',

  cd27Days: 'dagar',
  cd27Hours: 'timar',
  cd27Min: 'min',
  cd27Sec: 'sek',
  cd27Enter: 'Gå til 2026-utgåva →',
  cd27Syncing: 'synkroniserer klokke …',

  dayStatus: 'Dag {n} av {total} open',

  soundTitle: 'Lyd',
  soundQuestion: 'Spelet er best med lyd — vil du skru han på?',
  soundHint: 'Du kan når som helst endre dette i ⚙️ Innstillingar.',
  soundYes: '🔊 Ja takk (tilrådd)',
  soundNo: '🔇 Utan lyd',

  socialFolder: 'Sosiale medium',
  victimFiles: 'Offeret sine filer',
  minesweeper: 'Minesveipar',
  menuRefresh: 'Oppdater',
  menuTrash: 'Tøm papirkorga',
  menuAbout: 'Om denne PC-en',
  trashTitle: 'Papirkorg',
  trashEmpty: 'Papirkorga er allereie tom.',
  trashNote: '(Bevis blir aldri kasta i denne saka — alt kan bli viktig.)',
  lockedTitle: 'Låst',
  lockedBody1: 'Etterforskinga har ikkje starta enno.',
  lockedBody2: 'Opne 📨 START HER først.',
  aboutLine1: 'Sikkert terminalmiljø for etterforsking. Bevismateriale blir sleppt dag for dag. Alle handlingar blir logga (på liksom 😉).',
  aboutLine2: 'Bygd med kaffi og altfor lite svevn. Lykke til, etterforskar.',

  unknownFolder: 'Ukjend mappe',
  folderNotExist: 'Denne mappa finst ikkje.',
  notOpenYet: 'er ikkje opna enno.',
  comeBack: 'Svar på spørsmålet for dagen før i 🚓 POLITI-appen, så blir denne dagen låst opp.',
  emptyFolder: 'Ingen dokument i denne mappa.',
  docsAfterReveal: '🔒 Sluttrapporten til politiet blir låst opp her når du har opna saka i POLITI-appen.',
  docCount1: '{n} dokument',
  docCountN: '{n} dokument',

  settingsApp: 'Innstillingar',
  settingsLang: 'Språk i menyane',
  settingsLangNote: 'Gjeld berre menyane — innhaldet i saka er som det er.',
  settingsSound: 'Lyd',
  on: 'På',
  off: 'Av',
  settingsReset: 'Nullstill framdrift',
  settingsResetNote:
    'Slettar svara og framdrifta di på denne eininga, så mysteriet kan utforskast frå start.',
  resetConfirmBody:
    'Er du sikker? Svara dine, opplåste dagar og hack-framdrifta blir sletta frå denne eininga. Språk- og lydvalet blir teke vare på.',
  resetConfirmYes: 'Ja, nullstill',

  larryTitle: 'ukjend prosess',
  larryOffer: 'Vil du ha hjelp? Eg kan fjerne halvparten av vitna for deg … Vil du det?',
  larryYes: 'Ja',
  larryNo: 'Nei',
  larryDeclined: 'Klokt. Eg hadde ikkje gjort det for deg likevel.',
  larryReveal1: 'Ha. Je vais te toucher la nuit.',
  larryReveal2: 'Je jette sur toi une malediction.',
  larryReveal3: 'Patetisk... Eg ville aldri hjelpt deg',}

export type StringKey = keyof typeof nb
const STRINGS: Record<Lang, typeof nb> = { nb, nn }

/** Oversetter-hook: `const t = useT()` → `t('logout')`, `t('backTo', { name })`. */
export function useT() {
  const { lang } = useSettings()
  return (key: StringKey, vars?: Record<string, string | number>): string => {
    let s: string = STRINGS[lang][key] ?? STRINGS.nb[key]
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v))
    return s
  }
}
