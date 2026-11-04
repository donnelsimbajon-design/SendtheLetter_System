/** Temporary, explicitly client-side first-letter preview.
 * Do not put guest writing in URL params, analytics, or localStorage.
 * Browser storage is best-effort and not encrypted or a server-side backup.
 */
export const GUEST_LETTER_KEY = 'sendtheletter:guest-letter:v1';
export const GUEST_LETTER_RETURN_TO = '/dashboard/notes?compose=1&guest=1';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const guestPrompts = [
  { id: 'gratitude', label: 'Say thank you', title: 'Thank you for being you', category: 'Gratitude', content: 'I wanted to take a moment to thank you for…\n\nOne thing I appreciate about you is…' },
  { id: 'future-self', label: 'Future me', title: 'Dear future me', category: 'Reflection', content: 'Dear future me,\n\nI hope you remember…' },
  { id: 'apology', label: 'An apology', title: 'Something I need to say', category: 'Apology', content: 'I have been thinking about…\n\nWhat I want to say is…' },
  { id: 'hello', label: 'Just say hello', title: 'You crossed my mind', category: 'Friendship', content: 'I thought of you today and wanted to say…' },
] as const;

export type GuestLetterDraft = {
  title: string;
  recipientName: string;
  content: string;
  category: string;
  template: string;
  updatedAt: number;
};

export function newGuestLetter(template = ''): GuestLetterDraft {
  const prompt = guestPrompts.find(p => p.id === template);
  return {
    title: prompt?.title || '',
    recipientName: '',
    content: prompt?.content || '',
    category: prompt?.category || 'Other',
    template: prompt?.id || '',
    updatedAt: Date.now(),
  };
}

export function readGuestLetter(): GuestLetterDraft | null {
  try {
    const raw = window.sessionStorage.getItem(GUEST_LETTER_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' ||
      typeof value.title !== 'string' || value.title.length > 255 ||
      typeof value.content !== 'string' || value.content.length > 12000 ||
      typeof value.recipientName !== 'string' || value.recipientName.length > 100 ||
      typeof value.category !== 'string' || value.category.length > 40 ||
      typeof value.updatedAt !== 'number' ||
      !Number.isFinite(value.updatedAt) ||
      value.updatedAt > Date.now() + 60000 || Date.now() - value.updatedAt > MAX_AGE_MS) {
      window.sessionStorage.removeItem(GUEST_LETTER_KEY);
      return null;
    }
    return {
      title: value.title, content: value.content, recipientName: value.recipientName,
      category: value.category, template: typeof value.template === 'string' ? value.template : '',
      updatedAt: value.updatedAt,
    };
  } catch { return null; }
}

export function storeGuestLetter(value: GuestLetterDraft): boolean {
  if (value.title.length > 255 || value.recipientName.length > 100 || value.content.length > 12000) return false;
  try {
    window.sessionStorage.setItem(GUEST_LETTER_KEY, JSON.stringify({ ...value, updatedAt: Date.now() }));
    return true;
  } catch { return false; }
}

export function clearGuestLetter(): void {
  try { window.sessionStorage.removeItem(GUEST_LETTER_KEY); } catch { /* storage may be blocked */ }
}
