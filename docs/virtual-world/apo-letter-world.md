# Apo Letter World — 3D exploration MVP

Apo Letter World is a real WebGL-powered solo game for authenticated SendTheLetter members, implemented as a lazy-loaded React route at /world.

## Gameplay in this release

- Actual 3D geometry: triangulated terrain, distant jagged mountain peaks inspired by Mt. Apo, wooded A-frame village, planted trees and flowers, lanterns, winding paths, and a letter plaza.
- Real third-person, orbitable perspective camera with depth testing and fog; the player moves through 3D world coordinates. Not a panorama, 2D parallax, static backdrop, image-based fake 3D, or decorative banner.
- A chibi 3D player: WASD/arrow keys to walk, Shift to run, mouse/touch drag to rotate camera, E to interact, and on-screen touch directional controls.
- 3D NPCs Alexis and Iver with introductory dialogues; their dialogue uses the existing character art as portraits, while the in-world characters are actual 3D meshes.
- Interactive stations: Post Office opens the existing authenticated compose page; Community Library opens published letters; Time Capsule Garden opens existing scheduled letters. No private letter body is rendered in the game.
- Travel shortcuts for accessibility and testing. Collisions keep the player outside cottages.
- The dashboard now has a game entry point and desktop navigation shortcut. The game does not alter messaging, composing, public reading or accounts.
- WebGL unavailable gives a clear explanation and links to the ordinary letter application; no fake 2D game.
- The motion preference disables avatar bobbing; the renderer releases GPU resources on route exit and caps pixel density.

## Not shipped yet

This is not a networked MMORPG. Other users' live avatars, world chat, avatar customization, persistent quests, authoritative multiplayer state and advanced physics are NOT present. Do not advertise them as live.

## Next milestones

1. Visual art pass: Blender-authored optimized GLB cottages, detailed Mt. Apo-inspired mountain terrain, bridges, village props, sky shader. Current environment is a lightweight procedural 3D foundation.
2. Characters: detailed 3D models of Alexis and Iver matching their plush art, walking animation clips and avatar customization.
3. Gameplay: postal errands and a letter quest journal, only using public letters or the current member's authorized letters.
4. Multiplayer after a separate security review: authenticated Socket.IO world rooms, server-authoritative positions, movement rate limits, capped instances, proximity filtering, blocked-user enforcement, reporting, and opt-in interactions.
5. Performance and infra: world metrics, quality presets, streamed optimized GLB models, spatial partitions, optimized asset caching.

## QA and rollout

Run frontend build and the browser test suite for tests/browser/apo-world.spec.mjs; GitHub CI runs desktop/mobile Chromium. Verify direct refresh of /world and the exact Render deployed Git SHA. Do not modify Render API, Supabase tables, or authentication permissions for the MVP. Manually verify actual desktop and phone touch controls after deploying.
