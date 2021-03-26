import express from "express";
import MiningController from "../../libs/controller/mining.controller";
const router = express.Router();
router.get("",MiningController.getPendingTransaction);
router.get("/all",MiningController.getPendingTransactions);
router.post("",MiningController.verifyTransaction)
router.get("/nonce",MiningController.nonce)
router.get("/previous_hash",MiningController.previousHash);
export default router;