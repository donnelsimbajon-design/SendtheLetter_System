import { parseSpotifyMedia } from './spotify';

export type LetterMusicLink = { platform: 'spotify' | 'youtube'; url: string };

export function parseLetterMusicLink(value?: string | null): LetterMusicLink | null {
    const spotify = parseSpotifyMedia(value);
    if (spotify) return { platform: 'spotify', url: spotify.url };
    if (!value || value.length > 2048) return null;
    try {
        const parsed = new URL(value.trim());
        if (parsed.protocol !== 'https:' || parsed.port || parsed.username || parsed.password) return null;
        const host = parsed.hostname.toLowerCase();
        let id: string | null = null;
        if (host === 'youtu.be') id = parsed.pathname.match(/^\/([a-zA-Z0-9_-]{11})\/?$/)?.[1] ?? null;
        if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
            id = parsed.pathname === '/watch' ? parsed.searchParams.get('v') :
                parsed.pathname.match(/^\/(?:shorts|embed)\/([a-zA-Z0-9_-]{11})\/?$/)?.[1] ?? null;
        }
        if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) return null;
        return { platform: 'youtube', url: `https://www.youtube.com/watch?v=${id}` };
    } catch {
        return null;
    }
}
