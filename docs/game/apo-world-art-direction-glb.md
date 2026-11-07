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

This is *not* a photorealistic Unreal-like renderer. Full PBR specular/light maps, real cast shadows, rigged skeletal animation and LOD streaming are later work.

## Current integration

Source files:
- `Note_letter/src/game/apoGlbLoader.ts`: basic glTF 2.0 GLB loader, real vertex geometry and normals, scene transforms, embedded base-color textures baked once to per-vertex colors.
- `Note_letter/src/game/apoAssetCatalog.ts`: curated GLB sources and scale targets.
- `Note_letter/src/game/apoWorldEngine.ts`: responsive rendering, terrain, collisions, camera, fallback models and replacement of model instances.
- `Note_letter/src/Pages/user/ApoWorldPage.tsx`: real-time model-load status and existing movement / avatar chooser.

Loaded assets replace primitive player/NPC/forest/village geometry *only when successfully decoded*. Model fetch failure leaves the existing scene playable. Asset loads are aborted when leaving the route. Private letter content and auth are not affected.

Model importer constraints:
- GLB 2.0 containing mesh triangle primitives.
- Node transform, float/byte/short/index accessors, materials, embedded image textures.
- Meshes draw in their bind pose with a light GPU stride. **Skinned skeletal animation, GLTF runtime animation clips, Draco/Meshopt and full PBR lighting are not implemented.**
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

Adopt Three.js + React Three Fiber + drei with an audited lockfile, local optimized GLB files and skeletal animation clips. Use proper PBR materials, shadow maps, environment lighting, animation retargeting, collision meshes, and authored Mt. Apo terrain sections. A cinematic concept image alone cannot substitute for these 3D deliverables.
