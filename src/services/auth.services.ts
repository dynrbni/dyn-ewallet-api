import bcrypt from 'bcrypt';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../config/database';
import { generateToken } from '../utils/jwt';

type UserWithWalletBalance = Prisma.UserGetPayload<{
    include: {
        wallet: {
            select: {
                balance: true;
            };
        };
    };
}>;

type UpdateUserPayload = {
    name?: string;
    email?: string;
    password?: string;
    newPassword?: string;
    role?: string;
};

const parseUserId = (id: string): number => {
    const userId = Number(id);
    if (!Number.isInteger(userId) || userId <= 0) {
        throw new Error('Invalid user id');
    }
    return userId;
};

const normalizeRole = (role: string): Role => {
    const normalizedRole = role.toUpperCase();
    if (normalizedRole === Role.USER) {
        return Role.USER;
    }
    if (normalizedRole === Role.ADMIN) {
        return Role.ADMIN;
    }
    throw new Error('Invalid role value');
};

const serializeUser = (user: UserWithWalletBalance) => {
    const { password: _password, ...safeUser } = user;

    return {
        ...safeUser,
        wallet: user.wallet
            ? {
                ...user.wallet,
                balance: user.wallet.balance.toString()
            }
            : null
    };
};

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
    console.log(user);
    return generateToken({
        id: String(user.id),
        role: String(user.role)
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
    console.log(user);
    return generateToken({
        id: String(user.id),
        role: String(user.role)
    });
}

export const getAllUsers = async () => {
    const users = await prisma.user.findMany({
        include: {
            wallet: {
                select: {
                    balance: true
                }
            }
        }
    });

    return users.map(serializeUser);
}

export const getUserById = async (id: string) => {
    const userId = parseUserId(id);
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            wallet: {
                select: {
                    balance: true
                }
            }
        }
    });

    if (!user) {
        throw new Error('User not found');
    }

    return serializeUser(user);
}

export const updateUser = async (id: string, payload: UpdateUserPayload) => {
    const userId = parseUserId(id);
    const { name, email, password, newPassword, role } = payload;
    const passwordCandidate = newPassword ?? password;
    const updateData: Prisma.UserUpdateInput = {};

    if (name !== undefined) {
        updateData.name = name;
    }
    if (email !== undefined) {
        updateData.email = email;
    }
    if (passwordCandidate !== undefined) {
        const normalizedPassword = passwordCandidate.trim();
        if (!normalizedPassword) {
            throw new Error('Password cannot be empty');
        }
        updateData.password = await bcrypt.hash(normalizedPassword, 10);
    }
    if (role !== undefined) {
        updateData.role = normalizeRole(role);
    }

    if (Object.keys(updateData).length === 0) {
        throw new Error('No valid fields to update');
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
            wallet: {
                select: {
                    balance: true
                }
            }
        }
    });

    if (passwordCandidate !== undefined) {
        const normalizedPassword = passwordCandidate.trim();
        const isUpdatedPasswordValid = await bcrypt.compare(normalizedPassword, updatedUser.password);
        if (!isUpdatedPasswordValid) {
            throw new Error('Failed to update password');
        }
    }

    return serializeUser(updatedUser);
};

export const deleteUser = async (id: string) => {
    const userId = parseUserId(id);

    return prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                wallet: {
                    select: { id: true }
                }
            }
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (user.wallet) {
            await tx.transaction.updateMany({
                where: { senderWalletId: user.wallet.id },
                data: { senderWalletId: null }
            });

            await tx.transaction.updateMany({
                where: { receiverWalletId: user.wallet.id },
                data: { receiverWalletId: null }
            });

            await tx.wallet.delete({
                where: { id: user.wallet.id }
            });
        }

        return tx.user.delete({
            where: { id: userId }
        });
    });
}
