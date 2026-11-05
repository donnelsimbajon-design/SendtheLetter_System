# Reviewer verification: Apo Letter World

This feature deliberately launches as an authenticated **solo 3D playable preview**. There is no user-to-user multiplayer yet.

- Open the dashboard and select **Enter 3D world**, or directly open \`/world\` after signing in.
- Look for genuine GPU-rendered terrain and mountain geometry, third-person animated avatar and village props.
- Use WASD or arrow keys to move, Shift to sprint, Space to jump, drag to orbit and scroll to zoom.
- Use mobile D-pad / Run / Interact on a touch device.
- Interact near Letter Plaza, Post Office, Library, Time Capsule Garden, Alexis or Iver. Existing writing and public-letter routes should open from their world locations.
- Test logout and direct \`/world\` requests; the server must not expose private letter data.
- If WebGL is unavailable, users should see an accessible error and a safe dashboard link, not a false 2D game.

Performance: Procedural scene is built once, static geometry batched into one WebGL buffer, render loop capped to browser animation frames, pixel ratio capped and all GPU resources cleaned up on navigation.

Acceptance tests: \`tests/browser/apo-world.spec.mjs\` plus existing desktop/mobile tests. CI Chromium needs WebGL enabled (SwiftShader is typically supplied). Don't ship if any CI regression fails.
