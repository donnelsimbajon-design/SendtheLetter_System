import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Render provides RENDER_GIT_COMMIT at build time. GitHub CI exposes GITHUB_SHA.
// Emit only a public commit identifier: never serialize build environment variables.
const buildVersion = (): Plugin => ({
    name: 'sendtheletter-build-version',
    apply: 'build',
    generateBundle() {
        const raw = (process.env.RENDER_GIT_COMMIT || process.env.GITHUB_SHA || '').trim()
        const commit = /^[a-f0-9]{40}$/i.test(raw) ? raw.toLowerCase() : null
        this.emitFile({
            type: 'asset',
            fileName: 'build-version.json',
            source: JSON.stringify({ commit }) + '\n',
        })
    },
})

export default defineConfig({
    plugins: [react(), buildVersion()],
})
