import express from 'express';
import * as transactionController from '../controllers/transaction.controllers';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/topup', authMiddleware, transactionController.topUpBalance);
router.post('/transfer', authMiddleware, transactionController.transferBalance);
router.get('/history', authMiddleware, transactionController.getMyTransactions);
router.get('/:referenceId', authMiddleware, transactionController.getTransactionByReference);

export default router;
