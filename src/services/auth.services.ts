import bcrypt from 'bcrypt';
import { prisma } from '../config/database';
import { generateToken } from '../utils/jwt';

export const register = async ({ name, email, password }:
     { name: string; email: string; password: string }) => {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error('Email already in use');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            wallet: {
                create: {}
             }
        }
    });
    return generateToken({
        id: String(user.id),
        role: user.role
    });
}

export const login = async ({ email, password }: { email: string; password: string }) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error('Invalid email or password');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Invalid email or password');
    }
    return generateToken({
        id: String(user.id),
        role: user.role
    });
}

export const getAllUsers = async () => {
  return prisma.user.findMany({
    include: {
      wallet: true
    }
  })
}

export const deleteUser = async (id: string) => {
  return prisma.user.delete({
    where: { id: Number(id) }
  })
}