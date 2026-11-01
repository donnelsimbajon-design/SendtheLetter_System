import { Op } from 'sequelize';
import { Server } from 'socket.io';
import sequelize from '../config/database';
import Letter from '../models/Letter';
import Notification from '../models/Notification';

/**
 * Releases scheduled letters and future-self capsules.
 * Row locks and a status re-check ensure only one API instance releases a letter.
 */
export const startScheduledLetterWorker = (io: Server) => {
    let isRunning = false;

    const processDueLetters = async () => {
        if (isRunning) return;
        isRunning = true;
        try {
            const now = new Date();
            const dueLetters = await Letter.findAll({
                where: {
                    status: 'scheduled',
                    [Op.or]: [
                        { isTimeCapsule: true, openDate: { [Op.lte]: now } },
                        { isTimeCapsule: false, scheduledDate: { [Op.lte]: now } },
                    ],
                },
                order: [['updatedAt', 'ASC']],
                limit: 50,
            });

            for (const candidate of dueLetters) {
                try {
                    const notification = await sequelize.transaction(async (transaction) => {
                        const letter = await Letter.findByPk(candidate.id, {
                            transaction,
                            lock: transaction.LOCK.UPDATE,
                        });
                        if (!letter || letter.status !== 'scheduled') return null;

                        const releaseAt = letter.isTimeCapsule ? letter.openDate : letter.scheduledDate;
                        if (!releaseAt || releaseAt.getTime() > Date.now()) return null;

                        await letter.update({ status: 'published' }, { transaction });
                        return Notification.create({
                            userId: letter.userId,
                            actorId: letter.userId,
                            type: letter.isTimeCapsule ? 'time_capsule_opened' : 'scheduled_letter_published',
                            entityId: letter.id,
                        }, { transaction });
                    });

                    if (notification) {
                        io.to(`user_${candidate.userId}`).emit('new_notification', notification.toJSON());
                    }
                } catch (error) {
                    console.error('Scheduled letter release failed for record:', candidate.id, error);
                }
            }
        } catch (error) {
            console.error('Scheduled letter worker failed:', error);
        } finally {
            isRunning = false;
        }
    };

    void processDueLetters();
    const timer = setInterval(() => { void processDueLetters(); }, 60_000);
    return () => clearInterval(timer);
};
