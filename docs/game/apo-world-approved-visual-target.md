# Apo Letter World — Approved 3D visual target and implementation map

The user-approved generated references depict three coordinated targets: **Letter Plaza and Mt. Apo village**, **five traveler/guide character designs**, and a **mountain-village asset collection**. The references are concept art; they are **not** .glb character rigs, terrain geometry, PBR textures, or final screenshots of the running game.

## Locked core layout

| Approved visual feature | Implementation location | Current status |
|---|---|---|
| Central stone Letter Plaza and letter monument | `apoThreeWorldEngine.ts`, `apoVillageArt.ts` | 3D, now with irregular stone edging |
| Post Office on the left | `apoAssetCatalog.ts`, `apoThreeWorldEngine.ts` | Authored GLB with in-world wood sign; current house asset is still a placeholder for custom Post Office |
| Letter Library on the right | same | Authored GLB with readable sign; custom Library model still needed |
| Wood-and-stone cottage cluster behind central plaza | `SCENIC_COTTAGES` in `apoVillageArt.ts` | Four additional scaled and rotated *real GLB house instances*; scenic-only, no ownership yet |
| Lanterns, flower gardens, wooden fences | `apoVillageArt.ts` | True 3D PBR meshes, instanced for performance |
| Organic grass and ferns | `apoLandscapeDetail.ts` | Real 3D geometry with a mobile/desktop budget |
| Mt. Apo-inspired mountain backdrop | `apoThreeWorldEngine.ts` | Sculpted 3D massif; not geographically surveyed Mt. Apo topology |
| Explorer, Ranger, Traveler, Alexis, Iver | `apoAssetCatalog.ts`, `apoThreeWorldEngine.ts` | Existing licensed 3D models and animations; bespoke character designs in reference sheet not yet modeled |

## Reference-to-production rules

1. **Never** substitute the concept art as a flat sky/ground or claim that it is a playable 3D asset.
2. Village readability matters: Letter Plaza remains the center; Post Office left; Library right; paths stay open; flowers and fences stay outside the active walking routes.
3. Treat the character sheet as a **model brief**, not as an exported GLB. Custom artist-produced/skinned GLBs are required to reach the pictured faces, outfits and proportions.
4. Long-term target: realistic-stylized PBR materials, authored bark/leaf texture, fitted architectural detail, balanced daylight, ground contact shadows, native-inspired flora and visible prop scale.
5. **Only add detailed models after validating source licensing, file size, animation compatibility, collision boundaries and mobile frame rate.** The game's private letters and existing login must remain unaffected.
6. Keep render-budgeted details in meshes/instances. Avoid hundreds of draw calls to fake grass/flowers on low-power devices.

## Implementation milestones and honest scope

**Implemented in this pull request:** PBR in-world sign boards, wood lanterns, flower clusters, granite plaza edging, wooden fence sections, four added GLB cottage instances and collision checks, using the approved village composition.

**Not yet implemented:** exact screenshot-quality cinematic realism, bespoke hero Post Office and Library meshes, bespoke rigged player/NPC meshes matching the generated reference sheet, true day/night cycle, ownership/purchasing and decorating houses, first-person camera, or multiplayer.

### QA checklist

- Three.js scene renders without falling back silently; no Vite overlay or white terrain.
- Check both desktop and compact mobile Playwright screenshots without tutorial overlay.
- `data-apo-village-lanterns` is 8, `data-apo-village-signage` is 2, and flower count is > 0.
- Cottage models download and render when online; if asset fetch fails, preserve the original two-building world.
- Walking, W-release, mobile arrows, jump, interaction and safe letter navigation still work.
- On hardware, inspect light intensity, geometry scale and frame pacing before shipping.

Do not mark the visual target "pixel-accurate" or "photorealistic" until the bespoke 3D source models, textured world art and actual in-browser rendered comparisons are accepted.
