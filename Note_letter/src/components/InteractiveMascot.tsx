import { useState } from 'react';
import Mascot, { type MascotName } from './Mascot';

type Props = {
  name: MascotName;
  className?: string;
  label?: string;
};

/** Animates the existing locally hosted SVG, never redraws or replaces it. */
export default function InteractiveMascot({ name, className = '', label }: Props) {
  const [greeting, setGreeting] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setGreeting(current => !current)}
      aria-pressed={greeting}
      aria-label={label || `Say hello to ${name}`}
      title={label || `Wave at ${name}`}
      className={`stl-mascot-interactive shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${greeting ? 'is-greeting' : ''} ${className}`}
    >
      <Mascot name={name} className="h-full w-full" loading="eager" />
    </button>
  );
}
