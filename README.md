## 1. Mission Profile

Clarity is a single-page image workstation. Everything happens on-device:

1. **Acquisition** – A file is decoded to a linear RGBA bitmap. Metadata (dimensions, EXIF, GPS, maker notes) is cached for later telemetry.
2. **State Capture** – All adjustments are just numbers inside Redux. We never touch the pixels on disk until export. That’s “non‑destructive” in marketing speak, but for us it means every slider is reversible.
3. **Rendering Loop** – A WebGL canvas applies photon math in real time. Every time state changes, the shader rebuilds the frame.
4. **Analysis** – Parallel JavaScript workers re-run histogram, waveform, vectorscope, and entropic diagnostics so the operator always sees what the signal is doing.
5. **Dispatch / Export** – When the user requests export, we replay the exact same pipeline on a full-resolution temporary canvas and emit PNG/JPEG.

---

## 2. Signal Chain (EditorCanvas)

Inside `src/components/EditorCanvas.tsx` you can read the whole pipeline in TypeScript:

1. **Linearized bitmap** – We draw the uploaded bitmap into an off-screen `<canvas>` to normalize it.
2. **White Balance Matrix** – Color temperature / tint are converted into multipliers (`wbR`, `wbG`, `wbB`) and applied per channel.
3. **Exposure / Contrast** – We operate in a gamma-adjusted space: exposure is a scalar, contrast is a mid-tones S-curve.
4. **HSL Offsets** – RGB is converted to HSL per pixel, offsets are applied, then converted back. This is CPU-side, so we batch the work to keep 60 fps.
5. **Simulation (3D LUT)** – We identify the active Fujifilm preset, read its 3D LUT, and use trilinear interpolation to remap every color. That’s where the “film look” truly lives.
6. **Perceptual Effects** – Grain, vignette, and sharpen are computed last so they affect the already graded image. Sharpen is a configurable unsharp mask; grain is Perlin + random noise seeded per frame.
7. **Preview Modes** – Original / Edited / Split / Side-by-Side are all just shaders with different blend equations. No extra processing is done; we just decide which buffer to display.

All of this happens in memory. Nothing is uploaded anywhere.

---

## 3. Fujifilm Simulation Notes

We ship multiple Fujifilm-inspired looks (Classic Chrome, Provia, etc.). Each preset contains:

- A **3D LUT cube** (typically 33³) describing the color response.
- Metadata about the film: contrast bias, chroma emphasis, shoulder & toe.
- Optional secondary tweaks (e.g., Classic Chrome softens blues post-LUT).

Rendering steps:

1. Convert RGB (0–255) to normalized cube coordinates.
2. Sample the cube using trilinear interpolation. We access eight lattice points surrounding the coordinate and interpolate.
3. Apply preset-specific tweaks (contrast bias, gentle color shifts).
4. Feed result downstream to vignette/grain/sharpen.

The LUT data lives under `src/presets` and is loaded lazily. If you want to plug in your own film stock, drop in a new cube and register it in the preset index.

---

## 4. Shader / GPU Pipeline

The shader set was authored so ADE‑2 can reason about each stage:

| Stage | Responsibility |
|-------|----------------|
| **Sampler** | Binds the current frame buffer, handles zoom / pan. |
| **Color Matrix** | Applies exposure + WB + contrast in one pass. |
| **3D LUT** | Performs lookup + interpolation. |
| **Masking** | Handles preview splits and on-canvas overlays. |
| **Overlay** | Adds grain (Procedural noise) & vignette. |

Even though the code is orchestrated from React, the heavy lifting is WebGL. If you need to hack the shader, look inside `src/components/EditorCanvas.tsx` for the JavaScript version or port it to GLSL in `src/shaders`.

---

## 5. Adjustment Modules

- **Basic Adjustments** – Exposure, contrast, highlights, shadows live in `AdjustmentsPanel/BasicAdjustments.tsx`. Each slider writes to Redux via `updateParams`.
- **White Balance** – Temperature is Kelvin‑based, tint is magenta/green bias. Both get folded into the per-channel multipliers described above.
- **HSL** – A single triad (global hue/sat/lum) for now; architecture allows per-color bands if needed.
- **Effects Panel** – Grain (`amount`, `size`), Vignette (`amount`, `size`, `roundness`), Sharpen (amount, radius).
- **Simulation Gallery** – Each preset is just a metadata blob with references to LUTs plus marketing copy.

Every control is just updating the central `editorSlice`. Because the render pipeline re-computes from base bitmap every time, order of operations stays deterministic.

---

## 6. Analysis & Diagnostics

`ImageVisualizations.tsx` rebuilds diagnostics whenever pixels change:

- **RGB Histogram**
- **RGB Waveform**
- **Vectorscope**
- **3D Scatter plot of chroma clusters**
- Followed by luminance histogram, separated channels, luma waveform, entropy map.

For mobile, we render these inside a draggable bottom sheet. The canvases observe their container width, so they redraw properly when the sheet is opened, resized, or dragged.

---

## 7. Non-Destructive Workflow

Redux maintains:

- `editorSlice` – All parameter state.
- `uiSlice` – Preview modes, zoom/pan, panel toggles, mobile bottom sheet state.
- History middleware – Basic undo/redo ring buffer storing snapshots of `editor.params`.

Because we never mutate the original bitmap, export simply replays the pipeline on a hidden high-resolution canvas and encodes to PNG/JPEG. Nothing is left on the server (there is no server).

---

## 8. Operator Interface (Mobile vs Desktop)

- **Desktop** – Left rail (export/theme), adjustment sidebar, large canvas, Active Edits readout anchored below the canvas. Diagnostics sit in the sidebar under the Histogram tab.
- **Mobile** – Rail collapses to the top, adjustments live in a draggable bottom sheet. The canvas shifts upward when the sheet expands so the image is always visible. Diagnostics render inside the sheet, respecting the sheet height.

No UI state affects image fidelity; it’s all presentation.

---

## 9. Extending the Rig

- **New Film Stocks** – Drop a LUT cube + metadata, register it in the gallery, done.
- **New Adjustments** – Add fields to `editorSlice`, render a slider, hook into the pipeline near the relevant stage.
- **Shader Experiments** – You can swap out the JS processing in `EditorCanvas` for a pure GLSL pipeline if you want to offload more work to the GPU.

Remember: ADE‑2 cares about repeatability. Any new feature must plug into the state graph and recompute the preview deterministically, or the operators will not sign off.

---

## License & Acknowledgements

- **License** – MIT
- **Disclaimer** – We reference Fujifilm film names purely for descriptive purposes. No affiliation or endorsement is implied.

Stay precise. Handle light with respect.

