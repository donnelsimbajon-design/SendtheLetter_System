/** Strictly allow Spotify's official, embeddable HTTPS URLs.
 * Do not turn arbitrary user-entered URLs into active iframe/script sources.
 */
export type SpotifyMedia = { uri: string; url: string; type: 'track' | 'album' | 'playlist' | 'episode' | 'show' };
const kinds = new Set(['track', 'album', 'playlist', 'episode', 'show']);

export function parseSpotifyMedia(input?: string | null): SpotifyMedia | null {
    if (!input || input.length > 2048) return null;
    let url: URL;
    try { url = new URL(input.trim()); } catch { return null; }
    if (url.protocol !== 'https:' || url.hostname !== 'open.spotify.com' || url.username || url.password || url.port) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    if (/^intl-[a-z]{2,5}$/i.test(parts[0] || '')) parts.shift();
    if (parts[0] === 'embed') parts.shift();
    if (parts.length !== 2 || !kinds.has(parts[0]) || !/^[a-zA-Z0-9]{22}$/.test(parts[1])) return null;
    const type = parts[0] as SpotifyMedia['type'];
    return { uri: `spotify:${type}:${parts[1]}`, url: `https://open.spotify.com/${type}/${parts[1]}`, type };
}

export function formatSpotifyTime(milliseconds: number): string {
    const seconds = Math.floor(Math.max(0, Number.isFinite(milliseconds) ? milliseconds : 0) / 1000);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
