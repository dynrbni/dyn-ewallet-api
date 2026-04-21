import { Request, Response } from 'express';
import * as transactionService from '../services/transaction.services';

type AuthenticatedRequest = Request & {
    user?: {
        id: string;
        role: string;
    };
};

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
    if (error instanceof Error) {
        return error.message;
    }
    return fallbackMessage;
};

const getStatusCodeFromMessage = (message: string) => {
    const normalizedMessage = message.toLowerCase();
    if (normalizedMessage.includes('unauthorized') || normalizedMessage.includes('access denied')) {
        return 401;
    }
    if (normalizedMessage.includes('forbidden')) {
        return 403;
    }
    if (normalizedMessage.includes('not found')) {
        return 404;
    }
    return 400;
};

const getAuthenticatedUserId = (req: AuthenticatedRequest) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new Error('Unauthorized');
    }
    return userId;
};

export const topUpBalance = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const { amount } = req.body;
        const transaction = await transactionService.topUpBalance(userId, amount);
        res.status(200).json({ msg: 'Top up successful', transaction });
    } catch (error: unknown) {
        const message = getErrorMessage(error, 'Error top up balance');
        res.status(getStatusCodeFromMessage(message)).json({ message });
    }
};

export const transferBalance = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const { receiverUserId, toUserId, amount } = req.body;
        const destinationUserId = receiverUserId ?? toUserId;

        if (destinationUserId === undefined) {
            return res.status(400).json({ message: 'receiverUserId is required' });
        }

        const transaction = await transactionService.transferBalance(
            userId,
            String(destinationUserId),
            amount
        );

        res.status(200).json({ msg: 'Transfer successful', transaction });
    } catch (error: unknown) {
        const message = getErrorMessage(error, 'Error transfer balance');
        res.status(getStatusCodeFromMessage(message)).json({ message });
    }
};

export const getMyTransactions = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const transactions = await transactionService.getMyTransactions(userId);
        res.status(200).json(transactions);
    } catch (error: unknown) {
        const message = getErrorMessage(error, 'Error fetching transactions');
        res.status(getStatusCodeFromMessage(message)).json({ message });
    }
};

export const getTransactionByReference = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const { referenceId } = req.params;
        const transaction = await transactionService.getTransactionByReference(
            userId,
            String(referenceId)
        );
        res.status(200).json(transaction);
    } catch (error: unknown) {
        const message = getErrorMessage(error, 'Error fetching transaction');
        res.status(getStatusCodeFromMessage(message)).json({ message });
    }
};
