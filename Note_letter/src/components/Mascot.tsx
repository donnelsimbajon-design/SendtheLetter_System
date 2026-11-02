export type MascotName = 'lumi' | 'tala' | 'sely' | 'piko' | 'nori' | 'chika' | 'susi' | 'basa' | 'suri' | 'araw';

const mascotDescriptions: Record<MascotName, string> = {
  lumi: 'Lumi, the friendly letter mascot',
  tala: 'Tala, the reminder star mascot',
  sely: 'Sely, the heart-shaped letter seal mascot',
  piko: 'Piko, the paper-plane message mascot',
  nori: 'Nori, the cheerful notification bell',
  chika: 'Chika, the friendly chat bubble',
  susi: 'Susi, the safe and smiling privacy lock',
  basa: 'Basa, the happy reading book',
  suri: 'Suri, the curious magnifying glass',
  araw: 'Araw, the joyful reminder calendar',
};

interface MascotProps {
  name: MascotName;
  className?: string;
  /**
   * By default mascots are decorative, so screen readers do not hear
   * repeated character descriptions. Supply alt for meaningful images.
   */
  alt?: string;
  loading?: 'eager' | 'lazy';
}

/** Reusable, locally hosted mascots. No tracking or external image request. */
export default function Mascot({ name, className = '', alt, loading = 'lazy' }: MascotProps) {
  const description = alt ?? '';
  return (
    <img
      src={`/mascots/${name}.svg`}
      alt={description}
      aria-hidden={alt === undefined ? true : undefined}
      className={`block shrink-0 object-contain ${className}`}
      width={500}
      height={500}
      loading={loading}
      decoding="async"
      draggable={false}
      title={alt ? mascotDescriptions[name] : undefined}
    />
  );
}
