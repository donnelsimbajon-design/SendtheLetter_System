import type { CSSProperties } from 'react';

/**
 * Original character portraits rendered from one lightweight WebP sprite.
 * The five slots preserve existing reaction keys and counts.
 */
export type ReactionCharacterKey = 'heart' | 'flower' | 'star' | 'hug' | 'sparkles';

const spritePosition: Record<ReactionCharacterKey, string> = {
    heart: '0%',
    flower: '25%',
    star: '50%',
    hug: '75%',
    sparkles: '100%',
};

type Props = {
    reaction: ReactionCharacterKey;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
};

const sizes = {
    sm: 'h-10 w-10',
    md: 'h-14 w-14',
    lg: 'h-[68px] w-[68px]',
};

export default function ReactionCharacter({ reaction, size = 'lg', className = '' }: Props) {
    const style: CSSProperties = {
        backgroundImage: "url('/reaction-characters.webp')",
        backgroundSize: '500% 100%',
        backgroundPosition: `${spritePosition[reaction]} center`,
        backgroundRepeat: 'no-repeat',
    };

    return (
        <span
            aria-hidden="true"
            className={`inline-block shrink-0 overflow-hidden rounded-full border border-[#f6dfd4] bg-[#f9dfd1] shadow-[0_3px_10px_rgba(151,96,82,0.09)] ${sizes[size]} ${className}`}
            style={style}
        />
    );
}
