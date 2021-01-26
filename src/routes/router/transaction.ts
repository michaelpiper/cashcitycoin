import express from "express";
import TransactionController from "../../libs/controller/transaction.controller";
const router = express.Router();
router.post("",TransactionController.transfer);
router.get("",TransactionController.transactions);
router.get("/:id",TransactionController.transaction);
export default router;