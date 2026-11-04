import type { ReactNode } from 'react';

/**
 * Original, single-stroke navigation art for the compact SendTheLetter rail.
 * Intentionally not from an external icon library or Instagram asset.
 * The app's existing colorful mascots remain available everywhere else.
 */
export type RailSymbol = 'brand' | 'home' | 'library' | 'community' | 'messages' | 'search' | 'activity' | 'write' | 'menu' | 'admin' | 'profile';

export default function WorkspaceRailIcon({ name, size = 27, active = false }: {
  name: RailSymbol;
  size?: number;
  active?: boolean;
}) {
  let drawing: ReactNode;

  switch (name) {
    case 'brand':
      drawing = <>
        <rect x="3.1" y="6.5" width="17.8" height="13.8" rx="3" />
        <path d="m4.7 9.1 7.3 5.5 7.3-5.5M4.6 18.4l5.4-5m9.4 5-5.3-5" />
        <path d="M11.9 3.9c.6-.8 1.7-.7 2.1.2.4-.9 1.5-1 2.1-.2.8 1-.3 2.2-2.1 3.2-1.8-1-2.9-2.2-2.1-3.2Z" fill="currentColor" stroke="none" />
      </>;
      break;
    case 'home':
      drawing = <>
        <path d="m3.5 10 8.5-7 8.5 7v9a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2v-9Z" />
        <path d="M9 21v-8h6v8" />
      </>;
      break;
    case 'library':
      drawing = <>
        <path d="M12 6.5c-2.4-2.2-5.8-2.7-9-2.3v14.6c3.2-.4 6.6.1 9 2.2 2.4-2.1 5.8-2.6 9-2.2V4.2c-3.2-.4-6.6.1-9 2.3Z" />
        <path d="M12 6.5V21" />
      </>;
      break;
    case 'community':
      drawing = <>
        <path d="M21 3 3 11l7.6 2.5L13.1 21 21 3Z" />
        <path d="m10.6 13.5 6.7-6.7" />
      </>;
      break;
    case 'messages':
      drawing = <>
        <path d="M4 5.5C4 4.1 5.1 3 6.7 3h10.6c1.6 0 2.7 1.1 2.7 2.5v10.2c0 1.6-1.1 2.5-2.7 2.5h-6.5L5 22v-3.8c-.7-.4-1-1.3-1-2.5Z" />
        <path d="M8 9h8M8 13h5.5" />
      </>;
      break;
    case 'search':
      drawing = <>
        <circle cx="10.4" cy="10.4" r="7.1" />
        <path d="m15.6 15.6 5.3 5.3" />
      </>;
      break;
    case 'activity':
      drawing = <path d="M20.5 7.2c0 4.7-8.5 11.1-8.5 11.1S3.5 11.9 3.5 7.2c0-5.1 6.1-6.1 8.5-2.2 2.4-3.9 8.5-2.9 8.5 2.2Z" />;
      break;
    case 'write':
      drawing = <path d="M12 3v18M3 12h18" />;
      break;
    case 'menu':
      drawing = <path d="M3 5h18M3 12h18M3 19h18" />;
      break;
    case 'admin':
      drawing = <>
        <rect x="3" y="3" width="7" height="7" rx="1.4" />
        <rect x="14" y="3" width="7" height="7" rx="1.4" />
        <rect x="3" y="14" width="7" height="7" rx="1.4" />
        <rect x="14" y="14" width="7" height="7" rx="1.4" />
      </>;
      break;
    case 'profile':
      drawing = <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>;
      break;
  }

  return (
    <svg aria-hidden="true" role="presentation" focusable="false"
      className="shrink-0" width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2.35 : 1.95}
      strokeLinecap="round" strokeLinejoin="round">
      {drawing}
    </svg>
  );
}
