import { AVATAR_OPTIONS, avatarUrl } from '../constants/avatars';

interface AvatarPickerProps {
  value: string | null;
  onChange: (value: string) => void;
  id?: string;
}

export default function AvatarPicker({ value, onChange, id = 'profile-avatar-options' }: AvatarPickerProps) {
  const selection = AVATAR_OPTIONS.find(({ id: avatarId }) => avatarUrl(avatarId) === value);

  return (
    <fieldset className="space-y-3">
      <legend id={id} className="text-sm font-semibold text-foreground">Choose your anime profile character</legend>
      <p className="text-xs leading-5 text-muted-foreground">
        Pick any character you like. You can change it later from Edit Profile.
      </p>
      <div className="grid grid-cols-5 gap-2 sm:gap-3" aria-labelledby={id}>
        {AVATAR_OPTIONS.map(({ id: avatarId, label }) => {
          const url = avatarUrl(avatarId);
          const selected = value === url;
          return (
            <button
              key={avatarId}
              type="button"
              aria-label={label}
              aria-pressed={selected}
              title={label}
              onClick={() => onChange(url)}
              className={`relative aspect-square overflow-hidden rounded-full border-[3px] bg-[#F2C1B2] p-0.5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary hover:-translate-y-0.5 ${selected ? 'border-primary ring-2 ring-primary/30 shadow-md' : 'border-transparent hover:border-primary/40'}`}
            >
              <img src={url} alt="" className="h-full w-full rounded-full object-cover" loading="lazy" />
              {selected && <span aria-hidden="true" className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">✓</span>}
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {selection ? `Selected: ${selection.label}` : 'No avatar selected yet — you can choose one above.'}
      </p>
    </fieldset>
  );
}
