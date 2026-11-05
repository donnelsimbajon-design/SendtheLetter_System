import { useEffect, useState } from 'react';
import './plushCompanions.css';

export type PlushName = 'alexis' | 'iver';
type Reaction = 'idle' | 'happy' | 'grumpy' | 'shy';

type Props = {
  name: PlushName;
  size?: 'sm' | 'lg' | 'envelope';
  className?: string;
};

const reactions: Exclude<Reaction, 'idle'>[] = ['happy', 'grumpy', 'shy'];
const dialog: Record<PlushName, Record<Reaction, string>> = {
  alexis: { idle: '', happy: 'Yay! 💌', grumpy: 'Hmp! 😤', shy: 'Hehe! 💗' },
  iver: { idle: '', happy: 'Yippee! ✨', grumpy: 'Hmph! 😠', shy: 'Aww! 💕' },
};

/** Purely visual and local interaction; never writes user data or sends API calls.
 * One tap = happy, two = playful grumpy, three = shy. Resets after 2.4 seconds.
 * The source images are compressed transparent seated plush illustrations.
 */
export default function PlushCompanion({ name, size = 'lg', className = '' }: Props) {
  const [taps, setTaps] = useState(0);
  const [reaction, setReaction] = useState<Reaction>('idle');
  const [burst, setBurst] = useState(0);
  useEffect(() => {
    if (reaction === 'idle') return;
    const timeout = window.setTimeout(() => setReaction('idle'), 2400);
    return () => window.clearTimeout(timeout);
  }, [reaction, burst]);

  const label = name === 'alexis' ? 'Alexis' : 'Iver';
  return (
    <span className={`stl-plush stl-plush--${size} ${className}`} data-character={name} data-reaction={reaction}>
      <button
        type="button"
        className="stl-plush-hit"
        title={`Tap ${label} for a reaction`}
        aria-label={`Tap ${label} for a reaction`}
        onClick={() => {
          const next = taps + 1;
          setTaps(next);
          setReaction(reactions[(next - 1) % reactions.length]);
          setBurst(n => n + 1);
        }}
      >
        <span key={burst} className="stl-plush-art">
          <img src={`/characters/${name}.webp`} draggable={false} alt="" loading="eager" />
        </span>
        {reaction !== 'idle' && (
          <span className="stl-plush-speech" aria-hidden="true" key={`speech-${burst}`}>{dialog[name][reaction]}</span>
        )}
      </button>
      <span className="sr-only" role="status" aria-live="polite">{reaction === 'idle' ? '' : `${label} says ${dialog[name][reaction]}`}</span>
    </span>
  );
}
