import { Op } from 'sequelize';
import UserBlock from '../models/UserBlock';

/** Blocking is reciprocal for new interactions, without disclosing who blocked whom. */
export async function isBlockedBetween(first: number, second: number): Promise<boolean> {
    if (first === second) return false;
    const block = await UserBlock.findOne({
        where: { [Op.or]: [
            { blockerId: first, blockedId: second },
            { blockerId: second, blockedId: first },
        ] },
        attributes: ['id'],
    });
    return Boolean(block);
}
