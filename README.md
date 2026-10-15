# The Mistbound Caravan

A cooperative fantasy rescue adventure for 3–9 friends, based on [INSTRUCTION.md](INSTRUCTION.md). Original lantern-lit forest art, shared-screen scenes, private clue controls, simultaneous storm tasks, and a local multi-seat simulator.

This is a browser playtest prototype. The first mission can be played through locally. An authoritative LAN server, secure phone seats, transactional saves, and validated content imports are still required. See [the specification review](docs/CODE-REVIEW.md).

## Run

Use Node.js 24 (tested with 24.11.0) and npm. No AI API key is required.

```sh
npm ci
npm run dev
```

On Windows PowerShell, use `npm.cmd` if your execution policy blocks `npm.ps1`. Open `http://localhost:3000`.

Begin the journey, use the Simulator to select a party size through the Host Panel while in the lobby, then depart. Switch between TV, Phone, and Split views. In the simulator you can control each seat, autofill choices, or mark all seats ready. During scenes, players select their input and mark Ready; Reveal is available when everyone is ready. Continue after reviewing consequences. These simulator controls intentionally operate multiple seats for testing.

Vite prints a LAN address and serves the page on port 3000. A phone on the same private network can open that address with `/?view=phone`, but **it currently runs a separate game**. BroadcastChannel shares state only among tabs on the same browser origin. Do not use the QR preview as evidence of a working multi-device room. Do not expose the development server to the Internet.

## Verify

```sh
npm run lint
npm test
npm run build
```

For screenshots and browser checks, keep the dev server running and run `npm run test:ui` in a second terminal. This uses installed Windows Chrome; set `CHROME_PATH` for another Chromium executable. Screenshots are saved in `output/review/`.

Artwork and fonts are bundled locally. Generation provenance and the production prompt are in [ART-DIRECTION.md](docs/ART-DIRECTION.md); font licenses are in `public/licenses/`. No runtime image generation, CDN fonts, cloud authentication, or Gemini key is used.

The original Bun lockfile is retained; use the npm lockfile and `npm ci` for the verified dependency set. Contract and acceptance mapping: [P00 review contract](docs/P00-review-contract.md).
