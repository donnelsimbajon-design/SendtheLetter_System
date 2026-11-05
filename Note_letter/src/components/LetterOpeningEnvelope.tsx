import { Heart } from 'lucide-react';
import PlushCompanion from './PlushCompanion';

type Props = {
  opened: boolean;
  className?: string;
  showCompanion?: boolean;
};

/**
 * A single, recognisable paper envelope with a hinged flap and a note that
 * slides out. CSS perspective keeps it dimensional without low-poly WebGL
 * artifacts or relying on GPU support.
 */
export default function LetterOpeningEnvelope({ opened, className = '', showCompanion = true }: Props) {
  return (
    <div className={`stl-iver-envelope-stage ${className}`}>
      <div
      className="stl-real-envelope-scene"
      data-opened={opened ? 'true' : 'false'}
      role="img"
      aria-label={opened ? 'The envelope is open and a letter is emerging' : 'A sealed paper envelope waiting to be opened'}
    >
      <div className="stl-real-envelope-light" aria-hidden="true" />
      <div className="stl-real-envelope-shadow" aria-hidden="true" />
      <div className="stl-real-envelope" aria-hidden="true">
        <div className="stl-real-envelope-back" />
        <div className="stl-real-envelope-flap" />
        <div className="stl-real-envelope-paper">
          <div className="stl-real-envelope-paper-mark">a note for you</div>
          <div className="stl-real-envelope-paper-title">Dear you,</div>
          <span className="stl-real-envelope-paper-signature">with care,</span>
        </div>
        <div className="stl-real-envelope-fold stl-real-envelope-fold-left" />
        <div className="stl-real-envelope-fold stl-real-envelope-fold-right" />
        <div className="stl-real-envelope-fold stl-real-envelope-fold-bottom" />
        <div className="stl-real-envelope-edge" />
        <div className="stl-real-envelope-seal"><Heart size={17} strokeWidth={1.8} /></div>
      </div>
      </div>
      {showCompanion && <PlushCompanion name="iver" size="envelope" className="stl-envelope-iver" />}
    </div>
  );
}
