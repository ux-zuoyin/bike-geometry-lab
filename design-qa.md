# Design QA — Static Full-screen Landing Background

- Source image: `/Users/sardine/Downloads/ChatGPT Image 2026年8月13日 01_19_28.png`
- Production asset: `src/assets/splash/landing-bike-parts.webp`
- Source image: 1672 × 941 PNG, 1,961,875 bytes
- Production asset: 1672 × 941 WebP, 77,028 bytes

## Required behavior

- The Landing background is a single responsive `<img>`, not DriftWall or AccordionGallery.
- It fills the full viewport using `width: 100%`, `height: 100%`, and `object-fit: cover`.
- Centered cropping follows screen dimensions through `object-position: center`.
- The existing dark gradient veil remains above the image so the Hero text is readable.
- The supplied DotField canvas is an intermediate visual layer above the image and below the veil and copy; its wrapper has `pointer-events: none`, while its global pointer observation keeps the dot bulge interaction available.
- Landing → Welcome Gate behavior remains unchanged.

## Findings

- The WebP preserves the original 1672 × 941 pixel dimensions while reducing the resource by about 96%.
- Runtime inspection at the 1796 × 1132 desktop viewport confirms the intended stack: image `z-index: 0`, DotField `z-index: 1`, readability veil `z-index: 2`, and Hero copy `z-index: 3`.
- DotField fills the same viewport as the background, remains decorative (`pointer-events: none`), and still reacts to pointer movement through its global motion listener without blocking the CTA.
- Landing → Lab was verified with an active `landing-page--exit`: the composite wall and copy run their own fade-and-upward animations before the Lab mounts. The reverse Header-logo route was verified with `landing-page--enter`: the Landing wall and copy fade in while moving downward, then restore the unchanged Workspace state on the next Lab entry.
- The exit path now mounts the full Workspace before the Landing opacity reaches zero. At an active 220ms exit sample, the Landing wall opacity was `0.06` while the Workspace remained mounted at opacity `1`, eliminating the previous bare-black loading interval.
- At the 1796px desktop viewport, both Landing and Workspace brand images resolve to the same exact 32px left / 14px top / 182.05px × 36px rectangle inside a shared 64px Header.
- Landing capability overview was visually verified beneath the CTA: it has three equal 253px text columns, no card backgrounds, and no interactive descendants; the CTA remains 204px above it as the only task entry.
- No P0/P1/P2 differences remain for the requested static full-screen image background.

final result: passed
