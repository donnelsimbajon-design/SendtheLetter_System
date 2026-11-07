import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, Footprints, Gamepad2, HelpCircle, MapPin, RotateCcw, Sparkles, Users, X } from 'lucide-react';
import { useWriterPreferences } from '../../store/writerPreferences';
import { startApoWorld } from '../../game/apoWorldEntry';
import { WORLD_AVATARS, WORLD_LANDMARKS, type WorldAvatar, type WorldController, type WorldLandmark, type WorldMove } from '../../game/apoWorldEngine';
import '../../apoWorld.css';

const CONTROL_KEYS: { move: WorldMove; label: string; icon: string }[] = [
  { move: 'forward', label: 'Move forward', icon: '▲' },
  { move: 'left', label: 'Move left', icon: '◀' },
  { move: 'back', label: 'Move backward', icon: '▼' },
  { move: 'right', label: 'Move right', icon: '▶' },
];

export default function ApoWorldPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<WorldController | null>(null);
  const reduceMotion = useWriterPreferences(state => state.preferences.reduceMotion);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [nearby, setNearby] = useState<WorldLandmark | null>(null);
  const [location, setLocation] = useState({ x: 0, z: 18 });
  const [selected, setSelected] = useState<WorldLandmark | null>(null);
  const [visited, setVisited] = useState<string[]>([]);
  const [models, setModels] = useState<{loaded:number;total:number}|null>(null);
  // Small first-visit prompt; neither the help drawer nor the avatar picker
  // should cover the 3D world unless the player explicitly opens them.
  const [showHelp, setShowHelp] = useState(false);
  const [showAvatars, setShowAvatars] = useState(false);
  const [showIntro, setShowIntro] = useState(() => {
    try { return localStorage.getItem('apo-world:onboarded:v1') !== 'yes'; }
    catch { return true; }
  });
  const beginExploring = () => {
    setShowIntro(false);
    setShowHelp(false);
    setShowAvatars(false);
    try { localStorage.setItem('apo-world:onboarded:v1', 'yes'); } catch { /* storage optional */ }
    canvasRef.current?.focus();
  };
  const [avatar, setAvatar] = useState<WorldAvatar>(() => {
    try {
      const stored=localStorage.getItem('apo-world:avatar:v1');
      return WORLD_AVATARS.some(item=>item.id===stored)?stored as WorldAvatar:'explorer';
    } catch { return 'explorer'; }
  });
  const chooseAvatar=(next:WorldAvatar)=>{
    setAvatar(next);
    worldRef.current?.setAvatar(next);
    try { localStorage.setItem('apo-world:avatar:v1',next); } catch { /* storage unavailable */ }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setModels(null);
    const controller = startApoWorld(canvas, {
      reduceMotion,
      onReady: () => setReady(true),
      onAssets: (loaded,total) => setModels({loaded,total}),
      onError: message => { setReady(false); setError(message); },
      onPosition: setLocation,
      onNearby: setNearby,
      onInteract: landmark => {
        setSelected(landmark);
        if (landmark) setVisited(before => before.includes(landmark.id) ? before : [...before, landmark.id]);
      },
    });
    worldRef.current = controller;
    controller.setAvatar(avatar);
    return () => {
      controller.dispose();
      worldRef.current = null;
    };
  }, [reduceMotion]);

  const press = (move: WorldMove, active: boolean) => worldRef.current?.setMove(move, active);
  const interact = () => {
    worldRef.current?.interact();
    setShowHelp(false);
    setShowAvatars(false);
    setShowIntro(false);
  };

  return (
    <main className="apo-world" aria-label="Apo Letter World 3D adventure">
      <a href="#world-controls" className="apo-skip">Skip the 3D scene and open game controls</a>
      <div className="apo-world-sky" aria-hidden="true" />
      <header className="apo-topbar">
        <Link to="/dashboard" className="apo-back"><ArrowLeft size={17} aria-hidden="true" /> My writing space</Link>
        <div className="apo-brand">
          <span className="apo-brand-icon" aria-hidden="true">✉</span>
          <span><strong>Apo Letter World</strong><small>A mountain of stories</small></span>
        </div>
        <div className="apo-top-actions">
          <span className="apo-solo"><span aria-hidden="true">●</span> Solo exploration</span>
          <button type="button" aria-label="Choose character" title="Choose character" onClick={() => { setShowIntro(false); setShowHelp(false); setShowAvatars(v=>!v); }}><Users size={19} /></button>
          <button type="button" aria-label="How to play" title="How to play" onClick={() => { setShowIntro(false); setShowAvatars(false); setShowHelp(v=>!v); }}><HelpCircle size={19} /></button>
          <button type="button" aria-label="Return to start" title="Return to start" onClick={() => { worldRef.current?.reset(); setSelected(null); }}><RotateCcw size={18} /></button>
        </div>
      </header>

      <section className="apo-stage" aria-label="Playable third-person 3D mountain village">
        <canvas
          ref={canvasRef}
          data-testid="apo-3d-canvas"
          aria-label="Interactive 3D mountain village. Use W A S D or arrow keys to walk, drag to turn the camera, press E to interact. Touch controls are also available."
          tabIndex={0}
          onContextMenu={event => event.preventDefault()}
          className="apo-canvas"
        />
        {!ready && !error && <div className="apo-loading" role="status"><Sparkles size={30} aria-hidden="true" /> Building the mountain village in 3D…</div>}
        {error && <div className="apo-unavailable" role="alert">
          <h2>3D world unavailable</h2>
          <p>{error}</p>
          <p>Your letters are safe. You can still use your regular writing space.</p>
          <Link to="/dashboard">Return to dashboard</Link>
        </div>}

        {ready && <div className="apo-world-hud">
          <div className="apo-hud-place">
            <span className="apo-hud-icon"><Compass size={20} aria-hidden="true" /></span>
            <span><strong>Mt. Apo-inspired Highlands</strong><small>Letter Plaza · Mountain Village</small><small className="apo-model-status" data-testid="apo-model-status">{!models ? 'Loading detailed GLB models…' : models.loaded>0 ? `3D assets active: ${models.loaded}/${models.total}` : 'Offline 3D fallback active'}</small></span>
          </div>
          <div className="apo-hud-progress" aria-label={'Discovered ' + visited.length + ' of ' + WORLD_LANDMARKS.length + ' places'}>
            <span className="apo-hud-progress-label"><MapPin size={14} aria-hidden="true" /> Places discovered</span>
            <strong>{visited.length} / {WORLD_LANDMARKS.length}</strong>
          </div>
        </div>}

        {ready && <div className="apo-world-locate" data-testid="world-position" aria-label="Current avatar coordinates">
          <Footprints size={14} aria-hidden="true" /> X {location.x.toFixed(1)} · Z {location.z.toFixed(1)}
        </div>}

        {ready && nearby && !selected && <button type="button" className="apo-interact-prompt" aria-label={'Interact with ' + nearby.title} onClick={interact}>
          <span className="apo-key-hint">E</span>
          <span><strong>{nearby.title}</strong><small>Tap or press E to interact</small></span>
          <span className="apo-interact-sparkle" aria-hidden="true">✦</span>
        </button>}

        {ready && showIntro && !showHelp && !showAvatars && <aside className="apo-welcome-pill" aria-label="Welcome to Apo Letter World">
          <span><strong>Explore Mt. Apo Village</strong><small>WASD to walk · Drag to look · E to interact</small></span>
          <button type="button" onClick={beginExploring}>Start exploring <span aria-hidden="true">✦</span></button>
        </aside>}

        {ready && showHelp && <aside className="apo-help-card apo-compact-panel" aria-label="How to play Apo Letter World">
          <button type="button" aria-label="Close controls guide" onClick={() => {setShowHelp(false);canvasRef.current?.focus();}} className="apo-help-close"><X size={16} /></button>
          <span className="apo-kicker">Explore freely</span>
          <h1>Walk into a world of letters.</h1>
          <p>Visit the Plaza, Post Office, Library, and village paths. Press E near a place to interact.</p>
          <div className="apo-help-keys"><span>W A S D / Arrow keys</span><strong>Walk</strong></div>
          <div className="apo-help-keys"><span>Drag / Swipe</span><strong>Look around</strong></div>
          <div className="apo-help-keys"><span>E / Interact</span><strong>Visit place</strong></div>
          <div className="apo-help-keys"><span>Shift / Space</span><strong>Run / Jump</strong></div>
          <button type="button" className="apo-start-button" onClick={beginExploring}>Start exploring <span aria-hidden="true">✦</span></button>
        </aside>}

        {ready && showAvatars && <aside className="apo-help-card apo-compact-panel" aria-label="Choose your 3D character">
          <button type="button" aria-label="Close character selection" onClick={() => {setShowAvatars(false);canvasRef.current?.focus();}} className="apo-help-close"><X size={16} /></button>
          <span className="apo-kicker">Your adventure, your style</span>
          <h2 className="apo-avatar-title">Choose your 3D character</h2>
          <div className="apo-avatar-picker" role="group" aria-label="Select 3D character model">
            {WORLD_AVATARS.map(option => <button
              key={option.id}
              type="button"
              aria-pressed={avatar===option.id}
              className={avatar===option.id?'apo-avatar-option is-active':'apo-avatar-option'}
              onClick={() => chooseAvatar(option.id)}
              title={option.description}
            >
              <span className={`apo-avatar-swatch apo-avatar-${option.id}`} aria-hidden="true">●</span>
              <strong>{option.label}</strong>
            </button>)}
          </div>
          <button type="button" className="apo-start-button" onClick={beginExploring}>Continue exploring <span aria-hidden="true">✦</span></button>
        </aside>}

        {selected && <aside className="apo-activity" aria-label="World location details">
          <button type="button" className="apo-activity-close" aria-label="Close location details" onClick={() => { setSelected(null); canvasRef.current?.focus(); }}><X size={17} /></button>
          <span className="apo-kicker">Discovered in Apo Letter World</span>
          <h2>{selected.title}</h2>
          <p>{selected.description}</p>
          {selected.action && <Link className="apo-activity-link" to={selected.action.href}>{selected.action.label} <span aria-hidden="true">↗</span></Link>}
          {!selected.action && <button type="button" className="apo-activity-link" onClick={() => { setSelected(null); canvasRef.current?.focus(); }}>Keep exploring <span aria-hidden="true">✦</span></button>}
        </aside>}

        <div id="world-controls" className="apo-controls" aria-label="3D movement controls">
          <div className="apo-dpad" aria-label="Mobile direction controls">
            {CONTROL_KEYS.map(item => <button
              key={item.move}
              type="button"
              data-move={item.move}
              aria-label={item.label}
              onPointerDown={event => {event.preventDefault();try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* synthetic or unsupported pointer */ }press(item.move,true);}}
              onPointerUp={() => press(item.move,false)}
              onLostPointerCapture={() => press(item.move,false)}
              onPointerCancel={() => press(item.move,false)}
              onPointerLeave={() => press(item.move,false)}
            >{item.icon}</button>)}
          </div>
          <div className="apo-control-actions">
            <button type="button" aria-label="Run while moving" onPointerDown={event => {try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* synthetic or unsupported pointer */ }press('sprint',true);}} onPointerUp={() => press('sprint',false)} onLostPointerCapture={() => press('sprint',false)} onPointerCancel={() => press('sprint',false)} onPointerLeave={() => press('sprint',false)}>Run</button>
            <button type="button" aria-label="Jump" disabled={!ready} onClick={() => worldRef.current?.jump()}>Jump</button>
            <button type="button" onClick={interact} disabled={!nearby || !ready} aria-label="Interact with nearby landmark"><Gamepad2 size={19} /> Interact</button>
          </div>
        </div>
        <span className="apo-world-note">Playable 3D exploration preview · No live multiplayer yet · Private letters stay private</span>
      </section>
    </main>
  );
}
