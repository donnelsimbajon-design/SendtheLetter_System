import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Compass, DoorOpen, Footprints, Info, MapPinned, Mountain, RotateCcw, Sparkles, X } from 'lucide-react';
import { useWriterPreferences } from '../store/writerPreferences';
import {
  LANDMARKS, startApoWorld,
  type Direction, type LandmarkId, type Snapshot, type WorldGame,
} from '../world/ApoWorldEngine';
import './virtualWorld.css';

const movement: Record<string, Direction> = {
  w: 'forward', ArrowUp: 'forward',
  s: 'back', ArrowDown: 'back',
  a: 'left', ArrowLeft: 'left',
  d: 'right', ArrowRight: 'right',
  Shift: 'sprint',
};
const startSnapshot: Snapshot = { x: 0, z: 19, nearby: null, moving: false };

function MoveButton({ direction, label, children, game }: {
  direction: Direction; label: string; children: React.ReactNode; game: React.RefObject<WorldGame | null>;
}) {
  const release = () => game.current?.hold(direction, false);
  return <button type="button" aria-label={label} title={label} className="stl-world-move"
    onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      game.current?.hold(direction, true);
    }}
    onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}
    onContextMenu={event => event.preventDefault()}>{children}</button>;
}

export default function VirtualWorldPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<WorldGame | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot>(startSnapshot);
  const [supported, setSupported] = useState(true);
  const [ready, setReady] = useState(false);
  const [guide, setGuide] = useState<LandmarkId | null>(null);
  const [showPlaces, setShowPlaces] = useState(false);
  const reduceMotion = useWriterPreferences(state => state.preferences.reduceMotion);
  const nearby = LANDMARKS.find(item => item.id === snapshot.nearby);
  const guidePerson = LANDMARKS.find(item => item.id === guide);
  const locationLabel = nearby?.name || 'Letter Plaza';

  const interact = useCallback((id: LandmarkId) => {
    if (id === 'post') navigate('/dashboard/notes?compose=1');
    if (id === 'library') navigate('/dashboard/community');
    if (id === 'capsule') navigate('/dashboard/notes?tab=scheduled');
    if (id === 'alexis' || id === 'iver') setGuide(id);
  }, [navigate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = startApoWorld(canvas, setSnapshot, interact, () => setSupported(false), reduceMotion);
    gameRef.current = game;
    setReady(Boolean(game));
    return () => { game?.dispose(); gameRef.current = null; };
  }, [interact, reduceMotion]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.closest('input,textarea,select,[contenteditable="true"]') || target.closest('[role="dialog"]'))) return;
      if (event.key.toLowerCase() === 'e' && !event.repeat) { event.preventDefault(); gameRef.current?.interact(); return; }
      const direction = movement[event.key.length === 1 ? event.key.toLowerCase() : event.key];
      if (direction) { event.preventDefault(); gameRef.current?.hold(direction, true); }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const direction = movement[event.key.length === 1 ? event.key.toLowerCase() : event.key];
      if (direction) gameRef.current?.hold(direction, false);
    };
    const onBlur = () => { for (const item of Object.values(movement)) gameRef.current?.hold(item, false); };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return <main className="stl-world-page">
    <header className="stl-world-topbar">
      <div className="stl-world-brand"><span className="stl-world-brand-icon"><Mountain size={23} aria-hidden="true" /></span>
        <div><p className="stl-world-eyebrow">SendTheLetter · Explorable 3D</p><h1>Apo Letter World</h1></div>
      </div>
      <div className="stl-world-header-actions">
        <span className="stl-world-version"><span aria-hidden="true">●</span> Real WebGL world</span>
        <Link to="/dashboard" className="stl-world-exit"><DoorOpen size={17} aria-hidden="true" /> <span>Leave world</span></Link>
      </div>
    </header>

    <section aria-label="Playable Mt. Apo-inspired 3D village" className="stl-world-viewport">
      <canvas ref={canvasRef} className="stl-world-canvas" tabIndex={0} data-testid="apo-world-canvas"
        data-renderer={supported && ready ? 'webgl' : 'unavailable'}
        aria-label="Actual 3D mountain village. Use W A S D or arrow keys to move. Drag to look around. Press E to interact." />

      {supported && ready ? <>
        <div className="stl-world-headline">
          <span className="stl-world-welcome"><Sparkles size={15} aria-hidden="true" /> A new kind of letter adventure</span>
          <h2>Explore. Write. Connect.</h2>
          <p>A cozy mountain village inspired by Mt. Apo.</p>
        </div>
        <div className="stl-world-location" aria-live="off">
          <Compass size={16} aria-hidden="true" />
          <span>{locationLabel}</span>
          <span className="stl-world-coords" data-testid="world-position">{snapshot.x.toFixed(1)}, {snapshot.z.toFixed(1)}</span>
        </div>

        <div className="stl-world-places">
          <button type="button" className="stl-world-places-toggle" aria-expanded={showPlaces}
            onClick={() => setShowPlaces(value => !value)}><MapPinned size={17} aria-hidden="true" /> Explore places <span aria-hidden="true">{showPlaces ? '−' : '+'}</span></button>
          {showPlaces && <div className="stl-world-places-body">
            {LANDMARKS.map(place => <div className="stl-world-place-row" key={place.id}>
              <div><strong>{place.name}</strong><small>{place.description}</small></div>
              <button type="button" onClick={() => { gameRef.current?.travel(place.id); setShowPlaces(false); }}
                aria-label={'Travel to ' + place.name}>Travel</button>
            </div>)}
          </div>}
        </div>

        <div className="stl-world-controls" aria-label="3D world controls">
          <div className="stl-world-dpad" aria-label="Move your avatar">
            <span aria-hidden="true" />
            <MoveButton game={gameRef} direction="forward" label="Walk forward"><ArrowUp size={19} aria-hidden="true" /></MoveButton>
            <span aria-hidden="true" />
            <MoveButton game={gameRef} direction="left" label="Walk left"><ArrowLeft size={19} aria-hidden="true" /></MoveButton>
            <MoveButton game={gameRef} direction="back" label="Walk backward"><ArrowDown size={19} aria-hidden="true" /></MoveButton>
            <MoveButton game={gameRef} direction="right" label="Walk right"><ArrowRight size={19} aria-hidden="true" /></MoveButton>
          </div>
          <div className="stl-world-controller-actions">
            <MoveButton game={gameRef} direction="sprint" label="Hold to run"><Footprints size={18} aria-hidden="true" /></MoveButton>
            <button type="button" aria-label="Turn camera left" onClick={() => gameRef.current?.rotate(-.38)}><RotateCcw size={18} aria-hidden="true" /></button>
            <button type="button" aria-label="Turn camera right" onClick={() => gameRef.current?.rotate(.38)}><RotateCcw style={{transform:'scaleX(-1)'}} size={18} aria-hidden="true" /></button>
          </div>
        </div>

        <div className="stl-world-interact" aria-live="polite">
          {nearby ? <>
            <strong>{nearby.name}</strong>
            <span>{nearby.description}</span>
            <button type="button" onClick={() => gameRef.current?.interact()} aria-label={'Interact with ' + nearby.name}>
              {nearby.action} <span className="stl-world-keycap">E</span>
            </button>
          </> : <>
            <strong>Welcome to Letter Plaza</strong>
            <span>Walk toward a glowing station, or open Explore places to travel there.</span>
            <button type="button" onClick={() => setShowPlaces(true)}>Choose a destination <ArrowRight size={14} aria-hidden="true" /></button>
          </>}
        </div>

        <p className="stl-world-help"><Info size={13} aria-hidden="true" /> WASD / arrows to walk · Shift to run · Drag to look · E to interact</p>
      </> : supported ? <div className="stl-world-loading" role="status">Building your 3D mountain village…</div>
        : <div className="stl-world-unavailable" data-testid="world-unavailable" role="status">
          <Mountain size={44} aria-hidden="true" />
          <h2>3D world unavailable on this device</h2>
          <p>This game needs WebGL. You can still use all normal letter features.</p>
          <Link to="/dashboard/notes?compose=1">Write a letter</Link>
          <Link to="/dashboard/community">Browse community letters</Link>
        </div>}
    </section>

    <footer className="stl-world-footer">
      <span><strong>Early exploration build</strong> · Real 3D solo game. Multiplayer and shared visits are coming later.</span>
      <span>Letters stay protected by your existing SendTheLetter account permissions.</span>
    </footer>

    {guidePerson && <div className="stl-world-dialog-shade" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) setGuide(null);
    }}>
      <section role="dialog" aria-modal="true" aria-label={'Talking to ' + guidePerson.name}
        className="stl-world-dialog">
        <button type="button" className="stl-world-close" aria-label="Close character dialog" onClick={() => setGuide(null)}><X size={19} /></button>
        <img src={guide === 'alexis' ? '/characters/alexis.webp' : '/characters/iver.webp'} alt="" />
        <p className="stl-world-eyebrow">A friend in the village</p>
        <h2>{guidePerson.name}</h2><p>{guidePerson.description}</p>
        <button type="button" onClick={() => { setGuide(null); setShowPlaces(true); }}>Explore the village <ArrowRight size={16} aria-hidden="true" /></button>
      </section>
    </div>}
  </main>;
}
