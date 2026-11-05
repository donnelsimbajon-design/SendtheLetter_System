# Apo Letter World — real 3D first playable slice

Route: \`/world\` (authenticated users only; redirected to normal sign-in with return URL when signed out).

This is a **WebGL 3D solo exploration MVP**, not a 2D panorama and not a multiplayer release. The visuals are an original procedurally generated fantasy mountain village inspired by the user-selected stylized mountain game screenshot and the Mt. Apo landscape. They are not a copied map, detailed real-world terrain, or geospatial reconstruction of Mt. Apo.

## Playable functionality

- Actual perspective camera, GPU depth testing, sunlit mesh geometry, terrain height, atmospheric fog, mountain range, forest, trails, buildings, mailboxes and park details.
- Third-person chibi player movement via WASD/arrows, Shift sprint, Space jump; drag/swipe to rotate camera; mouse wheel to zoom.
- Mobile on-screen directional controls and Interact/Run controls; keyboard E or tap to interact with a nearby landmark.
- Locations: Letter Plaza, Mountain Post Office, Storybook Library, Time Capsule Garden, Alexis and Iver NPCs. Discoveries count within the current page session.
- Writing/library/scheduled-letter actions navigate to existing authenticated screens; no shadow data store and **no private letter content exposed in the world**.
- Browser WebGL fallback provides an honest unavailable message plus route to normal dashboard—not a misleading static 2D representation of gameplay.
- Respects the user preference to reduce motion, caps device pixel ratio and releases the GPU buffers, events and animation frame on navigation.

## Deliberate boundaries

- There are **no other players, networking, chat bubbles, persistence or economy** in this MVP. Multiplayer must be separately designed with authenticated Socket.IO rooms, server-authoritative movement limits, rate limiting, privacy and moderation.
- 3D art is programmatic/stylized. Premium Blender-exported GLB assets, collision meshes, skeletal animation, high-detail mountain terrain, baked lighting and streaming level-of-detail can follow once the mechanics are proven.
- No server, database, Supabase or Render configuration changes. The route is lazy loaded to avoid increasing initial bundle work for readers who do not enter the game.

## Rollout and QA

1. Pass frontend production build and desktop/mobile Playwright smoke checks.
2. Merge the PR; verify deployment exact revision, not just auto-deploy setting. Release independently of the API.
3. Manually test on a real low-end Android phone, desktop WebGL and reduced-motion mode. Ensure movement, scene performance, camera, interactions and return links work.
4. For later multiplayer, design a safety and privacy model (no automatic letter disclosure, access controls, player mute/block/report, no raw private content in proximity events) before opening the world to real user-to-user gameplay.
