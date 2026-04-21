import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { prisma } from '../config/database';

const transactionInclude = {
    logs: true,
    senderWallet: {
        select: {
            id: true,
            userId: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    },
    receiverWallet: {
        select: {
            id: true,
            userId: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    }
} satisfies Prisma.TransactionInclude;

type TransactionWithRelations = Prisma.TransactionGetPayload<{
    include: typeof transactionInclude;
}>;

const parseUserId = (userId: string): number => {
    const parsedUserId = Number(userId);
    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
        throw new Error('Invalid user id');
    }
    return parsedUserId;
};

const parseAmount = (amount: unknown): bigint => {
    if (typeof amount === 'number') {
        if (!Number.isInteger(amount) || amount <= 0) {
            throw new Error('Amount must be a positive integer');
        }
        return BigInt(amount);
    }

    if (typeof amount === 'bigint') {
        if (amount <= BigInt(0)) {
            throw new Error('Amount must be a positive integer');
        }
        return amount;
    }

    if (typeof amount === 'string') {
        const normalizedAmount = amount.trim();
        if (!/^\d+$/.test(normalizedAmount)) {
            throw new Error('Amount must be a positive integer');
        }

        const parsedAmount = BigInt(normalizedAmount);
        if (parsedAmount <= BigInt(0)) {
            throw new Error('Amount must be a positive integer');
        }

        return parsedAmount;
    }

    throw new Error('Amount must be a positive integer');
};

const createReferenceId = (prefix: 'TP' | 'TR'): string => {
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}-${Date.now()}-${randomPart}`;
};

const serializeTransaction = (transaction: TransactionWithRelations) => ({
    ...transaction,
    amount: transaction.amount.toString()
});

export const topUpBalance = async (userId: string, rawAmount: unknown) => {
    const parsedUserId = parseUserId(userId);
    const amount = parseAmount(rawAmount);

    return prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({
            where: { userId: parsedUserId },
            select: { id: true }
        });

        if (!wallet) {
            throw new Error('Wallet not found');
        }

        await tx.wallet.update({
            where: { id: wallet.id },
            data: {
                balance: {
                    increment: amount
                }
            }
        });

        const transaction = await tx.transaction.create({
            data: {
                referenceId: createReferenceId('TP'),
                type: TransactionType.TOPUP,
                amount,
                status: TransactionStatus.SUCCESS,
                receiverWalletId: wallet.id
            }
        });

        await tx.transactionLog.create({
            data: {
                transactionId: transaction.id,
                message: `Top up amount ${amount.toString()}`
            }
        });

        const createdTransaction = await tx.transaction.findUnique({
            where: { id: transaction.id },
            include: transactionInclude
        });

        if (!createdTransaction) {
            throw new Error('Failed to create top up transaction');
        }

        return serializeTransaction(createdTransaction);
    });
};

export const transferBalance = async (
    senderUserId: string,
    receiverUserId: string,
    rawAmount: unknown
) => {
    const parsedSenderUserId = parseUserId(senderUserId);
    const parsedReceiverUserId = parseUserId(receiverUserId);
    const amount = parseAmount(rawAmount);

    if (parsedSenderUserId === parsedReceiverUserId) {
        throw new Error('Cannot transfer to the same account');
    }

    return prisma.$transaction(async (tx) => {
        const senderWallet = await tx.wallet.findUnique({
            where: { userId: parsedSenderUserId },
            select: { id: true, balance: true }
        });

        if (!senderWallet) {
            throw new Error('Sender wallet not found');
        }

        const receiverWallet = await tx.wallet.findUnique({
            where: { userId: parsedReceiverUserId },
            select: { id: true }
        });

        if (!receiverWallet) {
            throw new Error('Receiver wallet not found');
        }

        if (senderWallet.balance < amount) {
            throw new Error('Insufficient balance');
        }

        await tx.wallet.update({
            where: { id: senderWallet.id },
            data: {
                balance: {
                    decrement: amount
                }
            }
        });

        await tx.wallet.update({
            where: { id: receiverWallet.id },
            data: {
                balance: {
                    increment: amount
                }
            }
        });

        const transaction = await tx.transaction.create({
            data: {
                referenceId: createReferenceId('TR'),
                type: TransactionType.TRANSFER,
                amount,
                status: TransactionStatus.SUCCESS,
                senderWalletId: senderWallet.id,
                receiverWalletId: receiverWallet.id
            }
        });

        await tx.transactionLog.createMany({
            data: [
                {
                    transactionId: transaction.id,
                    message: `Transfer amount ${amount.toString()} initiated`
                },
                {
                    transactionId: transaction.id,
                    message: 'Transfer completed successfully'
                }
            ]
        });

        const createdTransaction = await tx.transaction.findUnique({
            where: { id: transaction.id },
            include: transactionInclude
        });

        if (!createdTransaction) {
            throw new Error('Failed to create transfer transaction');
        }

        return serializeTransaction(createdTransaction);
    });
};

export const getMyTransactions = async (userId: string) => {
    const parsedUserId = parseUserId(userId);

    const wallet = await prisma.wallet.findUnique({
        where: { userId: parsedUserId },
        select: { id: true }
    });

    if (!wallet) {
        throw new Error('Wallet not found');
    }

    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [
                { senderWalletId: wallet.id },
                { receiverWalletId: wallet.id }
            ]
        },
        orderBy: {
            createdAt: 'desc'
        },
        include: transactionInclude
    });

    return transactions.map(serializeTransaction);
};

export const getTransactionByReference = async (userId: string, referenceId: string) => {
    const parsedUserId = parseUserId(userId);
    const normalizedReferenceId = referenceId.trim();

    if (!normalizedReferenceId) {
        throw new Error('Reference id is required');
    }

    const transaction = await prisma.transaction.findUnique({
        where: { referenceId: normalizedReferenceId },
        include: transactionInclude
    });

    if (!transaction) {
        throw new Error('Transaction not found');
    }

    const hasAccess =
        transaction.senderWallet?.userId === parsedUserId ||
        transaction.receiverWallet?.userId === parsedUserId;

    if (!hasAccess) {
        throw new Error('Forbidden access to transaction');
    }

    return serializeTransaction(transaction);
};
