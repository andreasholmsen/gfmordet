# Skriveguide — få saken til å føles som utforsking, ikke lesing

Dette er en hjelp til å fylle `src/case/manifest.ts` med den ekte saken. Målet er at
spilleren skal føle at hun **snoker seg gjennom bevis**, ikke leser 100 sider. Du kan
plotet allerede — dette handler om hvordan du *porsjonerer og plasserer* det.

> Kjør `npm run check:content` mens du skriver. Den flagger dokumenter som blir for lange.
> (`docs/`-mappa er kun for deg — den serveres ikke til spillerne.)

---

## De 8 prinsippene

1. **Én idé per dokument.** Et dokument = omtrent én telefonskjerm: én påstand, ett bilde,
   én kvittering, én melding. Mange små flis slår noen få lange rapporter.
2. **Hvert dokument peker videre.** Et godt dokument svarer på ett spørsmål og åpner et nytt,
   så spilleren alltid har en grunn til å klikke på neste flis.
3. **Spre sporene utover appene.** «Aha»-følelsen kommer når spilleren kobler sammen to
   flater: en Instagram-tid som ikke stemmer med et vitneutsagn, et LinkedIn-innlegg som er
   en for-god-til-å-være-sann alibi, et notat i «Offerets filer» som først gir mening etter
   politirapporten.
4. **Titler er agn.** Flis-titler skal friste til et valg, ikke være kapiteloverskrifter:
   «Slettet melding», «Kvittering 23:47», «Ulest brev», «Hvem er dette?» — så det å åpne
   føles som en beslutning.
5. **Design falske spor bevisst:** *motiv · anledning · et spor · avkreftelsen.* Gi 2–3
   mistenkte alle tre — et motiv, et tidsvindu, og én belastende detalj — og legg *senere* et
   dokument som stille renvasker dem. Den ekte morderens spor er subtilt og lander sent.
6. **Bygg opp dag for dag (reframing):**
   - **Dag 1** — etabler åstedet, plant de mistenkte, gi hver et lite «hint» om skyld.
   - **Dag 2** — komplисér med fysisk bevis som får dag 1 til å se annerledes ut.
   - **Dag 3** — det avgjørende sporet + ett siste rødt sluk.
   - **Dag 4** — fasit som forklarer *hvert* falskt spor og hvorfor det lurte deg (den
     tilfredsstillende delen).
7. **Vis, ikke fortell.** Foretrekk foto, skannede notater, skjermbilder, lister og
   sitatblokker framfor avsnitt. Bryt opp all tekst med markdown-struktur.
8. **Belønn gjenlesing.** Plant detaljer som ser ut som pynt på dag 1, men blir avgjørende på
   dag 3. Spillere elsker å oppdage at svaret lå der hele tiden.

---

## Dokument-meny — hvilken flate til hvilket beat

| Story-beat | Bruk denne flaten | Hvordan i manifestet |
| --- | --- | --- |
| Offisielle fakta, tidslinje | Politirapport (markdown-dokument) | `{ kind: 'markdown', inline: '…' }` i `days[].docs` |
| Vitneutsagn / forklaring | Kort markdown-dokument, én stemme per flis | ett `docs`-element per vitne |
| Alibi som skryter litt for mye | LinkedIn-innlegg | `linkedin: [...]` |
| Motsigelse i tid/sted | Instagram-post (bilde + tid) | `instagram: [...]` |
| Personlig motiv / hemmelighet | «Offerets filer» (dagbok, brev, handleliste) | `angelaFiles: [...]` |
| Fysisk bevis, åstedsfoto, kart | Bilde-dokument (zoombart på mobil) | `{ kind: 'image', src: 'case/dagN/…' }` |
| Obduksjon, kontoutskrift, rapport | PDF | `{ kind: 'pdf', src: 'case/dagN/…' }` |
| Oversikt over mistenkte | Mistenkte-tavla | `suspects: [...]` |
| Det avgjørende sporet | Ett foto man må se nøye på | eget bilde-dokument sent i saken |

Tips: bruk **kryptiske filnavn** på senere dagers filer (`case/dag3/8f2a-brev.jpg`) så ingen
gjetter URL-en før dagen åpnes.

---

## Falske spor-matrise (fyll inn ditt kjente plott)

Én rad per mistenkt. Sørg for at den ekte morderen *også* har en rad — og at avkreftelsene
for de andre kommer som egne, senere dokumenter.

| Mistenkt | Motiv | Anledning | Belastende spor | Hvor/hvordan avkreftet | Dag |
| --- | --- | --- | --- | --- | --- |
| Kari (nabo) | … | … | «så lyset slukke 23» | … | D2 |
| Per (eks) | … | telefonsamtale 22 | … | telefonlogg viser ingenting | D3 |
| Thomas (bror) | arv | «på hytta, ingen dekning» | … | … | D3 |
| **(morder)** | … | … | *subtilt, sent* | — (bekreftes D4) | D3–4 |

Sjekkliste for et godt falskt spor: Har det (a) et troverdig motiv, (b) en anledning, (c) én
konkret detalj som peker på personen, og (d) en avkreftelse som spilleren kan finne selv?

---

## Lengdebudsjett (samme tall som `npm run check:content`)

- **Dokument:** ⚠ over **150 ord**, ✗ over **250 ord**. Er du over — del i to flis.
- **Per dag:** ⚠ over 600 ord totalt; sikt på **minst 3 dokumenter** per dag (dag 4 er unntak).
- **Instagram-caption:** ≤ ~30 ord. **LinkedIn-innlegg:** ≤ ~60 ord.
- Bilder og PDF-er teller ikke mot budsjettet — bruk dem gjerne mye.

Kjør `npm run check:content` når som helst. Bruk `npm run check:content -- --strict` for at
advarsler også skal gi feilkode (nyttig hvis du vil gate før deploy).

---

## Sjekkliste per dokument

- [ ] Handler om **én** ting.
- [ ] Under lengdebudsjettet (`check:content` er grønn).
- [ ] Tittelen frister til å åpne.
- [ ] Reiser eller besvarer et spørsmål — helst begge.
- [ ] Kobler til minst ett annet dokument/flate (bekrefter eller motsier).
- [ ] Hvis det peker på en mistenkt: finnes avkreftelsen et sted (med mindre det er morderen)?
