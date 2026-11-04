import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import type Letter from '../models/Letter';
import { publicLetterDTO } from './publicLetterDTO';

type CountRow = { letterId: number; count: number };
type LikedRow = { letterId: number };

/** One batch per type instead of 2-3 SQL statements PER public letter.
 * No extra requests on the client and no change to the JSON response shape.
 */
export async function withPublicEngagement(letters: Letter[], userId?: number) {
    if (letters.length === 0) return [];
    const ids = letters.map(letter => letter.id);
    const [likes, comments, mine] = await Promise.all([
        sequelize.query<CountRow>(
            'SELECT "letterId", COUNT(*)::int AS count FROM public.likes WHERE "letterId" IN (:ids) GROUP BY "letterId"',
            { type: QueryTypes.SELECT, replacements: { ids } },
        ),
        sequelize.query<CountRow>(
            'SELECT "letterId", COUNT(*)::int AS count FROM public.comments WHERE "letterId" IN (:ids) GROUP BY "letterId"',
            { type: QueryTypes.SELECT, replacements: { ids } },
        ),
        userId ? sequelize.query<LikedRow>(
            'SELECT "letterId" FROM public.likes WHERE "userId" = :userId AND "letterId" IN (:ids)',
            { type: QueryTypes.SELECT, replacements: { userId, ids } },
        ) : Promise.resolve([] as LikedRow[]),
    ]);
    const byId = (rows: CountRow[]) => new Map(rows.map(row => [Number(row.letterId), Number(row.count)]));
    const likesById = byId(likes);
    const commentsById = byId(comments);
    const likedIds = new Set(mine.map(row => Number(row.letterId)));
    return letters.map(letter => ({
        ...publicLetterDTO(letter.toJSON() as Record<string, any>),
        likeCount: likesById.get(letter.id) ?? 0,
        commentCount: commentsById.get(letter.id) ?? 0,
        isLikedByUser: likedIds.has(letter.id),
    }));
}
