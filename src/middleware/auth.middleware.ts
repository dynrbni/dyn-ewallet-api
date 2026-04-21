import { verifyToken } from "../utils/jwt";
import { prisma } from "../config/database";


export const authMiddleware = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access denied' });
    }
    try {
        const decoded = verifyToken(token);

        const user = await prisma.user.findUnique({
            where: { id: Number(decoded.id) },
            select: { id: true, role: true }
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        req.user = {
            ...decoded,
            id: String(user.id),
            role: user.role
        };
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};
