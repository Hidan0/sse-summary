# Riassunti SSE

Riassunti e glossario per ripassare il corso di **Soccorso Sanitario Extraospedaliero (SSE)** di AREU Lombardia.

👉 **https://hidan0.github.io/sse-summary/**

> [!IMPORTANT]
> Sono riassunti **non ufficiali**, basati sul materiale del corso: non sostituiscono le lezioni né i protocolli operativi.
> Ogni affermazione cita la lezione e la pagina da cui è tratta, così puoi verificarla sulle slide.

## Contenuti

- **Riassunti** di tutti i capitoli del SSE, dal ruolo del soccorritore alla maxiemergenza, con i dati da ricordare per l'esame e i collegamenti agli scenari d'esame.
- **Glossario** con definizioni rapide, soglie per adulto, bambino e infante e le differenze tra le fonti.

I contenuti sono file Markdown in `src/content/`, convertiti in HTML al build.

## Sviluppo

```sh
bun install
bun run dev        # server di sviluppo
bun run build      # build di produzione
bun run lint
bun run typecheck
bun run test       # verifica anche la coerenza dei contenuti (glossario, fonti, collegamenti)
```

Ogni push su `master` pubblica il sito su GitHub Pages.

## Licenza

- **Codice**: [Apache 2.0](LICENSE).
- **Contenuti** (`src/content/riassunti/` e `src/content/glossario/`): [CC BY-NC-SA 4.0](LICENSE-CONTENT).

Costruito a partire da [Tuemplate](https://github.com/Byloth/tuemplate) di [Byloth](https://www.byloth.dev/).
