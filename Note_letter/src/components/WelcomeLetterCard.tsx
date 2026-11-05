import Mascot from './Mascot';

type Props = {
  message: string;
  className?: string;
};

/** Decorative editorial paper card for authentication pages: no GPU or giant 3D canvas. */
export default function WelcomeLetterCard({ message, className = '' }: Props) {
  return (
    <div className={`relative z-10 w-full max-w-sm rounded-[1.75rem] border border-[#dfd1be] bg-[#fffaf2] p-6 text-[#30483b] shadow-[0_20px_45px_-28px_rgba(31,39,31,.45)] ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#a16f54]">A note for you</span>
        <Mascot name="lumi" className="h-14 w-14" />
      </div>
      <p className="mt-1 font-editorial text-2xl italic leading-snug">Dear you,</p>
      <p className="mt-5 max-w-xs font-editorial text-xl leading-snug">{message}</p>
      <div className="mt-7 border-t border-[#eadcc8] pt-4 text-xs font-medium text-[#8b7965]">With care, SendTheLetter ♡</div>
    </div>
  );
}
