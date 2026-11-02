import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

/**
 * Only public profile avatar/cover assets belong in this public bucket.
 * NEVER use it for private letters, drafts, or time capsules.
 * Supabase secret key must only exist on the API server.
 */
export function detectImage(file: Express.Multer.File): { extension: string; mime: string } {
    const b = file.buffer;
    if (!b || b.length < 12 || b.length > 5 * 1024 * 1024) throw new Error('Invalid image size.');
    const png = b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    const gif = b.subarray(0, 6).toString('ascii') === 'GIF87a' || b.subarray(0, 6).toString('ascii') === 'GIF89a';
    const webp = b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP';
    const kind = png ? { extension: 'png', mime: 'image/png' } : jpg ? { extension: 'jpg', mime: 'image/jpeg' } : gif ? { extension: 'gif', mime: 'image/gif' } : webp ? { extension: 'webp', mime: 'image/webp' } : null;
    if (!kind || kind.mime !== file.mimetype) throw new Error('Invalid image contents. Upload a real JPG, PNG, WebP or GIF.');
    return kind;
}

/**
 * New Supabase sb_secret_* API keys are not JWTs and must be sent as apikey only.
 * Legacy service_role JWT keys also require Authorization: Bearer.
 * Never use a publishable/anon client key for privileged server uploads.
 */
export function buildProfileUploadHeaders(secretKey: string, mime: string): Record<string, string> {
    if (secretKey.startsWith('sb_publishable_')) {
        throw new Error('Supabase publishable keys cannot authorize server-side profile uploads.');
    }
    const headers: Record<string, string> = {
        apikey: secretKey,
        'Content-Type': mime,
        'Cache-Control': 'max-age=3600',
        'x-upsert': 'false',
    };
    if (!secretKey.startsWith('sb_secret_')) {
        headers.Authorization = `Bearer ${secretKey}`;
    }
    return headers;
}

export async function saveProfileImage(file: Express.Multer.File, userId: number, type: 'avatar' | 'cover'): Promise<string> {
    const kind = detectImage(file);
    const name = `${type}-${randomUUID()}.${kind.extension}`;
    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

    if (supabaseUrl && secretKey) {
        const objectPath = `profiles/${userId}/${name}`;
        const response = await fetch(`${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath}`, {
            method: 'POST',
            headers: buildProfileUploadHeaders(secretKey, kind.mime),
            body: new Uint8Array(file.buffer),
            signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) throw new Error(`Object storage upload failed (${response.status}).`);
        return `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${objectPath}`;
    }

    // Compatible local dev fallback. Production must configure both Supabase values
    // to ensure uploaded pictures survive ephemeral hosting instances.
    const directory = path.resolve(process.cwd(), 'uploads');
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, name), file.buffer, { flag: 'wx' });
    return `/uploads/${name}`;
}
