import Mascot, { type MascotName } from './Mascot';

/**
 * Shared storybook character replacement for decorative app icons.
 * Keep directional, security-critical, and precise tool-action icons as
 * ordinary controls for recognizability and accessibility.
 */
export type CharacterTone = 'forest' | 'sage' | 'rose' | 'gold' | 'paper';
export type CharacterSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface CharacterBadgeProps {
  name: MascotName;
  size?: CharacterSize;
  tone?: CharacterTone;
  className?: string;
}

const sizes: Record<CharacterSize, string> = {
  xs: 'h-7 w-7 rounded-lg',
  sm: 'h-9 w-9 rounded-xl',
  md: 'h-12 w-12 rounded-2xl',
  lg: 'h-16 w-16 rounded-[1.35rem]',
  xl: 'h-20 w-20 rounded-[1.6rem]',
};

const tones: Record<CharacterTone, string> = {
  forest: 'bg-[#36594e] ring-[#26463c]/20',
  sage: 'bg-[hsl(var(--surface-sage))] ring-[#6c8979]/20',
  rose: 'bg-[hsl(var(--surface-rose))] ring-[#a46c76]/20',
  gold: 'bg-[hsl(var(--surface-gold))] ring-[#ad9559]/20',
  paper: 'bg-[#f9f4eb] ring-[#d5c8b8]/30',
};

export default function CharacterBadge({
  name,
  size = 'md',
  tone = 'sage',
  className = '',
}: CharacterBadgeProps) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden ring-1 shadow-[0_2px_8px_rgba(38,59,53,.08)] ${sizes[size]} ${tones[tone]} ${className}`}
    >
      <span className="pointer-events-none absolute left-[14%] top-[12%] h-1 w-1 rounded-full bg-white/60" />
      <span className="pointer-events-none absolute right-[12%] top-[20%] h-1 w-1 rotate-45 bg-white/50" />
      <Mascot name={name} className="relative z-10 h-[108%] w-[108%] max-w-none drop-shadow-sm" />
    </span>
  );
}
