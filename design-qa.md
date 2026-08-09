# Bike Ground Reflection — Design QA

> Follow-up status (2026-08-09): runtime verification is currently blocked. The open in-app preview is still running the former `.bike-reflection` SVG-group implementation while the checked source/build contains the newer `.bike-reflection-canvas` layer. Browser URL policy blocked reloading the local tab, so the latest implementation cannot yet be captured or compared against the new target screenshot. Refresh the existing preview, then rerun visual comparison before changing reflection parameters.

- Source visual truth: `/var/folders/11/zcws9_xj6sv750d6864kknwh0000gn/T/codex-clipboard-ddd2b94a-fdff-48cd-8bbe-9603d9020f6c.png`
- Implementation screenshot: `/tmp/bike-reflection-qa-implementation.jpg`
- Combined comparison: `/tmp/bike-reflection-qa-comparison-focused.png`
- Source pixels: 1222 × 909
- Implementation pixels: 1280 × 720
- CSS viewport: 1280 × 720 at device pixel ratio 1
- Density normalization: both full views were resized to 900 px wide for the combined comparison; the ground/reflection regions were also cropped and normalized to 900 px wide for focused comparison.
- State: Trek Domane size 54, stage fullscreen, dimensions hidden for focused visual comparison, preview motion running. The existing canvas toolbar remains visible because it is explicitly outside this task's modification scope.

## Full-view comparison evidence

The implementation preserves the current bicycle, Prism, header, ground alignment, and contact-point hierarchy. The new reflection begins at the same white platform line as the tire contact points, stays below the real bicycle, and is visually subordinate to both the bike and Prism.

The source is an annotated center-stage crop rather than the full application viewport. Its red rectangle is review markup, not product UI. Exact page composition is therefore not a fidelity target for this scoped change; the target relationship is wheel contact → white platform → short blurred reflection → rapid fade.

## Focused-region comparison evidence

The lower-row comparison isolates the ground line and reflection region. It confirms:

- the reflection is a vertically mirrored bicycle image rather than a box shadow;
- the strongest visibility is immediately below the ground line;
- the image remains colored but muted and blurred;
- the reflection fades to transparent before the stage bottom;
- no S/H/P point, Geometry label, dimension line, or debug point appears inside the reflection.

At the 720 px-high verification viewport, the responsive ground line leaves 58.518 px below it in fullscreen and 59.180 px in normal mode. The mask uses that real available height rather than moving the established ground baseline. Taller desktop workspaces expose a proportionally deeper reflection region without a fullscreen-specific offset.

## Required fidelity surfaces

- Fonts and typography: unchanged; this task adds no text and does not alter existing type styles.
- Spacing and layout rhythm: unchanged; the reflection is contained inside the existing SVG stage and adds no layout box or scroll area.
- Colors and visual tokens: the reflection preserves current bike colors, then applies only the requested `saturate(.8)` and `brightness(.9)` treatment at `opacity .20`.
- Image quality and asset fidelity: the reflection re-renders the existing vector `RoadBikeVisual`; no bitmap approximation, generated asset, or per-part redrawing is used.
- Copy and content: unchanged.

## Findings

- No actionable P0, P1, or P2 differences remain for the requested reflection layer.
- P3: the existing bottom canvas toolbar overlaps the shallow reflection region at a 720 px-high viewport. It remains unchanged because the user explicitly excluded UI changes; it does not affect the underlying mirror alignment or mask.

## Interaction and responsive verification

- Sizes 44 / 49 / 52 / 54 / 56 / 58 / 61: reflection and main bike use matching Geometry deltas and component IDs; reflected contact/debug count remains zero.
- Normal mode: one reflection layer, ground-derived height 59.180 px at the verification viewport.
- Fullscreen mode: the same mounted visualizer recomputes the ground and reflection from the resized stage; ground-derived height 58.518 px at the verification viewport.
- Motion: main and reflection use the same `isMotionStopped` state and the same SVG document timeline; no additional `requestAnimationFrame` loop exists.
- Vite error overlay: absent during verification.

## Comparison history

- Initial implementation: the full and focused comparisons showed the requested subtle, short reflection and no mirrored annotation layers.
- No P0/P1/P2 visual fix iteration was required. The user-specified first-pass values were retained exactly.

## Implementation checklist

- [x] Reuse current `RoadBikeVisual`.
- [x] Mirror around responsive `stageGroundY`.
- [x] Exclude Contact Points, Geometry, debug, UI, and Prism.
- [x] Apply opacity .20, scaleY -.90, blur 14 px, saturation .8, brightness .9.
- [x] Clip below the wheel contact line and fade with a four-stop SVG mask.
- [x] Keep normal/fullscreen and all size/component inputs synchronized.
- [x] Pass tests and production build.

final result: blocked
