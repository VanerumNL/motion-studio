# Vanerum Motion Studio

Statische website rond de Motion Cube: een startpagina met het 3D-model, Motion Lab (`lab.html`), Motion Missions (`missies.html`) en Vimo (`vimo.html`), de mascotte van Vanerum.

Geen build-stap nodig. Alle bestanden staan in de hoofdmap.

## Publiceren op Cloudflare Pages

1. Cloudflare-dashboard → **Workers & Pages** → **Create** → tab **Pages** → **Connect to Git**.
2. Kies deze repository.
3. Framework preset: **None**. Build command: leeg laten. Build output directory: `/`.
4. **Save and Deploy**. Elke push naar `main` zet daarna automatisch een nieuwe versie online.

Een eigen domein (bijv. `motion.vanerum.nl`) koppel je in het Pages-project onder **Custom domains**.

## Onderdelen

- `index.html`: start, met navigatie via `#lab` en `#missies`
- `lab.html`: Motion Cube Lab (bekijken, quiz, snelheid, nabouwen, vrij bouwen, missie)
- `missies.html`: 100 Motion Missions-opdrachtkaarten, lesgenerator, houdingen met Vimo, digibord en PDF (2× A5 per A4)
- `vimo.html`: Vimo in 3D naast de Motion Cube, met bewegingen en een opdrachtveld (in Claude met AI, op de website met woordherkenning)
- `vimo3d.js`: Vimo in 3D, gedeeld door de startpagina, het beursscherm en het hulpje in Lab en Missions (tik op Vimo en hij zegt iets)
- `vimo2d.js`: Vimo in 2D, voor de plaatjes bij de houdingen in Motion Missions

## Beursscherm

Zet op de startpagina onderaan **Beursscherm** aan (of open de site met `#beurs`). Raakt een minuut lang niemand het scherm aan, dan komt Vimo groot in beeld en nodigt hij bezoekers uit. Eén tik brengt je terug naar de startpagina.
