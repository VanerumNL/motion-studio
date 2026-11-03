# Vanerum Motion Studio

Statische website rond de Motion Cube: een startpagina met het 3D-model, Motion Lab (`lab.html`) en Motion Missions (`missies.html`).

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
- `missies.html`: 100 Motion Missions-opdrachtkaarten, lesgenerator, digibord en PDF (2× A5 per A4)
