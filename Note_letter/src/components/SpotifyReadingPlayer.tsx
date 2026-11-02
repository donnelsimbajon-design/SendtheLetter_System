import { useEffect, useRef, useState } from 'react';
import { Headphones, Music2, Pause, Play, RotateCcw, ExternalLink } from 'lucide-react';
import CharacterBadge from './CharacterBadge';
import { formatSpotifyTime, parseSpotifyMedia } from '../lib/spotify';

type Update = { position: number; duration: number; isPaused: boolean; isBuffering?: boolean; playingURI?: string };
type SpotifyEvent = { data: Update };
interface EmbedController {
    addListener(event: string, handler: (event: SpotifyEvent) => void): void;
    play(): void;
    pause(): void;
    seek(seconds: number): void;
    destroy(): void;
}
interface SpotifyIframeAPI {
    createController(
        element: HTMLElement,
        options: { width: string; height: number; uri: string },
        callback: (controller: EmbedController) => void
    ): void;
}
declare global {
    interface Window { onSpotifyIframeApiReady?: (api: SpotifyIframeAPI) => void; }
}

// Load the vendor API just once, only when the reader opens a Spotify letter.
let apiPromise: Promise<SpotifyIframeAPI> | null = null;
function getSpotifyApi(): Promise<SpotifyIframeAPI> {
    if (apiPromise) return apiPromise;
    apiPromise = new Promise<SpotifyIframeAPI>((resolve, reject) => {
        const script = document.createElement('script');
        const timeout = window.setTimeout(() => {
            apiPromise = null;
            reject(new Error('Spotify took too long to load.'));
        }, 15000);
        const fail = () => {
            window.clearTimeout(timeout);
            apiPromise = null;
            reject(new Error('Spotify could not load. You can still open the song in Spotify.'));
        };
        window.onSpotifyIframeApiReady = api => {
            window.clearTimeout(timeout);
            resolve(api);
        };
        script.src = 'https://open.spotify.com/embed/iframe-api/v1';
        script.async = true;
        script.onerror = fail;
        document.head.appendChild(script);
    });
    return apiPromise;
}

type Playback = { position: number; duration: number; paused: boolean; buffering: boolean; sampledAt: number };
const emptyPlayback: Playback = { position: 0, duration: 0, paused: true, buffering: false, sampledAt: 0 };

interface Props { spotifyLink: string; title: string; }

export default function SpotifyReadingPlayer({ spotifyLink, title }: Props) {
    const media = parseSpotifyMedia(spotifyLink);
    const mount = useRef<HTMLDivElement>(null);
    const controller = useRef<EmbedController | null>(null);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState('');
    const [playback, setPlayback] = useState<Playback>(emptyPlayback);
    const [clock, setClock] = useState(0);
    const [heardPlaying, setHeardPlaying] = useState(false);

    // The component unmounts when the letter is closed or replaced. This
    // destroys the embed and stops the soundtrack rather than leaking audio.
    useEffect(() => {
        if (!media || !mount.current) return;
        let disposed = false;
        let current: EmbedController | null = null;
        setReady(false);
        setError('');
        setHeardPlaying(false);
        setPlayback(emptyPlayback);
        getSpotifyApi().then(api => {
            if (disposed || !mount.current) return;
            api.createController(mount.current, { width: '100%', height: 80, uri: media.uri }, player => {
                if (disposed) { player.destroy(); return; }
                current = player;
                controller.current = player;
                player.addListener('ready', () => {
                    if (disposed) return;
                    setReady(true);
                    // Best effort: autoplay may be blocked by the browser or
                    // Spotify. The Play button always provides a user gesture.
                    try { player.play(); } catch { /* manual play remains available */ }
                });
                player.addListener('playback_started', () => {
                    if (disposed) return;
                    setHeardPlaying(true);
                    setPlayback(previous => ({ ...previous, paused: false, buffering: false, sampledAt: performance.now() }));
                });
                player.addListener('playback_update', event => {
                    if (disposed) return;
                    const data = event.data;
                    setPlayback({
                        position: Number.isFinite(data.position) ? Math.max(0, data.position) : 0,
                        duration: Number.isFinite(data.duration) ? Math.max(0, data.duration) : 0,
                        paused: data.isPaused,
                        buffering: !!data.isBuffering,
                        sampledAt: performance.now(),
                    });
                    if (!data.isPaused) setHeardPlaying(true);
                });
            });
        }).catch(e => { if (!disposed) setError(e instanceof Error ? e.message : 'Spotify could not load.'); });
        return () => {
            disposed = true;
            controller.current = null;
            // Destroy handles both pausing and removing the embedded player.
            current?.destroy();
        };
    }, [media?.uri]);

    useEffect(() => {
        if (playback.paused || playback.buffering) return;
        const interval = window.setInterval(() => setClock(performance.now()), 1000);
        setClock(performance.now());
        return () => window.clearInterval(interval);
    }, [playback.paused, playback.buffering]);

    if (!media) return null;

    const estimatedPosition = playback.position + (!playback.paused && !playback.buffering && playback.sampledAt
        ? Math.max(0, clock - playback.sampledAt) : 0);
    const position = playback.duration ? Math.min(playback.duration, estimatedPosition) : estimatedPosition;
    const remaining = Math.max(0, playback.duration - position);
    const playing = heardPlaying && !playback.paused && !playback.buffering;
    const isLoaded = ready && !error;

    const seekTo = (seconds: number) => {
        if (!isLoaded || !playback.duration) return;
        controller.current?.seek(seconds);
        setPlayback(p => ({ ...p, position: seconds * 1000, sampledAt: performance.now() }));
        setClock(performance.now());
    };

    return <section aria-label="Letter soundtrack" className="border-b border-[#e3d7c7] bg-[#fff9ef]/95 px-4 py-3 shadow-[0_7px_25px_rgba(60,46,31,.05)] backdrop-blur sm:px-6">
        <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3">
                <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d8c7ae] bg-[#efe3d1] sm:flex">
                    <CharacterBadge name="tala" tone="gold" size="sm" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-[#94735b]"><Headphones size={13} /> Soundtrack for this letter</p>
                    <p className="mt-0.5 truncate font-editorial text-sm font-semibold text-[#31483c] sm:text-base" title={title}>{title || 'A letter to read with music'}</p>
                </div>
                <button type="button"
                    onClick={() => {
                        if (!isLoaded) return;
                        if (playing) controller.current?.pause();
                        else controller.current?.play();
                    }}
                    disabled={!isLoaded}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-[#304c40] text-white shadow-sm transition hover:bg-[#233a31] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#304c40] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={playing ? 'Pause letter soundtrack' : 'Play letter soundtrack'}
                    title={playing ? 'Pause' : 'Play'}
                >{playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
                <button type="button" onClick={() => { if (isLoaded) { controller.current?.seek(0); setClock(performance.now()); } }}
                    disabled={!isLoaded || !playback.duration} aria-label="Restart soundtrack"
                    className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[#ddd0bf] text-[#796653] hover:bg-white disabled:opacity-40">
                    <RotateCcw size={16} />
                </button>
            </div>
            <div className="mt-3 flex items-center gap-2.5">
                <Music2 className="shrink-0 text-[#9e846a]" size={15} />
                <label className="sr-only" htmlFor="letter-soundtrack-progress">Soundtrack position</label>
                <input id="letter-soundtrack-progress" type="range" min="0" max={Math.max(1, Math.floor(playback.duration / 1000))}
                    step="1" value={Math.min(Math.floor(position / 1000), Math.max(1, Math.floor(playback.duration / 1000)))}
                    disabled={!isLoaded || !playback.duration} onChange={event => seekTo(Number(event.target.value))}
                    className="h-1.5 min-w-0 flex-1 cursor-pointer accent-[#304c40] disabled:cursor-default disabled:opacity-40"
                />
                <time className="w-12 text-right font-mono text-xs tabular-nums text-[#665b4d]" aria-label="Soundtrack time remaining">
                    {playback.duration ? `-${formatSpotifyTime(remaining)}` : '--:--'}
                </time>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#857260]" aria-live="polite">
                    {error || (!ready ? 'Connecting to Spotify…'
                        : playback.buffering ? 'Buffering soundtrack…'
                        : !heardPlaying ? 'Tap Play if your browser blocks autoplay.'
                        : playback.paused ? 'Paused — continue whenever you like.'
                        : 'Playing as you read')}
                </span>
                <a href={media.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-[#44634d] underline-offset-2 hover:underline">
                    Spotify <ExternalLink size={12} />
                </a>
            </div>
            {/* Keep the official Spotify embed visible for track artwork, account-
                dependent controls and a fallback when its API is restricted. */}
            <div ref={mount} data-testid="spotify-official-embed" className="mt-2 overflow-hidden rounded-xl bg-[#eee6db]" />
        </div>
    </section>;
}
