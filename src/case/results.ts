// De EKTE slutt-tallene fra spillet (28. juli – 2. aug 2026), eksportert fra
// Supabase 4. aug 2026 via `get_results`/`get_free_text` før backenden ble
// pensjonert. Siden er nå helt statisk: Excel-appen og «du stemte som X %»
// leser herfra i stedet for fra en server.
//
// `choice`-verdiene matcher `option.id` i src/case/manifest.ts.

export interface ResultRow {
  choice: string
  n: number
}

/** Stemmetall per dag (kun dager med avstemning). Dag 2 var fritekst. */
export const FINAL_RESULTS: Record<number, ResultRow[]> = {
  1: [
    { choice: 'hedvig', n: 5 },
    { choice: 'runill', n: 4 },
    { choice: 'sverre', n: 3 },
    { choice: 'erik', n: 2 },
    { choice: 'anna', n: 2 },
    { choice: 'ingen', n: 2 },
    { choice: 'maud', n: 1 },
    { choice: 'ane', n: 1 },
    { choice: 'andreas', n: 1 },
  ],
  2: [{ choice: '(fritekst)', n: 6 }],
  3: [
    { choice: 'maud', n: 2 },
    { choice: 'sverre', n: 1 },
  ],
}

/** Innsendte fritekst-svar (anonymisert), per dag. */
export const FINAL_FREE_TEXT: Record<number, string[]> = {
  2: [
    'Forgiftning',
    'Giftig sko',
    'Bedøvet, deretter slo hodet mot et objekt i nærheten',
    'Commotio cordis',
    'Ble slått ut av noe som ble puttet i drinken hennes tidligere, og så Slått i hodet med et trofé (sjalusimord??)',
    'Hun ble forgiftet av pillen til Runill.',
  ],
}
