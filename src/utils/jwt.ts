import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface JwtPayload {
    id: string;
    role: string;
    iat?: number;
    exp?: number;
}
export const generateToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

export const verifyToken = (token: string): JwtPayload => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (typeof decoded === 'string') {
            throw new Error('Invalid token payload');
        }
        return decoded as JwtPayload;
    } catch (error) {
        throw new Error('Invalid token');
    }
}
