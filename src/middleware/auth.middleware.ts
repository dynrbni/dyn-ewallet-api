import { verifyToken } from "../utils/jwt";


export const authMiddleware = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access denied' });
    }
    try {
        const decoded = verifyToken(token);
        req.user = decoded ;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};