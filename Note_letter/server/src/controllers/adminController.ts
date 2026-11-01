import { Request, Response } from 'express';
import { Op } from 'sequelize';
import User from '../models/User';
import Letter from '../models/Letter';

interface AdminRequest extends Request { user?: { id: number; role: 'user' | 'admin' }; }
const pageOptions = (req: Request) => {
  const page = Math.max(1, Math.min(1000, Number.parseInt(String(req.query.page || '1'), 10) || 1));
  const limit = Math.max(1, Math.min(100, Number.parseInt(String(req.query.limit || '25'), 10) || 25));
  return { page, limit, offset: (page - 1) * limit };
};

export const getOverview = async (_req: Request, res: Response) => {
  try {
    const [users, activeUsers, letters, publicLetters, drafts] = await Promise.all([
      User.count(), User.count({ where: { isActive: true } }), Letter.count(),
      Letter.count({ where: { isPublic: true, status: 'published', isArchived: false } }),
      Letter.count({ where: { status: 'draft' } }),
    ]);
    return res.json({ users, activeUsers, suspendedUsers: users - activeUsers, letters, publicLetters, drafts });
  } catch (error) { console.error('Admin overview failed:', error); return res.status(500).json({ message: 'Unable to load the admin overview.' }); }
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const { page, limit, offset } = pageOptions(req);
    const search = String(req.query.search || '').trim().slice(0, 100);
    const where = search ? { [Op.or]: [{ username: { [Op.iLike]: '%' + search + '%' } }, { email: { [Op.iLike]: '%' + search + '%' } }] } : {};
    const result = await User.findAndCountAll({ where, attributes: ['id', 'username', 'email', 'role', 'isActive', 'createdAt'], order: [['createdAt', 'DESC']], limit, offset });
    return res.json({ items: result.rows, total: result.count, page, limit });
  } catch (error) { console.error('Admin user listing failed:', error); return res.status(500).json({ message: 'Unable to load users.' }); }
};

export const listLetters = async (req: Request, res: Response) => {
  try {
    const { page, limit, offset } = pageOptions(req);
    const search = String(req.query.search || '').trim().slice(0, 100);
    const where = search ? { title: { [Op.iLike]: '%' + search + '%' } } : {};
    const result = await Letter.findAndCountAll({
      where, attributes: ['id', 'userId', 'title', 'status', 'isPublic', 'isArchived', 'createdAt'],
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email'] }],
      order: [['createdAt', 'DESC']], limit, offset, distinct: true,
    });
    return res.json({ items: result.rows, total: result.count, page, limit });
  } catch (error) { console.error('Admin letter listing failed:', error); return res.status(500).json({ message: 'Unable to load letters.' }); }
};

export const updateUser = async (req: AdminRequest, res: Response) => {
  try {
    const userId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(userId) || userId < 1) return res.status(400).json({ message: 'Invalid user ID.' });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const { role, isActive } = req.body as { role?: unknown; isActive?: unknown };
    if (role === undefined && isActive === undefined) return res.status(400).json({ message: 'Provide a role or account status to update.' });
    if (role !== undefined && role !== 'user' && role !== 'admin') return res.status(400).json({ message: 'Role must be user or admin.' });
    if (isActive !== undefined && typeof isActive !== 'boolean') return res.status(400).json({ message: 'isActive must be a boolean.' });
    if (req.user?.id === userId && (role === 'user' || isActive === false)) return res.status(400).json({ message: 'You cannot remove your own admin access or suspend your own account.' });
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    await user.save();
    if (isActive === false) {
      const io = req.app.get('io');
      io?.in('user_' + user.id).disconnectSockets(true);
    }
    return res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role, isActive: user.isActive } });
  } catch (error) { console.error('Admin user update failed:', error); return res.status(500).json({ message: 'Unable to update this user.' }); }
};

export const moderateLetter = async (req: Request, res: Response) => {
  try {
    const letterId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(letterId) || letterId < 1) return res.status(400).json({ message: 'Invalid letter ID.' });
    const letter = await Letter.findByPk(letterId);
    if (!letter) return res.status(404).json({ message: 'Letter not found.' });
    letter.isPublic = false; letter.isArchived = true; letter.status = 'removed';
    await letter.save();
    return res.json({ message: 'Letter removed from public view.' });
  } catch (error) { console.error('Admin letter moderation failed:', error); return res.status(500).json({ message: 'Unable to moderate this letter.' }); }
};