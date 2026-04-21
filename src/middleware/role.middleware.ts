
export const isAdmin = (req: any, res: any, next: any) => {
    console.log('User role:', req.user?.role);
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Admins only' });
    }
};