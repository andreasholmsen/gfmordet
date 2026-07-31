# Pias bilder

Bildene her er ferdig koblet opp i `src/case/manifest.ts`: **mobilbildene på dag 2**
(mappe `pia-mobil`) og **kamerabildene på dag 3** (mappe `pia-kamera`). Filene ligger
fortsatt alle i denne mappa — bare `folder`/dag i manifestet skiller dem. Filnavnene på disk beholdes som de er — det er **dokumenttittelen** i
manifestet som vises til spillerne, og den er et `IMG_2026…`-navn med klokkeslett i.

**Tidslogikken:** mobilen stilte seg om til norsk tid da hun landet. Kameraet står
fortsatt på Moldova-tid, én time foran (jf. Anna: «Moldova som bare ligger én time foran
Norge»). Moldova-bildene er tatt i Moldova, så der er klokka riktig. Norge-bildene på
kameraet ligger derimot én time for sent.

Tre motiv finnes på **begge** enhetene. Samme fil, to titler, samme sekund, én times
forskjell — det er sporet:

| Motiv | Fil | Mobil | Kamera |
| --- | --- | --- | --- |
| Sørmarka over vannet | `sørmarka.jpg` | `10:46:12` | `11:46:12` |
| Bankettsalen | `sørmarlka3.jpg` | `19:30:45` | `20:30:45` |
| Gjengen | `people1.jpg` | `20:55:12` | `21:55:12` |

## Mobilbilder — norsk tid (DAG 2)

| Vises som | Fil | Motiv |
| --- | --- | --- |
| `IMG_20260730_121540.jpg` | `moldova5.jpg` | Praha, Karlsbrua (mellomlanding) |
| `IMG_20260730_181402.jpg` | `plane.jpg` | Inne i flyet |
| `IMG_20260730_195133.jpg` | `moldova.jpg` | Flyvindu, solnedgang |
| `IMG_20260730_211208.jpg` | `gardmeon airport.jpg` | Oslo lufthavn |
| `IMG_20260731_101547.jpg` | `sørmarka1.jpg` | Sørmarka-skiltet |
| `IMG_20260731_104612.jpg` | `sørmarka.jpg` | **★** Sørmarka over vannet |
| `IMG_20260731_112033.jpg` | `hotell2.jpg` | Hotellrommet |
| `IMG_20260801_193045.jpg` | `sørmarlka3.jpg` | **★** Bankettsalen |
| `IMG_20260801_205512.jpg` | `people1.jpg` | **★** Gjengen |

## Kamerabilder (DAG 3) — Moldova-tid

| Vises som | Fil | Motiv |
| --- | --- | --- |
| `IMG_20260728_201235.jpg` | `Moldova4.jpg` | Folkedrakt i solnedgang |
| `IMG_20260729_132408.jpg` | `Moldova3.jpg` | Folkemengde med EU-flagg |
| `IMG_20260729_200317.jpg` | `Moldova1.jpg` | Chișinău ovenfra, gyllen time |
| `IMG_20260729_211842.jpg` | `Moldova2.jpg` | Jernbanestasjonen, blå time |
| `IMG_20260731_114612.jpg` | `sørmarka.jpg` | **★** Sørmarka over vannet |
| `IMG_20260731_150318.jpg` | `hotelcorridor.jpg` | Hotellkorridoren |
| `IMG_20260801_203045.jpg` | `sørmarlka3.jpg` | **★** Bankettsalen |
| `IMG_20260801_215512.jpg` | `people1.jpg` | **★** Gjengen |

## Hvis du endrer noe

- **Nytt klokkeslett:** endre `title` i manifestet. `src` skal fortsatt peke på den
  faktiske fila — de to trenger ikke matche lenger.
- **Nytt bilde:** legg fila her og pek `src` på den. Behold `IMG_2026…`-formatet på
  tittelen, ellers stikker den seg ut i fliselista.
- **Rekkefølgen** i mappa følger rekkefølgen i `docs`-arrayet, ikke klokkeslettet.
  De ligger kronologisk nå.
- To filnavn er misvisende på disk: `moldova.jpg` er flyvinduet og `moldova5.jpg` er
  Praha. Manifestet peker riktig; ikke la navnene lure deg.
