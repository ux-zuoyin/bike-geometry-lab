# Design QA — Handcrafted Endurance Bike Template

## Evidence

- Source visual truth:
  - `/Users/sardine/开发学习/网站项目/公路车fitting小工具/references/endurance/trek-domane-sideview.png`
  - `/Users/sardine/开发学习/网站项目/公路车fitting小工具/references/endurance/trek-domane-geometry.png`
- Browser-rendered implementation:
  - `/Users/sardine/开发学习/网站项目/公路车fitting小工具/endurance-production-final.png`
- Full-view comparison:
  - `/Users/sardine/开发学习/网站项目/公路车fitting小工具/endurance-qa-comparison-production.png`
- Focused cockpit/head/fork comparison:
  - `/Users/sardine/开发学习/网站项目/公路车fitting小工具/endurance-qa-comparison-production-focused.png`
- Source pixels: side view 1080 × 810; geometry chart 1134 × 647.
- Implementation pixels and CSS viewport: 1280 × 720 at device scale factor 1.
- Comparison canvases: 1400 × 560 full view and 900 × 430 focused view. Both sides were contained on white panels without stretching.
- State: production build, Candidate / Endurance / size 54 / dimensions on / debug tools absent.

The source is a morphology reference rather than a page-layout mock. QA therefore compares bicycle silhouette, wheel/frame scale, component relationships and visual hierarchy; application chrome is evaluated against the existing product system.

## Findings

No actionable P0, P1 or P2 findings remain.

- The 700C wheels remain equal and fixed-size across geometry changes.
- BB is correctly below the axle line after correcting BB Drop direction.
- Frame, fork, seatpost, saddle and cockpit now use a handcrafted SVG shell with bounded anchor deformation.
- Drop bar and hood remain intentionally simplified for overlay readability, but are recognizably modern road components rather than a single L-shaped hook.
- The final visual is brand-neutral and contains no copied logo, decal, paint or proprietary artwork.

## Required fidelity surfaces

- Fonts and typography: existing application typography remains consistent; labels, dimensions and calibration status are readable without clipping at the tested desktop viewport.
- Spacing and layout rhythm: the three-column desktop workspace has no horizontal or vertical body overflow. Bicycle, dimensions and comparison dock remain separated.
- Colors and visual tokens: frame, dark components and wheel colors provide component hierarchy while retaining the existing slate/teal product palette. Overlay mode collapses these to the comparison color.
- Image quality and asset fidelity: the production bicycle is resolution-independent SVG by explicit product requirement. The supplied raster side view is used only by the development overlay and is absent from the production UI.
- Copy and content: Endurance is marked `CALIBRATED`; All-Round and Aero are explicitly marked `NOT CALIBRATED`.

## Interaction and runtime checks

- Size 52 and 56 switching verified: Stack/Reach and head-tube paths change, while both wheel radii remain `137.76` SVG units.
- Candidate overlay verified with two distinct bike layers and readable reference/candidate labels.
- Development-only Geometry Skeleton verified default off and switchable on.
- Development-only Reference Image Overlay verified default off and switchable on.
- Opacity slider verified from 32% to 55%.
- All-Round status verified as `NOT CALIBRATED`, then restored to Endurance.
- Browser console warnings/errors: none.
- Body overflow at 1399 × 784: 0 px horizontal, 0 px vertical.

## Comparison history

### Pass 1

- Evidence: `endurance-handcrafted-pass1.png`.
- [P1] BB Drop direction was inverted, placing the bottom bracket above the axle line and making the frame appear suspended between the wheels.
- [P1] Hood anchor was too near and low, compressing the drop bar into a hook.

Fixes:

- Corrected rear/front axle Y to use positive BB Drop in the upward-positive geometry coordinate system.
- Moved the wheelbase dimension below the actual wheel baseline.
- Reduced generic-looking tube/stay widths and introduced separate frame/component/wheel tones.

### Pass 2

- Evidence: `endurance-handcrafted-1399-pass3.png` and `endurance-debug-overlay.png`.
- Axles, wheel scale, seat cluster, head tube and saddle aligned closely in the reference overlay.
- [P1] Cockpit still appeared too compact compared with the source morphology.

Fixes:

- Calibrated the hood anchor forward/upward.
- Re-authored the fixed drop-bar Bezier profile with a clear top, hood, open drop and lever.
- Increased head/down/top tube shell widths and fork crown presence without changing anchors.

### Final pass

- Evidence: `endurance-production-final.png`, `endurance-qa-comparison-production.png`, and `endurance-qa-comparison-production-focused.png`.
- Earlier P1 findings are resolved. No actionable P0/P1/P2 differences remain for the intended standardized technical-product illustration.

## Open questions

- The supplied side-view image has no confirmed model year or exact frame size, so cockpit micro-proportions and tube-junction curvature remain archetype-level calibration rather than a claim of official model fidelity.

## Follow-up polish

- P3: after a clean, brand-neutral orthographic endurance reference becomes available, refine hood volume, fork crown curvature and rear-dropout shape with a second manual calibration pass.

final result: passed
