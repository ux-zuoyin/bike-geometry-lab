# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Bike visual system decisions

- Current product scope contains one model only: Trek Domane in the Endurance category. Do not expose All-Round, Aero, other brands, placeholder bikes, a second bike, recommendations, OCR, AI, rider skeletons, or cloud sync in the active UI until the user expands scope again.
- Trek Domane supports sizes 44, 49, 52, 54, 56, 58, and 61. Store product geometry with explicit `Mm` / `Deg` field names; source chart lengths were in cm and are normalized to mm at the data boundary.
- The Figma Endurance template is calibrated to Trek Domane size 56. Size 56 is the zero-deformation visual baseline; every other size is a geometry delta from 56, never an overall frame scale.
- The Endurance SVG root render order follows the reversed Figma layer panel except for the user-prioritized foreground drivetrain: front rotor, rear rotor, cassette, non-drive crank, rear wheel, front wheel, seatpost, saddle, cockpit, fork, frame, chain, derailleur, chainring, drive crank, then optional debug anchors. Chainring and drive crank must stay above every production bike part, with the drive crank above the chainring. Control this with SVG DOM order, not CSS `z-index`.
- Geometry/debug anchors are hidden by default and, when enabled, must render as the final SVG child so no bike part can cover them. Keep rotors independent from wheel groups so the Figma drivetrain/wheel stacking remains representable.
- Bike Preview Motion is permanently enabled and has no static mode or UI toggle. Use geometry-projected front axle, rear axle, and BB coordinates as explicit `animateTransform` rotation centers; never use SVG bounding-box centers.
- Preview motion uses a 50 RPM cadence baseline: chainring and both cranks complete one linear cycle every 1.2 seconds. Front/rear wheels and rotors run slightly faster at 62.5 RPM / 0.96 seconds per cycle. The non-drive crank starts from the geometry-mapped point exactly opposite the drive pedal, then receives the same rotation cycle so the 180° phase relationship is preserved.
- Every rotating part must render an infinite SVG animation (`repeatCount="indefinite"`). Size changes rebuild animation centers from the new geometry without altering root SVG render order.
- Desktop-only UI is intentional; do not spend scope on mobile adaptation.

- Render a complete, standardized side-view road bike between technical diagram and flat product illustration; do not fall back to centerline-only frame tubes.
- Keep geometry nodes and contact points authoritative. Visual presets may change tube profiles, rim depth, fork/stay weight, and other appearance details, but must not replace Stack, Reach, wheelbase, axle, BB, saddle, or handlebar calculations.
- Maintain three shared-system archetypes: Endurance (current default), All-Round, and Aero. They are visual presets, not copied brand bikes.
- Include recognizable drop bars, saddle/seatpost, crankset, chainrings, chain, cassette, rear derailleur, light spokes, and front/rear disc brakes. No brand marks or logos.
- Preserve overlay readability through clear primary silhouettes, restrained secondary detail, color, opacity, and line-style differences.
- For the current Endurance implementation, Figma file `CbX0nYfNc7VtHgtSkHZdYS`, node `1:823` (`车架`) is the frame visual source of truth. Use its semantic split assets: frame body (BB, seat tube, seatstay, chainstay), head tube, top tube, and down tube; do not regenerate them from centerlines.
- Validate Endurance first with sizes 52, 54, and 56. Keep 700C wheels visually fixed while geometry anchors drive frame, fork, saddle, cockpit, drivetrain, and overlay placement.
- Connect independent Figma bike parts through semantic path-local anchors, never bounding-box centers or corrective pixel offsets: Frame SeatpostSocketAnchor → SeatpostBottom, Frame HeadTop → StemBase → HandlebarClamp, and Frame HeadBottom → ForkTop → FrontAxle. Keep the fork and seatpost behind the frame shell so their connection ends are naturally occluded.
- Keep the seatpost center axis collinear with the transformed frame shell's BottomBracket → SeatpostSocketAnchor axis. Bike Fit Setup supplies the axial saddle height plus the saddle/seatpost setback, while frame size determines the socket and seat-tube axis. Size changes alter the dynamic SeatpostSocketAnchor → SaddleClampAnchor exposed length; setback moves the saddle/contact point relative to SaddleClampAnchor and must never rotate the seatpost. The saddle uses a fixed visual scale and no per-size offsets.
- Treat the Figma Endurance split frame as a size-56 visual baseline. HeadTop and HeadBottom come from Reach/Stack plus the current size's head-tube length and angle; HeadTube maps HeadTop → HeadBottom, TopTube maps SeatCluster → HeadTop, DownTube maps BB → HeadBottom, StemBase binds HeadTop, and ForkTop binds HeadBottom. Never run the legacy complete-frame transform alongside this split mapping.
- Separate fixed size-56 canvas calibration from size deltas. Each split frame part gets a fixed Figma → Size-56 base matrix, then 52/54 apply only a target-geometry delta matrix. At size 56 every local delta matrix must be identity; head-tube axial scales are exactly 145/175, 160/175, and 175/175 with lateral scale fixed at 1.
- Treat the product as desktop-only. Do not add mobile breakpoints, bottom sheets, stacked mobile layouts, or mobile navigation; preserve the three-column engineering workspace and use a 1024 px minimum viewport.
- Use the Domane geometry chart only as an Endurance field/proportion reference: normalize source centimetres to millimetres in the data layer, keep angles in degrees, and never reproduce brand marks, paint or decals.
- Treat Endurance as the current quality-first calibrated archetype. All-Round and Aero remain architecture-ready demo presets until equivalent geometry charts and clean side-view references are supplied.
- Render calibrated Endurance through a handcrafted SVG shell with bounded anchor deformation. Do not use centerline tubes, generic tapered-line generation, or `stroke-width` as its final frame appearance.
- Keep Geometry Skeleton as a development-only debug layer, default off. Keep the Endurance side-view reference overlay and opacity control development-only and default off.
