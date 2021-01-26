import express from "express";
import LedgerController from "../../libs/controller/ledger.controller";
const router = express.Router();
router.get("",LedgerController.getLedgers);
router.get("/:id",LedgerController.getLedger);
export default router;