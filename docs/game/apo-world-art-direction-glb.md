# Apo Letter World — Art direction and GLB model integration (November 2026)

## Visual target

A warm, immersive *stylized-realistic* Mount Apo-inspired forest settlement with lived-in timber buildings, naturally irregular slopes, taller trees with modeled bark and leaves, a stone letter fountain, misty mountains and proportioned fully 3D human characters.

The previously generated cinematic art concept is **visual direction, not a screenshot of deployed gameplay**. No image is used as a fake 2D terrain backdrop. This project remains true perspective WebGL gameplay.

### Target art language

- Characters: anatomically proportioned hikers, outdoor clothing, bags, hair and faces; visually distinguish Explorer, Ranger, Traveler, Alexis and Iver.
- Buildings: timber and stone cottage-style Post Office and Library with roof detailing, distinct silhouettes, mail-themed landmarks and approach paths.
- Nature: layered native-inspired highland forest, pine and broadleaf trees, ferns and mossy stone, earthy paths, rolling uplands, distant mountain shapes and atmospheric fog.
- Rendering: warm late-afternoon directional sun, balanced green palette, soft distance haze, better camera framing; avoid oversaturated green carpets.
- Performance: models lazy load only on /world, existing on-device WebGL engine, GPU resource cleanup, fallback when a model is unavailable.

This is *not* a photorealistic Unreal-like renderer. Three.js supports PBR materials, directional shadows and source-file rigged animation; high-quality authored assets, optimized environment lighting and LOD streaming remain later work.

## Current integration

Source files:
- `Note_letter/src/game/apoThreeWorldEngine.ts`: enhanced Three.js renderer, GLTFLoader, PBR materials, skinned animation, lighting and world models.
- `Note_letter/src/game/apoWorldEntry.ts`: lazy enhanced-engine entry with legacy WebGL fallback.
- `Note_letter/src/vendor/three/`: pinned MIT Three.js runtime and glTF loader.
- `Note_letter/src/game/apoGlbLoader.ts`: legacy WebGL1-compatible minimal GLB geometry parser (fallback).
- `Note_letter/src/game/apoAssetCatalog.ts`: curated GLB sources and scale targets.
- `Note_letter/src/game/apoWorldEngine.ts`: responsive rendering, terrain, collisions, camera, fallback models and replacement of model instances.
- `Note_letter/src/Pages/user/ApoWorldPage.tsx`: real-time model-load status and existing movement / avatar chooser.

The preferred `apoThreeWorldEngine.ts` uses locally vendored **Three.js r150**, physically-based material rendering, embedded GLB textures, genuine skeletal `AnimationMixer` clips, directional light, sun shadows on supported GPUs and camera-relative third-person movement. `apoWorldEntry.ts` mounts this renderer asynchronously and falls back to `apoWorldEngine.ts` on engine boot failures. The original `apoGlbLoader.ts` is retained for the legacy fallback path only.

Imported assets replace the placeholder player/NPC/forest/village meshes after successful GLTF load. Model failures are isolated and do not prevent gameplay. Private letter content and authentication are not affected.

Legacy importer constraints:
- GLB 2.0 containing mesh triangle primitives and baked vertex colors.
- Skinned animation and full GLTF material support belong to the enhanced Three.js path.
- Draco/Meshopt compressed assets require an additional decoder and are not enabled.
- Model source URLs are currently from public GitHub raw content. Before shipping a large public release, vendor and optimize all models in a same-origin `/public/apo-models` directory, pin versions/hashes, and remove runtime third-party model dependencies.

## Model sources and licensing

The Quaternius asset packs listed below are distributed as CC0. Verify individual upstream asset license and content before repackaging or redistribution, and retain attribution / provenance for audit:

- **Characters:** Quaternius Ultimate Modular Men/Women (Explorer/Traveler, Farmer/Ranger, Alexis/Iver variants), mirrored in `nishit47/Blender-Pre-vis-Pipeline---Screenplay-to-Animatic`.
- **Buildings:** Quaternius Medieval Village Pack, mirrored in the same repository (Fantasy House variants).
- **Forest:** Quaternius Stylized Nature MegaKit, optimized copies in `anshaneja5/skyline-run/public/assets/models/tree*.glb`.

References:
- https://quaternius.com
- https://github.com/nishit47/Blender-Pre-vis-Pipeline---Screenplay-to-Animatic
- https://github.com/anshaneja5/skyline-run/blob/main/CREDITS.md
- https://creativecommons.org/publicdomain/zero/1.0/

## Acceptance checks

1. Open /world on desktop: WebGL scene immediately playable even before asset downloads resolve.
2. Asset status changes to "3D assets active: N/M" when at least one imported GLB decodes; to "Offline 3D fallback active" otherwise.
3. Character selection changes the actual 3D mesh when a corresponding imported model exists.
4. Walk (W), release, wait: the player stops; focus/visibility loss clears input; mobile directional controls release on pointer cancel/lost capture.
5. Enter the Post Office and Library proximity zones; links must still open existing authenticated screens.
6. Validate on low-end Android. If frame rate or memory degrades, reduce tree density / model sizes and add LOD and same-origin asset optimization.

## Next production-quality milestone

The Three.js PBR renderer, authored GLB textures and native skeletal AnimationMixer are now integrated without expanding the frontend npm lockfile. Next vendor the optimized GLB assets under same-origin URLs, improve authored highland terrain, add streaming LOD/occlusion and performance telemetry, consider moving the vendored runtime to an audited npm-managed @react-three/fiber + drei implementation, and author collision meshes. A cinematic concept image alone cannot substitute for these actual 3D deliverables.

**Terrain rendering update:** The Three.js scene now sculpts a continuous, mountain-scale elevation mesh with ridges and summit color blending, rather than repeating cone silhouettes. All game terrain and mountains remain geometrical 3D surfaces.
