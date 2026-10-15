# The Mistbound Caravan — art direction

A small warm light inside a very large, uncertain forest. The caravan should feel useful, lived in, and worth protecting. Use oak, canvas, brass, stone, and fog rather than a generic combat or dashboard aesthetic.

## Visual system

- Pine backgrounds (`#101b19`, `#182724`) and desaturated forest borders.
- Parchment text, aged brass (`#c6a66b`), amber lantern light, and restrained cyan/green resource accents.
- Cinzel for chapter titles and identity; DM Sans for instructions and controls. Both font families are bundled locally, with OFL notices in `public/licenses`.
- Painterly original environment art, readable dark overlays, thin route markers, and simple line icons.
- Light movement is decorative. Respect `prefers-reduced-motion`; no required information depends on particles, weather, animation, or audio.

## Asset provenance

`public/art/lantern-journey.png` is an original AI-generated illustration created on 15 October 2026 using the built-in image generation tool through the imagegen skill. No reference images, commercial book art, or third-party game images were used. The asset was copied into this repository and is served locally. It is decorative and does not reveal a puzzle answer. No runtime AI API or API key is needed.

Production prompt:

> Use case: illustration-story. Asset type: original production background illustration for The Mistbound Caravan cooperative fantasy game, widescreen 16:9 landscape. Primary request: an exquisitely hand painted storybook fantasy scene of a small rune-powered wooden rescue caravan traveling a stone path through an enchanted misty forest toward a distant lantern station. Composition: the distinctive caravan with arched moss-green canvas roof, aged oak cabin, bronze rune wheels, bundled supplies and a bright hanging amber lantern occupies the right half and lower right third; leave the left third as atmospheric dark forest and mist for readable HTML title overlay. A winding trail and a small stone bridge lead toward a tiny warmly lit station on the far right. Tall textured pine silhouettes frame the scene, teal and sage mist, deep blue-green shadows, subtle golden fireflies, warm amber windows and glowing bronze runes. Style: premium indie adventure game key art, painterly gouache and textured ink, richly detailed natural shapes, soft atmospheric depth, charming and quietly mysterious, refined illustrative aesthetic rather than photorealistic or 3D. Cinematic warm lantern light against cool woodland fog. Subject is a practical magical rescue vehicle, no weapons, no people close-ups. No text, no lettering, no UI, no logos, no watermark. The background must be useful behind a dark-green game interface.

## Screenshots

Run `npm run dev` and, in another terminal, `npm run test:ui`. Review artifacts are saved under `output/review/`: desktop title, lobby, ferry, 390/768/1024px title layouts, and a mobile controller. The script uses installed Windows Chrome by default; set `CHROME_PATH` for another Chromium executable.
