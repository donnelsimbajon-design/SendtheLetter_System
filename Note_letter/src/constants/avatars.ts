export const AVATAR_OPTIONS = [
  { id: 'female-01', label: 'Female character 1', group: 'Female' },
  { id: 'female-02', label: 'Female character 2', group: 'Female' },
  { id: 'female-03', label: 'Female character 3', group: 'Female' },
  { id: 'female-04', label: 'Female character 4', group: 'Female' },
  { id: 'female-05', label: 'Female character 5', group: 'Female' },
  { id: 'male-01', label: 'Male character 1', group: 'Male' },
  { id: 'male-02', label: 'Male character 2', group: 'Male' },
  { id: 'male-03', label: 'Male character 3', group: 'Male' },
  { id: 'male-04', label: 'Male character 4', group: 'Male' },
  { id: 'male-05', label: 'Male character 5', group: 'Male' },
] as const;

export type AvatarId = typeof AVATAR_OPTIONS[number]['id'];

export const avatarUrl = (id: AvatarId): string => `/avatars/sprite.svg#${id}`;

// Only recognized artwork paths can be saved as preset avatars.
// Users may continue to upload their own profile photographs.
export const isPresetAvatar = (value: string | null | undefined): boolean =>
  Boolean(value && /^\/avatars\/sprite\.svg#(?:female|male)-0[1-5]$/.test(value));
