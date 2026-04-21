import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

interface JwtPayload {
    id: string;
    role: string;
    iat?: number;
    exp?: number;
}
export const generateToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, JWT_SECRET!, { expiresIn: '1h' });
}

export const verifyToken = (token: string): JwtPayload => {
    try {
        return jwt.verify(token, JWT_SECRET!) as JwtPayload;
    } catch (error) {
        throw new Error('Invalid token');
    }
}